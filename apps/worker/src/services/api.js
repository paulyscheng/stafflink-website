import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const API_BASE_URL = API_URL || 'http://192.168.0.216:3000/api';

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
        const errorData = await response.json();
        // 确保错误消息格式一致
        const errorMessage = errorData.message || errorData.error || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      // Provide more specific error messages
      if (error.message === 'Network request failed') {
        throw new Error('无法连接到服务器，请检查网络连接');
      } else if (error.message.includes('JSON')) {
        throw new Error('服务器响应格式错误');
      }
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
    console.log(`📱 [Worker App] Attempting login - Phone: ${phone}, Code: ${code?.substring(0, 3)}***`);
    
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

      console.log(`📱 [Worker App] Login response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ [Worker App] Login failed with status ${response.status}:`, error);
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      console.log(`✅ [Worker App] Login successful for user: ${data.user?.id}`);

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
    console.log("query is:",query);
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
        wageOffer: inv.wage_amount || inv.original_wage,
        wageType: inv.wage_unit || 'hour',
        paymentType: inv.payment_type || (inv.wage_unit === 'hour' ? 'hourly' : 'daily'), // Map to paymentType for compatibility
        budgetRange: inv.original_wage || inv.wage_amount, // Map to budgetRange for display
        startDate: inv.start_date,
        endDate: inv.end_date,
        startTime: inv.start_time,
        endTime: inv.end_time,
        workDescription: inv.work_description,
        message: '', // invitations表中没有message字段
        status: inv.status,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        // Real fields from API
        requiredSkills: inv.required_skills ? inv.required_skills.map(s => s.skill_name) : [],
        distance: 2.5, // TODO: Calculate real distance based on worker and project location
        urgency: inv.priority || 'normal',
        estimatedDuration: inv.estimated_duration || '1天',
        requiredWorkers: inv.required_workers || 1
      }));
    }
    return data;
  }

  async getInvitationDetail(id) {
    try {
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
          wageOffer: inv.wage_amount || inv.original_wage,
          wageType: inv.wage_unit || 'hour',
          paymentType: inv.payment_type || (inv.wage_unit === 'hour' ? 'hourly' : 'daily'), // Map to paymentType for compatibility
          budgetRange: inv.original_wage || inv.wage_amount, // Map to budgetRange for display
          startDate: inv.start_date,
          endDate: inv.end_date,
          startTime: inv.start_time,
          endTime: inv.end_time,
          workDescription: inv.work_description,
          message: '', // invitations表中没有message字段
          status: inv.status,
          createdAt: inv.created_at,
          expiresAt: inv.expires_at,
          // Real fields from API
          requiredSkills: inv.required_skills ? inv.required_skills.map(s => s.skill_name) : [],
          distance: 2.5, // TODO: Calculate real distance
          urgency: inv.priority || 'normal',
          estimatedDuration: inv.estimated_duration || '1天',
          requiredWorkers: inv.required_workers || 1,
          companyContact: {
            name: inv.contact_person || '联系人',
            phone: inv.company_phone || '暂无'
          }
        };
      }
      return inv;
    } catch (error) {
      // 如果获取邀请失败，可能是job_record的ID，尝试获取工作详情
      console.log('getInvitationDetail error:', error.message);
      if (error.message && (error.message.includes('邀请不存在') || error.message.includes('404'))) {
        try {
          const job = await this.request(`/jobs/detail/${id}`);
          
          // 转换job_record数据为invitation格式以兼容前端
          return {
            id: id,  // 使用job_record的ID
            projectName: job.project_name,
            companyName: job.company_name,
            projectAddress: job.project_address,
            projectType: job.project_type || 'general',
            companyPhone: job.company_phone,
            companyRating: job.company_rating || 4.5,
            wageOffer: job.wage_amount || job.original_wage || job.daily_wage,
            wageType: job.wage_unit || job.payment_type || 'hour',
            paymentType: job.payment_type,
            budgetRange: job.payment_type === 'hourly' ? (job.original_wage || job.project_original_wage) : job.daily_wage,
            startDate: job.start_date || job.project_start_date,
            endDate: job.end_date,
            startTime: job.start_time || '09:00',
            endTime: job.end_time || '18:00',
            workDescription: job.project_description || job.work_description,
            message: '', // 没有message字段
            status: job.status === 'active' ? 'accepted' : job.status,
            createdAt: job.created_at,
            // 工作相关的额外字段
            jobRecordId: job.id,
            actualHours: job.actual_hours,
            workerConfirmed: job.worker_confirmed,
            companyConfirmed: job.company_confirmed,
            paymentStatus: job.payment_status,
            // Real fields from job data
            requiredSkills: job.required_skills ? job.required_skills.map(s => s.skill_name || s) : [],
            distance: 2.5, // TODO: Calculate real distance
            urgency: job.priority || 'normal',
            estimatedDuration: job.estimated_duration || job.project_duration || '1天',
            requiredWorkers: job.required_workers || 1,
            companyContact: {
              name: job.contact_person || '联系人',
              phone: job.company_phone || '暂无'
            }
          };
        } catch (jobError) {
          console.log('Failed to get job detail:', jobError);
          throw error; // 抛出原始错误
        }
      }
      throw error;
    }
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
  async getWorkerJobs(status = null) {
    const query = status ? `?status=${status}` : '';
    const data = await this.request(`/jobs/worker/jobs${query}`);
    
    // Transform data for compatibility with the app
    if (Array.isArray(data?.data)) {
      return data.data.map(job => ({
        id: job.id,
        job_record_id: job.id,  // Store the job_record_id
        projectName: job.project_name,
        companyName: job.company_name,
        projectAddress: job.project_address,
        wageOffer: job.wage_amount || job.original_wage || job.daily_wage,
        wageType: job.wage_unit || job.payment_type,
        paymentType: job.payment_type,
        budgetRange: job.payment_type === 'hourly' ? (job.original_wage || job.project_original_wage) : 
                     job.payment_type === 'daily' ? job.daily_wage : 
                     job.wage_amount,
        startDate: job.start_date || job.work_date || job.project_start_date,
        endDate: job.end_date,
        startTime: job.start_time || '09:00',
        endTime: job.end_time || '18:00',
        status: job.status,
        workDescription: job.work_description,
        // Additional fields for display
        requiredSkills: job.required_skills ? 
          (Array.isArray(job.required_skills) ? 
            job.required_skills.map(s => typeof s === 'object' ? s.skill_name : s) : 
            []) : [],
        distance: 2.5, // TODO: Calculate real distance
        urgency: job.priority || 'normal',
        estimatedDuration: job.estimated_duration || '1天',
        companyRating: job.company_rating || 4.5,
        requiredWorkers: job.required_workers || 1,
        companyContact: {
          name: job.contact_person || job.company_contact || '联系人',
          phone: job.company_phone || '暂无'
        }
      }));
    }
    return data?.data || [];
  }

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