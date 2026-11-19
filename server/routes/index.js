const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const matchRoutes = require('./matchRoutes');
const startupRoutes = require('./startupRoutes');
const connectionRoutes = require('./connectionRoutes');
const messageRoutes = require('./messageRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const reportRoutes = require('./reportRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    message: 'CoFoundr AI API is running',
    data: {
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      time: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/matches', matchRoutes);
router.use('/startups', startupRoutes);
router.use('/connections', connectionRoutes);
router.use('/', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
