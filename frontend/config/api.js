// API配置文件
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    WECHAT_LOGIN: `${API_BASE_URL}/api/auth/wechat-login`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    CURRENT_USER: `${API_BASE_URL}/api/auth/me`,
  },
  
  // 用户相关
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/user/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/user/change-password`,
  },
  
  // 订阅相关
  SUBSCRIPTION: {
    PLANS: `${API_BASE_URL}/api/subscription/plans`,
    SUBSCRIBE: `${API_BASE_URL}/api/subscription/subscribe`,
    CURRENT: `${API_BASE_URL}/api/subscription/current`,
    CANCEL: `${API_BASE_URL}/api/subscription/cancel`,
  },
  
  // 工具相关
  TOOLS: {
    LIST: `${API_BASE_URL}/api/tools`,
    GENERATE: `${API_BASE_URL}/api/tools/generate`,
    HISTORY: `${API_BASE_URL}/api/tools/history`,
  },
  
  // 推广相关
  REFERRAL: {
    INFO: `${API_BASE_URL}/api/referral/info`,
    STATS: `${API_BASE_URL}/api/referral/stats`,
    WITHDRAW: `${API_BASE_URL}/api/referral/withdraw`,
  },
  
  // 积分相关
  CREDITS: {
    BALANCE: `${API_BASE_URL}/api/credits/balance`,
    HISTORY: `${API_BASE_URL}/api/credits/history`,
    PURCHASE: `${API_BASE_URL}/api/credits/purchase`,
  }
};

export default API_BASE_URL;