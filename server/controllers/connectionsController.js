const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../services/notificationService');
const { emitToUser } = require('../utils/realtime');
const { getPagination, paginationMeta } = require('../utils/pagination');

const PUBLIC_FIELDS =
  'name profileImage location category bio skills interests preferences availability experienceLevel startupGoals workingPreferences socialLinks profileViews onboardingCompleted createdAt';

function participantKey(a, b) {
  return [a.toString(), b.toString()].sort().join(':');
}

async function emitConnectionUpdate(io, userIds, payload) {
  if (!io) return;
  userIds.forEach((userId) => emitToUser(io, userId, 'connection:update', payload));
}

const requestConnection = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const io = req.app.get('io');

  if (receiverId === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot connect with yourself');
  }

  const receiver = await User.findOne({
    _id: receiverId,
    isActive: true,
    onboardingCompleted: true,
  });
  if (!receiver) throw new ApiError(404, 'Founder not found');

  let connection = await Connection.findOne({
    $or: [
      { senderId: req.user._id, receiverId },
      { senderId: receiverId, receiverId: req.user._id },
    ],
  });

  let autoAccepted = false;

  if (connection) {
    if (connection.status === 'accepted') {
      throw new ApiError(409, 'You are already connected with this founder');
    }
    if (connection.status === 'pending') {
      if (connection.senderId.equals(req.user._id)) {
        throw new ApiError(409, 'You already have a pending request with this founder');
      }
      connection.status = 'accepted';
      await connection.save();
      autoAccepted = true;
    } else {
      // A previously rejected request can be retried.
      connection.senderId = req.user._id;
      connection.receiverId = receiver._id;
      connection.status = 'pending';
      await connection.save();
    }
  } else {
    connection = await Connection.create({
      senderId: req.user._id,
      receiverId,
      status: 'pending',
    });
  }

  const populated = await Connection.findById(connection._id).populate(
    'senderId receiverId',
    PUBLIC_FIELDS
  );

  if (autoAccepted) {
    await createNotification(io, {
      userId: receiver._id,
      type: 'connection_accepted',
      message: `${req.user.name} accepted your connection request`,
      relatedUserId: req.user._id,
      link: '/connections',
    });
    await createNotification(io, {
      userId: req.user._id,
      type: 'connection_accepted',
      message: `You are now connected with ${receiver.name}`,
      relatedUserId: receiver._id,
      link: '/connections',
    });
  } else {
    await createNotification(io, {
      userId: receiver._id,
      type: 'connection_request',
      message: `${req.user.name} wants to connect with you`,
      relatedUserId: req.user._id,
      link: '/connections',
    });
  }

  await emitConnectionUpdate(io, [req.user._id, receiver._id], {
    connectionId: connection._id,
    status: connection.status,
  });

  res.status(201).json({
    success: true,
    message: autoAccepted
      ? `You are now connected with ${receiver.name}`
      : `Connection request sent to ${receiver.name}`,
    data: { connection: populated, autoAccepted },
  });
});

const getConnections = asyncHandler(async (req, res) => {
  const { status = 'all' } = req.query;
  const { page, limit, skip } = getPagination(req.query, { limit: 20 });
  const userId = req.user._id;

  const filter = { $or: [{ senderId: userId }, { receiverId: userId }] };
  if (['pending', 'accepted', 'rejected'].includes(status)) filter.status = status;

  const total = await Connection.countDocuments(filter);
  const connections = await Connection.find(filter)
    .populate('senderId receiverId', PUBLIC_FIELDS)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  const data = connections.map((connection) => {
    const isSender = connection.senderId._id.equals(userId);
    const other = isSender ? connection.receiverId : connection.senderId;
    return {
      _id: connection._id,
      status: connection.status,
      direction: isSender ? 'outgoing' : 'incoming',
      user: other,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  });

  const [accepted, received, sent] = await Promise.all([
    Connection.countDocuments({ status: 'accepted', $or: [{ senderId: userId }, { receiverId: userId }] }),
    Connection.countDocuments({ receiverId: userId, status: 'pending' }),
    Connection.countDocuments({ senderId: userId, status: 'pending' }),
  ]);

  res.json({
    success: true,
    data: {
      connections: data,
      counts: { accepted, received, sent, total: accepted + received + sent },
      meta: paginationMeta(total, page, limit),
    },
  });
});

const acceptConnection = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const connection = await Connection.findById(req.params.id);
  if (!connection) throw new ApiError(404, 'Connection request not found');
  if (!connection.receiverId.equals(req.user._id)) {
    throw new ApiError(403, 'Only the recipient can accept this request');
  }
  if (connection.status !== 'pending') {
    throw new ApiError(400, 'This request has already been handled');
  }

  connection.status = 'accepted';
  await connection.save();

  const sender = await User.findById(connection.senderId);
  await createNotification(io, {
    userId: connection.senderId,
    type: 'connection_accepted',
    message: `${req.user.name} accepted your connection request`,
    relatedUserId: req.user._id,
    link: '/connections',
  });

  await emitConnectionUpdate(io, [connection.senderId, connection.receiverId], {
    connectionId: connection._id,
    status: 'accepted',
  });

  const populated = await Connection.findById(connection._id).populate(
    'senderId receiverId',
    PUBLIC_FIELDS
  );

  res.json({
    success: true,
    message: `You are now connected with ${sender?.name || 'this founder'}`,
    data: { connection: populated },
  });
});

const rejectConnection = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const connection = await Connection.findById(req.params.id);
  if (!connection) throw new ApiError(404, 'Connection request not found');
  if (!connection.receiverId.equals(req.user._id)) {
    throw new ApiError(403, 'Only the recipient can reject this request');
  }
  if (connection.status !== 'pending') {
    throw new ApiError(400, 'This request has already been handled');
  }

  connection.status = 'rejected';
  await connection.save();

  await createNotification(io, {
    userId: connection.senderId,
    type: 'connection_rejected',
    message: `${req.user.name} declined your connection request`,
    relatedUserId: req.user._id,
    link: '/discover',
  });

  await emitConnectionUpdate(io, [connection.senderId, connection.receiverId], {
    connectionId: connection._id,
    status: 'rejected',
  });

  res.json({ success: true, message: 'Connection request declined' });
});

const deleteConnection = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const connection = await Connection.findById(req.params.id);
  if (!connection) throw new ApiError(404, 'Connection not found');

  const isParticipant =
    connection.senderId.equals(req.user._id) || connection.receiverId.equals(req.user._id);
  if (!isParticipant && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not part of this connection');
  }

  const otherUserId = connection.senderId.equals(req.user._id)
    ? connection.receiverId
    : connection.senderId;
  const wasAccepted = connection.status === 'accepted';

  await connection.deleteOne();

  if (wasAccepted) {
    const key = participantKey(connection.senderId, connection.receiverId);
    const conversation = await Conversation.findOne({ participantKey: key });
    if (conversation) {
      await Message.deleteMany({ conversationId: conversation._id });
      await conversation.deleteOne();
    }
  }

  await emitConnectionUpdate(io, [connection.senderId, connection.receiverId], {
    connectionId: connection._id,
    status: 'removed',
  });

  res.json({
    success: true,
    message: wasAccepted ? 'Connection removed' : 'Connection request cancelled',
    data: { otherUserId },
  });
});

module.exports = {
  requestConnection,
  getConnections,
  acceptConnection,
  rejectConnection,
  deleteConnection,
  participantKey,
};
