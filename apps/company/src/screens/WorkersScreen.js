import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';
import { useModal } from '../../../../shared/components/Modal/ModalService';
import LoadingSpinner from '../../../../shared/components/Loading/LoadingSpinner';
import { SkeletonList } from '../../../../shared/components/Loading/SkeletonLoader';
import { EmptyView } from '../../../../shared/components/Error/ErrorView';

const WorkersScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddWorker, setShowAddWorker] = useState(false);
  
  // Add worker form state
  const [newWorkerForm, setNewWorkerForm] = useState({
    name: '',
    phone: '',
    skills: [],
    experience: '1-3年'
  });
  
  // Skills selection state
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    construction: true, // Default expand first category
    food_beverage: false,
    manufacturing: false,
    logistics: false,
    general_services: false
  });
  
  // Complete skills organized by categories
  const skillCategories = [
    {
      id: 'construction',
      name: '建筑装修',
      icon: '🏗️',
      skills: [
        { id: 'plumbingInstall', name: '水电安装', icon: '🔧' },
        { id: 'electrician', name: '电工', icon: '⚡' },
        { id: 'carpentry', name: '木工', icon: '🪚' },
        { id: 'painting', name: '油漆工', icon: '🎨' },
        { id: 'tiling', name: '铺砖工', icon: '🧱' },
        { id: 'masonry', name: '泥瓦工', icon: '🏗️' },
        { id: 'waterproofing', name: '防水工', icon: '💧' },
        { id: 'ceilingInstall', name: '吊顶安装', icon: '🏠' },
        { id: 'glassInstall', name: '玻璃安装', icon: '🪟' },
        { id: 'plumber', name: '水管工', icon: '🚰' },
        { id: 'pipeInstall', name: '管道安装', icon: '🔧' },
        { id: 'weakCurrent', name: '弱电工', icon: '📡' },
        { id: 'locksmith', name: '锁匠', icon: '🔐' },
        { id: 'applianceRepair', name: '家电维修', icon: '🔧' },
        { id: 'rebarWorker', name: '钢筋工', icon: '⚙️' },
        { id: 'concreteWorker', name: '混凝土工', icon: '🏗️' },
        { id: 'welding', name: '焊工', icon: '🔥' },
        { id: 'scaffoldWorker', name: '脚手架工', icon: '🏗️' },
        { id: 'surveyor', name: '测量员', icon: '📐' }
      ]
    },
    {
      id: 'food_beverage',
      name: '餐饮服务',
      icon: '🍽️',
      skills: [
        { id: 'barista', name: '咖啡师', icon: '☕' },
        { id: 'waiter', name: '服务员', icon: '🍽️' },
        { id: 'cashier', name: '收银员', icon: '💰' },
        { id: 'cleaner', name: '清洁工', icon: '🧹' },
        { id: 'chef', name: '厨师', icon: '👨‍🍳' },
        { id: 'kitchenHelper', name: '厨房助手', icon: '🥘' },
        { id: 'dishwasher', name: '洗碗工', icon: '🍽️' },
        { id: 'operator', name: '操作员', icon: '⚙️' },
        { id: 'deliveryWorker', name: '配送员', icon: '🚚' },
        { id: 'bbqChef', name: '烧烤师', icon: '🔥' },
        { id: 'foodRunner', name: '传菜员', icon: '🏃' }
      ]
    },
    {
      id: 'manufacturing',
      name: '制造业',
      icon: '🏭',
      skills: [
        { id: 'assemblyWorker', name: '装配工', icon: '🔧' },
        { id: 'solderer', name: '焊接工', icon: '🔥' },
        { id: 'qualityInspector', name: '质检员', icon: '🔍' },
        { id: 'packagingWorker', name: '包装工', icon: '📦' },
        { id: 'machineOperator', name: '机器操作员', icon: '⚙️' },
        { id: 'sewingWorker', name: '缝纫工', icon: '🧵' },
        { id: 'cuttingWorker', name: '切割工', icon: '✂️' },
        { id: 'ironingWorker', name: '熨烫工', icon: '👔' },
        { id: 'foodProcessor', name: '食品加工', icon: '🥫' },
        { id: 'latheMachinist', name: '车床工', icon: '⚙️' },
        { id: 'assembler', name: '装配员', icon: '🔧' },
        { id: 'materialHandler', name: '物料员', icon: '📦' },
        { id: 'printer', name: '印刷工', icon: '🖨️' },
        { id: 'bookbinder', name: '装订工', icon: '📚' }
      ]
    },
    {
      id: 'logistics',
      name: '物流仓储',
      icon: '📦',
      skills: [
        { id: 'courier', name: '快递员', icon: '🚚' },
        { id: 'sorter', name: '分拣员', icon: '📋' },
        { id: 'loader', name: '装卸工', icon: '📦' },
        { id: 'driver', name: '司机', icon: '🚛' },
        { id: 'stocker', name: '理货员', icon: '📊' },
        { id: 'forkliftOperator', name: '叉车工', icon: '🚜' },
        { id: 'warehouseKeeper', name: '仓管员', icon: '🏢' },
        { id: 'mover', name: '搬运工', icon: '📦' },
        { id: 'packer', name: '打包员', icon: '📦' },
        { id: 'furnitureAssembler', name: '家具安装', icon: '🪑' }
      ]
    },
    {
      id: 'general_services',
      name: '综合服务',
      icon: '🛡️',
      skills: [
        { id: 'janitor', name: '保洁员', icon: '🧹' },
        { id: 'windowCleaner', name: '擦窗工', icon: '🪟' },
        { id: 'carpetCleaner', name: '地毯清洁', icon: '🧹' },
        { id: 'securityGuard', name: '保安', icon: '🛡️' },
        { id: 'doorman', name: '门卫', icon: '🚪' },
        { id: 'patrolOfficer', name: '巡逻员', icon: '👮' },
        { id: 'monitorOperator', name: '监控员', icon: '📺' },
        { id: 'gardener', name: '园艺工', icon: '🌱' },
        { id: 'treeTrimmer', name: '修剪工', icon: '🌳' },
        { id: 'irrigationWorker', name: '灌溉工', icon: '💧' },
        { id: 'planter', name: '种植工', icon: '🌱' },
        { id: 'eventSetup', name: '活动布置', icon: '🎪' },
        { id: 'audioTech', name: '音响师', icon: '🎵' },
        { id: 'photographer', name: '摄影师', icon: '📷' },
        { id: 'glazier', name: '玻璃工', icon: '🪟' },
        { id: 'tempWorker', name: '临时工', icon: '⚡' }
      ]
    }
  ];
  
  const experienceOptions = ['1-3年', '3-5年', '5-10年', '10年以上'];
  
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const modal = useModal();

  // 获取工人列表
  const fetchWorkers = async () => {
    try {
      const filterParams = {};
      if (activeFilter !== 'all') {
        filterParams.status = activeFilter;
      }
      const data = await ApiService.getAllWorkers(filterParams);
      console.log('API返回的工人数据:', data);
      if (data && data.length > 0) {
        console.log('第一个工人的技能:', data[0].skills);
      }
      setWorkers(data);
    } catch (error) {
      console.error('获取工人列表失败:', error);
      // 如果API失败，使用模拟数据
      setWorkers([
        {
          id: '1',
          name: '张师傅',
          phone: '138****5678',
          skills: ['水电安装', '电工'],
          rating: 4.8,
          status: 'online',
          currentProject: null,
          avatar: '张',
          experience: '5年',
          completedProjects: 128
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };
  
  const getFilteredWorkers = () => {
    let filtered = workers;
    
    // Filter by status
    switch (activeFilter) {
      case 'online':
        filtered = filtered.filter(w => w.status === 'online');
        break;
      case 'busy':
        filtered = filtered.filter(w => w.status === 'busy');
        break;
      case 'offline':
        filtered = filtered.filter(w => w.status === 'offline');
        break;
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };
  
  const getWorkerStats = () => {
    return {
      total: workers.length,
      online: workers.filter(w => w.status === 'online').length,
      busy: workers.filter(w => w.status === 'busy').length,
      available: workers.filter(w => w.status === 'online').length
    };
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'online': return '在线';
      case 'busy': return '忙碌';
      case 'offline': return '离线';
      default: return '未知';
    }
  };
  
  const handleWorkerPress = (worker) => {
    // Navigate to worker detail page or show worker info modal
    console.log('Worker pressed:', worker.name);
  };
  
  // Add worker form handlers
  const handleFormChange = (field, value) => {
    setNewWorkerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const toggleSkill = (skillId) => {
    setNewWorkerForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(id => id !== skillId)
        : [...prev.skills, skillId]
    }));
  };
  
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Get all skills from all categories for search
  const getAllSkills = () => {
    return skillCategories.flatMap(category => category.skills);
  };
  
  // Filter skills based on search query
  const getFilteredSkills = () => {
    if (!skillSearchQuery.trim()) {
      return skillCategories;
    }
    
    const query = skillSearchQuery.toLowerCase();
    return skillCategories.map(category => ({
      ...category,
      skills: category.skills.filter(skill => 
        skill.name.toLowerCase().includes(query)
      )
    })).filter(category => category.skills.length > 0);
  };
  
  // Get skill name by ID (for display purposes)
  const getSkillName = (skillId) => {
    const allSkills = getAllSkills();
    return allSkills.find(skill => skill.id === skillId)?.name || skillId;
  };
  
  const isFormValid = () => {
    return newWorkerForm.name.trim().length > 0 &&
           newWorkerForm.phone.trim().length > 0 &&
           newWorkerForm.skills.length > 0;
  };
  
  const handleSaveWorker = () => {
    if (!isFormValid()) {
      modal.warning('提示', '请填写完整的工人信息');
      return;
    }
    
    // Validate phone number format
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(newWorkerForm.phone)) {
      modal.warning('提示', '请输入正确的手机号码');
      return;
    }
    
    // Create new worker
    const newWorker = {
      id: Date.now().toString(),
      name: newWorkerForm.name,
      phone: newWorkerForm.phone,
      skills: newWorkerForm.skills.map(skillId => getSkillName(skillId)),
      experience: newWorkerForm.experience,
      rating: 0, // New worker starts with no rating
      status: 'offline',
      currentProject: null,
      avatar: newWorkerForm.name.charAt(0),
      completedProjects: 0,
      // System fields for future use
      workerSource: 'company_added',
      addedBy: 'current_company_id', // Will be replaced with actual company ID
      inviteStatus: 'pending'
    };
    
    // Add to workers list
    setWorkers(prev => [newWorker, ...prev]);
    
    // Reset form and close modal
    setNewWorkerForm({
      name: '',
      phone: '',
      skills: [],
      experience: '1-3年'
    });
    setSkillSearchQuery('');
    setExpandedCategories({
      construction: true,
      food_beverage: false,
      manufacturing: false,
      logistics: false,
      general_services: false
    });
    setShowAddWorker(false);
    
    // Show success message
    modal.success('成功', `工人 ${newWorker.name} 已添加成功！`);
  };
  
  const handleCancelAdd = () => {
    setNewWorkerForm({
      name: '',
      phone: '',
      skills: [],
      experience: '1-3年'
    });
    setSkillSearchQuery('');
    setExpandedCategories({
      construction: true,
      food_beverage: false,
      manufacturing: false,
      logistics: false,
      general_services: false
    });
    setShowAddWorker(false);
  };
  
  const stats = getWorkerStats();
  const filteredWorkers = getFilteredWorkers();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('workers')}</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddWorker(true)}
        >
          <Icon name="plus" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <SkeletonList count={5} />
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>{t('totalWorkers') || '总工人'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{stats.busy}</Text>
            <Text style={styles.summaryLabel}>{t('activeToday') || '今日忙碌'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{stats.available}</Text>
            <Text style={styles.summaryLabel}>{t('available') || '可用'}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchWorkers') || '搜索工人...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="times-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'all' && styles.activeTab]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.activeTabText]}>
              全部 ({workers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'online' && styles.activeTab]}
            onPress={() => setActiveFilter('online')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'online' && styles.activeTabText]}>
              在线 ({stats.online})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'busy' && styles.activeTab]}
            onPress={() => setActiveFilter('busy')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'busy' && styles.activeTabText]}>
              忙碌 ({stats.busy})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'offline' && styles.activeTab]}
            onPress={() => setActiveFilter('offline')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'offline' && styles.activeTabText]}>
              离线 ({workers.filter(w => w.status === 'offline').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Worker List or Empty State */}
        {filteredWorkers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name={searchQuery ? "search" : "users"} size={64} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? '未找到匹配工人' : (t('noWorkersYet') || '暂无工人')}
            </Text>
            <Text style={styles.emptyStateDescription}>
              {searchQuery 
                ? `没有找到包含"”${searchQuery}"”的工人` 
                : (t('addWorkersToStartScheduling') || '添加工人开始管理您的团队')
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.addWorkerButton}
                onPress={() => setShowAddWorker(true)}
              >
                <Icon name="user-plus" size={16} color="#ffffff" />
                <Text style={styles.addWorkerButtonText}>
                  {t('addFirstWorker') || '添加首个工人'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.workersList}>
            {filteredWorkers.map((worker) => (
              <TouchableOpacity 
                key={worker.id} 
                style={styles.workerCard}
                onPress={() => handleWorkerPress(worker)}
              >
                <View style={[styles.workerAvatar, { backgroundColor: getStatusColor(worker.status) }]}>
                  <Text style={styles.workerInitials}>{worker.avatar}</Text>
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerRole}>{worker.skills.join('、')}</Text>
                  <Text style={styles.workerPhone}>{worker.phone}</Text>
                  <View style={styles.workerStats}>
                    <Text style={styles.workerExperience}>⭐ {worker.rating}</Text>
                    <Text style={styles.workerExperience}>· {worker.experience}</Text>
                    <Text style={styles.workerExperience}>· {worker.completedProjects}项目</Text>
                  </View>
                </View>
                <View style={styles.workerStatus}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(worker.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(worker.status) }]}>
                    {getStatusText(worker.status)}
                  </Text>
                  {worker.currentProject && (
                    <Text style={styles.currentProject}>{worker.currentProject}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        </ScrollView>
      )}
      
      {/* Add Worker Modal */}
      <Modal
        visible={showAddWorker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddWorker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelAdd}>
              <Text style={styles.cancelButton}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>添加工人</Text>
            <TouchableOpacity 
              onPress={handleSaveWorker}
              disabled={!isFormValid()}
            >
              <Text style={[
                styles.saveButton,
                !isFormValid() && styles.saveButtonDisabled
              ]}>保存</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Basic Information */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>基本信息</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>姓名 *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="请输入工人姓名"
                  value={newWorkerForm.name}
                  onChangeText={(value) => handleFormChange('name', value)}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>手机号 *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="请输入手机号码"
                  value={newWorkerForm.phone}
                  onChangeText={(value) => handleFormChange('phone', value)}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>工作经验</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.experienceOptions}>
                    {experienceOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.experienceOption,
                          newWorkerForm.experience === option && styles.selectedExperienceOption
                        ]}
                        onPress={() => handleFormChange('experience', option)}
                      >
                        <Text style={[
                          styles.experienceOptionText,
                          newWorkerForm.experience === option && styles.selectedExperienceOptionText
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
            
            {/* Skills Selection */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>
                技能标签 * 
                {newWorkerForm.skills.length > 0 && (
                  <Text style={styles.selectedCount}>（已选择: {newWorkerForm.skills.length}）</Text>
                )}
              </Text>
              <Text style={styles.sectionSubtitle}>选择工人擅长的技能（可多选）</Text>
              
              {/* Skills Search */}
              <View style={styles.searchSkillContainer}>
                <Icon name="search" size={16} color="#9ca3af" style={styles.searchSkillIcon} />
                <TextInput
                  style={styles.searchSkillInput}
                  placeholder="搜索技能..."
                  value={skillSearchQuery}
                  onChangeText={setSkillSearchQuery}
                />
                {skillSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSkillSearchQuery('')}>
                    <Icon name="times-circle" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Skills Categories */}
              {getFilteredSkills().map((category) => (
                <View key={category.id} style={styles.skillCategory}>
                  <TouchableOpacity 
                    style={styles.categoryHeader}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryName}>
                      {category.name} ({category.skills.length}个)
                    </Text>
                    <Icon 
                      name={expandedCategories[category.id] || skillSearchQuery ? "chevron-down" : "chevron-right"} 
                      size={14} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                  
                  {(expandedCategories[category.id] || skillSearchQuery) && (
                    <View style={styles.skillsGrid}>
                      {category.skills.map((skill) => (
                        <TouchableOpacity
                          key={skill.id}
                          style={[
                            styles.skillChip,
                            newWorkerForm.skills.includes(skill.id) && styles.selectedSkillChip
                          ]}
                          onPress={() => toggleSkill(skill.id)}
                        >
                          <Text style={styles.skillIcon}>{skill.icon}</Text>
                          <Text style={[
                            styles.skillText,
                            newWorkerForm.skills.includes(skill.id) && styles.selectedSkillText
                          ]}>
                            {skill.name}
                          </Text>
                          {newWorkerForm.skills.includes(skill.id) && (
                            <Icon name="check" size={12} color="#22c55e" style={styles.skillCheckIcon} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
            
            <View style={styles.bottomSpacer} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingVertical: 12,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  activeTab: {
    backgroundColor: '#10b981',
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
    paddingVertical: 60,
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
  addWorkerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addWorkerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  workersList: {
    paddingBottom: 20,
  },
  workerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  workerExperience: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 6,
  },
  currentProject: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    fontStyle: 'italic',
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
    color: '#10b981',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  saveButtonDisabled: {
    color: '#9ca3af',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
  },
  experienceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  experienceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedExperienceOption: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  experienceOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedExperienceOptionText: {
    color: '#ffffff',
  },
  selectedCount: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'normal',
  },
  searchSkillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchSkillIcon: {
    marginRight: 8,
  },
  searchSkillInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  skillCategory: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  selectedSkillChip: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  skillIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedSkillText: {
    color: '#16a34a',
  },
  skillCheckIcon: {
    marginLeft: 4,
  },
  bottomSpacer: {
    height: 40,
  },
  // Worker card styles
  workerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workerInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  workerRole: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  workerPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  workerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
});

export default WorkersScreen;