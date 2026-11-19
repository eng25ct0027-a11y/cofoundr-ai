const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (arr) => arr.length === 2,
        message: 'A conversation must have exactly two participants',
      },
      required: true,
    },
    participantKey: { type: String, required: true, unique: true },
    lastMessage: { type: String, default: '', maxlength: 2000 },
    lastMessageAt: { type: Date, default: Date.now },
    lastSenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
