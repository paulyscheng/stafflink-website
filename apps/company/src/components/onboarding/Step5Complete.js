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
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';
import ProgressBar from '../ProgressBar';

const Step5Complete = ({ onNext, onBack, initialData }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  
  const { t } = useLanguage();
  const modal = useModal();


  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComplete = async () => {
    // Validation
    if (!formData.password || formData.password.length < 6) {
      modal.error(t('error'), t('passwordMinLength'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      modal.error(t('error'), t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    
    try {
      // Complete registration with all collected data
      const completeData = {
        ...initialData,
        password: formData.password,
      };
      
      if (onNext) {
        onNext(completeData);
      }
    } catch (error) {
      modal.error(t('error'), t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <ProgressBar 
          currentStep={5} 
          totalSteps={5} 
          stepLabel={t('step5Complete')}
        />

        {/* Page Title */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('completeSetup')}</Text>
          <Text style={styles.description}>
            {t('lastStepSetPassword')}
          </Text>
        </View>

        {/* Password Setup Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('setLoginPassword')}*</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterPassword6to20')}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={true}
              maxLength={20}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('confirmPassword')}*</Text>
            <TextInput
              style={styles.input}
              placeholder={t('enterPasswordAgain')}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={true}
              maxLength={20}
            />
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
            style={[
              styles.completeButton,
              loading && styles.completeButtonDisabled
            ]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={[
                styles.completeButtonText,
                loading && styles.completeButtonTextDisabled
              ]}>
                {t('completeRegistration')}
              </Text>
            )}
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  completeButton: {
    flex: 0.6,
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default Step5Complete;