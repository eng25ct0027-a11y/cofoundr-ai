const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'connection_request',
        'connection_accepted',
        'connection_rejected',
        'startup_application',
        'application_accepted',
        'application_rejected',
        'message',
        'system',
      ],
      required: true,
    },
    message: { type: String, required: true, maxlength: 500 },
    relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedStartupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
    link: { type: String, default: '/notifications' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
