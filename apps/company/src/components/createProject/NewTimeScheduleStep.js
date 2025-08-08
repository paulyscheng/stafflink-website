import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModal } from '../../../../../shared/components/Modal/ModalService';

// Modal components defined first
const DatePickerModal = ({ visible, onClose, onSelect, selectedDate, generateDateOptions, styles, t }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('selectDate')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="times" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {generateDateOptions().map((date) => (
            <TouchableOpacity
              key={date.value}
              style={[
                styles.dateOption,
                selectedDate === date.value && styles.selectedDateOption
              ]}
              onPress={() => {
                onSelect(date.value);
                onClose();
              }}
            >
              <Text style={[
                styles.dateOptionText,
                selectedDate === date.value && styles.selectedDateOptionText
              ]}>
                {date.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const TimePickerModal = ({ visible, onClose, onSelect, selectedTime, generateTimeOptions, styles, t }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('selectTime')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="times" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {generateTimeOptions().map((time) => (
            <TouchableOpacity
              key={time.value}
              style={[
                styles.timeOption,
                selectedTime === time.value && styles.selectedTimeOption
              ]}
              onPress={() => {
                onSelect(time.value);
                onClose();
              }}
            >
              <Text style={[
                styles.timeOptionText,
                selectedTime === time.value && styles.selectedTimeOptionText
              ]}>
                {time.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const NewTimeScheduleStep = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    timeNature: initialData?.timeNature || 'onetime', // Separate field for time nature
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    startTime: initialData?.startTime || '09:00',
    endTime: initialData?.endTime || '17:00',
    workingDays: initialData?.workingDays || [],
    timeNotes: initialData?.timeNotes || '',
    paymentType: initialData?.paymentType || 'hourly',
    budgetRange: initialData?.budgetRange || '',
  });

  const [showDatePicker, setShowDatePicker] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(null);

  const { t } = useLanguage();
  const modal = useModal();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleWorkingDay = (day) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const value = `${year}-${month}-${day}`;
      
      let label = `${month}/${day}`;
      if (i === 0) label += ` (${t('today')})`;
      if (i === 1) label += ` (${t('tomorrow')})`;
      
      dates.push({ value, label });
    }
    
    return dates;
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        times.push({ value, label: value });
      }
    }
    return times;
  };

  const weekDays = [
    { id: 'monday', name: t('monday'), short: '一' },
    { id: 'tuesday', name: t('tuesday'), short: '二' },
    { id: 'wednesday', name: t('wednesday'), short: '三' },
    { id: 'thursday', name: t('thursday'), short: '四' },
    { id: 'friday', name: t('friday'), short: '五' },
    { id: 'saturday', name: t('saturday'), short: '六' },
    { id: 'sunday', name: t('sunday'), short: '日' },
  ];

  const isFormValid = () => {
    if (formData.timeNature === 'onetime') {
      return formData.startDate && formData.endDate && formData.budgetRange;
    } else {
      return formData.startDate && formData.endDate && formData.workingDays.length > 0 && formData.budgetRange;
    }
  };

  const handleNext = () => {
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      modal.warning(t('hint'), t('endDateBeforeStart'));
      return;
    }
    
    if (!isFormValid()) {
      modal.warning(t('hint'), t('fillCompleteTimeInfo'));
      return;
    }
    
    onNext(formData);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('timeSchedule')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Project Type Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('projectTypeRequired')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectProjectTypeFirst')}</Text>
          
          <View style={styles.projectTypeContainer}>
            <TouchableOpacity
              style={[
                styles.projectTypeCard,
                formData.timeNature === 'onetime' && styles.selectedProjectTypeCard
              ]}
              onPress={() => handleInputChange('timeNature', 'onetime')}
            >
              <Text style={styles.projectTypeIcon}>📅</Text>
              <Text style={[
                styles.projectTypeName,
                formData.timeNature === 'onetime' && styles.selectedProjectTypeName
              ]}>
                {t('onetimeProject')}
              </Text>
              <Text style={[
                styles.projectTypeDesc,
                formData.timeNature === 'onetime' && styles.selectedProjectTypeDesc
              ]}>
                {t('onetimeProjectDesc')}
              </Text>
              {formData.timeNature === 'onetime' && (
                <Icon name="check-circle" size={16} color="#22c55e" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.projectTypeCard,
                formData.timeNature === 'recurring' && styles.selectedProjectTypeCard
              ]}
              onPress={() => handleInputChange('timeNature', 'recurring')}
            >
              <Text style={styles.projectTypeIcon}>🔄</Text>
              <Text style={[
                styles.projectTypeName,
                formData.timeNature === 'recurring' && styles.selectedProjectTypeName
              ]}>
                {t('recurringProject')}
              </Text>
              <Text style={[
                styles.projectTypeDesc,
                formData.timeNature === 'recurring' && styles.selectedProjectTypeDesc
              ]}>
                {t('recurringProjectDesc')}
              </Text>
              {formData.timeNature === 'recurring' && (
                <Icon name="check-circle" size={16} color="#22c55e" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {formData.timeNature === 'recurring' ? t('projectPeriod') : t('projectTimeRange')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {formData.timeNature === 'recurring' ? t('setProjectStartEnd') : t('setProjectDates')}
          </Text>
          
          <View style={styles.dateContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.label}>{t('startDateRequired')}</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker('start')}
              >
                <Text style={formData.startDate ? styles.dateText : styles.datePlaceholder}>
                  {formData.startDate || t('selectStartDate')}
                </Text>
                <Icon name="calendar" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateInputContainer}>
              <Text style={styles.label}>{t('endDateRequired')}</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker('end')}
              >
                <Text style={formData.endDate ? styles.dateText : styles.datePlaceholder}>
                  {formData.endDate || t('selectEndDate')}
                </Text>
                <Icon name="calendar" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Daily Work Time */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {formData.timeNature === 'recurring' ? t('dailyWorkTime') : t('eachWorkTime')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {formData.timeNature === 'recurring' ? t('setDailyTimeRange') : t('setEachTimeRange')}
          </Text>
          
          <View style={styles.timeContainer}>
            <View style={styles.timeInputContainer}>
              <Text style={styles.label}>{t('startTime')}</Text>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setShowTimePicker('start')}
              >
                <Text style={styles.timeText}>{formData.startTime}</Text>
                <Icon name="clock-o" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeInputContainer}>
              <Text style={styles.label}>{t('endTime')}</Text>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setShowTimePicker('end')}
              >
                <Text style={styles.timeText}>{formData.endTime}</Text>
                <Icon name="clock-o" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Working Days - Only for recurring projects */}
        {formData.timeNature === 'recurring' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('recurringWorkDays')}</Text>
            <Text style={styles.sectionSubtitle}>{t('selectWeeklyDays')}</Text>
            
            <View style={styles.daysContainer}>
              {weekDays.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButton,
                    formData.workingDays.includes(day.id) && styles.selectedDayButton
                  ]}
                  onPress={() => toggleWorkingDay(day.id)}
                >
                  <Text style={[
                    styles.dayText,
                    formData.workingDays.includes(day.id) && styles.selectedDayText
                  ]}>
                    {day.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Payment Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('salarySettings')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectPaymentMethod')}</Text>
          
          {/* Payment Type */}
          <View style={styles.paymentTypeContainer}>
            <TouchableOpacity
              style={[
                styles.paymentTypeOption,
                formData.paymentType === 'hourly' && styles.selectedPaymentType
              ]}
              onPress={() => handleInputChange('paymentType', 'hourly')}
            >
              <Text style={styles.paymentTypeIcon}>⏰</Text>
              <View style={styles.paymentTypeTextContainer}>
                <Text style={[
                  styles.paymentTypeText,
                  formData.paymentType === 'hourly' && styles.selectedPaymentTypeText
                ]}>
                  {t('hourlyPayment')}
                </Text>
                <Text style={styles.paymentTypeDesc}>{t('hourlyPaymentDesc')}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentTypeOption,
                formData.paymentType === 'daily' && styles.selectedPaymentType
              ]}
              onPress={() => handleInputChange('paymentType', 'daily')}
            >
              <Text style={styles.paymentTypeIcon}>📅</Text>
              <View style={styles.paymentTypeTextContainer}>
                <Text style={[
                  styles.paymentTypeText,
                  formData.paymentType === 'daily' && styles.selectedPaymentTypeText
                ]}>
                  {t('dailyPayment')}
                </Text>
                <Text style={styles.paymentTypeDesc}>{t('dailyPaymentDesc')}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.paymentTypeOption,
                formData.paymentType === 'total' && styles.selectedPaymentType
              ]}
              onPress={() => handleInputChange('paymentType', 'total')}
            >
              <Text style={styles.paymentTypeIcon}>💰</Text>
              <View style={styles.paymentTypeTextContainer}>
                <Text style={[
                  styles.paymentTypeText,
                  formData.paymentType === 'total' && styles.selectedPaymentTypeText
                ]}>
                  {t('totalProjectPayment')}
                </Text>
                <Text style={styles.paymentTypeDesc}>{t('totalProjectPaymentDesc')}</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Payment Input */}
          <View style={styles.paymentInputContainer}>
            <Text style={styles.label}>
              {formData.paymentType === 'hourly' ? t('hourlyWage') : 
               formData.paymentType === 'daily' ? t('dailyWage') : t('projectTotal')}
            </Text>
            <View style={styles.paymentInputWrapper}>
              <Text style={styles.currencySymbol}>{t('currency')}</Text>
              <TextInput
                style={styles.paymentInput}
                placeholder={
                  formData.paymentType === 'hourly' ? t('enterHourlyWage') : 
                  formData.paymentType === 'daily' ? t('enterDailyWage') : t('enterProjectTotal')
                }
                value={formData.budgetRange}
                onChangeText={(value) => handleInputChange('budgetRange', value)}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>
                {formData.paymentType === 'hourly' ? `/${t('hour')}` : 
                 formData.paymentType === 'daily' ? `/${t('day')}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Notes */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('timeNotes')}</Text>
          <TextInput
            style={styles.notesInput}
            placeholder={t('addTimeNotes')}
            value={formData.timeNotes}
            onChangeText={(value) => handleInputChange('timeNotes', value)}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity 
          style={[
            styles.floatingButton,
            !isFormValid() && styles.floatingButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!isFormValid()}
        >
          <Text style={[
            styles.floatingButtonText,
            !isFormValid() && styles.floatingButtonTextDisabled
          ]}>
            {isFormValid() ? t('selectWorkers') : t('fillCompleteTimeInfo')}
          </Text>
          {isFormValid() && (
            <Icon name="arrow-right" size={16} color="#ffffff" style={styles.floatingButtonIcon} />
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker !== null}
        onClose={() => setShowDatePicker(null)}
        onSelect={(date) => {
          if (showDatePicker === 'start') {
            handleInputChange('startDate', date);
          } else {
            handleInputChange('endDate', date);
          }
        }}
        selectedDate={showDatePicker === 'start' ? formData.startDate : formData.endDate}
        generateDateOptions={generateDateOptions}
        styles={styles}
        t={t}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker !== null}
        onClose={() => setShowTimePicker(null)}
        onSelect={(time) => {
          if (showTimePicker === 'start') {
            handleInputChange('startTime', time);
          } else {
            handleInputChange('endTime', time);
          }
        }}
        selectedTime={showTimePicker === 'start' ? formData.startTime : formData.endTime}
        generateTimeOptions={generateTimeOptions}
        styles={styles}
        t={t}
      />
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
  sectionContainer: {
    marginBottom: 32,
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
  projectTypeContainer: {
    gap: 12,
  },
  projectTypeCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  selectedProjectTypeCard: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  projectTypeIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  projectTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedProjectTypeName: {
    color: '#16a34a',
  },
  projectTypeDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedProjectTypeDesc: {
    color: '#15803d',
  },
  checkIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  dateContainer: {
    gap: 16,
  },
  dateInputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  timeText: {
    fontSize: 16,
    color: '#374151',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayButton: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedDayText: {
    color: '#ffffff',
  },
  paymentTypeContainer: {
    gap: 12,
    marginBottom: 20,
  },
  paymentTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  selectedPaymentType: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  paymentTypeIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  paymentTypeTextContainer: {
    flex: 1,
  },
  paymentTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  selectedPaymentTypeText: {
    color: '#16a34a',
  },
  paymentTypeDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentInputContainer: {
    marginTop: 16,
  },
  paymentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingLeft: 16,
  },
  paymentInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#374151',
  },
  unitText: {
    fontSize: 14,
    color: '#6b7280',
    paddingRight: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  bottomSpacer: {
    height: 100,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  floatingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  floatingButtonTextDisabled: {
    color: '#9ca3af',
  },
  floatingButtonIcon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalContent: {
    paddingHorizontal: 24,
  },
  dateOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedDateOption: {
    backgroundColor: '#f0fdf4',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDateOptionText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  timeOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedTimeOption: {
    backgroundColor: '#f0fdf4',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedTimeOptionText: {
    color: '#16a34a',
    fontWeight: '600',
  },
});

export default NewTimeScheduleStep;