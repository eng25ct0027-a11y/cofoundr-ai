const Report = require('../models/Report');
const User = require('../models/User');
const Startup = require('../models/Startup');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, startupId, reason, details } = req.body;
  if (!reportedUserId && !startupId) {
    throw new ApiError(422, 'Choose a profile or startup to report');
  }
  if (reportedUserId) {
    if (reportedUserId === req.user._id.toString()) {
      throw new ApiError(400, 'You cannot report yourself');
    }
    const user = await User.findById(reportedUserId);
    if (!user) throw new ApiError(404, 'Reported user not found');
  }
  if (startupId) {
    const startup = await Startup.findById(startupId);
    if (!startup) throw new ApiError(404, 'Reported startup not found');
  }

  const existing = await Report.findOne({
    reporterId: req.user._id,
    reportedUserId: reportedUserId || null,
    startupId: startupId || null,
    status: { $in: ['open', 'reviewing'] },
  });
  if (existing) {
    throw new ApiError(409, 'You have already reported this content');
  }

  const report = await Report.create({
    reporterId: req.user._id,
    reportedUserId: reportedUserId || undefined,
    startupId: startupId || undefined,
    reason,
    details: details || '',
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted. Our team will review it shortly.',
    data: { report },
  });
});

module.exports = { createReport };
