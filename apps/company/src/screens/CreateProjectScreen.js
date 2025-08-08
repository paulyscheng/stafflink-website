import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';

const CreateProjectScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    projectAddress: '',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    description: '',
    workerCount: 5,
    skills: [],
    urgency: 'normal',
  });
  const [loading, setLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const { t } = useLanguage();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateProject = async () => {
    // 验证必填字段
    if (!formData.projectName.trim()) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入项目名称');
      return;
    }

    if (!formData.projectAddress.trim()) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入项目地址');
      return;
    }

    setLoading(true);

    try {
      // 准备项目数据
      const projectData = {
        name: formData.projectName.trim(),
        location: formData.projectAddress.trim(),
        start_date: formData.startDate.toISOString().split('T')[0],
        end_date: formData.endDate.toISOString().split('T')[0],
        description: formData.description.trim() || null,
        budget: 50000, // 默认预算
        required_workers: formData.workerCount,
        required_skills: formData.skills.length > 0 ? formData.skills : ['普工'],
        urgency: formData.urgency,
        status: 'planning',
      };

      // 调用API创建项目
      const response = await ApiService.createProject(projectData);

      if (response && response.id) {
        console.log('项目创建成功:', response);
        
        // 自动创建工人邀请
        if (formData.workerCount > 0) {
          try {
            const invitations = [];
            for (let i = 0; i < formData.workerCount; i++) {
              invitations.push({
                project_id: response.id,
                worker_id: null, // 将由后端分配
                message: `邀请您参与${formData.projectName}项目`,
                wage_amount: 300, // 默认日薪
                start_date: formData.startDate.toISOString().split('T')[0],
                end_date: formData.endDate.toISOString().split('T')[0],
              });
            }
            
            // 批量创建邀请
            await Promise.all(invitations.map(inv => 
              ApiService.createInvitation(inv)
            ));
            
            console.log(`已发送${formData.workerCount}个工人邀请`);
          } catch (inviteError) {
            console.error('创建邀请失败:', inviteError);
          }
        }

        // TODO: 使用自定义Toast替代
        console.log('项目创建成功');
        
        // 返回并刷新项目列表
        navigation.navigate('Projects', { refresh: true });
      } else {
        throw new Error('创建项目失败');
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      // TODO: 使用自定义Dialog替代
      console.error(error.message || '创建项目失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (type === 'start') {
      setShowStartPicker(false);
      if (selectedDate) {
        setFormData(prev => ({ ...prev, startDate: selectedDate }));
      }
    } else {
      setShowEndPicker(false);
      if (selectedDate) {
        setFormData(prev => ({ ...prev, endDate: selectedDate }));
      }
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="times" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('createProject')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Project Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('projectName')}*</Text>
          <TextInput
            style={styles.input}
            placeholder={t('enterProjectName')}
            value={formData.projectName}
            onChangeText={(value) => handleInputChange('projectName', value)}
            autoFocus={true}
          />
        </View>

        {/* Project Address */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('projectAddress')}*</Text>
          <View style={styles.addressContainer}>
            <TextInput
              style={styles.addressInput}
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

        {/* Date Selection */}
        <View style={styles.dateRow}>
          <View style={styles.dateContainer}>
            <Text style={styles.label}>{t('startDate')}</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowStartPicker(true)}
            >
              <Icon name="calendar" size={16} color="#9ca3af" />
              <Text style={[styles.dateText, formData.startDate && { color: '#374151' }]}>
                {formatDate(formData.startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.label}>{t('endDate')}</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowEndPicker(true)}
            >
              <Icon name="calendar" size={16} color="#9ca3af" />
              <Text style={[styles.dateText, formData.endDate && { color: '#374151' }]}>
                {formatDate(formData.endDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Project Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('projectDescription')} {t('optional')}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('enterProjectDescription')}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline={true}
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.characterCount}>
            {formData.description.length}/200
          </Text>
        </View>

        {/* Worker Requirements */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>所需工人数量</Text>
          <View style={styles.workerCountContainer}>
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => setFormData(prev => ({ 
                ...prev, 
                workerCount: Math.max(1, prev.workerCount - 1) 
              }))}
            >
              <Icon name="minus" size={16} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.countText}>{formData.workerCount} 人</Text>
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => setFormData(prev => ({ 
                ...prev, 
                workerCount: Math.min(50, prev.workerCount + 1) 
              }))}
            >
              <Icon name="plus" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Urgency Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>紧急程度</Text>
          <View style={styles.urgencyContainer}>
            {['normal', 'urgent', 'very_urgent'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.urgencyOption,
                  formData.urgency === level && styles.urgencyOptionActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, urgency: level }))}
              >
                <Text style={[
                  styles.urgencyText,
                  formData.urgency === level && styles.urgencyTextActive
                ]}>
                  {level === 'normal' ? '普通' : level === 'urgent' ? '紧急' : '非常紧急'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateProject}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>{t('createProject')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={formData.startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleDateChange(event, date, 'start')}
          minimumDate={new Date()}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={formData.endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => handleDateChange(event, date, 'end')}
          minimumDate={formData.startDate}
        />
      )}
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateContainer: {
    flex: 0.48,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  dateText: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 12,
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
  quickOptionsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  quickOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '500',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    flex: 0.4,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  createButton: {
    flex: 0.6,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  workerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  countButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginHorizontal: 32,
  },
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urgencyOption: {
    flex: 0.31,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  urgencyOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  urgencyTextActive: {
    color: '#ffffff',
  },
});

export default CreateProjectScreen;