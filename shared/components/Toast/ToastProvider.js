import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import BrandConfig from '../../config/brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_HEIGHT = 100;
const ANIMATION_DURATION = 300;
const DEFAULT_DURATION = 3000;

// Toast types
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Toast configuration
const TOAST_CONFIG = {
  [TOAST_TYPES.SUCCESS]: {
    backgroundColor: BrandConfig.colors.success[500],
    icon: 'check-circle',
    iconColor: '#ffffff',
  },
  [TOAST_TYPES.ERROR]: {
    backgroundColor: BrandConfig.colors.error[500],
    icon: 'times-circle',
    iconColor: '#ffffff',
  },
  [TOAST_TYPES.WARNING]: {
    backgroundColor: BrandConfig.colors.warning[500],
    icon: 'exclamation-triangle',
    iconColor: '#ffffff',
  },
  [TOAST_TYPES.INFO]: {
    backgroundColor: BrandConfig.colors.primary[500],
    icon: 'info-circle',
    iconColor: '#ffffff',
  },
};

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Individual Toast Component
const Toast = ({ message, type, onHide, duration = DEFAULT_DURATION, action }) => {
  const translateY = useRef(new Animated.Value(-TOAST_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef(null);

  const config = TOAST_CONFIG[type] || TOAST_CONFIG[TOAST_TYPES.INFO];

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    if (duration > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -TOAST_HEIGHT,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [onHide, translateY, opacity]);

  const handlePress = () => {
    if (action && action.onPress) {
      action.onPress();
    }
    hideToast();
  };

  const statusBarHeight = Platform.OS === 'ios' ? 
    (StatusBar.currentHeight || 44) : 
    (StatusBar.currentHeight || 0);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
          top: statusBarHeight,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.toastContent}
      >
        <View style={styles.iconContainer}>
          <Icon name={config.icon} size={24} color={config.iconColor} />
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
          
          {action && (
            <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
              <Text style={styles.actionText}>{action.text}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Icon name="times" size={20} color="#ffffff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message, type = TOAST_TYPES.INFO, options = {}) => {
    const id = toastIdRef.current++;
    const newToast = {
      id,
      message,
      type,
      duration: options.duration || DEFAULT_DURATION,
      action: options.action,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);
    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, options) => {
    return showToast(message, TOAST_TYPES.SUCCESS, options);
  }, [showToast]);

  const showError = useCallback((message, options) => {
    return showToast(message, TOAST_TYPES.ERROR, options);
  }, [showToast]);

  const showWarning = useCallback((message, options) => {
    return showToast(message, TOAST_TYPES.WARNING, options);
  }, [showToast]);

  const showInfo = useCallback((message, options) => {
    return showToast(message, TOAST_TYPES.INFO, options);
  }, [showToast]);

  const contextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={styles.toastWrapper} pointerEvents="box-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onHide={() => hideToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: TOAST_HEIGHT,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    width: 32,
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    lineHeight: 22,
  },
  actionButton: {
    marginTop: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ToastProvider;