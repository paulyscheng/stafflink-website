import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useModal } from '../../../../shared/components/Modal/ModalService';
import LoadingSpinner from '../../../../shared/components/Loading/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';

// Import step components (updated flow)
import ProjectBasicStep from '../components/createProject/ProjectBasicStep';
import NewWorkRequirementsStep from '../components/createProject/NewWorkRequirementsStep';
import NewTimeScheduleStep from '../components/createProject/NewTimeScheduleStep';
import SelectWorkersStep from '../components/createProject/SelectWorkersStep';
import NewConfirmSendStep from '../components/createProject/NewConfirmSendStep';

const CreateProjectWizard = ({ navigation }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const modal = useModal();
  
  // Initial project data
  const getInitialProjectData = () => ({
    // Step 1: Project Basic
    projectName: '',
    projectAddress: '',
    projectType: '', // Industry-specific project type (e.g., 'home_renovation')
    priority: 'normal',
    
    // Step 2: Work Requirements
    requiredSkills: [],
    requiredWorkers: 1,
    workDescription: '',
    experienceLevel: 'intermediate',
    
    // Step 3: Time Schedule & Salary
    timeNature: 'onetime', // 'onetime' or 'recurring' (time nature)
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    workingDays: [],
    timeNotes: '',
    paymentType: 'hourly',
    budgetRange: '',
    
    // Step 4: Select Workers
    selectedWorkers: [],
    selectedWorkerDetails: [], // Complete worker information
    
    // Step 5: Confirm Send
    notificationMethods: {
      inApp: true,
      sms: false,
      call: false,
    },
    replyDeadline: '1hour',
  });

  const [projectData, setProjectData] = useState(getInitialProjectData());

  // Reset wizard when screen comes into focus (when user taps + button)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 CreateProjectWizard focused, resetting state...');
      setCurrentStep(1);
      setProjectData(getInitialProjectData());
    }, [])
  );

  const handleStepNext = (stepData) => {
    setProjectData(prev => ({
      ...prev,
      ...stepData,
    }));
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleComplete = async (finalData) => {
    const completeProjectData = {
      ...projectData,
      ...finalData,
    };
    
    console.log('Final project data before submission:', completeProjectData);
    console.log('Required skills selected:', completeProjectData.requiredSkills);
    
    try {
      // Convert frontend data to API format
      const apiProjectData = {
        project_name: completeProjectData.projectName,
        project_address: completeProjectData.projectAddress,
        project_type: completeProjectData.projectType,
        priority: completeProjectData.priority || 'normal',
        required_workers: completeProjectData.requiredWorkers,
        work_description: completeProjectData.workDescription,
        experience_level: completeProjectData.experienceLevel || 'intermediate',
        time_nature: completeProjectData.timeNature || 'onetime',
        start_date: completeProjectData.startDate,
        end_date: completeProjectData.endDate,
        start_time: completeProjectData.startTime,
        end_time: completeProjectData.endTime,
        working_days: completeProjectData.workingDays,
        time_notes: completeProjectData.timeNotes,
        payment_type: completeProjectData.paymentType,
        budget_range: completeProjectData.budgetRange,
        estimated_duration: completeProjectData.estimatedDuration,
        selected_workers: completeProjectData.selectedWorkers || [],
        notification_methods: Object.keys(completeProjectData.notificationMethods || {})
          .filter(key => completeProjectData.notificationMethods[key])
          .map(key => key.toUpperCase()),
        skills: (completeProjectData.requiredSkills || []).map(skillId => ({
          skill_id: skillId, // Use string ID directly
          required_level: 1,
          is_mandatory: true
        }))
      };

      console.log('Creating project with data:', apiProjectData);
      console.log('Skills being sent:', apiProjectData.skills);
      
      // Call real API
      const response = await ApiService.createProject(apiProjectData);
      
      if (response) {
        await modal.success(
          '项目创建成功',
          '项目已成功创建并发布！'
        );
        // 导航回项目列表页面并触发刷新
        navigation.navigate('Projects', { 
          refresh: true,
          newProject: response 
        });
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Project creation failed:', error);
      modal.error(
        '创建失败',
        '项目创建失败，请检查网络连接后重试。'
      );
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return t('projectBasicInfo');
      case 2:
        return t('workRequirements');
      case 3:
        return t('timeSchedule');
      case 4:
        return t('selectWorkers');
      case 5:
        return t('confirmSend');
      default:
        return '';
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProjectBasicStep
            initialData={projectData}
            onNext={handleStepNext}
            onBack={handleStepBack}
          />
        );
      case 2:
        return (
          <NewWorkRequirementsStep
            initialData={projectData}
            onNext={handleStepNext}
            onBack={handleStepBack}
          />
        );
      case 3:
        return (
          <NewTimeScheduleStep
            initialData={projectData}
            onNext={handleStepNext}
            onBack={handleStepBack}
          />
        );
      case 4:
        return (
          <SelectWorkersStep
            initialData={projectData}
            onNext={handleStepNext}
            onBack={handleStepBack}
          />
        );
      case 5:
        return (
          <NewConfirmSendStep
            initialData={projectData}
            onNext={handleComplete}
            onBack={handleStepBack}
            projectData={projectData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={5} 
          stepLabel={getStepTitle()}
        />
      </View>

      {/* Current Step Content */}
      <View style={styles.stepContainer}>
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stepContainer: {
    flex: 1,
  },
});

export default CreateProjectWizard;