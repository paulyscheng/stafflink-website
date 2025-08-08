import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    // 如果没有token且不是登录相关的请求，直接返回错误
    if (!token && !endpoint.includes('/auth/')) {
      throw new Error('未登录');
    }
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async sendVerificationCode(phone) {
    // 发送验证码不需要token
    try {
      const response = await fetch(`${this.baseURL}/auth/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send code');
      }

      return await response.json();
    } catch (error) {
      console.error('Send code API failed:', error);
      throw error;
    }
  }

  async login(phone, code) {
    // 登录请求不需要token，直接调用fetch
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          phone, 
          code,
          userType: 'worker'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();

      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('workerId', data.user.id);
        await AsyncStorage.setItem('workerInfo', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login API failed:', error);
      throw error;
    }
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('workerId');
    await AsyncStorage.removeItem('workerInfo');
  }

  // Worker profile endpoints
  async getWorkerProfile() {
    return this.request('/workers/profile');
  }

  async updateWorkerProfile(data) {
    return this.request('/workers/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateWorkerStatus(status) {
    return this.request('/workers/status', {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Invitations endpoints
  async getInvitations(status = null) {
    const query = status ? `?status=${status}` : '';
    const data = await this.request(`/invitations/worker${query}`);
    
    // Transform snake_case to camelCase for the app
    if (Array.isArray(data)) {
      return data.map(inv => ({
        id: inv.id,
        projectName: inv.project_name,
        companyName: inv.company_name,
        projectAddress: inv.project_address,
        projectType: inv.project_type,
        companyPhone: inv.company_phone,
        companyRating: inv.company_rating || 4.5,
        wageOffer: inv.wage_offer,
        wageType: inv.wage_type,
        paymentType: inv.wage_type, // Map to paymentType for compatibility
        budgetRange: inv.wage_offer, // Map to budgetRange for display
        startDate: inv.start_date,
        endDate: inv.end_date,
        startTime: inv.start_time,
        endTime: inv.end_time,
        workDescription: inv.work_description,
        message: inv.message,
        status: inv.status,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        // Mock additional fields for now
        requiredSkills: ['电工', '水管工'],
        distance: 2.5,
        urgency: inv.message?.includes('紧急') ? 'urgent' : 'normal',
        estimatedDuration: '8小时',
        requiredWorkers: 1
      }));
    }
    return data;
  }

  async getInvitationDetail(id) {
    const inv = await this.request(`/invitations/${id}`);
    
    // Transform snake_case to camelCase for the app
    if (inv) {
      return {
        id: inv.id,
        projectName: inv.project_name,
        companyName: inv.company_name,
        projectAddress: inv.project_address,
        projectType: inv.project_type,
        companyPhone: inv.company_phone,
        companyRating: inv.company_rating || 4.5,
        wageOffer: inv.wage_offer,
        wageType: inv.wage_type,
        paymentType: inv.wage_type, // Map to paymentType for compatibility
        budgetRange: inv.wage_offer, // Map to budgetRange for display
        startDate: inv.start_date,
        endDate: inv.end_date,
        startTime: inv.start_time,
        endTime: inv.end_time,
        workDescription: inv.work_description,
        message: inv.message,
        status: inv.status,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        // Mock additional fields for now
        requiredSkills: ['电工', '水管工'],
        distance: 2.5,
        urgency: inv.message?.includes('紧急') ? 'urgent' : 'normal',
        estimatedDuration: '8小时',
        requiredWorkers: inv.required_workers || 1,
        companyContact: {
          name: inv.contact_person || '联系人',
          phone: inv.company_phone || '暂无'
        }
      };
    }
    return inv;
  }

  async respondToInvitation(id, status, responseMessage = null) {
    return this.request(`/invitations/${id}/respond`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        response_message: responseMessage
      })
    });
  }

  // Job records endpoints
  async getJobHistory() {
    return this.request('/jobs/history');
  }

  async getJobDetail(id) {
    return this.request(`/jobs/${id}`);
  }

  // Skills endpoints
  async getAllSkills() {
    return this.request('/skills');
  }

  async getSkillsByCategory(category) {
    return this.request(`/skills/category/${category}`);
  }

  async updateWorkerSkills(skills) {
    return this.request('/skills/worker', {
      method: 'PUT',
      body: JSON.stringify({ skills })
    });
  }

  // Notifications endpoints
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT'
    });
  }
}

export default new ApiService();