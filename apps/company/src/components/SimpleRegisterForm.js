import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../../../../shared/components/Modal/ModalService';

const SimpleRegisterForm = ({ onToggleForm }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();
  const modal = useModal();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = () => {
    if (!formData.email || !formData.password) {
      modal.error('Error', 'Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      modal.error('Error', 'Password must be at least 6 characters');
      return;
    }
    modal.success('Success', 'Account created successfully!');
  };

  const handleSocialLogin = (method) => {
    modal.info('Login', `Login with ${method}`);
  };

  return (
    <View style={styles.container}>
      {/* Email Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('email')}
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('password')}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon 
              name={showPassword ? "eye" : "eye-slash"} 
              size={16} 
              color="#9ca3af" 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.passwordHint}>{t('minimumCharacters')}</Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleRegister}
      >
        <Text style={styles.continueButtonText}>{t('continue')}</Text>
      </TouchableOpacity>

      {/* Already have account */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>
          {t('alreadyHaveAccount')} {' '}
          <TouchableOpacity onPress={onToggleForm}>
            <Text style={styles.loginLink}>{t('loginHere')}</Text>
          </TouchableOpacity>
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Login Options */}
      <View style={styles.socialContainer}>
        {/* Google Login */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleSocialLogin('Google')}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.socialButtonText}>{t('continueWithGoogle')}</Text>
        </TouchableOpacity>

        {/* Apple Login */}
        <TouchableOpacity
          style={styles.appleButton}
          onPress={() => handleSocialLogin('Apple')}
        >
          <Icon name="apple" size={18} color="#ffffff" />
          <Text style={styles.appleButtonText}>{t('continueWithApple')}</Text>
        </TouchableOpacity>
      </View>

      {/* Terms */}
      <Text style={styles.termsText}>
        {t('byTapping')} {' '}
        <Text style={styles.linkText}>{t('privacyPolicy')}</Text>
        {t('and')}
        <Text style={styles.linkText}>{t('termsOfService')}</Text>
      </Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#374151',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#374151',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  passwordHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  continueButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    color: '#22c55e',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
  socialContainer: {
    marginBottom: 30,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285f4',
    marginRight: 12,
  },
  socialButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 12,
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#22c55e',
    textDecorationLine: 'underline',
  },
});

export default SimpleRegisterForm;