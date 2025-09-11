import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CompanySizeSelector = ({ value, onValueChange, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const companySizes = [
    { id: '1-50', label: '1-50人', icon: 'group', description: '小型企业' },
    { id: '51-200', label: '51-200人', icon: 'groups', description: '中型企业' },
    { id: '201-500', label: '201-500人', icon: 'domain', description: '大型企业' },
    { id: '500+', label: '500人以上', icon: 'business', description: '超大型企业' },
  ];

  const handleSelectSize = (size) => {
    onValueChange(size.id);
    setModalVisible(false);
  };

  const selectedSize = companySizes.find(size => size.id === value);

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="business" size={20} color="#6b7280" style={styles.prefixIcon} />
        <Text style={[styles.selectorText, !value && styles.placeholderText]}>
          {selectedSize ? selectedSize.label : (placeholder || '请选择企业规模')}
        </Text>
        <Icon name="arrow-drop-down" size={24} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择企业规模</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Size List */}
            <ScrollView style={styles.sizeList} showsVerticalScrollIndicator={false}>
              {companySizes.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  style={[
                    styles.sizeItem,
                    value === size.id && styles.selectedSize
                  ]}
                  onPress={() => handleSelectSize(size)}
                >
                  <View style={styles.sizeIconContainer}>
                    <Icon 
                      name={size.icon} 
                      size={32} 
                      color={value === size.id ? '#22c55e' : '#6b7280'} 
                    />
                  </View>
                  <View style={styles.sizeContent}>
                    <Text style={[
                      styles.sizeLabel,
                      value === size.id && styles.selectedLabel
                    ]}>
                      {size.label}
                    </Text>
                    <Text style={styles.sizeDescription}>
                      {size.description}
                    </Text>
                  </View>
                  {value === size.id && (
                    <Icon name="check-circle" size={24} color="#22c55e" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  prefixIcon: {
    marginRight: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  sizeList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 20,
  },
  sizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  selectedSize: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  sizeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sizeContent: {
    flex: 1,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  selectedLabel: {
    color: '#22c55e',
  },
  sizeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default CompanySizeSelector;