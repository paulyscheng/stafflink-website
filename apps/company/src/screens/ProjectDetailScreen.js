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
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';
import { useModal } from '../../../../shared/components/Modal/ModalService';

const { width: screenWidth } = Dimensions.get('window');

const ProjectDetailScreen = ({ route, navigation }) => {
  const { project: initialProject } = route.params;
  const { t } = useLanguage();
  const modal = useModal();
  
  const [project, setProject] = useState(initialProject);
  const [projectSkills, setProjectSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [workerResponses, setWorkerResponses] = useState({
    confirmed: [],
    pending: [],
    rejected: []
  });
  
  // Tab配置
  const tabs = [
    { id: 'overview', name: '概览', icon: 'dashboard' },
    { id: 'workers', name: '工人', icon: 'users' },
    { id: 'communication', name: '沟通', icon: 'comments' },
    { id: 'details', name: '详情', icon: 'info-circle' },
  ];
  
  // 加载项目详情
  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      
      // 获取项目详情
      const response = await ApiService.getProjectDetail(initialProject.id);
      
      if (response) {
        setProject(response.data?.project || response.project || response);
        setProjectSkills(response.data?.skills || response.skills || []);
        
        // 获取邀请状态
        try {
          const invitationsData = await ApiService.getProjectInvitations(initialProject.id);
          
          // 根据邀请状态分组工人
          const workersData = {
            confirmed: [],
            pending: [],
            rejected: []
          };
          
          invitationsData.forEach(invitation => {
            const workerInfo = {
              id: invitation.worker_id,
              name: invitation.worker_name,
              phone: invitation.worker_phone,
              rating: invitation.worker_rating,
              status: invitation.status,
              sentTime: new Date(invitation.sent_at).toLocaleString('zh-CN'),
              responseMessage: invitation.response_message,
              respondedAt: invitation.responded_at,
              avatar: invitation.worker_name ? invitation.worker_name.charAt(0) : '工'
            };
            
            if (invitation.status === 'accepted') {
              workersData.confirmed.push(workerInfo);
            } else if (invitation.status === 'rejected') {
              workersData.rejected.push(workerInfo);
            } else {
              workersData.pending.push(workerInfo);
            }
          });
          
          setWorkerResponses(workersData);
          
          // 生成初始消息
          generateMessages(response.data.project, workersData);
        } catch (invitationError) {
          console.error('Failed to load invitations:', invitationError);
          // 如果邀请API失败，使用默认数据
          const projectWorkers = response.data.project.selectedWorkerDetails || [];
          const workersData = {
            confirmed: [],
            pending: projectWorkers.map(worker => ({
              ...worker,
              status: 'pending',
              sentTime: new Date(response.data.project.created_at).toLocaleString('zh-CN'),
              avatar: worker.name ? worker.name.charAt(0) : '工'
            })),
            rejected: []
          };
          setWorkerResponses(workersData);
          generateMessages(response.data.project, workersData);
        }
      }
    } catch (error) {
      console.error('Failed to load project details:', error);
      modal.error('错误', '加载项目详情失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjectDetails();
    setRefreshing(false);
  };
  
  // 生成消息
  const generateMessages = (projectData, workersData) => {
    const msgs = [];
    const createdTime = new Date(projectData.created_at || projectData.createdAt).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    msgs.push({
      id: 1,
      type: 'system',
      content: `项目已创建，正在通知 ${workersData.pending.length} 位工人`,
      time: createdTime
    });
    
    if (workersData.pending.length > 0) {
      msgs.push({
        id: 2,
        type: 'system',
        content: `已发送工作邀请给 ${workersData.pending.length} 位工人`,
        time: createdTime
      });
    }
    
    setMessages(msgs);
  };
  
  useEffect(() => {
    loadProjectDetails();
  }, [initialProject.id]);
  
  // 获取状态信息
  const getStatusInfo = (status) => {
    const statusMap = {
      'draft': { color: '#f59e0b', text: '待开始', icon: 'clock-o', bgColor: '#fef3c7' },
      'in_progress': { color: '#22c55e', text: '进行中', icon: 'play-circle', bgColor: '#d1fae5' },
      'completed': { color: '#3b82f6', text: '已完成', icon: 'check-circle', bgColor: '#dbeafe' },
      'cancelled': { color: '#ef4444', text: '已取消', icon: 'times-circle', bgColor: '#fee2e2' }
    };
    return statusMap[status] || { color: '#6b7280', text: '未知', icon: 'question-circle', bgColor: '#f3f4f6' };
  };
  
  const statusInfo = getStatusInfo(project.status);
  
  // 格式化函数
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  const formatTime = (timeString) => timeString || '09:00';
  
  const formatPayment = () => {
    const paymentType = project.payment_type || project.paymentType;
    const budgetRange = project.budget_range || project.budgetRange;
    const originalWage = project.original_wage || project.originalWage;
    const dailyWage = project.daily_wage || project.dailyWage;
    
    console.log('Payment info:', { paymentType, budgetRange, originalWage, dailyWage, project }); // 调试日志
    
    // 对于时薪类型，使用 original_wage 字段
    if (paymentType === 'hourly' && originalWage) return `¥${originalWage}/小时`;
    // 对于日薪类型，使用 daily_wage 或 budget_range
    if (paymentType === 'daily' && (dailyWage || budgetRange)) return `¥${dailyWage || budgetRange}/天`;
    if (paymentType === 'total' && budgetRange) return `¥${budgetRange}（总价）`;
    if (paymentType === 'fixed' && budgetRange) return `¥${budgetRange}（一口价）`;
    return '面议';
  };
  
  // 处理状态更新
  const handleStatusUpdate = (newStatus) => {
    const statusNames = {
      'in_progress': '开始项目',
      'completed': '完成项目',
      'cancelled': '取消项目'
    };

    modal.confirm(
      '确认操作',
      `确定要${statusNames[newStatus]}吗？`,
      async () => {
        try {
          const response = await ApiService.updateProject(project.id, { status: newStatus });
          if (response.success) {
            setProject({ ...project, status: newStatus });
            modal.success('成功', statusNames[newStatus] + '成功');
            navigation.goBack();
          }
        } catch (error) {
          modal.error('错误', '操作失败，请重试');
        }
      },
      null
    );
  };
  
  // 渲染概览Tab
  const renderOverviewTab = () => {
    const totalRequired = project.required_workers || project.requiredWorkers || 5;
    const confirmedCount = workerResponses.confirmed.length;
    const progressPercentage = Math.round((confirmedCount / totalRequired) * 100);
    
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 状态卡片 */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.bgColor }]}>
          <View style={styles.statusHeader}>
            <Icon name={statusInfo.icon} size={24} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
          <Text style={styles.projectName}>{project.project_name || project.projectName}</Text>
          <View style={styles.locationRow}>
            <Icon name="map-marker" size={14} color="#6b7280" />
            <Text style={styles.locationText}>{project.project_address || project.projectAddress}</Text>
          </View>
        </View>
        
        {/* 关键信息卡片 */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Icon name="calendar" size={20} color="#3b82f6" />
            <Text style={styles.infoLabel}>工作时间</Text>
            <Text style={styles.infoValue}>
              {formatDate(project.start_date || project.startDate)}
            </Text>
            <Text style={styles.infoSubValue}>
              {formatTime(project.start_time || project.startTime)} - {formatTime(project.end_time || project.endTime)}
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Icon name="users" size={20} color="#22c55e" />
            <Text style={styles.infoLabel}>人员情况</Text>
            <Text style={styles.infoValue}>{confirmedCount}/{totalRequired}</Text>
            <Text style={styles.infoSubValue}>已确认/需要</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Icon name="money" size={20} color="#f59e0b" />
            <Text style={styles.infoLabel}>薪资待遇</Text>
            <Text style={styles.infoValue}>{formatPayment()}</Text>
            <Text style={styles.infoSubValue}>
              {(project.payment_type || project.paymentType) === 'hourly' ? '按小时' : 
               (project.payment_type || project.paymentType) === 'daily' ? '按天' : 
               (project.payment_type || project.paymentType) === 'total' ? '项目总价' : '固定价格'}
            </Text>
          </View>
        </View>
        
        {/* 费用明细卡片 */}
        {(project.payment_type || project.paymentType) === 'hourly' && (
          <View style={styles.feeDetailCard}>
            <View style={styles.feeDetailHeader}>
              <Icon name="calculator" size={16} color="#f59e0b" />
              <Text style={styles.feeDetailTitle}>费用计算</Text>
            </View>
            <View style={styles.feeCalculation}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>时薪</Text>
                <Text style={styles.feeValue}>
                  ¥{project.original_wage || project.originalWage || 0}/小时
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>工作时长</Text>
                <Text style={styles.feeValue}>8 小时/天</Text>
              </View>
              <View style={styles.feeDivider} />
              <View style={styles.feeRow}>
                <Text style={styles.feeTotalLabel}>日薪总计</Text>
                <Text style={styles.feeTotalValue}>
                  ¥{((project.original_wage || project.originalWage || 0) * 8).toFixed(2)}
                </Text>
              </View>
              <Text style={styles.feeFormula}>
                ¥{project.original_wage || project.originalWage || 0}/小时 × 8小时 = ¥{((project.original_wage || project.originalWage || 0) * 8).toFixed(2)}/天
              </Text>
            </View>
          </View>
        )}
        
        {/* 进度条 */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>招聘进度</Text>
            <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.progressStat}>待响应: {workerResponses.pending.length}</Text>
            <Text style={styles.progressStat}>已确认: {workerResponses.confirmed.length}</Text>
            <Text style={styles.progressStat}>已拒绝: {workerResponses.rejected.length}</Text>
          </View>
        </View>
        
        {/* 快捷操作 */}
        <View style={styles.quickActions}>
          {project.status === 'draft' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => handleStatusUpdate('in_progress')}
              >
                <Icon name="play" size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>开始项目</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
                <Icon name="edit" size={16} color="#374151" />
                <Text style={[styles.actionButtonText, { color: '#374151' }]}>编辑</Text>
              </TouchableOpacity>
            </>
          )}
          
          {project.status === 'in_progress' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => handleStatusUpdate('completed')}
              >
                <Icon name="check" size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>完成项目</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.warningAction]}>
                <Icon name="pause" size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>暂停</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    );
  };
  
  // 渲染工人Tab
  const renderWorkersTab = () => {
    const renderWorkerItem = ({ item, status }) => (
      <TouchableOpacity style={styles.workerCard}>
        <View style={[styles.workerAvatar, status === 'confirmed' && styles.confirmedAvatar]}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{item.name}</Text>
          <View style={styles.workerMeta}>
            <Icon name="star" size={12} color="#f59e0b" />
            <Text style={styles.workerRating}>{item.rating || '4.5'}</Text>
            {item.skills && (
              <Text style={styles.workerSkills}>· {item.skills.slice(0, 2).join('、')}</Text>
            )}
          </View>
          {status === 'pending' && (
            <Text style={styles.workerStatus}>发送于 {item.sentTime}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.workerAction}>
          <Icon name={status === 'confirmed' ? 'phone' : 'envelope'} size={16} color="#3b82f6" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
    
    return (
      <View style={styles.workersContainer}>
        {/* 工人统计 */}
        <View style={styles.workerStats}>
          <View style={[styles.statCard, { backgroundColor: '#d1fae5' }]}>
            <Text style={styles.statNumber}>{workerResponses.confirmed.length}</Text>
            <Text style={styles.statLabel}>已确认</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Text style={styles.statNumber}>{workerResponses.pending.length}</Text>
            <Text style={styles.statLabel}>待响应</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
            <Text style={styles.statNumber}>{workerResponses.rejected.length}</Text>
            <Text style={styles.statLabel}>已拒绝</Text>
          </View>
        </View>
        
        {/* 工人列表 */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {workerResponses.confirmed.length > 0 && (
            <View style={styles.workerSection}>
              <Text style={styles.sectionTitle}>已确认</Text>
              {workerResponses.confirmed.map((worker) => (
                <View key={worker.id}>
                  {renderWorkerItem({ item: worker, status: 'confirmed' })}
                </View>
              ))}
            </View>
          )}
          
          {workerResponses.pending.length > 0 && (
            <View style={styles.workerSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>待响应</Text>
                <TouchableOpacity style={styles.retryButton}>
                  <Icon name="refresh" size={12} color="#f59e0b" />
                  <Text style={styles.retryText}>重新通知</Text>
                </TouchableOpacity>
              </View>
              {workerResponses.pending.map((worker) => (
                <View key={worker.id}>
                  {renderWorkerItem({ item: worker, status: 'pending' })}
                </View>
              ))}
            </View>
          )}
          
          {workerResponses.rejected.length > 0 && (
            <View style={styles.workerSection}>
              <Text style={styles.sectionTitle}>已拒绝</Text>
              {workerResponses.rejected.map((worker) => (
                <View key={worker.id}>
                  {renderWorkerItem({ item: worker, status: 'rejected' })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };
  
  // 渲染沟通Tab
  const renderCommunicationTab = () => {
    const handleSendMessage = () => {
      if (messageText.trim()) {
        const newMessage = {
          id: messages.length + 1,
          type: 'admin',
          content: messageText,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([...messages, newMessage]);
        setMessageText('');
      }
    };
    
    return (
      <View style={styles.communicationContainer}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.messageItem}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageSender}>
                  {item.type === 'system' ? '系统' : item.type === 'admin' ? '我' : item.name}
                </Text>
                <Text style={styles.messageTime}>{item.time}</Text>
              </View>
              <Text style={styles.messageContent}>{item.content}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="输入消息..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Icon name="send" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // 渲染详情Tab
  const renderDetailsTab = () => {
    // 获取技能显示值的函数
    const getSkillsDisplay = () => {
      // 如果有从API返回的技能数据，使用它
      if (projectSkills && projectSkills.length > 0) {
        return projectSkills.map(s => s.name).join('、');
      }
      
      // 否则根据项目类型显示默认技能
      const projectType = project.project_type || project.projectType;
      const defaultSkillsMap = {
        'home_renovation': '管道安装、电工、木工、刷漆、贴砖',
        'commercial_renovation': '电工、贴砖、刷漆、木工',
        'electrical_plumbing': '电工、管道安装',
        'maintenance_service': '电工、管道安装、木工',
        'construction_project': '贴砖、焊工、电工',
        'coffee_tea': '操作员、清洁工',
        'chinese_cuisine': '操作员、清洁工',
        'fast_food': '操作员、清洁工',
        'electronics_mfg': '操作员',
        'textile_mfg': '操作员',
        'express_delivery': '操作员',
        'warehouse_ops': '操作员',
        'cleaning_service': '清洁工',
        'security_service': '操作员'
      };
      
      return defaultSkillsMap[projectType] || '根据项目类型自动匹配';
    };
    
    const details = [
      { 
        label: '项目类型', 
        value: (() => {
          const type = project.project_type || project.projectType;
          const typeMap = {
            'home_renovation': '家庭装修',
            'commercial_renovation': '商业装修',
            'electrical_plumbing': '水电维修',
            'maintenance_service': '维修服务',
            'construction_project': '建筑工程',
            'coffee_tea': '咖啡茶饮',
            'chinese_cuisine': '中式餐饮',
            'fast_food': '快餐服务',
            'electronics_mfg': '电子制造',
            'textile_mfg': '纺织制造',
            'express_delivery': '快递配送',
            'warehouse_ops': '仓储运营',
            'cleaning_service': '清洁服务',
            'security_service': '安保服务'
          };
          return typeMap[type] || type || '未指定';
        })(),
        icon: 'briefcase'
      },
      { 
        label: '所需技能', 
        value: getSkillsDisplay(),
        icon: 'wrench'
      },
      { 
        label: '经验要求', 
        value: {
          'beginner': '初级',
          'intermediate': '中级',
          'experienced': '高级'
        }[project.experience_level || project.experienceLevel] || '不限',
        icon: 'graduation-cap'
      },
      { 
        label: '工作描述', 
        value: project.work_description || project.workDescription || '暂无描述',
        icon: 'file-text-o',
        multiline: true
      },
      { 
        label: '时间备注', 
        value: project.time_notes || project.timeNotes || '无',
        icon: 'clock-o',
        multiline: true
      },
      { 
        label: '创建时间', 
        value: new Date(project.created_at || project.createdAt).toLocaleString('zh-CN'),
        icon: 'calendar-o'
      }
    ];
    
    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.detailsContainer}>
        {details.map((detail, index) => (
          <View key={index} style={styles.detailItem}>
            <View style={styles.detailHeader}>
              <Icon name={detail.icon} size={16} color="#6b7280" />
              <Text style={styles.detailLabel}>{detail.label}</Text>
            </View>
            <Text style={[styles.detailValue, detail.multiline && styles.detailValueMultiline]}>
              {detail.value}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };
  
  // 渲染Tab内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'workers':
        return renderWorkersTab();
      case 'communication':
        return renderCommunicationTab();
      case 'details':
        return renderDetailsTab();
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>项目详情</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{project.project_name || project.projectName}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="ellipsis-v" size={20} color="#374151" />
        </TouchableOpacity>
      </View>
      
      {/* Tab栏 */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Icon 
              name={tab.icon} 
              size={18} 
              color={activeTab === tab.id ? '#3b82f6' : '#9ca3af'} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Tab内容 */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 32,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  
  // 概览Tab样式
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  projectName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  infoSubValue: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  progressSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
  },
  secondaryAction: {
    backgroundColor: '#f3f4f6',
  },
  warningAction: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  
  // 费用明细样式
  feeDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  feeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feeDetailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  feeCalculation: {
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  feeLabel: {
    fontSize: 14,
    color: '#374151',
  },
  feeValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  feeDivider: {
    height: 1,
    backgroundColor: '#fef3c7',
    marginVertical: 8,
  },
  feeTotalLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  feeTotalValue: {
    fontSize: 18,
    color: '#f59e0b',
    fontWeight: '700',
  },
  feeFormula: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  
  // 工人Tab样式
  workersContainer: {
    flex: 1,
  },
  workerStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  workerSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 4,
    fontWeight: '500',
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedAvatar: {
    backgroundColor: '#22c55e',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  workerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  workerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerRating: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  workerSkills: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  workerStatus: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  workerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 沟通Tab样式
  communicationContainer: {
    flex: 1,
  },
  messagesList: {
    paddingBottom: 16,
  },
  messageItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  messageTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  messageContent: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 16,
  },
  messageInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#3b82f6',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  
  // 详情Tab样式
  detailsContainer: {
    flex: 1,
  },
  detailItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  detailValueMultiline: {
    lineHeight: 20,
  },
  
  // Loading样式
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default ProjectDetailScreen;