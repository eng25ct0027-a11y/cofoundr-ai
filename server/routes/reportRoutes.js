const express = require('express');
const { body } = require('express-validator');
const reportsController = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('reason')
      .isIn(['fake_profile', 'spam', 'harassment', 'inappropriate_content', 'scam', 'other'])
      .withMessage('Choose a valid reason'),
    body('reportedUserId').optional().isMongoId(),
    body('startupId').optional().isMongoId(),
    body('details').optional().trim().isLength({ max: 1000 }),
    validate,
  ],
  reportsController.createReport
);

module.exports = router;
