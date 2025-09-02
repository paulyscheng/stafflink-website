import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { FontAwesome as Icon } from '@expo/vector-icons';
import ApiService from '../services/api';

const PaymentScreen = ({ navigation, route }) => {
  const { jobId, amount, workerName, projectName } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    {
      id: 'wechat',
      name: '微信支付',
      icon: 'wechat',
      color: '#07C160',
      description: '推荐使用，实时到账'
    },
    {
      id: 'alipay',
      name: '支付宝',
      icon: 'money',
      color: '#1677FF',
      description: '支付宝转账，实时到账'
    },
    {
      id: 'transfer',
      name: '银行转账',
      icon: 'bank',
      color: '#6b7280',
      description: '1-3个工作日到账'
    },
    {
      id: 'cash',
      name: '现金支付',
      icon: 'money',
      color: '#f59e0b',
      description: '线下现金支付'
    }
  ];

  const processPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('提示', '请选择支付方式');
      return;
    }

    Alert.alert(
      '确认支付',
      `确认通过${paymentMethods.find(m => m.id === selectedMethod)?.name}支付 ¥${amount} 给 ${workerName}？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认支付',
          onPress: async () => {
            setProcessing(true);

            // 模拟支付过程
            if (selectedMethod === 'wechat' || selectedMethod === 'alipay') {
              // 模拟调起第三方支付
              setTimeout(async () => {
                try {
                  // 模拟支付成功后调用API
                  const response = await ApiService.payCompanyWork({
                    jobRecordId: jobId,
                    paymentMethod: selectedMethod,
                    transactionId: `MOCK_${Date.now()}`, // 实际应该从支付SDK获取
                    paymentNotes: `通过${selectedMethod === 'wechat' ? '微信' : '支付宝'}支付`
                  });

                  if (response.success) {
                    Alert.alert(
                      '支付成功',
                      '工资已成功支付给工人',
                      [{ text: '确定', onPress: () => navigation.navigate('CompletedJobs') }]
                    );
                  } else {
                    Alert.alert('支付失败', response.error || '支付处理失败');
                  }
                } catch (error) {
                  console.error('Payment error:', error);
                  Alert.alert('支付失败', '支付过程中出现错误');
                } finally {
                  setProcessing(false);
                }
              }, 2000); // 模拟支付延迟
            } else {
              // 直接标记为已支付（银行转账或现金）
              try {
                const response = await ApiService.payCompanyWork({
                  jobRecordId: jobId,
                  paymentMethod: selectedMethod,
                  transactionId: selectedMethod === 'transfer' ? `BANK_${Date.now()}` : null,
                  paymentNotes: `通过${selectedMethod === 'transfer' ? '银行转账' : '现金'}支付`
                });

                if (response.success) {
                  Alert.alert(
                    '标记成功',
                    selectedMethod === 'transfer' ? '已标记为银行转账，请尽快完成转账' : '已标记为现金支付完成',
                    [{ text: '确定', onPress: () => navigation.navigate('CompletedJobs') }]
                  );
                } else {
                  Alert.alert('操作失败', response.error || '标记支付失败');
                }
              } catch (error) {
                console.error('Payment error:', error);
                Alert.alert('操作失败', '处理过程中出现错误');
              } finally {
                setProcessing(false);
              }
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>支付工资</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 支付信息 */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentLabel}>支付给</Text>
          <Text style={styles.workerName}>{workerName}</Text>
          <Text style={styles.projectName}>{projectName}</Text>
          
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>¥</Text>
            <Text style={styles.amount}>{amount}</Text>
          </View>
        </View>

        {/* 支付方式选择 */}
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>选择支付方式</Text>
          
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.selectedMethod
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${method.color}20` }]}>
                  <Icon name={method.icon} size={24} color={method.color} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </View>
              
              <View style={[
                styles.radioButton,
                selectedMethod === method.id && styles.radioButtonSelected
              ]}>
                {selectedMethod === method.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 支付说明 */}
        <View style={styles.noticeSection}>
          <View style={styles.noticeHeader}>
            <Icon name="info-circle" size={16} color="#f59e0b" />
            <Text style={styles.noticeTitle}>支付说明</Text>
          </View>
          <Text style={styles.noticeText}>
            1. 微信支付和支付宝支付将实时到账{'\n'}
            2. 银行转账需要1-3个工作日到账{'\n'}
            3. 现金支付请确保已完成线下支付{'\n'}
            4. 支付完成后工人将收到通知
          </Text>
        </View>

        {/* 支付按钮 */}
        <TouchableOpacity
          style={[styles.payButton, (!selectedMethod || processing) && styles.disabledButton]}
          onPress={processPayment}
          disabled={!selectedMethod || processing}
        >
          {processing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Icon name="lock" size={20} color="#ffffff" />
              <Text style={styles.payButtonText}>安全支付 ¥{amount}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 支付处理遮罩 */}
      {processing && (selectedMethod === 'wechat' || selectedMethod === 'alipay') && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.processingTitle}>
              正在调起{selectedMethod === 'wechat' ? '微信' : '支付宝'}支付
            </Text>
            <Text style={styles.processingText}>请在手机上完成支付...</Text>
          </View>
        </View>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
  },
  paymentInfo: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  workerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 24,
    color: '#22c55e',
    fontWeight: '600',
    marginRight: 4,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1f2937',
  },
  methodsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  selectedMethod: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3b82f6',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  noticeSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  noticeText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 20,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacer: {
    height: 40,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default PaymentScreen;