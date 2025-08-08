import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../../contexts/LanguageContext';
import Step1BasicInfo from './Step1BasicInfo';
import Step2CompanyInfo from './Step2CompanyInfo';
import Step3IndustrySelection from './Step3IndustrySelection';
import Step4BusinessSetup from './Step4BusinessSetup';
import Step5Complete from './Step5Complete';

const OnboardingFlow = ({ initialData, onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    phoneNumber: initialData?.phoneNumber || '',
    user: initialData?.user || null,
    step1Data: null,
    step2Data: null,
    step3Data: null,
    step4Data: null,
    step5Data: null,
  });
  const { t } = useLanguage();

  const handleStep1Next = (step1Data) => {
    setOnboardingData(prev => ({
      ...prev,
      step1Data: step1Data,
    }));
    setCurrentStep(2);
  };

  const handleStep2Next = (step2Data) => {
    setOnboardingData(prev => ({
      ...prev,
      step2Data: step2Data,
    }));
    setCurrentStep(3);
  };

  const handleStep3Next = (step3Data) => {
    setOnboardingData(prev => ({
      ...prev,
      step3Data: step3Data,
    }));
    setCurrentStep(4);
  };

  const handleStep4Next = (step4Data) => {
    setOnboardingData(prev => ({
      ...prev,
      step4Data: step4Data,
    }));
    setCurrentStep(5);
  };

  const handleStep5Next = (step5Data) => {
    const completeData = {
      ...onboardingData,
      step5Data: step5Data,
    };
    setOnboardingData(completeData);
    
    // Complete onboarding process
    if (onComplete) {
      onComplete(completeData);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(onboardingData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            onNext={handleStep1Next}
            onBack={handleBack}
            initialPhoneNumber={onboardingData.phoneNumber}
          />
        );
      case 2:
        return (
          <Step2CompanyInfo
            onNext={handleStep2Next}
            onBack={handleBack}
            initialData={onboardingData.step1Data}
          />
        );
      case 3:
        return (
          <Step3IndustrySelection
            onNext={handleStep3Next}
            onBack={handleBack}
            initialData={onboardingData.step2Data}
          />
        );
      case 4:
        return (
          <Step4BusinessSetup
            onNext={handleStep4Next}
            onBack={handleBack}
            initialData={onboardingData.step3Data}
          />
        );
      case 5:
        return (
          <Step5Complete
            onNext={handleStep5Next}
            onBack={handleBack}
            initialData={{
              ...onboardingData,
              phoneNumber: onboardingData.phoneNumber,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Icon name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === 1 && t('step1BasicInfo')}
          {currentStep === 2 && t('step2CompanyInfo')}
          {currentStep === 3 && t('step3IndustrySelection')}
          {currentStep === 4 && t('step4BusinessDetails')}
          {currentStep === 5 && t('step5Complete')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Current Step Content */}
      <View style={styles.content}>
        {renderCurrentStep()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingFlow;