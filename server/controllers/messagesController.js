const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getUnreadCounts } = require('../services/messageService');

const PUBLIC_FIELDS =
  'name profileImage location category bio skills interests availability';

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', PUBLIC_FIELDS)
    .sort({ lastMessageAt: -1 })
    .lean();

  const unreadMap = await getUnreadCounts(
    req.user._id,
    conversations.map((conversation) => conversation._id)
  );

  const data = conversations.map((conversation) => {
    const other = conversation.participants.find(
      (participant) => participant._id.toString() !== req.user._id.toString()
    );
    return {
      _id: conversation._id,
      user: other || null,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      lastSenderId: conversation.lastSenderId,
      unreadCount: unreadMap.get(conversation._id.toString()) || 0,
    };
  });

  res.json({
    success: true,
    data: {
      conversations: data.filter((conversation) => conversation.user),
      unreadTotal: data.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    },
  });
});

const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new ApiError(422, 'A founder id is required');
  if (userId.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot start a conversation with yourself');
  }

  const other = await User.findOne({
    _id: userId,
    isActive: true,
    onboardingCompleted: true,
  }).select(PUBLIC_FIELDS);
  if (!other) throw new ApiError(404, 'Founder not found');

  const Connection = require('../models/Connection');
  const connection = await Connection.findOne({
    status: 'accepted',
    $or: [
      { senderId: req.user._id, receiverId: userId },
      { senderId: userId, receiverId: req.user._id },
    ],
  });
  if (!connection) {
    throw new ApiError(403, 'You can only message accepted connections');
  }

  const { ensureConversation } = require('../services/messageService');
  const conversation = await ensureConversation(req.user._id, other._id);

  res.json({
    success: true,
    data: { conversation: { _id: conversation._id, user: other } },
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const before = req.query.before ? new Date(req.query.before) : null;

  const conversation = await Conversation.findById(conversationId).populate(
    'participants',
    PUBLIC_FIELDS
  );
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  const isParticipant = conversation.participants.some((participant) =>
    participant._id.equals(req.user._id)
  );
  if (!isParticipant) throw new ApiError(403, 'You are not part of this conversation');

  const filter = { conversationId };
  if (before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };

  const messages = await Message.find(filter)
    .populate('senderId', 'name profileImage')
    .populate('receiverId', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  const slice = hasMore ? messages.slice(0, limit) : messages;
  slice.reverse();

  await require('../services/messageService').markConversationRead(
    req.app.get('io'),
    req.user._id,
    conversation._id
  );

  const other = conversation.participants.find(
    (participant) => !participant._id.equals(req.user._id)
  );

  res.json({
    success: true,
    data: {
      messages: slice,
      hasMore,
      nextCursor: slice.length ? slice[0].createdAt : null,
      conversation: {
        _id: conversation._id,
        user: other,
        lastMessageAt: conversation.lastMessageAt,
      },
    },
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content, conversationId } = req.body;

  let targetId = receiverId;
  if (!targetId && conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new ApiError(404, 'Conversation not found');
    if (!conversation.participants.some((id) => id.equals(req.user._id))) {
      throw new ApiError(403, 'You are not part of this conversation');
    }
    targetId = conversation.participants.find((id) => !id.equals(req.user._id));
  }
  if (!targetId) throw new ApiError(422, 'A receiver is required');

  const result = await require('../services/messageService').sendMessage(
    req.app.get('io'),
    req.user._id,
    targetId,
    content
  );

  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: { message: result.message, conversationId: result.conversation._id },
  });
});

const markRead = asyncHandler(async (req, res) => {
  const count = await require('../services/messageService').markConversationRead(
    req.app.get('io'),
    req.user._id,
    req.params.conversationId
  );
  res.json({ success: true, message: 'Conversation marked as read', data: { count } });
});

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markRead,
};
