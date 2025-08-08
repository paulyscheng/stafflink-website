import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';
import ProgressBar from '../ProgressBar';

const Step2CompanyInfo = ({ onNext, onBack, initialData }) => {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    businessAddress: initialData?.businessAddress || '',
    companyDescription: initialData?.companyDescription || '',
  });
  const { t } = useLanguage();
  const modal = useModal();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (!formData.companyName.trim()) {
      modal.error(t('error'), t('pleaseEnterCompanyName'));
      return;
    }

    if (!formData.businessAddress.trim()) {
      modal.error(t('error'), t('pleaseEnterBusinessAddress'));
      return;
    }

    onNext(formData);
  };


  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <ProgressBar 
          currentStep={2} 
          totalSteps={5} 
          stepLabel={t('step2CompanyInfo')}
        />

        {/* Page Title */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('tellUsAboutCompany')}</Text>
          <Text style={styles.description}>{t('companyInfoHelpUs')}</Text>
        </View>

        {/* Company Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('companyNameRequired')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterCompanyName')}
            value={formData.companyName}
            onChangeText={(value) => handleInputChange('companyName', value)}
            autoCapitalize="words"
          />
        </View>


        {/* Business Address Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('businessAddressRequired')}</Text>
          <View style={styles.addressContainer}>
            <TextInput
              style={styles.addressInput}
              placeholder={t('enterBusinessAddress')}
              value={formData.businessAddress}
              onChangeText={(value) => handleInputChange('businessAddress', value)}
              multiline={true}
              numberOfLines={2}
            />
            <TouchableOpacity style={styles.locationButton}>
              <Icon name="map-marker" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Company Description Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('companyDescription')} {t('optional')}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('briefDescriptionCompany')}
            value={formData.companyDescription}
            onChangeText={(value) => handleInputChange('companyDescription', value)}
            multiline={true}
            numberOfLines={4}
            maxLength={100}
          />
          <Text style={styles.characterCount}>{formData.companyDescription.length}/100</Text>
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
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>{t('nextStep')}</Text>
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
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
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
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Step2CompanyInfo;