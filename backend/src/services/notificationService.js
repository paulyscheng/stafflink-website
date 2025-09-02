const db = require('../config/database');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * 创建通知
   * 注意: notifications表使用user_id和user_type，而不是receiver_id和receiver_type
   */
  static async createNotification(notificationData) {
    try {
      const {
        receiver_id,  // 兼容旧代码，但会映射到 user_id
        receiver_type,  // 兼容旧代码，但会映射到 user_type
        sender_id,
        sender_type,
        type,
        title,
        message,
        project_id,
        invitation_id,
        job_record_id,
        metadata = {}
      } = notificationData;
      
      // 构建data对象，包含所有额外信息
      const dataObject = {
        ...metadata,
        sender_id: sender_id || null,
        sender_type: sender_type || null,
        project_id: project_id || null,
        invitation_id: invitation_id || null,
        job_record_id: job_record_id || null
      };

      const query = `
        INSERT INTO notifications (
          user_id, user_type,
          type, title, message, data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING *;
      `;

      const values = [
        receiver_id,  // 映射到 user_id
        receiver_type,  // 映射到 user_type
        type,
        title,
        message,
        dataObject  // JSONB字段，包含所有额外数据
      ];

      const result = await db.query(query, values);
      logger.info(`通知创建成功: ${type} - ${title}`);
      return result.rows[0];
    } catch (error) {
      logger.error('创建通知失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建通知（用于向多个用户发送同一通知）
   */
  static async createBatchNotifications(receivers, notificationTemplate) {
    const notifications = [];
    
    for (const receiver of receivers) {
      try {
        const notification = await this.createNotification({
          ...notificationTemplate,
          receiver_id: receiver.id,
          receiver_type: receiver.type
        });
        notifications.push(notification);
      } catch (error) {
        logger.error(`批量创建通知失败 - 接收者: ${receiver.id}`, error);
      }
    }
    
    return notifications;
  }

  /**
   * 获取用户的通知列表
   */
  static async getUserNotifications(userId, userType, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false,
        type = null 
      } = options;

      let query = `
        SELECT 
          n.*,
          n.data->>'sender_id' as sender_id,
          n.data->>'sender_type' as sender_type,
          n.data->>'project_id' as project_id,
          n.data->>'invitation_id' as invitation_id,
          n.data->>'job_record_id' as job_record_id
        FROM notifications n
        WHERE n.user_id = $1 AND n.user_type = $2
      `;

      const params = [userId, userType];

      if (unreadOnly) {
        query += ` AND n.read = false`;
      }

      if (type) {
        params.push(type);
        query += ` AND n.type = $${params.length}`;
      }

      query += ` ORDER BY n.created_at DESC`;
      
      // 分页
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const result = await db.query(query, params);

      // 获取总数
      let countQuery = `
        SELECT COUNT(*) as total 
        FROM notifications 
        WHERE user_id = $1 AND user_type = $2
      `;
      const countParams = [userId, userType];

      if (unreadOnly) {
        countQuery += ` AND read = false`;
      }

      if (type) {
        countParams.push(type);
        countQuery += ` AND type = $${countParams.length}`;
      }

      const countResult = await db.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return {
        notifications: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取用户通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount(userId, userType) {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = $1 
          AND user_type = $2 
          AND read = false
      `;

      const result = await db.query(query, [userId, userType]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('获取未读通知数量失败:', error);
      throw error;
    }
  }

  /**
   * 标记通知为已读
   */
  static async markAsRead(notificationId, userId, userType) {
    try {
      const query = `
        UPDATE notifications 
        SET read = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
          AND user_id = $2 
          AND user_type = $3
        RETURNING *;
      `;

      const result = await db.query(query, [notificationId, userId, userType]);
      
      if (result.rows.length === 0) {
        throw new Error('通知不存在或无权限访问');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('标记通知已读失败:', error);
      throw error;
    }
  }

  /**
   * 标记所有通知为已读
   */
  static async markAllAsRead(userId, userType) {
    try {
      const query = `
        UPDATE notifications 
        SET read = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 
          AND user_type = $2 
          AND read = false
        RETURNING *;
      `;

      const result = await db.query(query, [userId, userType]);
      return result.rows;
    } catch (error) {
      logger.error('标记所有通知已读失败:', error);
      throw error;
    }
  }

  /**
   * 删除通知
   */
  static async deleteNotification(notificationId, userId, userType) {
    try {
      const query = `
        DELETE FROM notifications 
        WHERE id = $1 
          AND user_id = $2 
          AND user_type = $3
        RETURNING *;
      `;

      const result = await db.query(query, [notificationId, userId, userType]);
      
      if (result.rows.length === 0) {
        throw new Error('通知不存在或无权限删除');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('删除通知失败:', error);
      throw error;
    }
  }

  /**
   * 清空用户的所有通知
   */
  static async clearAllNotifications(userId, userType) {
    try {
      const query = `
        DELETE FROM notifications 
        WHERE user_id = $1 
          AND user_type = $2
        RETURNING *;
      `;

      const result = await db.query(query, [userId, userType]);
      return result.rows;
    } catch (error) {
      logger.error('清空所有通知失败:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;