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
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';
import ProgressBar from '../ProgressBar';
import { TextInput } from 'react-native';

const Step3IndustrySelection = ({ onNext, onBack, initialData }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(initialData?.industry || '');
  const { t } = useLanguage();
  const modal = useModal();

  const handleNext = () => {
    if (!selectedIndustry) {
      modal.error('错误', '请选择您的行业');
      return;
    }

    onNext({ industry: selectedIndustry });
  };

  const industries = [
    {
      id: 'construction',
      name: '建筑/装修',
      description: '建筑、装修、工程承包等',
      icon: 'construction',
      popularJobs: ['木工', '泥瓦工', '水电工', '油漆工']
    },
    {
      id: 'foodservice',
      name: '餐饮服务',
      description: '餐厅、酒店、食堂等',
      icon: 'restaurant',
      popularJobs: ['厨师', '服务员', '洗碗工', '配菜员']
    },
    {
      id: 'manufacturing',
      name: '制造业',
      description: '工厂、车间、生产线等',
      icon: 'factory',
      popularJobs: ['普工', '技工', '包装工', '质检员']
    },
    {
      id: 'logistics',
      name: '物流/仓储',
      description: '快递、搬运、仓库管理等',
      icon: 'local-shipping',
      popularJobs: ['搬运工', '分捡员', '司机', '仓管员']
    },
    {
      id: 'cleaning',
      name: '保洁/物业',
      description: '清洁、保安、绿化等',
      icon: 'cleaning-services',
      popularJobs: ['保洁员', '保安', '绿化工', '维修工']
    },
    {
      id: 'other',
      name: '其他服务',
      description: '其他需要蓝领工人的行业',
      icon: 'more-horiz',
      popularJobs: ['临时工', '铟金工', '维修工', '其他']
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
          <Text style={styles.title}>您的企业属于哪个行业？</Text>
          <Text style={styles.description}>选择所在行业，我们将为您匹配相关工种</Text>
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
              {/* Card Content */}
              <View style={styles.cardContent}>
                {/* Icon */}
                <View style={[
                  styles.iconContainer,
                  selectedIndustry === industry.id && styles.selectedIconContainer
                ]}>
                  <MaterialIcon 
                    name={industry.icon} 
                    size={32} 
                    color={selectedIndustry === industry.id ? '#22c55e' : '#6b7280'} 
                  />
                </View>
                
                {/* Text Content */}
                <View style={styles.textContent}>
                  {/* Industry Name */}
                  <View style={styles.nameRow}>
                    <Text style={[
                      styles.industryName,
                      selectedIndustry === industry.id && styles.selectedText
                    ]}>
                      {industry.name}
                    </Text>
                    {selectedIndustry === industry.id && (
                      <MaterialIcon name="check-circle" size={20} color="#22c55e" />
                    )}
                  </View>
                  
                  {/* Industry Description */}
                  <Text style={[
                    styles.industryDescription,
                    selectedIndustry === industry.id && styles.selectedDescText
                  ]}>
                    {industry.description}
                  </Text>
                  
                  {/* Popular Jobs */}
                  <View style={styles.jobsContainer}>
                    {industry.popularJobs.slice(0, 3).map((job, index) => (
                      <View key={index} style={[
                        styles.jobTag,
                        selectedIndustry === industry.id && styles.selectedJobTag
                      ]}>
                        <Text style={[
                          styles.jobText,
                          selectedIndustry === industry.id && styles.selectedJobText
                        ]}>
                          {job}
                        </Text>
                      </View>
                    ))}
                    {industry.popularJobs.length > 3 && (
                      <Text style={styles.moreJobs}>+{industry.popularJobs.length - 3}</Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backButtonText}>上一步</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.nextButton, !selectedIndustry && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!selectedIndustry}
          >
            <Text style={[styles.nextButtonText, !selectedIndustry && styles.nextButtonTextDisabled]}>
              下一步
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContent: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: '#dcfce7',
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
    marginBottom: 12,
  },
  selectedDescText: {
    color: '#15803d',
  },
  jobsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  jobTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectedJobTag: {
    backgroundColor: '#dcfce7',
  },
  jobText: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedJobText: {
    color: '#15803d',
  },
  moreJobs: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 20,
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