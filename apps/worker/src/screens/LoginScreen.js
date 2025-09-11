import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { t } = useLanguage();
  const { login, isLoading } = useAuth();

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendCode = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入正确的手机号码');
      return;
    }

    setIsCodeSent(true);
    setCountdown(60);
    
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 调用实际的API发送验证码
    try {
      const response = await ApiService.sendVerificationCode(phoneNumber);
      console.log('Verification code sent successfully');
      // TODO: 使用自定义Toast替代
      alert('验证码已发送');
    } catch (error) {
      console.error('Failed to send code:', error);
      // TODO: 使用自定义Toast替代
      alert('发送验证码失败: ' + (error.message || '请稍后重试'));
      // 重置倒计时
      setCountdown(0);
    }
  };

  const handleLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入正确的手机号码');
      return;
    }

    if (!verificationCode.trim()) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入验证码');
      return;
    }

    const result = await login(phoneNumber, verificationCode);
    
    if (result.success) {
      navigation.replace('Main');
    } else {
      // TODO: 使用自定义Dialog替代
      console.error('Login failed:', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Icon name="wrench" size={32} color="#ffffff" />
              </View>
              <Text style={styles.appName}>StaffLink</Text>
              <Text style={styles.subtitle}>工人端</Text>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{t('login')}</Text>
              <Text style={styles.formSubtitle}>输入手机号获取验证码登录</Text>

              {/* Phone Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('phoneNumber')}</Text>
                <View style={styles.inputContainer}>
                  <Icon name="phone" size={16} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('enterPhone')}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                </View>
              </View>

              {/* Verification Code Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('verificationCode')}</Text>
                <View style={styles.codeInputContainer}>
                  <View style={styles.codeInput}>
                    <Icon name="shield" size={16} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={t('enterCode')}
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.codeButton,
                      (countdown > 0 || !phoneNumber) && styles.codeButtonDisabled
                    ]}
                    onPress={handleSendCode}
                    disabled={countdown > 0 || !phoneNumber}
                  >
                    <Text style={[
                      styles.codeButtonText,
                      (countdown > 0 || !phoneNumber) && styles.codeButtonTextDisabled
                    ]}>
                      {countdown > 0 ? `${countdown}s` : t('getCode')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={[
                  styles.loginButton,
                  (!phoneNumber || !verificationCode || isLoading) && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={!phoneNumber || !verificationCode || isLoading}
              >
                <Text style={[
                  styles.loginButtonText,
                  (!phoneNumber || !verificationCode || isLoading) && styles.loginButtonTextDisabled
                ]}>
                  {isLoading ? t('loading') : t('login')}
                </Text>
              </TouchableOpacity>

              {/* Helper Text */}
              <Text style={styles.helperText}>
                登录即表示同意《用户协议》和《隐私政策》
              </Text>
            </View>
          </View>

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomText}>专业蓝领工作平台</Text>
            <Text style={styles.bottomSubtext}>安全 · 可靠 · 高效</Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    height: 48,
  },
  codeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  codeButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  codeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  codeButtonTextDisabled: {
    color: '#9ca3af',
  },
  loginButton: {
    backgroundColor: '#22c55e',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  loginButtonTextDisabled: {
    color: '#9ca3af',
  },
  helperText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
  bottomInfo: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  bottomText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  bottomSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default LoginScreen;