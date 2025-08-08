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
import { useLanguage } from '../../contexts/LanguageContext';

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

  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const { t } = useLanguage();

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

  const handleNext = () => {
    if (!isFormComplete()) {
      return; // Button should be disabled, but just in case
    }
    onNext(formData);
  };

  const getButtonText = () => {
    if (!isFormComplete()) {
      const remaining = 3 - getCompletedFieldsCount();
      return remaining === 3 ? t('startFillingProject') : t('needToFillMore').replace('{count}', remaining);
    }
    return t('continueToWorkRequirements');
  };

  // Industry categories and their project types
  const industryCategories = [
    {
      id: 'construction',
      name: t('constructionRenovation'),
      icon: '🏗️',
      projectTypes: [
        { id: 'home_renovation', name: t('homeRenovation'), icon: '🏠', description: t('homeRenovationDesc') },
        { id: 'commercial_renovation', name: t('commercialRenovation'), icon: '🏢', description: t('commercialRenovationDesc') },
        { id: 'electrical_plumbing', name: t('electricalPlumbing'), icon: '🔌', description: t('electricalPlumbingDesc') },
        { id: 'maintenance_service', name: t('maintenanceService'), icon: '🔨', description: t('maintenanceServiceDesc') },
        { id: 'construction_project', name: t('constructionProject'), icon: '🏗️', description: t('constructionProjectDesc') },
      ]
    },
    {
      id: 'food_service',
      name: t('foodService'),
      icon: '🍽️',
      projectTypes: [
        { id: 'coffee_tea', name: t('coffeeTea'), icon: '☕', description: t('coffeeTeaDesc') },
        { id: 'chinese_cuisine', name: t('chineseCuisine'), icon: '🍜', description: t('chineseCuisineDesc') },
        { id: 'fast_food', name: t('fastFood'), icon: '🍔', description: t('fastFoodDesc') },
        { id: 'hotpot_bbq', name: t('hotpotBBQ'), icon: '🍲', description: t('hotpotBBQDesc') },
        { id: 'hotel_dining', name: t('hotelDining'), icon: '🥂', description: t('hotelDiningDesc') },
      ]
    },
    {
      id: 'manufacturing',
      name: t('manufacturing'),
      icon: '🏭',
      projectTypes: [
        { id: 'electronics_mfg', name: t('electronicsMfg'), icon: '📱', description: t('electronicsMfgDesc') },
        { id: 'textile_mfg', name: t('textileMfg'), icon: '👕', description: t('textileMfgDesc') },
        { id: 'food_processing', name: t('foodProcessing'), icon: '🍞', description: t('foodProcessingDesc') },
        { id: 'mechanical_mfg', name: t('mechanicalMfg'), icon: '⚙️', description: t('mechanicalMfgDesc') },
        { id: 'packaging_printing', name: t('packagingPrinting'), icon: '📦', description: t('packagingPrintingDesc') },
      ]
    },
    {
      id: 'logistics',
      name: t('logisticsWarehousing'),
      icon: '📦',
      projectTypes: [
        { id: 'express_delivery', name: t('expressDelivery'), icon: '🚚', description: t('expressDeliveryDesc') },
        { id: 'warehouse_ops', name: t('warehouseOps'), icon: '📋', description: t('warehouseOpsDesc') },
        { id: 'moving_service', name: t('movingService'), icon: '🏠', description: t('movingServiceDesc') },
        { id: 'freight_handling', name: t('freightHandling'), icon: '🚛', description: t('freightHandlingDesc') },
        { id: 'inventory_mgmt', name: t('inventoryMgmt'), icon: '📊', description: t('inventoryMgmtDesc') },
      ]
    },
    {
      id: 'general_services',
      name: t('generalServices'),
      icon: '🔧',
      projectTypes: [
        { id: 'cleaning_service', name: t('cleaningService'), icon: '🧹', description: t('cleaningServiceDesc') },
        { id: 'security_service', name: t('securityService'), icon: '🛡️', description: t('securityServiceDesc') },
        { id: 'landscaping', name: t('landscaping'), icon: '🌱', description: t('landscapingDesc') },
        { id: 'event_service', name: t('eventService'), icon: '🎪', description: t('eventServiceDesc') },
        { id: 'emergency_service', name: t('emergencyService'), icon: '⚡', description: t('emergencyServiceDesc') },
      ]
    }
  ];


  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('projectBasicInfo')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Project Name */}
        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('projectName')}*</Text>
            {fieldStatus.projectName && (
              <Icon name="check-circle" size={16} color="#22c55e" />
            )}
          </View>
          <TextInput
            style={[
              styles.input,
              fieldStatus.projectName && styles.inputCompleted
            ]}
            placeholder={t('enterProjectName')}
            value={formData.projectName}
            onChangeText={(value) => handleInputChange('projectName', value)}
            autoFocus={true}
          />
        </View>

        {/* Project Address */}
        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('projectAddress')}*</Text>
            {fieldStatus.projectAddress && (
              <Icon name="check-circle" size={16} color="#22c55e" />
            )}
          </View>
          <View style={styles.addressContainer}>
            <TextInput
              style={[
                styles.addressInput,
                fieldStatus.projectAddress && styles.inputCompleted
              ]}
              placeholder={t('enterProjectAddress')}
              value={formData.projectAddress}
              onChangeText={(value) => handleInputChange('projectAddress', value)}
              multiline={true}
              numberOfLines={2}
            />
            <TouchableOpacity style={styles.locationButton}>
              <Icon name="map-marker" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Project Type */}
        <View style={styles.sectionContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.sectionTitle}>{t('projectType')}*</Text>
            {fieldStatus.projectType && (
              <Icon name="check-circle" size={16} color="#22c55e" />
            )}
          </View>
          
          {/* Industry Selection */}
          {!selectedIndustry && (
            <View style={styles.industryGrid}>
              {industryCategories.map((industry) => (
                <TouchableOpacity
                  key={industry.id}
                  style={styles.industryCard}
                  onPress={() => setSelectedIndustry(industry)}
                >
                  <Text style={styles.industryIcon}>{industry.icon}</Text>
                  <Text style={styles.industryName}>{industry.name}</Text>
                  <Text style={styles.projectCount}>
                    {industry.projectTypes.length}种类型
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Project Type Selection */}
          {selectedIndustry && (
            <View>
              {/* Back to Industries */}
              <TouchableOpacity 
                style={styles.backToIndustries}
                onPress={() => {
                  setSelectedIndustry(null);
                  handleInputChange('projectType', '');
                }}
              >
                <Icon name="arrow-left" size={16} color="#6b7280" />
                <Text style={styles.backToIndustriesText}>{selectedIndustry.name}</Text>
              </TouchableOpacity>
              
              {/* Project Types Grid */}
              <View style={styles.typeGrid}>
                {selectedIndustry.projectTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      formData.projectType === type.id && styles.selectedTypeCard
                    ]}
                    onPress={() => handleInputChange('projectType', type.id)}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.typeName,
                      formData.projectType === type.id && styles.selectedTypeName
                    ]}>
                      {type.name}
                    </Text>
                    <Text style={[
                      styles.typeDescription,
                      formData.projectType === type.id && styles.selectedTypeDescription
                    ]}>
                      {type.description}
                    </Text>
                    {formData.projectType === type.id && (
                      <Icon 
                        name="check-circle" 
                        size={20} 
                        color="#22c55e" 
                        style={styles.selectedIcon}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

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
    marginBottom: 16,
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
  industryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  industryCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  industryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  industryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  projectCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  backToIndustries: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 16,
  },
  backToIndustriesText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ProjectBasicStep;