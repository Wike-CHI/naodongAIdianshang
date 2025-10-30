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
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
    RESEND_VERIFICATION: `${API_BASE_URL}/api/auth/resend-verification`
  },
  
  // 用户相关
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/user/profile`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/user/change-password`,
    CREDITS: `${API_BASE_URL}/api/user/credits`,
    GENERATIONS: `${API_BASE_URL}/api/user/generations`,
    SUBSCRIPTION: `${API_BASE_URL}/api/user/subscription`
  },
  
  // 订阅相关
  SUBSCRIPTION: {
    PLANS: `${API_BASE_URL}/api/subscription/plans`,
    SUBSCRIBE: `${API_BASE_URL}/api/subscription/subscribe`,
    CURRENT: `${API_BASE_URL}/api/subscription/current`,
    CANCEL: `${API_BASE_URL}/api/subscription/cancel`,
    RENEW: `${API_BASE_URL}/api/subscription/renew`
  },
  
  // 工具相关
  TOOLS: {
    LIST: `${API_BASE_URL}/api/admin/ai-tools`,
    GENERATE: `${API_BASE_URL}/api/ai/generate`,
    HISTORY: `${API_BASE_URL}/api/ai/history`,
    BATCH_GENERATE: `${API_BASE_URL}/api/ai/batch-generate`
  },
  
  // 推广相关
  REFERRAL: {
    CODE_GENERATE: `${API_BASE_URL}/api/referral/code/generate`,
    CODE_VALIDATE: `${API_BASE_URL}/api/referral/code/validate`,
    RELATIONSHIP: `${API_BASE_URL}/api/referral/relationship`,
    USER_DATA: `${API_BASE_URL}/api/referral/user`,
    STATS: `${API_BASE_URL}/api/referral/stats`,
    LIST: `${API_BASE_URL}/api/referral/list`,
    CREDITS: `${API_BASE_URL}/api/referral/credits`
  },
  
  // 积分相关
  CREDITS: {
    BALANCE: `${API_BASE_URL}/api/credits/balance`,
    HISTORY: `${API_BASE_URL}/api/credits/history`,
    PURCHASE: `${API_BASE_URL}/api/credits/purchase`,
    STATS: `${API_BASE_URL}/api/credits/stats`,
    TYPE_STATS: `${API_BASE_URL}/api/credits/type-stats`,
    LEADERBOARD: `${API_BASE_URL}/api/credits/leaderboard`
  }
};

export default API_BASE_URL;