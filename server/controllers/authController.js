const config = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  setAuthCookie,
  clearAuthCookie,
  createResetToken,
  hashResetToken,
} = require('../utils/token');
const { sendPasswordResetEmail } = require('../services/emailService');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, location, category } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({
    name,
    email,
    password,
    location: location || '',
    category: category || '',
  });

  const token = require('../utils/token').signToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Account created. Let’s build your founder profile.',
    data: { user },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  user.lastActiveAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = require('../utils/token').signToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: `Welcome back, ${user.name.split(' ')[0]}!`,
    data: { user },
  });
});

const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'You have been logged out' });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

  const response = {
    success: true,
    message:
      'If an account exists with that email, a password reset link has been sent.',
  };

  if (!user) return res.json(response);

  const { raw, hashed } = createResetToken();
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        resetPasswordToken: hashed,
        resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000),
      },
    }
  );

  const resetUrl = `${config.clientUrl}/reset-password/${raw}`;
  await sendPasswordResetEmail(user, resetUrl);

  if (!config.isProd) response.devResetUrl = resetUrl;
  res.json(response);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const authToken = require('../utils/token').signToken(user);
  setAuthCookie(res, authToken);

  res.json({
    success: true,
    message: 'Password reset successfully. You are now logged in.',
    data: { user },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, 'Your current password is incorrect');

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
};
