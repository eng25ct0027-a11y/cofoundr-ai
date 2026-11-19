const mongoose = require('mongoose');

const startupApplicationSchema = new mongoose.Schema(
  {
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
      index: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: { type: String, trim: true, maxlength: 800, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

startupApplicationSchema.index({ startupId: 1, applicantId: 1 }, { unique: true });
startupApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('StartupApplication', startupApplicationSchema);
