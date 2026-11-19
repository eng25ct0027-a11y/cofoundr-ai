const express = require('express');
const { body } = require('express-validator');
const messagesController = require('../controllers/messagesController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/conversations', protect, messagesController.getConversations);
router.post(
  '/conversations',
  protect,
  [body('userId').isMongoId().withMessage('A valid founder id is required'), validate],
  messagesController.getOrCreateConversation
);

router.get('/messages/:conversationId', protect, messagesController.getMessages);
router.post(
  '/messages',
  protect,
  [
    body('content').trim().notEmpty().withMessage('Message cannot be empty').isLength({ max: 2000 }),
    body('receiverId').optional().isMongoId(),
    body('conversationId').optional().isMongoId(),
    validate,
  ],
  messagesController.sendMessage
);
router.put('/messages/:conversationId/read', protect, messagesController.markRead);

module.exports = router;
