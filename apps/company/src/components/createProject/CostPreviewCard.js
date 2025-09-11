import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';

const CostPreviewCard = ({
  workers = 0,
  paymentType = 'hourly',
  wage = 0,
  duration = 1,
  workingDays = [],
  startTime = '09:00',
  endTime = '17:00',
  showDetails = true,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = new Animated.Value(0);

  // Calculate hours per day based on selected time range
  const calculateHoursPerDay = () => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    
    const totalMinutes = endInMinutes - startInMinutes;
    return Math.max(0, totalMinutes / 60); // Convert to hours and ensure non-negative
  };

  // Calculate costs
  const calculateCosts = () => {
    let baseCost = 0;
    let description = '';

    switch (paymentType) {
      case 'hourly':
        const hoursPerDay = calculateHoursPerDay();
        const totalDays = duration || 1;
        baseCost = workers * wage * hoursPerDay * totalDays;
        description = `${workers}名工人 × ¥${wage}/小时 × ${hoursPerDay}小时/天 × ${totalDays}天`;
        break;
      
      case 'daily':
        const days = duration || 1;
        baseCost = workers * wage * days;
        description = `${workers}名工人 × ¥${wage}/天 × ${days}天`;
        break;
      
      case 'total':
      case 'fixed':
        baseCost = wage;
        description = '项目总价（一口价）';
        break;
      
      default:
        baseCost = 0;
        description = '待定';
    }

    const serviceFee = baseCost * 0.05; // 5% platform fee
    const total = baseCost + serviceFee;

    return {
      baseCost,
      serviceFee,
      total,
      description,
    };
  };

  const costs = calculateCosts();

  // Animate expansion
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  if (costs.baseCost === 0 && paymentType !== 'total' && paymentType !== 'fixed') {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Main Cost Display */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Icon name="attach-money" size={24} color="#3B82F6" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t('estimatedCost') || '预计费用'}</Text>
            <Text style={styles.totalAmount}>¥{costs.total.toFixed(2)}</Text>
          </View>
        </View>
        
        {showDetails && (
          <Icon 
            name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color="#6B7280" 
          />
        )}
      </TouchableOpacity>

      {/* Cost Breakdown */}
      {showDetails && (
        <Animated.View
          style={[
            styles.detailsContainer,
            {
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 300],
              }),
              opacity: animatedHeight,
            },
          ]}
        >
          <View style={styles.divider} />
          
          {/* Base Cost */}
          <View style={styles.costRow}>
            <View style={styles.costLabelContainer}>
              <Icon name="group" size={16} color="#6B7280" />
              <Text style={styles.costLabel}>{t('laborCost') || '人工费用'}</Text>
            </View>
            <Text style={styles.costValue}>¥{costs.baseCost.toFixed(2)}</Text>
          </View>
          
          <Text style={styles.costDescription}>{costs.description}</Text>

          {/* Service Fee */}
          <View style={styles.costRow}>
            <View style={styles.costLabelContainer}>
              <Icon name="support-agent" size={16} color="#6B7280" />
              <Text style={styles.costLabel}>{t('platformServiceFee') || '平台服务费'} (5%)</Text>
            </View>
            <Text style={styles.costValue}>¥{costs.serviceFee.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('totalCost') || '总费用'}</Text>
            <Text style={styles.totalValue}>¥{costs.total.toFixed(2)}</Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Icon name="info" size={14} color="#3B82F6" />
            <Text style={styles.tipsText}>
              {t('costTip') || '实际费用以工作完成后的结算为准'}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  detailsContainer: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  costLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  costLabel: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 8,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  costDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingLeft: 40,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F9FF',
  },
  tipsText: {
    fontSize: 13,
    color: '#3B82F6',
    marginLeft: 6,
    flex: 1,
  },
});

export default CostPreviewCard;