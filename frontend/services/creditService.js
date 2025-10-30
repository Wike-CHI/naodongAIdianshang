// 积分服务
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
    console.log('🚀 发送积分相关请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ 积分请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ 收到积分响应:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response.data;
  },
  (error) => {
    console.error('❌ 积分响应错误:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.response?.config?.url,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error.response?.data || error);
  }
);

// 积分服务
const creditService = {
  // 获取积分余额
  getBalance: async () => {
    try {
      console.log('💰 获取积分余额');
      const response = await apiClient.get(API_ENDPOINTS.CREDITS.BALANCE);
      console.log('✅ 获取积分余额成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取积分余额失败:', error);
      throw error;
    }
  },

  // 获取积分历史
  getHistory: async (params = {}) => {
    try {
      console.log('📜 获取积分历史:', params);
      const response = await apiClient.get(API_ENDPOINTS.CREDITS.HISTORY, { params });
      console.log('✅ 获取积分历史成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取积分历史失败:', error);
      throw error;
    }
  },

  // 获取积分统计
  getStats: async () => {
    try {
      console.log('📊 获取积分统计');
      const response = await apiClient.get(API_ENDPOINTS.CREDITS.STATS);
      console.log('✅ 获取积分统计成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取积分统计失败:', error);
      throw error;
    }
  },

  // 获取积分类型统计
  getTypeStats: async () => {
    try {
      console.log('📈 获取积分类型统计');
      const response = await apiClient.get(API_ENDPOINTS.CREDITS.TYPE_STATS);
      console.log('✅ 获取积分类型统计成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取积分类型统计失败:', error);
      throw error;
    }
  },

  // 获取积分排行榜
  getLeaderboard: async () => {
    try {
      console.log('🏆 获取积分排行榜');
      const response = await apiClient.get(API_ENDPOINTS.CREDITS.LEADERBOARD);
      console.log('✅ 获取积分排行榜成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取积分排行榜失败:', error);
      throw error;
    }
  },

  // 购买积分套餐
  purchaseCreditPackage: async (packageData) => {
    try {
      console.log('💰 开始购买积分套餐:', packageData);
      const response = await apiClient.post('/api/credit-packages/purchase', packageData);
      console.log('✅ 购买积分套餐成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 购买积分套餐失败:', error);
      throw error;
    }
  }
};

export default creditService;