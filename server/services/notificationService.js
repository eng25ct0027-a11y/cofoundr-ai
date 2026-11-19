const Notification = require('../models/Notification');
const { emitToUser } = require('../utils/realtime');

async function createNotification(io, payload) {
  const notification = await Notification.create(payload);
  const populated = await Notification.findById(notification._id)
    .populate('relatedUserId', 'name profileImage')
    .lean();
  emitToUser(io, payload.userId, 'notification:new', populated);
  return populated;
}

async function createManyNotifications(io, payloads) {
  if (!payloads.length) return [];
  const notifications = await Notification.insertMany(payloads);
  await Promise.all(
    notifications.map(async (notification) => {
      const populated = await Notification.findById(notification._id)
        .populate('relatedUserId', 'name profileImage')
        .lean();
      emitToUser(io, notification.userId, 'notification:new', populated);
    })
  );
  return notifications;
}

module.exports = { createNotification, createManyNotifications };
