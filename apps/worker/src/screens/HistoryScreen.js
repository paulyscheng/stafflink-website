import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useJobs } from '../contexts/JobContext';

const HistoryScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const { t } = useLanguage();
  const { jobs } = useJobs();

  // Mock completed jobs data
  const completedJobs = [
    {
      id: 'history_001',
      companyName: '星级清洁公司',
      projectName: '商场清洁服务',
      projectAddress: '东城区王府井大街',
      workDate: '2024-01-05',
      startTime: '09:00',
      endTime: '15:00',
      paymentAmount: 480,
      paymentType: 'daily',
      status: 'completed',
      rating: 4.8,
      workerComment: '工作认真，按时完成',
      completedDate: '2024-01-05T15:30:00Z',
      actualDuration: '6小时',
      skills: ['清洁工']
    },
    {
      id: 'history_002',
      companyName: '建筑装修有限公司',
      projectName: '水电安装工程',
      projectAddress: '朝阳区三里屯',
      workDate: '2024-01-02',
      startTime: '08:00',
      endTime: '17:00',
      paymentAmount: 720,
      paymentType: 'hourly',
      status: 'completed',
      rating: 5.0,
      workerComment: '技术过硬，工作效率高',
      completedDate: '2024-01-02T17:15:00Z',
      actualDuration: '9小时',
      skills: ['电工', '水管工']
    },
    {
      id: 'history_003',
      companyName: '金牌家政服务',
      projectName: '别墅清洁保养',
      projectAddress: '海淀区中关村',
      workDate: '2023-12-28',
      startTime: '10:00',
      endTime: '16:00',
      paymentAmount: 600,
      paymentType: 'fixed',
      status: 'completed',
      rating: 4.9,
      workerComment: '服务态度好，工作仔细',
      completedDate: '2023-12-28T16:20:00Z',
      actualDuration: '6小时',
      skills: ['清洁工']
    }
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getFilteredJobs = () => {
    switch (activeFilter) {
      case 'completed':
        return completedJobs;
      case 'accepted':
        return jobs.filter(job => job.status === 'accepted');
      case 'rejected':
        return jobs.filter(job => job.status === 'rejected');
      default:
        return [...completedJobs, ...jobs.filter(job => job.status !== 'pending')];
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatPayment = (job) => {
    if (job.paymentAmount) {
      return `¥${job.paymentAmount}`;
    }
    if (job.paymentType === 'hourly') {
      return `¥${job.budgetRange}/时`;
    } else if (job.paymentType === 'daily') {
      return `¥${job.budgetRange}/天`;
    } else if (job.paymentType === 'fixed') {
      return `¥${job.budgetRange}`;
    }
    return '面议';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'accepted': return '#3b82f6';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'accepted': return '已接受';
      case 'rejected': return '已拒绝';
      default: return '未知';
    }
  };

  const HistoryCard = ({ job }) => (
    <TouchableOpacity 
      style={styles.historyCard}
      onPress={() => {
        if (job.status === 'completed') {
          // Show completed job details
          navigation.navigate('CompletedJobDetail', { jobData: job });
        } else {
          navigation.navigate('JobDetail', { jobId: job.id });
        }
      }}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.projectName}>{job.projectName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
            <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
          </View>
        </View>
        <Text style={styles.companyName}>{job.companyName}</Text>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Icon name="calendar" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {formatDate(job.workDate || job.startDate)}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="clock-o" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {job.startTime} - {job.endTime}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="map-marker" size={14} color="#6b7280" />
          <Text style={styles.infoText}>{job.projectAddress}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="wrench" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            {job.skills?.join('、') || job.requiredSkills?.join('、')}
          </Text>
        </View>
      </View>

      {/* Card Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.paymentContainer}>
          <Text style={styles.paymentAmount}>{formatPayment(job)}</Text>
          {job.actualDuration && (
            <Text style={styles.durationText}>实际工作: {job.actualDuration}</Text>
          )}
        </View>
        
        {job.status === 'completed' && job.rating && (
          <View style={styles.ratingContainer}>
            <Icon name="star" size={12} color="#f59e0b" />
            <Text style={styles.ratingText}>{job.rating}</Text>
          </View>
        )}
      </View>

      {/* Worker Comment for completed jobs */}
      {job.status === 'completed' && job.workerComment && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>客户评价:</Text>
          <Text style={styles.commentText}>{job.workerComment}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const filteredJobs = getFilteredJobs();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>工作历史</Text>
        <Text style={styles.headerSubtitle}>查看你的工作记录</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'all' && styles.activeTab]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeTabText]}>
            全部
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'completed' && styles.activeTab]}
          onPress={() => setActiveFilter('completed')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'completed' && styles.activeTabText]}>
            已完成
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'accepted' && styles.activeTab]}
          onPress={() => setActiveFilter('accepted')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'accepted' && styles.activeTabText]}>
            已接受
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, activeFilter === 'rejected' && styles.activeTab]}
          onPress={() => setActiveFilter('rejected')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'rejected' && styles.activeTabText]}>
            已拒绝
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => <HistoryCard key={job.id} job={job} />)
        ) : (
          <View style={styles.emptyState}>
            <Icon name="history" size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>暂无工作记录</Text>
            <Text style={styles.emptyStateDescription}>
              你还没有相关的工作记录
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
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
    paddingTop: 16,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  companyName: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardContent: {
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentContainer: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 4,
    fontWeight: '600',
  },
  commentContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  commentLabel: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '500',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
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

export default HistoryScreen;