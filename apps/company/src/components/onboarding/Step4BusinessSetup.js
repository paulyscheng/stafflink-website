import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';
import ProgressBar from '../ProgressBar';

const Step4BusinessSetup = ({ onNext, onBack, initialData }) => {
  const [formData, setFormData] = useState({
    businessType: initialData?.businessType || '',
    teamSize: initialData?.teamSize || '',
  });
  const { t } = useLanguage();
  const modal = useModal();

  // Get the industry from the previous step
  const selectedIndustry = initialData?.industry || '';

  const handleNext = () => {
    if (!formData.businessType) {
      modal.error(t('error'), t('pleaseSelectBusinessType'));
      return;
    }

    onNext(formData);
  };

  // Dynamic business types based on selected industry
  const getBusinessTypes = () => {
    switch (selectedIndustry) {
      case 'foodservice':
        return [
          { id: 'tea_restaurant', name: t('teaRestaurant') },
          { id: 'fast_food', name: t('fastFood') },
          { id: 'hot_pot', name: t('hotPot') },
          { id: 'chinese_restaurant', name: t('chineseRestaurant') },
          { id: 'western_restaurant', name: t('westernRestaurant') },
          { id: 'coffee_shop', name: t('coffeeShop') },
          { id: 'hotel_dining', name: t('hotelDining') },
          { id: 'takeaway', name: t('takeaway') },
          { id: 'other_food', name: t('otherFood') },
        ];
      case 'construction':
        return [
          { id: 'home_decoration', name: t('homeDecoration') },
          { id: 'commercial_decoration', name: t('commercialDecoration') },
          { id: 'plumbing_electrical', name: t('plumbingElectrical') },
          { id: 'renovation_team', name: t('renovationTeam') },
          { id: 'construction_team', name: t('constructionTeam') },
          { id: 'maintenance_service', name: t('maintenanceService') },
          { id: 'other_construction', name: t('otherConstruction') },
        ];
      case 'manufacturing':
        return [
          { id: 'electronics_mfg', name: t('electronicsMfg') },
          { id: 'textile_mfg', name: t('textileMfg') },
          { id: 'food_processing', name: t('foodProcessing') },
          { id: 'auto_parts', name: t('autoParts') },
          { id: 'plastic_products', name: t('plasticProducts') },
          { id: 'metal_processing', name: t('metalProcessing') },
          { id: 'other_manufacturing', name: t('otherManufacturing') },
        ];
      case 'logistics':
        return [
          { id: 'express_delivery', name: t('expressDelivery') },
          { id: 'warehouse_mgmt', name: t('warehouseMgmt') },
          { id: 'cargo_handling', name: t('cargoHandling') },
          { id: 'freight_transport', name: t('freightTransport') },
          { id: 'sorting_center', name: t('sortingCenter') },
          { id: 'other_logistics', name: t('otherLogistics') },
        ];
      default:
        return [
          { id: 'cleaning_service', name: t('cleaningService') },
          { id: 'security_service', name: t('securityService') },
          { id: 'repair_service', name: t('repairService') },
          { id: 'landscaping', name: t('landscaping') },
          { id: 'property_mgmt', name: t('propertyMgmt') },
          { id: 'other_service', name: t('otherService') },
        ];
    }
  };

  const teamSizes = [
    { id: '1-10', name: t('teamSize1to10') },
    { id: '11-30', name: t('teamSize11to30') },
    { id: '31-50', name: t('teamSize31to50') },
    { id: '50+', name: t('teamSize50plus') },
  ];

  const businessTypes = getBusinessTypes();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <ProgressBar 
          currentStep={4} 
          totalSteps={5} 
          stepLabel={t('step4BusinessDetails')}
        />

        {/* Page Title */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('whatSpecificBusinessType')}</Text>
          <Text style={styles.description}>
            {t('basedOnYourIndustrySelection')}
          </Text>
        </View>

        {/* Business Type Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('selectSpecificBusinessType')}</Text>
          <View style={styles.optionsGrid}>
            {businessTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.optionCard,
                  formData.businessType === type.id && styles.selectedOption
                ]}
                onPress={() => setFormData(prev => ({ ...prev, businessType: type.id }))}
              >
                <View style={styles.radioButton}>
                  {formData.businessType === type.id && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[
                  styles.optionText,
                  formData.businessType === type.id && styles.selectedOptionText
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Team Size Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('teamSizeQuestion')}</Text>
          <Text style={styles.sectionSubtitle}>{t('howManyWorkersManage')}</Text>
          <View style={styles.teamSizeContainer}>
            {teamSizes.map((size) => (
              <TouchableOpacity
                key={size.id}
                style={[
                  styles.teamSizeOption,
                  formData.teamSize === size.id && styles.selectedTeamSize
                ]}
                onPress={() => setFormData(prev => ({ ...prev, teamSize: size.id }))}
              >
                <View style={styles.radioButton}>
                  {formData.teamSize === size.id && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[
                  styles.teamSizeText,
                  formData.teamSize === size.id && styles.selectedTeamSizeText
                ]}>
                  {size.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backButtonText}>{t('back')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.nextButton, !formData.businessType && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!formData.businessType}
          >
            <Text style={[styles.nextButtonText, !formData.businessType && styles.nextButtonTextDisabled]}>
              {t('nextStep')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 20,
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'left',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: 8,
  },
  sectionContainer: {
    marginBottom: 40,
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
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#16a34a',
    fontWeight: '500',
  },
  teamSizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  teamSizeOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  selectedTeamSize: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  teamSizeText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedTeamSizeText: {
    color: '#16a34a',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    flex: 0.4,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 0.6,
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default Step4BusinessSetup;