import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useModal } from '../../../../shared/components/Modal/ModalService';
import LoadingSpinner from '../../../../shared/components/Loading/LoadingSpinner';
import { SkeletonList } from '../../../../shared/components/Loading/SkeletonLoader';
import ErrorView, { EmptyView } from '../../../../shared/components/Error/ErrorView';

const ProjectsScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 10
  });
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    draft: 0,
    inProgress: 0,
    completed: 0
  });
  const [error, setError] = useState(null);
  const modal = useModal();

  // Load status counts for all project states
  const loadStatusCounts = async () => {
    try {
      // Get counts for each status by calling API with limit=1 to get totalProjects count
      // For now, get all projects and count by status locally
      const allProjects = await ApiService.getProjects();
      
      const allResponse = { success: true, data: { pagination: { totalProjects: allProjects.length } } };
      const draftResponse = { success: true, data: { pagination: { totalProjects: allProjects.filter(p => p.status === 'draft').length } } };
      const inProgressResponse = { success: true, data: { pagination: { totalProjects: allProjects.filter(p => p.status === 'in_progress').length } } };
      const completedResponse = { success: true, data: { pagination: { totalProjects: allProjects.filter(p => p.status === 'completed').length } } };

      setStatusCounts({
        all: allResponse.success ? allResponse.data.pagination.totalProjects : 0,
        draft: draftResponse.success ? draftResponse.data.pagination.totalProjects : 0,
        inProgress: inProgressResponse.success ? inProgressResponse.data.pagination.totalProjects : 0,
        completed: completedResponse.success ? completedResponse.data.pagination.totalProjects : 0
      });
    } catch (error) {
      console.error('Failed to load status counts:', error);
    }
  };

  // Load projects from API
  const loadProjects = async (page = 1, status = null, search = null) => {
    try {
      setLoading(page === 1);
      setRefreshing(page !== 1);
      
      // Get all projects and filter locally
      const allProjects = await ApiService.getProjects(status === 'all' ? null : status);
      
      // Apply search filter locally if needed
      let filteredProjects = allProjects || [];
      if (search?.trim()) {
        const searchLower = search.toLowerCase();
        filteredProjects = filteredProjects.filter(p => 
          p.project_name?.toLowerCase().includes(searchLower) ||
          p.project_address?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply pagination locally
      const limit = 10;
      const startIndex = (page - 1) * limit;
      const paginatedProjects = filteredProjects.slice(startIndex, startIndex + limit);
      
      setProjects(paginatedProjects);
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(filteredProjects.length / limit),
        totalProjects: filteredProjects.length,
        hasNextPage: startIndex + limit < filteredProjects.length,
        hasPreviousPage: page > 1,
        limit
      });
    } catch (error) {
      console.error('Failed to load projects:', error);
      setError(error);
      modal.error(
        t('error') || '错误',
        t('failedToLoadProjects') || '加载项目失败，请重试'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and handle status filter from route params
  useEffect(() => {
    const initialStatus = route?.params?.status || 'all';
    setActiveFilter(initialStatus);
    loadProjects(1, initialStatus);
    loadStatusCounts(); // Load all status counts
  }, [route?.params?.status]);

  // Refresh when screen comes into focus (e.g., after creating a project)
  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.refresh) {
        console.log('🔄 Screen focused with refresh flag, reloading projects...');
        loadProjects(1, activeFilter, searchQuery);
        loadStatusCounts(); // Also refresh status counts
        // Clear the refresh flag
        navigation.setParams({ refresh: false });
      }
    }, [route?.params?.refresh, activeFilter, searchQuery])
  );

  // Reload when filter or search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProjects(1, activeFilter, searchQuery);
    }, 300); // Debounce search
    
    return () => clearTimeout(timeoutId);
  }, [activeFilter, searchQuery]);

  const getFilteredProjects = () => {
    // API already handles filtering, so just return projects
    return projects;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'in_progress':
        return { bg: '#dcfce7', text: '#16a34a' };
      case 'completed':
        return { bg: '#e0e7ff', text: '#4f46e5' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft':
        return '待开始';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // Use statusCounts from API
  const filteredProjects = getFilteredProjects();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('projects')}
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateProject')}
        >
          <Icon name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchProjects')}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="times-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'all' && styles.activeTab]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeTabText]}>
              全部{activeFilter === 'all' ? ` (${statusCounts.all})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'draft' && styles.activeTab]}
            onPress={() => setActiveFilter('draft')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'draft' && styles.activeTabText]}>
              待开始{activeFilter === 'draft' ? ` (${statusCounts.draft})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'in_progress' && styles.activeTab]}
            onPress={() => setActiveFilter('in_progress')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'in_progress' && styles.activeTabText]}>
              进行中{activeFilter === 'in_progress' ? ` (${statusCounts.inProgress})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'completed' && styles.activeTab]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'completed' && styles.activeTabText]}>
              已完成{activeFilter === 'completed' ? ` (${statusCounts.completed})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading ? (
          <SkeletonList count={5} />
        ) : filteredProjects.length === 0 ? (
          <EmptyView
            icon={searchQuery ? "search" : "folder-open-o"}
            title={searchQuery ? '未找到匹配项目' : (t('noProjectsYet') || '暂无项目')}
            message={searchQuery 
              ? `没有找到包含"${searchQuery}"的项目` 
              : (t('startByCreatingFirstProject') || '开始创建您的第一个项目')
            }
            actionText={!searchQuery ? (t('createFirstProject') || '创建首个项目') : null}
            onAction={!searchQuery ? () => navigation.navigate('CreateProject') : null}
          />
        ) : (
          <View style={styles.projectsList}>
            {filteredProjects.map((project) => {
              const statusColors = getStatusColor(project.status);
              return (
                <TouchableOpacity 
                  key={project.id} 
                  style={styles.projectCard}
                  onPress={() => navigation.navigate('ProjectDetail', { project })}
                >
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectName}>{project.project_name || 'Untitled Project'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {getStatusText(project.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.projectAddress}>{project.project_address || 'No address'}</Text>
                  <View style={styles.projectStats}>
                    <Text style={styles.projectStat}>
                      {project.required_workers || 0} 位工人
                    </Text>
                    <Text style={styles.projectStat}>·</Text>
                    <Text style={styles.projectStat}>
                      {formatDate(project.start_date)} - {formatDate(project.end_date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.paginationButton, !pagination.hasPreviousPage && styles.disabledButton]}
                  onPress={() => pagination.hasPreviousPage && loadProjects(pagination.currentPage - 1, activeFilter, searchQuery)}
                  disabled={!pagination.hasPreviousPage}
                >
                  <Text style={[styles.paginationButtonText, !pagination.hasPreviousPage && styles.disabledButtonText]}>
                    {t('previous') || '上一页'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.paginationInfo}>
                  {pagination.currentPage} / {pagination.totalPages}
                </Text>
                
                <TouchableOpacity
                  style={[styles.paginationButton, !pagination.hasNextPage && styles.disabledButton]}
                  onPress={() => pagination.hasNextPage && loadProjects(pagination.currentPage + 1, activeFilter, searchQuery)}
                  disabled={!pagination.hasNextPage}
                >
                  <Text style={[styles.paginationButtonText, !pagination.hasNextPage && styles.disabledButtonText]}>
                    {t('next') || '下一页'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginLeft: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createProjectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  projectsList: {
    paddingBottom: 20,
  },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16a34a',
  },
  projectAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  projectStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectStat: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default ProjectsScreen;