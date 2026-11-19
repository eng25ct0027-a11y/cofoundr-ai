const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

const generalLimiter = createLimiter(
  15 * 60 * 1000,
  500,
  'Too many requests. Please try again in a few minutes.'
);

const authLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

const resetLimiter = createLimiter(
  60 * 60 * 1000,
  5,
  'Too many password reset requests. Please try again later.'
);

module.exports = { generalLimiter, authLimiter, resetLimiter };
