import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const API_BASE_URL = API_URL || 'http://192.168.0.216:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async sendCode(phone) {
    return this.request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  }

  async login(phone, code) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        phone, 
        code,
        userType: 'company'
      })
    });

    if (response.token) {
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('companyId', response.user.id);
      await AsyncStorage.setItem('companyInfo', JSON.stringify(response.user));
    }

    return response;
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('companyId');
    await AsyncStorage.removeItem('companyInfo');
  }

  // Worker endpoints
  async getAllWorkers(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const endpoint = query ? `/workers?${query}` : '/workers';
    const response = await this.request(endpoint);
    return response.workers || [];
  }

  async getAvailableWorkers(skills = []) {
    // 使用 getAllWorkers 并添加技能过滤
    const filters = {};
    if (skills.length > 0) {
      filters.skills = skills.join(',');
    }
    return this.getAllWorkers(filters);
  }

  async getWorkerDetail(id) {
    return this.request(`/workers/${id}`);
  }

  // Project endpoints
  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async getProjects(status = null) {
    try {
      const query = status ? `?status=${status}` : '';
      const response = await this.request(`/projects${query}`);
      // The API returns data.projects structure
      return response?.data?.projects || response?.projects || [];
    } catch (error) {
      console.error('Failed to get projects:', error);
      return []; // Return empty array on error
    }
  }

  async getProjectDetail(id) {
    return this.request(`/projects/${id}`);
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Invitation endpoints
  async createInvitation(invitationData) {
    return this.request('/invitations', {
      method: 'POST',
      body: JSON.stringify(invitationData)
    });
  }

  async createBatchInvitations(invitationsData) {
    return this.request('/invitations/batch', {
      method: 'POST',
      body: JSON.stringify(invitationsData)
    });
  }

  async getProjectInvitations(projectId) {
    return this.request(`/invitations/project/${projectId}`);
  }

  async cancelInvitation(id) {
    return this.request(`/invitations/${id}/cancel`, {
      method: 'PUT'
    });
  }

  // Company profile endpoints
  async getCompanyProfile() {
    return this.request('/companies/profile');
  }

  async updateCompanyProfile(data) {
    return this.request('/companies/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Statistics endpoints
  async getStatistics() {
    return this.request('/statistics/company');
  }

  // Job management endpoints
  async getCompanyJobs(status = null) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/jobs/company/jobs${query}`);
  }

  async getJobDetail(jobId) {
    return this.request(`/jobs/detail/${jobId}`);
  }

  async confirmCompanyWork(data) {
    return this.request('/jobs/company/confirm', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async payCompanyWork(data) {
    return this.request('/jobs/company/pay', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Upload photo
  async uploadWorkPhoto(data) {
    return this.request('/jobs/photo/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

export default new ApiService();