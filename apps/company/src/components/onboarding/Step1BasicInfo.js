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
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';
import ProgressBar from '../ProgressBar';

const Step1BasicInfo = ({ onNext, onBack, initialPhoneNumber }) => {
  const [formData, setFormData] = useState({
    contactName: '',
    phoneNumber: initialPhoneNumber || '',
    email: '',
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
    if (!formData.contactName.trim()) {
      modal.error(t('error'), t('pleaseEnterName'));
      return;
    }

    if (!formData.phoneNumber.trim()) {
      modal.error(t('error'), t('pleaseEnterPhone'));
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
          currentStep={1} 
          totalSteps={5} 
          stepLabel={t('step1BasicInfo')}
        />

        {/* Page Title */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('freeTrialActivated')}</Text>
          <Text style={styles.description}>{t('personalizeExperience')}</Text>
        </View>

        {/* Contact Name Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('contactNamePlaceholder')}
            value={formData.contactName}
            onChangeText={(value) => handleInputChange('contactName', value)}
            autoCapitalize="words"
          />
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, initialPhoneNumber && styles.disabledInput]}
            placeholder={t('phoneNumberPlaceholder')}
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            keyboardType="phone-pad"
            editable={!initialPhoneNumber} // Disable if phone number is already verified
          />
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
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
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  nextButton: {
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

export default Step1BasicInfo;