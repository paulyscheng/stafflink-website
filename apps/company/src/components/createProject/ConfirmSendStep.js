import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';

const ConfirmSendStep = ({ initialData, onNext, onBack, projectData }) => {
  const [formData, setFormData] = useState({
    notificationMethods: initialData?.notificationMethods || {
      inApp: true, // Always enabled by default
      sms: false,
      call: false,
    },
    replyDeadline: initialData?.replyDeadline || '2hours',
    autoAssign: initialData?.autoAssign || false,
  });

  const { t } = useLanguage();
  const modal = useModal();

  const replyDeadlines = [
    { id: '30min', name: '30分钟', icon: '⚡' },
    { id: '1hour', name: '1小时', icon: '🕐' },
    { id: '2hours', name: '2小时', icon: '🕑' },
    { id: '4hours', name: '4小时', icon: '🕒' },
    { id: '1day', name: '1天', icon: '📅' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (method, value) => {
    setFormData(prev => {
      let newMethods = { ...prev.notificationMethods };
      
      if (method === 'inApp') {
        // App notification can always be toggled
        newMethods[method] = value;
      } else if (method === 'sms' || method === 'call') {
        if (value) {
          // If enabling SMS or Call, disable the other one
          newMethods.sms = method === 'sms';
          newMethods.call = method === 'call';
        } else {
          // If disabling, just disable this method
          newMethods[method] = false;
        }
      }
      
      return {
        ...prev,
        notificationMethods: newMethods
      };
    });
  };

  const getProjectTypeName = (typeId) => {
    const typeMap = {
      // Construction & Renovation
      'home_renovation': t('homeRenovation'),
      'commercial_renovation': t('commercialRenovation'),
      'electrical_plumbing': t('electricalPlumbing'),
      'maintenance_service': t('maintenanceService'),
      'construction_project': t('constructionProject'),
      
      // Food & Beverage
      'coffee_tea': t('coffeeTea'),
      'chinese_cuisine': t('chineseCuisine'),
      'fast_food': t('fastFood'),
      'hotpot_bbq': t('hotpotBBQ'),
      'hotel_dining': t('hotelDining'),
      
      // Manufacturing
      'electronics_mfg': t('electronicsMfg'),
      'textile_mfg': t('textileMfg'),
      'food_processing': t('foodProcessing'),
      'mechanical_mfg': t('mechanicalMfg'),
      'packaging_printing': t('packagingPrinting'),
      
      // Logistics & Warehousing
      'express_delivery': t('expressDelivery'),
      'warehouse_ops': t('warehouseOps'),
      'moving_service': t('movingService'),
      'freight_handling': t('freightHandling'),
      'inventory_mgmt': t('inventoryMgmt'),
      
      // General Services
      'cleaning_service': t('cleaningService'),
      'security_service': t('securityService'),
      'landscaping': t('landscaping'),
      'event_service': t('eventService'),
      'emergency_service': t('emergencyService'),
    };
    return typeMap[typeId] || typeId;
  };

  const getSkillName = (skillId) => {
    const skillMap = {
      'plumbing': t('plumbingInstall'),
      'electrical': t('electrician'),
      'carpentry': t('carpentry'),
      'painting': t('painting'),
      'tiling': t('tiling'),
      'welding': t('welding'),
      'cleaning': t('cleaning'),
      'general': t('general')
    };
    return skillMap[skillId] || skillId;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getSelectedWorkerCount = () => {
    return projectData?.selectedWorkers?.length || 0;
  };

  const getTotalEstimatedCost = () => {
    const hourlyRate = projectData?.hourlyRate ? parseFloat(projectData.hourlyRate) : 0;
    const estimatedHours = projectData?.estimatedHours ? parseFloat(projectData.estimatedHours) : 0;
    const workerCount = getSelectedWorkerCount();
    return hourlyRate * estimatedHours * workerCount;
  };

  const handleComplete = () => {
    modal.confirm(
      t('confirmSendTitle'),
      t('confirmSendMessage').replace('{count}', getSelectedWorkerCount()),
      () => {
        // Simulate sending process
        modal.success(
          t('success'),
          t('projectCreatedSuccessfully'),
          () => onNext({ ...formData, projectData })
        );
      }
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('confirmSend')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Project Overview */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('projectOverview')}</Text>
          
          {/* Project Information Group */}
          <View style={styles.overviewGroup}>
            <View style={styles.groupHeader}>
              <Icon name="folder-o" size={16} color="#3b82f6" />
              <Text style={styles.groupTitle}>项目信息</Text>
            </View>
            <View style={styles.groupContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>{projectData?.projectName || '-'}</Text>
                <Text style={styles.infoSubtitle}>· {getProjectTypeName(projectData?.projectType)}</Text>
              </View>
              <View style={styles.addressRow}>
                <Icon name="map-marker" size={14} color="#6b7280" />
                <Text style={styles.addressText}>{projectData?.projectAddress || '-'}</Text>
              </View>
            </View>
          </View>

          {/* Time Schedule Group */}
          <View style={styles.overviewGroup}>
            <View style={styles.groupHeader}>
              <Icon name="clock-o" size={16} color="#10b981" />
              <Text style={styles.groupTitle}>时间安排</Text>
            </View>
            <View style={styles.groupContent}>
              <View style={styles.timeInfoRow}>
                <Icon name="calendar" size={14} color="#6b7280" />
                <Text style={styles.timeInfoText}>
                  {formatDate(projectData?.startDate)} - {formatDate(projectData?.endDate)}
                </Text>
              </View>
              <View style={styles.timeInfoRow}>
                <Icon name="clock-o" size={14} color="#6b7280" />
                <Text style={styles.timeInfoText}>
                  {projectData?.startTime} - {projectData?.endTime}
                </Text>
              </View>
            </View>
          </View>

          {/* Personnel Requirements Group */}
          <View style={styles.overviewGroup}>
            <View style={styles.groupHeader}>
              <Icon name="users" size={16} color="#f59e0b" />
              <Text style={styles.groupTitle}>人员需求</Text>
            </View>
            <View style={styles.groupContent}>
              <View style={styles.skillsRow}>
                <Icon name="wrench" size={14} color="#6b7280" />
                <View style={styles.skillsContainer}>
                  {projectData?.requiredSkills?.map((skill) => (
                    <View key={skill} style={styles.modernSkillChip}>
                      <Text style={styles.modernSkillText}>{getSkillName(skill)}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.countRow}>
                <Icon name="user-plus" size={14} color="#6b7280" />
                <Text style={styles.countText}>
                  需要{projectData?.requiredWorkers || 0}人，已选{getSelectedWorkerCount()}人
                </Text>
              </View>
              {projectData?.hourlyRate && (
                <View style={styles.priceRow}>
                  <Icon name="money" size={14} color="#6b7280" />
                  <Text style={styles.priceText}>
                    {t('currency')}{projectData.hourlyRate}/{t('hour')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('notificationSettings')}</Text>
          <Text style={styles.sectionSubtitle}>{t('notificationSubtitle')}</Text>
          
          <View style={styles.notificationCard}>
            <View style={styles.notificationOption}>
              <View style={styles.notificationLeft}>
                <Icon name="bell" size={20} color="#3b82f6" />
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>{t('inAppNotification')}</Text>
                  <Text style={styles.notificationSubtitle}>{t('inAppNotificationDesc')}</Text>
                </View>
              </View>
              <Switch
                value={formData.notificationMethods.inApp}
                onValueChange={(value) => handleNotificationChange('inApp', value)}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                thumbColor={formData.notificationMethods.inApp ? '#ffffff' : '#f3f4f6'}
              />
            </View>
            
            <View style={[styles.notificationOption, styles.featuredOption]}>
              <View style={styles.notificationLeft}>
                <View style={styles.aiIconContainer}>
                  <Icon name="phone" size={20} color="#ffffff" />
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                </View>
                <View style={styles.notificationTextContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notificationTitle}>{t('aiPhoneNotification')}</Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>{t('recommended')}</Text>
                    </View>
                  </View>
                  <Text style={styles.notificationSubtitle}>
                    {t('aiPhoneNotificationDesc')}
                    {formData.notificationMethods.sms && (
                      <Text style={styles.conflictText}>{t('smsSelected')}</Text>
                    )}
                  </Text>
                  <Text style={styles.featureHighlight}>{t('aiFeatureHighlight')}</Text>
                </View>
              </View>
              <Switch
                value={formData.notificationMethods.call}
                onValueChange={(value) => handleNotificationChange('call', value)}
                trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
                thumbColor={formData.notificationMethods.call ? '#ffffff' : '#f3f4f6'}
                disabled={formData.notificationMethods.sms}
              />
            </View>
            
            <View style={styles.notificationOption}>
              <View style={styles.notificationLeft}>
                <Icon name="comment" size={20} color="#10b981" />
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>{t('smsNotification')}</Text>
                  <Text style={styles.notificationSubtitle}>
                    {t('smsNotificationDesc')}
                    {formData.notificationMethods.call && (
                      <Text style={styles.conflictText}>{t('aiPhoneSelected')}</Text>
                    )}
                  </Text>
                </View>
              </View>
              <Switch
                value={formData.notificationMethods.sms}
                onValueChange={(value) => handleNotificationChange('sms', value)}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={formData.notificationMethods.sms ? '#ffffff' : '#f3f4f6'}
                disabled={formData.notificationMethods.call}
              />
            </View>
          </View>
        </View>

        {/* Reply Deadline */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('replyDeadline')}</Text>
          <Text style={styles.sectionSubtitle}>{t('replyDeadlineSubtitle')}</Text>
          
          <View style={styles.deadlineContainer}>
            {replyDeadlines.map((deadline) => (
              <TouchableOpacity
                key={deadline.id}
                style={[
                  styles.deadlineOption,
                  formData.replyDeadline === deadline.id && styles.selectedDeadlineOption
                ]}
                onPress={() => handleInputChange('replyDeadline', deadline.id)}
              >
                <Text style={styles.deadlineIcon}>{deadline.icon}</Text>
                <Text style={[
                  styles.deadlineText,
                  formData.replyDeadline === deadline.id && styles.selectedDeadlineText
                ]}>
                  {deadline.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auto Assignment */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.autoAssignContainer}
            onPress={() => handleInputChange('autoAssign', !formData.autoAssign)}
          >
            <View style={styles.autoAssignLeft}>
              <Icon name="magic" size={20} color="#8b5cf6" />
              <View style={styles.autoAssignTextContainer}>
                <Text style={styles.autoAssignTitle}>{t('smartAutoAssign')}</Text>
                <Text style={styles.autoAssignSubtitle}>{t('smartAutoAssignDesc')}</Text>
              </View>
            </View>
            <Switch
              value={formData.autoAssign}
              onValueChange={(value) => handleInputChange('autoAssign', value)}
              trackColor={{ false: '#d1d5db', true: '#8b5cf6' }}
              thumbColor={formData.autoAssign ? '#ffffff' : '#f3f4f6'}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.backButtonBottom}
          onPress={onBack}
        >
          <Icon name="arrow-left" size={16} color="#374151" />
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Text style={styles.completeButtonText}>{t('sendProjectInvitation')}</Text>
          <Icon name="send" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 2,
    textAlign: 'right',
  },
  costValue: {
    color: '#dc2626',
    fontWeight: '600',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    flex: 2,
  },
  skillChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  skillChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 16,
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  deadlineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deadlineOption: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  selectedDeadlineOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  deadlineIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  deadlineText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDeadlineText: {
    color: '#ffffff',
  },
  autoAssignContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  autoAssignLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  autoAssignTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  autoAssignTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  autoAssignSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButtonBottom: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  completeButton: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  conflictText: {
    fontSize: 12,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  featuredOption: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  aiIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    backgroundColor: '#8b5cf6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  aiBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendedBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  featureHighlight: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
    marginTop: 4,
  },
  // New overview design styles
  overviewGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  groupContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  timeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInfoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  skillsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 8,
    gap: 6,
    flex: 1,
  },
  modernSkillChip: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernSkillText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default ConfirmSendStep;