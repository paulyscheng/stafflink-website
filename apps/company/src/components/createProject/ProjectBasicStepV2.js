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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProjectTypesForIndustry, getAllProjectTypes } from '../../utils/industryProjectMapping';
import ApiService from '../../services/api';

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
  const [companyIndustry, setCompanyIndustry] = useState(null);
  const [availableProjectTypes, setAvailableProjectTypes] = useState([]);

  const { t } = useLanguage();
  const modal = useModal();

  // Load company industry and set available project types
  useEffect(() => {
    loadCompanyIndustry();
  }, []);

  const loadCompanyIndustry = async () => {
    try {
      // First try to get from AsyncStorage
      const companyInfo = await AsyncStorage.getItem('companyInfo');
      if (companyInfo) {
        const company = JSON.parse(companyInfo);
        console.log("company info from storage:", company);
        
        // If no industry in storage, fetch from API
        if (!company.industry) {
          console.log("No industry in storage, fetching from API...");
          try {
            const profile = await ApiService.getProfile();
            if (profile && profile.user) {
              const fullCompanyInfo = {
                ...company,
                ...profile.user
              };
              // Update storage with complete info
              await AsyncStorage.setItem('companyInfo', JSON.stringify(fullCompanyInfo));
              const industry = fullCompanyInfo.industry || 'other';
              setCompanyIndustry(industry);
              setAvailableProjectTypes(getProjectTypesForIndustry(industry));
              return;
            }
          } catch (apiError) {
            console.error('Failed to fetch profile:', apiError);
          }
        }
        
        const industry = company.industry || 'other';
        setCompanyIndustry(industry);
        setAvailableProjectTypes(getProjectTypesForIndustry(industry));
      } else {
        // If no company info, show all project types
        setAvailableProjectTypes(getAllProjectTypes());
      }
    } catch (error) {
      console.error('Failed to load company industry:', error);
      setAvailableProjectTypes(getAllProjectTypes());
    }
  };

  // Get industry color based on company industry
  const getIndustryColor = () => {
    const colorMap = {
      construction: '#DC2626',
      foodservice: '#F59E0B',
      manufacturing: '#6366F1',
      logistics: '#10B981',
      other: '#8B5CF6'
    };
    return colorMap[companyIndustry] || '#6B7280';
  };

  // Get industry name
  const getIndustryName = () => {
    const nameMap = {
      construction: '建筑装修',
      foodservice: '餐饮服务',
      manufacturing: '制造业',
      logistics: '物流仓储',
      other: '其他服务'
    };
    return nameMap[companyIndustry] || '项目类型';
  };

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
          
          {/* Company Industry Header */}
          {companyIndustry && (
            <View style={[
              styles.industryHeader,
              { backgroundColor: `${getIndustryColor()}10`, borderColor: getIndustryColor() }
            ]}>
              <MaterialIcons name="business" size={20} color={getIndustryColor()} />
              <Text style={[styles.industryHeaderText, { color: getIndustryColor() }]}>
                {getIndustryName()}专属项目类型
              </Text>
            </View>
          )}
          
          {/* Project Types Grid */}
          <View style={styles.typeGrid}>
            {availableProjectTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  formData.projectType === type.id && styles.selectedTypeCard,
                  formData.projectType === type.id && { borderColor: getIndustryColor() }
                ]}
                onPress={() => handleInputChange('projectType', type.id)}
                activeOpacity={0.7}
              >
                <View style={styles.typeCardContent}>
                  <Text style={[
                    styles.typeCode,
                    formData.projectType === type.id && styles.selectedTypeCode,
                    formData.projectType === type.id && { color: getIndustryColor() }
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
                {formData.projectType === type.id && (
                  <MaterialIcons name="check-circle" size={20} color={getIndustryColor()} />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
    paddingBottom: 20,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  industryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  industryHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  selectedTypeCard: {
    backgroundColor: '#F0FDF4',
  },
  typeCardContent: {
    flex: 1,
  },
  typeCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectedTypeCode: {
    color: '#16A34A',
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedTypeName: {
    color: '#15803D',
  },
  bottomSpacer: {
    height: 100,
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
});

export default ProjectBasicStep;