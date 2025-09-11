import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import ApiService from '../services/api';
import LoadingSpinner from '../../../../shared/components/Loading/LoadingSpinner';
import PositionSelector from '../components/onboarding/PositionSelector';

// 将FormField组件移到外部，避免重新创建
const FormField = ({ label, field, value, onChangeText, placeholder, keyboardType, multiline, required, theme }) => (
  <View style={styles.fieldContainer}>
    <Text style={[styles.fieldLabel, { color: theme.text }]}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TextInput
      style={[
        styles.fieldInput,
        { 
          color: theme.text,
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        multiline && styles.multilineInput
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
    />
  </View>
);

const CompanyInfoScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState({
    company_name: '',
    contact_person: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    industry: '',
    company_size: '',
  });
  const [originalData, setOriginalData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  useEffect(() => {
    // 检查是否有修改
    const changed = JSON.stringify(companyData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [companyData, originalData]);

  const loadCompanyInfo = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getProfile();
      
      if (response && response.user) {
        const userData = response.user;
        const data = {
          company_name: userData.company_name || '',
          contact_person: userData.contact_person || '',
          position: userData.position || '',
          phone: userData.phone || '',
          email: userData.email || '',
          address: userData.address || '',
          industry: userData.industry || '',
          company_size: userData.company_size || '',
        };
        setCompanyData(data);
        setOriginalData(data);
      }
    } catch (error) {
      console.error('Load company info error:', error);
      Alert.alert('加载失败', '无法加载企业信息，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    // 验证必填字段
    if (!companyData.company_name || !companyData.contact_person || !companyData.phone) {
      Alert.alert('提示', '请填写必填项：企业名称、联系人和联系电话');
      return;
    }

    try {
      setSaving(true);
      const response = await ApiService.updateProfile(companyData);
      
      if (response && response.success) {
        setOriginalData(companyData);
        Alert.alert('保存成功', '企业信息已更新', [
          { text: '确定', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response?.error || '保存失败');
      }
    } catch (error) {
      console.error('Save company info error:', error);
      Alert.alert('保存失败', error.message || '无法保存企业信息，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>企业信息</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={!hasChanges || saving}
          style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={[
              styles.saveButtonText,
              { color: hasChanges ? '#3b82f6' : theme.textMuted }
            ]}>
              保存
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>基本信息</Text>
              
              <FormField
                label="企业名称"
                field="company_name"
                value={companyData.company_name}
                onChangeText={(value) => handleFieldChange('company_name', value)}
                placeholder="请输入企业全称"
                required
                theme={theme}
              />

              <FormField
                label="联系人"
                field="contact_person"
                value={companyData.contact_person}
                onChangeText={(value) => handleFieldChange('contact_person', value)}
                placeholder="请输入联系人姓名"
                required
                theme={theme}
              />

              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>
                  职位 <Text style={styles.required}>*</Text>
                </Text>
                <PositionSelector
                  value={companyData.position}
                  onValueChange={(value) => handleFieldChange('position', value)}
                  placeholder="请选择职位"
                />
              </View>

              <FormField
                label="联系电话"
                field="phone"
                value={companyData.phone}
                onChangeText={(value) => handleFieldChange('phone', value)}
                placeholder="请输入手机号码"
                keyboardType="phone-pad"
                required
                theme={theme}
              />

              <FormField
                label="企业邮箱"
                field="email"
                value={companyData.email}
                onChangeText={(value) => handleFieldChange('email', value)}
                placeholder="请输入企业邮箱"
                keyboardType="email-address"
                theme={theme}
              />
            </View>

            {/* Company Details */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>企业详情</Text>
              
              <FormField
                label="企业地址"
                field="address"
                value={companyData.address}
                onChangeText={(value) => handleFieldChange('address', value)}
                placeholder="请输入详细地址"
                multiline
                required
                theme={theme}
              />
            </View>

            {/* Tips */}
            <View style={[styles.tipsContainer, { backgroundColor: '#f0f9ff' }]}>
              <Icon name="info" size={20} color="#3b82f6" />
              <Text style={[styles.tipsText, { color: '#1e40af' }]}>
                完善的企业信息有助于工人更好地了解您的企业，提高匹配成功率
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tipsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});

export default CompanyInfoScreen;