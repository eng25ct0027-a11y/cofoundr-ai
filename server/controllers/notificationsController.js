const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginationMeta } = require('../utils/pagination');

const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 20 });
  const filter = { userId: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [total, notifications, unreadCount] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .populate('relatedUserId', 'name profileImage')
      .populate('relatedStartupId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
      meta: paginationMeta(total, page, limit),
    },
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { isRead: true } },
    { returnDocument: 'after' }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');

  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });
  res.json({ success: true, data: { notification, unreadCount } });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true, message: 'All notifications marked as read', data: { unreadCount: 0 } });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!notification) throw new ApiError(404, 'Notification not found');
  const unreadCount = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });
  res.json({ success: true, message: 'Notification deleted', data: { unreadCount } });
});

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
};
