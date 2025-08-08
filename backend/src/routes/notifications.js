const express = require('express');
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', notificationController.getNotifications);

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', notificationController.markAsRead);

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', notificationController.markAllAsRead);

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;