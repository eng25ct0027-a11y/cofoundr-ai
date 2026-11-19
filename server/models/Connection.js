const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

connectionSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
connectionSchema.index({ receiverId: 1, status: 1 });
connectionSchema.index({ senderId: 1, status: 1 });

connectionSchema.index(
  { senderId: 1, receiverId: 1, status: 1 },
  { partialFilterExpression: { status: 'accepted' } }
);

module.exports = mongoose.model('Connection', connectionSchema);
