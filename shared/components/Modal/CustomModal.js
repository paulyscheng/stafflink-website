import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import BrandConfig from '../../config/brand';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANIMATION_DURATION = 250;

// Modal types
export const MODAL_TYPES = {
  ALERT: 'alert',
  CONFIRM: 'confirm',
  PROMPT: 'prompt',
  CUSTOM: 'custom',
};

// Modal severity levels
export const MODAL_SEVERITY = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Severity configurations
const SEVERITY_CONFIG = {
  [MODAL_SEVERITY.INFO]: {
    icon: 'info-circle',
    iconColor: BrandConfig.colors.primary[500],
    headerColor: BrandConfig.colors.primary[500],
  },
  [MODAL_SEVERITY.SUCCESS]: {
    icon: 'check-circle',
    iconColor: BrandConfig.colors.success[500],
    headerColor: BrandConfig.colors.success[500],
  },
  [MODAL_SEVERITY.WARNING]: {
    icon: 'exclamation-triangle',
    iconColor: BrandConfig.colors.warning[500],
    headerColor: BrandConfig.colors.warning[500],
  },
  [MODAL_SEVERITY.ERROR]: {
    icon: 'times-circle',
    iconColor: BrandConfig.colors.error[500],
    headerColor: BrandConfig.colors.error[500],
  },
};

const CustomModal = ({
  visible,
  onClose,
  type = MODAL_TYPES.ALERT,
  severity = MODAL_SEVERITY.INFO,
  title,
  message,
  children,
  buttons = [],
  showCloseButton = true,
  closeOnBackdrop = true,
  animationType = 'fade',
  customHeader,
  customFooter,
  maxHeight,
}) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop && onClose) {
      onClose();
    }
  };

  const severityConfig = SEVERITY_CONFIG[severity];

  // Default buttons based on type
  const defaultButtons = () => {
    switch (type) {
      case MODAL_TYPES.ALERT:
        return [
          {
            text: '确定',
            onPress: onClose,
            style: 'primary',
          },
        ];
      case MODAL_TYPES.CONFIRM:
        return [
          {
            text: '取消',
            onPress: onClose,
            style: 'secondary',
          },
          {
            text: '确定',
            onPress: () => {},
            style: 'primary',
          },
        ];
      default:
        return buttons;
    }
  };

  const modalButtons = buttons.length > 0 ? buttons : defaultButtons();

  const renderButton = (button, index) => {
    const isPrimary = button.style === 'primary';
    const isDestructive = button.style === 'destructive';
    const isSecondary = button.style === 'secondary';

    let buttonStyle = [styles.button];
    let textStyle = [styles.buttonText];

    if (isPrimary) {
      buttonStyle.push(styles.primaryButton);
      textStyle.push(styles.primaryButtonText);
    } else if (isDestructive) {
      buttonStyle.push(styles.destructiveButton);
      textStyle.push(styles.destructiveButtonText);
    } else if (isSecondary) {
      buttonStyle.push(styles.secondaryButton);
      textStyle.push(styles.secondaryButtonText);
    }

    if (button.disabled) {
      buttonStyle.push(styles.disabledButton);
      textStyle.push(styles.disabledButtonText);
    }

    return (
      <TouchableOpacity
        key={index}
        style={buttonStyle}
        onPress={button.onPress}
        disabled={button.disabled}
        activeOpacity={0.7}
      >
        {button.icon && (
          <Icon 
            name={button.icon} 
            size={18} 
            color={textStyle.color || '#ffffff'} 
            style={styles.buttonIcon}
          />
        )}
        <Text style={textStyle}>{button.text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.backdropOverlay,
              {
                opacity: opacityValue,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.modalContainer} pointerEvents="box-none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
                maxHeight: maxHeight || SCREEN_HEIGHT * 0.8,
              },
            ]}
          >
            {/* Header */}
            {customHeader || (
              <View style={styles.header}>
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Icon name="times" size={20} color={BrandConfig.colors.neutral[500]} />
                  </TouchableOpacity>
                )}

                {type !== MODAL_TYPES.CUSTOM && (
                  <View style={styles.iconContainer}>
                    <Icon
                      name={severityConfig.icon}
                      size={48}
                      color={severityConfig.iconColor}
                    />
                  </View>
                )}

                {title && (
                  <Text style={[styles.title, { color: severityConfig.headerColor }]}>
                    {title}
                  </Text>
                )}
              </View>
            )}

            {/* Body */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}
              {children}
            </ScrollView>

            {/* Footer */}
            {customFooter || (
              modalButtons.length > 0 && (
                <View style={styles.footer}>
                  {modalButtons.map(renderButton)}
                </View>
              )
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: BrandConfig.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: BrandConfig.typography.fontSize['2xl'],
    fontWeight: BrandConfig.typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: 8,
    color: BrandConfig.colors.text.primary,
  },
  body: {
    paddingHorizontal: 24,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  bodyContent: {
    paddingVertical: 16,
  },
  message: {
    fontSize: BrandConfig.typography.fontSize.base,
    fontWeight: BrandConfig.typography.fontWeight.normal,
    color: BrandConfig.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: BrandConfig.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: BrandConfig.colors.primary[500],
  },
  secondaryButton: {
    backgroundColor: BrandConfig.colors.neutral[100],
    borderWidth: 1,
    borderColor: BrandConfig.colors.border.default,
  },
  destructiveButton: {
    backgroundColor: BrandConfig.colors.error[500],
  },
  disabledButton: {
    backgroundColor: BrandConfig.colors.neutral[200],
  },
  buttonText: {
    fontSize: BrandConfig.typography.fontSize.base,
    fontWeight: BrandConfig.typography.fontWeight.semibold,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: BrandConfig.colors.text.primary,
  },
  destructiveButtonText: {
    color: '#ffffff',
  },
  disabledButtonText: {
    color: BrandConfig.colors.text.tertiary,
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default CustomModal;