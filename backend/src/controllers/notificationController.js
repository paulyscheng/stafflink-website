const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * 获取通知列表
 */
const getNotifications = async (req, res, next) => {
  try {
    const { id: userId, type: userType } = req.user;
    const { page, limit, type, is_read, start_date, end_date } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type: type || null,
      is_read: is_read === 'true' ? true : is_read === 'false' ? false : null,
      start_date: start_date || null,
      end_date: end_date || null
    };

    const result = await NotificationService.getNotifications(userId, userType, options);

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('获取通知列表失败:', error);
    next(error);
  }
};

/**
 * 获取未读通知数量
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const { id: userId, type: userType } = req.user;
    const count = await NotificationService.getUnreadCount(userId, userType);

    res.status(200).json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    logger.error('获取未读通知数量失败:', error);
    next(error);
  }
};

/**
 * 标记单个通知为已读
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id: userId, type: userType } = req.user;
    const { id: notificationId } = req.params;

    const notification = await NotificationService.markAsRead(
      parseInt(notificationId),
      userId,
      userType
    );

    res.status(200).json({
      success: true,
      data: notification,
      message: '通知已标记为已读'
    });
  } catch (error) {
    logger.error('标记通知已读失败:', error);
    next(error);
  }
};

/**
 * 标记所有通知为已读
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const { id: userId, type: userType } = req.user;
    const notifications = await NotificationService.markAllAsRead(userId, userType);

    res.status(200).json({
      success: true,
      data: notifications,
      message: `已将 ${notifications.length} 条通知标记为已读`
    });
  } catch (error) {
    logger.error('标记所有通知已读失败:', error);
    next(error);
  }
};

/**
 * 删除通知
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id: userId, type: userType } = req.user;
    const { id: notificationId } = req.params;

    const notification = await NotificationService.deleteNotification(
      parseInt(notificationId),
      userId,
      userType
    );

    res.status(200).json({
      success: true,
      data: notification,
      message: '通知已删除'
    });
  } catch (error) {
    logger.error('删除通知失败:', error);
    next(error);
  }
};

/**
 * 批量删除通知
 */
const deleteBatchNotifications = async (req, res, next) => {
  try {
    const { id: userId, type: userType } = req.user;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要删除的通知ID数组'
      });
    }

    const notifications = await NotificationService.deleteBatchNotifications(
      ids,
      userId,
      userType
    );

    res.status(200).json({
      success: true,
      data: notifications,
      message: `已删除 ${notifications.length} 条通知`
    });
  } catch (error) {
    logger.error('批量删除通知失败:', error);
    next(error);
  }
};

module.exports = { 
  getNotifications, 
  getUnreadCount,
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  deleteBatchNotifications
};