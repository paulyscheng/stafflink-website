import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useModal } from '../../../../shared/components/Modal/ModalService';
import ApiService from '../services/api';
import LoadingSpinner from '../../../../shared/components/Loading/LoadingSpinner';

const ProfileScreen = () => {
  const { t } = useLanguage();
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const modal = useModal();
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalWorkers: 0,
    rating: 0,
  });

  // 当页面获得焦点时刷新数据（比如从企业信息页面返回）
  useFocusEffect(
    React.useCallback(() => {
      if (isInitialLoad) {
        setIsInitialLoad(false);
        loadUserProfile();
      } else {
        // 不是初次加载时，静默刷新（不显示loading）
        loadUserProfile(false);
      }
    }, [isInitialLoad])
  );

  const loadUserProfile = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await ApiService.getProfile();
      
      if (response && response.user) {
        const userData = response.user;
        setUserProfile({
          id: userData.id,
          name: userData.contact_person || '未设置',
          phone: userData.phone || '',
          position: userData.position || '负责人',
          company: userData.company_name || '未设置',
          address: userData.address || '未设置',
          industry: userData.industry || '',
          companySize: userData.company_size || '',
          logoUrl: userData.logo_url || null,
          email: userData.email || '',
          rating: userData.rating || 0,
        });

        // 设置统计数据
        if (userData.stats) {
          setStats({
            activeProjects: userData.stats.active_projects || 0,
            completedProjects: userData.stats.completed_projects || 0,
            totalWorkers: userData.stats.total_workers || 0,
            rating: userData.rating || 0,
          });
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserProfile();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const MenuSection = ({ title, children }) => (
    <View style={styles.menuSection}>
      {title && <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>}
      <View style={styles.menuContent}>{children}</View>
    </View>
  );

  // 处理未实现的功能
  const handleComingSoon = (featureName) => {
    modal.info('功能开发中', `${featureName}功能正在开发中，敬请期待！`);
  };

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, color, comingSoon = false }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={comingSoon ? () => handleComingSoon(title) : onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, color && { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color || theme.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {showArrow && <Icon name="chevron-right" size={24} color={theme.textMuted} />}
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header Profile Card */}
        <LinearGradient
          colors={['#1e40af', '#3b82f6']}
          style={styles.headerGradient}
        >
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {userProfile?.company?.charAt(0) || 'C'}
                </Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.companyName}>{userProfile?.company}</Text>
                <Text style={styles.userName}>{userProfile?.name} · {userProfile?.position}</Text>
                {stats.rating > 0 && (
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={16} color="#fbbf24" />
                    <Text style={styles.ratingText}>{stats.rating.toFixed(1)} 企业评分</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard 
            icon="assignment" 
            value={stats.activeProjects} 
            label="进行中" 
            color="#3b82f6" 
          />
          <StatCard 
            icon="check-circle" 
            value={stats.completedProjects} 
            label="已完成" 
            color="#10b981" 
          />
          <StatCard 
            icon="people" 
            value={stats.totalWorkers} 
            label="合作工人" 
            color="#f59e0b" 
          />
        </View>

        {/* Company Management */}
        <MenuSection title="企业管理">
          <MenuItem 
            icon="business"
            title="企业信息"
            subtitle="管理企业基本信息和认证"
            onPress={() => navigation.navigate('CompanyInfo')}
            color="#3b82f6"
          />
          <MenuItem 
            icon="verified-user"
            title="资质认证"
            subtitle="企业资质和证书管理"
            comingSoon={true}
            color="#10b981"
          />
          <MenuItem 
            icon="account-balance"
            title="财务中心"
            subtitle="账单、发票和支付管理"
            comingSoon={true}
            color="#f59e0b"
          />
        </MenuSection>

        {/* Account Settings */}
        <MenuSection title="账户设置">
          <MenuItem 
            icon="person"
            title="个人资料"
            subtitle="联系人信息设置"
            comingSoon={true}
          />
          <MenuItem 
            icon="security"
            title="账户安全"
            subtitle="密码和登录管理"
            comingSoon={true}
          />
          <MenuItem 
            icon="notifications"
            title="通知设置"
            subtitle="消息推送偏好"
            comingSoon={true}
          />
        </MenuSection>

        {/* Support */}
        <MenuSection title="支持与服务">
          <MenuItem 
            icon="help-outline"
            title="帮助中心"
            comingSoon={true}
          />
          <MenuItem 
            icon="feedback"
            title="意见反馈"
            comingSoon={true}
          />
          <MenuItem 
            icon="info-outline"
            title="关于我们"
            comingSoon={true}
          />
          <MenuItem 
            icon="description"
            title="服务协议"
            comingSoon={true}
          />
        </MenuSection>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Icon name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>StaffLink Business v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
  },
  profileHeader: {
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContent: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 30,
  },
});

export default ProfileScreen;