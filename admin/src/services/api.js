// API服务 - 连接后端真实接口
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
      // Token过期，清除本地存储并跳转到登录页
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// 认证相关API
export const authAPI = {
  // 管理员登录
  login: (credentials) => apiClient.post(API_ENDPOINTS.LOGIN, credentials),
  
  // 获取当前用户信息
  getCurrentUser: () => apiClient.get('/api/admin/me'),
  
  // 刷新token
  refreshToken: () => apiClient.post(API_ENDPOINTS.REFRESH_TOKEN),
  
  // 登出
  logout: () => apiClient.post(API_ENDPOINTS.LOGOUT)
};

// 仪表板相关API
export const dashboardAPI = {
  // 获取统计数据
  getStats: () => apiClient.get(API_ENDPOINTS.DASHBOARD_STATS),
  
  // 获取图表数据
  getChartData: (params) => apiClient.get(API_ENDPOINTS.DASHBOARD_CHARTS, { params }),
  
  // 获取最近活动
  getRecentActivities: (params) => apiClient.get(API_ENDPOINTS.RECENT_ACTIVITIES, { params })
};

// 用户管理相关API
export const usersAPI = {
  // 获取用户列表
  getUsers: (params) => apiClient.get(API_ENDPOINTS.USERS, { params }),
  
  // 获取用户详情
  getUserById: (id) => apiClient.get(API_ENDPOINTS.USER_BY_ID(id)),
  
  // 更新用户信息
  updateUser: (id, data) => apiClient.put(API_ENDPOINTS.USER_BY_ID(id), data),
  
  // 调整用户积分
  adjustCredits: (id, data) => apiClient.post(API_ENDPOINTS.USER_CREDITS(id), data),
  
  // 获取用户积分记录
  getUserCredits: (id, params) => apiClient.get(API_ENDPOINTS.USER_CREDITS(id), { params }),
  
  // 获取用户订阅信息
  getUserSubscription: (id, params) => apiClient.get(API_ENDPOINTS.USER_SUBSCRIPTION(id), { params }),
  
  // 批量操作用户
  batchUpdateUsers: (data) => apiClient.post(API_ENDPOINTS.BATCH_USER_UPDATE, data),
  
  // 获取用户统计
  getUserStats: () => apiClient.get('/api/admin/users/stats')
};

// AI工具管理相关API
export const toolsAPI = {
  // 获取工具列表
  getTools: (params) => apiClient.get(API_ENDPOINTS.AI_TOOLS, { params }),
  
  // 获取工具详情
  getToolById: (id) => apiClient.get(API_ENDPOINTS.AI_TOOL_BY_ID(id)),
  
  // 创建工具
  createTool: (data) => apiClient.post(API_ENDPOINTS.AI_TOOLS, data),
  
  // 更新工具
  updateTool: (id, data) => apiClient.put(API_ENDPOINTS.AI_TOOL_BY_ID(id), data),
  
  // 删除工具
  deleteTool: (id) => apiClient.delete(API_ENDPOINTS.AI_TOOL_BY_ID(id)),
  
  // 切换工具状态
  toggleToolStatus: (id, enabled) => apiClient.patch(API_ENDPOINTS.AI_TOOL_TOGGLE(id), { enabled }),
  
  // 获取工具类型
  getToolTypes: () => apiClient.get(API_ENDPOINTS.AI_TOOL_TYPES),
  
  // 获取工具分类
  getToolCategories: () => apiClient.get(API_ENDPOINTS.AI_TOOL_CATEGORIES),
  
  // 获取工具统计
  getToolStats: () => apiClient.get(API_ENDPOINTS.AI_TOOL_STATS),
  
  // 测试工具
  testTool: (id) => apiClient.post(API_ENDPOINTS.AI_TOOL_TEST(id)),
  
  // 批量操作工具
  batchUpdateTools: (data) => apiClient.post(API_ENDPOINTS.AI_TOOL_BATCH, data)
};

// 订阅管理相关API
export const subscriptionsAPI = {
  // 获取订阅套餐列表
  getPlans: (params) => apiClient.get(API_ENDPOINTS.SUBSCRIPTION_PLANS, { params }),
  
  // 创建订阅套餐
  createPlan: (data) => apiClient.post(API_ENDPOINTS.SUBSCRIPTION_PLANS, data),
  
  // 更新订阅套餐
  updatePlan: (id, data) => apiClient.put(API_ENDPOINTS.SUBSCRIPTION_PLAN_BY_ID(id), data),
  
  // 删除订阅套餐
  deletePlan: (id) => apiClient.delete(API_ENDPOINTS.SUBSCRIPTION_PLAN_BY_ID(id)),
  
  // 获取用户订阅列表
  getUserSubscriptions: (params) => apiClient.get(API_ENDPOINTS.USER_SUBSCRIPTIONS, { params }),
  
  // 获取订阅统计
  getSubscriptionStats: () => apiClient.get(API_ENDPOINTS.SUBSCRIPTION_STATS)
};

// 积分管理相关API
export const creditsAPI = {
  // 获取积分记录列表
  getCreditRecords: (params) => apiClient.get(API_ENDPOINTS.CREDIT_LOGS, { params }),
  
  // 调整用户积分
  adjustUserCredits: (data) => apiClient.post(API_ENDPOINTS.CREDIT_ADJUST, data),
  
  // 获取积分统计
  getCreditStats: () => apiClient.get(API_ENDPOINTS.CREDIT_STATS),
  
  // 获取积分规则
  getRules: () => apiClient.get(API_ENDPOINTS.CREDIT_RULES),
  
  // 获取交易记录
  getTransactions: (params) => apiClient.get(API_ENDPOINTS.CREDIT_TRANSACTIONS, { params }),
  
  // 获取图表数据
  getChartData: () => apiClient.get(API_ENDPOINTS.CREDIT_CHART_DATA)
};

// 系统管理相关API
export const systemAPI = {
  // 健康检查
  healthCheck: () => apiClient.get(API_ENDPOINTS.HEALTH_CHECK),
  
  // 获取系统统计
  getSystemStats: () => apiClient.get(API_ENDPOINTS.SYSTEM_STATS),
  
  // 获取同步日志
  getSyncLogs: (params) => apiClient.get(API_ENDPOINTS.SYNC_LOGS, { params })
};

// 获取token的辅助函数
const getToken = () => {
  return localStorage.getItem('admin_token');
};

// 文件上传服务
export const fileAPI = {
  // 上传图片（AI工具图标）
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(createApiUrl(API_ENDPOINTS.UPLOAD_IMAGE), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '图片上传失败');
    }
    
    return response.json();
  },

  // 上传文件
  uploadFile: async (files) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      formData.append('files', files);
    }
    
    const response = await fetch(createApiUrl(API_ENDPOINTS.UPLOAD_FILE), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '文件上传失败');
    }
    
    return response.json();
  }
};

// API管理相关API
export const apiManagementAPI = {
  // 获取API接口列表
  getEndpoints: () => apiClient.get(API_ENDPOINTS.API_ENDPOINTS),
  
  // 创建API接口
  createEndpoint: (data) => apiClient.post(API_ENDPOINTS.API_ENDPOINTS, data),
  
  // 更新API接口
  updateEndpoint: (id, data) => apiClient.put(`${API_ENDPOINTS.API_ENDPOINTS}/${id}`, data),
  
  // 删除API接口
  deleteEndpoint: (id) => apiClient.delete(`${API_ENDPOINTS.API_ENDPOINTS}/${id}`),
  
  // 获取API密钥列表
  getKeys: () => apiClient.get(API_ENDPOINTS.API_KEYS),
  
  // 创建API密钥
  createKey: (data) => apiClient.post(API_ENDPOINTS.API_KEYS, data),
  
  // 更新API密钥
  updateKey: (id, data) => apiClient.put(`${API_ENDPOINTS.API_KEYS}/${id}`, data),
  
  // 删除API密钥
  deleteKey: (id) => apiClient.delete(`${API_ENDPOINTS.API_KEYS}/${id}`)
};

// AI模特工具管理API
export const aiModelToolsAPI = {
  // 获取AI模特工具列表
  getAIModelTools: () => apiClient.get('/api/admin/ai-model-tools'),
  
  // 获取AI模特工具详情
  getAIModelTool: (id) => apiClient.get(`/api/admin/ai-model-tools/${id}`),
  
  // 更新AI模特工具配置
  updateAIModelTool: (id, data) => apiClient.put(`/api/admin/ai-model-tools/${id}`, data),
  
  // 批量更新AI模特工具状态
  batchUpdateStatus: (data) => apiClient.post('/api/admin/ai-model-tools/batch-status', data),
  
  // 重置AI模特工具配置
  resetAIModelTool: (id) => apiClient.post(`/api/admin/ai-model-tools/${id}/reset`),
  
  // 批量重置AI模特工具配置
  batchReset: (ids) => apiClient.post('/api/admin/ai-model-tools/batch-reset', { ids }),
  
  // 获取AI模特工具统计数据
  getAIModelToolsStats: () => apiClient.get('/api/admin/ai-model-tools/stats'),
  
  // 获取AI模特工具使用历史
  getAIModelToolHistory: (id, params) => apiClient.get(`/api/admin/ai-model-tools/${id}/history`, { params }),
  
  // 测试AI模特工具配置
  testAIModelTool: (id, data) => apiClient.post(`/api/admin/ai-model-tools/${id}/test`, data)
};

// 导出所有API
export default {
  authAPI,
  dashboardAPI,
  usersAPI,
  toolsAPI,
  subscriptionsAPI,
  creditsAPI,
  systemAPI,
  fileAPI,
  apiManagementAPI,
  aiModelToolsAPI
};

// 为了兼容现有代码，也导出单独的API
export const creditAPI = creditsAPI;
export const subscriptionAPI = subscriptionsAPI;