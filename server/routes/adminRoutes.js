const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.put(
  '/users/:id',
  [body('isActive').optional().isBoolean(), body('role').optional().isIn(['user', 'admin']), validate],
  adminController.updateUser
);
router.delete('/users/:id', adminController.deleteUser);
router.get('/reports', adminController.getReports);
router.put(
  '/reports/:id',
  [body('status').isIn(['open', 'reviewing', 'resolved', 'dismissed']), validate],
  adminController.updateReport
);

module.exports = router;
