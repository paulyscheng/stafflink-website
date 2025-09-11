import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary', // primary, secondary, danger, success
  size = 'medium', // small, medium, large
  fullWidth = true,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Animate disabled state
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: disabled ? 0.5 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: disabled ? 0.98 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [disabled]);

  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: disabled ? '#E5E7EB' : '#3B82F6',
        borderColor: disabled ? '#E5E7EB' : '#3B82F6',
      },
      secondary: {
        backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
        borderColor: disabled ? '#E5E7EB' : '#D1D5DB',
      },
      danger: {
        backgroundColor: disabled ? '#FEE2E2' : '#EF4444',
        borderColor: disabled ? '#FEE2E2' : '#EF4444',
      },
      success: {
        backgroundColor: disabled ? '#D1FAE5' : '#10B981',
        borderColor: disabled ? '#D1FAE5' : '#10B981',
      },
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        fontSize: 14,
      },
      medium: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        fontSize: 16,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        fontSize: 18,
      },
    };
    return sizes[size] || sizes.medium;
  };

  const getTextColor = () => {
    if (disabled) return '#9CA3AF';
    if (variant === 'secondary') return '#374151';
    return '#FFFFFF';
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          variantStyles,
          {
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          fullWidth && styles.fullWidthButton,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={getTextColor()}
              style={styles.loader}
            />
            <Text
              style={[
                styles.buttonText,
                { fontSize: sizeStyles.fontSize, color: getTextColor() },
                textStyle,
              ]}
            >
              处理中...
            </Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {icon && iconPosition === 'left' && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            
            {children || (
              <Text
                style={[
                  styles.buttonText,
                  { fontSize: sizeStyles.fontSize, color: getTextColor() },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            )}
            
            {icon && iconPosition === 'right' && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  button: {
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  fullWidthButton: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  loader: {
    marginRight: 8,
  },
});

export default PrimaryButton;