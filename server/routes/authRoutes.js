const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter, resetLimiter } = require('../middleware/rateLimits');
const { CATEGORIES } = require('../utils/constants');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 80 }),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== undefined && value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }),
    body('location').optional().trim().isLength({ max: 120 }),
    body('category').optional().isIn(CATEGORIES).withMessage('Choose a valid category'),
    validate,
  ],
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

router.post('/logout', authController.logout);
router.get('/me', protect, authController.me);

router.post(
  '/forgot-password',
  resetLimiter,
  [body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(), validate],
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  resetLimiter,
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    validate,
  ],
  authController.resetPassword
);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
    validate,
  ],
  authController.changePassword
);

module.exports = router;
