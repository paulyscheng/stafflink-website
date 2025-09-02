import React, { createContext, useContext, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);

  // 开发测试用的工人数据
  const workerAccounts = {
    '13800138001': { code: '123456', data: { id: '94992750-d25a-4d62-9ba5-8092849291b5', name: '张师傅', skills: ['电工', '水管工', '空调维修'], experience: '15年', rating: 4.8, status: 'online', completedJobs: 45, address: '深圳市南山区' }},
    '13800138002': { code: '123456', data: { id: '410202c6-d5f1-456d-b0be-365d6189569a', name: '李师傅', skills: ['木工', '油漆工', '家具安装'], experience: '10年', rating: 4.6, status: 'online', completedJobs: 28, address: '深圳市福田区' }},
    '13800138003': { code: '123457', data: { id: '17c0c2bf-a4f2-4cff-bf5a-adc6e474dbbe', name: '王师傅', skills: ['铺砖工', '泥瓦工', '防水工'], experience: '12年', rating: 4.9, status: 'busy', completedJobs: 46, address: '深圳市龙华区' }},
    '13800138004': { code: '123458', data: { id: '98418956-7bf2-4039-9df6-a6eb0dc3c0cd', name: '赵师傅', skills: ['搬运工', '装卸工', '司机'], experience: '8年', rating: 4.5, status: 'online', completedJobs: 42, address: '深圳市宝安区' }},
    '13800138005': { code: '123451', data: { id: '9bcc7462-5e7b-447a-9486-aae308b41e75', name: '刘师傅', skills: ['焊工', '钢筋工', '脚手架工'], experience: '11年', rating: 4.7, status: 'offline', completedJobs: 49, address: '深圳市罗湖区' }},
    '13800138006': { code: '234510', data: { id: '6ce4376e-af76-4175-8e77-fdf2462f0320', name: '陈阿姨', skills: ['保洁员', '家政服务', '钟点工'], experience: '20年', rating: 4.9, status: 'online', completedJobs: 52, address: '深圳市龙岗区' }},
    '13800138007': { code: '123454', data: { id: '866038dd-0950-424b-bf55-4a887f1a2bec', name: '孙师傅', skills: ['厨师', '配菜员', '面点师'], experience: '7年', rating: 4.4, status: 'online', completedJobs: 37, address: '深圳市坪山区' }},
    '13800138008': { code: '123453', data: { id: 'cb975046-942c-4d29-a5db-738e7caa05f2', name: '周师傅', skills: ['装配工', '普工', '质检员'], experience: '9年', rating: 4.6, status: 'online', completedJobs: 41, address: '深圳市光明区' }},
    '13800138009': { code: '123452', data: { id: '468d4275-299b-44ca-9026-9aa0dfd7afa5', name: '吴师傅', skills: ['园艺工', '维修工', '管道疏通'], experience: '14年', rating: 4.8, status: 'busy', completedJobs: 25, address: '深圳市大鹏新区' }},
    '13800138010': { code: '123459', data: { id: '07cb6728-0971-422a-857b-f3b8aed52924', name: '郑阿姨', skills: ['月嫂', '育儿嫂', '护工'], experience: '16年', rating: 4.7, status: 'online', completedJobs: 36, address: '深圳市盐田区' }},
    // 保留原来的测试账号
    '13800138000': { code: '123456', data: { id: 'worker_123', name: '测试账号', skills: ['电工', '水管工'], experience: '5年', rating: 4.8, status: 'online', completedJobs: 128, address: '北京市朝阳区' }}
  };

  const login = async (phoneNumber, verificationCode) => {
    setIsLoading(true);
    try {
      // 调用真实的登录API
      const response = await ApiService.login(phoneNumber, verificationCode);
      
      if (response && response.user) {
        // 使用API返回的真实用户数据
        const workerData = {
          ...response.user,
          phone: phoneNumber,
          avatar: response.user.name ? response.user.name.charAt(0) : '工',
          location: {
            latitude: 22.5431 + Math.random() * 0.1,
            longitude: 114.0579 + Math.random() * 0.1,
            address: response.user.address || '深圳市'
          }
        };
        
        setUser(workerData);
        return { success: true };
      } else {
        return { success: false, error: '登录失败' };
      }
    } catch (error) {
      // 如果API失败，回退到本地验证（用于开发测试）
      console.log('API login failed, trying local verification');
      const account = workerAccounts[phoneNumber];
      
      if (account && verificationCode === account.code) {
        const workerData = {
          ...account.data,
          phone: phoneNumber,
          avatar: account.data.name.charAt(0),
          location: {
            latitude: 22.5431 + Math.random() * 0.1,
            longitude: 114.0579 + Math.random() * 0.1,
            address: account.data.address
          }
        };
        
        // 生成并存储模拟的token（仅用于开发）
        const mockToken = `mock-token-${account.data.id}`;
        await AsyncStorage.setItem('authToken', mockToken);
        await AsyncStorage.setItem('workerId', account.data.id);
        await AsyncStorage.setItem('workerInfo', JSON.stringify(workerData));
        
        setUser(workerData);
        return { success: true };
      }
      
      return { success: false, error: error.message || '登录失败' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('workerId');
    await AsyncStorage.removeItem('workerInfo');
    setUser(null);
  };

  const updateWorkerStatus = (status) => {
    if (user) {
      setUser(prev => ({ ...prev, status }));
    }
  };

  const updateProfile = (updates) => {
    if (user) {
      setUser(prev => ({ ...prev, ...updates }));
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    updateWorkerStatus,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};