// 推广系统API服务
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 推广码相关API
export const referralCodeApi = {
  // 生成推广码
  generateCode: async (userId) => {
    try {
      const response = await apiClient.post('/api/referral/code/generate', { userId });
      return response;
    } catch (error) {
      console.error('生成推广码失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 验证推广码
  validateCode: async (code) => {
    try {
      const response = await apiClient.post('/api/referral/code/validate', { code });
      return response;
    } catch (error) {
      console.error('验证推广码失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 推广关系相关API
export const referralRelationshipApi = {
  // 建立推广关系
  createRelationship: async (refereeId, referralCode) => {
    try {
      const response = await apiClient.post('/api/referral/relationship', { refereeId, referralCode });
      return response;
    } catch (error) {
      console.error('建立推广关系失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取推广统计
  getStats: async (userId) => {
    try {
      const response = await apiClient.get(`/api/referral/stats/${userId}`);
      return response;
    } catch (error) {
      console.error('获取推广统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 积分相关API
export const pointsApi = {
  // 计算推广积分
  calculateReferral: async (refereeId, amount) => {
    try {
      const response = await apiClient.post('/api/referral/points/calculate', { refereeId, amount });
      return response;
    } catch (error) {
      console.error('计算推广积分失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取积分历史
  getHistory: async (userId, page = 1, pageSize = 10) => {
    try {
      const response = await apiClient.get(`/api/referral/points/history/${userId}`, {
        params: { page, pageSize }
      });
      return response;
    } catch (error) {
      console.error('获取积分历史失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 系统配置API
export const systemConfigApi = {
  // 获取系统配置
  getConfig: async () => {
    try {
      const response = await apiClient.get('/api/referral/config');
      return response;
    } catch (error) {
      console.error('获取系统配置失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 更新系统配置
  updateConfig: async (configKey, configValue) => {
    try {
      const response = await apiClient.put('/api/referral/config', { configKey, configValue });
      return response;
    } catch (error) {
      console.error('更新系统配置失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 管理员API
export const adminApi = {
  // 获取推广系统概览数据
  getOverview: async () => {
    try {
      const response = await apiClient.get('/api/admin/referral/overview');
      return response;
    } catch (error) {
      throw new Error(error.message || '获取概览数据失败');
    }
  },

  // 获取所有推广关系
  getAllRelationships: async (page = 1, pageSize = 20, filters = {}) => {
    try {
      const response = await apiClient.get('/api/admin/referral/relationships', {
        params: {
          page,
          pageSize,
          ...filters
        }
      });
      return response;
    } catch (error) {
      throw new Error(error.message || '获取推广关系失败');
    }
  },

  // 删除推广关系
  deleteRelationship: async (relationshipId) => {
    try {
      const response = await apiClient.delete(`/api/admin/referral/relationships/${relationshipId}`);
      return response;
    } catch (error) {
      throw new Error(error.message || '删除推广关系失败');
    }
  },

  // 更新推广关系状态
  updateRelationshipStatus: async (relationshipId, status) => {
    try {
      const response = await apiClient.put(`/api/admin/referral/relationships/${relationshipId}/status`, {
        status
      });
      return response;
    } catch (error) {
      throw new Error(error.message || '更新推广关系状态失败');
    }
  }
};

// 系统配置API
export const adminSystemConfigApi = {
  // 获取系统配置
  getConfig: async () => {
    try {
      const response = await apiClient.get('/api/admin/system/config');
      return response;
    } catch (error) {
      throw new Error(error.message || '获取系统配置失败');
    }
  },

  // 更新系统配置
  updateConfig: async (key, value) => {
    try {
      const response = await apiClient.put('/api/admin/system/config', {
        key,
        value
      });
      return response;
    } catch (error) {
      throw new Error(error.message || '更新系统配置失败');
    }
  },

  // 重置系统配置
  resetConfig: async () => {
    try {
      const response = await apiClient.post('/api/admin/system/config/reset');
      return response;
    } catch (error) {
      throw new Error(error.message || '重置系统配置失败');
    }
  }
};

// 推广API
export const referralApi = {
  // 获取用户推广数据
  getUserReferralData: async (userId) => {
    try {
      const response = await apiClient.get(`/api/referral/user/${userId}`);
      return response;
    } catch (error) {
      console.error('获取用户推广数据失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取推广统计
  getReferralStats: async (userId, options = {}) => {
    try {
      const response = await apiClient.get(`/api/referral/stats/${userId}`, {
        params: options
      });
      return response;
    } catch (error) {
      console.error('获取推广统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取推广列表
  getReferralList: async (userId, options = {}) => {
    try {
      const response = await apiClient.get(`/api/referral/list/${userId}`, {
        params: options
      });
      return response;
    } catch (error) {
      console.error('获取推广列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取积分历史
  getCreditHistory: async (userId) => {
    try {
      const response = await apiClient.get(`/api/referral/credits/${userId}`);
      return response;
    } catch (error) {
      console.error('获取积分历史失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default {
  referralCodeApi,
  referralRelationshipApi,
  pointsApi,
  systemConfigApi,
  adminApi,
  adminSystemConfigApi
};
