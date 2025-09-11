import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  required = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  maxLength,
  editable = true,
  secureTextEntry = false,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  validator,
  validateOnBlur = true,
  helperText,
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState(error);
  const [showError, setShowError] = useState(false);
  const errorAnimation = new Animated.Value(0);

  // Validate input
  const validateInput = () => {
    if (validator && value) {
      const validationResult = validator(value);
      if (validationResult !== true) {
        setInternalError(validationResult);
        setShowError(true);
        animateError();
        return false;
      }
    }
    setInternalError(null);
    setShowError(false);
    return true;
  };

  // Animate error appearance
  const animateError = () => {
    Animated.sequence([
      Animated.timing(errorAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(errorAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setShowError(false);
    if (onFocus) onFocus();
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    if (validateOnBlur) {
      validateInput();
    }
    if (onBlur) onBlur();
  };

  // Update error from props
  useEffect(() => {
    if (error) {
      setInternalError(error);
      setShowError(true);
      animateError();
    }
  }, [error]);

  const displayError = internalError || error;
  const hasError = showError && displayError;

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>必填</Text>
            </View>
          )}
        </View>
      )}

      {/* Input Container */}
      <Animated.View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
          {
            transform: [
              {
                translateX: errorAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              },
            ],
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            !editable && styles.inputDisabled,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity style={styles.iconContainer} activeOpacity={0.7}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Helper Text or Error */}
      <View style={styles.helperContainer}>
        {hasError ? (
          <Animated.View 
            style={[
              styles.errorContainer,
              {
                opacity: errorAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.8],
                }),
              },
            ]}
          >
            <Icon name="error-outline" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{displayError}</Text>
          </Animated.View>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}

        {/* Character Count */}
        {maxLength && (
          <Text style={styles.characterCount}>
            {value?.length || 0}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputContainerDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  helperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 4,
    flex: 1,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});

export default FormInput;