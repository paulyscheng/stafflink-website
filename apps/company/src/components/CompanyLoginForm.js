import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import ApiService from '../services/api';

const CompanyLoginForm = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    verificationCode: '',
  });
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendVerificationCode = async () => {
    if (!formData.phoneNumber) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入手机号码');
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      // TODO: 使用自定义Toast替代
      console.warn('请输入正确的手机号码');
      return;
    }

    setLoading(true);
    
    try {
      const response = await ApiService.sendCode(formData.phoneNumber, 'company');
      
      if (response && response.success) {
        setCodeSent(true);
        setCountdown(60);
        // TODO: 使用自定义Toast替代
        console.log('验证码已发送');
        
        // 开发环境显示验证码
        if (response.code) {
          console.log(`开发环境验证码: ${response.code}`);
        }
      } else {
        // TODO: 使用自定义Dialog替代
        console.error('发送失败', '请稍后重试');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      // TODO: 使用自定义Dialog替代
      console.error('发送失败:', error.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!formData.phoneNumber || !formData.verificationCode) {
      // TODO: 使用自定义Toast替代
      console.warn('请填写完整信息');
      return;
    }

    setLoading(true);
    
    try {
      const response = await ApiService.login(
        formData.phoneNumber,
        formData.verificationCode
      );
      
      if (response && response.token) {
        console.log('企业登录成功');
        // 调用成功回调
        if (onLoginSuccess) {
          onLoginSuccess(response);
        }
      } else {
        // TODO: 使用自定义Dialog替代
        console.error('登录失败', '验证码错误或已过期');
      }
    } catch (error) {
      console.error('登录失败:', error);
      
      // 如果是用户不存在，提示注册
      if (error.message && error.message.includes('not found')) {
        // TODO: 使用自定义Dialog替代
        console.warn('该手机号尚未注册');
        if (onSwitchToRegister) {
          onSwitchToRegister(formData.phoneNumber);
        }
      } else if (error.message && error.message.includes('Invalid or expired')) {
        // TODO: 使用自定义Dialog替代
        console.error('登录失败', '验证码错误或已过期');
      } else {
        // TODO: 使用自定义Dialog替代
        console.error('登录失败', '网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>企业登录</Text>
      <Text style={styles.subtitle}>使用手机号码登录您的企业账号</Text>

      {/* 手机号输入 */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Icon name="phone" size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="请输入手机号码"
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            keyboardType="phone-pad"
            maxLength={11}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* 验证码输入 */}
      <View style={styles.inputContainer}>
        <View style={styles.codeWrapper}>
          <View style={[styles.inputWrapper, styles.codeInputWrapper]}>
            <Icon name="lock" size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="请输入验证码"
              value={formData.verificationCode}
              onChangeText={(value) => handleInputChange('verificationCode', value)}
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity
            style={[styles.codeButton, (countdown > 0 || loading) && styles.codeButtonDisabled]}
            onPress={sendVerificationCode}
            disabled={countdown > 0 || loading}
          >
            {loading && !codeSent ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.codeButtonText}>
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 登录按钮 */}
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading && codeSent ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.loginButtonText}>登录</Text>
        )}
      </TouchableOpacity>

      {/* 注册链接 */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>还没有账号？</Text>
        <TouchableOpacity onPress={() => onSwitchToRegister && onSwitchToRegister()}>
          <Text style={styles.registerLink}>立即注册</Text>
        </TouchableOpacity>
      </View>

      {/* 开发环境标识 */}
      {__DEV__ && process.env.SHOW_DEV_INFO === 'true' && (
        <View style={styles.devInfoContainer}>
          <Text style={styles.devInfoText}>开发环境</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInputWrapper: {
    flex: 1,
    marginRight: 12,
  },
  codeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 110,
  },
  codeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  codeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: '#6b7280',
  },
  registerLink: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 6,
  },
  devInfoContainer: {
    marginTop: 32,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  devInfoText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default CompanyLoginForm;