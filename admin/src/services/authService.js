// 认证服务
import axios from 'axios';
import { API_ENDPOINTS, createApiUrl } from '../config/api.js';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

// 响应拦截器 - 处理错误和token过期
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // 不在这里跳转，让组件处理
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 认证服务
const authService = {
  // 管理员登录
  login: async (credentials) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 验证token
  verifyToken: async () => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_TOKEN);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 登出
  logout: async () => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGOUT);
      return response;
    } catch (error) {
      // 即使登出失败也清除本地存储
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      throw error;
    }
  }
};

export default authService;