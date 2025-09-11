import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useModal } from '../../../../shared/components/Modal/ModalService';
import LoadingSpinner from '../../../../shared/components/Loading/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import ProfessionalProgressBar from '../components/createProject/ProfessionalProgressBar';
import draftManager from '../utils/draftManager';

// Import step components (updated flow)
import ProjectBasicStep from '../components/createProject/ProjectBasicStepV2';
import NewWorkRequirementsStep from '../components/createProject/NewWorkRequirementsStep';
import NewTimeScheduleStep from '../components/createProject/NewTimeScheduleStep';
import SelectWorkersStep from '../components/createProject/SelectWorkersStep';
import NewConfirmSendStep from '../components/createProject/NewConfirmSendStep';

const CreateProjectWizard = ({ navigation, route }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [draftId, setDraftId] = useState(route?.params?.draftId || null);
  const modal = useModal();
  const autoSaveCleanup = useRef(null);
  
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

  // Load draft if draftId provided
  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        const draft = await draftManager.loadDraft(draftId);
        if (draft) {
          setProjectData(draft.data);
          setCurrentStep(draft.currentStep || 1);
          setCompletedSteps(draft.completedSteps || []);
        }
      }
    };
    loadDraft();
  }, [draftId]);

  // Set up auto-save
  useEffect(() => {
    const cleanup = draftManager.setupAutoSave(
      () => ({
        ...projectData,
        currentStep,
        completedSteps,
      }),
      draftId,
      30000 // Save every 30 seconds
    );
    
    autoSaveCleanup.current = cleanup;
    
    return () => {
      if (autoSaveCleanup.current) {
        autoSaveCleanup.current();
      }
    };
  }, [projectData, currentStep, completedSteps, draftId]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleExit();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Reset wizard when screen comes into focus (when user taps + button)
  useFocusEffect(
    React.useCallback(() => {
      if (!draftId) {
        console.log('🔄 CreateProjectWizard focused, resetting state...');
        setCurrentStep(1);
        setCompletedSteps([]);
        setProjectData(getInitialProjectData());
      }
    }, [draftId])
  );

  const handleStepNext = (stepData) => {
    setProjectData(prev => ({
      ...prev,
      ...stepData,
    }));
    
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      handleExit();
    }
  };

  // Handle exit with save prompt
  const handleExit = () => {
    // Only prompt if there's meaningful data
    if (projectData.projectName || completedSteps.length > 0) {
      modal.confirm(
        t('saveDraft') || '保存草稿',
        t('saveDraftMessage') || '是否保存当前项目为草稿？',
        async () => {
          // Save and exit
          const savedId = await draftManager.saveDraft({
            ...projectData,
            currentStep,
            completedSteps,
          }, draftId);
          
          navigation.navigate('Projects', { 
            showDraftSaved: true,
            draftId: savedId 
          });
        },
        () => {
          // Exit without saving
          navigation.goBack();
        }
      );
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
        // Delete draft if exists
        if (draftId) {
          await draftManager.deleteDraft(draftId);
        }
        
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

  // Define steps for progress bar
  const steps = [
    { id: 1, name: t('projectBasicInfoShort') },
    { id: 2, name: t('workRequirements') },
    { id: 3, name: t('timeSchedule') },
    { id: 4, name: t('selectWorkers') },
    { id: 5, name: t('confirmSend') }
  ];

  // Handle step navigation from progress bar
  const handleStepPress = (stepId) => {
    if (stepId < currentStep && completedSteps.includes(stepId)) {
      setCurrentStep(stepId);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Progress Bar */}
      <ProfessionalProgressBar 
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepPress={handleStepPress}
      />

      {/* Current Step Content */}
      <View style={styles.stepContainer}>
        {renderCurrentStep()}
      </View>

      {/* Loading Overlay */}
      {submitting && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  stepContainer: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateProjectWizard;