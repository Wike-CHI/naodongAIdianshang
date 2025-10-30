// 订阅服务
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
    console.log('🚀 发送订阅相关请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ 订阅请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ 收到订阅响应:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response.data;
  },
  (error) => {
    console.error('❌ 订阅响应错误:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.response?.config?.url,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error.response?.data || error);
  }
);

// 订阅服务
const subscriptionService = {
  // 获取订阅套餐列表
  getSubscriptionPlans: async () => {
    try {
      console.log('📋 获取订阅套餐列表');
      const response = await apiClient.get(API_ENDPOINTS.SUBSCRIPTION.PLANS);
      console.log('✅ 获取订阅套餐列表成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取订阅套餐列表失败:', error);
      throw error;
    }
  },

  // 创建订阅
  createSubscription: async (subscriptionData) => {
    try {
      console.log('💳 开始创建订阅:', subscriptionData);
      const response = await apiClient.post('/api/subscriptions', subscriptionData);
      console.log('✅ 创建订阅成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 创建订阅失败:', error);
      throw error;
    }
  },

  // 取消订阅
  cancelSubscription: async (subscriptionId) => {
    try {
      console.log('🚫 开始取消订阅:', subscriptionId);
      const response = await apiClient.post(`/api/subscriptions/${subscriptionId}/cancel`);
      console.log('✅ 取消订阅成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 取消订阅失败:', error);
      throw error;
    }
  },

  // 续费订阅
  renewSubscription: async (subscriptionId, renewData) => {
    try {
      console.log('🔄 开始续费订阅:', subscriptionId, renewData);
      const response = await apiClient.post(`/api/subscriptions/${subscriptionId}/renew`, renewData);
      console.log('✅ 续费订阅成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 续费订阅失败:', error);
      throw error;
    }
  },

  // 获取用户订阅信息
  getUserSubscription: async () => {
    try {
      console.log('👤 获取用户订阅信息');
      const response = await apiClient.get('/api/user/subscription');
      console.log('✅ 获取用户订阅信息成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取用户订阅信息失败:', error);
      throw error;
    }
  }
};

export default subscriptionService;