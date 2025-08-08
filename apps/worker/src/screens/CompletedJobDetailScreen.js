import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

const CompletedJobDetailScreen = ({ route, navigation }) => {
  const { jobData } = route.params;
  const { t } = useLanguage();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleContactCustomer = () => {
    Alert.alert('联系客户', '是否要拨打客户电话？', [
      { text: '取消', style: 'cancel' },
      { text: '拨打', onPress: () => Alert.alert('拨打', '模拟拨打电话功能') }
    ]);
  };

  const handleReportIssue = () => {
    Alert.alert('举报问题', '请选择举报类型', [
      { text: '取消', style: 'cancel' },
      { text: '工作条件问题', onPress: () => Alert.alert('已提交', '举报已提交，我们会尽快处理') },
      { text: '付款问题', onPress: () => Alert.alert('已提交', '举报已提交，我们会尽快处理') },
      { text: '其他问题', onPress: () => Alert.alert('已提交', '举报已提交，我们会尽快处理') }
    ]);
  };

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
        <Text style={styles.headerTitle}>完成项目详情</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View style={styles.completedBadge}>
            <Icon name="check-circle" size={20} color="#ffffff" />
            <Text style={styles.completedText}>已完成</Text>
          </View>
          <Text style={styles.completedDate}>
            完成时间: {formatDate(jobData.completedDate)} {formatTime(jobData.completedDate)}
          </Text>
        </View>

        {/* Job Overview */}
        <View style={styles.section}>
          <Text style={styles.projectName}>{jobData.projectName}</Text>
          <Text style={styles.companyName}>{jobData.companyName}</Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>客户评分:</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon 
                  key={star}
                  name="star" 
                  size={16} 
                  color={star <= jobData.rating ? "#f59e0b" : "#e5e7eb"} 
                />
              ))}
              <Text style={styles.ratingNumber}>{jobData.rating}</Text>
            </View>
          </View>

          {/* Customer Comment */}
          {jobData.workerComment && (
            <View style={styles.commentContainer}>
              <Text style={styles.commentLabel}>客户评价:</Text>
              <Text style={styles.commentText}>{jobData.workerComment}</Text>
            </View>
          )}
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>收入信息</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentAmount}>¥{jobData.paymentAmount}</Text>
              <View style={styles.paymentBadge}>
                <Icon name="check" size={12} color="#ffffff" />
                <Text style={styles.paymentBadgeText}>已到账</Text>
              </View>
            </View>
            <Text style={styles.paymentType}>
              {jobData.paymentType === 'hourly' ? '按小时计费' : 
               jobData.paymentType === 'daily' ? '按天计费' : '固定费用'}
            </Text>
            <Text style={styles.workDuration}>实际工作时长: {jobData.actualDuration}</Text>
          </View>
        </View>

        {/* Work Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>工作详情</Text>
          
          <View style={styles.detailItem}>
            <Icon name="calendar" size={16} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>工作日期</Text>
              <Text style={styles.detailValue}>{formatDate(jobData.workDate)}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon name="clock-o" size={16} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>工作时间</Text>
              <Text style={styles.detailValue}>
                {jobData.startTime} - {jobData.endTime}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon name="map-marker" size={16} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>工作地点</Text>
              <Text style={styles.detailValue}>{jobData.projectAddress}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon name="wrench" size={16} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>工作技能</Text>
              <View style={styles.skillsContainer}>
                {jobData.skills.map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleContactCustomer}
          >
            <Icon name="phone" size={16} color="#3b82f6" />
            <Text style={styles.actionButtonText}>联系客户</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.reportButton]}
            onPress={handleReportIssue}
          >
            <Icon name="exclamation-triangle" size={16} color="#ef4444" />
            <Text style={[styles.actionButtonText, styles.reportButtonText]}>举报问题</Text>
          </TouchableOpacity>
        </View>

        {/* Work Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>工作总结</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Icon name="clock-o" size={14} color="#6b7280" />
              <Text style={styles.summaryText}>准时到达</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="check-circle" size={14} color="#22c55e" />
              <Text style={styles.summaryText}>按时完成</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="star" size={14} color="#f59e0b" />
              <Text style={styles.summaryText}>获得好评</Text>
            </View>
          </View>
        </View>

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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  completedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 8,
  },
  commentContainer: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#15803d',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#22c55e',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 4,
  },
  paymentType: {
    fontSize: 14,
    color: '#15803d',
    marginBottom: 4,
  },
  workDuration: {
    fontSize: 14,
    color: '#15803d',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  skillTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  reportButton: {
    borderColor: '#ef4444',
  },
  reportButtonText: {
    color: '#ef4444',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default CompletedJobDetailScreen;