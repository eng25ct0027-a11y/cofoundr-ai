const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema(
  {
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    day: { type: String, required: true },
  },
  { timestamps: true }
);

profileViewSchema.index({ viewerId: 1, profileId: 1, day: 1 }, { unique: true });
profileViewSchema.index({ profileId: 1, createdAt: -1 });

module.exports = mongoose.model('ProfileView', profileViewSchema);
