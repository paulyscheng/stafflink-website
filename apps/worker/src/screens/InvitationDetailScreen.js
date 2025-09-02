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
  Linking,
  Platform,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const InvitationDetailScreen = ({ route, navigation }) => {
  const { notification } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (notification) {
      // 从通知中提取数据
      const data = {
        id: notification.invitation_id,
        projectName: notification.metadata?.projectName || '项目',
        companyName: notification.metadata?.companyName || '企业',
        wageOffer: notification.metadata?.wageOffer || 0,
        wageType: notification.metadata?.wageType || 'daily',
        location: notification.metadata?.location || '待定',
        startDate: notification.metadata?.startDate || new Date().toISOString(),
        duration: notification.metadata?.duration || '待定',
        requirements: notification.metadata?.requirements || [],
        description: notification.message,
        companyRating: notification.metadata?.companyRating || 4.5,
        cooperationCount: notification.metadata?.cooperationCount || 0,
        contactName: notification.metadata?.contactName || '项目负责人',
        contactPhone: notification.metadata?.contactPhone || '',
      };
      setInvitationData(data);
    }
  }, [notification]);

  // 处理接受邀请
  const handleAccept = async () => {
    Alert.alert(
      '确认接受',
      '您确定要接受这个工作邀请吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认接受',
          style: 'default',
          onPress: async () => {
            setResponding(true);
            try {
              const token = await AsyncStorage.getItem('authToken');
              
              // 这里应该调用真实的API
              // const response = await fetch(`${API_URL}/invitations/${invitationData.id}/respond`, {
              //   method: 'PUT',
              //   headers: {
              //     'Authorization': `Bearer ${token}`,
              //     'Content-Type': 'application/json',
              //   },
              //   body: JSON.stringify({ status: 'accepted' })
              // });

              // 模拟成功
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              Alert.alert(
                '接受成功',
                '您已成功接受工作邀请，请按时到达工作地点。',
                [
                  {
                    text: '查看我的工作',
                    onPress: () => navigation.navigate('Main', { screen: 'Jobs' })
                  }
                ]
              );
            } catch (error) {
              Alert.alert('错误', '操作失败，请稍后重试');
            } finally {
              setResponding(false);
            }
          }
        }
      ]
    );
  };

  // 处理拒绝邀请
  const handleReject = async () => {
    Alert.alert(
      '确认拒绝',
      '您确定要拒绝这个工作邀请吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认拒绝',
          style: 'destructive',
          onPress: async () => {
            setResponding(true);
            try {
              const token = await AsyncStorage.getItem('authToken');
              
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              Alert.alert(
                '已拒绝',
                '您已拒绝该工作邀请',
                [
                  {
                    text: '返回',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              Alert.alert('错误', '操作失败，请稍后重试');
            } finally {
              setResponding(false);
            }
          }
        }
      ]
    );
  };

  // 拨打电话
  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // 查看地图
  const handleViewMap = (address) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${address}`,
      android: `geo:0,0?q=${address}`,
    });
    Linking.openURL(url);
  };

  if (!invitationData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>工作邀请</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 企业信息卡片 */}
        <View style={styles.companyCard}>
          <View style={styles.companyHeader}>
            <View style={styles.companyIcon}>
              <Icon name="business-outline" size={32} color="#2563EB" />
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{invitationData.companyName}</Text>
              <View style={styles.companyStats}>
                <View style={styles.statItem}>
                  <Icon name="star" size={16} color="#F59E0B" />
                  <Text style={styles.statText}>{invitationData.companyRating}</Text>
                </View>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statText}>
                  已合作 {invitationData.cooperationCount} 次
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.viewCompanyButton}>
            <Text style={styles.viewCompanyText}>查看企业详情</Text>
            <Icon name="chevron-forward-outline" size={16} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* 项目信息 */}
        <View style={styles.projectCard}>
          <Text style={styles.sectionTitle}>项目信息</Text>
          
          <View style={styles.projectHeader}>
            <Icon name="briefcase-outline" size={20} color="#2563EB" />
            <Text style={styles.projectName}>{invitationData.projectName}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="cash-outline" size={20} color="#059669" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>薪资待遇</Text>
                <Text style={styles.infoValueHighlight}>
                  ¥{invitationData.wageOffer}
                  {invitationData.wageType === 'daily' ? '/天' : '/小时'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="location-outline" size={20} color="#DC2626" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>工作地点</Text>
                <Text style={styles.infoValue}>{invitationData.location}</Text>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => handleViewMap(invitationData.location)}
                >
                  <Icon name="map-outline" size={14} color="#2563EB" />
                  <Text style={styles.mapButtonText}>查看地图</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="calendar-outline" size={20} color="#7C3AED" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>开始时间</Text>
                <Text style={styles.infoValue}>
                  {new Date(invitationData.startDate).toLocaleDateString('zh-CN')}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Icon name="time-outline" size={20} color="#F59E0B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>预计工期</Text>
                <Text style={styles.infoValue}>{invitationData.duration}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 工作要求 */}
        <View style={styles.requirementCard}>
          <Text style={styles.sectionTitle}>工作要求</Text>
          {invitationData.requirements.length > 0 ? (
            invitationData.requirements.map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <Icon name="checkmark-circle-outline" size={16} color="#059669" />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.requirementItem}>
                <Icon name="checkmark-circle-outline" size={16} color="#059669" />
                <Text style={styles.requirementText}>需要相关工作经验</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="checkmark-circle-outline" size={16} color="#059669" />
                <Text style={styles.requirementText}>自带基础工具</Text>
              </View>
              <View style={styles.requirementItem}>
                <Icon name="checkmark-circle-outline" size={16} color="#059669" />
                <Text style={styles.requirementText}>按时到岗，服从安排</Text>
              </View>
            </>
          )}
        </View>

        {/* 项目描述 */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>项目描述</Text>
          <Text style={styles.descriptionText}>
            {invitationData.description || '暂无详细描述'}
          </Text>
        </View>

        {/* 联系人信息 */}
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>联系人</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactLeft}>
              <Icon name="person-circle-outline" size={40} color="#6B7280" />
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{invitationData.contactName}</Text>
                <Text style={styles.contactPhone}>
                  {invitationData.contactPhone || '暂无联系方式'}
                </Text>
              </View>
            </View>
            {invitationData.contactPhone && (
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCall(invitationData.contactPhone)}
              >
                <Icon name="call" size={20} color="#FFF" />
                <Text style={styles.callButtonText}>拨打</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 底部操作按钮 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
          disabled={responding}
        >
          <Text style={styles.rejectButtonText}>拒绝</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={handleAccept}
          disabled={responding}
        >
          {responding ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Icon name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.acceptButtonText}>接受邀请</Text>
            </>
          )}
        </TouchableOpacity>
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
  companyCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  companyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  statDivider: {
    marginHorizontal: 8,
    color: '#D1D5DB',
  },
  viewCompanyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
  },
  viewCompanyText: {
    fontSize: 14,
    color: '#2563EB',
    marginRight: 4,
  },
  projectCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    flex: 1,
  },
  infoContent: {
    marginLeft: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  infoValueHighlight: {
    fontSize: 20,
    color: '#059669',
    fontWeight: '700',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mapButtonText: {
    fontSize: 12,
    color: '#2563EB',
    marginLeft: 4,
  },
  requirementCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  descriptionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactDetails: {
    marginLeft: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  bottomSpacer: {
    height: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  rejectButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptButton: {
    backgroundColor: '#2563EB',
    marginLeft: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
});

export default InvitationDetailScreen;