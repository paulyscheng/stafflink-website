import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const ActiveJobScreen = ({ route, navigation }) => {
  const { jobId } = route.params || {};
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // 获取工作详情
  const fetchJobDetail = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_URL}/jobs/detail/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data.data);
      } else {
        Alert.alert('错误', '获取工作详情失败');
      }
    } catch (error) {
      console.error('获取工作详情失败:', error);
      Alert.alert('错误', '网络请求失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 获取当前位置
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要位置权限才能签到');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('获取位置失败:', error);
      Alert.alert('错误', '获取位置失败，请确保GPS已开启');
      return null;
    }
  };

  // 工人签到
  const handleCheckIn = async () => {
    Alert.alert(
      '确认签到',
      '确认您已到达工作地点？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认签到',
          onPress: async () => {
            setProcessing(true);
            
            // 获取当前位置
            const location = await getCurrentLocation();
            if (!location) {
              setProcessing(false);
              return;
            }

            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`${API_URL}/jobs/worker/check-in`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  jobRecordId: jobId,
                  location,
                }),
              });

              const data = await response.json();
              
              if (response.ok) {
                Alert.alert('成功', '签到成功！', [
                  {
                    text: '确定',
                    onPress: () => fetchJobDetail(),
                  }
                ]);
              } else {
                Alert.alert('错误', data.error || '签到失败');
              }
            } catch (error) {
              Alert.alert('错误', '网络请求失败');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  // 开始工作
  const handleStartWork = async () => {
    Alert.alert(
      '开始工作',
      '确认开始工作？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            setProcessing(true);
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`${API_URL}/jobs/worker/start`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  jobRecordId: jobId,
                }),
              });

              const data = await response.json();
              
              if (response.ok) {
                Alert.alert('成功', '已开始工作', [
                  {
                    text: '确定',
                    onPress: () => fetchJobDetail(),
                  }
                ]);
              } else {
                Alert.alert('错误', data.error || '操作失败');
              }
            } catch (error) {
              Alert.alert('错误', '网络请求失败');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  // 完成工作
  const handleCompleteWork = () => {
    navigation.navigate('CompleteJob', { jobId, job });
  };

  useEffect(() => {
    fetchJobDetail();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobDetail();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>工作信息加载失败</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchJobDetail}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 状态配置
  const statusConfig = {
    invited: { text: '已邀请', color: '#6B7280', icon: 'mail-outline' },
    accepted: { text: '已接受', color: '#F59E0B', icon: 'checkmark-circle-outline' },
    arrived: { text: '已到岗', color: '#3B82F6', icon: 'location-outline' },
    working: { text: '工作中', color: '#10B981', icon: 'hammer-outline' },
    completed: { text: '已完成', color: '#8B5CF6', icon: 'checkmark-done-outline' },
    confirmed: { text: '已确认', color: '#059669', icon: 'shield-checkmark-outline' },
    paid: { text: '已支付', color: '#10B981', icon: 'wallet-outline' },
  };

  const currentStatus = statusConfig[job.status] || statusConfig.invited;

  // 计算工作时长
  const calculateWorkDuration = () => {
    if (!job.start_work_time) return null;
    const start = new Date(job.start_work_time);
    const end = job.complete_time ? new Date(job.complete_time) : new Date();
    const hours = Math.floor((end - start) / (1000 * 60 * 60));
    const minutes = Math.floor(((end - start) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>工作管理</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 状态卡片 */}
        <View style={[styles.statusCard, { backgroundColor: currentStatus.color + '10', borderColor: currentStatus.color }]}>
          <Icon name={currentStatus.icon} size={32} color={currentStatus.color} />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusTitle, { color: currentStatus.color }]}>
              {currentStatus.text}
            </Text>
            {job.status === 'working' && (
              <Text style={styles.statusSubtext}>
                已工作：{calculateWorkDuration() || '刚刚开始'}
              </Text>
            )}
          </View>
        </View>

        {/* 项目信息 */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Icon name="briefcase-outline" size={20} color="#2563EB" />
            <Text style={styles.cardTitle}>项目信息</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>项目名称</Text>
            <Text style={styles.infoValue}>{job.project_name}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>企业</Text>
            <Text style={styles.infoValue}>{job.company_name}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>工作地点</Text>
            <Text style={styles.infoValue}>{job.project_address}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>工作日期</Text>
            <Text style={styles.infoValue}>
              {new Date(job.work_date).toLocaleDateString('zh-CN')}
            </Text>
          </View>
        </View>

        {/* 薪资信息 */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Icon name="cash-outline" size={20} color="#059669" />
            <Text style={styles.cardTitle}>薪资信息</Text>
          </View>
          
          <View style={styles.wageInfo}>
            <Text style={styles.wageAmount}>
              ¥{job.wage_offer || job.payment_amount || 0}
            </Text>
            <Text style={styles.wageType}>
              {job.wage_type === 'daily' ? '/天' : job.wage_type === 'hourly' ? '/小时' : ''}
            </Text>
          </View>
          
          {job.actual_hours && (
            <Text style={styles.actualHours}>
              实际工时：{job.actual_hours} 小时
            </Text>
          )}
        </View>

        {/* 时间记录 */}
        {(job.arrival_time || job.start_work_time || job.complete_time) && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Icon name="time-outline" size={20} color="#7C3AED" />
              <Text style={styles.cardTitle}>时间记录</Text>
            </View>
            
            {job.arrival_time && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>签到时间</Text>
                  <Text style={styles.timelineValue}>
                    {new Date(job.arrival_time).toLocaleString('zh-CN')}
                  </Text>
                </View>
              </View>
            )}
            
            {job.start_work_time && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>开始工作</Text>
                  <Text style={styles.timelineValue}>
                    {new Date(job.start_work_time).toLocaleString('zh-CN')}
                  </Text>
                </View>
              </View>
            )}
            
            {job.complete_time && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#8B5CF6' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>完成时间</Text>
                  <Text style={styles.timelineValue}>
                    {new Date(job.complete_time).toLocaleString('zh-CN')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 联系人 */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Icon name="person-outline" size={20} color="#6B7280" />
            <Text style={styles.cardTitle}>联系人</Text>
          </View>
          
          <View style={styles.contactInfo}>
            <View>
              <Text style={styles.contactName}>{job.company_contact || '项目负责人'}</Text>
              <Text style={styles.contactPhone}>{job.company_phone || '暂无'}</Text>
            </View>
            {job.company_phone && (
              <TouchableOpacity style={styles.callButton}>
                <Icon name="call" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.bottomActions}>
        {job.status === 'accepted' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleCheckIn}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="location" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>签到</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {job.status === 'arrived' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.successButton]}
            onPress={handleStartWork}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="play-circle" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>开始工作</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {job.status === 'working' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteWork}
            disabled={processing}
          >
            <Icon name="checkmark-done-circle" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>完成工作</Text>
          </TouchableOpacity>
        )}
        
        {(job.status === 'completed' || job.status === 'confirmed') && (
          <View style={styles.completedInfo}>
            <Icon name="checkmark-circle" size={24} color="#059669" />
            <Text style={styles.completedText}>
              {job.status === 'completed' ? '等待企业确认' : '工作已确认'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  wageInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  wageAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#059669',
  },
  wageType: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  actualHours: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contactPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
  bottomActions: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  completeButton: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  completedText: {
    fontSize: 16,
    color: '#059669',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ActiveJobScreen;