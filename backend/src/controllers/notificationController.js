const db = require('../config/database');
const logger = require('../utils/logger');

const getNotifications = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Get notifications - coming soon' });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Mark as read - coming soon' });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Mark all as read - coming soon' });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Delete notification - coming soon' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };