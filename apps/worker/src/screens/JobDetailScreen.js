import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useJobs } from '../contexts/JobContext';
import ApiService from '../services/api';

const JobDetailScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState(''); // 'accept' or 'reject'
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { t } = useLanguage();
  const { getJob, respondToJob } = useJobs();
  
  // 获取邀请详情
  const fetchInvitationDetail = async () => {
    // 先尝试获取本地数据
    const localJob = getJob(jobId);
    
    // 如果是模拟数据或用户未登录，直接使用本地数据
    if (localJob && (!localJob.id || localJob.id.toString().startsWith('job_'))) {
      setInvitation(localJob);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await ApiService.getInvitationDetail(jobId);
      setInvitation(data);
    } catch (error) {
      console.error('Failed to load invitation detail:', error);
      // 如果是网络错误，显示更友好的错误信息
      if (error.message && error.message.includes('无法连接到服务器')) {
        Alert.alert(
          '网络错误',
          '无法连接到服务器，请检查网络连接后重试',
          [{ text: '确定' }]
        );
      } else if (error.message !== '未登录') {
        console.log('Using local job data due to error:', error.message);
      }
      // 尝试使用本地数据
      if (localJob) {
        setInvitation(localJob);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitationDetail();
  }, [jobId]);
  
  const job = invitation || getJob(jobId);
  console.log("job data is:", job)

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>工作详情未找到</Text>
      </SafeAreaView>
    );
  }

  const formatPayment = () => {
    if (job.paymentType === 'hourly') {
      return `¥${job.budgetRange}/小时`;
    } else if (job.paymentType === 'daily') {
      return `¥${job.budgetRange}/天`;
    } else if (job.paymentType === 'fixed') {
      return `¥${job.budgetRange}（一口价）`;
    }
    return '面议';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
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

  const handleResponse = (type) => {
    setResponseType(type);
    setShowResponseModal(true);
  };

  const confirmResponse = async () => {
    if (responseType === 'accepted' && !responseMessage.trim()) {
      Alert.alert('提示', '请填写回复信息');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // 调用真实API
      const status = responseType;  // responseType 已经是 'accepted' 或 'rejected'
      const result = await ApiService.respondToInvitation(
        jobId,
        status,
        responseMessage || null
      );
      
      // 更新本地状态
      respondToJob(jobId, responseType, responseMessage);
      
      setShowResponseModal(false);
      Alert.alert(
        '成功',
        responseType === 'accepted' ? '已接受工作邀请' : '已拒绝工作邀请',
        [{ text: '确定', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
      // 显示错误消息
      Alert.alert(
        '错误',
        error.message || '操作失败，请重试',
        [{ text: '确定' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const oldConfirmResponse = () => {
    if (responseType === 'accept' && !responseMessage.trim()) {
      Alert.alert('提示', '请填写回复信息');
      return;
    }

    respondToJob(job.id, responseType, responseMessage);
    setShowResponseModal(false);
    setResponseMessage('');
    
    Alert.alert(
      '成功',
      responseType === 'accept' ? '已接受工作邀请' : '已拒绝工作邀请',
      [{ text: '确定', onPress: () => navigation.goBack() }]
    );
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
        <Text style={styles.headerTitle}>工作详情</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Job Overview */}
        <View style={styles.section}>
          <View style={styles.jobHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.jobTitle}>{job.projectName}</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(job.urgency) }]}>
                <Text style={styles.urgencyText}>{getUrgencyText(job.urgency)}</Text>
              </View>
            </View>
            <Text style={styles.companyName}>{job.companyName}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#f59e0b" />
              <Text style={styles.ratingText}>企业评分 {job.companyRating}</Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.paymentCard}>
            <Text style={styles.paymentAmount}>{formatPayment()}</Text>
            <Text style={styles.paymentNote}>预计工作时长：{job.estimatedDuration}</Text>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>工作详情</Text>
          
          <View style={styles.detailItem}>
            <Icon name="map-marker" size={16} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>工作地点</Text>
              <Text style={styles.detailValue}>{job.projectAddress}</Text>
              <Text style={styles.distanceText}>距离您 {job.distance}km</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon name="calendar" size={16} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>工作时间</Text>
              <Text style={styles.detailValue}>
                {formatDate(job.startDate)} - {formatDate(job.endDate)}
              </Text>
              <Text style={styles.detailSubValue}>
                每日 {job.startTime} - {job.endTime}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon name="wrench" size={16} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>技能要求</Text>
              <View style={styles.skillsContainer}>
                {(job.requiredSkills || []).map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Icon name="users" size={16} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>需要人数</Text>
              <Text style={styles.detailValue}>{job.requiredWorkers}人</Text>
            </View>
          </View>
        </View>

        {/* Work Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>工作描述</Text>
          <Text style={styles.description}>{job.workDescription}</Text>
          
          {job.timeNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>时间备注</Text>
              <Text style={styles.notesText}>{job.timeNotes}</Text>
            </View>
          )}
        </View>

        {/* Company Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系方式</Text>
          <View style={styles.contactContainer}>
            <View style={styles.contactItem}>
              <Icon name="user" size={16} color="#6b7280" />
              <Text style={styles.contactText}>{job.companyContact.name}</Text>
            </View>
            <TouchableOpacity style={styles.contactItem}>
              <Icon name="phone" size={16} color="#3b82f6" />
              <Text style={[styles.contactText, { color: '#3b82f6' }]}>
                {job.companyContact.phone}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      {job.status === 'pending' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleResponse('rejected')}
          >
            <Text style={styles.rejectButtonText}>拒绝</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleResponse('accepted')}
          >
            <Text style={styles.acceptButtonText}>接受工作</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {responseType === 'accepted' ? '接受工作' : '拒绝工作'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {responseType === 'accepted' 
                ? '请填写回复信息，让企业了解您的情况：' 
                : '请选择拒绝原因（可选）：'
              }
            </Text>
            
            <TextInput
              style={styles.messageInput}
              placeholder={responseType === 'accepted' 
                ? '例如：我有相关经验，可以准时到达...' 
                : '例如：时间不合适、距离太远等...'
              }
              value={responseMessage}
              onChangeText={setResponseMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowResponseModal(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton,
                  { backgroundColor: responseType === 'accepted' ? '#22c55e' : '#ef4444' }
                ]}
                onPress={confirmResponse}
              >
                <Text style={styles.modalConfirmText}>
                  {responseType === 'accepted' ? '确认接受' : '确认拒绝'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  jobHeader: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 4,
  },
  paymentCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  paymentNote: {
    fontSize: 14,
    color: '#15803d',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
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
  detailSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  distanceText: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
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
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  notesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#92400e',
  },
  contactContainer: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default JobDetailScreen;