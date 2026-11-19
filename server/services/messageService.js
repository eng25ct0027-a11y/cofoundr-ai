const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ApiError = require('../utils/ApiError');
const { emitToUser } = require('../utils/realtime');

const PUBLIC_SENDER_FIELDS = 'name profileImage';

function buildParticipantKey(a, b) {
  return [a.toString(), b.toString()].sort().join(':');
}

async function assertConnected(userId, otherId) {
  const connection = await Connection.findOne({
    status: 'accepted',
    $or: [
      { senderId: userId, receiverId: otherId },
      { senderId: otherId, receiverId: userId },
    ],
  });
  if (!connection) {
    throw new ApiError(403, 'You can only message accepted connections');
  }
  return connection;
}

async function ensureConversation(userId, otherId) {
  const participantKey = buildParticipantKey(userId, otherId);
  const participants = [userId, otherId].sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );
  return Conversation.findOneAndUpdate(
    { participantKey },
    {
      $setOnInsert: {
        participantKey,
        participants,
        lastMessage: '',
        lastMessageAt: new Date(),
      },
    },
    { returnDocument: 'after', upsert: true }
  );
}

async function sendMessage(io, senderId, receiverId, content) {
  const trimmed = String(content || '').trim();
  if (!trimmed) throw new ApiError(422, 'Message cannot be empty');
  if (trimmed.length > 2000) {
    throw new ApiError(422, 'Message cannot exceed 2000 characters');
  }
  if (senderId.toString() === receiverId.toString()) {
    throw new ApiError(400, 'You cannot message yourself');
  }

  await assertConnected(senderId, receiverId);
  const conversation = await ensureConversation(senderId, receiverId);

  const message = await Message.create({
    senderId,
    receiverId,
    conversationId: conversation._id,
    content: trimmed,
  });

  conversation.lastMessage = trimmed.slice(0, 2000);
  conversation.lastMessageAt = new Date();
  conversation.lastSenderId = senderId;
  await conversation.save();

  const populated = await Message.findById(message._id)
    .populate('senderId', PUBLIC_SENDER_FIELDS)
    .populate('receiverId', PUBLIC_SENDER_FIELDS)
    .lean();

  if (io) {
    emitToUser(io, receiverId, 'chat:new', populated);
    emitToUser(io, senderId, 'chat:new', populated);
  }

  return { message: populated, conversation };
}

async function markConversationRead(io, userId, conversationId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  const isParticipant = conversation.participants.some((id) => id.equals(userId));
  if (!isParticipant) throw new ApiError(403, 'You are not part of this conversation');

  const result = await Message.updateMany(
    { conversationId, receiverId: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  if (io && result.modifiedCount > 0) {
    const otherId = conversation.participants.find((id) => !id.equals(userId));
    emitToUser(io, otherId, 'chat:read', {
      conversationId,
      readerId: userId,
      readAt: new Date(),
    });
  }

  return result.modifiedCount;
}

async function getUnreadCounts(userId, conversationIds) {
  if (!conversationIds.length) return new Map();
  const rows = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        receiverId: userId,
        readAt: null,
      },
    },
    { $group: { _id: '$conversationId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

module.exports = {
  buildParticipantKey,
  assertConnected,
  ensureConversation,
  sendMessage,
  markConversationRead,
  getUnreadCounts,
};
