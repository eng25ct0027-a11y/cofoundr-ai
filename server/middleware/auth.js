const config = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');

function extractToken(req) {
  const cookieToken = req.cookies?.[config.cookieName];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'Please log in to continue');

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }

  const user = await User.findById(decoded.sub);
  if (!user) throw new ApiError(401, 'This account no longer exists');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');

  req.user = user;
  if (!user.lastActiveAt || Date.now() - new Date(user.lastActiveAt).getTime() > 5 * 60 * 1000) {
    User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
  }
  next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (user && user.isActive) req.user = user;
  } catch {
    // Public endpoint: ignore invalid credentials.
  }
  next();
});

module.exports = { protect, optionalAuth };
