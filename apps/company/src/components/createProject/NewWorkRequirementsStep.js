import React, { useState } from 'react';
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
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';

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

  // Project type to skills mapping
  const projectSkillsMapping = {
    // Construction & Renovation
    'home_renovation': ['plumbingInstall', 'carpentry', 'painting', 'tiling', 'masonry', 'waterproofing'],
    'commercial_renovation': ['electrician', 'carpentry', 'painting', 'tiling', 'ceilingInstall', 'glassInstall'],
    'electrical_plumbing': ['electrician', 'plumber', 'pipeInstall', 'weakCurrent'],
    'maintenance_service': ['electrician', 'plumber', 'carpentry', 'locksmith', 'applianceRepair'],
    'construction_project': ['rebarWorker', 'concreteWorker', 'welding', 'scaffoldWorker', 'surveyor'],
    
    // Food & Beverage
    'coffee_tea': ['barista', 'waiter', 'cashier', 'cleaner'],
    'chinese_cuisine': ['chef', 'kitchenHelper', 'waiter', 'dishwasher', 'cleaner'],
    'fast_food': ['operator', 'cashier', 'cleaner', 'deliveryWorker'],
    'hotpot_bbq': ['bbqChef', 'waiter', 'cleaner', 'cashier'],
    'hotel_dining': ['chef', 'waiter', 'foodRunner', 'cleaner', 'cashier'],
    
    // Manufacturing
    'electronics_mfg': ['assemblyWorker', 'solderer', 'qualityInspector', 'packagingWorker', 'machineOperator'],
    'textile_mfg': ['sewingWorker', 'cuttingWorker', 'ironingWorker', 'qualityInspector', 'packagingWorker'],
    'food_processing': ['foodProcessor', 'packagingWorker', 'qualityInspector', 'cleaner', 'machineOperator'],
    'mechanical_mfg': ['welding', 'latheMachinist', 'assembler', 'qualityInspector', 'materialHandler'],
    'packaging_printing': ['printer', 'bookbinder', 'qualityInspector', 'packagingWorker', 'machineOperator'],
    
    // Logistics & Warehousing
    'express_delivery': ['courier', 'sorter', 'loader', 'driver'],
    'warehouse_ops': ['stocker', 'loader', 'forkliftOperator', 'qualityInspector', 'warehouseKeeper'],
    'moving_service': ['mover', 'packer', 'driver', 'furnitureAssembler'],
    'freight_handling': ['loader', 'forkliftOperator', 'driver', 'stocker'],
    'inventory_mgmt': ['warehouseKeeper', 'stocker', 'forkliftOperator', 'qualityInspector'],
    
    // General Services
    'cleaning_service': ['janitor', 'cleaner', 'windowCleaner', 'carpetCleaner'],
    'security_service': ['securityGuard', 'doorman', 'patrolOfficer', 'monitorOperator'],
    'landscaping': ['gardener', 'treeTrimmer', 'irrigationWorker', 'planter'],
    'event_service': ['eventSetup', 'materialHandler', 'waiter', 'audioTech', 'photographer'],
    'emergency_service': ['electrician', 'plumber', 'locksmith', 'glazier', 'tempWorker'],
  };

  const allSkills = [
    // Construction & Renovation
    { id: 'plumbingInstall', name: t('plumbingInstall'), icon: '🔧' },
    { id: 'electrician', name: t('electrician'), icon: '⚡' },
    { id: 'carpentry', name: t('carpentry'), icon: '🪚' },
    { id: 'painting', name: t('painting'), icon: '🎨' },
    { id: 'tiling', name: t('tiling'), icon: '🧱' },
    { id: 'masonry', name: t('masonry'), icon: '🏗️' },
    { id: 'waterproofing', name: t('waterproofing'), icon: '💧' },
    { id: 'ceilingInstall', name: t('ceilingInstall'), icon: '🏠' },
    { id: 'glassInstall', name: t('glassInstall'), icon: '🪟' },
    { id: 'plumber', name: t('plumber'), icon: '🚰' },
    { id: 'pipeInstall', name: t('pipeInstall'), icon: '🔧' },
    { id: 'weakCurrent', name: t('weakCurrent'), icon: '📡' },
    { id: 'locksmith', name: t('locksmith'), icon: '🔐' },
    { id: 'applianceRepair', name: t('applianceRepair'), icon: '🔧' },
    { id: 'rebarWorker', name: t('rebarWorker'), icon: '⚙️' },
    { id: 'concreteWorker', name: t('concreteWorker'), icon: '🏗️' },
    { id: 'welding', name: t('welding'), icon: '🔥' },
    { id: 'scaffoldWorker', name: t('scaffoldWorker'), icon: '🏗️' },
    { id: 'surveyor', name: t('surveyor'), icon: '📐' },
    
    // Food & Beverage
    { id: 'barista', name: t('barista'), icon: '☕' },
    { id: 'waiter', name: t('waiter'), icon: '🍽️' },
    { id: 'cashier', name: t('cashier'), icon: '💰' },
    { id: 'cleaner', name: t('cleaner'), icon: '🧹' },
    { id: 'chef', name: t('chef'), icon: '👨‍🍳' },
    { id: 'kitchenHelper', name: t('kitchenHelper'), icon: '🥘' },
    { id: 'dishwasher', name: t('dishwasher'), icon: '🍽️' },
    { id: 'operator', name: t('operator'), icon: '⚙️' },
    { id: 'deliveryWorker', name: t('deliveryWorker'), icon: '🚚' },
    { id: 'bbqChef', name: t('bbqChef'), icon: '🔥' },
    { id: 'foodRunner', name: t('foodRunner'), icon: '🏃' },
    
    // Manufacturing
    { id: 'assemblyWorker', name: t('assemblyWorker'), icon: '🔧' },
    { id: 'solderer', name: t('solderer'), icon: '🔥' },
    { id: 'qualityInspector', name: t('qualityInspector'), icon: '🔍' },
    { id: 'packagingWorker', name: t('packagingWorker'), icon: '📦' },
    { id: 'machineOperator', name: t('machineOperator'), icon: '⚙️' },
    { id: 'sewingWorker', name: t('sewingWorker'), icon: '🧵' },
    { id: 'cuttingWorker', name: t('cuttingWorker'), icon: '✂️' },
    { id: 'ironingWorker', name: t('ironingWorker'), icon: '👔' },
    { id: 'foodProcessor', name: t('foodProcessor'), icon: '🥫' },
    { id: 'latheMachinist', name: t('latheMachinist'), icon: '⚙️' },
    { id: 'assembler', name: t('assembler'), icon: '🔧' },
    { id: 'materialHandler', name: t('materialHandler'), icon: '📦' },
    { id: 'printer', name: t('printer'), icon: '🖨️' },
    { id: 'bookbinder', name: t('bookbinder'), icon: '📚' },
    
    // Logistics & Warehousing
    { id: 'courier', name: t('courier'), icon: '🚚' },
    { id: 'sorter', name: t('sorter'), icon: '📋' },
    { id: 'loader', name: t('loader'), icon: '📦' },
    { id: 'driver', name: t('driver'), icon: '🚛' },
    { id: 'stocker', name: t('stocker'), icon: '📊' },
    { id: 'forkliftOperator', name: t('forkliftOperator'), icon: '🚜' },
    { id: 'warehouseKeeper', name: t('warehouseKeeper'), icon: '🏢' },
    { id: 'mover', name: t('mover'), icon: '📦' },
    { id: 'packer', name: t('packer'), icon: '📦' },
    { id: 'furnitureAssembler', name: t('furnitureAssembler'), icon: '🪑' },
    
    // General Services
    { id: 'janitor', name: t('janitor'), icon: '🧹' },
    { id: 'windowCleaner', name: t('windowCleaner'), icon: '🪟' },
    { id: 'carpetCleaner', name: t('carpetCleaner'), icon: '🧹' },
    { id: 'securityGuard', name: t('securityGuard'), icon: '🛡️' },
    { id: 'doorman', name: t('doorman'), icon: '🚪' },
    { id: 'patrolOfficer', name: t('patrolOfficer'), icon: '👮' },
    { id: 'monitorOperator', name: t('monitorOperator'), icon: '📺' },
    { id: 'gardener', name: t('gardener'), icon: '🌱' },
    { id: 'treeTrimmer', name: t('treeTrimmer'), icon: '🌳' },
    { id: 'irrigationWorker', name: t('irrigationWorker'), icon: '💧' },
    { id: 'planter', name: t('planter'), icon: '🌱' },
    { id: 'eventSetup', name: t('eventSetup'), icon: '🎪' },
    { id: 'audioTech', name: t('audioTech'), icon: '🎵' },
    { id: 'photographer', name: t('photographer'), icon: '📷' },
    { id: 'glazier', name: t('glazier'), icon: '🪟' },
    { id: 'tempWorker', name: t('tempWorker'), icon: '⚡' },
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
    const hasValidWorkerCount = () => {
      if (formData.requiredWorkers === 'custom') {
        const customCount = parseInt(formData.customWorkerCount);
        return formData.customWorkerCount.trim().length > 0 && 
               customCount > 0 && 
               customCount > 10; // Must be greater than 10 for custom input
      }
      return formData.requiredWorkers > 0;
    };

    return formData.requiredSkills.length > 0 && 
           formData.workDescription.trim().length > 0 &&
           hasValidWorkerCount();
  };

  const handleNext = () => {
    if (!isFormValid()) {
      modal.warning(t('hint'), t('fillCompleteWorkInfo'));
      return;
    }
    
    // Prepare final data
    const finalData = { ...formData };
    
    // If custom worker count is selected, use the actual number
    if (formData.requiredWorkers === 'custom' && formData.customWorkerCount) {
      finalData.requiredWorkers = parseInt(formData.customWorkerCount);
    }
    
    onNext(finalData);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                  styles.skillChip,
                  formData.requiredSkills.includes(skill.id) && styles.selectedSkillChip
                ]}
                onPress={() => toggleSkill(skill.id)}
              >
                <Text style={styles.skillIcon}>{skill.icon}</Text>
                <Text style={[
                  styles.skillText,
                  formData.requiredSkills.includes(skill.id) && styles.selectedSkillText
                ]}>
                  {skill.name}
                </Text>
                {formData.requiredSkills.includes(skill.id) && (
                  <Icon name="check" size={12} color="#22c55e" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Required Workers */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('requiredWorkersLabel')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectWorkerCount')}</Text>
          
          {/* 1-10 People */}
          <Text style={styles.subSectionTitle}>1-10{t('peopleCount')}</Text>
          <View style={styles.workerCountGrid}>
            {workerCounts.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.countButton,
                  formData.requiredWorkers === count && styles.selectedCountButton
                ]}
                onPress={() => handleWorkerCountChange(count)}
              >
                <Text style={[
                  styles.countText,
                  formData.requiredWorkers === count && styles.selectedCountText
                ]}>
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 10+ People Input */}
          <Text style={styles.subSectionTitle}>10{t('peopleCount')}以上</Text>
          <TouchableOpacity
            style={[
              styles.customTriggerButton,
              formData.requiredWorkers === 'custom' && styles.selectedCustomTriggerButton
            ]}
            onPress={() => handleWorkerCountChange('custom')}
          >
            <Text style={[
              styles.customTriggerText,
              formData.requiredWorkers === 'custom' && styles.selectedCustomTriggerText
            ]}>
              {formData.requiredWorkers === 'custom' && formData.customWorkerCount 
                ? `${formData.customWorkerCount}${t('peopleCount')}` 
                : `10${t('peopleCount')}以上`}
            </Text>
            <Icon name="edit" size={16} color={formData.requiredWorkers === 'custom' ? "#ffffff" : "#6b7280"} />
          </TouchableOpacity>

          {/* Custom Input for 10+ */}
          {formData.requiredWorkers === 'custom' && (
            <View style={styles.customInputContainer}>
              <Text style={styles.customInputLabel}>{t('enterExactCount')}</Text>
              <View style={styles.customInputWrapper}>
                <TextInput
                  style={styles.customInput}
                  placeholder="请输入人数（大于10）"
                  value={formData.customWorkerCount}
                  onChangeText={handleCustomCountChange}
                  keyboardType="numeric"
                  autoFocus={true}
                />
                <Text style={styles.customInputUnit}>{t('peopleCount')}</Text>
              </View>
            </View>
          )}
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