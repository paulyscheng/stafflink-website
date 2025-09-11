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
import SkillTagSelector from './SkillTagSelector';
import WorkerCountSelector from './WorkerCountSelector';

const NewWorkRequirementsStep = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    requiredSkills: initialData?.requiredSkills || [],
    requiredWorkers: initialData?.requiredWorkers || 1,
    customWorkerCount: initialData?.customWorkerCount || '',
    workDescription: initialData?.workDescription || '',
    experienceLevel: initialData?.experienceLevel || 'intermediate',
  });

  const { t } = useLanguage();
  const modal = useModal();

  // Project type to skills mapping - 与 industryProjectMapping.js 保持一致
  const projectSkillsMapping = {
    // 建筑装修业
    'home_renovation': ['plumbingInstall', 'carpentry', 'painting', 'tiling', 'masonry', 'waterproofing'],
    'office_decoration': ['electrician', 'carpentry', 'painting', 'tiling', 'ceilingInstall', 'glassInstall'],
    'outdoor_construction': ['rebarWorker', 'concreteWorker', 'welding', 'scaffoldWorker', 'surveyor', 'masonry'],
    'installation_maintenance': ['electrician', 'plumber', 'carpentry', 'locksmith', 'applianceRepair'],
    'waterproof_insulation': ['waterproofing', 'masonry', 'plumber', 'tiling'],
    'demolition': ['demolitionWorker', 'loader', 'cleaner', 'materialHandler'],
    
    // 餐饮服务业
    'chef': ['chef', 'kitchenHelper', 'foodProcessor'],
    'service_staff': ['waiter', 'foodRunner', 'cashier'],
    'kitchen_helper': ['kitchenHelper', 'dishwasher', 'cleaner'],
    'delivery': ['deliveryWorker', 'driver', 'packer'],
    'dishwasher': ['dishwasher', 'cleaner'],
    'food_prep': ['foodProcessor', 'kitchenHelper', 'cuttingWorker'],
    
    // 制造业
    'assembly_line': ['assemblyWorker', 'assembler', 'qualityInspector', 'packagingWorker'],
    'quality_inspection': ['qualityInspector', 'materialHandler', 'packagingWorker'],
    'packaging': ['packagingWorker', 'packer', 'qualityInspector'],
    'machine_operator': ['machineOperator', 'assemblyWorker', 'qualityInspector'],
    'warehouse_keeper': ['warehouseKeeper', 'stocker', 'forkliftOperator'],
    'forklift_driver': ['forkliftOperator', 'loader', 'warehouseKeeper'],
    
    // 物流仓储
    'loader': ['loader', 'mover', 'materialHandler'],
    'sorter': ['sorter', 'packer', 'qualityInspector'],
    'packer': ['packer', 'packagingWorker', 'sorter'],
    'courier': ['courier', 'deliveryWorker', 'driver'],
    'driver': ['driver', 'courier', 'deliveryWorker'],
    'inventory_clerk': ['warehouseKeeper', 'stocker', 'qualityInspector'],
    
    // 其他服务
    'cleaner': ['cleaner', 'janitor', 'windowCleaner', 'carpetCleaner'],
    'security': ['securityGuard', 'doorman', 'patrolOfficer', 'monitorOperator'],
    'gardener': ['gardener', 'treeTrimmer', 'irrigationWorker', 'planter'],
    'mover': ['mover', 'loader', 'packer', 'furnitureAssembler'],
    'general_labor': ['tempWorker', 'materialHandler', 'loader', 'cleaner'],
    'other': ['tempWorker', 'materialHandler', 'cleaner'],
  };

  const allSkills = [
    // Construction & Renovation
    { id: 'plumbingInstall', name: t('plumbingInstall') },
    { id: 'electrician', name: t('electrician') },
    { id: 'carpentry', name: t('carpentry') },
    { id: 'painting', name: t('painting') },
    { id: 'tiling', name: t('tiling') },
    { id: 'masonry', name: t('masonry') },
    { id: 'waterproofing', name: t('waterproofing') },
    { id: 'ceilingInstall', name: t('ceilingInstall') },
    { id: 'glassInstall', name: t('glassInstall') },
    { id: 'plumber', name: t('plumber') },
    { id: 'pipeInstall', name: t('pipeInstall') },
    { id: 'weakCurrent', name: t('weakCurrent') },
    { id: 'locksmith', name: t('locksmith') },
    { id: 'applianceRepair', name: t('applianceRepair') },
    { id: 'rebarWorker', name: t('rebarWorker') },
    { id: 'concreteWorker', name: t('concreteWorker') },
    { id: 'welding', name: t('welding') },
    { id: 'scaffoldWorker', name: t('scaffoldWorker') },
    { id: 'surveyor', name: t('surveyor') },
    { id: 'demolitionWorker', name: '拆除工' },
    
    // Food & Beverage
    { id: 'barista', name: t('barista') },
    { id: 'waiter', name: t('waiter') },
    { id: 'cashier', name: t('cashier') },
    { id: 'cleaner', name: t('cleaner') },
    { id: 'chef', name: t('chef') },
    { id: 'kitchenHelper', name: t('kitchenHelper') },
    { id: 'dishwasher', name: t('dishwasher') },
    { id: 'operator', name: t('operator') },
    { id: 'deliveryWorker', name: t('deliveryWorker') },
    { id: 'bbqChef', name: t('bbqChef') },
    { id: 'foodRunner', name: t('foodRunner') },
    
    // Manufacturing
    { id: 'assemblyWorker', name: t('assemblyWorker') },
    { id: 'solderer', name: t('solderer') },
    { id: 'qualityInspector', name: t('qualityInspector') },
    { id: 'packagingWorker', name: t('packagingWorker') },
    { id: 'machineOperator', name: t('machineOperator') },
    { id: 'sewingWorker', name: t('sewingWorker') },
    { id: 'cuttingWorker', name: t('cuttingWorker') },
    { id: 'ironingWorker', name: t('ironingWorker') },
    { id: 'foodProcessor', name: t('foodProcessor') },
    { id: 'latheMachinist', name: t('latheMachinist') },
    { id: 'assembler', name: t('assembler') },
    { id: 'materialHandler', name: t('materialHandler') },
    { id: 'printer', name: t('printer') },
    { id: 'bookbinder', name: t('bookbinder') },
    
    // Logistics & Warehousing
    { id: 'courier', name: t('courier') },
    { id: 'sorter', name: t('sorter') },
    { id: 'loader', name: t('loader') },
    { id: 'driver', name: t('driver') },
    { id: 'stocker', name: t('stocker') },
    { id: 'forkliftOperator', name: t('forkliftOperator') },
    { id: 'warehouseKeeper', name: t('warehouseKeeper') },
    { id: 'mover', name: t('mover') },
    { id: 'packer', name: t('packer') },
    { id: 'furnitureAssembler', name: t('furnitureAssembler') },
    
    // General Services
    { id: 'janitor', name: t('janitor') },
    { id: 'windowCleaner', name: t('windowCleaner') },
    { id: 'carpetCleaner', name: t('carpetCleaner') },
    { id: 'securityGuard', name: t('securityGuard') },
    { id: 'doorman', name: t('doorman') },
    { id: 'patrolOfficer', name: t('patrolOfficer') },
    { id: 'monitorOperator', name: t('monitorOperator') },
    { id: 'gardener', name: t('gardener') },
    { id: 'treeTrimmer', name: t('treeTrimmer') },
    { id: 'irrigationWorker', name: t('irrigationWorker') },
    { id: 'planter', name: t('planter') },
    { id: 'eventSetup', name: t('eventSetup') },
    { id: 'audioTech', name: t('audioTech') },
    { id: 'photographer', name: t('photographer') },
    { id: 'glazier', name: t('glazier') },
    { id: 'tempWorker', name: t('tempWorker') },
  ];

  // Get relevant skills based on project type
  const getRelevantSkills = () => {
    // Get the specific project subtype from initialData (from step 1)
    // This should be the industry-specific type like 'home_renovation'
    let projectType = initialData?.projectType;
    
    console.log('=== SKILL FILTERING DEBUG ===');
    console.log('Full initialData:', initialData);
    console.log('Initial projectType from data:', projectType);
    console.log('Available project mappings:', Object.keys(projectSkillsMapping));
    
    // Check if we have a valid project type that maps to skills
    if (!projectType || !projectSkillsMapping[projectType]) {
      console.log('Project type not found in mapping, showing all skills');
      console.log('Reason: projectType =', projectType, ', exists in mapping =', !!projectSkillsMapping[projectType]);
      return allSkills; // Show all skills if no valid project type found
    }
    
    const relevantSkillIds = projectSkillsMapping[projectType];
    const filteredSkills = allSkills.filter(skill => relevantSkillIds.includes(skill.id));
    
    console.log('✅ Found valid project type:', projectType);
    console.log('✅ Relevant skill IDs:', relevantSkillIds);
    console.log('✅ Filtered skills:', filteredSkills.map(s => s.name));
    console.log('=== END SKILL FILTERING DEBUG ===');
    
    return filteredSkills;
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

  const handleWorkerCountChange = (count) => {
    if (count === 'custom') {
      // Show custom input for 10+ people
      setFormData(prev => ({
        ...prev,
        requiredWorkers: 'custom',
        customWorkerCount: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        requiredWorkers: count,
        customWorkerCount: ''
      }));
    }
  };

  const handleCustomCountChange = (value) => {
    // Keep requiredWorkers as 'custom' while user is inputting
    setFormData(prev => ({
      ...prev,
      customWorkerCount: value,
      requiredWorkers: 'custom' // Always keep as custom during input
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
          
          <SkillTagSelector
            selectedSkills={formData.requiredSkills}
            onSkillsChange={(skills) => handleInputChange('requiredSkills', skills)}
            availableSkills={skills}
          />
        </View>

        {/* Required Workers */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('requiredWorkersLabel')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectWorkerCount')}</Text>
          
          <WorkerCountSelector
            value={typeof formData.requiredWorkers === 'number' ? formData.requiredWorkers : 
                   (formData.customWorkerCount ? parseInt(formData.customWorkerCount) : 1)}
            onChange={(count) => handleInputChange('requiredWorkers', count)}
            min={1}
            max={100}
          />
        </View>

        {/* Experience Level */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('experienceRequirement')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectExperienceLevel')}</Text>
          
          <View style={styles.experienceGrid}>
            {experienceLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.experienceCard,
                  formData.experienceLevel === level.id && styles.selectedExperienceCard
                ]}
                onPress={() => handleInputChange('experienceLevel', level.id)}
              >
                <Text style={[
                  styles.experienceName,
                  formData.experienceLevel === level.id && styles.selectedExperienceName
                ]}>
                  {level.name}
                </Text>
                <Text style={[
                  styles.experienceDescription,
                  formData.experienceLevel === level.id && styles.selectedExperienceDescription
                ]}>
                  {level.description}
                </Text>
                {formData.experienceLevel === level.id && (
                  <Icon 
                    name="check-circle" 
                    size={16} 
                    color="#22c55e" 
                    style={styles.selectedIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Work Description */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('workDescriptionLabel')}</Text>
          <Text style={styles.sectionSubtitle}>{t('workDescriptionSubtitle')}</Text>
          
          <TextInput
            style={styles.textArea}
            placeholder={t('workDescriptionPlaceholder')}
            value={formData.workDescription}
            onChangeText={(value) => handleInputChange('workDescription', value)}
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>


        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity 
          style={[
            styles.floatingButton,
            !isFormValid() && styles.floatingButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!isFormValid()}
        >
          <Text style={[
            styles.floatingButtonText,
            !isFormValid() && styles.floatingButtonTextDisabled
          ]}>
            {isFormValid() ? t('continueToTimeSchedule') : t('fillCompleteWorkInfo')}
          </Text>
          {isFormValid() && (
            <Icon name="arrow-right" size={16} color="#ffffff" style={styles.floatingButtonIcon} />
          )}
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    minHeight: 44,
  },
  selectedSkillChip: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  skillIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedSkillText: {
    color: '#16a34a',
  },
  checkIcon: {
    marginLeft: 6,
  },
  workerCountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  countButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCountButton: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedCountText: {
    color: '#ffffff',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 12,
  },
  customTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    marginTop: 12,
  },
  selectedCustomTriggerButton: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  customTriggerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedCustomTriggerText: {
    color: '#ffffff',
  },
  customInputContainer: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  customInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#374151',
  },
  customInputUnit: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  experienceGrid: {
    gap: 12,
  },
  experienceCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  selectedExperienceCard: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  experienceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedExperienceName: {
    color: '#16a34a',
  },
  experienceDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedExperienceDescription: {
    color: '#15803d',
  },
  selectedIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 120,
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

export default NewWorkRequirementsStep;