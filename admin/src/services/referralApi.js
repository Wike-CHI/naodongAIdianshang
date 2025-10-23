// 推广系统API服务 - 管理员版本
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 管理员相关API
export const adminApi = {
  // 获取推广系统概览数据
  getOverview: async () => {
    try {
      const response = await apiClient.get('/admin/referral/overview');
      return response;
    } catch (error) {
      throw new Error(error.message || '获取概览数据失败');
    }
  },

  // 获取所有推广关系
  getAllRelationships: async (page = 1, pageSize = 20, filters = {}) => {
    try {
      const response = await apiClient.get('/admin/referral/relationships', {
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
      const response = await apiClient.delete(`/admin/referral/relationships/${relationshipId}`);
      return response;
    } catch (error) {
      throw new Error(error.message || '删除推广关系失败');
    }
  },

  // 更新推广关系状态
  updateRelationshipStatus: async (relationshipId, status) => {
    try {
      const response = await apiClient.put(`/admin/referral/relationships/${relationshipId}/status`, {
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
      const response = await apiClient.get('/admin/system/config');
      return response;
    } catch (error) {
      throw new Error(error.message || '获取系统配置失败');
    }
  },

  // 更新系统配置
  updateConfig: async (key, value) => {
    try {
      const response = await apiClient.put('/admin/system/config', {
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
      const response = await apiClient.post('/admin/system/config/reset');
      return response;
    } catch (error) {
      throw new Error(error.message || '重置系统配置失败');
    }
  }
};