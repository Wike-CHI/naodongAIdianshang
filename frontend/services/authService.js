// 认证服务
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
    console.log('🚀 发送请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误和token过期
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ 收到响应:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response.data;
  },
  (error) => {
    console.error('❌ 响应错误:', {
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

// 认证服务
const authService = {
  // 用户注册
  register: async (userData) => {
    try {
      console.log('📝 开始用户注册:', userData);
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      console.log('✅ 用户注册成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 用户注册失败:', error);
      throw error;
    }
  },

  // 用户登录
  login: async (credentials) => {
    try {
      console.log('🔐 开始用户登录:', credentials);
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      console.log('✅ 用户登录成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 用户登录失败:', error);
      throw error;
    }
  },

  // 微信登录
  wechatLogin: async () => {
    try {
      console.log('📱 开始微信登录');
      const response = await apiClient.post(API_ENDPOINTS.AUTH.WECHAT_LOGIN);
      console.log('✅ 微信登录成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 微信登录失败:', error);
      throw error;
    }
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    try {
      console.log('👤 获取当前用户信息');
      const response = await apiClient.get(API_ENDPOINTS.AUTH.CURRENT_USER);
      console.log('✅ 获取用户信息成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error);
      throw error;
    }
  },

  // 修改密码
  changePassword: async (passwordData) => {
    try {
      console.log('🔑 开始修改密码:', passwordData);
      const response = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
      console.log('✅ 修改密码成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 修改密码失败:', error);
      throw error;
    }
  },

  // 登出
  logout: async () => {
    try {
      console.log('🚪 开始登出');
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      console.log('✅ 登出成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 登出失败:', error);
      // 即使登出失败也清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('naodong_user');
      throw error;
    }
  }
};

export default authService;