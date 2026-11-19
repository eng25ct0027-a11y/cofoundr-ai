const express = require('express');
const { body } = require('express-validator');
const connectionsController = require('../controllers/connectionsController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/request',
  protect,
  [body('receiverId').isMongoId().withMessage('A valid founder id is required'), validate],
  connectionsController.requestConnection
);
router.get('/', protect, connectionsController.getConnections);
router.put('/:id/accept', protect, connectionsController.acceptConnection);
router.put('/:id/reject', protect, connectionsController.rejectConnection);
router.delete('/:id', protect, connectionsController.deleteConnection);

module.exports = router;
