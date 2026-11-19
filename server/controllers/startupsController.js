const Startup = require('../models/Startup');
const StartupApplication = require('../models/StartupApplication');
const User = require('../models/User');
const Connection = require('../models/Connection');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, paginationMeta } = require('../utils/pagination');
const { scoreStartupFit } = require('../services/matchingEngine');
const { createNotification } = require('../services/notificationService');
const { emitToUser } = require('../utils/realtime');

const PUBLIC_FOUNDER_FIELDS =
  'name profileImage location category bio skills interests availability experienceLevel';

const PUBLIC_FIELDS =
  'name profileImage location category bio skills interests preferences availability experienceLevel startupGoals workingPreferences socialLinks profileViews onboardingCompleted createdAt';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createStartup = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    problem,
    solution,
    industry,
    requiredSkills,
    requiredRoles,
    projectStage,
    teamSize,
    lookingForCollaborators,
  } = req.body;

  const startup = await Startup.create({
    founderId: req.user._id,
    title,
    description,
    problem,
    solution,
    industry,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.slice(0, 20) : [],
    requiredRoles: Array.isArray(requiredRoles) ? requiredRoles : [],
    projectStage: projectStage || 'Idea',
    teamSize: teamSize || 1,
    lookingForCollaborators: lookingForCollaborators !== false,
  });

  const populated = await Startup.findById(startup._id).populate(
    'founderId',
    PUBLIC_FOUNDER_FIELDS
  );

  res.status(201).json({
    success: true,
    message: 'Startup idea published',
    data: { startup: populated },
  });
});

const getStartups = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 9 });
  const { search, industry, stage, skill, mine, founderId } = req.query;

  const and = [{ isActive: true }];
  if (mine === 'true' && req.user) and.push({ founderId: req.user._id });
  if (founderId) and.push({ founderId });
  if (industry) and.push({ industry });
  if (stage) and.push({ projectStage: stage });
  if (skill) and.push({ requiredSkills: new RegExp(escapeRegex(skill), 'i') });
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    and.push({
      $or: [
        { title: regex },
        { description: regex },
        { problem: regex },
        { solution: regex },
        { industry: regex },
      ],
    });
  }

  const filter = { $and: and };
  const total = await Startup.countDocuments(filter);
  const startups = await Startup.find(filter)
    .populate('founderId', PUBLIC_FOUNDER_FIELDS)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    success: true,
    data: { startups, meta: paginationMeta(total, page, limit) },
  });
});

const getStartupById = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id).populate(
    'founderId',
    PUBLIC_FOUNDER_FIELDS
  );
  if (!startup || !startup.isActive) throw new ApiError(404, 'Startup not found');

  const isOwner = req.user && startup.founderId._id.equals(req.user._id);
  const isAdmin = req.user?.role === 'admin';

  let application = null;
  if (req.user) {
    application = await StartupApplication.findOne({
      startupId: startup._id,
      applicantId: req.user._id,
    }).lean();
  }

  let applications = [];
  if (isOwner || isAdmin) {
    applications = await StartupApplication.find({ startupId: startup._id })
      .populate('applicantId', PUBLIC_FOUNDER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
  }

  res.json({
    success: true,
    data: {
      startup,
      isOwner,
      application,
      applications,
      applicationsCount: isOwner || isAdmin ? applications.length : undefined,
    },
  });
});

const updateStartup = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, 'Startup not found');
  const isOwner = startup.founderId.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only the founder can edit this startup');
  }

  const fields = [
    'title',
    'description',
    'problem',
    'solution',
    'industry',
    'requiredSkills',
    'requiredRoles',
    'projectStage',
    'teamSize',
    'lookingForCollaborators',
  ];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) startup[field] = req.body[field];
  });
  await startup.save();

  const populated = await Startup.findById(startup._id).populate(
    'founderId',
    PUBLIC_FOUNDER_FIELDS
  );

  res.json({ success: true, message: 'Startup updated', data: { startup: populated } });
});

const deleteStartup = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, 'Startup not found');
  const isOwner = startup.founderId.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only the founder or an admin can delete this startup');
  }

  await StartupApplication.deleteMany({ startupId: startup._id });
  await startup.deleteOne();

  res.json({ success: true, message: 'Startup deleted' });
});

const applyToStartup = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const startup = await Startup.findById(req.params.id).populate('founderId', 'name');
  if (!startup || !startup.isActive) throw new ApiError(404, 'Startup not found');
  if (startup.founderId._id.equals(req.user._id)) {
    throw new ApiError(400, 'You cannot apply to your own startup');
  }
  if (!startup.lookingForCollaborators) {
    throw new ApiError(400, 'This startup is not looking for collaborators right now');
  }

  let application = await StartupApplication.findOne({
    startupId: startup._id,
    applicantId: req.user._id,
  });

  if (application && application.status === 'pending') {
    throw new ApiError(409, 'You already have a pending application for this startup');
  }
  if (application && application.status === 'accepted') {
    throw new ApiError(409, 'You are already part of this startup');
  }

  if (application) {
    application.status = 'pending';
    application.message = String(req.body.message || '').slice(0, 800);
    await application.save();
  } else {
    application = await StartupApplication.create({
      startupId: startup._id,
      applicantId: req.user._id,
      message: String(req.body.message || '').slice(0, 800),
    });
  }

  await createNotification(io, {
    userId: startup.founderId._id,
    type: 'startup_application',
    message: `${req.user.name} applied to join ${startup.title}`,
    relatedUserId: req.user._id,
    relatedStartupId: startup._id,
    link: `/startups/${startup._id}`,
  });

  res.status(201).json({
    success: true,
    message: 'Application submitted',
    data: { application },
  });
});

const getApplications = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) throw new ApiError(404, 'Startup not found');
  if (!startup.founderId.equals(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only the founder can view applications');
  }

  const applications = await StartupApplication.find({ startupId: startup._id })
    .populate('applicantId', PUBLIC_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: { applications } });
});

const reviewApplication = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const { action } = req.body;
  if (!['accept', 'reject'].includes(action)) {
    throw new ApiError(422, 'Action must be accept or reject');
  }

  const application = await StartupApplication.findById(req.params.applicationId)
    .populate('startupId')
    .populate('applicantId', 'name');
  if (!application) throw new ApiError(404, 'Application not found');

  const startup = application.startupId;
  if (!startup.founderId.equals(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only the founder can review applications');
  }
  if (application.status !== 'pending') {
    throw new ApiError(400, 'This application has already been reviewed');
  }

  application.status = action === 'accept' ? 'accepted' : 'rejected';
  await application.save();

  if (action === 'accept') {
    const existing = await Connection.findOne({
      $or: [
        { senderId: startup.founderId, receiverId: application.applicantId._id },
        { senderId: application.applicantId._id, receiverId: startup.founderId },
      ],
    });
    if (existing) {
      existing.status = 'accepted';
      await existing.save();
    } else {
      await Connection.create({
        senderId: startup.founderId,
        receiverId: application.applicantId._id,
        status: 'accepted',
      });
    }
    await emitToUser(io, application.applicantId._id, 'connection:update', {
      status: 'accepted',
    });
  }

  await createNotification(io, {
    userId: application.applicantId._id,
    type: action === 'accept' ? 'application_accepted' : 'application_rejected',
    message:
      action === 'accept'
        ? `You were accepted to join ${startup.title}`
        : `Your application to ${startup.title} was not accepted`,
    relatedUserId: req.user._id,
    relatedStartupId: startup._id,
    link: `/startups/${startup._id}`,
  });

  res.json({
    success: true,
    message: action === 'accept' ? 'Applicant accepted' : 'Application rejected',
    data: { application },
  });
});

const getRecommendedFounders = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup || !startup.isActive) throw new ApiError(404, 'Startup not found');

  const users = await User.find({
    isActive: true,
    onboardingCompleted: true,
    role: 'user',
    _id: { $ne: startup.founderId },
  })
    .select(PUBLIC_FIELDS)
    .limit(200);

  const existingApplications = await StartupApplication.find({
    startupId: startup._id,
    status: { $in: ['pending', 'accepted'] },
  }).select('applicantId');
  const appliedSet = new Set(
    existingApplications.map((application) => application.applicantId.toString())
  );

  const recommended = users
    .filter((user) => !appliedSet.has(user._id.toString()))
    .map((user) => {
      const result = scoreStartupFit(startup, user);
      return {
        user: user.toObject(),
        matchScore: result.matchScore,
        matchedSkills: result.matchedSkills,
        reasons: result.reasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  res.json({ success: true, data: { recommended } });
});

module.exports = {
  createStartup,
  getStartups,
  getStartupById,
  updateStartup,
  deleteStartup,
  applyToStartup,
  getApplications,
  reviewApplication,
  getRecommendedFounders,
};
