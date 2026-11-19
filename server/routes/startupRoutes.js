const express = require('express');
const { body } = require('express-validator');
const startupsController = require('../controllers/startupsController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { INTERESTS, PROJECT_STAGES, STARTUP_ROLES } = require('../utils/constants');

const router = express.Router();

const startupValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('description')
    .trim()
    .isLength({ min: 30, max: 2000 })
    .withMessage('Description must be 30-2000 characters'),
  body('problem').trim().notEmpty().withMessage('Problem statement is required').isLength({ max: 1500 }),
  body('solution').trim().notEmpty().withMessage('Proposed solution is required').isLength({ max: 1500 }),
  body('industry').isIn(INTERESTS).withMessage('Choose a valid industry'),
  body('requiredSkills').optional().isArray(),
  body('requiredRoles').optional().isArray(),
  body('requiredRoles.*').optional().isIn(STARTUP_ROLES),
  body('projectStage').optional().isIn(PROJECT_STAGES),
  body('teamSize').optional().isInt({ min: 1, max: 100 }).toInt(),
];

router.post('/', protect, startupValidators, validate, startupsController.createStartup);
router.get('/', optionalAuth, startupsController.getStartups);
router.get('/:id', optionalAuth, startupsController.getStartupById);
router.get('/:id/recommended', protect, startupsController.getRecommendedFounders);
router.get('/:id/applications', protect, startupsController.getApplications);
router.put(
  '/:id',
  protect,
  [
    body('title').optional().trim().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ min: 30, max: 2000 }),
    body('industry').optional().isIn(INTERESTS),
    body('projectStage').optional().isIn(PROJECT_STAGES),
    body('requiredRoles.*').optional().isIn(STARTUP_ROLES),
    validate,
  ],
  startupsController.updateStartup
);
router.delete('/:id', protect, startupsController.deleteStartup);
router.post(
  '/:id/apply',
  protect,
  [body('message').optional().trim().isLength({ max: 800 }), validate],
  startupsController.applyToStartup
);
router.put(
  '/applications/:applicationId',
  protect,
  [body('action').isIn(['accept', 'reject']), validate],
  startupsController.reviewApplication
);

module.exports = router;
