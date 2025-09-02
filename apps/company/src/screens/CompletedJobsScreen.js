import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../services/api';

const CompletedJobsScreen = ({ navigation }) => {
  const [completedJobs, setCompletedJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, paid

  // 获取已完成的工作
  const fetchCompletedJobs = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getCompanyJobs('completed');
      
      if (response.success) {
        setCompletedJobs(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch completed jobs:', error);
      Alert.alert('错误', '获取已完成工作失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedJobs();
  }, []);

  // 当页面聚焦时刷新数据
  useFocusEffect(
    React.useCallback(() => {
      fetchCompletedJobs();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompletedJobs();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#8b5cf6';
      case 'confirmed': return '#10b981';
      case 'paid': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '待确认';
      case 'confirmed': return '已确认';
      case 'paid': return '已支付';
      default: return status;
    }
  };

  // 根据过滤器筛选工作
  const getFilteredJobs = () => {
    if (!completedJobs) return [];
    
    switch (filter) {
      case 'pending':
        return completedJobs.filter(job => job.status === 'completed');
      case 'confirmed':
        return completedJobs.filter(job => job.status === 'confirmed');
      case 'paid':
        return completedJobs.filter(job => job.status === 'paid');
      case 'all':
      default:
        return completedJobs;
    }
  };

  const JobCard = ({ job }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => navigation.navigate('ConfirmJob', { jobId: job.id })}
    >
      <View style={styles.jobHeader}>
        <View style={styles.workerInfo}>
          <View style={styles.avatarContainer}>
            {job.worker_photo ? (
              <Image source={{ uri: job.worker_photo }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="user" size={24} color="#9ca3af" />
              </View>
            )}
          </View>
          <View style={styles.workerDetails}>
            <Text style={styles.workerName}>{job.worker_name}</Text>
            <Text style={styles.projectName}>{job.project_name}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
        </View>
      </View>

      <View style={styles.jobContent}>
        <View style={styles.infoRow}>
          <Icon name="clock-o" size={14} color="#6b7280" />
          <Text style={styles.infoText}>完成时间：{formatDate(job.complete_time)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="hourglass" size={14} color="#6b7280" />
          <Text style={styles.infoText}>工作时长：{job.work_duration || '计算中...'}</Text>
        </View>

        {job.work_photos && job.work_photos.length > 0 && (
          <View style={styles.photosContainer}>
            <Text style={styles.photoLabel}>工作照片：</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {job.work_photos.slice(0, 3).map((photo, index) => (
                <Image 
                  key={index}
                  source={{ uri: photo }}
                  style={styles.workPhoto}
                />
              ))}
              {job.work_photos.length > 3 && (
                <View style={[styles.workPhoto, styles.morePhotos]}>
                  <Text style={styles.morePhotosText}>+{job.work_photos.length - 3}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {job.complete_notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>完成说明：</Text>
            <Text style={styles.notesText} numberOfLines={2}>{job.complete_notes}</Text>
          </View>
        )}
      </View>

      <View style={styles.jobFooter}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentLabel}>应付金额</Text>
          <Text style={styles.paymentAmount}>¥{job.payment_amount || job.wage_offer}</Text>
        </View>
        
        {job.status === 'completed' && (
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => navigation.navigate('ConfirmJob', { jobId: job.id })}
          >
            <Text style={styles.confirmButtonText}>确认工作</Text>
            <Icon name="arrow-right" size={14} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>已完成工作</Text>
        <TouchableOpacity onPress={fetchCompletedJobs}>
          <Icon name="refresh" size={20} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedJobs.filter(j => j.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>待确认</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedJobs.filter(j => j.status === 'confirmed').length}</Text>
          <Text style={styles.statLabel}>已确认</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedJobs.filter(j => j.status === 'paid').length}</Text>
          <Text style={styles.statLabel}>已支付</Text>
        </View>
      </View>

      {/* 过滤器 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'pending' && styles.activeFilter]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>待确认</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'confirmed' && styles.activeFilter]}
          onPress={() => setFilter('confirmed')}
        >
          <Text style={[styles.filterText, filter === 'confirmed' && styles.activeFilterText]}>已确认</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'paid' && styles.activeFilter]}
          onPress={() => setFilter('paid')}
        >
          <Text style={[styles.filterText, filter === 'paid' && styles.activeFilterText]}>已支付</Text>
        </TouchableOpacity>
      </View>

      {/* 工作列表 */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : getFilteredJobs().length > 0 ? (
          getFilteredJobs().map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="check-circle-o" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>
              {filter === 'pending' ? '暂无待确认的工作' :
               filter === 'confirmed' ? '暂无已确认的工作' :
               filter === 'paid' ? '暂无已支付的工作' :
               '暂无已完成的工作'}
            </Text>
            <Text style={styles.emptyDescription}>
              {filter === 'pending' ? '工人完成工作后会在这里显示' :
               filter === 'confirmed' ? '确认工作后会在这里显示' :
               filter === 'paid' ? '支付完成后会在这里显示' :
               '工人完成工作后会在这里显示'}
            </Text>
          </View>
        )}
        
        <View style={styles.bottomSpacer} />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeFilter: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  projectName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  jobContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  photosContainer: {
    marginTop: 12,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  workPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  morePhotos: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  notesContainer: {
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
    marginTop: 2,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default CompletedJobsScreen;