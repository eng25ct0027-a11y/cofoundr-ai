const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  CATEGORIES,
  INTERESTS,
  FOUNDER_PREFERENCES,
  AVAILABILITY,
  EXPERIENCE_LEVELS,
  WORK_STYLES,
  RISK_TOLERANCE,
} = require('../utils/constants');
const { calculateProfileCompletion } = require('../utils/profileCompletion');

const startupGoalsSchema = new mongoose.Schema(
  {
    startupType: { type: String, trim: true, maxlength: 300, default: '' },
    problems: { type: String, trim: true, maxlength: 1200, default: '' },
    cofounderQualities: { type: String, trim: true, maxlength: 1200, default: '' },
    longTermVision: { type: String, trim: true, maxlength: 1200, default: '' },
  },
  { _id: false }
);

const workingPreferencesSchema = new mongoose.Schema(
  {
    workStyle: { type: String, enum: [...WORK_STYLES, ''], default: '' },
    riskTolerance: { type: String, enum: [...RISK_TOLERANCE, ''], default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profileImage: { type: String, default: '' },
    location: { type: String, trim: true, maxlength: 120, default: '' },
    category: { type: String, enum: [...CATEGORIES, ''], default: '' },
    bio: { type: String, trim: true, maxlength: 800, default: '' },
    skills: {
      technical: {
        type: [{ type: String, trim: true }],
        default: [],
        validate: {
          validator: (arr) => arr.length <= 20,
          message: 'Too many technical skills selected',
        },
      },
      business: {
        type: [{ type: String, trim: true }],
        default: [],
        validate: {
          validator: (arr) => arr.length <= 20,
          message: 'Too many business skills selected',
        },
      },
    },
    interests: [{ type: String, enum: INTERESTS }],
    preferences: [{ type: String, enum: FOUNDER_PREFERENCES }],
    availability: { type: String, enum: [...AVAILABILITY, ''], default: '' },
    experienceLevel: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      default: 'Intermediate',
    },
    startupGoals: { type: startupGoalsSchema, default: () => ({}) },
    workingPreferences: { type: workingPreferencesSchema, default: () => ({}) },
    socialLinks: {
      linkedin: { type: String, trim: true, maxlength: 300, default: '' },
      github: { type: String, trim: true, maxlength: 300, default: '' },
      portfolio: { type: String, trim: true, maxlength: 300, default: '' },
    },
    savedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    profileViews: { type: Number, default: 0, min: 0 },
    profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
    onboardingCompleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ location: 1 });
userSchema.index({ category: 1 });
userSchema.index({ availability: 1 });
userSchema.index({ onboardingCompleted: 1, isActive: 1 });
userSchema.index({
  name: 'text',
  bio: 'text',
  'skills.technical': 'text',
  'skills.business': 'text',
});

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  this.profileCompletion = calculateProfileCompletion(this);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return this.toJSON();
};

module.exports = mongoose.model('User', userSchema);
