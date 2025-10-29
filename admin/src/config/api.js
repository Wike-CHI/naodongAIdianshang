// API Configuration for Naodong AI Admin System
// Updated to use real backend endpoints

// API配置文件
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 创建API URL的辅助函数
export const createApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  LOGIN: '/api/admin/auth/login',
  LOGOUT: '/api/admin/auth/logout',
  REFRESH_TOKEN: '/api/admin/auth/refresh',
  VERIFY_TOKEN: '/api/admin/auth/verify',
  
  // 仪表板相关
  DASHBOARD_STATS: '/api/admin/dashboard/stats',
  DASHBOARD_CHARTS: '/api/admin/dashboard/charts',
  RECENT_ACTIVITIES: '/api/admin/dashboard/activities',
  
  // 用户管理相关
  USERS: '/api/admin/users',
  USER_BY_ID: (id) => `/api/admin/users/${id}`,
  USER_CREDITS: (id) => `/api/admin/users/${id}/credits`,
  USER_SUBSCRIPTION: (id) => `/api/admin/users/${id}/subscription`,
  USER_GENERATIONS: (id) => `/api/admin/users/${id}/generations`,
  USER_ADJUST_CREDITS: (id) => `/api/admin/users/${id}/adjust-credits`,
  BATCH_USER_UPDATE: '/api/admin/users/batch',
  
  // AI工具管理相关
  AI_TOOLS: '/api/admin/ai-tools',
  AI_TOOL_BY_ID: (id) => `/api/admin/ai-tools/${id}`,
  AI_TOOL_TOGGLE: (id) => `/api/admin/ai-tools/${id}/toggle`,
  AI_TOOL_TYPES: '/api/admin/ai-tools/types',
  AI_TOOL_CATEGORIES: '/api/admin/ai-tools/categories',
  AI_TOOL_STATS: '/api/admin/ai-tools/stats',
  AI_TOOL_TEST: (id) => `/api/admin/ai-tools/${id}/test`,
  AI_TOOL_BATCH: '/api/admin/ai-tools/batch',
  AI_TOOL_BATCH_STATUS: '/api/admin/ai-tools/batch-status',
  AI_TOOL_RESET: (id) => `/api/admin/ai-tools/${id}/reset`,
  AI_TOOL_BATCH_RESET: '/api/admin/ai-tools/batch-reset',
  AI_TOOL_HISTORY: (id) => `/api/admin/ai-tools/${id}/history`,
  
  // 订阅管理相关
  SUBSCRIPTION_PLANS: '/api/subscriptions/plans',
  SUBSCRIPTION_PLAN_BY_ID: (id) => `/api/subscriptions/plans/${id}`,
  USER_SUBSCRIPTIONS: '/api/subscriptions',
  SUBSCRIPTION_STATS: '/api/subscriptions/meta/stats',
  SUBSCRIPTION_CANCEL: (id) => `/api/subscriptions/${id}/cancel`,
  SUBSCRIPTION_RENEW: (id) => `/api/subscriptions/${id}/renew`,
  SUBSCRIPTION_EXPIRING: '/api/subscriptions/meta/expiring',
  SUBSCRIPTION_BATCH: '/api/subscriptions/batch',
  
  // 积分管理相关
  CREDIT_LOGS: '/api/credits',
  CREDIT_ADJUST: '/api/credits/adjust',
  CREDIT_STATS: '/api/credits/stats',
  CREDIT_BATCH_ADJUST: '/api/credits/batch-adjust',
  CREDIT_TYPE_STATS: '/api/credits/type-stats',
  CREDIT_LEADERBOARD: '/api/credits/leaderboard',
  CREDIT_EXPORT: '/api/credits/export',
  CREDIT_RULES: '/api/credits/rules',
  CREDIT_TRANSACTIONS: '/api/credits/transactions',
  CREDIT_CHART_DATA: '/api/credits/chart-data',
  
  // 文件上传相关
  UPLOAD_IMAGE: '/api/files/upload/image',
  UPLOAD_AVATAR: '/api/admin/upload/avatar',
  UPLOAD_FILE: '/api/files/upload',
  
  // 系统管理相关
  HEALTH_CHECK: '/api/admin/health',
  SYSTEM_STATS: '/api/admin/system/stats',
  SYNC_LOGS: '/api/admin/system/sync-logs',
  
  // 推荐系统相关
  REFERRAL_OVERVIEW: '/api/admin/referral/overview',
  REFERRAL_RELATIONSHIPS: '/api/admin/referral/relationships',
  REFERRAL_RELATIONSHIP_BY_ID: (id) => `/api/admin/referral/relationships/${id}`,
  REFERRAL_RELATIONSHIP_STATUS: (id) => `/api/admin/referral/relationships/${id}/status`,
  SYSTEM_CONFIG: '/api/admin/system/config',
  SYSTEM_CONFIG_RESET: '/api/admin/system/config/reset',
  
  // API管理相关
  API_ENDPOINTS: '/api/admin/api/endpoints',
  API_ENDPOINT_BY_ID: (id) => `/api/admin/api/endpoints/${id}`,
  API_KEYS: '/api/admin/api/keys',
  API_KEY_BY_ID: (id) => `/api/admin/api/keys/${id}`
};

// 导出配置
export { API_BASE_URL };