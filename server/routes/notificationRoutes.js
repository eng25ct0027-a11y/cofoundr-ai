const express = require('express');
const notificationsController = require('../controllers/notificationsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, notificationsController.getNotifications);
router.put('/read-all', protect, notificationsController.markAllRead);
router.put('/:id/read', protect, notificationsController.markNotificationRead);
router.delete('/:id', protect, notificationsController.deleteNotification);

module.exports = router;
