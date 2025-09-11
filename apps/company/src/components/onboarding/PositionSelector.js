import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';

const PositionSelector = ({ value, onValueChange, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const { t } = useLanguage();

  const predefinedPositions = [
    { id: 'ceo', label: 'CEO/总经理', icon: 'business-center' },
    { id: 'hr_director', label: 'HR总监', icon: 'people' },
    { id: 'operations_director', label: '运营总监', icon: 'settings' },
    { id: 'project_manager', label: '项目经理', icon: 'engineering' },
    { id: 'foreman', label: '工头/包工头', icon: 'construction' },
    { id: 'admin', label: '行政主管', icon: 'admin-panel-settings' },
    { id: 'finance', label: '财务主管', icon: 'account-balance' },
    { id: 'other', label: '其他职位', icon: 'more-horiz' },
  ];

  const filteredPositions = predefinedPositions.filter(position =>
    position.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPosition = (position) => {
    if (position.id === 'other') {
      setIsCustom(true);
    } else {
      onValueChange(position.label);
      setModalVisible(false);
      setIsCustom(false);
    }
  };

  const handleConfirmCustom = () => {
    if (customPosition.trim()) {
      onValueChange(customPosition.trim());
      setModalVisible(false);
      setIsCustom(false);
      setCustomPosition('');
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setIsCustom(false);
    setCustomPosition('');
    setSearchQuery('');
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="work" size={20} color="#6b7280" style={styles.prefixIcon} />
        <Text style={[styles.selectorText, !value && styles.placeholderText]}>
          {value || placeholder || '请选择职位'}
        </Text>
        <Icon name="arrow-drop-down" size={24} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择职位</Text>
              <TouchableOpacity onPress={handleClose}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {!isCustom ? (
              <>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="搜索职位"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {/* Position List */}
                <ScrollView style={styles.positionList} showsVerticalScrollIndicator={false}>
                  {filteredPositions.map((position) => (
                    <TouchableOpacity
                      key={position.id}
                      style={[
                        styles.positionItem,
                        value === position.label && styles.selectedPosition
                      ]}
                      onPress={() => handleSelectPosition(position)}
                    >
                      <View style={styles.positionContent}>
                        <Icon 
                          name={position.icon} 
                          size={24} 
                          color={value === position.label ? '#22c55e' : '#6b7280'} 
                        />
                        <Text style={[
                          styles.positionLabel,
                          value === position.label && styles.selectedLabel
                        ]}>
                          {position.label}
                        </Text>
                      </View>
                      {value === position.label && (
                        <Icon name="check-circle" size={20} color="#22c55e" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={styles.customInputContainer}>
                <Text style={styles.customInputLabel}>请输入您的职位</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="例如：招聘专员"
                  value={customPosition}
                  onChangeText={setCustomPosition}
                  autoFocus
                />
                <View style={styles.customButtonContainer}>
                  <TouchableOpacity
                    style={[styles.customButton, styles.cancelButton]}
                    onPress={() => setIsCustom(false)}
                  >
                    <Text style={styles.cancelButtonText}>返回</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.customButton, styles.confirmButton]}
                    onPress={handleConfirmCustom}
                  >
                    <Text style={styles.confirmButtonText}>确定</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    maxHeight: '80%',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  positionList: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  positionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  selectedPosition: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  positionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
  },
  selectedLabel: {
    color: '#22c55e',
    fontWeight: '500',
  },
  customInputContainer: {
    padding: 20,
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#374151',
    marginBottom: 20,
  },
  customButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  customButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#22c55e',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PositionSelector;