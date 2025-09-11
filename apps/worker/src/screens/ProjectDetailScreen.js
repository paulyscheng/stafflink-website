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

const ProjectDetailScreen = ({ route, navigation }) => {
  const { notification } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    if (notification) {
      // 从通知中提取数据
      const data = {
        projectName: notification.metadata?.projectName || '项目',
        companyName: notification.metadata?.companyName || '企业',
        startTime: notification.metadata?.startTime || '待定',
        location: notification.metadata?.location || '待定',
        contact: notification.metadata?.contact || '项目负责人',
        contactPhone: notification.metadata?.contactPhone || '',
        duration: notification.metadata?.duration || '待定',
        wageOffer: notification.metadata?.wageOffer || 0,
        wageType: notification.metadata?.wageType || 'daily',
        workHours: notification.metadata?.workHours || 8,
        requirements: notification.metadata?.requirements || [],
        notes: notification.metadata?.notes || '',
        status: notification.metadata?.status || 'upcoming',
        date: notification.metadata?.date || new Date().toISOString(),
      };
      setProjectData(data);
    }
  }, [notification]);

  // 拨打电话
  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('提示', '暂无联系电话');
    }
  };

  // 查看地图导航
  const handleNavigation = (address) => {
    Alert.alert(
      '导航选择',
      '选择导航应用',
      [
        {
          text: '地图导航',
          onPress: () => {
            const url = Platform.select({
              ios: `maps:0,0?q=${address}`,
              android: `geo:0,0?q=${address}`,
            });
            Linking.openURL(url);
          }
        },
        {
          text: '高德地图',
          onPress: () => {
            const url = `amapuri://route/plan/?dlat=&dlon=&dname=${address}&dev=0&t=0`;
            Linking.openURL(url).catch(() => {
              Alert.alert('提示', '请先安装高德地图');
            });
          }
        },
        {
          text: '取消',
          style: 'cancel'
        }
      ]
    );
  };

  // 添加到日历
  const handleAddToCalendar = () => {
    Alert.alert(
      '添加提醒',
      '已添加到工作日程提醒',
      [{ text: '确定' }]
    );
  };

  // 确认到岗
  const handleConfirmArrival = () => {
    Alert.alert(
      '确认到岗',
      '确认您已到达工作地点？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            // 这里应该调用API确认到岗
            Alert.alert('成功', '已确认到岗，祝您工作顺利！');
          }
        }
      ]
    );
  };

  if (!projectData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isToday = new Date(projectData.date).toDateString() === new Date().toDateString();
  const statusConfig = {
    upcoming: { text: '即将开始', color: '#F59E0B', icon: 'time-outline' },
    ongoing: { text: '进行中', color: '#10B981', icon: 'play-circle-outline' },
    completed: { text: '已完成', color: '#6B7280', icon: 'checkmark-circle-outline' }
  };
  const status = statusConfig[projectData.status] || statusConfig.upcoming;

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>工作详情</Text>
        <TouchableOpacity onPress={handleAddToCalendar}>
          <Icon name="calendar-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 状态提醒卡片 */}
        {isToday && (
          <View style={[styles.alertCard, { backgroundColor: status.color + '10', borderColor: status.color }]}>
            <Icon name={status.icon} size={24} color={status.color} />
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: status.color }]}>
                今日工作提醒
              </Text>
              <Text style={styles.alertMessage}>
                {projectData.projectName} 将在 {projectData.startTime} 开始
              </Text>
            </View>
          </View>
        )}

        {/* 项目基本信息 */}
        <View style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <View style={styles.projectIconContainer}>
              <Icon name="construct-outline" size={32} color="#2563EB" />
            </View>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{projectData.projectName}</Text>
              <Text style={styles.companyName}>{projectData.companyName}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.text}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 时间地点信息 */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>工作安排</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Icon name="calendar-outline" size={20} color="#7C3AED" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>工作日期</Text>
              <Text style={styles.infoValue}>
                {new Date(projectData.date).toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Icon name="time-outline" size={20} color="#F59E0B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>开始时间</Text>
              <Text style={styles.infoValueHighlight}>{projectData.startTime}</Text>
              <Text style={styles.infoSubtext}>请提前15分钟到达</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Icon name="hourglass-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>预计工期</Text>
              <Text style={styles.infoValue}>{projectData.duration}</Text>
            </View>
          </View>
        </View>

        {/* 地点信息 */}
        <View style={styles.locationCard}>
          <Text style={styles.sectionTitle}>工作地点</Text>
          
          <View style={styles.locationInfo}>
            <Icon name="location" size={24} color="#DC2626" />
            <Text style={styles.locationText}>{projectData.location}</Text>
          </View>

          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={() => handleNavigation(projectData.location)}
          >
            <Icon name="navigate-outline" size={20} color="#FFF" />
            <Text style={styles.navigationButtonText}>开始导航</Text>
          </TouchableOpacity>

          <View style={styles.mapPlaceholder}>
            <Icon name="map-outline" size={48} color="#9CA3AF" />
            <Text style={styles.mapPlaceholderText}>地图预览</Text>
          </View>
        </View>

        {/* 薪资信息 */}
        {projectData.wageOffer > 0 && (
          <View style={styles.wageCard}>
            <Text style={styles.sectionTitle}>薪资方案</Text>
            
            {/* 薪资展示 */}
            <View style={styles.wageInfo}>
              <Icon name="cash-outline" size={24} color="#059669" />
              <View style={styles.wageTextContainer}>
                <Text style={styles.wageAmount}>
                  ¥{projectData.wageOffer}
                  <Text style={styles.wageUnit}>
                    {projectData.wageType === 'daily' ? '/天' : projectData.wageType === 'fixed' ? ' (固定)' : '/小时'}
                  </Text>
                </Text>
                <Text style={styles.wageSummary}>
                  {(() => {
                    if (projectData.wageType === 'hourly') {
                      const totalAmount = projectData.wageOffer * (projectData.workHours || 8);
                      return `预计收入: ¥${totalAmount.toFixed(0)}`;
                    } else if (projectData.wageType === 'daily') {
                      return `日薪收入: ¥${projectData.wageOffer}`;
                    } else if (projectData.wageType === 'fixed') {
                      return `项目总价: ¥${projectData.wageOffer}`;
                    }
                    return '';
                  })()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 工作要求 */}
        {projectData.requirements.length > 0 && (
          <View style={styles.requirementCard}>
            <Text style={styles.sectionTitle}>注意事项</Text>
            {projectData.requirements.map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <Icon name="alert-circle-outline" size={16} color="#F59E0B" />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 联系人 */}
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>现场负责人</Text>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactLeft}>
              <Icon name="person-circle-outline" size={40} color="#6B7280" />
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{projectData.contact}</Text>
                {projectData.contactPhone && (
                  <Text style={styles.contactPhone}>{projectData.contactPhone}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.contactActions}>
              <TouchableOpacity 
                style={styles.callButton}
                onPress={() => handleCall(projectData.contactPhone)}
              >
                <Icon name="call" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageButton}>
                <Icon name="chatbubble-outline" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contactTip}>
            <Icon name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.contactTipText}>
              如有问题请及时联系现场负责人
            </Text>
          </View>
        </View>

        {/* 备注 */}
        {projectData.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>备注说明</Text>
            <Text style={styles.notesText}>{projectData.notes}</Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 底部操作按钮 */}
      {projectData.status === 'upcoming' && isToday && (
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirmArrival}
          >
            <Icon name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.confirmButtonText}>确认到岗</Text>
          </TouchableOpacity>
        </View>
      )}
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: '#374151',
  },
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
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
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
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
    fontSize: 18,
    color: '#2563EB',
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  locationCard: {
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  navigationButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  wageCard: {
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
  wageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wageAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 8,
  },
  wageUnit: {
    fontSize: 14,
    fontWeight: '400',
  },
  wageTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  wageSummary: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  // 不再使用的样式 - 已整合到新的薪资方案展示中
  // wageCalculation: {},
  // calculationRow: {},
  // calculationLabel: {},
  // calculationValue: {},
  // calculationDivider: {},
  // calculationTotal: {},
  // wageFormula: {},
  // formulaText: {},
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
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
    marginBottom: 12,
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
  contactActions: {
    flexDirection: 'row',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  contactTipText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  notesCard: {
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
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
});

export default ProjectDetailScreen;