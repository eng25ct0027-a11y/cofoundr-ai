const Match = require('../models/Match');
const User = require('../models/User');
const Connection = require('../models/Connection');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { recalculateForUser, getCompatibility } = require('../services/matchingEngine');
const { getPagination, paginationMeta } = require('../utils/pagination');

const PUBLIC_FIELDS =
  'name profileImage location category bio skills interests preferences availability experienceLevel startupGoals workingPreferences socialLinks profileViews onboardingCompleted createdAt';

async function enrichMatches(userId, matches) {
  const connections = await Connection.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).lean();
  const connectionMap = new Map();
  connections.forEach((connection) => {
    const otherId =
      connection.senderId.toString() === userId.toString()
        ? connection.receiverId.toString()
        : connection.senderId.toString();
    connectionMap.set(otherId, {
      status: connection.status,
      connectionId: connection._id,
      direction:
        connection.senderId.toString() === userId.toString() ? 'outgoing' : 'incoming',
    });
  });

  return matches.map((match) => {
    const user = match.matchedUserId;
    const otherId = user?._id?.toString();
    return {
      _id: match._id,
      compatibilityScore: match.compatibilityScore,
      breakdown: match.breakdown,
      matchingReasons: match.matchingReasons,
      source: match.source,
      user,
      connection: connectionMap.get(otherId) || null,
      createdAt: match.createdAt,
    };
  });
}

const getMatches = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 9 });
  const { search, industry, availability, minScore = 0, sort = 'score' } = req.query;

  let total = await Match.countDocuments({ userId: req.user._id });
  if (!total && req.user.onboardingCompleted) {
    await recalculateForUser(req.user._id, { limit: 40 });
    total = await Match.countDocuments({ userId: req.user._id });
  }

  let query = Match.find({ userId: req.user._id }).populate({
    path: 'matchedUserId',
    select: PUBLIC_FIELDS,
    match: { isActive: true, onboardingCompleted: true },
  });

  if (sort === 'recent') query = query.sort({ createdAt: -1 });
  else query = query.sort({ compatibilityScore: -1 });

  const rawMatches = await query.limit(200);
  let matches = await enrichMatches(
    req.user._id,
    rawMatches.filter((match) => match.matchedUserId)
  );

  const searchLower = String(search || '').toLowerCase();
  matches = matches.filter((match) => {
    const user = match.user;
    if (Number(match.compatibilityScore) < Number(minScore)) return false;
    if (availability && user.availability !== availability) return false;
    if (industry && !(user.interests || []).includes(industry)) return false;
    if (searchLower) {
      const haystack = [
        user.name,
        user.location,
        user.bio,
        ...(user.skills?.technical || []),
        ...(user.skills?.business || []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }
    return true;
  });

  const paged = matches.slice(skip, skip + limit);

  res.json({
    success: true,
    data: {
      matches: paged,
      meta: paginationMeta(matches.length, page, limit),
    },
  });
});

const recalculateMatches = asyncHandler(async (req, res) => {
  if (!req.user.onboardingCompleted) {
    throw new ApiError(400, 'Complete your founder profile to unlock AI matches');
  }
  const scored = await recalculateForUser(req.user._id, { limit: 40, enhance: true });
  const matches = await Match.find({
    userId: req.user._id,
    matchedUserId: { $in: scored.map((entry) => entry.candidate._id) },
  }).populate({ path: 'matchedUserId', select: PUBLIC_FIELDS });

  const enriched = await enrichMatches(req.user._id, matches);
  enriched.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  res.json({
    success: true,
    message: `Found ${enriched.length} compatible founders`,
    data: { matches: enriched, meta: paginationMeta(enriched.length, 1, 40) },
  });
});

const explainMatch = asyncHandler(async (req, res) => {
  const other = await User.findOne({
    _id: req.params.userId,
    isActive: true,
    onboardingCompleted: true,
  });
  if (!other) throw new ApiError(404, 'Founder not found');
  if (other._id.equals(req.user._id)) {
    throw new ApiError(400, 'You cannot match with yourself');
  }
  const compatibility = await getCompatibility(req.user, other);
  res.json({ success: true, data: { compatibility } });
});

module.exports = { getMatches, recalculateMatches, explainMatch };
