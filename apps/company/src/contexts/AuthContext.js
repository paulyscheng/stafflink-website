import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中是否有登录信息
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const companyInfo = await AsyncStorage.getItem('companyInfo');
        
        if (token && companyInfo) {
          // 如果有token，恢复用户信息
          const userInfo = JSON.parse(companyInfo);
          setUser({
            uid: userInfo.id,
            email: userInfo.email || userInfo.phone,
            displayName: userInfo.name || userInfo.contact_person,
            ...userInfo
          });
          console.log('Restored user from AsyncStorage');
        } else {
          console.log('No stored auth info found');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
    
    /* Original Firebase auth code - temporarily disabled
    let unsubscribe;
    
    // Add a small delay to ensure Firebase is fully initialized
    const initializeAuth = async () => {
      try {
        // Wait a bit for Firebase to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        unsubscribe = authService.onAuthStateChange((user) => {
          setUser(user);
          setLoading(false);
        });
      } catch (error) {
        console.log('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    */
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    // Mock login - accept any email/password for demo
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      uid: 'demo-user',
      email: email,
      displayName: 'Demo User'
    });
    setLoading(false);
    return { success: true, user: { email: email } };
  };

  const register = async (email, password) => {
    setLoading(true);
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      uid: 'demo-user',
      email: email,
      displayName: 'Demo User'
    });
    setLoading(false);
    return { success: true, user: { email: email } };
  };

  const sendPhoneVerification = async (phoneNumber) => {
    // Mock phone verification
    return { 
      success: true, 
      confirmationResult: {
        confirm: async (code) => {
          if (code === '123456') {
            return { user: { phoneNumber: phoneNumber } };
          }
          throw new Error('Invalid code. Use 123456 for demo.');
        }
      }
    };
  };

  const verifyPhoneCode = async (confirmationResult, code) => {
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(code);
      setUser({
        uid: 'demo-user',
        phoneNumber: result.user.phoneNumber,
        displayName: 'Demo User'
      });
      setLoading(false);
      return { success: true, user: result.user };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      uid: 'demo-user',
      email: 'demo@gmail.com',
      displayName: 'Demo User (Google)'
    });
    setLoading(false);
    return { success: true };
  };

  const signInWithApple = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      uid: 'demo-user',
      email: 'demo@icloud.com',
      displayName: 'Demo User (Apple)'
    });
    setLoading(false);
    return { success: true };
  };

  const signInWithWeChat = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      uid: 'demo-user',
      displayName: 'Demo User (WeChat)'
    });
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      // 清除本地存储的所有认证信息
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('companyId');
      await AsyncStorage.removeItem('companyInfo');
      
      // 使用 ApiService 的 logout 方法（它也会清除 AsyncStorage）
      await ApiService.logout();
      
      // 清除内存中的用户状态
      setUser(null);
      
      console.log('Logout successful, all data cleared');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使出错也要清除本地状态
      setUser(null);
    } finally {
      setLoading(false);
    }
    
    return { success: true };
  };

  const value = {
    user,
    loading,
    login,
    register,
    sendPhoneVerification,
    verifyPhoneCode,
    signInWithGoogle,
    signInWithApple,
    signInWithWeChat,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};