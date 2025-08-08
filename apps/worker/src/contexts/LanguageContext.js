import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  zh: {
    // Login & Auth
    login: '登录',
    phoneNumber: '手机号',
    verificationCode: '验证码',
    getCode: '获取验证码',
    enterPhone: '请输入手机号',
    enterCode: '请输入验证码',
    
    // Navigation
    jobs: '工作',
    profile: '我的',
    history: '历史',
    
    // Jobs
    newJobs: '新工作',
    acceptedJobs: '已接受',
    jobDetails: '工作详情',
    accept: '接受',
    reject: '拒绝',
    
    // Common
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    edit: '编辑',
    loading: '加载中...',
  },
  en: {
    // Login & Auth  
    login: 'Login',
    phoneNumber: 'Phone Number',
    verificationCode: 'Verification Code',
    getCode: 'Get Code',
    enterPhone: 'Enter phone number',
    enterCode: 'Enter verification code',
    
    // Navigation
    jobs: 'Jobs',
    profile: 'Profile', 
    history: 'History',
    
    // Jobs
    newJobs: 'New Jobs',
    acceptedJobs: 'Accepted',
    jobDetails: 'Job Details',
    accept: 'Accept',
    reject: 'Reject',
    
    // Common
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    loading: 'Loading...',
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('zh');

  const t = (key) => {
    return translations[currentLanguage][key] || key;
  };

  const switchLanguage = (language) => {
    if (translations[language]) {
      setCurrentLanguage(language);
    }
  };

  const value = {
    currentLanguage,
    t,
    switchLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};