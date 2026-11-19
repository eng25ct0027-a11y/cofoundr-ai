const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    matchedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    compatibilityScore: { type: Number, required: true, min: 0, max: 100 },
    breakdown: {
      complementarySkills: { type: Number, default: 0 },
      sharedInterests: { type: Number, default: 0 },
      startupGoals: { type: Number, default: 0 },
      industry: { type: Number, default: 0 },
      availability: { type: Number, default: 0 },
      workingStyle: { type: Number, default: 0 },
      experience: { type: Number, default: 0 },
    },
    matchingReasons: { type: [String], default: [] },
    source: { type: String, enum: ['rules', 'llm'], default: 'rules' },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

matchSchema.index({ userId: 1, matchedUserId: 1 }, { unique: true });
matchSchema.index({ userId: 1, compatibilityScore: -1 });
matchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Match', matchSchema);
