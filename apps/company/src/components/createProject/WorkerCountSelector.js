import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';

const WorkerCountSelector = ({ value = 1, onChange, min = 1, max = 100 }) => {
  const { t } = useLanguage();
  const [customMode, setCustomMode] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));

  // Quick selection ranges
  const quickRanges = [
    { id: 'small', label: '1-3人', min: 1, max: 3 },
    { id: 'medium', label: '4-6人', min: 4, max: 6 },
    { id: 'large', label: '7-10人', min: 7, max: 10 },
    { id: 'xlarge', label: '10人以上', min: 11, max: null },
  ];

  // Get active range
  const getActiveRange = () => {
    if (value <= 3) return 'small';
    if (value <= 6) return 'medium';
    if (value <= 10) return 'large';
    return 'xlarge';
  };

  // Handle range selection
  const handleRangeSelect = (range) => {
    if (range.id === 'xlarge') {
      setCustomMode(true);
      onChange(11);
      setInputValue('11');
    } else {
      setCustomMode(false);
      const midValue = Math.floor((range.min + range.max) / 2);
      onChange(midValue);
      setInputValue(String(midValue));
    }
  };

  // Handle precise input
  const handleInputChange = (text) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setInputValue(cleaned);
    
    const num = parseInt(cleaned) || 0;
    if (num >= min && num <= max) {
      onChange(num);
    }
  };

  // Handle increment/decrement
  const handleIncrement = () => {
    const newValue = Math.min(value + 1, max);
    onChange(newValue);
    setInputValue(String(newValue));
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - 1, min);
    onChange(newValue);
    setInputValue(String(newValue));
  };

  // Sync input with value prop
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  return (
    <View style={styles.container}>
      {/* Quick Range Selection */}
      <View style={styles.rangeContainer}>
        {quickRanges.map((range) => {
          const isActive = (!customMode && getActiveRange() === range.id) || 
                          (customMode && range.id === 'xlarge');
          
          return (
            <TouchableOpacity
              key={range.id}
              style={[styles.rangeButton, isActive && styles.activeRange]}
              onPress={() => handleRangeSelect(range)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rangeText, isActive && styles.activeRangeText]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Precise Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('preciseCount') || '精确人数'}</Text>
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={[styles.stepButton, value <= min && styles.stepButtonDisabled]}
            onPress={handleDecrement}
            disabled={value <= min}
          >
            <Icon name="remove" size={20} color={value <= min ? '#E5E7EB' : '#6B7280'} />
          </TouchableOpacity>

          <View style={styles.inputField}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={handleInputChange}
              keyboardType="numeric"
              maxLength={3}
              selectTextOnFocus
              onFocus={() => setCustomMode(true)}
            />
            <Text style={styles.unit}>{t('peopleCount') || '人'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.stepButton, value >= max && styles.stepButtonDisabled]}
            onPress={handleIncrement}
            disabled={value >= max}
          >
            <Icon name="add" size={20} color={value >= max ? '#E5E7EB' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        {/* Helper Text */}
        {value > 50 && (
          <Text style={styles.helperText}>
            {t('largeTeamNote') || '大型团队建议分批安排'}
          </Text>
        )}
      </View>

      {/* Visual Indicator */}
      <View style={styles.visualIndicator}>
        <View style={styles.indicatorRow}>
          {Array.from({ length: Math.min(value, 10) }).map((_, i) => (
            <View key={i} style={styles.personIcon}>
              <Icon name="person" size={16} color="#3B82F6" />
            </View>
          ))}
          {value > 10 && (
            <Text style={styles.moreText}>+{value - 10}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rangeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  activeRange: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  rangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeRangeText: {
    color: '#3B82F6',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  inputField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  unit: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#F59E0B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  visualIndicator: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  personIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
});

export default WorkerCountSelector;