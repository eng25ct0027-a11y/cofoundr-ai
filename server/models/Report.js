const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', index: true },
    reason: {
      type: String,
      enum: ['fake_profile', 'spam', 'harassment', 'inappropriate_content', 'scam', 'other'],
      required: true,
    },
    details: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
