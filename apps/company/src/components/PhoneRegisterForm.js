import React, { useState } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../../../../shared/components/Modal/ModalService';

const PhoneRegisterForm = ({ onToggleForm, onStartOnboarding }) => {
  // Remove login mode - only phone verification for registration
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
    verificationCode: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();
  const { sendPhoneVerification, verifyPhoneCode, login, register, signInWithGoogle, signInWithApple, signInWithWeChat } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendVerificationCode = async () => {
    if (!formData.phoneNumber) {
      modal.error(t('error'), t('pleaseEnterPhone'));
      return;
    }

    setLoading(true);
    
    // Format phone number - check if it's the test number
    let phoneNumber = formData.phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      // Special handling for test number
      if (phoneNumber === '8579957792') {
        phoneNumber = '+1' + phoneNumber;
      } else {
        phoneNumber = '+86' + phoneNumber;
      }
    }

    try {
      const result = await sendPhoneVerification(phoneNumber);
      
      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        setCodeSent(true);
        setCountdown(60);
        
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
      } else {
        modal.error(t('sendFailed'), result.error || t('pleaseTryAgainLater'));
      }
    } catch (error) {
      modal.error(t('sendFailed'), t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!agreedToTerms) {
      modal.error(t('error'), t('pleaseAgreeToTerms'));
      return;
    }

    if (!formData.phoneNumber || !formData.verificationCode) {
      modal.error(t('error'), t('pleaseCompleteAllFields'));
      return;
    }
    
    if (!confirmationResult) {
      modal.error(t('error'), t('pleaseGetVerificationCode'));
      return;
    }

    setLoading(true);
    
    try {
      const result = await verifyPhoneCode(confirmationResult, formData.verificationCode);
      
      if (result.success) {
        // Navigate to onboarding flow instead of showing popup
        if (onStartOnboarding) {
          let phoneNumber = formData.phoneNumber;
          if (!phoneNumber.startsWith('+')) {
            phoneNumber = phoneNumber === '8579957792' ? '+1' + phoneNumber : '+86' + phoneNumber;
          }
          onStartOnboarding({ phoneNumber: phoneNumber, user: result.user });
        }
      } else {
        modal.error(t('verificationFailed'), result.error || t('incorrectVerificationCode'));
      }
    } catch (error) {
      modal.error(t('verificationFailed'), t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (method) => {
    setLoading(true);
    
    try {
      let result;
      switch (method) {
        case 'Google':
          result = await signInWithGoogle();
          break;
        case 'Apple':
          result = await signInWithApple();
          break;
        case 'WeChat':
          result = await signInWithWeChat();
          break;
        default:
          throw new Error('Unknown login method');
      }

      if (result.success) {
        modal.success(t('loginSuccess'), `${t('loginWith')} ${method} ${t('successful')}!`);
      } else {
        modal.error(t('loginFailed'), result.error || t('pleaseTryAgainLater'));
      }
    } catch (error) {
      modal.error(t('loginFailed'), t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Phone Number Input - No label */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('phoneNumberPlaceholder')}
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange('phoneNumber', value)}
          keyboardType="phone-pad"
          maxLength={11}
        />
      </View>

      {/* Verification Code Input - No label */}
      <View style={styles.inputContainer}>
        <View style={styles.codeContainer}>
          <TextInput
            style={styles.codeInput}
            placeholder={t('verificationCodePlaceholder')}
            value={formData.verificationCode}
            onChangeText={(value) => handleInputChange('verificationCode', value)}
            keyboardType="numeric"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.codeButton, (countdown > 0 || loading) && styles.codeButtonDisabled]}
            onPress={sendVerificationCode}
            disabled={countdown > 0 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={[styles.codeButtonText, countdown > 0 && styles.codeButtonTextDisabled]}>
                {countdown > 0 ? `${countdown}s` : t('getVerificationCode')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Terms Agreement */}
      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          {agreedToTerms ? (
            <Icon name="check-circle" size={18} color="#2563eb" />
          ) : (
            <Icon name="circle-o" size={18} color="#9ca3af" />
          )}
        </TouchableOpacity>
        <Text style={styles.termsText}>
          {t('agreeToTerms')}
          <Text style={styles.linkText}>《{t('termsOfService')}》</Text>
          {t('and')}
          <Text style={styles.linkText}>《{t('privacyPolicy')}》</Text>
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.continueButton, (!agreedToTerms || loading) && styles.continueButtonDisabled]}
        onPress={handleRegister}
        disabled={!agreedToTerms || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Login Icons */}
      <View style={styles.socialContainer}>
        {/* WeChat */}
        <TouchableOpacity
          style={styles.socialIcon}
          onPress={() => handleSocialLogin('WeChat')}
          disabled={loading}
        >
          <Icon name="weixin" size={30} color="#1aad19" />
        </TouchableOpacity>

        {/* Google */}
        <TouchableOpacity
          style={styles.socialIcon}
          onPress={() => handleSocialLogin('Google')}
          disabled={loading}
        >
          <Text style={styles.googleIcon}>G</Text>
        </TouchableOpacity>

        {/* Apple */}
        <TouchableOpacity
          style={styles.socialIcon}
          onPress={() => handleSocialLogin('Apple')}
          disabled={loading}
        >
          <Icon name="apple" size={30} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#374151',
    marginRight: 12,
  },
  codeButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  codeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  codeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  codeButtonTextDisabled: {
    color: '#ffffff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  linkText: {
    color: '#2563eb',
  },
  continueButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  googleIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285f4',
  },
});

export default PhoneRegisterForm;