import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';
import { useNavigation } from '@react-navigation/native';

const LoginForm = ({ onToggleForm }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  
  // 发送验证码
  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入手机号码');
      return;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入正确的手机号码');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.sendCode(phoneNumber, 'company');
      if (response && response.success) {
        setCodeSent(true);
        setCountdown(60);
        // TODO: 使用自定义Toast替代
        console.log('验证码已发送');
        
        // 倒计时
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      // TODO: 使用自定义Dialog替代
      console.error('发送失败:', error.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!phoneNumber || !verificationCode) {
      // TODO: 使用自定义Toast替代
      console.warn('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.login(phoneNumber, verificationCode);
      
      if (response && response.token) {
        console.log('企业登录成功');
        setShowPhoneLogin(false);
        navigation.replace('Main');
      }
    } catch (error) {
      if (error.message && error.message.includes('not found')) {
        // TODO: 使用自定义Dialog替代
        console.warn('该手机号尚未注册');
        setShowPhoneLogin(false);
        onToggleForm();
      } else {
        // TODO: 使用自定义Dialog替代
        console.error('登录失败:', error.message || '请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogin = (method) => {
    if (method === 'Phone Number') {
      setShowPhoneLogin(true);
    } else {
      // TODO: 使用自定义Toast替代
      console.log(`${method} 登录功能即将开放`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Primary Login Options */}
      <View style={styles.buttonContainer}>
        {/* Phone Number Login */}
        <TouchableOpacity
          style={[styles.loginButton, styles.primaryButton]}
          onPress={() => handleLogin('Phone Number')}
        >
          <Icon name="mobile" size={18} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{t('continueWithPhone')}</Text>
        </TouchableOpacity>

        {/* Email Login */}
        <TouchableOpacity
          style={[styles.loginButton, styles.secondaryButton]}
          onPress={() => handleLogin('Email')}
        >
          <Icon name="envelope" size={16} color="#4b5563" />
          <Text style={styles.secondaryButtonText}>{t('continueWithEmail')}</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Login Options */}
      <View style={styles.buttonContainer}>
        {/* Apple ID Login */}
        <TouchableOpacity
          style={[styles.loginButton, styles.appleButton]}
          onPress={() => handleLogin('Apple ID')}
        >
          <Icon name="apple" size={18} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{t('continueWithApple')}</Text>
        </TouchableOpacity>

        {/* WeChat Login */}
        <TouchableOpacity
          style={[styles.loginButton, styles.wechatButton]}
          onPress={() => handleLogin('WeChat')}
        >
          <Icon name="weixin" size={18} color="#ffffff" />
          <Text style={styles.primaryButtonText}>{t('continueWithWechat')}</Text>
        </TouchableOpacity>
      </View>

      {/* Terms */}
      <Text style={styles.termsText}>
        {t('byContinuing')}{' '}
        <Text style={styles.linkText}>{t('termsOfService')}</Text> {t('and')} {' '}
        <Text style={styles.linkText}>{t('privacyPolicy')}</Text>
      </Text>

      {/* Sign Up Link */}
      <View style={styles.signupContainer}>
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>
            {t('noAccount') || '没有账户？'}
          </Text>
          <TouchableOpacity onPress={onToggleForm}>
            <Text style={styles.signupLink}>{t('registerNow') || '立即注册'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Phone Login Modal */}
      <Modal
        visible={showPhoneLogin}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhoneLogin(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>手机号登录</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPhoneLogin(false)}
              >
                <Icon name="times" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* 手机号输入 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>手机号码</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="phone" size={18} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="请输入手机号码"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={11}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* 验证码输入 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>验证码</Text>
                <View style={styles.codeWrapper}>
                  <View style={[styles.inputWrapper, styles.codeInputWrapper]}>
                    <Icon name="lock" size={18} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="请输入验证码"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.sendCodeButton, (countdown > 0 || loading) && styles.sendCodeButtonDisabled]}
                    onPress={sendVerificationCode}
                    disabled={countdown > 0 || loading}
                  >
                    <Text style={styles.sendCodeText}>
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 测试账号提示 - 仅在开发环境显示 */}
              {__DEV__ && process.env.SHOW_TEST_HINTS === 'true' && (
                <View style={styles.testHint}>
                  <Text style={styles.testHintText}>开发模式</Text>
                </View>
              )}

              {/* 登录按钮 */}
              <TouchableOpacity
                style={[styles.modalLoginButton, loading && styles.modalLoginButtonDisabled]}
                onPress={handlePhoneLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalLoginButtonText}>登录</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  wechatButton: {
    backgroundColor: '#22c55e',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  secondaryButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  linkText: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  signupContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 5,
  },
  signupLink: {
    color: '#2563eb',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInputWrapper: {
    flex: 1,
    marginRight: 12,
  },
  sendCodeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 110,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendCodeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  testHint: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  testHintText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
  },
  modalLoginButton: {
    backgroundColor: '#3b82f6',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalLoginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  modalLoginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LoginForm;