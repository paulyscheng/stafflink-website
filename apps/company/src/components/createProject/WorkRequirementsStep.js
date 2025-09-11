import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';

const WorkRequirementsStep = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    requiredSkills: initialData?.requiredSkills || [],
    requiredWorkers: initialData?.requiredWorkers || 1,
    workDescription: initialData?.workDescription || '',
    experienceLevel: initialData?.experienceLevel || 'intermediate',
    specialRequirements: initialData?.specialRequirements || '',
    budgetRange: initialData?.budgetRange || '',
    paymentType: initialData?.paymentType || 'hourly', // 'hourly', 'daily', 'total'
  });

  const { t } = useLanguage();
  const modal = useModal();

  // Project type to skills mapping
  const projectSkillsMapping = {
    // Construction & Renovation
    'home_renovation': ['plumbingInstall', 'electrician', 'carpentry', 'painting', 'tiling', 'operator'],
    'commercial_renovation': ['electrician', 'tiling', 'painting', 'carpentry', 'operator'],
    'electrical_plumbing': ['electrician', 'plumbingInstall'],
    'maintenance_service': ['electrician', 'plumbingInstall', 'carpentry', 'operator'],
    'construction_project': ['tiling', 'welding', 'electrician', 'operator'],
    
    // Food & Beverage
    'coffee_tea': ['operator', 'cleaner'],
    'chinese_cuisine': ['operator', 'cleaner'],
    'fast_food': ['operator', 'cleaner'],
    'hotpot_bbq': ['operator', 'cleaner'],
    'hotel_dining': ['operator', 'cleaner'],
    
    // Manufacturing
    'electronics_mfg': ['operator'],
    'textile_mfg': ['operator'],
    'food_processing': ['operator'],
    'mechanical_mfg': ['welding', 'operator'],
    'packaging_printing': ['operator'],
    
    // Logistics & Warehousing
    'express_delivery': ['operator'],
    'warehouse_ops': ['operator'],
    'moving_service': ['operator'],
    'freight_handling': ['operator'],
    'inventory_mgmt': ['operator'],
    
    // General Services
    'cleaning_service': ['cleaner', 'operator'],
    'security_service': ['operator'],
    'landscaping': ['operator'],
    'event_service': ['operator'],
    'emergency_service': ['electrician', 'plumbingInstall', 'operator'],
  };

  const allSkills = [
    { id: 'plumbingInstall', name: t('plumbingInstall'), icon: '🔧' },
    { id: 'electrician', name: t('electrician'), icon: '⚡' },
    { id: 'carpentry', name: t('carpentry'), icon: '🪚' },
    { id: 'painting', name: t('painting'), icon: '🎨' },
    { id: 'tiling', name: t('tiling'), icon: '🧱' },
    { id: 'welding', name: t('welding'), icon: '🔥' },
    { id: 'cleaner', name: t('cleaning'), icon: '🧹' },
    { id: 'operator', name: t('general'), icon: '🔨' },
  ];

  // Get relevant skills based on project type
  const getRelevantSkills = () => {
    const projectType = initialData?.projectType;
    
    if (!projectType || !projectSkillsMapping[projectType]) {
      return allSkills; // Show all skills if no project type specified
    }
    
    const relevantSkillIds = projectSkillsMapping[projectType];
    return allSkills.filter(skill => relevantSkillIds.includes(skill.id));
  };

  const skills = getRelevantSkills();

  const experienceLevels = [
    { id: 'beginner', name: t('beginnerLevel'), description: t('beginnerDesc') },
    { id: 'intermediate', name: t('intermediateLevel'), description: t('intermediateDesc') },
    { id: 'experienced', name: t('experiencedLevel'), description: t('experiencedDesc') },
  ];

  const workerCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSkill = (skillId) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skillId)
        ? prev.requiredSkills.filter(id => id !== skillId)
        : [...prev.requiredSkills, skillId]
    }));
  };

  const isFormValid = () => {
    return formData.requiredSkills.length > 0 && 
           formData.workDescription.trim().length > 0 &&
           formData.requiredWorkers > 0;
  };

  const handleNext = () => {
    if (!isFormValid()) {
      modal.warning(t('hint'), t('fillCompleteWorkInfo'));
      return;
    }
    onNext(formData);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
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
          <Text style={styles.title}>{t('workRequirements')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Required Skills */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('requiredSkillsLabel')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectRequiredSkills')}</Text>
          
          <View style={styles.skillsGrid}>
            {skills.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                style={[
                  styles.skillCard,
                  formData.requiredSkills.includes(skill.id) && styles.selectedSkillCard
                ]}
                onPress={() => toggleSkill(skill.id)}
              >
                <Text style={styles.skillIcon}>{skill.icon}</Text>
                <Text style={[
                  styles.skillName,
                  formData.requiredSkills.includes(skill.id) && styles.selectedSkillName
                ]}>
                  {skill.name}
                </Text>
                {formData.requiredSkills.includes(skill.id) && (
                  <Icon 
                    name="check-circle" 
                    size={16} 
                    color="#22c55e" 
                    style={styles.skillSelectedIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Required Workers */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('requiredWorkersLabel')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectWorkerCount')}</Text>
          
          <View style={styles.workerCountContainer}>
            {workerCounts.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.workerCountButton,
                  formData.requiredWorkers === count && styles.selectedWorkerCountButton
                ]}
                onPress={() => handleInputChange('requiredWorkers', count)}
              >
                <Text style={[
                  styles.workerCountText,
                  formData.requiredWorkers === count && styles.selectedWorkerCountText
                ]}>
                  {count} {t('currentLanguage') === 'zh' ? '人' : (count === 1 ? 'person' : 'people')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('experienceRequirement')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectExperienceLevel')}</Text>
          
          <View style={styles.experienceContainer}>
            {experienceLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.experienceOption,
                  formData.experienceLevel === level.id && styles.selectedExperienceOption
                ]}
                onPress={() => handleInputChange('experienceLevel', level.id)}
              >
                <View style={styles.radioButton}>
                  {formData.experienceLevel === level.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.experienceTextContainer}>
                  <Text style={[
                    styles.experienceName,
                    formData.experienceLevel === level.id && styles.selectedExperienceName
                  ]}>
                    {level.name}
                  </Text>
                  <Text style={styles.experienceDescription}>{level.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Work Description */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('workDescriptionLabel')}</Text>
          <Text style={styles.sectionSubtitle}>{t('workDescriptionSubtitle')}</Text>
          
          <TextInput
            style={styles.descriptionInput}
            placeholder={t('workDescriptionPlaceholder')}
            value={formData.workDescription}
            onChangeText={(value) => handleInputChange('workDescription', value)}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('salarySettings')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectPaymentMethod')}</Text>
          
          {/* Payment Type */}
          <View style={styles.paymentTypeContainer}>
            <TouchableOpacity
              style={[
                styles.paymentTypeOption,
                formData.paymentType === 'hourly' && styles.selectedPaymentType
              ]}
              onPress={() => handleInputChange('paymentType', 'hourly')}
            >
              <Text style={styles.paymentTypeIcon}>⏰</Text>
              <View style={styles.paymentTypeTextContainer}>
                <Text style={[
                  styles.paymentTypeText,
                  formData.paymentType === 'hourly' && styles.selectedPaymentTypeText
                ]}>
                  {t('hourlyPayment')}
                </Text>
                <Text style={styles.paymentTypeDesc}>{t('hourlyPaymentDesc')}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentTypeOption,
                formData.paymentType === 'daily' && styles.selectedPaymentType
              ]}
              onPress={() => handleInputChange('paymentType', 'daily')}
            >
              <Text style={styles.paymentTypeIcon}>📅</Text>
              <View style={styles.paymentTypeTextContainer}>
                <Text style={[
                  styles.paymentTypeText,
                  formData.paymentType === 'daily' && styles.selectedPaymentTypeText
                ]}>
                  {t('dailyPayment')}
                </Text>
                <Text style={styles.paymentTypeDesc}>{t('dailyPaymentDesc')}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentTypeOption,
                formData.paymentType === 'total' && styles.selectedPaymentType
              ]}
              onPress={() => handleInputChange('paymentType', 'total')}
            >
              <Text style={styles.paymentTypeIcon}>💰</Text>
              <View style={styles.paymentTypeTextContainer}>
                <Text style={[
                  styles.paymentTypeText,
                  formData.paymentType === 'total' && styles.selectedPaymentTypeText
                ]}>
                  {t('totalProjectPayment')}
                </Text>
                <Text style={styles.paymentTypeDesc}>{t('totalProjectPaymentDesc')}</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Payment Input */}
          <View style={styles.paymentInputContainer}>
            <Text style={styles.label}>
              {formData.paymentType === 'hourly' ? t('hourlyWage') : 
               formData.paymentType === 'daily' ? t('dailyWage') : t('projectTotal')}
            </Text>
            <View style={styles.paymentInputWrapper}>
              <Text style={styles.currencySymbol}>{t('currency')}</Text>
              <TextInput
                style={styles.paymentInput}
                placeholder={
                  formData.paymentType === 'hourly' ? t('enterHourlyWage') : 
                  formData.paymentType === 'daily' ? t('enterDailyWage') : t('enterProjectTotal')
                }
                value={formData.budgetRange}
                onChangeText={(value) => handleInputChange('budgetRange', value)}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>
                {formData.paymentType === 'hourly' ? `/${t('hour')}` : 
                 formData.paymentType === 'daily' ? `/${t('day')}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Special Requirements */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('specialRequirementsLabel')}</Text>
          <Text style={styles.sectionSubtitle}>{t('specialRequirementsSubtitle')}</Text>
          
          <TextInput
            style={styles.requirementsInput}
            placeholder={t('specialRequirementsPlaceholder')}
            value={formData.specialRequirements}
            onChangeText={(value) => handleInputChange('specialRequirements', value)}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
          />
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
          style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid()}
        >
          <Text style={[styles.nextButtonText, !isFormValid() && styles.nextButtonTextDisabled]}>
            {t('nextStep')}
          </Text>
          <Icon name="arrow-right" size={16} color={isFormValid() ? "#ffffff" : "#9ca3af"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 100,
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    position: 'relative',
  },
  selectedSkillCard: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  skillIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  selectedSkillName: {
    color: '#16a34a',
  },
  skillSelectedIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  workerCountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workerCountButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  selectedWorkerCountButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  workerCountText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedWorkerCountText: {
    color: '#ffffff',
  },
  experienceContainer: {
    gap: 12,
  },
  experienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  selectedExperienceOption: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  experienceTextContainer: {
    flex: 1,
  },
  experienceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  selectedExperienceName: {
    color: '#3b82f6',
  },
  experienceDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
    minHeight: 100,
  },
  paymentTypeContainer: {
    gap: 12,
    marginBottom: 20,
  },
  paymentTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  selectedPaymentType: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
  },
  paymentTypeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentTypeTextContainer: {
    flex: 1,
  },
  paymentTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedPaymentTypeText: {
    color: '#3b82f6',
  },
  paymentTypeDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentInputContainer: {
    marginBottom: 16,
  },
  paymentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingLeft: 16,
  },
  paymentInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#374151',
  },
  unitText: {
    fontSize: 14,
    color: '#6b7280',
    paddingRight: 16,
  },
  requirementsInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
    minHeight: 80,
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
  nextButton: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default WorkRequirementsStep;