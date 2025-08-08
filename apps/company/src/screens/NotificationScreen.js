import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { notifications, markAsRead, markAllAsRead: markAllRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('all');

  const getFilteredNotifications = () => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'project':
        return notifications.filter(n => 
          ['project_response', 'project_start', 'project_completed'].includes(n.type)
        );
      case 'worker':
        return notifications.filter(n => 
          ['worker_message', 'worker_offline', 'project_response'].includes(n.type)
        );
      default:
        return notifications;
    }
  };

  const getNotificationStats = () => {
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      project: notifications.filter(n => 
        ['project_response', 'project_start', 'project_completed'].includes(n.type)
      ).length,
      worker: notifications.filter(n => 
        ['worker_message', 'worker_offline', 'project_response'].includes(n.type)
      ).length
    };
  };

  const handleNotificationPress = (notification) => {
    // Mark as read and navigate to relevant screen
    markAsRead(notification.id);
    
    if (notification.projectId) {
      // Navigate to project detail - would need to fetch project by ID in real implementation
      navigation.navigate('ProjectDetail', { 
        project: { 
          id: notification.projectId, 
          projectName: notification.message.split('"')[1] || 'Project',
          status: 'pending'
        } 
      });
    }
  };

  const markAllAsRead = () => {
    markAllRead();
  };

  const filteredNotifications = getFilteredNotifications();
  const stats = getNotificationStats();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>消息通知</Text>
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={markAllAsRead}
        >
          <Text style={styles.markAllText}>全部已读</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{stats.unread}</Text>
            <Text style={styles.summaryLabel}>未读消息</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{stats.project}</Text>
            <Text style={styles.summaryLabel}>项目消息</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{stats.worker}</Text>
            <Text style={styles.summaryLabel}>工人消息</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'all' && styles.activeTab]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeTabText]}>
              全部 ({stats.total})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'unread' && styles.activeTab]}
            onPress={() => setActiveFilter('unread')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'unread' && styles.activeTabText]}>
              未读 ({stats.unread})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'project' && styles.activeTab]}
            onPress={() => setActiveFilter('project')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'project' && styles.activeTabText]}>
              项目 ({stats.project})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'worker' && styles.activeTab]}
            onPress={() => setActiveFilter('worker')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'worker' && styles.activeTabText]}>
              工人 ({stats.worker})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notification List */}
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="bell-slash" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>暂无通知</Text>
            <Text style={styles.emptyStateDescription}>
              当有新的项目动态或工人消息时，会在此显示
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification) => (
              <TouchableOpacity 
                key={notification.id} 
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    <Icon 
                      name={notification.icon} 
                      size={20} 
                      color={notification.iconColor} 
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationTitleRow}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {notification.time}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingVertical: 12,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationsList: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default NotificationScreen;