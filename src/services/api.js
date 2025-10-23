// 真实API服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API请求工具函数
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// 文件上传请求
const uploadRequest = async (endpoint, formData) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const config = {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '上传失败');
    }
    
    return data;
  } catch (error) {
    console.error('文件上传错误:', error);
    throw error;
  }
};

// 认证相关API
export const authApi = {
  // 用户登录
  login: async (loginData) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // 用户注册
  register: async (registerData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // 管理员登录
  adminLogin: async (loginData) => {
    const response = await apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
    }
    
    return response;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  // 获取当前管理员信息
  getCurrentAdmin: async () => {
    return await apiRequest('/auth/admin/me');
  },

  // 修改密码
  changePassword: async (passwordData) => {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  // 登出
  logout: async () => {
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
    });
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    
    return response;
  },
};

// AI工具相关API
export const aiToolsApi = {
  // 获取所有AI工具
  getTools: async () => {
    return await apiRequest('/ai-tools');
  },

  // 获取活跃工具
  getActiveTools: async () => {
    return await apiRequest('/ai-tools/active');
  },

  // 获取工具分类
  getCategories: async () => {
    return await apiRequest('/ai-tools/categories');
  },

  // 获取单个工具详情
  getToolById: async (toolId) => {
    return await apiRequest(`/ai-tools/${toolId}`);
  },

  // 获取工具配置
  getToolConfig: async (toolId) => {
    return await apiRequest(`/ai-tools/${toolId}/config`);
  },

  // 获取用户生成记录
  getUserGenerations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/ai-tools/generations${queryString ? `?${queryString}` : ''}`);
  },

  // 获取生成记录详情
  getGenerationById: async (generationId) => {
    return await apiRequest(`/ai-tools/generations/${generationId}`);
  },

  // 管理员API
  admin: {
    // 创建AI工具
    createTool: async (toolData) => {
      return await apiRequest('/ai-tools', {
        method: 'POST',
        body: JSON.stringify(toolData),
      });
    },

    // 更新AI工具
    updateTool: async (toolId, toolData) => {
      return await apiRequest(`/ai-tools/${toolId}`, {
        method: 'PUT',
        body: JSON.stringify(toolData),
      });
    },

    // 删除AI工具
    deleteTool: async (toolId) => {
      return await apiRequest(`/ai-tools/${toolId}`, {
        method: 'DELETE',
      });
    },

    // 更新工具配置
    updateToolConfig: async (toolId, configData) => {
      return await apiRequest(`/ai-tools/${toolId}/config`, {
        method: 'PUT',
        body: JSON.stringify(configData),
      });
    },
  },
};

// 用户管理相关API
export const usersApi = {
  // 获取用户资料
  getProfile: async () => {
    return await apiRequest('/users/profile');
  },

  // 更新用户资料
  updateProfile: async (profileData) => {
    return await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // 管理员API
  admin: {
    // 获取用户列表
    getUsers: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await apiRequest(`/users${queryString ? `?${queryString}` : ''}`);
    },

    // 获取用户统计
    getUserStats: async () => {
      return await apiRequest('/users/stats');
    },

    // 获取用户详情
    getUserById: async (userId) => {
      return await apiRequest(`/users/${userId}`);
    },

    // 更新用户信息
    updateUser: async (userId, userData) => {
      return await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },

    // 删除用户
    deleteUser: async (userId) => {
      return await apiRequest(`/users/${userId}`, {
        method: 'DELETE',
      });
    },

    // 重置用户密码
    resetUserPassword: async (userId, passwordData) => {
      return await apiRequest(`/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
    },
  },
};

// 积分系统相关API
export const creditsApi = {
  // 获取用户积分信息
  getCredits: async () => {
    return await apiRequest('/credits');
  },

  // 获取积分充值套餐
  getPackages: async () => {
    return await apiRequest('/credits/packages');
  },

  // 创建积分充值订单
  createOrder: async (packageId) => {
    return await apiRequest('/credits/orders', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    });
  },

  // 获取用户订单历史
  getOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/credits/orders${queryString ? `?${queryString}` : ''}`);
  },

  // 消费积分
  consumeCredits: async (amount, description) => {
    return await apiRequest('/credits/consume', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  },

  // 管理员API
  admin: {
    // 获取所有积分套餐
    getAllPackages: async () => {
      return await apiRequest('/credits/admin/packages');
    },

    // 创建积分套餐
    createPackage: async (packageData) => {
      return await apiRequest('/credits/admin/packages', {
        method: 'POST',
        body: JSON.stringify(packageData),
      });
    },

    // 更新积分套餐
    updatePackage: async (packageId, packageData) => {
      return await apiRequest(`/credits/admin/packages/${packageId}`, {
        method: 'PUT',
        body: JSON.stringify(packageData),
      });
    },

    // 删除积分套餐
    deletePackage: async (packageId) => {
      return await apiRequest(`/credits/admin/packages/${packageId}`, {
        method: 'DELETE',
      });
    },

    // 获取积分统计
    getStats: async () => {
      return await apiRequest('/credits/admin/stats');
    },
  },
};

// 订阅系统相关API
export const subscriptionsApi = {
  // 获取订阅套餐
  getPlans: async () => {
    return await apiRequest('/subscriptions/plans');
  },

  // 获取用户当前订阅
  getCurrentSubscription: async () => {
    return await apiRequest('/subscriptions/current');
  },

  // 创建订阅
  createSubscription: async (planId) => {
    return await apiRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  },

  // 取消订阅
  cancelSubscription: async (subscriptionId) => {
    return await apiRequest(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
    });
  },

  // 续订订阅
  renewSubscription: async (subscriptionId) => {
    return await apiRequest(`/subscriptions/${subscriptionId}/renew`, {
      method: 'POST',
    });
  },

  // 获取订阅历史
  getSubscriptionHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/subscriptions/history${queryString ? `?${queryString}` : ''}`);
  },

  // 管理员API
  admin: {
    // 获取所有订阅套餐
    getAllPlans: async () => {
      return await apiRequest('/subscriptions/admin/plans');
    },

    // 创建订阅套餐
    createPlan: async (planData) => {
      return await apiRequest('/subscriptions/admin/plans', {
        method: 'POST',
        body: JSON.stringify(planData),
      });
    },

    // 更新订阅套餐
    updatePlan: async (planId, planData) => {
      return await apiRequest(`/subscriptions/admin/plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(planData),
      });
    },

    // 删除订阅套餐
    deletePlan: async (planId) => {
      return await apiRequest(`/subscriptions/admin/plans/${planId}`, {
        method: 'DELETE',
      });
    },

    // 获取订阅统计
    getStats: async () => {
      return await apiRequest('/subscriptions/admin/stats');
    },

    // 获取所有订阅记录
    getAllSubscriptions: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return await apiRequest(`/subscriptions/admin/subscriptions${queryString ? `?${queryString}` : ''}`);
    },
  },
};

// 文件上传相关API
export const uploadApi = {
  // 单文件上传
  uploadSingle: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await uploadRequest('/upload/single', formData);
  },

  // 多文件上传
  uploadMultiple: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return await uploadRequest('/upload/multiple', formData);
  },

  // 删除文件
  deleteFile: async (fileName, subDir = 'images') => {
    return await apiRequest('/upload/file', {
      method: 'DELETE',
      body: JSON.stringify({ fileName, subDir }),
    });
  },

  // 获取文件信息
  getFileInfo: async (fileName, subDir = 'images') => {
    return await apiRequest(`/upload/info/${subDir}/${fileName}`);
  },

  // 管理员API
  admin: {
    // 获取上传统计
    getStats: async () => {
      return await apiRequest('/upload/stats');
    },

    // 清理临时文件
    cleanupTempFiles: async () => {
      return await apiRequest('/upload/cleanup', {
        method: 'POST',
      });
    },
  },
};

// 导出默认API对象（兼容原有代码）
export const api = {
  // 用户认证
  login: authApi.login,
  register: authApi.register,
  getUserInfo: authApi.getCurrentUser,
  updateUserInfo: usersApi.updateProfile,

  // AI工具
  getTools: aiToolsApi.getTools,
  generateImage: async (toolId, params) => {
    // 这里需要根据实际的AI工具生成接口来实现
    // 暂时返回模拟数据
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        toolId,
        resultImage: `https://picsum.photos/400/600?random=${Date.now()}`,
        createdAt: new Date().toISOString()
      }
    };
  },

  // 订阅
  getSubscriptionPlans: subscriptionsApi.getPlans,
};

// 导出所有API模块
export {
  authApi,
  aiToolsApi,
  usersApi,
  creditsApi,
  subscriptionsApi,
};

export default api;