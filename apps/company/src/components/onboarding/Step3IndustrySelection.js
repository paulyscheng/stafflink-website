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
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';
import ProgressBar from '../ProgressBar';

const Step3IndustrySelection = ({ onNext, onBack, initialData }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(initialData?.industry || '');
  const { t } = useLanguage();
  const modal = useModal();

  const handleNext = () => {
    if (!selectedIndustry) {
      modal.error(t('error'), t('pleaseSelectIndustry'));
      return;
    }

    onNext({ industry: selectedIndustry });
  };

  const industries = [
    {
      id: 'construction',
      name: t('constructionRenovation'),
      description: t('constructionDesc'),
      emoji: '🏗️',
      icon: 'wrench'
    },
    {
      id: 'foodservice',
      name: t('foodService'),
      description: t('foodServiceDesc'),
      emoji: '🍽️',
      icon: 'cutlery'
    },
    {
      id: 'manufacturing',
      name: t('manufacturing'),
      description: t('manufacturingDesc'),
      emoji: '🏭',
      icon: 'industry'
    },
    {
      id: 'logistics',
      name: t('logisticsWarehousing'),
      description: t('logisticsDesc'),
      emoji: '📦',
      icon: 'truck'
    },
    {
      id: 'other',
      name: t('otherServices'),
      description: t('otherServicesDesc'),
      emoji: '🔧',
      icon: 'cogs'
    }
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <ProgressBar 
          currentStep={3} 
          totalSteps={5} 
          stepLabel={t('step3IndustrySelection')}
        />

        {/* Page Title */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{t('whatIndustryQuestion')}</Text>
          <Text style={styles.description}>{t('selectIndustryCustomize')}</Text>
        </View>

        {/* Industry Selection Cards */}
        <View style={styles.industryContainer}>
          {industries.map((industry) => (
            <TouchableOpacity
              key={industry.id}
              style={[
                styles.industryCard,
                selectedIndustry === industry.id && styles.selectedCard
              ]}
              onPress={() => setSelectedIndustry(industry.id)}
            >
              {/* Icon and Emoji */}
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.emoji}>{industry.emoji}</Text>
                </View>
                {selectedIndustry === industry.id && (
                  <Icon name="check-circle" size={20} color="#22c55e" />
                )}
              </View>
              
              {/* Industry Name */}
              <Text style={[
                styles.industryName,
                selectedIndustry === industry.id && styles.selectedText
              ]}>
                {industry.name}
              </Text>
              
              {/* Industry Description */}
              <Text style={[
                styles.industryDescription,
                selectedIndustry === industry.id && styles.selectedDescText
              ]}>
                {industry.description}
              </Text>
            </TouchableOpacity>
          ))}
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
            style={[styles.nextButton, !selectedIndustry && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!selectedIndustry}
          >
            <Text style={[styles.nextButtonText, !selectedIndustry && styles.nextButtonTextDisabled]}>
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
  industryContainer: {
    marginBottom: 20,
  },
  industryCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  industryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  selectedText: {
    color: '#16a34a',
  },
  industryDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  selectedDescText: {
    color: '#15803d',
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

export default Step3IndustrySelection;