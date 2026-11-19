const config = require('../config/env');

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;

  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Please correct the highlighted fields';
    errors = {};
    for (const field of Object.keys(err.errors)) {
      errors[field] = err.errors[field].message;
    }
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier provided';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message =
      field === 'email'
        ? 'An account with this email already exists'
        : 'This record already exists';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `Image is too large. Maximum size is ${config.uploads.maxMb}MB.`
        : err.message;
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(config.isProd ? {} : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
