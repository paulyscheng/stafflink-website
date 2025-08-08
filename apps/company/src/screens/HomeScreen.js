import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

const HomeScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { getUnreadCount } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'in_progress', 'draft', 'completed'
  const unreadCount = getUnreadCount();

  // Load projects from API
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getProjects(); // Get all projects
      
      // ApiService returns the projects array directly
      setProjects(data || []);
    } catch (error) {
      console.error('Failed to load projects for home:', error);
      // Use empty array as fallback
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from projects
  const getProjectStats = () => {
    const total = projects.length;
    const draft = projects.filter(p => p.status === 'draft').length;
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const cancelled = projects.filter(p => p.status === 'cancelled').length;
    
    // 进行中的项目 = in_progress 
    const active = inProgress;
    // 待开始的项目 = draft
    const pending = draft;
    
    return { total, active, completed, pending, draft, inProgress, cancelled };
  };

  // Get filtered projects based on active filter
  const getFilteredProjects = () => {
    let filteredProjects = projects;
    
    if (activeFilter !== 'all') {
      filteredProjects = projects.filter(p => p.status === activeFilter);
    }
    
    return filteredProjects
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by newest first
  };

  // Get display projects (always show only 3 most recent)
  const getDisplayProjects = () => {
    const filtered = getFilteredProjects();
    return filtered.slice(0, 3); // Always show only 3 most recent
  };

  // Get active projects for display (recently created or in progress) - used when filter is 'all'
  const getActiveProjects = () => {
    return projects
      .filter(p => p.status === 'draft' || p.status === 'in_progress')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by newest first
      .slice(0, 3); // Show first 3
  };

  const stats = getProjectStats();
  const allFilteredProjects = getFilteredProjects();
  const displayProjects = activeFilter === 'all' ? getActiveProjects() : getDisplayProjects();

  // Initial load
  useEffect(() => {
    loadProjects();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.refresh) {
        console.log('🔄 HomeScreen focused with refresh flag, reloading projects...');
        loadProjects();
        // Clear the refresh flag
        navigation.setParams({ refresh: false });
      } else {
        loadProjects();
      }
    }, [route?.params?.refresh])
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#f59e0b';
      case 'in_progress': return '#22c55e';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return '待开始';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>{t('goodMorning')}</Text>
            <Text style={styles.companyName}>{t('yourCompany')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="bell-o" size={24} color="#374151" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Today Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.cardTitle}>{t('todayOverview')}</Text>
          <View style={styles.overviewStats}>
            <TouchableOpacity 
              style={[styles.statItem, activeFilter === 'in_progress' && styles.activeStatItem]} 
              onPress={() => setActiveFilter(activeFilter === 'in_progress' ? 'all' : 'in_progress')}
            >
              <Text style={[styles.statNumber, activeFilter === 'in_progress' && styles.activeStatText]}>{stats.active}</Text>
              <Text style={[styles.statLabel, activeFilter === 'in_progress' && styles.activeStatText]}>{t('activeProjects')}</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={[styles.statItem, activeFilter === 'draft' && styles.activeStatItem]}
              onPress={() => setActiveFilter(activeFilter === 'draft' ? 'all' : 'draft')}
            >
              <Text style={[styles.statNumber, activeFilter === 'draft' && styles.activeStatText]}>{stats.pending}</Text>
              <Text style={[styles.statLabel, activeFilter === 'draft' && styles.activeStatText]}>待开始项目</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={[styles.statItem, activeFilter === 'completed' && styles.activeStatItem]}
              onPress={() => setActiveFilter(activeFilter === 'completed' ? 'all' : 'completed')}
            >
              <Text style={[styles.statNumber, activeFilter === 'completed' && styles.activeStatText]}>{stats.completed}</Text>
              <Text style={[styles.statLabel, activeFilter === 'completed' && styles.activeStatText]}>{t('completedTasks')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Projects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.sectionTitle}>
                {activeFilter === 'all' ? t('myProjects') : 
                 activeFilter === 'in_progress' ? '进行中的项目' :
                 activeFilter === 'draft' ? '待开始的项目' :
                 activeFilter === 'completed' ? '已完成的项目' : t('myProjects')}
              </Text>
              {activeFilter !== 'all' && (
                <TouchableOpacity 
                  style={styles.filterResetTag}
                  onPress={() => setActiveFilter('all')}
                >
                  <Text style={styles.filterResetTagText}>查看全部 ✕</Text>
                </TouchableOpacity>
              )}
              {activeFilter !== 'all' && allFilteredProjects.length > 3 && (
                <Text style={styles.projectCountText}>
                  显示最近3个，共{allFilteredProjects.length}个
                </Text>
              )}
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Projects', { 
                status: activeFilter === 'all' ? null : activeFilter,
                // 不传 title，保持原有的"项目"标题
              })}
            >
              <Text style={styles.seeAllText}>
                {activeFilter !== 'all' && allFilteredProjects.length > 3 
                  ? `查看全部 ${allFilteredProjects.length}个` 
                  : activeFilter !== 'all' 
                    ? '管理项目'
                    : '管理项目'}
              </Text>
            </TouchableOpacity>
          </View>
          
          
          {/* Projects List or Empty State */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>加载项目中...</Text>
            </View>
          ) : displayProjects.length > 0 ? (
            <View style={styles.projectsList}>
              {displayProjects.map((project) => (
                <TouchableOpacity 
                  key={project.id} 
                  style={styles.projectCard}
                  onPress={() => navigation.navigate('ProjectDetail', { project })}
                >
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName}>{project.project_name || project.projectName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.projectAddress}>{project.project_address || project.projectAddress}</Text>
                  <View style={styles.projectFooter}>
                    <Text style={styles.projectDate}>
                      {formatDate(project.start_date || project.startDate)} - {formatDate(project.end_date || project.endDate)}
                    </Text>
                    <Text style={styles.workerCount}>
                      {project.required_workers || project.selectedWorkers?.length || 0}位工人
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="folder-o" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>{t('noProjectsYet')}</Text>
              <Text style={styles.emptyStateDescription}>
                {t('clickToAddFirstProject')}
              </Text>
              <TouchableOpacity 
                style={styles.addProjectButton}
                onPress={() => navigation.navigate('CreateProject')}
              >
                <Icon name="plus" size={16} color="#ffffff" />
                <Text style={styles.addProjectButtonText}>{t('newProject')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('quickActions')}</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Projects')}
            >
              <Icon name="calendar" size={24} color="#3b82f6" />
              <Text style={styles.quickActionText}>{t('viewSchedule')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Workers')}
            >
              <Icon name="users" size={24} color="#10b981" />
              <Text style={styles.quickActionText}>{t('manageWorkers')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="cog" size={24} color="#8b5cf6" />
              <Text style={styles.quickActionText}>{t('settings')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Icon name="bar-chart" size={24} color="#f59e0b" />
              <Text style={styles.quickActionText}>{t('reports')}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeStatItem: {
    backgroundColor: '#eff6ff',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  activeStatText: {
    color: '#2563eb',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  projectCountText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  filterResetTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  filterResetTagText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addProjectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  projectAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  workerCount: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  resetFilterButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginBottom: 12,
  },
  resetFilterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default HomeScreen;