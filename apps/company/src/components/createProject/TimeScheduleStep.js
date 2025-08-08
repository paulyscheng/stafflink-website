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

const TimePickerModal = ({ visible, onClose, onSelect, selectedTime, timeSlots, styles, t }) => (
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
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeOption,
                selectedTime === time && styles.selectedTimeOption
              ]}
              onPress={() => {
                onSelect(time);
                onClose();
              }}
            >
              <Text style={[
                styles.timeOptionText,
                selectedTime === time && styles.selectedTimeOptionText
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const TimeScheduleStep = ({ initialData, onNext, onBack }) => {
  const [formData, setFormData] = useState({
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    startTime: initialData?.startTime || '09:00',
    endTime: initialData?.endTime || '18:00',
    workDays: initialData?.workDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    projectType: initialData?.projectType || '', // 'onetime' or 'recurring' - no default to force selection
    isUrgent: initialData?.isUrgent || false,
    notes: initialData?.notes || '',
  });

  const [showDatePicker, setShowDatePicker] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(null);

  const { t } = useLanguage();
  const modal = useModal();

  const weekDays = [
    { id: 'monday', name: t('monday'), shortName: t('monday') },
    { id: 'tuesday', name: t('tuesday'), shortName: t('tuesday') },
    { id: 'wednesday', name: t('wednesday'), shortName: t('wednesday') },
    { id: 'thursday', name: t('thursday'), shortName: t('thursday') },
    { id: 'friday', name: t('friday'), shortName: t('friday') },
    { id: 'saturday', name: t('saturday'), shortName: t('saturday') },
    { id: 'sunday', name: t('sunday'), shortName: t('sunday') },
  ];

  const timeSlots = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', 
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];


  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-update end date when start date is selected
      if (field === 'startDate' && value) {
        const startDate = new Date(value);
        // If no end date set, or end date is before start date, set end date to start date
        if (!prev.endDate || new Date(prev.endDate) < startDate) {
          newData.endDate = value;
        }
      }
      
      // Auto-update end time when start time is selected
      if (field === 'startTime' && value) {
        const startHour = parseInt(value.split(':')[0]);
        // If no end time set, or end time is not after start time, set end time to start time + 1 hour
        if (!prev.endTime || parseInt(prev.endTime.split(':')[0]) <= startHour) {
          const endHour = Math.min(startHour + 1, 23); // Cap at 23:00
          newData.endTime = `${endHour.toString().padStart(2, '0')}:00`;
        }
      }
      
      return newData;
    });
  };

  const toggleWorkDay = (dayId) => {
    setFormData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(dayId)
        ? prev.workDays.filter(id => id !== dayId)
        : [...prev.workDays, dayId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? t('today') || '今天' : i === 1 ? t('tomorrow') || '明天' : `${date.getMonth() + 1}月${date.getDate()}日`
      });
    }
    return dates;
  };

  const isFormValid = () => {
    if (!formData.projectType) return false;
    
    const basicValid = formData.startDate && formData.endDate;
    if (formData.projectType === 'recurring') {
      return basicValid && formData.workDays.length > 0;
    }
    return basicValid;
  };

  const validateDates = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        modal.warning(t('hint'), t('endDateBeforeStart'));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!isFormValid()) {
      modal.warning(t('hint'), t('fillCompleteTimeInfo'));
      return;
    }
    if (!validateDates()) {
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

        {/* Project Type - First Priority */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('projectTypeRequired')}</Text>
          <Text style={styles.sectionSubtitle}>{t('selectProjectTypeFirst')}</Text>
          
          <View style={styles.projectTypeContainer}>
            <TouchableOpacity
              style={[
                styles.projectTypeOption,
                formData.projectType === 'onetime' && styles.selectedProjectType
              ]}
              onPress={() => handleInputChange('projectType', 'onetime')}
            >
              <Text style={styles.projectTypeIcon}>📅</Text>
              <View style={styles.projectTypeTextContainer}>
                <Text style={[
                  styles.projectTypeName,
                  formData.projectType === 'onetime' && styles.selectedProjectTypeName
                ]}>
                  {t('onetimeProject')}
                </Text>
                <Text style={styles.projectTypeDesc}>{t('onetimeProjectDesc')}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.projectTypeOption,
                formData.projectType === 'recurring' && styles.selectedProjectType
              ]}
              onPress={() => handleInputChange('projectType', 'recurring')}
            >
              <Text style={styles.projectTypeIcon}>🔄</Text>
              <View style={styles.projectTypeTextContainer}>
                <Text style={[
                  styles.projectTypeName,
                  formData.projectType === 'recurring' && styles.selectedProjectTypeName
                ]}>
                  {t('recurringProject')}
                </Text>
                <Text style={styles.projectTypeDesc}>{t('recurringProjectDesc')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {formData.projectType === 'onetime' ? t('projectTimeRange') : t('projectPeriod')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {formData.projectType === 'onetime' ? t('setProjectDates') : t('setProjectStartEnd')}
          </Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.label}>{t('startDateRequired')}</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowDatePicker('start')}
              >
                <Text style={[styles.dateText, !formData.startDate && styles.placeholderText]}>
                  {formData.startDate ? formatDate(formData.startDate) : t('selectStartDate')}
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
                <Text style={[styles.dateText, !formData.endDate && styles.placeholderText]}>
                  {formData.endDate ? formatDate(formData.endDate) : t('selectEndDate')}
                </Text>
                <Icon name="calendar" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Time Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {formData.projectType === 'onetime' ? t('dailyWorkTime') : t('eachWorkTime')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {formData.projectType === 'onetime' ? t('setDailyTimeRange') : t('setEachTimeRange')}
          </Text>
          
          <View style={styles.timeRow}>
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


        {/* Work Days - Only show for recurring projects */}
        {formData.projectType === 'recurring' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('recurringWorkDays')}</Text>
            <Text style={styles.sectionSubtitle}>{t('selectWeeklyDays')}</Text>
            
            <View style={styles.weekDaysContainer}>
              {weekDays.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayButton,
                    formData.workDays.includes(day.id) && styles.selectedDayButton
                  ]}
                  onPress={() => toggleWorkDay(day.id)}
                >
                  <Text style={[
                    styles.dayButtonText,
                    formData.workDays.includes(day.id) && styles.selectedDayButtonText
                  ]}>
                    {day.shortName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}


        {/* Notes */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>{t('timeNotes')}</Text>
          <TextInput
            style={styles.notesInput}
            placeholder={t('addTimeNotes')}
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
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
            {t('nextStep')}
          </Text>
          <Icon name="arrow-right" size={16} color={isFormValid() ? "#ffffff" : "#9ca3af"} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <DatePickerModal
        visible={showDatePicker !== null}
        onClose={() => setShowDatePicker(null)}
        onSelect={(date) => handleInputChange(showDatePicker === 'start' ? 'startDate' : 'endDate', date)}
        selectedDate={showDatePicker === 'start' ? formData.startDate : formData.endDate}
        generateDateOptions={generateDateOptions}
        styles={styles}
        t={t}
      />

      <TimePickerModal
        visible={showTimePicker !== null}
        onClose={() => setShowTimePicker(null)}
        onSelect={(time) => handleInputChange(showTimePicker === 'start' ? 'startTime' : 'endTime', time)}
        selectedTime={showTimePicker === 'start' ? formData.startTime : formData.endTime}
        timeSlots={timeSlots}
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateInputContainer: {
    flex: 1,
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
  placeholderText: {
    color: '#9ca3af',
  },
  timeRow: {
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
  weekDaysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  selectedDayButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDayButtonText: {
    color: '#ffffff',
  },
  projectTypeContainer: {
    gap: 12,
  },
  projectTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  selectedProjectType: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
  },
  projectTypeIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  projectTypeTextContainer: {
    flex: 1,
  },
  projectTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedProjectTypeName: {
    color: '#3b82f6',
  },
  projectTypeDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
    minHeight: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
    backgroundColor: '#f0f9ff',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedDateOptionText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  timeOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedTimeOption: {
    backgroundColor: '#f0f9ff',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedTimeOptionText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default TimeScheduleStep;