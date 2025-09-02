import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ApiService from '../services/api';

const ConfirmJobScreen = ({ navigation, route }) => {
  const { jobId } = route.params;
  const [jobDetail, setJobDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [qualityRating, setQualityRating] = useState(0); // 默认为0，表示未评分
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // 获取工作详情
  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getJobDetail(jobId);
      
      if (response.success) {
        setJobDetail(response.data);
        // 锁定为原定金额，不允许修改
        const originalAmount = response.data.wage_offer || response.data.payment_amount || 0;
        setPaymentAmount(String(originalAmount));
      }
    } catch (error) {
      console.error('Failed to fetch job detail:', error);
      Alert.alert('错误', '获取工作详情失败');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  // 确认工作完成
  const confirmJob = async () => {
    // 验证必填项
    if (qualityRating === 0) {
      Alert.alert('提示', '请选择质量评分');
      return;
    }
    
    // 使用原定金额
    const finalAmount = jobDetail?.wage_offer || jobDetail?.payment_amount || paymentAmount;
    
    Alert.alert(
      '确认工作',
      `确认工作已完成并支付 ¥${finalAmount} 给工人？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            try {
              setConfirming(true);
              const response = await ApiService.confirmCompanyWork({
                jobRecordId: jobId,
                qualityRating,
                confirmationNotes,
                paymentAmount: parseFloat(finalAmount),
              });

              if (response.success) {
                Alert.alert(
                  '成功',
                  '工作已确认完成',
                  [{ text: '确定', onPress: () => navigation.goBack() }]
                );
              } else {
                Alert.alert('错误', response.error || '确认失败');
              }
            } catch (error) {
              console.error('Failed to confirm job:', error);
              Alert.alert('错误', '确认工作失败');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const calculateWorkDuration = () => {
    if (!jobDetail?.start_work_time || !jobDetail?.complete_time) {
      return '未知';
    }
    const start = new Date(jobDetail.start_work_time);
    const end = new Date(jobDetail.complete_time);
    const diff = end - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  const openImage = (uri) => {
    setSelectedImage(uri);
    setShowImageModal(true);
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>确认工作完成</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 工人信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>工人信息</Text>
          <View style={styles.workerCard}>
            <View style={styles.workerInfo}>
              {jobDetail?.worker_photo ? (
                <Image source={{ uri: jobDetail.worker_photo }} style={styles.workerAvatar} />
              ) : (
                <View style={[styles.workerAvatar, styles.avatarPlaceholder]}>
                  <Icon name="user" size={30} color="#9ca3af" />
                </View>
              )}
              <View style={styles.workerDetails}>
                <Text style={styles.workerName}>{jobDetail?.worker_name}</Text>
                <Text style={styles.workerPhone}>{jobDetail?.worker_phone}</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                      key={star}
                      name={star <= (jobDetail?.worker_rating || 4.5) ? 'star' : 'star-o'}
                      size={14}
                      color="#f59e0b"
                    />
                  ))}
                  <Text style={styles.ratingText}>{jobDetail?.worker_rating || 4.5}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 项目信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>项目信息</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>项目名称</Text>
              <Text style={styles.infoValue}>{jobDetail?.project_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>工作地址</Text>
              <Text style={styles.infoValue}>{jobDetail?.project_address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>签到时间</Text>
              <Text style={styles.infoValue}>{formatDate(jobDetail?.arrival_time)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>开始时间</Text>
              <Text style={styles.infoValue}>{formatDate(jobDetail?.start_work_time)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>完成时间</Text>
              <Text style={styles.infoValue}>{formatDate(jobDetail?.complete_time)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>工作时长</Text>
              <Text style={styles.infoValue}>{calculateWorkDuration()}</Text>
            </View>
          </View>
        </View>

        {/* 工作照片 */}
        {jobDetail?.work_photos && jobDetail.work_photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>工作照片</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.photosContainer}>
                {jobDetail.work_photos.map((photo, index) => (
                  <TouchableOpacity key={index} onPress={() => openImage(photo)}>
                    <Image source={{ uri: photo }} style={styles.workPhoto} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 完成说明 */}
        {jobDetail?.complete_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>完成说明</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{jobDetail.complete_notes}</Text>
            </View>
          </View>
        )}

        {/* 质量评分 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            质量评分
            {jobDetail?.status === 'completed' && <Text style={styles.requiredMark}> *</Text>}
          </Text>
          <View style={styles.ratingSection}>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => jobDetail?.status === 'completed' && setQualityRating(star)}
                  disabled={jobDetail?.status !== 'completed'}
                >
                  <Icon
                    name={star <= (jobDetail?.quality_rating || qualityRating) ? 'star' : 'star-o'}
                    size={32}
                    color={star <= (jobDetail?.quality_rating || qualityRating) ? "#f59e0b" : "#d1d5db"}
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingLabel}>
              {(jobDetail?.quality_rating || qualityRating) === 0 ? '请选择评分' :
               (jobDetail?.quality_rating || qualityRating) === 5 ? '非常满意' :
               (jobDetail?.quality_rating || qualityRating) === 4 ? '满意' :
               (jobDetail?.quality_rating || qualityRating) === 3 ? '一般' :
               (jobDetail?.quality_rating || qualityRating) === 2 ? '不满意' : '非常不满意'}
            </Text>
            {jobDetail?.status === 'completed' && qualityRating === 0 && (
              <Text style={styles.ratingHint}>请点击星星进行评分</Text>
            )}
          </View>
        </View>

        {/* 确认说明 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>确认说明{jobDetail?.status === 'completed' ? '（选填）' : ''}</Text>
          <TextInput
            style={[styles.textInput, jobDetail?.status !== 'completed' && styles.readOnlyInput]}
            placeholder={jobDetail?.status === 'completed' ? "请输入对工作的评价或说明..." : "无"}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={jobDetail?.confirmation_notes || confirmationNotes}
            onChangeText={setConfirmationNotes}
            editable={jobDetail?.status === 'completed'}
          />
        </View>

        {/* 支付金额 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>支付金额</Text>
          <View style={styles.paymentSection}>
            <Text style={styles.currencySymbol}>¥</Text>
            <Text style={styles.paymentDisplay}>
              {jobDetail?.payment_amount || paymentAmount || '0.00'}
            </Text>
            <Text style={styles.paymentType}>
              {jobDetail?.wage_type === 'hourly' ? '/小时' :
               jobDetail?.wage_type === 'daily' ? '/天' : ''}
            </Text>
          </View>
          <View style={styles.paymentNote}>
            <Icon name="info-circle" size={14} color="#6b7280" />
            <Text style={styles.paymentNoteText}>
              支付金额为邀请时约定的工资，确保公平交易
            </Text>
          </View>
          
          {/* 如果未来需要调整金额的功能 */}
          {false && (
            <TouchableOpacity style={styles.adjustButton} onPress={() => {
              Alert.alert(
                '调整金额',
                '调整支付金额需要工人同意。是否发送调整申请？',
                [
                  { text: '取消', style: 'cancel' },
                  { text: '发送申请', onPress: () => {
                    Alert.alert('提示', '金额调整功能正在开发中');
                  }}
                ]
              );
            }}>
              <Text style={styles.adjustButtonText}>申请调整金额</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 操作按钮 - 根据状态显示不同按钮 */}
        {jobDetail?.status === 'completed' ? (
          <TouchableOpacity
            style={[styles.confirmButton, confirming && styles.disabledButton]}
            onPress={confirmJob}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Icon name="check-circle" size={20} color="#ffffff" />
                <Text style={styles.confirmButtonText}>确认工作完成</Text>
              </>
            )}
          </TouchableOpacity>
        ) : jobDetail?.status === 'confirmed' ? (
          <TouchableOpacity
            style={[styles.payButton]}
            onPress={() => navigation.navigate('Payment', {
              jobId: jobDetail.id,
              amount: jobDetail.payment_amount,
              workerName: jobDetail.worker_name,
              projectName: jobDetail.project_name
            })}
          >
            <Icon name="credit-card" size={20} color="#ffffff" />
            <Text style={styles.confirmButtonText}>进行支付</Text>
          </TouchableOpacity>
        ) : jobDetail?.status === 'paid' ? (
          <View style={styles.completedStatus}>
            <Icon name="check-circle" size={24} color="#22c55e" />
            <Text style={styles.completedText}>交易已完成</Text>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 图片查看模态框 */}
      <Modal
        visible={showImageModal}
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setShowImageModal(false)}
        >
          <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowImageModal(false)}
          >
            <Icon name="times" size={30} color="#ffffff" />
          </TouchableOpacity>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  workerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  workerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  photosContainer: {
    flexDirection: 'row',
  },
  workPhoto: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  ratingSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  starContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  star: {
    marginHorizontal: 6,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  requiredMark: {
    color: '#ef4444',
    fontSize: 16,
  },
  ratingHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#22c55e',
    fontWeight: '600',
    marginRight: 8,
  },
  paymentInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  paymentDisplay: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  paymentType: {
    fontSize: 16,
    color: '#6b7280',
  },
  originalAmount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  paymentNoteText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  adjustButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  readOnlyInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  readOnlyPayment: {
    color: '#374151',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
  bottomSpacer: {
    height: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
  },
});

export default ConfirmJobScreen;