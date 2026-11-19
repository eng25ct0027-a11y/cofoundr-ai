const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = {};
  result.array().forEach((error) => {
    if (!errors[error.path]) errors[error.path] = error.msg;
  });
  next(new ApiError(422, 'Please correct the highlighted fields', errors));
}

module.exports = { validate };
