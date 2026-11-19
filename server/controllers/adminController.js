const User = require('../models/User');
const Startup = require('../models/Startup');
const StartupApplication = require('../models/StartupApplication');
const Connection = require('../models/Connection');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const ProfileView = require('../models/ProfileView');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginationMeta } = require('../utils/pagination');

const getStats = asyncHandler(async (_req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalConnections,
    acceptedConnections,
    totalStartups,
    openReports,
    totalMatches,
    totalMessages,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true, lastActiveAt: { $gte: activeThreshold } }),
    Connection.countDocuments({}),
    Connection.countDocuments({ status: 'accepted' }),
    Startup.countDocuments({ isActive: true }),
    Report.countDocuments({ status: { $in: ['open', 'reviewing'] } }),
    Match.countDocuments({}),
    Message.countDocuments({}),
    User.find({}).select('name email profileImage category createdAt isActive').sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const signups = await User.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topSkills = await User.aggregate([
    {
      $project: {
        skills: { $concatArrays: [{ $ifNull: ['$skills.technical', []] }, { $ifNull: ['$skills.business', []] }] },
      },
    },
    { $unwind: '$skills' },
    { $group: { _id: '$skills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  const industries = await Startup.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$industry', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        totalUsers,
        activeUsers,
        totalConnections,
        acceptedConnections,
        totalStartups,
        openReports,
        totalMatches,
        totalMessages,
      },
      signups,
      topSkills,
      industries,
      recentUsers,
    },
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 20 });
  const { search, role, status } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: new RegExp(escaped, 'i') },
      { email: new RegExp(escaped, 'i') },
      { location: new RegExp(escaped, 'i') },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.json({
    success: true,
    data: { users, meta: paginationMeta(total, page, limit) },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { isActive, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user._id.equals(req.user._id) && (isActive === false || role === 'user')) {
    throw new ApiError(400, 'You cannot deactivate or demote your own admin account');
  }

  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (role && ['user', 'admin'].includes(role)) user.role = role;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'User updated',
    data: { user },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user._id.equals(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account from the admin panel');
  }

  const startups = await Startup.find({ founderId: user._id }).select('_id');
  const startupIds = startups.map((startup) => startup._id);

  await Promise.all([
    StartupApplication.deleteMany({ $or: [{ applicantId: user._id }, { startupId: { $in: startupIds } }] }),
    Startup.deleteMany({ founderId: user._id }),
    Connection.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] }),
    Conversation.deleteMany({ participants: user._id }),
    Message.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] }),
    Match.deleteMany({ $or: [{ userId: user._id }, { matchedUserId: user._id }] }),
    Notification.deleteMany({ userId: user._id }),
    Report.deleteMany({ $or: [{ reporterId: user._id }, { reportedUserId: user._id }] }),
    ProfileView.deleteMany({ $or: [{ viewerId: user._id }, { profileId: user._id }] }),
    user.deleteOne(),
  ]);

  res.json({ success: true, message: 'User and related data deleted' });
});

const getReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [total, reports] = await Promise.all([
    Report.countDocuments(filter),
    Report.find(filter)
      .populate('reporterId', 'name email profileImage')
      .populate('reportedUserId', 'name email profileImage')
      .populate('startupId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.json({
    success: true,
    data: { reports, meta: paginationMeta(total, page, limit) },
  });
});

const updateReport = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
    throw new ApiError(422, 'Invalid report status');
  }
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { $set: { status, reviewedBy: req.user._id, reviewedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!report) throw new ApiError(404, 'Report not found');
  res.json({ success: true, message: 'Report updated', data: { report } });
});

module.exports = {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getReports,
  updateReport,
};
