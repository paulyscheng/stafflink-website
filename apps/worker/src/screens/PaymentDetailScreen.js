import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const PaymentDetailScreen = ({ route, navigation }) => {
  const { notification } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (notification) {
      // 从通知中提取数据
      const data = {
        id: notification.metadata?.paymentId || `PAY${Date.now()}`,
        projectName: notification.metadata?.projectName || '项目',
        companyName: notification.metadata?.companyName || '企业',
        amount: notification.metadata?.amount || 0,
        paymentMethod: notification.metadata?.paymentMethod || '银行转账',
        bankAccount: notification.metadata?.bankAccount || '尾号****',
        paymentDate: notification.metadata?.paymentDate || new Date().toISOString(),
        workDays: notification.metadata?.workDays || 1,
        wageType: notification.metadata?.wageType || 'daily',
        wageRate: notification.metadata?.wageRate || 0,
        deductions: notification.metadata?.deductions || [],
        bonuses: notification.metadata?.bonuses || [],
        taxAmount: notification.metadata?.taxAmount || 0,
        netAmount: notification.metadata?.netAmount || notification.metadata?.amount || 0,
        status: notification.metadata?.status || 'completed',
        transactionId: notification.metadata?.transactionId || '',
        notes: notification.metadata?.notes || '',
      };
      
      // 计算总收入明细
      if (data.wageRate === 0 && data.amount > 0 && data.workDays > 0) {
        data.wageRate = Math.round(data.amount / data.workDays);
      }
      
      setPaymentData(data);
    }
  }, [notification]);

  // 分享收入凭证
  const handleShare = async () => {
    try {
      const message = `【收入凭证】\n项目：${paymentData.projectName}\n金额：¥${paymentData.amount}\n日期：${new Date(paymentData.paymentDate).toLocaleDateString('zh-CN')}\n来源：StaffLink派工平台`;
      
      await Share.share({
        message,
        title: '收入凭证',
      });
    } catch (error) {
      Alert.alert('错误', '分享失败');
    }
  };

  // 查看历史收入
  const handleViewHistory = () => {
    Alert.alert(
      '功能开发中',
      '历史收入功能正在开发中，敬请期待',
      [{ text: '确定' }]
    );
  };

  // 下载凭证
  const handleDownloadReceipt = () => {
    Alert.alert(
      '下载凭证',
      '收入凭证已保存到相册',
      [{ text: '确定' }]
    );
  };

  if (!paymentData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = {
    pending: { text: '处理中', color: '#F59E0B', icon: 'time-outline' },
    completed: { text: '已到账', color: '#059669', icon: 'checkmark-circle' },
    failed: { text: '失败', color: '#DC2626', icon: 'close-circle' }
  };
  const status = statusConfig[paymentData.status] || statusConfig.completed;

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>收入明细</Text>
        <TouchableOpacity onPress={handleShare}>
          <Icon name="share-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 金额卡片 */}
        <View style={[styles.amountCard, { backgroundColor: status.color }]}>
          <View style={styles.amountHeader}>
            <Icon name={status.icon} size={32} color="#FFF" />
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
          
          <Text style={styles.amountLabel}>实际到账</Text>
          <Text style={styles.amountValue}>¥{paymentData.netAmount.toFixed(2)}</Text>
          
          <View style={styles.amountFooter}>
            <Text style={styles.paymentDate}>
              {new Date(paymentData.paymentDate).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.paymentMethod}>
              {paymentData.paymentMethod}
            </Text>
          </View>
        </View>

        {/* 项目信息 */}
        <View style={styles.projectCard}>
          <Text style={styles.sectionTitle}>项目信息</Text>
          
          <View style={styles.projectInfo}>
            <View style={styles.projectIcon}>
              <Icon name="briefcase-outline" size={24} color="#2563EB" />
            </View>
            <View style={styles.projectDetails}>
              <Text style={styles.projectName}>{paymentData.projectName}</Text>
              <Text style={styles.companyName}>{paymentData.companyName}</Text>
            </View>
          </View>
        </View>

        {/* 收入明细 */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>收入明细</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>基础工资</Text>
            <Text style={styles.detailValue}>
              ¥{paymentData.amount.toFixed(2)}
            </Text>
          </View>
          
          {paymentData.workDays > 0 && (
            <Text style={styles.detailSubtext}>
              {paymentData.workDays}天 × ¥{paymentData.wageRate}/天
            </Text>
          )}

          {/* 奖金 */}
          {paymentData.bonuses.length > 0 && (
            <>
              <View style={styles.divider} />
              {paymentData.bonuses.map((bonus, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{bonus.name || '奖金'}</Text>
                  <Text style={[styles.detailValue, { color: '#059669' }]}>
                    +¥{bonus.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* 扣除项 */}
          {paymentData.deductions.length > 0 && (
            <>
              <View style={styles.divider} />
              {paymentData.deductions.map((deduction, index) => (
                <View key={index} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{deduction.name || '扣除'}</Text>
                  <Text style={[styles.detailValue, { color: '#DC2626' }]}>
                    -¥{deduction.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* 税费 */}
          {paymentData.taxAmount > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>个人所得税</Text>
                <Text style={[styles.detailValue, { color: '#DC2626' }]}>
                  -¥{paymentData.taxAmount.toFixed(2)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.totalDivider} />
          
          <View style={styles.detailItem}>
            <Text style={styles.totalLabel}>实际到账</Text>
            <Text style={styles.totalValue}>
              ¥{paymentData.netAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 账户信息 */}
        <View style={styles.accountCard}>
          <Text style={styles.sectionTitle}>收款账户</Text>
          
          <View style={styles.accountInfo}>
            <Icon name="card-outline" size={24} color="#6B7280" />
            <View style={styles.accountDetails}>
              <Text style={styles.accountMethod}>{paymentData.paymentMethod}</Text>
              <Text style={styles.accountNumber}>{paymentData.bankAccount}</Text>
            </View>
          </View>

          {paymentData.transactionId && (
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionLabel}>交易单号</Text>
              <Text style={styles.transactionId}>{paymentData.transactionId}</Text>
            </View>
          )}
        </View>

        {/* 备注 */}
        {paymentData.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>备注说明</Text>
            <Text style={styles.notesText}>{paymentData.notes}</Text>
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewHistory}
          >
            <Icon name="time-outline" size={20} color="#2563EB" />
            <Text style={styles.secondaryButtonText}>历史收入</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleDownloadReceipt}
          >
            <Icon name="download-outline" size={20} color="#FFF" />
            <Text style={styles.primaryButtonText}>下载凭证</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  amountCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  amountLabel: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  amountValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
  },
  amountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  paymentDate: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.9,
  },
  paymentMethod: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.9,
  },
  projectCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  projectDetails: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  detailSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: -8,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalDivider: {
    height: 2,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  accountCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountDetails: {
    marginLeft: 12,
    flex: 1,
  },
  accountMethod: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  accountNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 14,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  notesCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 6,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 6,
  },
  bottomSpacer: {
    height: 30,
  },
});

export default PaymentDetailScreen;