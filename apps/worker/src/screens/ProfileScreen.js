import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: () => {
            logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={20} color="#3b82f6" />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && <Icon name="angle-right" size={16} color="#9ca3af" />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <View style={styles.avatar}>
              <Icon name="user" size={32} color="#ffffff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userPhone}>{user?.phone}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: user?.status === 'online' ? '#22c55e' : '#6b7280' }]} />
                <Text style={styles.statusText}>
                  {user?.status === 'online' ? '在线' : '离线'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Icon name="edit" size={16} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.completedJobs || 0}</Text>
            <Text style={styles.statLabel}>完成工作</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.totalEarnings || 0}</Text>
            <Text style={styles.statLabel}>总收入(元)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user?.rating || 4.8}</Text>
            <Text style={styles.statLabel}>评分</Text>
          </View>
        </View>

        {/* Work Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>工作信息</Text>
          <MenuItem
            icon="wrench"
            title="我的技能"
            subtitle="管理你的专业技能"
            onPress={() => Alert.alert('提示', '技能管理功能开发中')}
          />
          <MenuItem
            icon="star"
            title="我的评价"
            subtitle="查看客户对你的评价"
            onPress={() => Alert.alert('提示', '评价查看功能开发中')}
          />
          <MenuItem
            icon="certificate"
            title="资质证书"
            subtitle="上传和管理你的证书"
            onPress={() => Alert.alert('提示', '证书管理功能开发中')}
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置</Text>
          <MenuItem
            icon="bell"
            title="通知设置"
            subtitle="管理通知推送"
            showArrow={false}
            rightComponent={
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={notificationEnabled ? '#ffffff' : '#f4f3f4'}
              />
            }
          />
          <MenuItem
            icon="map-marker"
            title="位置服务"
            subtitle="允许获取位置信息"
            showArrow={false}
            rightComponent={
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                thumbColor={locationEnabled ? '#ffffff' : '#f4f3f4'}
              />
            }
          />
          <MenuItem
            icon="lock"
            title="隐私设置"
            subtitle="管理个人信息隐私"
            onPress={() => Alert.alert('提示', '隐私设置功能开发中')}
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账户</Text>
          <MenuItem
            icon="credit-card"
            title="收款设置"
            subtitle="管理收款账户"
            onPress={() => Alert.alert('提示', '收款设置功能开发中')}
          />
          <MenuItem
            icon="shield"
            title="安全中心"
            subtitle="账户安全设置"
            onPress={() => Alert.alert('提示', '安全中心功能开发中')}
          />
          <MenuItem
            icon="question-circle"
            title="帮助中心"
            subtitle="常见问题和客服"
            onPress={() => Alert.alert('提示', '帮助中心功能开发中')}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <MenuItem
            icon="info-circle"
            title="关于我们"
            subtitle="了解BlueShift Worker"
            onPress={() => Alert.alert('关于', 'BlueShift Worker v1.0.0\n专业的蓝领工作平台')}
          />
          <MenuItem
            icon="file-text"
            title="用户协议"
            subtitle="查看用户协议"
            onPress={() => Alert.alert('提示', '用户协议功能开发中')}
          />
          <MenuItem
            icon="eye"
            title="隐私政策"
            subtitle="查看隐私政策"
            onPress={() => Alert.alert('提示', '隐私政策功能开发中')}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="sign-out" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default ProfileScreen;