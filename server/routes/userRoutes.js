const express = require('express');
const { body } = require('express-validator');
const usersController = require('../controllers/usersController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { avatarUpload } = require('../middleware/upload');
const {
  CATEGORIES,
  AVAILABILITY,
  EXPERIENCE_LEVELS,
  WORK_STYLES,
  RISK_TOLERANCE,
} = require('../utils/constants');

const router = express.Router();

router.get('/featured', usersController.getFeaturedUsers);
router.get('/', protect, usersController.getUsers);
router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('bio').optional().trim().isLength({ max: 800 }),
    body('location').optional().trim().isLength({ max: 120 }),
    body('category').optional().isIn(CATEGORIES),
    body('availability').optional().isIn(AVAILABILITY),
    body('experienceLevel').optional().isIn(EXPERIENCE_LEVELS),
    body('workingPreferences.workStyle').optional().isIn(WORK_STYLES),
    body('workingPreferences.riskTolerance').optional().isIn(RISK_TOLERANCE),
    validate,
  ],
  usersController.updateProfile
);
router.post('/avatar', protect, avatarUpload, usersController.uploadAvatar);
router.put('/settings', protect, usersController.updateSettings);
router.post('/deactivate', protect, usersController.deactivateAccount);
router.put('/:id/save', protect, usersController.toggleSavedProfile);
router.get('/:id', optionalAuth, usersController.getUserById);

module.exports = router;
