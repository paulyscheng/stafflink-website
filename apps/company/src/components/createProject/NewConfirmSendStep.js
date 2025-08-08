import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';

const NewConfirmSendStep = ({ initialData, onNext, onBack, projectData }) => {
  const [formData, setFormData] = useState({
    notificationMethods: initialData?.notificationMethods || {
      inApp: true,
      sms: false,
      call: false,
    },
    replyDeadline: initialData?.replyDeadline || '1hour',
    autoAssign: initialData?.autoAssign || false,
  });

  const [showWorkersModal, setShowWorkersModal] = useState(false);

  const { t } = useLanguage();
  const modal = useModal();

  const replyDeadlines = [
    { id: '30min', name: '30分钟', icon: '⚡' },
    { id: '1hour', name: '1小时', icon: '🕐' },
    { id: '4hours', name: '4小时', icon: '🕒' },
    { id: '1day', name: '1天', icon: '📅' },
  ];

  const handleNotificationChange = (method, value) => {
    setFormData(prev => ({
      ...prev,
      notificationMethods: {
        ...prev.notificationMethods,
        [method]: value
      }
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper functions to get display data
  const getProjectTypeDisplay = () => {
    const typeMapping = {
      // Construction & Renovation
      'home_renovation': '建筑装修 > 家庭装修',
      'commercial_renovation': '建筑装修 > 商业装修',
      'electrical_plumbing': '建筑装修 > 水电工程',
      'maintenance_service': '建筑装修 > 维修服务',
      'construction_project': '建筑装修 > 建筑工程',
      
      // Food & Beverage
      'coffee_tea': '餐饮服务 > 咖啡茶饮',
      'chinese_cuisine': '餐饮服务 > 中式餐饮',
      'fast_food': '餐饮服务 > 快餐服务',
      'hotpot_bbq': '餐饮服务 > 火锅烧烤',
      'hotel_dining': '餐饮服务 > 酒店餐饮',
      
      // Manufacturing
      'electronics_mfg': '制造业 > 电子制造',
      'textile_mfg': '制造业 > 纺织制造',
      'food_processing': '制造业 > 食品加工',
      'mechanical_mfg': '制造业 > 机械制造',
      'packaging_printing': '制造业 > 包装印刷',
      
      // Logistics & Warehousing
      'express_delivery': '物流仓储 > 快递配送',
      'warehouse_ops': '物流仓储 > 仓库运营',
      'moving_service': '物流仓储 > 搬家服务',
      'freight_handling': '物流仓储 > 货运装卸',
      'inventory_mgmt': '物流仓储 > 库存管理',
      
      // General Services
      'cleaning_service': '综合服务 > 清洁服务',
      'security_service': '综合服务 > 安保服务',
      'landscaping': '综合服务 > 园林绿化',
      'event_service': '综合服务 > 活动服务',
      'emergency_service': '综合服务 > 应急维修',
    };
    return typeMapping[projectData?.projectType] || projectData?.projectType;
  };

  const getSkillsDisplay = () => {
    if (!projectData?.requiredSkills || projectData.requiredSkills.length === 0) {
      return '未设置';
    }
    
    // Convert skill IDs to Chinese names
    const skillMap = {
      'plumbingInstall': '水电安装',
      'electrician': '电工',
      'carpentry': '木工',
      'painting': '油漆',
      'tiling': '铺砖',
      'masonry': '泥瓦工',
      'waterproofing': '防水工',
      'ceilingInstall': '吊顶安装',
      'glassInstall': '玻璃安装',
      'plumber': '水工',
      'pipeInstall': '管道安装',
      'weakCurrent': '弱电',
      'locksmith': '锁匠',
      'applianceRepair': '家电维修',
      'rebarWorker': '钢筋工',
      'concreteWorker': '混凝土工',
      'welding': '焊接',
      'scaffoldWorker': '架子工',
      'surveyor': '测量员',
      'barista': '咖啡师',
      'waiter': '服务员',
      'cashier': '收银员',
      'cleaner': '清洁工',
      'chef': '厨师',
      'kitchenHelper': '厨房助理',
      'dishwasher': '洗碗工',
      'operator': '操作员',
      'deliveryWorker': '配送员',
      'bbqChef': '烧烤师',
      'foodRunner': '传菜员',
      'assemblyWorker': '装配工',
      'solderer': '焊接工',
      'qualityInspector': '质检员',
      'packagingWorker': '包装工',
      'machineOperator': '机械操作员',
      'sewingWorker': '缝纫工',
      'cuttingWorker': '裁剪工',
      'ironingWorker': '熨烫工',
      'foodProcessor': '食品处理员',
      'latheMachinist': '车床工',
      'assembler': '装配员',
      'materialHandler': '物料员',
      'printer': '印刷工',
      'bookbinder': '装订工',
      'courier': '快递员',
      'sorter': '分拣员',
      'loader': '装卸工',
      'driver': '司机',
      'stocker': '理货员',
      'forkliftOperator': '叉车工',
      'warehouseKeeper': '仓库管理员',
      'mover': '搬运工',
      'packer': '打包员',
      'furnitureAssembler': '家具安装工',
      'janitor': '保洁员',
      'windowCleaner': '玻璃清洁工',
      'carpetCleaner': '地毯清洁工',
      'securityGuard': '保安',
      'doorman': '门卫',
      'patrolOfficer': '巡逻员',
      'monitorOperator': '监控员',
      'gardener': '园丁',
      'treeTrimmer': '修树工',
      'irrigationWorker': '灌溉工',
      'planter': '种植工',
      'eventSetup': '活动布置',
      'audioTech': '音响师',
      'photographer': '摄影师',
      'glazier': '玻璃工',
      'tempWorker': '临时工',
    };
    
    const skillNames = projectData.requiredSkills.map(skillId => skillMap[skillId] || skillId);
    return skillNames.slice(0, 3).join('、') + (skillNames.length > 3 ? '等' : '');
  };

  const getWorkersCountDisplay = () => {
    if (projectData?.requiredWorkers === 'custom') {
      return `${projectData?.customWorkerCount}人`;
    }
    return `${projectData?.requiredWorkers}人`;
  };

  const getExperienceLevelDisplay = () => {
    const levels = {
      'beginner': '初级（1年以下经验）',
      'intermediate': '中级（1-3年经验）',
      'experienced': '高级（3年以上经验）'
    };
    return levels[projectData?.experienceLevel] || '未设置';
  };

  const getWorkTimeDisplay = () => {
    if (projectData?.projectType === 'recurring') {
      return `${projectData?.startDate} 至 ${projectData?.endDate}`;
    }
    return `${projectData?.startDate} 至 ${projectData?.endDate}`;
  };

  const getDailyTimeDisplay = () => {
    return `${projectData?.startTime} - ${projectData?.endTime}`;
  };

  const getWorkingDaysDisplay = () => {
    if (projectData?.timeNature === 'onetime') {
      return '一次性项目';
    }
    const dayMapping = {
      'monday': '周一',
      'tuesday': '周二',
      'wednesday': '周三',
      'thursday': '周四',
      'friday': '周五',
      'saturday': '周六',
      'sunday': '周日'
    };
    const days = projectData?.workingDays?.map(day => dayMapping[day]).join('、') || '';
    return `重复性项目 (${days})`;
  };

  const getPaymentMethodDisplay = () => {
    const methods = {
      'hourly': '按小时结算',
      'daily': '按天结算',
      'total': '一口价'
    };
    return methods[projectData?.paymentType] || '未设置';
  };

  // 计算两个日期之间的天数
  const calculateDaysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 包含结束日
    
    return diffDays;
  };

  // 计算每天的工作小时数
  const calculateDailyHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 8; // 默认8小时
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    return totalMinutes / 60;
  };

  // 计算循环项目的实际工作天数
  const calculateRecurringDays = (startDate, endDate, workingDays) => {
    if (!startDate || !endDate || !workingDays || workingDays.length === 0) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalDays = 0;
    
    // 工作日映射（JavaScript中周日是0，周一是1...周六是6）
    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    
    const selectedDays = workingDays.map(day => dayMap[day]);
    
    // 遍历日期范围内的每一天
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (selectedDays.includes(d.getDay())) {
        totalDays++;
      }
    }
    
    return totalDays;
  };

  const calculateEstimatedCost = () => {
    const workerCount = projectData?.requiredWorkers === 'custom' 
      ? parseInt(projectData?.customWorkerCount) || 0 
      : projectData?.requiredWorkers || 0;
    const rate = parseFloat(projectData?.budgetRange) || 0;
    
    if (projectData?.paymentType === 'hourly') {
      // 按小时计费
      const dailyHours = calculateDailyHours(projectData?.startTime, projectData?.endTime);
      let totalDays;
      
      if (projectData?.timeNature === 'recurring') {
        // 循环项目：计算实际工作日
        totalDays = calculateRecurringDays(
          projectData?.startDate, 
          projectData?.endDate, 
          projectData?.workingDays
        );
      } else {
        // 一次性项目：计算总天数
        totalDays = calculateDaysBetween(projectData?.startDate, projectData?.endDate);
      }
      
      const totalHours = totalDays * dailyHours;
      return workerCount * totalHours * rate;
      
    } else if (projectData?.paymentType === 'daily') {
      // 按天计费
      let totalDays;
      
      if (projectData?.timeNature === 'recurring') {
        // 循环项目：计算实际工作日
        totalDays = calculateRecurringDays(
          projectData?.startDate, 
          projectData?.endDate, 
          projectData?.workingDays
        );
      } else {
        // 一次性项目：计算总天数
        totalDays = calculateDaysBetween(projectData?.startDate, projectData?.endDate);
      }
      
      return workerCount * totalDays * rate;
      
    } else {
      // 一口价
      return workerCount * rate;
    }
  };

  const getPlatformFee = () => {
    return Math.round(calculateEstimatedCost() * 0.05);
  };

  const getSelectedWorkersCount = () => {
    return projectData?.selectedWorkerDetails?.length || projectData?.selectedWorkers?.length || 0;
  };

  // Helper function to convert skill IDs to Chinese names
  const getSkillsDisplayText = (skills) => {
    const skillMap = {
      'plumbingInstall': '水电安装',
      'electrician': '电工', 
      'carpentry': '木工',
      'painting': '油漆',
      'tiling': '铺砖',
      'masonry': '泥瓦工',
      'waterproofing': '防水工',
      'plumbing': '水电',
      'electrical': '电工',
      'welding': '焊接',
      'cleaning': '清洁',
      'general': '通用工'
    };
    
    return skills.map(skill => skillMap[skill] || skill).join('、');
  };

  // Helper function to get experience level text
  const getExperienceText = (experience) => {
    const experienceMap = {
      'beginner': '新手',
      'intermediate': '中级',
      'experienced': '经验丰富'
    };
    return experienceMap[experience] || '中级';
  };

  const handleSendProject = () => {
    const finalData = {
      ...projectData,
      ...formData
    };
    
    modal.confirm(
      t('confirmSendTitle'),
      `将向 ${getSelectedWorkersCount()} 位工人发送项目邀请，是否继续？`,
      () => onNext(finalData)
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
          
          {/* Basic Information */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>{t('basicInformation')}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('projectNameLabel')}</Text>
              <Text style={styles.infoValue}>{projectData?.projectName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('projectAddressLabel')}</Text>
              <Text style={styles.infoValue}>{projectData?.projectAddress}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('projectTypeLabel')}</Text>
              <Text style={styles.infoValue}>{getProjectTypeDisplay()}</Text>
            </View>
          </View>

          {/* Work Requirements */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>{t('workRequirementsInfo')}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('requiredSkillsLabel')}</Text>
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsText}>{getSkillsDisplay()}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('requiredWorkersLabel')}</Text>
              <Text style={styles.infoValue}>{getWorkersCountDisplay()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('experienceRequirementLabel')}</Text>
              <Text style={styles.infoValue}>{getExperienceLevelDisplay()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('workDescriptionLabel')}</Text>
              <Text style={styles.infoValueMultiline} numberOfLines={3}>
                {projectData?.workDescription}
              </Text>
            </View>
          </View>

          {/* Time Arrangement */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>{t('timeArrangement')}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('projectNature')}</Text>
              <Text style={styles.infoValue}>{getWorkingDaysDisplay()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('workDates')}</Text>
              <Text style={styles.infoValue}>{getWorkTimeDisplay()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('dailyTimeLabel')}</Text>
              <Text style={styles.infoValue}>{getDailyTimeDisplay()}</Text>
            </View>
          </View>

          {/* Salary Settings */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>{t('salarySettings')}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('paymentMethod')}</Text>
              <Text style={styles.infoValue}>{getPaymentMethodDisplay()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('hourlyRateLabel')}</Text>
              <Text style={styles.infoValue}>¥{projectData?.budgetRange}/{projectData?.paymentType === 'hourly' ? '小时' : projectData?.paymentType === 'daily' ? '天' : '项目'}</Text>
            </View>
            
            {/* 计算明细 */}
            {projectData?.paymentType !== 'total' && (
              <View style={styles.calculationDetails}>
                {projectData?.paymentType === 'hourly' && (
                  <>
                    <Text style={styles.calculationItem}>
                      每天工作时长：{calculateDailyHours(projectData?.startTime, projectData?.endTime).toFixed(1)} 小时
                    </Text>
                    <Text style={styles.calculationItem}>
                      {projectData?.timeNature === 'recurring' ? 
                        `实际工作天数：${calculateRecurringDays(projectData?.startDate, projectData?.endDate, projectData?.workingDays)} 天` :
                        `项目天数：${calculateDaysBetween(projectData?.startDate, projectData?.endDate)} 天`
                      }
                    </Text>
                    <Text style={styles.calculationItem}>
                      总工时：{(
                        calculateDailyHours(projectData?.startTime, projectData?.endTime) * 
                        (projectData?.timeNature === 'recurring' ? 
                          calculateRecurringDays(projectData?.startDate, projectData?.endDate, projectData?.workingDays) :
                          calculateDaysBetween(projectData?.startDate, projectData?.endDate))
                      ).toFixed(1)} 小时
                    </Text>
                  </>
                )}
                {projectData?.paymentType === 'daily' && (
                  <Text style={styles.calculationItem}>
                    {projectData?.timeNature === 'recurring' ? 
                      `实际工作天数：${calculateRecurringDays(projectData?.startDate, projectData?.endDate, projectData?.workingDays)} 天` :
                      `项目天数：${calculateDaysBetween(projectData?.startDate, projectData?.endDate)} 天`
                    }
                  </Text>
                )}
                <Text style={styles.calculationItem}>
                  工人数量：{projectData?.requiredWorkers === 'custom' ? projectData?.customWorkerCount : projectData?.requiredWorkers} 人
                </Text>
              </View>
            )}
            
            <View style={styles.costHighlight}>
              <Text style={styles.costLabel}>{t('estimatedTotalCost')}</Text>
              <Text style={styles.costValue}>¥{Math.round(calculateEstimatedCost()).toLocaleString('zh-CN')}</Text>
            </View>
          </View>
        </View>

        {/* Selected Workers */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('selectedWorkersLabel')}</Text>
          <View style={styles.workersPreview}>
            <Text style={styles.workersCount}>
              已选择 {getSelectedWorkersCount()} 位工人
            </Text>
            {getSelectedWorkersCount() > 0 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => setShowWorkersModal(true)}
              >
                <Text style={styles.viewAllText}>
                  {t('viewAllWorkers').replace('{count}', getSelectedWorkersCount())}
                </Text>
                <Icon name="chevron-right" size={14} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('notificationSettings')}</Text>
          <Text style={styles.sectionSubtitle}>{t('notificationMethodSelection')}</Text>
          
          {/* Notification Methods */}
          <View style={styles.notificationMethod}>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{t('inAppNotification')}</Text>
              <Text style={styles.methodDesc}>{t('inAppNotificationDesc')}</Text>
            </View>
            <Switch
              value={formData.notificationMethods.inApp}
              onValueChange={(value) => handleNotificationChange('inApp', value)}
              trackColor={{ false: "#e5e7eb", true: "#22c55e" }}
              thumbColor={formData.notificationMethods.inApp ? "#ffffff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.notificationMethod}>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{t('smsNotification')}</Text>
              <Text style={styles.methodDesc}>{t('smsNotificationDesc')}</Text>
            </View>
            <Switch
              value={formData.notificationMethods.sms}
              onValueChange={(value) => handleNotificationChange('sms', value)}
              trackColor={{ false: "#e5e7eb", true: "#22c55e" }}
              thumbColor={formData.notificationMethods.sms ? "#ffffff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.notificationMethod}>
            <View style={styles.methodInfo}>
              <View style={styles.methodNameRow}>
                <Text style={styles.methodName}>{t('aiPhoneNotification')}</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>{t('recommended')}</Text>
                </View>
              </View>
              <Text style={styles.methodDesc}>{t('aiPhoneNotificationDesc')}</Text>
            </View>
            <Switch
              value={formData.notificationMethods.call}
              onValueChange={(value) => handleNotificationChange('call', value)}
              trackColor={{ false: "#e5e7eb", true: "#22c55e" }}
              thumbColor={formData.notificationMethods.call ? "#ffffff" : "#f4f3f4"}
            />
          </View>

          {/* Reply Deadline */}
          <View style={styles.deadlineSection}>
            <Text style={styles.subSectionTitle}>{t('replyDeadline')}</Text>
            <Text style={styles.sectionSubtitle}>{t('replyDeadlineDesc')}</Text>
            <View style={styles.deadlineGrid}>
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

          {/* Smart Auto Assign */}
          <View style={styles.autoAssignSection}>
            <View style={styles.autoAssignInfo}>
              <Text style={styles.autoAssignTitle}>{t('smartAutoAssign')}</Text>
              <Text style={styles.autoAssignDesc}>{t('smartAutoAssignDesc')}</Text>
            </View>
            <Switch
              value={formData.autoAssign}
              onValueChange={(value) => handleInputChange('autoAssign', value)}
              trackColor={{ false: "#e5e7eb", true: "#22c55e" }}
              thumbColor={formData.autoAssign ? "#ffffff" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('costBreakdown')}</Text>
          <View style={styles.costBreakdownContainer}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>{t('totalEstimatedCost')}</Text>
              <Text style={styles.costValue}>¥{Math.round(calculateEstimatedCost()).toLocaleString('zh-CN')}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>{t('platformServiceFee')} (5%)</Text>
              <Text style={styles.costValue}>¥{getPlatformFee().toLocaleString('zh-CN')}</Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costRow}>
              <Text style={styles.totalCostLabel}>总费用</Text>
              <Text style={styles.totalCostValue}>¥{Math.round(calculateEstimatedCost() + getPlatformFee()).toLocaleString('zh-CN')}</Text>
            </View>
            <Text style={styles.paymentTiming}>{t('paymentAfterCompletion')}</Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('importantNotes')}</Text>
          <View style={styles.notesContainer}>
            <View style={styles.noteItem}>
              <Icon name="clock-o" size={16} color="#6b7280" />
              <Text style={styles.noteText}>
                {t('workerConfirmationTime').replace('{time}', replyDeadlines.find(d => d.id === formData.replyDeadline)?.name || '1小时')}
              </Text>
            </View>
            <View style={styles.noteItem}>
              <Icon name="edit" size={16} color="#6b7280" />
              <Text style={styles.noteText}>{t('projectModifiable')}</Text>
            </View>
            <View style={styles.noteItem}>
              <Icon name="phone" size={16} color="#6b7280" />
              <Text style={styles.noteText}>{t('largeProjectRecommendation')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{t('saveAsDraft')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleSendProject}>
          <Text style={styles.primaryButtonText}>
            {t('sendProjectInvitation').replace('{count}', getSelectedWorkersCount())}
          </Text>
          <Icon name="paper-plane" size={16} color="#ffffff" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>

      {/* Selected Workers Modal */}
      <Modal
        visible={showWorkersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.workersModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>已选择的工人</Text>
              <TouchableOpacity onPress={() => setShowWorkersModal(false)}>
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {projectData?.selectedWorkerDetails && projectData.selectedWorkerDetails.length > 0 ? (
                projectData.selectedWorkerDetails.map((worker, index) => (
                  <View key={worker.id || index} style={styles.workerCard}>
                    <View style={styles.workerAvatar}>
                      <Text style={styles.workerAvatarText}>
                        {worker.name ? worker.name.charAt(0) : '工'}
                      </Text>
                    </View>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>
                        {worker.name || `工人 ${index + 1}`}
                      </Text>
                      <Text style={styles.workerSkills}>
                        {worker.skills ? getSkillsDisplayText(worker.skills) : '通用技能'}
                      </Text>
                      <View style={styles.workerDetails}>
                        <Text style={styles.workerExperience}>
                          {getExperienceText(worker.experience)} • {worker.completedJobs}单
                        </Text>
                        <Text style={styles.workerRating}>
                          ⭐ {worker.rating} • {worker.distance}km
                        </Text>
                      </View>
                    </View>
                    <View style={styles.workerActions}>
                      <TouchableOpacity style={styles.workerActionButton}>
                        <Icon name="phone" size={16} color="#22c55e" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.workerActionButton}>
                        <Icon name="comment" size={16} color="#3b82f6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyWorkers}>
                  <Icon name="users" size={48} color="#d1d5db" />
                  <Text style={styles.emptyWorkersText}>暂未选择工人</Text>
                  <Text style={styles.emptyWorkersSubtext}>
                    请返回第4步选择合适的工人
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowWorkersModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>关闭</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  subSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  infoValueMultiline: {
    fontSize: 14,
    color: '#1f2937',
    flex: 2,
    textAlign: 'right',
  },
  skillsContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  skillsText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  calculationDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  calculationItem: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  costHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  costLabel: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  costValue: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
  },
  workersPreview: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  workersCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6b7280',
  },
  notificationMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  methodInfo: {
    flex: 1,
    marginRight: 16,
  },
  methodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  recommendedBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  recommendedText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  methodDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  deadlineSection: {
    marginTop: 24,
  },
  deadlineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deadlineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    minWidth: 100,
  },
  selectedDeadlineOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  deadlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deadlineText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDeadlineText: {
    color: '#16a34a',
  },
  autoAssignSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  autoAssignInfo: {
    flex: 1,
    marginRight: 16,
  },
  autoAssignTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  autoAssignDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  costBreakdownContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  paymentTiming: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  notesContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#92400e',
    marginLeft: 12,
    flex: 1,
  },
  bottomSpacer: {
    height: 120,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  workersModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  workerSkills: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  workerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  workerExperience: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  workerRating: {
    fontSize: 12,
    color: '#6b7280',
  },
  workerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  workerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyWorkers: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyWorkersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyWorkersSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalCloseButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default NewConfirmSendStep;