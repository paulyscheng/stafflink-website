import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useModal } from '../../../../shared/components/Modal/ModalService';

const ProfileScreen = ({ navigation }) => {
  const { t, currentLanguage, setLanguage } = useLanguage();
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const modal = useModal();
  
  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  
  // User preferences  
  const [notificationSettings, setNotificationSettings] = useState({
    projectUpdates: true,
    workerMessages: true,
    systemNotifications: false,
    emailNotifications: true
  });
  
  // User profile data
  const [userProfile, setUserProfile] = useState({
    name: '张总',
    email: 'zhang@company.com',
    phone: '138****1234',
    position: '项目经理',
    company: '建筑装饰有限公司',
    department: '工程部'
  });
  
  const [companyInfo, setCompanyInfo] = useState({
    name: '建筑装饰有限公司',
    address: '北京市朝阳区建国门外大街23号',
    contact: '010-12345678',
    email: 'info@company.com',
    description: '专业从事建筑装饰工程的企业'
  });

  const handleLanguageToggle = async () => {
    const result = await modal.confirm(
      '选择语言 / Select Language',
      '请选择您的首选语言 / Please select your preferred language',
      [
        { text: '简体中文', value: 'zh' },
        { text: 'English', value: 'en' },
        { text: '取消 / Cancel', value: 'cancel' }
      ]
    );
    
    if (result && result !== 'cancel') {
      setLanguage(result);
    }
  };

  const handleLogout = async () => {
    const confirmed = await modal.confirm(
      t('confirmLogout'),
      t('logoutConfirmMessage')
    );
    
    if (confirmed) {
      logout();
      // Navigation will be handled by AuthContext
    }
  };

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
    },
    profileHeader: {
      backgroundColor: theme.surface,
      alignItems: 'center',
      paddingVertical: 32,
      marginBottom: 24,
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    userCompany: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    userPosition: {
      fontSize: 14,
      color: theme.textMuted,
      marginBottom: 16,
    },
    menuSection: {
      backgroundColor: theme.surface,
      marginBottom: 24,
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    menuItemText: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      marginLeft: 16,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>{t('profile')}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={dynamicStyles.profileHeader}>
          <View style={styles.avatar}>
            <Icon name="user" size={32} color="#ffffff" />
          </View>
          <Text style={dynamicStyles.userName}>{userProfile.name}</Text>
          <Text style={dynamicStyles.userCompany}>{userProfile.company}</Text>
          <Text style={dynamicStyles.userPosition}>{userProfile.position}</Text>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setShowEditProfile(true)}
          >
            <Icon name="edit" size={14} color="#3b82f6" />
            <Text style={styles.editProfileText}>{t('editProfile') || '编辑资料'}</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowEditProfile(true)}
          >
            <Icon name="user-o" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('personalInfo') || '个人信息'}</Text>
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowCompanySettings(true)}
          >
            <Icon name="building-o" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('companySettings') || '公司设置'}</Text>
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => modal.info('功能开发中', '此功能正在开发中，敬请期待。')}
          >
            <Icon name="lock" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('changePassword') || '修改密码'}</Text>
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('preferences')}</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLanguageToggle}>
            <Icon name="globe" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('language')}</Text>
            <Text style={styles.menuItemValue}>
              {currentLanguage === 'zh' ? '简体中文' : 'English'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowNotificationSettings(true)}
          >
            <Icon name="bell-o" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('notifications') || '通知设置'}</Text>
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Icon name="moon-o" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('darkMode') || '深色模式'}</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={isDarkMode ? '#ffffff' : '#f3f4f6'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>{t('support')}</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => modal.info('帮助中心', '如需帮助，请联系客服: 400-123-4567')}
          >
            <Icon name="question-circle-o" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('help') || '帮助中心'}</Text>
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => modal.info('意见反馈', '请发送邮件至: feedback@company.com')}
          >
            <Icon name="comments-o" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('feedback') || '意见反馈'}</Text>
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => modal.info('关于我们', 'StaffLink v1.0.0\n蓝领工人版Uber\n专业的企业工人调度平台')}
          >
            <Icon name="info-circle" size={20} color="#6b7280" />
            <Text style={styles.menuItemText}>{t('about') || '关于我们'}</Text>
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="sign-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <Text style={styles.versionText}>
          {t('version') || '版本'} 1.0.0 Beta
        </Text>
        
        {/* App Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>项目总数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>128</Text>
            <Text style={styles.statLabel}>工人总数</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>98%</Text>
            <Text style={styles.statLabel}>完成率</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Text style={styles.cancelButton}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>编辑资料</Text>
            <TouchableOpacity>
              <Text style={styles.saveButton}>保存</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>姓名</Text>
              <TextInput
                style={styles.textInput}
                value={userProfile.name}
                onChangeText={(text) => setUserProfile(prev => ({...prev, name: text}))}
                placeholder="请输入姓名"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>邮箱</Text>
              <TextInput
                style={styles.textInput}
                value={userProfile.email}
                onChangeText={(text) => setUserProfile(prev => ({...prev, email: text}))}
                placeholder="请输入邮箱"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>电话</Text>
              <TextInput
                style={styles.textInput}
                value={userProfile.phone}
                onChangeText={(text) => setUserProfile(prev => ({...prev, phone: text}))}
                placeholder="请输入电话"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>职位</Text>
              <TextInput
                style={styles.textInput}
                value={userProfile.position}
                onChangeText={(text) => setUserProfile(prev => ({...prev, position: text}))}
                placeholder="请输入职位"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>部门</Text>
              <TextInput
                style={styles.textInput}
                value={userProfile.department}
                onChangeText={(text) => setUserProfile(prev => ({...prev, department: text}))}
                placeholder="请输入部门"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* Notification Settings Modal */}
      <Modal
        visible={showNotificationSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotificationSettings(false)}>
              <Text style={styles.cancelButton}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>通知设置</Text>
            <TouchableOpacity>
              <Text style={styles.saveButton}>保存</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>项目更新通知</Text>
              <Switch
                value={notificationSettings.projectUpdates}
                onValueChange={(value) => setNotificationSettings(prev => ({...prev, projectUpdates: value}))}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>工人消息通知</Text>
              <Switch
                value={notificationSettings.workerMessages}
                onValueChange={(value) => setNotificationSettings(prev => ({...prev, workerMessages: value}))}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>系统通知</Text>
              <Switch
                value={notificationSettings.systemNotifications}
                onValueChange={(value) => setNotificationSettings(prev => ({...prev, systemNotifications: value}))}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>邮件通知</Text>
              <Switch
                value={notificationSettings.emailNotifications}
                onValueChange={(value) => setNotificationSettings(prev => ({...prev, emailNotifications: value}))}
                trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* Company Settings Modal */}
      <Modal
        visible={showCompanySettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCompanySettings(false)}>
              <Text style={styles.cancelButton}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>公司设置</Text>
            <TouchableOpacity>
              <Text style={styles.saveButton}>保存</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>公司名称</Text>
              <TextInput
                style={styles.textInput}
                value={companyInfo.name}
                onChangeText={(text) => setCompanyInfo(prev => ({...prev, name: text}))}
                placeholder="请输入公司名称"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>公司地址</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={companyInfo.address}
                onChangeText={(text) => setCompanyInfo(prev => ({...prev, address: text}))}
                placeholder="请输入公司地址"
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>联系电话</Text>
              <TextInput
                style={styles.textInput}
                value={companyInfo.contact}
                onChangeText={(text) => setCompanyInfo(prev => ({...prev, contact: text}))}
                placeholder="请输入联系电话"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>公司邮箱</Text>
              <TextInput
                style={styles.textInput}
                value={companyInfo.email}
                onChangeText={(text) => setCompanyInfo(prev => ({...prev, email: text}))}
                placeholder="请输入公司邮箱"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>公司简介</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={companyInfo.description}
                onChangeText={(text) => setCompanyInfo(prev => ({...prev, description: text}))}
                placeholder="请输入公司简介"
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userCompany: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  editProfileText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 6,
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginBottom: 24,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
  },
  menuItemValue: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  saveButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
});

export default ProfileScreen;