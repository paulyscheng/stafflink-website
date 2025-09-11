import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';
import FormInput from '../common/FormInput';

const ProjectBasicStep = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    projectName: initialData?.projectName || '',
    projectAddress: initialData?.projectAddress || '',
    projectType: initialData?.projectType || '',
  });

  const [fieldStatus, setFieldStatus] = useState({
    projectName: false,
    projectAddress: false,
    projectType: false,
  });

  const [errors, setErrors] = useState({});
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const { t } = useLanguage();
  const modal = useModal();

  // Auto-select industry if projectType is already set
  useEffect(() => {
    if (formData.projectType && !selectedIndustry) {
      for (const industry of industryCategories) {
        const hasProjectType = industry.projectTypes.some(type => type.id === formData.projectType);
        if (hasProjectType) {
          setSelectedIndustry(industry);
          break;
        }
      }
    }
  }, [formData.projectType, selectedIndustry, industryCategories]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update field status for real-time validation
    setFieldStatus(prev => ({
      ...prev,
      [field]: value.trim().length > 0
    }));
  };

  const isFormComplete = () => {
    return formData.projectName.trim().length > 0 &&
           formData.projectAddress.trim().length > 0 &&
           formData.projectType.length > 0;
  };

  const getCompletedFieldsCount = () => {
    return Object.values(fieldStatus).filter(Boolean).length;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = '请输入项目名称';
    } else if (formData.projectName.trim().length < 2) {
      newErrors.projectName = '项目名称至少需要2个字符';
    }
    
    if (!formData.projectAddress.trim()) {
      newErrors.projectAddress = '请输入项目地址';
    } else if (formData.projectAddress.trim().length < 3) {
      newErrors.projectAddress = '请输入项目地址';
    }
    
    if (!formData.projectType) {
      newErrors.projectType = '请选择项目类型';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext(formData);
    } else {
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        modal.warning('提示', firstError);
      }
    }
  };

  const getButtonText = () => {
    if (!isFormComplete()) {
      const remaining = 3 - getCompletedFieldsCount();
      return remaining === 3 ? t('startFillingProject') : t('needToFillMore').replace('{count}', remaining);
    }
    return t('continueToWorkRequirements');
  };

  // Industry categories and their project types - Professional version
  const industryCategories = [
    {
      id: 'construction',
      name: t('constructionRenovation'),
      code: '建装',
      color: '#DC2626',
      projectTypes: [
        { 
          id: 'home_renovation', 
          name: t('homeRenovation'), 
          code: '家装',
          description: t('homeRenovationDesc'),
          keywords: ['装修', '家装', '住宅', '室内']
        },
        { 
          id: 'commercial_renovation', 
          name: t('commercialRenovation'), 
          code: '工装',
          description: t('commercialRenovationDesc'),
          keywords: ['商业', '办公室', '店铺', '商铺']
        },
        { 
          id: 'electrical_plumbing', 
          name: t('electricalPlumbing'), 
          code: '水电',
          description: t('electricalPlumbingDesc'),
          keywords: ['水电', '管道', '电路', '维修']
        },
        { 
          id: 'maintenance_service', 
          name: t('maintenanceService'), 
          code: '维保',
          description: t('maintenanceServiceDesc'),
          keywords: ['维保', '保养', '检修', '维护']
        },
        { 
          id: 'construction_project', 
          name: t('constructionProject'), 
          code: '工程',
          description: t('constructionProjectDesc'),
          keywords: ['建筑', '施工', '工程', '土建']
        },
      ]
    },
    {
      id: 'food_service',
      name: t('foodService'),
      code: '餐饮',
      color: '#F59E0B',
      projectTypes: [
        { 
          id: 'coffee_tea', 
          name: t('coffeeTea'), 
          code: '茶饮',
          description: t('coffeeTeaDesc'),
          keywords: ['咖啡', '奶茶', '饮品', '茶饮']
        },
        { 
          id: 'chinese_cuisine', 
          name: t('chineseCuisine'), 
          code: '中餐',
          description: t('chineseCuisineDesc'),
          keywords: ['中餐', '炒菜', '厨师', '后厨']
        },
        { 
          id: 'fast_food', 
          name: t('fastFood'), 
          code: '快餐',
          description: t('fastFoodDesc'),
          keywords: ['快餐', '连锁', '外卖', '速食']
        },
        { 
          id: 'hotpot_bbq', 
          name: t('hotpotBBQ'), 
          code: '火锅',
          description: t('hotpotBBQDesc'),
          keywords: ['火锅', '烧烤', '串串', '烤肉']
        },
        { 
          id: 'hotel_dining', 
          name: t('hotelDining'), 
          code: '酒店',
          description: t('hotelDiningDesc'),
          keywords: ['酒店', '宴会', '高端', '西餐']
        },
      ]
    },
    {
      id: 'manufacturing',
      name: t('manufacturing'),
      code: '制造',
      color: '#6366F1',
      projectTypes: [
        { 
          id: 'electronics_mfg', 
          name: t('electronicsMfg'), 
          code: '电子',
          description: t('electronicsMfgDesc'),
          keywords: ['电子', '组装', 'SMT', '电路板']
        },
        { 
          id: 'textile_mfg', 
          name: t('textileMfg'), 
          code: '纺织',
          description: t('textileMfgDesc'),
          keywords: ['纺织', '服装', '缝纫', '制衣']
        },
        { 
          id: 'food_processing', 
          name: t('foodProcessing'), 
          code: '食品',
          description: t('foodProcessingDesc'),
          keywords: ['食品', '加工', '包装', '生产']
        },
        { 
          id: 'mechanical_mfg', 
          name: t('mechanicalMfg'), 
          code: '机械',
          description: t('mechanicalMfgDesc'),
          keywords: ['机械', '机加工', '焊接', '装配']
        },
        { 
          id: 'packaging_printing', 
          name: t('packagingPrinting'), 
          code: '包装',
          description: t('packagingPrintingDesc'),
          keywords: ['包装', '印刷', '印刷厂', '纸箱']
        },
      ]
    },
    {
      id: 'logistics',
      name: t('logisticsWarehousing'),
      code: '物流',
      color: '#10B981',
      projectTypes: [
        { 
          id: 'express_delivery', 
          name: t('expressDelivery'), 
          code: '快递',
          description: t('expressDeliveryDesc'),
          keywords: ['快递', '配送', '派送', '物流']
        },
        { 
          id: 'warehouse_ops', 
          name: t('warehouseOps'), 
          code: '仓储',
          description: t('warehouseOpsDesc'),
          keywords: ['仓库', '仓储', '理货', '入库']
        },
        { 
          id: 'moving_service', 
          name: t('movingService'), 
          code: '搬家',
          description: t('movingServiceDesc'),
          keywords: ['搬家', '搬运', '搬迁', '运输']
        },
        { 
          id: 'freight_handling', 
          name: t('freightHandling'), 
          code: '装卸',
          description: t('freightHandlingDesc'),
          keywords: ['装卸', '货运', '搬运', '叉车']
        },
        { 
          id: 'inventory_mgmt', 
          name: t('inventoryMgmt'), 
          code: '盘点',
          description: t('inventoryMgmtDesc'),
          keywords: ['盘点', '库存', '管理', '清点']
        },
      ]
    },
    {
      id: 'general_services',
      name: t('generalServices'),
      code: '服务',
      color: '#8B5CF6',
      projectTypes: [
        { 
          id: 'cleaning_service', 
          name: t('cleaningService'), 
          code: '保洁',
          description: t('cleaningServiceDesc'),
          keywords: ['保洁', '清洁', '打扫', '卫生']
        },
        { 
          id: 'security_service', 
          name: t('securityService'), 
          code: '安保',
          description: t('securityServiceDesc'),
          keywords: ['保安', '安保', '巡逻', '门卫']
        },
        { 
          id: 'landscaping', 
          name: t('landscaping'), 
          code: '园林',
          description: t('landscapingDesc'),
          keywords: ['园林', '绿化', '园艺', '修剪']
        },
        { 
          id: 'event_service', 
          name: t('eventService'), 
          code: '活动',
          description: t('eventServiceDesc'),
          keywords: ['活动', '会展', '搭建', '布置']
        },
        { 
          id: 'emergency_service', 
          name: t('emergencyService'), 
          code: '应急',
          description: t('emergencyServiceDesc'),
          keywords: ['应急', '抢修', '紧急', '临时']
        },
      ]
    }
  ];


  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('projectBasicInfo')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Project Name */}
        <FormInput
          label={t('projectName')}
          value={formData.projectName}
          onChangeText={(value) => handleInputChange('projectName', value)}
          placeholder={t('enterProjectName')}
          required
          error={errors.projectName}
          validator={(value) => {
            if (value.trim().length < 2) {
              return '项目名称至少需要2个字符';
            }
            if (value.trim().length > 50) {
              return '项目名称不能超过50个字符';
            }
            return true;
          }}
          helperText="请输入清晰的项目名称，方便工人理解"
          maxLength={50}
          autoFocus={true}
        />

        {/* Project Address */}
        <FormInput
          label={t('projectAddress')}
          value={formData.projectAddress}
          onChangeText={(value) => handleInputChange('projectAddress', value)}
          placeholder={t('enterProjectAddress')}
          required
          error={errors.projectAddress}
          multiline
          numberOfLines={2}
          validator={(value) => {
            if (value.trim().length < 3) {
              return '请输入项目地址';
            }
            return true;
          }}
          rightIcon={
            <TouchableOpacity onPress={() => modal.info('定位功能', '定位功能即将开放')}>
              <MaterialIcons name="my-location" size={22} color="#6B7280" />
            </TouchableOpacity>
          }
          helperText="详细地址有助于工人准确到达"
          maxLength={100}
        />

        {/* Project Type */}
        <View style={styles.sectionContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionTitle}>{t('projectType')}</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>必填</Text>
            </View>
            {fieldStatus.projectType && (
              <MaterialIcons name="check-circle" size={16} color="#22c55e" style={styles.checkIcon} />
            )}
          </View>
          {errors.projectType && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{errors.projectType}</Text>
            </View>
          )}
          
          {/* Industry Selection */}
          {!selectedIndustry && (
            <View style={styles.industryContainer}>
              {industryCategories.map((industry) => (
                <TouchableOpacity
                  key={industry.id}
                  style={[
                    styles.industryCard,
                    { borderLeftColor: industry.color }
                  ]}
                  onPress={() => setSelectedIndustry(industry)}
                  activeOpacity={0.7}
                >
                  <View style={styles.industryHeader}>
                    <View style={[styles.industryBadge, { backgroundColor: industry.color }]}>
                      <Text style={styles.industryCode}>{industry.code}</Text>
                    </View>
                    <View style={styles.industryContent}>
                      <Text style={styles.industryName}>{industry.name}</Text>
                      <Text style={styles.projectTypeCount}>
                        {industry.projectTypes.length} 个细分类型
                      </Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Project Type Selection */}
          {selectedIndustry && (
            <View>
              {/* Back to Industries */}
              <TouchableOpacity 
                style={[
                  styles.backToIndustries,
                  { backgroundColor: `${selectedIndustry.color}10` }
                ]}
                onPress={() => {
                  setSelectedIndustry(null);
                  handleInputChange('projectType', '');
                }}
              >
                <Icon name="arrow-left" size={16} color={selectedIndustry.color} />
                <Text style={[styles.backToIndustriesText, { color: selectedIndustry.color }]}>
                  {selectedIndustry.name}
                </Text>
              </TouchableOpacity>
              
              {/* Project Types List */}
              <View style={styles.typesList}>
                {selectedIndustry.projectTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeItem,
                      formData.projectType === type.id && styles.selectedTypeItem
                    ]}
                    onPress={() => handleInputChange('projectType', type.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.typeItemContent}>
                      <View style={styles.typeItemHeader}>
                        <Text style={[
                          styles.typeCode,
                          formData.projectType === type.id && styles.selectedTypeCode
                        ]}>
                          {type.code}
                        </Text>
                        <Text style={[
                          styles.typeName,
                          formData.projectType === type.id && styles.selectedTypeName
                        ]}>
                          {type.name}
                        </Text>
                      </View>
                      <Text style={[
                        styles.typeDescription,
                        formData.projectType === type.id && styles.selectedTypeDescription
                      ]}>
                        {type.description}
                      </Text>
                      {type.keywords && (
                        <View style={styles.keywordContainer}>
                          {type.keywords.slice(0, 3).map((keyword, index) => (
                            <View key={index} style={styles.keywordTag}>
                              <Text style={styles.keywordText}>{keyword}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <View style={styles.typeItemSelect}>
                      <View style={[
                        styles.radioOuter,
                        formData.projectType === type.id && styles.radioOuterSelected
                      ]}>
                        {formData.projectType === type.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Bottom Spacer to prevent content being hidden by floating button */}
        <View style={styles.bottomSpacer} />

      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity 
          style={[
            styles.floatingButton,
            !isFormComplete() && styles.floatingButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!isFormComplete()}
        >
          <Text style={[
            styles.floatingButtonText,
            !isFormComplete() && styles.floatingButtonTextDisabled
          ]}>
            {getButtonText()}
          </Text>
          {isFormComplete() && (
            <Icon name="arrow-right" size={16} color="#ffffff" style={styles.floatingButtonIcon} />
          )}
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
  scrollViewContent: {
    paddingBottom: 20, // Additional padding for better scrolling
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
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 60,
    marginRight: 12,
  },
  locationButton: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 4,
  },
  typeGrid: {
    gap: 12,
  },
  typeCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  selectedTypeCard: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedTypeName: {
    color: '#16a34a',
  },
  typeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  selectedTypeDescription: {
    color: '#15803d',
  },
  selectedIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputCompleted: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  floatingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  floatingButtonTextDisabled: {
    color: '#9ca3af',
  },
  floatingButtonIcon: {
    marginLeft: 8,
  },
  industryContainer: {
    gap: 12,
  },
  industryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  industryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  industryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  industryCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  industryContent: {
    flex: 1,
  },
  industryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  projectTypeCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  backToIndustries: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backToIndustriesText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
  },
  typesList: {
    gap: 12,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  selectedTypeItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  typeItemContent: {
    flex: 1,
    marginRight: 12,
  },
  typeItemHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
    gap: 8,
  },
  typeCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  selectedTypeCode: {
    color: '#3B82F6',
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedTypeName: {
    color: '#1E40AF',
  },
  typeDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  selectedTypeDescription: {
    color: '#3B82F6',
  },
  keywordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  keywordText: {
    fontSize: 11,
    color: '#6B7280',
  },
  typeItemSelect: {
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  bottomSpacer: {
    height: 100, // Space for floating button
  },
});

export default ProjectBasicStep;