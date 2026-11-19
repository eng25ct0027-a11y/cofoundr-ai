const fs = require('fs/promises');
const path = require('path');
const config = require('../config/env');
const User = require('../models/User');
const Connection = require('../models/Connection');
const ProfileView = require('../models/ProfileView');
const Startup = require('../models/Startup');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { detectImageType } = require('../middleware/upload');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { getCompatibility } = require('../services/matchingEngine');
const {
  TECHNICAL_SKILLS,
  BUSINESS_SKILLS,
  INTERESTS,
  FOUNDER_PREFERENCES,
  AVAILABILITY,
  EXPERIENCE_LEVELS,
  CATEGORIES,
  WORK_STYLES,
  RISK_TOLERANCE,
} = require('../utils/constants');

const PUBLIC_FIELDS =
  'name profileImage location category bio skills interests preferences availability experienceLevel startupGoals workingPreferences socialLinks profileViews onboardingCompleted createdAt';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function filterAllowed(values, allowed) {
  if (!Array.isArray(values)) return [];
  const allowedSet = new Set(allowed);
  return [...new Set(values.filter((value) => allowedSet.has(value)))];
}

function isOnboardingComplete(user) {
  const goals = user.startupGoals || {};
  return Boolean(
    user.name &&
      user.location &&
      user.category &&
      user.bio &&
      user.bio.length >= 20 &&
      (user.skills?.technical?.length || 0) + (user.skills?.business?.length || 0) >= 2 &&
      (user.interests?.length || 0) >= 1 &&
      (user.preferences?.length || 0) >= 1 &&
      user.availability &&
      goals.startupType &&
      goals.problems &&
      goals.cofounderQualities &&
      goals.longTermVision
  );
}

async function buildConnectionMap(userId) {
  if (!userId) return new Map();
  const connections = await Connection.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).lean();
  const map = new Map();
  connections.forEach((connection) => {
    const otherId =
      connection.senderId.toString() === userId.toString()
        ? connection.receiverId.toString()
        : connection.senderId.toString();
    map.set(otherId, {
      status: connection.status,
      connectionId: connection._id.toString(),
      direction:
        connection.senderId.toString() === userId.toString() ? 'outgoing' : 'incoming',
    });
  });
  return map;
}

const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 12 });
  const {
    search,
    skill,
    location,
    industry,
    availability,
    category,
    experience,
    sort = 'recent',
    saved,
  } = req.query;

  const and = [{ isActive: true, onboardingCompleted: true, role: 'user' }];

  if (req.user) and.push({ _id: { $ne: req.user._id } });
  if (saved === 'true' && req.user) {
    and.push({ _id: { $in: req.user.savedProfiles || [] } });
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    and.push({
      $or: [
        { name: regex },
        { bio: regex },
        { location: regex },
        { 'skills.technical': regex },
        { 'skills.business': regex },
      ],
    });
  }
  if (skill) {
    const regex = new RegExp(escapeRegex(skill), 'i');
    and.push({ $or: [{ 'skills.technical': regex }, { 'skills.business': regex }] });
  }
  if (location) and.push({ location: new RegExp(escapeRegex(location), 'i') });
  if (industry) and.push({ interests: industry });
  if (availability) and.push({ availability });
  if (category) and.push({ category });
  if (experience) and.push({ experienceLevel: experience });

  const filter = { $and: and };

  const attachMeta = async (users, total) => {
    const connectionMap = await buildConnectionMap(req.user?._id);
    const savedSet = new Set((req.user?.savedProfiles || []).map((id) => id.toString()));
    const enriched = await Promise.all(
      users.map(async (user) => {
        const plain = user.toObject ? user.toObject() : { ...user };
        delete plain.email;
        delete plain.password;
        delete plain.savedProfiles;
        delete plain.resetPasswordToken;
        delete plain.resetPasswordExpires;
        let compatibility = null;
        if (req.user && !req.user._id.equals(user._id)) {
          compatibility = await getCompatibility(req.user, user);
        }
        const otherId = user._id.toString();
        return {
          ...plain,
          isSaved: savedSet.has(otherId),
          connection: connectionMap.get(otherId) || null,
          compatibility,
        };
      })
    );
    return {
      users: enriched,
      meta: paginationMeta(total, page, limit),
    };
  };

  if (sort === 'compatibility' && req.user) {
    const all = await User.find(filter).limit(300);
    const connectionMap = await buildConnectionMap(req.user._id);
    const savedSet = new Set(req.user.savedProfiles.map((id) => id.toString()));
    const scored = await Promise.all(
      all.map(async (user) => {
        const compatibility = await getCompatibility(req.user, user);
        return { user, compatibility };
      })
    );
    scored.sort((a, b) => b.compatibility.compatibilityScore - a.compatibility.compatibilityScore);
    const pageSlice = scored.slice(skip, skip + limit);
    const enriched = pageSlice.map(({ user, compatibility }) => {
      const plain = user.toObject();
      delete plain.email;
      delete plain.savedProfiles;
      const otherId = user._id.toString();
      return {
        ...plain,
        isSaved: savedSet.has(otherId),
        connection: connectionMap.get(otherId) || null,
        compatibility,
      };
    });
    return res.json({
      success: true,
      data: { users: enriched, meta: paginationMeta(scored.length, page, limit) },
    });
  }

  const sortMap = {
    recent: { createdAt: -1 },
    name: { name: 1 },
    views: { profileViews: -1 },
  };

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select(PUBLIC_FIELDS)
    .sort(sortMap[sort] || sortMap.recent)
    .skip(skip)
    .limit(limit);

  const result = await attachMeta(users, total);
  res.json({ success: true, data: result });
});

const getFeaturedUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({
    isActive: true,
    onboardingCompleted: true,
    role: 'user',
  })
    .select(PUBLIC_FIELDS)
    .sort({ profileCompletion: -1, profileViews: -1, createdAt: -1 })
    .limit(6);

  res.json({
    success: true,
    data: {
      users: users.map((user) => {
        const plain = user.toObject();
        delete plain.email;
        return plain;
      }),
    },
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    `${PUBLIC_FIELDS} email savedProfiles role isActive`
  );
  if (!user || (!user.isActive && req.user?.role !== 'admin')) {
    throw new ApiError(404, 'Founder profile not found');
  }

  const isSelf = Boolean(req.user && req.user._id.equals(user._id));
  const plain = user.toObject();
  if (!isSelf) delete plain.email;

  let compatibility = null;
  let connection = null;
  let isSaved = false;

  if (req.user && !isSelf) {
    compatibility = await getCompatibility(req.user, user);
    const existing = await Connection.findOne({
      $or: [
        { senderId: req.user._id, receiverId: user._id },
        { senderId: user._id, receiverId: req.user._id },
      ],
    });
    if (existing) {
      connection = {
        status: existing.status,
        connectionId: existing._id,
        direction: existing.senderId.equals(req.user._id) ? 'outgoing' : 'incoming',
      };
    }
    isSaved = req.user.savedProfiles.some((id) => id.equals(user._id));

    const day = new Date().toISOString().slice(0, 10);
    const view = await ProfileView.updateOne(
      { viewerId: req.user._id, profileId: user._id, day },
      { $setOnInsert: { viewerId: req.user._id, profileId: user._id, day } },
      { upsert: true }
    );
    if (view.upsertedCount > 0) {
      await User.updateOne({ _id: user._id }, { $inc: { profileViews: 1 } });
      plain.profileViews = (plain.profileViews || 0) + 1;
    }
  }

  const startups = await Startup.find({ founderId: user._id, isActive: true })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  res.json({
    success: true,
    data: {
      user: {
        ...plain,
        savedProfiles: undefined,
        isSaved,
        connection,
        compatibility,
        isSelf,
      },
      startups,
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const body = req.body;

  if (typeof body.name === 'string' && body.name.trim()) user.name = body.name.trim().slice(0, 80);
  if (typeof body.location === 'string') user.location = body.location.trim().slice(0, 120);
  if (typeof body.bio === 'string') user.bio = body.bio.trim().slice(0, 800);
  if (typeof body.profileImage === 'string') user.profileImage = body.profileImage.slice(0, 500);
  if (body.category !== undefined && CATEGORIES.includes(body.category)) {
    user.category = body.category;
  }
  if (body.skills && typeof body.skills === 'object') {
    user.skills = {
      technical: filterAllowed(body.skills.technical, TECHNICAL_SKILLS),
      business: filterAllowed(body.skills.business, BUSINESS_SKILLS),
    };
  }
  if (body.interests !== undefined) {
    user.interests = filterAllowed(body.interests, INTERESTS);
  }
  if (body.preferences !== undefined) {
    user.preferences = filterAllowed(body.preferences, FOUNDER_PREFERENCES);
  }
  if (body.availability !== undefined && AVAILABILITY.includes(body.availability)) {
    user.availability = body.availability;
  }
  if (body.experienceLevel !== undefined && EXPERIENCE_LEVELS.includes(body.experienceLevel)) {
    user.experienceLevel = body.experienceLevel;
  }
  if (body.startupGoals && typeof body.startupGoals === 'object') {
    user.startupGoals = {
      startupType: String(body.startupGoals.startupType || '').slice(0, 300),
      problems: String(body.startupGoals.problems || '').slice(0, 1200),
      cofounderQualities: String(body.startupGoals.cofounderQualities || '').slice(0, 1200),
      longTermVision: String(body.startupGoals.longTermVision || '').slice(0, 1200),
    };
  }
  if (body.workingPreferences && typeof body.workingPreferences === 'object') {
    const workStyle = WORK_STYLES.includes(body.workingPreferences.workStyle)
      ? body.workingPreferences.workStyle
      : '';
    const riskTolerance = RISK_TOLERANCE.includes(body.workingPreferences.riskTolerance)
      ? body.workingPreferences.riskTolerance
      : '';
    user.workingPreferences = { workStyle, riskTolerance };
  }
  if (body.socialLinks && typeof body.socialLinks === 'object') {
    user.socialLinks = {
      linkedin: String(body.socialLinks.linkedin || '').slice(0, 300),
      github: String(body.socialLinks.github || '').slice(0, 300),
      portfolio: String(body.socialLinks.portfolio || '').slice(0, 300),
    };
  }

  if (body.onboardingCompleted === true && isOnboardingComplete(user)) {
    user.onboardingCompleted = true;
  }

  await user.save();

  // Recalculate matches after meaningful profile changes, without blocking the response.
  if (user.onboardingCompleted) {
    const { recalculateForUser } = require('./../services/matchingEngine');
    recalculateForUser(user._id, { limit: 30 }).catch((error) =>
      console.error('[matching] background recalculation failed', error.message)
    );
  }

  res.json({
    success: true,
    message: user.onboardingCompleted
      ? 'Profile saved successfully'
      : 'Profile saved. Complete the remaining steps to unlock AI matches.',
    data: { user },
  });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Please choose an image to upload');

  const detected = detectImageType(req.file.buffer);
  if (!detected) throw new ApiError(400, 'The uploaded file is not a valid image');

  const dir = path.join(config.uploads.dir, 'avatars');
  await fs.mkdir(dir, { recursive: true });
  const filename = `${req.user._id}-${Date.now()}.${detected.ext}`;
  await fs.writeFile(path.join(dir, filename), req.file.buffer);

  const user = await User.findById(req.user._id);
  const previous = user.profileImage;
  user.profileImage = `/uploads/avatars/${filename}`;
  await user.save();

  if (previous && previous.startsWith('/uploads/avatars/')) {
    const previousPath = path.join(config.uploads.dir, previous.replace('/uploads/', ''));
    fs.unlink(previousPath).catch(() => {});
  }

  res.json({
    success: true,
    message: 'Profile picture updated',
    data: { user, profileImage: user.profileImage },
  });
});

const toggleSavedProfile = asyncHandler(async (req, res) => {
  const target = await User.findOne({
    _id: req.params.id,
    isActive: true,
    onboardingCompleted: true,
  }).select('_id');
  if (!target) throw new ApiError(404, 'Founder profile not found');
  if (target._id.equals(req.user._id)) {
    throw new ApiError(400, 'You cannot save your own profile');
  }

  const user = await User.findById(req.user._id);
  const alreadySaved = user.savedProfiles.some((id) => id.equals(target._id));
  if (alreadySaved) {
    user.savedProfiles = user.savedProfiles.filter((id) => !id.equals(target._id));
  } else {
    user.savedProfiles.push(target._id);
  }
  await user.save();

  res.json({
    success: true,
    message: alreadySaved ? 'Removed from saved profiles' : 'Profile saved',
    data: { saved: !alreadySaved },
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (typeof req.body.name === 'string' && req.body.name.trim()) {
    user.name = req.body.name.trim().slice(0, 80);
  }
  if (typeof req.body.location === 'string') {
    user.location = req.body.location.trim().slice(0, 120);
  }
  await user.save();
  res.json({ success: true, message: 'Settings updated', data: { user } });
});

const deactivateAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.isActive = false;
  await user.save({ validateBeforeSave: false });
  require('../utils/token').clearAuthCookie(res);
  res.json({ success: true, message: 'Your account has been deactivated' });
});

module.exports = {
  getUsers,
  getFeaturedUsers,
  getUserById,
  updateProfile,
  uploadAvatar,
  toggleSavedProfile,
  updateSettings,
  deactivateAccount,
  isOnboardingComplete,
};
