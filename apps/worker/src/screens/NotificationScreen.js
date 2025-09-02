import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // 通知类型对应的图标和颜色 - 更专业的工业风格
  const notificationConfig = {
    invitation_received: {
      icon: 'hammer-outline',  // 工具图标，代表工作
      color: '#2563EB',  // 专业蓝
      title: '新工作机会'
    },
    invitation_cancelled: {
      icon: 'close-circle-outline',
      color: '#DC2626',  // 警告红
      title: '邀请已取消'
    },
    project_updated: {
      icon: 'sync-outline',  // 同步图标
      color: '#F59E0B',  // 橙色
      title: '项目更新'
    },
    project_started: {
      icon: 'play-circle-outline',  // 开始图标
      color: '#10B981',  // 成功绿
      title: '项目即将开始'
    },
    project_completed: {
      icon: 'checkmark-done-circle-outline',  // 完成图标
      color: '#06B6D4',  // 青色
      title: '项目已完成'
    },
    payment_received: {
      icon: 'wallet-outline',  // 钱包图标，更专业
      color: '#059669',  // 深绿色
      title: '工资到账'
    },
    system: {
      icon: 'settings-outline',  // 设置图标
      color: '#6B7280',  // 中性灰
      title: '系统通知'
    }
  };

  // 获取通知列表
  const fetchNotifications = async (isRefresh = false) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const currentPage = isRefresh ? 1 : page;
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(activeFilter !== 'all' && { is_read: activeFilter === 'read' })
      });

      const response = await fetch(`${API_URL}/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (isRefresh) {
          setNotifications(data.data || []);
          setPage(1);
        } else {
          setNotifications(prev => [...prev, ...(data.data || [])]);
        }
        
        setHasMore(data.pagination?.page < data.pagination?.totalPages);
        
        // 获取未读数量
        fetchUnreadCount();
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('workerToken');
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('获取通知失败:', error);
      Alert.alert('错误', '获取通知失败，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 获取未读数量
  const fetchUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data?.unread_count || 0);
      }
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  };

  // 标记为已读
  const markAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记全部已读
  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadCount(0);
        Alert.alert('成功', '所有通知已标记为已读');
      }
    } catch (error) {
      console.error('标记全部已读失败:', error);
      Alert.alert('错误', '操作失败，请稍后重试');
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条通知吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                Alert.alert('成功', '通知已删除');
              }
            } catch (error) {
              console.error('删除通知失败:', error);
              Alert.alert('错误', '删除失败，请稍后重试');
            }
          }
        }
      ]
    );
  };

  // 处理通知点击
  const handleNotificationPress = (notification) => {
    // 先标记为已读
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // 根据通知类型显示详情或跳转
    switch (notification.type) {
      case 'invitation_received':
        // 新工作机会 - 跳转到邀请详情页
        navigation.navigate('InvitationDetail', { notification });
        break;

      case 'project_started':
        // 项目即将开始 - 跳转到项目详情页
        navigation.navigate('ProjectDetail', { notification });
        break;

      case 'payment_received':
        // 工资到账 - 跳转到收入明细页
        navigation.navigate('PaymentDetail', { notification });
        break;

      case 'project_completed':
        // 项目完成 - 显示评价
        Alert.alert(
          '项目已完成',
          `${notification.message}\n\n` +
          `⭐ 评分: ${notification.metadata?.rating || 5} 星\n` +
          `💬 评价: ${notification.metadata?.comment || '表现优秀'}`,
          [
            { text: '确定', style: 'default' },
            { text: '查看历史', onPress: () => navigation.navigate('History') }
          ]
        );
        break;

      case 'invitation_cancelled':
        // 邀请取消 - 显示原因
        Alert.alert(
          '邀请已取消',
          `${notification.message}\n\n` +
          `原因: ${notification.metadata?.reason || '项目调整'}`,
          [{ text: '知道了', style: 'default' }]
        );
        break;

      case 'system':
        // 系统通知 - 显示详情
        Alert.alert(
          '系统通知',
          notification.message,
          [{ text: '知道了', style: 'default' }]
        );
        break;

      default:
        // 默认处理 - 显示通知内容
        Alert.alert(
          notification.title,
          notification.message,
          [{ text: '确定', style: 'default' }]
        );
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 下拉刷新
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, [activeFilter]);

  // 筛选通知
  const getFilteredNotifications = () => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.is_read);
      case 'read':
        return notifications.filter(n => n.is_read);
      default:
        return notifications;
    }
  };

  useEffect(() => {
    fetchNotifications(true);
  }, [activeFilter]);

  const filteredNotifications = getFilteredNotifications();

  // 渲染通知项
  const renderNotificationItem = (notification) => {
    const config = notificationConfig[notification.type] || notificationConfig.system;
    
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.is_read && styles.unreadItem
        ]}
        onPress={() => handleNotificationPress(notification)}
        onLongPress={() => deleteNotification(notification.id)}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Icon name={config.icon} size={24} color={config.color} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !notification.is_read && styles.unreadText]}>
              {notification.title || config.title}
            </Text>
            {!notification.is_read && (
              <View style={styles.unreadDot} />
            )}
          </View>
          
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          
          <Text style={styles.time}>
            {formatTime(notification.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>消息通知</Text>
        
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>全部已读</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 筛选标签 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.activeTab]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeTabText]}>
              全部
            </Text>
            {notifications.length > 0 && (
              <Text style={[styles.filterCount, activeFilter === 'all' && styles.activeTabText]}>
                ({notifications.length})
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'unread' && styles.activeTab]}
            onPress={() => setActiveFilter('unread')}
          >
            <Text style={[styles.filterText, activeFilter === 'unread' && styles.activeTabText]}>
              未读
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'read' && styles.activeTab]}
            onPress={() => setActiveFilter('read')}
          >
            <Text style={[styles.filterText, activeFilter === 'read' && styles.activeTabText]}>
              已读
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 通知列表 */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>暂无通知</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === 'unread' ? '没有未读消息' : '所有通知都会显示在这里'}
            </Text>
          </View>
        ) : (
          filteredNotifications.map(renderNotificationItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: '#4A90E2',
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  filterCount: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  badge: {
    marginLeft: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 1,
  },
  unreadItem: {
    backgroundColor: '#F0F8FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default NotificationScreen;