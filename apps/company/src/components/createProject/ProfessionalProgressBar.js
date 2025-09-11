import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfessionalProgressBar = ({ steps, currentStep, completedSteps = [], onStepPress }) => {
  const getStepIcon = (stepId, isActive, isCompleted) => {
    const iconProps = {
      size: 20,
      color: isActive ? '#3B82F6' : isCompleted ? '#10B981' : '#9CA3AF'
    };

    if (isCompleted) {
      return <Icon name="check-circle" {...iconProps} />;
    }

    switch (stepId) {
      case 1:
        return <Icon name="description" {...iconProps} />;
      case 2:
        return <Icon name="engineering" {...iconProps} />;
      case 3:
        return <Icon name="schedule" {...iconProps} />;
      case 4:
        return <Icon name="group" {...iconProps} />;
      case 5:
        return <Icon name="send" {...iconProps} />;
      default:
        return <Icon name="radio-button-unchecked" {...iconProps} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressWrapper}>
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isClickable = isCompleted || step.id < currentStep;

          return (
            <React.Fragment key={step.id}>
              <TouchableOpacity
                style={styles.stepContainer}
                onPress={() => isClickable && onStepPress && onStepPress(step.id)}
                disabled={!isClickable}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.stepIconContainer,
                  isActive && styles.activeStepIcon,
                  isCompleted && styles.completedStepIcon,
                ]}>
                  {getStepIcon(step.id, isActive, isCompleted)}
                </View>
                <Text style={[
                  styles.stepName,
                  isActive && styles.activeStepName,
                  isCompleted && styles.completedStepName,
                ]} numberOfLines={1}>
                  {step.name}
                </Text>
                {isActive && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>

              {index < steps.length - 1 && (
                <View style={[
                  styles.connector,
                  (isCompleted || completedSteps.includes(step.id + 1)) && styles.completedConnector
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress percentage */}
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          {Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}% 完成
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeStepIcon: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  completedStepIcon: {
    backgroundColor: '#D1FAE5',
  },
  stepName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  activeStepName: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  completedStepName: {
    color: '#10B981',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -16,
    width: 40,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 1.5,
  },
  connector: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  completedConnector: {
    backgroundColor: '#10B981',
  },
  progressInfo: {
    paddingHorizontal: 20,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ProfessionalProgressBar;