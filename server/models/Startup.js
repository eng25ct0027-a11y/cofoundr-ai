const mongoose = require('mongoose');
const { INTERESTS, PROJECT_STAGES, STARTUP_ROLES } = require('../utils/constants');

const startupSchema = new mongoose.Schema(
  {
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Startup title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [30, 'Description must be at least 30 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    problem: {
      type: String,
      required: [true, 'Problem statement is required'],
      trim: true,
      maxlength: [1500, 'Problem statement cannot exceed 1500 characters'],
    },
    solution: {
      type: String,
      required: [true, 'Proposed solution is required'],
      trim: true,
      maxlength: [1500, 'Solution cannot exceed 1500 characters'],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: INTERESTS,
    },
    requiredSkills: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'Too many required skills',
      },
    },
    requiredRoles: {
      type: [{ type: String, enum: STARTUP_ROLES }],
      default: [],
    },
    projectStage: {
      type: String,
      enum: PROJECT_STAGES,
      default: 'Idea',
    },
    teamSize: { type: Number, min: 1, max: 100, default: 1 },
    lookingForCollaborators: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

startupSchema.index({ industry: 1 });
startupSchema.index({ projectStage: 1 });
startupSchema.index({ createdAt: -1 });
startupSchema.index({ title: 'text', description: 'text', problem: 'text', solution: 'text' });

module.exports = mongoose.model('Startup', startupSchema);
