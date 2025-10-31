// 用户服务
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

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🚀 用户服务请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ 用户服务请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误和token过期
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ 用户服务响应:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response.data;
  },
  (error) => {
    console.error('❌ 用户服务响应错误:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.response?.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Token过期，清除本地存储
      console.warn('⚠️ Token过期，清除本地存储');
      localStorage.removeItem('token');
      localStorage.removeItem('naodong_user');
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// 用户服务
const userService = {
  // 获取用户详情
  getUserById: async (userId) => {
    try {
      console.log('👤 获取用户详情:', userId);
      const response = await apiClient.get(`/api/users/${userId}`);
      console.log('✅ 获取用户详情成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取用户详情失败:', error);
      throw error;
    }
  },

  // 更新用户信息
  updateUser: async (userId, userData) => {
    try {
      console.log('📝 更新用户信息:', { userId, userData });
      const response = await apiClient.put(`/api/users/${userId}`, userData);
      console.log('✅ 更新用户信息成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 更新用户信息失败:', error);
      throw error;
    }
  },

  // 上传头像
  uploadAvatar: async (userId, file) => {
    try {
      console.log('📷 上传头像:', { userId, file });
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiClient.post(`/api/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ 上传头像成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 上传头像失败:', error);
      throw error;
    }
  },

  // 获取用户积分记录
  getUserCreditRecords: async (userId, params = {}) => {
    try {
      console.log('💳 获取用户积分记录:', { userId, params });
      const response = await apiClient.get(`/api/users/${userId}/credits`, { params });
      console.log('✅ 获取积分记录成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取积分记录失败:', error);
      throw error;
    }
  },

  // 获取用户生成历史
  getUserGenerations: async (userId, params = {}) => {
    try {
      console.log('🎨 获取用户生成历史:', { userId, params });
      const response = await apiClient.get(`/api/users/${userId}/generations`, { params });
      console.log('✅ 获取生成历史成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取生成历史失败:', error);
      throw error;
    }
  },

  // 获取用户订阅信息
  getUserSubscription: async (userId) => {
    try {
      console.log('📋 获取用户订阅信息:', userId);
      const response = await apiClient.get(`/api/users/${userId}/subscription`);
      console.log('✅ 获取订阅信息成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取订阅信息失败:', error);
      throw error;
    }
  },

  // 检查用户是否可以修改资料
  checkProfileUpdatePermission: async (userId) => {
    try {
      console.log('🔍 检查用户资料修改权限:', userId);
      const response = await apiClient.get(API_ENDPOINTS.USERS.CHECK_UPDATE_PERMISSION(userId));
      console.log('✅ 检查修改权限成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 检查修改权限失败:', error);
      throw error;
    }
  }
};

export default userService;