const User = require('../models/User');
const Match = require('../models/Match');
const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Startup = require('../models/Startup');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { recalculateForUser } = require('../services/matchingEngine');

const FOUNDER_FIELDS =
  'name profileImage location category bio skills interests preferences availability experienceLevel startupGoals workingPreferences socialLinks profileViews onboardingCompleted createdAt';

const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let matchCount = await Match.countDocuments({ userId });
  if (!matchCount && req.user.onboardingCompleted) {
    await recalculateForUser(userId, { limit: 20 });
    matchCount = await Match.countDocuments({ userId });
  }

  const [
    acceptedConnections,
    pendingReceived,
    pendingSent,
    activeStartups,
    unreadNotifications,
    bestMatchesRaw,
    recentConnectionsRaw,
    recentConversations,
    startups,
  ] = await Promise.all([
    Connection.countDocuments({ status: 'accepted', $or: [{ senderId: userId }, { receiverId: userId }] }),
    Connection.countDocuments({ receiverId: userId, status: 'pending' }),
    Connection.countDocuments({ senderId: userId, status: 'pending' }),
    Startup.countDocuments({ founderId: userId, isActive: true }),
    Notification.countDocuments({ userId, isRead: false }),
    Match.find({ userId })
      .populate({ path: 'matchedUserId', select: FOUNDER_FIELDS })
      .sort({ compatibilityScore: -1 })
      .limit(4)
      .lean(),
    Connection.find({ status: 'accepted', $or: [{ senderId: userId }, { receiverId: userId }] })
      .populate('senderId receiverId', FOUNDER_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(4)
      .lean(),
    Conversation.find({ participants: userId })
      .populate('participants', 'name profileImage')
      .sort({ lastMessageAt: -1 })
      .limit(4)
      .lean(),
    Startup.find({ founderId: userId, isActive: true }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  const connections = await Connection.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).lean();
  const connectionMap = new Map();
  connections.forEach((connection) => {
    const otherId = connection.senderId.toString() === userId.toString()
      ? connection.receiverId.toString()
      : connection.senderId.toString();
    connectionMap.set(otherId, {
      status: connection.status,
      connectionId: connection._id,
      direction: connection.senderId.toString() === userId.toString() ? 'outgoing' : 'incoming',
    });
  });

  const bestMatches = bestMatchesRaw
    .filter((match) => match.matchedUserId)
    .map((match) => ({
      _id: match._id,
      compatibilityScore: match.compatibilityScore,
      breakdown: match.breakdown,
      matchingReasons: match.matchingReasons,
      source: match.source,
      user: match.matchedUserId,
      connection: connectionMap.get(match.matchedUserId._id.toString()) || null,
    }));

  const recentConnections = recentConnectionsRaw.map((connection) => {
    const isSender = connection.senderId._id.equals(userId);
    return {
      _id: connection._id,
      user: isSender ? connection.receiverId : connection.senderId,
      status: connection.status,
      updatedAt: connection.updatedAt,
    };
  });

  const messages = recentConversations
    .map((conversation) => {
      const other = conversation.participants.find(
        (participant) => participant._id.toString() !== userId.toString()
      );
      return {
        _id: conversation._id,
        user: other,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        lastSenderId: conversation.lastSenderId,
      };
    })
    .filter((conversation) => conversation.user);

  res.json({
    success: true,
    data: {
      stats: {
        connections: acceptedConnections,
        profileViews: req.user.profileViews || 0,
        pendingRequests: pendingReceived + pendingSent,
        pendingReceived,
        pendingSent,
        aiMatches: matchCount,
        activeStartups,
        unreadNotifications,
      },
      profileCompletion: req.user.profileCompletion,
      bestMatches,
      recentConnections,
      conversations: messages,
      startups,
      user: req.user,
    },
  });
});

module.exports = { getDashboard };
