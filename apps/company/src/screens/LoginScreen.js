import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import Icon from 'react-native-vector-icons/FontAwesome';
import ApiService from '../services/api';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import SimpleRegisterForm from '../components/SimpleRegisterForm';
import PhoneRegisterForm from '../components/PhoneRegisterForm';
import VideoBackground from '../components/VideoBackground';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import { useLanguage } from '../contexts/LanguageContext';
import { useModal } from '../../../../shared/components/Modal/ModalService';
import LoadingSpinner from '../../../../shared/components/Loading/LoadingSpinner';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t, switchLanguage, currentLanguage } = useLanguage();
  const modal = useModal();

  const handleSignUp = () => {
    setShowWelcome(false);
    setIsLogin(false);
  };

  const handleLogIn = () => {
    setShowWelcome(false);
    setIsLogin(true);
  };

  const goBack = () => {
    if (showOnboarding) {
      setShowOnboarding(false);
      setOnboardingData(null);
    } else {
      setShowWelcome(true);
    }
  };

  const handleStartOnboarding = (data) => {
    setOnboardingData(data);
    setShowOnboarding(true);
  };


  const handleCompleteOnboarding = async (completeData) => {
    console.log('Onboarding completed, registering company...');
    
    try {
      // 注册新企业
      const registerData = {
        phone: completeData.phoneNumber.replace('+86', ''), // 去掉国家码
        code: '123456', // 开发环境使用固定验证码
        userType: 'company',
        name: completeData.step2Data?.companyName || 'Test Company',
        contactPerson: completeData.step1Data?.contactName,
        email: completeData.step1Data?.email,
        address: completeData.step2Data?.businessAddress,
      };
      
      // 先发送验证码（开发环境会返回验证码）
      const codeResponse = await ApiService.sendCode(registerData.phone);
      console.log('Verification code sent');
      
      // 然后注册
      const response = await ApiService.login(registerData.phone, registerData.code);
      
      if (response && response.token) {
        console.log('Company registered and logged in successfully');
        
        // Token已经在ApiService.login中保存
        // 直接跳转到主界面
        navigation.replace('Main');
      } else {
        modal.error('注册失败', '无法创建企业账号，请稍后重试');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      
      // 如果是已存在的企业，尝试登录
      if (error.message && error.message.includes('already exists')) {
        try {
          const phone = completeData.phoneNumber.replace('+86', '');
          const response = await ApiService.login(phone, '123456');
          
          if (response && response.token) {
            console.log('Company logged in successfully');
            navigation.replace('Main');
          }
        } catch (loginError) {
          modal.error('登录失败', '请检查您的手机号码');
        }
      } else {
        modal.error('注册失败', error.message || '请稍后重试');
      }
    }
  };

  if (showWelcome) {
    return (
      <View style={styles.container}>
        {/* 
          To enable video background, replace the ImageBackground below with:
          <VideoBackground
            videoSource={require('../../assets/worker-background.mp4')}
            imageSource={require('../../assets/engineers-blueprint.jpg')}
            style={styles.fullScreenBackground}
          >
          See VIDEO_SETUP.md for instructions on adding video files
        */}
        <ImageBackground
          source={require('../../assets/engineers-blueprint.jpg')}
          style={styles.fullScreenBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            {/* Language Switcher */}
            <View style={styles.languageContainer}>
              <TouchableOpacity 
                style={[styles.languageButton, currentLanguage === 'zh' && styles.activeLanguage]}
                onPress={() => switchLanguage('zh')}
              >
                <Text style={[styles.languageText, currentLanguage === 'zh' && styles.activeLanguageText]}>中文</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.languageButton, currentLanguage === 'en' && styles.activeLanguage]}
                onPress={() => switchLanguage('en')}
              >
                <Text style={[styles.languageText, currentLanguage === 'en' && styles.activeLanguageText]}>EN</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.centerContent}>
              {/* Transparent App Logo */}
              <View style={styles.transparentLogoContainer}>
                <Icon name="briefcase" size={50} color="#ffffff" />
              </View>
              
              {/* App Name */}
              <Text style={styles.appName}>StaffLink</Text>
              
              {/* Value Proposition */}
              <Text style={styles.valueProposition}>
                {t('valueProposition')}
              </Text>
            </View>

            {/* Bottom Buttons */}
            <View style={styles.bottomButtons}>
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
              >
                <Text style={styles.signUpButtonText}>{t('signUpFree')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.logInButton}
                onPress={handleLogIn}
              >
                <Text style={styles.logInButtonText}>{t('logIn')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.teamLink}>
                <Text style={styles.teamLinkText}>{t('joiningTeam')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  // Show onboarding flow
  if (showOnboarding) {
    return (
      <OnboardingFlow
        initialData={onboardingData}
        onComplete={handleCompleteOnboarding}
        onBack={goBack}
      />
    );
  }


  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.formHeader}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Icon name="arrow-left" size={20} color="#2563eb" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>
            {isLogin ? t('welcomeBack') : t('createAccount')}
          </Text>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {isLogin ? (
            <LoginForm onToggleForm={() => setIsLogin(false)} />
          ) : (
            <PhoneRegisterForm 
              onToggleForm={() => setIsLogin(true)} 
              onStartOnboarding={handleStartOnboarding}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  fullScreenBackground: {
    height: height,
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  languageContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 4,
    marginTop: 40,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  activeLanguage: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeLanguageText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  centerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  transparentLogoContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    letterSpacing: 2,
  },
  valueProposition: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.95,
  },
  bottomButtons: {
    width: '100%',
  },
  signUpButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  logInButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  teamLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  teamLinkText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '500',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: '#ffffff',
  },
});

export default LoginScreen;