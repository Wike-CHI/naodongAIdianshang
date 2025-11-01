import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

// 创建axios实例
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('naodong_user')
    }
    return Promise.reject(error.response?.data || error)
  }
)

const userService = {
  // 获取当前用户信息
  getCurrentUser: async () => {
    try {
      console.log('👤 获取当前用户信息');
      const response = await apiClient.get(API_ENDPOINTS.AUTH.CURRENT_USER);
      console.log('✅ 获取当前用户信息成功:', response);
      return response;
    } catch (error) {
      console.error('❌ 获取当前用户信息失败:', error);
      throw error;
    }
  },

  // 获取用户详情
  getUserById: async (userId) => {
    try {
      console.log('👤 获取用户详情:', userId);
      const response = await apiClient.get(API_ENDPOINTS.USERS.GET_BY_ID(userId));
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
      
      // 映射前端字段到后端字段
      const mappedData = {
        ...userData,
        credits_balance: userData.credits,
        role: userData.membership,
        is_active: userData.status === 'true' || userData.status === true
      };
      
      // 删除前端字段
      delete mappedData.credits;
      delete mappedData.membership;
      delete mappedData.status;
      
      const response = await apiClient.put(API_ENDPOINTS.USERS.UPDATE(userId), mappedData);
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
      
      const response = await apiClient.post(API_ENDPOINTS.USERS.UPLOAD_AVATAR(userId), formData, {
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
      const response = await apiClient.get(API_ENDPOINTS.USERS.CREDITS(userId), { params });
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
      const response = await apiClient.get(API_ENDPOINTS.USERS.GENERATIONS(userId), { params });
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
      const response = await apiClient.get(API_ENDPOINTS.USERS.SUBSCRIPTION(userId));
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