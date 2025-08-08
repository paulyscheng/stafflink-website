import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';
import ApiService from '../../services/api';
import { 
  calculateWorkerProjectDistance, 
  formatDistance, 
  generateMockWorkerAddress,
  getDistanceRecommendation 
} from '../../../../../shared/utils/locationUtils';

const SelectWorkersStep = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    selectedWorkers: initialData?.selectedWorkers || [],
    searchQuery: '',
    filterBy: 'recommended', // 'recommended', 'available', 'all', 'unavailable'
  });

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const modal = useModal();

  // 获取可用工人
  const loadWorkers = async () => {
    setLoading(true);
    try {
      // 获取项目所需技能
      const requiredSkills = initialData?.requiredSkills || [];
      const data = await ApiService.getAvailableWorkers(requiredSkills);
      
      // 添加推荐标记和真实距离计算
      const projectData = {
        projectAddress: initialData?.projectAddress || '北京市朝阳区'
      };
      
      const workersWithExtras = data.map((worker, index) => {
        // 为工人生成地址（如果没有的话）
        if (!worker.address) {
          worker.address = generateMockWorkerAddress(worker.id || index);
        }
        
        // 计算真实距离
        const distance = calculateWorkerProjectDistance(worker, projectData);
        const distanceRecommendation = getDistanceRecommendation(distance);
        
        return {
          ...worker,
          isRecommended: (worker.rating >= 4.5 && worker.status === 'online') || 
                        distanceRecommendation === 'excellent',
          distance,
          distanceText: formatDistance(distance),
          distanceRecommendation,
          isNearby: distance <= 5,
          hourlyRate: worker.wageOffer || 80,
          lastActive: worker.status === 'online' ? '在线' : '离线',
          completedJobs: worker.completedProjects || 0
        };
      });
      
      // 按距离排序
      workersWithExtras.sort((a, b) => a.distance - b.distance);
      
      setWorkers(workersWithExtras);
    } catch (error) {
      console.error('获取工人列表失败:', error);
      // 使用模拟数据作为备用
      const sampleWorkers = [
    {
      id: '1',
      name: '张师傅',
      phone: '138****5678',
      skills: ['水电安装', '电工'],
      experience: '5年',
      rating: 4.8,
      status: 'available',
      completedJobs: 128,
      hourlyRate: 80,
      distance: 2.3,
      isRecommended: true,
    },
    {
      id: '2', 
      name: '李师傅',
      phone: '139****1234',
      skills: ['木工', '油漆工'],
      experience: '8年',
      rating: 4.6,
      status: 'available',
      completedJobs: 245,
      hourlyRate: 65,
      distance: 1.8,
      isRecommended: true,
    },
    {
      id: '7',
      name: '吴师傅',
      skills: ['painting', 'waterproofing'],
      experience: 'intermediate',
      rating: 4.4,
      completedJobs: 78,
      hourlyRate: 60,
      avatar: null,
      status: 'busy',
      distance: 3.5,
      isRecommended: false,
      lastActive: '4小时前',
    },
    {
      id: '8',
      name: '周师傅',
      skills: ['carpentry', 'electrician'],
      experience: 'experienced',
      rating: 4.9,
      completedJobs: 189,
      hourlyRate: 85,
      avatar: null,
      status: 'available',
      distance: 1.9,
      isRecommended: true,
      lastActive: '30分钟前',
    },
  ];
      setWorkers(sampleWorkers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleWorkerSelection = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    if (worker && worker.status === 'busy') {
      modal.warning(t('hint'), t('workerBusyAlert'));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      selectedWorkers: prev.selectedWorkers.includes(workerId)
        ? prev.selectedWorkers.filter(id => id !== workerId)
        : [...prev.selectedWorkers, workerId]
    }));
  };

  const getFilteredWorkers = () => {
    let filtered = workers;

    // Filter by search query
    if (formData.searchQuery) {
      filtered = filtered.filter(worker => 
        worker.name.toLowerCase().includes(formData.searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (formData.filterBy === 'available') {
      filtered = filtered.filter(worker => worker.status === 'available');
    } else if (formData.filterBy === 'recommended') {
      filtered = filtered.filter(worker => worker.isRecommended && worker.status === 'available');
    }

    // Sort for 'all' tab: available workers first, then busy workers
    if (formData.filterBy === 'all') {
      filtered = filtered.sort((a, b) => {
        if (a.status === 'available' && b.status === 'busy') return -1;
        if (a.status === 'busy' && b.status === 'available') return 1;
        return 0;
      });
    }

    return filtered;
  };

  const getSkillName = (skillId) => {
    const skillMap = {
      'plumbingInstall': '水电安装',
      'electrician': '电工', 
      'carpentry': '木工',
      'painting': '油漆',
      'tiling': '铺砖',
      'masonry': '泥瓦工',
      'waterproofing': '防水工',
      'plumbing': '水电',
      'electrical': '电工',
      'welding': '焊接',
      'cleaning': '清洁',
      'general': '通用工'
    };
    return skillMap[skillId] || skillId;
  };

  const getStatusColor = (status) => {
    return status === 'available' ? '#22c55e' : '#f59e0b';
  };

  const getStatusText = (status) => {
    return status === 'available' ? t('availableStatus') : t('busyStatus');
  };

  const isFormValid = () => {
    return formData.selectedWorkers.length > 0;
  };

  const handleNext = () => {
    if (!isFormValid()) {
      modal.warning(t('hint'), t('selectAtLeastOneWorker'));
      return;
    }
    
    // Get complete worker data for selected workers
    const selectedWorkerDetails = workers.filter(worker => 
      formData.selectedWorkers.includes(worker.id)
    );
    
    // Pass both the IDs and the complete worker data
    const dataToPass = {
      ...formData,
      selectedWorkerDetails: selectedWorkerDetails
    };
    
    onNext(dataToPass);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('selectWorkers')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={16} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchWorkerName')}
              value={formData.searchQuery}
              onChangeText={(value) => handleInputChange('searchQuery', value)}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, formData.filterBy === 'recommended' && styles.activeFilterTab]}
            onPress={() => handleInputChange('filterBy', 'recommended')}
          >
            <Text style={[styles.filterTabText, formData.filterBy === 'recommended' && styles.activeFilterTabText]}>
              {t('recommendedWorkers')} ({workers.filter(w => w.isRecommended && w.status === 'available').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, formData.filterBy === 'available' && styles.activeFilterTab]}
            onPress={() => handleInputChange('filterBy', 'available')}
          >
            <Text style={[styles.filterTabText, formData.filterBy === 'available' && styles.activeFilterTabText]}>
              {t('availableWorkers')} ({workers.filter(w => w.status === 'available').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, formData.filterBy === 'all' && styles.activeFilterTab]}
            onPress={() => handleInputChange('filterBy', 'all')}
          >
            <Text style={[styles.filterTabText, formData.filterBy === 'all' && styles.activeFilterTabText]}>
              {t('allWorkers')} ({workers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Workers Summary */}
        {formData.selectedWorkers.length > 0 && (
          <View style={styles.selectedSummary}>
            <Icon name="check-circle" size={16} color="#22c55e" />
            <Text style={styles.selectedSummaryText}>
              {t('workersSelected').replace('{count}', formData.selectedWorkers.length)}
            </Text>
          </View>
        )}

        {/* Workers List */}
        <View style={styles.workersContainer}>
          {getFilteredWorkers().map((worker) => (
            <TouchableOpacity
              key={worker.id}
              style={[
                styles.workerCard,
                formData.selectedWorkers.includes(worker.id) && styles.selectedWorkerCard,
                worker.status === 'busy' && styles.disabledWorkerCard
              ]}
              onPress={() => toggleWorkerSelection(worker.id)}
              disabled={worker.status === 'busy'}
            >
              {/* Worker Header */}
              <View style={styles.workerHeader}>
                <View style={styles.workerAvatarContainer}>
                  <View style={styles.workerAvatar}>
                    <Text style={styles.workerAvatarText}>{worker.name.charAt(0)}</Text>
                  </View>
                  {worker.isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Icon name="star" size={10} color="#ffffff" />
                    </View>
                  )}
                </View>
                
                <View style={styles.workerInfo}>
                  <View style={styles.workerNameRow}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(worker.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(worker.status)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.workerMeta}>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={12} color="#fbbf24" />
                      <Text style={styles.ratingText}>{worker.rating}</Text>
                      <Text style={styles.jobsText}>({worker.completedJobs}单)</Text>
                    </View>
                    <Icon name="map-marker" size={12} color={worker.isNearby ? '#22c55e' : '#6b7280'} style={{ marginLeft: 8 }} />
                    <Text style={[styles.distanceText, worker.isNearby && styles.nearbyDistance]}>
                      {worker.distanceText || formatDistance(worker.distance)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.selectionIndicator}>
                  {worker.status === 'busy' ? (
                    <Icon name="ban" size={24} color="#dc2626" />
                  ) : formData.selectedWorkers.includes(worker.id) ? (
                    <Icon name="check-circle" size={24} color="#22c55e" />
                  ) : (
                    <View style={styles.unselectedCircle} />
                  )}
                </View>
              </View>

              {/* Worker Skills */}
              <View style={styles.skillsContainer}>
                {worker.skills.map((skill) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{getSkillName(skill)}</Text>
                  </View>
                ))}
              </View>

              {/* Worker Details */}
              <View style={styles.workerDetails}>
                <View style={styles.detailItem}>
                  <Icon name="clock-o" size={12} color="#6b7280" />
                  <Text style={styles.detailText}>{t('lastActive')}: {worker.lastActive}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {getFilteredWorkers().length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="users" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>{t('noMatchingWorkers')}</Text>
            <Text style={styles.emptyText}>{t('adjustSearchFilter')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.backButtonBottom}
          onPress={onBack}
        >
          <Icon name="arrow-left" size={16} color="#374151" />
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.nextButton, !isFormValid() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid()}
        >
          <Text style={[styles.nextButtonText, !isFormValid() && styles.nextButtonTextDisabled]}>
            {t('nextStep')} {formData.selectedWorkers.length > 0 && `(${formData.selectedWorkers.length})`}
          </Text>
          <Icon name="arrow-right" size={16} color={isFormValid() ? "#ffffff" : "#9ca3af"} />
        </TouchableOpacity>
      </View>
    </View>
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
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#374151',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterTabText: {
    color: '#ffffff',
  },
  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedSummaryText: {
    fontSize: 14,
    color: '#16a34a',
    marginLeft: 8,
    fontWeight: '500',
  },
  workersContainer: {
    gap: 16,
  },
  workerCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  selectedWorkerCard: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  disabledWorkerCard: {
    opacity: 0.5,
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  workerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerInfo: {
    flex: 1,
  },
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  workerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  jobsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  distanceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  skillTagText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  workerDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  bottomContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButtonBottom: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  nextButton: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  nextButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default SelectWorkersStep;