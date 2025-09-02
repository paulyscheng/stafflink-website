import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useJobs } from '../contexts/JobContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const JobsScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  
  const { t } = useLanguage();
  const { jobs, getJobsByStatus, getJobStats } = useJobs();
  const { user, updateWorkerStatus } = useAuth();

  // 获取邀请列表
  const fetchInvitations = async () => {
    // 如果用户未登录，不获取数据
    if (!user || !user.id) {
      console.log('Not logged in, skipping invitation fetch');
      setInvitations([]);
      return;
    }
    
    // 如果是模拟用户ID（worker_开头），使用本地数据
    if (user.id.startsWith('worker_')) {
      setInvitations(getJobsByStatus(activeFilter));
      return;
    }
    
    try {
      setLoading(true);
      
      // 如果是查看已接受的工作，需要从job_records获取
      if (activeFilter === 'accepted') {
        const jobRecords = await ApiService.getWorkerJobs();
        console.log(`Fetched ${jobRecords?.length || 0} job records`);
        setInvitations(jobRecords || []);
        setAcceptedCount(jobRecords?.length || 0);
      } else {
        // 查看待处理或已拒绝的邀请
        const data = await ApiService.getInvitations(activeFilter === 'all' ? null : activeFilter);
        console.log(`Fetched ${data?.length || 0} invitations for status: ${activeFilter}`);
        setInvitations(data || []);
        if (activeFilter === 'pending') {
          setPendingCount(data?.length || 0);
        }
      }
    } catch (error) {
      // 静默处理错误
      if (error.message !== '未登录') {
        console.log('Using empty data due to API error');
      }
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    if (!user || !user.id) return;
    
    // 如果用户是模拟用户ID（worker_开头），使用本地数据
    if (user.id.startsWith('worker_')) {
      setPendingCount(getJobsByStatus('pending').length);
      setAcceptedCount(getJobsByStatus('accepted').length);
      return;
    }
    
    try {
      // 只在不是当前activeFilter时获取统计数据
      if (activeFilter !== 'pending') {
        const pendingInvitations = await ApiService.getInvitations('pending');
        setPendingCount(pendingInvitations?.length || 0);
      }
      
      if (activeFilter !== 'accepted') {
        const jobRecords = await ApiService.getWorkerJobs();
        setAcceptedCount(jobRecords?.length || 0);
      }
    } catch (error) {
      console.log('Failed to fetch stats:', error);
      if (activeFilter !== 'pending') setPendingCount(0);
      if (activeFilter !== 'accepted') setAcceptedCount(0);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      fetchInvitations();
      fetchStats();
    }
  }, [activeFilter, user]);

  // 使用真实数据计算统计
  const stats = {
    pending: pendingCount,
    accepted: acceptedCount,
    rejected: 0,
  };
  
  const filteredJobs = invitations;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchInvitations(),
      fetchStats()
    ]);
    setRefreshing(false);
  };

  const toggleWorkerStatus = () => {
    const newStatus = user.status === 'online' ? 'offline' : 'online';
    updateWorkerStatus(newStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'offline': return '#6b7280';
      case 'busy': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return '在线';
      case 'offline': return '离线';
      case 'busy': return '忙碌';
      default: return '未知';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return '#ef4444';
      case 'normal': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'urgent': return '紧急';
      case 'normal': return '普通';
      case 'low': return '不急';
      default: return '';
    }
  };

  const formatPayment = (job) => {
    if (job.paymentType === 'hourly') {
      return `¥${job.budgetRange}/时`;
    } else if (job.paymentType === 'daily') {
      return `¥${job.budgetRange}/天`;
    } else if (job.paymentType === 'fixed') {
      return `¥${job.budgetRange}`;
    }
    return '面议';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const JobCard = ({ job }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => {
        // 如果是已接受的工作，跳转到工作管理页面
        if (job.status === 'accepted' || job.status === 'arrived' || job.status === 'working') {
          // 对于job_records，使用job_record_id
          const jobId = job.job_record_id || job.id;
          console.log('Navigating to ActiveJob with jobId:', jobId);
          navigation.navigate('ActiveJob', { jobId });
        } else {
          // 对于邀请，使用invitation id
          console.log('Navigating to JobDetail with jobId:', job.id);
          navigation.navigate('JobDetail', { jobId: job.id });
        }
      }}
    >
      {/* Job Header */}
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{job.projectName}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(job.urgency) }]}>
            <Text style={styles.urgencyText}>{getUrgencyText(job.urgency)}</Text>
          </View>
        </View>
        <Text style={styles.companyName}>{job.companyName}</Text>
      </View>

      {/* Job Info */}
      <View style={styles.jobInfo}>
        <View style={styles.infoRow}>
          <Icon name="map-marker" size={14} color="#6b7280" />
          <Text style={styles.infoText}>{job.projectAddress}</Text>
          <Text style={styles.distanceText}>{job.distance}km</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="clock-o" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {formatDate(job.startDate)} {job.startTime}-{job.endTime}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="wrench" size={14} color="#6b7280" />
          <Text style={styles.infoText}>{job.requiredSkills.join('、')}</Text>
        </View>
      </View>

      {/* Job Footer */}
      <View style={styles.jobFooter}>
        <View style={styles.paymentContainer}>
          <Text style={styles.paymentAmount}>{formatPayment(job)}</Text>
          <Text style={styles.estimatedTime}>{job.estimatedDuration}</Text>
        </View>
        
        <View style={styles.companyRating}>
          <Icon name="star" size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{job.companyRating}</Text>
        </View>
      </View>

      {/* Status Badge for non-pending jobs */}
      {job.status !== 'pending' && (
        <View style={[
          styles.statusBadge,
          { backgroundColor: 
            job.status === 'rejected' ? '#ef4444' : 
            job.status === 'accepted' ? '#22c55e' :
            job.status === 'arrived' ? '#3b82f6' :
            job.status === 'working' ? '#f59e0b' :
            job.status === 'completed' ? '#8b5cf6' :
            job.status === 'confirmed' ? '#10b981' :
            '#6b7280'
          }
        ]}>
          <Text style={styles.statusBadgeText}>
            {job.status === 'accepted' ? '已接受' :
             job.status === 'rejected' ? '已拒绝' :
             job.status === 'arrived' ? '已到达' :
             job.status === 'working' ? '工作中' :
             job.status === 'completed' ? '已完成' :
             job.status === 'confirmed' ? '已确认' :
             job.status === 'paid' ? '已支付' :
             job.status
            }
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>工作邀请</Text>
          <Text style={styles.headerSubtitle}>你好，{user?.name}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.statusButton, { backgroundColor: getStatusColor(user?.status) }]}
          onPress={toggleWorkerStatus}
        >
          <View style={styles.statusDot} />
          <Text style={styles.statusButtonText}>{getStatusText(user?.status)}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>待响应</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.accepted}</Text>
          <Text style={styles.statLabel}>已接受</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.completedJobs || 0}</Text>
          <Text style={styles.statLabel}>已完成</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'pending' && styles.activeTab]}
          onPress={() => setActiveFilter('pending')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'pending' && styles.activeTabText]}>
            新邀请 ({stats.pending})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'accepted' && styles.activeTab]}
          onPress={() => setActiveFilter('accepted')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'accepted' && styles.activeTabText]}>
            已接受 ({stats.accepted})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jobs List */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => <JobCard key={job.id} job={job} />)
        ) : (
          <View style={styles.emptyState}>
            <Icon name="briefcase" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>
              {activeFilter === 'pending' ? '暂无新邀请' : '暂无已接受工作'}
            </Text>
            <Text style={styles.emptyStateDescription}>
              {activeFilter === 'pending' 
                ? '当有新的工作邀请时，会在这里显示' 
                : '你还没有接受任何工作邀请'
              }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
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
    shadowOpacity: 0.1,
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  companyName: {
    fontSize: 14,
    color: '#6b7280',
  },
  jobInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentContainer: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  companyRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
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
  bottomSpacer: {
    height: 20,
  },
});

export default JobsScreen;