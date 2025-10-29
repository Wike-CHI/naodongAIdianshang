// 推广系统API服务 - 管理员版（使用现有用户端接口做数据聚合）
import axios from 'axios';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8080/api';
const DEFAULT_REFERRAL_USER_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_REFERRAL_USER_ID) || 'user-1001';
const SYSTEM_CONFIG_STORAGE_KEY = 'admin_system_config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const fetchReferralSnapshots = async (userId = DEFAULT_REFERRAL_USER_ID) => {
  const [statsResp, creditsResp, listResp] = await Promise.all([
    apiClient.get(`/referral/stats/${userId}`),
    apiClient.get(`/referral/credits/${userId}`),
    apiClient.get(`/referral/list/${userId}`)
  ]);

  return {
    stats: statsResp?.data?.data || {},
    creditHistory: Array.isArray(creditsResp?.data?.data) ? creditsResp.data.data : [],
    relationships: Array.isArray(listResp?.data?.data) ? listResp.data.data : []
  };
};

const normalizeRelationship = (detail, referrerMeta) => {
  const createdAt = detail.createdAt || detail.created_at || new Date().toISOString();
  return {
    id: detail.id,
    referral_code: referrerMeta.referralCode,
    referrer_id: referrerMeta.referrerId,
    referrer_name: referrerMeta.referrerName,
    referee_name: detail.referredUsername || detail.refereeName || '未填写',
    status: detail.status || 'pending',
    registration_status: detail.registrationStatus || 'in_progress',
    reward_credits: detail.rewardCredits ?? 0,
    created_at: createdAt,
    first_purchase_at: detail.firstPurchaseAt || null
  };
};

let cachedRelationships = [];

export const adminApi = {
  async getOverview(userId = DEFAULT_REFERRAL_USER_ID) {
    const { stats, creditHistory, relationships } = await fetchReferralSnapshots(userId);

    cachedRelationships = relationships;

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const positiveCredits = creditHistory.filter((record) => (record.amount || 0) > 0);
    const recentPositiveCredits = positiveCredits.filter((record) => {
      const timestamp = new Date(record.createdAt || record.created_at).getTime();
      return Number.isFinite(timestamp) && timestamp >= sevenDaysAgo;
    });

    const recentRelationships = relationships.filter((record) => {
      const timestamp = new Date(record.createdAt || record.created_at).getTime();
      return Number.isFinite(timestamp) && timestamp >= sevenDaysAgo;
    });

    return {
      success: true,
      data: {
        totalUsers: 1,
        totalRelationships: relationships.length,
        conversionRate: stats.conversionRate ?? 0,
        totalPointsIssued: positiveCredits.reduce((sum, record) => sum + (record.amount || 0), 0),
        recentRelationships: recentRelationships.length,
        recentPoints: recentPositiveCredits.reduce((sum, record) => sum + (record.amount || 0), 0)
      }
    };
  },

  async getAllRelationships(page = 1, pageSize = 20, filters = {}) {
    const userId = filters.userId || DEFAULT_REFERRAL_USER_ID;
    const { stats, relationships } = await fetchReferralSnapshots(userId);

    const referrerMeta = {
      referralCode: stats.referralCode || 'N/A',
      referrerId: userId,
      referrerName: filters.referrerName || '脑洞商家'
    };

    cachedRelationships = relationships;

    const mapped = relationships.map((detail) => normalizeRelationship(detail, referrerMeta));
    const start = (page - 1) * pageSize;
    const paginated = mapped.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        total: mapped.length,
        relationships: paginated
      }
    };
  },

  async deleteRelationship(relationshipId) {
    cachedRelationships = cachedRelationships.filter((item) => item.id !== relationshipId);
    return {
      success: true,
      message: '已从本地缓存移除推广关系，后端存储尚未实现'
    };
  },

  async updateRelationshipStatus(relationshipId, status = 'completed') {
    cachedRelationships = cachedRelationships.map((item) =>
      item.id === relationshipId
        ? {
            ...item,
            status,
            registration_status: status === 'completed' ? 'completed' : item.registration_status
          }
        : item
    );

    return {
      success: true,
      data: cachedRelationships.find((item) => item.id === relationshipId)
    };
  }
};

const readSystemConfig = () => {
  try {
    const raw = localStorage.getItem(SYSTEM_CONFIG_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('读取系统配置失败，将使用默认值', error);
    return null;
  }
};

const defaultSystemConfig = {
  autoGenerateCodes: true,
  defaultRewardCredits: 120,
  pendingReviewLimit: 50,
  landingPage: 'https://naodong-ai.example.com/invite',
  notifyAdminOnNewReferral: true
};

const persistSystemConfig = (config) => {
  localStorage.setItem(SYSTEM_CONFIG_STORAGE_KEY, JSON.stringify(config));
};

export const adminSystemConfigApi = {
  async getConfig() {
    const config = readSystemConfig() || defaultSystemConfig;
    return {
      success: true,
      data: config
    };
  },

  async updateConfig(key, value) {
    const config = { ...(readSystemConfig() || defaultSystemConfig), [key]: value };
    persistSystemConfig(config);
    return {
      success: true,
      data: config
    };
  },

  async resetConfig() {
    persistSystemConfig(defaultSystemConfig);
    return {
      success: true,
      data: defaultSystemConfig
    };
  }
};
