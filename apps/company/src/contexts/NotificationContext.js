import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'project_response',
      title: '工人响应通知',
      message: '张师傅已确认参与"厨房装修"项目',
      time: '2分钟前',
      read: false,
      icon: 'user-check',
      iconColor: '#10b981',
      projectId: 'proj1',
      workerId: 'worker1',
      timestamp: Date.now() - 2 * 60 * 1000
    },
    {
      id: '2',
      type: 'project_start',
      title: '项目开始提醒',
      message: '"办公室清洁"项目将在1小时后开始',
      time: '30分钟前',
      read: false,
      icon: 'clock-o',
      iconColor: '#f59e0b',
      projectId: 'proj2',
      timestamp: Date.now() - 30 * 60 * 1000
    },
    {
      id: '3',
      type: 'worker_message',
      title: '工人消息',
      message: '李师傅: "需要额外的工具，请确认"',
      time: '1小时前',
      read: true,
      icon: 'comment',
      iconColor: '#3b82f6',
      projectId: 'proj3',
      workerId: 'worker2',
      timestamp: Date.now() - 60 * 60 * 1000
    },
    {
      id: '4',
      type: 'project_completed',
      title: '项目完成',
      message: '"水电维修"项目已完成，请确认验收',
      time: '2小时前',
      read: true,
      icon: 'check-circle',
      iconColor: '#22c55e',
      projectId: 'proj4',
      timestamp: Date.now() - 2 * 60 * 60 * 1000
    },
    {
      id: '5',
      type: 'worker_offline',
      title: '工人状态变更',
      message: '王师傅已离线',
      time: '3小时前',
      read: true,
      icon: 'user-times',
      iconColor: '#6b7280',
      workerId: 'worker3',
      timestamp: Date.now() - 3 * 60 * 60 * 1000
    },
    {
      id: '6',
      type: 'system',
      title: '系统通知',
      message: '系统将于今晚23:00-01:00进行维护',
      time: '今天',
      read: false,
      icon: 'cog',
      iconColor: '#8b5cf6',
      timestamp: Date.now() - 6 * 60 * 60 * 1000
    }
  ]);

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const getNotificationsByType = (type) => {
    return notifications.filter(n => n.type === type);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Simulated real-time notification generator
  const simulateNewNotification = () => {
    const sampleNotifications = [
      {
        type: 'project_response',
        title: '新工人响应',
        message: '陈师傅申请加入项目',
        icon: 'user-plus',
        iconColor: '#10b981'
      },
      {
        type: 'worker_message',
        title: '工人消息',
        message: '刘师傅发送了照片更新',
        icon: 'camera',
        iconColor: '#3b82f6'
      },
      {
        type: 'project_start',
        title: '项目提醒',
        message: '项目即将开始，请确认准备情况',
        icon: 'clock-o',
        iconColor: '#f59e0b'
      }
    ];

    const randomNotification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)];
    addNotification(randomNotification);
  };

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    getNotificationsByType,
    removeNotification,
    clearAllNotifications,
    simulateNewNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};