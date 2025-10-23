// 推广系统Mock API服务
import { message } from 'antd';

// 本地存储键名
const STORAGE_KEYS = {
  REFERRAL_CODES: 'referral_codes',
  REFERRAL_RELATIONSHIPS: 'referral_relationships', 
  POINTS_RECORDS: 'points_records',
  SYSTEM_CONFIG: 'system_config',
  AUDIT_LOGS: 'audit_logs'
};

// 系统默认配置
const DEFAULT_CONFIG = {
  referral_points_rate: 0.1, // 推广积分比例（充值金额的10%）
  min_purchase_amount: 10,   // 最小充值金额（元）
  referral_code_length: 10,  // 推广码长度
  max_referral_levels: 3     // 最大推广层级
};

// 工具函数：生成UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 工具函数：生成推广码
const generateReferralCode = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 工具函数：获取本地存储数据
const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
};

// 工具函数：设置本地存储数据
const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
    return false;
  }
};

// 工具函数：获取系统配置
const getSystemConfig = () => {
  const config = getStorageData(STORAGE_KEYS.SYSTEM_CONFIG);
  if (config.length === 0) {
    // 初始化默认配置
    const defaultConfigArray = Object.entries(DEFAULT_CONFIG).map(([key, value]) => ({
      id: generateUUID(),
      config_key: key,
      config_value: value.toString(),
      description: '',
      updated_at: new Date().toISOString()
    }));
    setStorageData(STORAGE_KEYS.SYSTEM_CONFIG, defaultConfigArray);
    return DEFAULT_CONFIG;
  }
  
  const configObj = {};
  config.forEach(item => {
    configObj[item.config_key] = parseFloat(item.config_value) || item.config_value;
  });
  return configObj;
};

// 工具函数：记录审计日志
const logAudit = (userId, action, details, ipAddress = '127.0.0.1') => {
  const logs = getStorageData(STORAGE_KEYS.AUDIT_LOGS);
  const newLog = {
    id: generateUUID(),
    user_id: userId,
    action,
    details: JSON.stringify(details),
    ip_address: ipAddress,
    user_agent: navigator.userAgent,
    created_at: new Date().toISOString()
  };
  logs.push(newLog);
  setStorageData(STORAGE_KEYS.AUDIT_LOGS, logs);
};

// 推广码相关API
export const referralCodeApi = {
  // 生成推广码
  generateCode: async (userId) => {
    try {
      const codes = getStorageData(STORAGE_KEYS.REFERRAL_CODES);
      const config = getSystemConfig();
      
      // 检查用户是否已有推广码
      const existingCode = codes.find(code => code.user_id === userId && code.is_active);
      if (existingCode) {
        return {
          success: true,
          data: {
            code: existingCode.code,
            status: true
          }
        };
      }
      
      // 生成新的推广码
      let newCode;
      let attempts = 0;
      do {
        newCode = generateReferralCode(config.referral_code_length);
        attempts++;
      } while (codes.some(code => code.code === newCode) && attempts < 10);
      
      if (attempts >= 10) {
        throw new Error('无法生成唯一推广码');
      }
      
      const codeRecord = {
        id: generateUUID(),
        user_id: userId,
        code: newCode,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      codes.push(codeRecord);
      setStorageData(STORAGE_KEYS.REFERRAL_CODES, codes);
      
      // 记录审计日志
      logAudit(userId, 'generate_referral_code', { code: newCode });
      
      return {
        success: true,
        data: {
          code: newCode,
          status: true
        }
      };
    } catch (error) {
      console.error('生成推广码失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 验证推广码
  validateCode: async (code) => {
    try {
      const codes = getStorageData(STORAGE_KEYS.REFERRAL_CODES);
      const codeRecord = codes.find(c => c.code === code && c.is_active);
      
      if (!codeRecord) {
        return {
          success: true,
          data: {
            valid: false,
            referrer: null
          }
        };
      }
      
      // 获取推广者信息（这里简化处理，实际应该从用户表获取）
      const referrer = {
        id: codeRecord.user_id,
        name: `用户${codeRecord.user_id.slice(-4)}`,
        avatar: null
      };
      
      return {
        success: true,
        data: {
          valid: true,
          referrer
        }
      };
    } catch (error) {
      console.error('验证推广码失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 推广关系相关API
export const referralRelationshipApi = {
  // 建立推广关系
  createRelationship: async (refereeId, referralCode) => {
    try {
      const codes = getStorageData(STORAGE_KEYS.REFERRAL_CODES);
      const relationships = getStorageData(STORAGE_KEYS.REFERRAL_RELATIONSHIPS);
      
      // 验证推广码
      const codeRecord = codes.find(c => c.code === referralCode && c.is_active);
      if (!codeRecord) {
        throw new Error('无效的推广码');
      }
      
      const referrerId = codeRecord.user_id;
      
      // 检查是否自己推广自己
      if (referrerId === refereeId) {
        throw new Error('不能使用自己的推广码');
      }
      
      // 检查是否已存在推广关系
      const existingRelation = relationships.find(r => 
        r.referrer_id === referrerId && r.referee_id === refereeId
      );
      if (existingRelation) {
        throw new Error('推广关系已存在');
      }
      
      // 创建推广关系
      const relationship = {
        id: generateUUID(),
        referrer_id: referrerId,
        referee_id: refereeId,
        referral_code: referralCode,
        status: 'active',
        first_purchase_at: null,
        created_at: new Date().toISOString()
      };
      
      relationships.push(relationship);
      setStorageData(STORAGE_KEYS.REFERRAL_RELATIONSHIPS, relationships);
      
      // 记录审计日志
      logAudit(refereeId, 'create_referral_relationship', {
        referrer_id: referrerId,
        referral_code: referralCode
      });
      
      return {
        success: true,
        data: relationship
      };
    } catch (error) {
      console.error('建立推广关系失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取推广统计
  getStats: async (userId) => {
    try {
      const relationships = getStorageData(STORAGE_KEYS.REFERRAL_RELATIONSHIPS);
      const pointsRecords = getStorageData(STORAGE_KEYS.POINTS_RECORDS);
      
      // 获取用户的推广关系
      const userRelationships = relationships.filter(r => r.referrer_id === userId);
      
      // 计算总推广人数
      const totalReferrals = userRelationships.length;
      
      // 计算总推广收益
      const userPointsRecords = pointsRecords.filter(p => 
        p.user_id === userId && p.type === 'referral_bonus'
      );
      const totalEarnings = userPointsRecords.reduce((sum, record) => sum + record.points, 0);
      
      // 获取最近推广记录
      const recentReferrals = userRelationships
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          referee_id: r.referee_id,
          referee_name: `用户${r.referee_id.slice(-4)}`,
          created_at: r.created_at,
          status: r.status,
          first_purchase_at: r.first_purchase_at
        }));
      
      return {
        success: true,
        data: {
          totalReferrals,
          totalEarnings,
          recentReferrals
        }
      };
    } catch (error) {
      console.error('获取推广统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 积分系统相关API
export const pointsApi = {
  // 计算推广积分
  calculateReferral: async (refereeId, amount) => {
    try {
      const relationships = getStorageData(STORAGE_KEYS.REFERRAL_RELATIONSHIPS);
      const pointsRecords = getStorageData(STORAGE_KEYS.POINTS_RECORDS);
      const config = getSystemConfig();
      
      // 检查最小充值金额
      if (amount < config.min_purchase_amount) {
        throw new Error(`充值金额不能少于${config.min_purchase_amount}元`);
      }
      
      // 查找推广关系
      const relationship = relationships.find(r => r.referee_id === refereeId);
      if (!relationship) {
        return {
          success: true,
          data: { points: 0, message: '无推广关系' }
        };
      }
      
      // 检查是否已经是首次充值奖励
      const existingRecord = pointsRecords.find(p => 
        p.relationship_id === relationship.id && p.type === 'referral_bonus'
      );
      if (existingRecord) {
        return {
          success: true,
          data: { points: 0, message: '已获得过推广奖励' }
        };
      }
      
      // 计算推广积分
      const points = Math.floor(amount * config.referral_points_rate);
      
      // 创建积分记录
      const pointsRecord = {
        id: generateUUID(),
        user_id: relationship.referrer_id,
        relationship_id: relationship.id,
        points: points,
        amount: amount,
        type: 'referral_bonus',
        description: `推广用户${refereeId.slice(-4)}首次充值奖励`,
        created_at: new Date().toISOString()
      };
      
      pointsRecords.push(pointsRecord);
      setStorageData(STORAGE_KEYS.POINTS_RECORDS, pointsRecords);
      
      // 更新推广关系的首次购买时间
      relationship.first_purchase_at = new Date().toISOString();
      relationship.status = 'completed';
      setStorageData(STORAGE_KEYS.REFERRAL_RELATIONSHIPS, relationships);
      
      // 记录审计日志
      logAudit(relationship.referrer_id, 'earn_referral_points', {
        points,
        amount,
        referee_id: refereeId
      });
      
      return {
        success: true,
        data: {
          points,
          message: '推广积分已发放'
        }
      };
    } catch (error) {
      console.error('计算推广积分失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取积分记录
  getHistory: async (userId, page = 1, pageSize = 10) => {
    try {
      const pointsRecords = getStorageData(STORAGE_KEYS.POINTS_RECORDS);
      
      // 获取用户的积分记录
      const userRecords = pointsRecords
        .filter(p => p.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // 分页处理
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRecords = userRecords.slice(startIndex, endIndex);
      
      // 计算总积分
      const totalPoints = userRecords.reduce((sum, record) => sum + record.points, 0);
      
      return {
        success: true,
        data: {
          records: paginatedRecords,
          totalPoints,
          total: userRecords.length,
          page,
          pageSize
        }
      };
    } catch (error) {
      console.error('获取积分记录失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 系统配置相关API
export const systemConfigApi = {
  // 获取配置
  getConfig: async () => {
    try {
      const config = getSystemConfig();
      return {
        success: true,
        data: config
      };
    } catch (error) {
      console.error('获取系统配置失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 更新配置
  updateConfig: async (configKey, configValue) => {
    try {
      const configs = getStorageData(STORAGE_KEYS.SYSTEM_CONFIG);
      const configIndex = configs.findIndex(c => c.config_key === configKey);
      
      if (configIndex >= 0) {
        configs[configIndex].config_value = configValue.toString();
        configs[configIndex].updated_at = new Date().toISOString();
      } else {
        configs.push({
          id: generateUUID(),
          config_key: configKey,
          config_value: configValue.toString(),
          description: '',
          updated_at: new Date().toISOString()
        });
      }
      
      setStorageData(STORAGE_KEYS.SYSTEM_CONFIG, configs);
      
      // 记录审计日志
      logAudit('admin', 'update_system_config', {
        config_key: configKey,
        config_value: configValue
      });
      
      return {
        success: true,
        data: { message: '配置更新成功' }
      };
    } catch (error) {
      console.error('更新系统配置失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 管理员相关API
export const adminApi = {
  // 获取推广系统概览数据
  getOverview: () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const relationships = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS) || '[]');
    const creditHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDIT_HISTORY) || '[]');
    
    const totalUsers = users.length;
    const totalRelationships = relationships.length;
    const completedRelationships = relationships.filter(rel => rel.status === 'completed').length;
    const conversionRate = totalRelationships > 0 ? (completedRelationships / totalRelationships * 100).toFixed(1) : 0;
    
    // 计算总积分发放
    const totalPointsIssued = creditHistory
      .filter(record => record.type === 'referral_reward')
      .reduce((sum, record) => sum + record.amount, 0);
    
    // 最近7天数据
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRelationships = relationships.filter(rel => 
      new Date(rel.created_at) >= sevenDaysAgo
    ).length;
    
    const recentPoints = creditHistory
      .filter(record => 
        record.type === 'referral_reward' && 
        new Date(record.created_at) >= sevenDaysAgo
      )
      .reduce((sum, record) => sum + record.amount, 0);
    
    return {
      success: true,
      data: {
        totalUsers,
        totalRelationships,
        conversionRate: parseFloat(conversionRate),
        totalPointsIssued,
        recentRelationships,
        recentPoints
      }
    };
  },

  // 获取所有推广关系
  getAllRelationships: (page = 1, pageSize = 20, filters = {}) => {
    try {
      let relationships = JSON.parse(localStorage.getItem(STORAGE_KEYS.REFERRAL_RELATIONSHIPS) || '[]');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // 确保relationships是数组
      if (!Array.isArray(relationships)) {
        relationships = [];
      }
      
      // 添加用户名信息
      relationships = relationships.map(rel => {
        const referrer = users.find(u => u.id === rel.referrer_id);
        const referee = users.find(u => u.id === rel.referred_id);
        return {
          ...rel,
          referrer_name: referrer ? referrer.username : '未知用户',
          referee_name: referee ? referee.username : '未知用户'
        };
      });
      
      // 应用过滤器
      if (filters.dateRange && filters.dateRange.length === 2) {
        const [startDate, endDate] = filters.dateRange;
        relationships = relationships.filter(rel => {
          const relDate = new Date(rel.created_at);
          return relDate >= startDate && relDate <= endDate;
        });
      }
      
      if (filters.status && filters.status !== 'all') {
        relationships = relationships.filter(rel => rel.status === filters.status);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        relationships = relationships.filter(rel => 
          rel.referrer_name.toLowerCase().includes(searchLower) ||
          rel.referee_name.toLowerCase().includes(searchLower) ||
          rel.referral_code.toLowerCase().includes(searchLower)
        );
      }
      
      // 排序（最新的在前）
      relationships.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // 分页
      const total = relationships.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRelationships = relationships.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          relationships: paginatedRelationships,
          total,
          page,
          pageSize
        }
      };
    } catch (error) {
      console.error('获取推广关系失败:', error);
      return {
        success: false,
        error: '获取推广关系失败',
        data: {
          relationships: [],
          total: 0,
          page,
          pageSize
        }
      };
    }
  },

  // 删除推广关系
  deleteRelationship: (relationshipId) => {
    try {
      const relationships = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS) || '[]');
      const updatedRelationships = relationships.filter(rel => rel.id !== relationshipId);
      localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify(updatedRelationships));
      
      return {
        success: true,
        message: '推广关系删除成功'
      };
    } catch (error) {
      console.error('删除推广关系失败:', error);
      return {
        success: false,
        error: '删除推广关系失败'
      };
    }
  },

  // 更新推广关系状态
  updateRelationshipStatus: (relationshipId, status) => {
    try {
      const relationships = JSON.parse(localStorage.getItem(STORAGE_KEYS.RELATIONSHIPS) || '[]');
      const relationshipIndex = relationships.findIndex(rel => rel.id === relationshipId);
      
      if (relationshipIndex === -1) {
        return {
          success: false,
          error: '推广关系不存在'
        };
      }
      
      relationships[relationshipIndex].status = status;
      relationships[relationshipIndex].updated_at = new Date().toISOString();
      
      localStorage.setItem(STORAGE_KEYS.RELATIONSHIPS, JSON.stringify(relationships));
      
      return {
        success: true,
        message: '推广关系状态更新成功'
      };
    } catch (error) {
      console.error('更新推广关系状态失败:', error);
      return {
        success: false,
        error: '更新推广关系状态失败'
      };
    }
  }
};

// 系统配置API（管理员版本）
export const adminSystemConfigApi = {
  // 获取系统配置
  getConfig: () => {
    try {
      const config = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG) || '{}');
      return {
        success: true,
        data: { ...DEFAULT_CONFIG, ...config }
      };
    } catch (error) {
      console.error('获取系统配置失败:', error);
      return {
        success: false,
        error: '获取系统配置失败'
      };
    }
  },

  // 更新系统配置
  updateConfig: (key, value) => {
    try {
      const config = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG) || '{}');
      config[key] = value;
      config.updated_at = new Date().toISOString();
      
      localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(config));
      
      return {
        success: true,
        message: '系统配置更新成功'
      };
    } catch (error) {
      console.error('更新系统配置失败:', error);
      return {
        success: false,
        error: '更新系统配置失败'
      };
    }
  },

  // 重置系统配置
  resetConfig: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return {
        success: true,
        message: '系统配置重置成功'
      };
    } catch (error) {
      console.error('重置系统配置失败:', error);
      return {
        success: false,
        error: '重置系统配置失败'
      };
    }
  }
};

// 推广统计和管理API
export const referralApi = {
  // 获取用户推广数据
  getUserReferralData: async (userId) => {
    try {
      const codes = getStorageData(STORAGE_KEYS.REFERRAL_CODES);
      const userCode = codes.find(code => code.user_id === userId && code.is_active);
      
      if (!userCode) {
        // 如果用户没有推广码，自动生成一个
        const result = await referralCodeApi.generateCode(userId);
        if (result.success) {
          return {
            success: true,
            data: {
              referralCode: result.data.code,
              isActive: true
            }
          };
        }
        throw new Error('无法生成推广码');
      }
      
      return {
        success: true,
        data: {
          referralCode: userCode.code,
          isActive: userCode.is_active
        }
      };
    } catch (error) {
      console.error('获取用户推广数据失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取推广统计数据
  getReferralStats: async (userId, options = {}) => {
    try {
      const relationships = getStorageData(STORAGE_KEYS.REFERRAL_RELATIONSHIPS);
      const pointsRecords = getStorageData(STORAGE_KEYS.POINTS_RECORDS);
      
      // 筛选该用户的推广关系
      let userReferrals = relationships.filter(rel => rel.referrer_id === userId);
      
      // 应用日期筛选
      if (options.dateRange && options.dateRange.length === 2) {
        const [startDate, endDate] = options.dateRange;
        userReferrals = userReferrals.filter(rel => {
          const relDate = new Date(rel.created_at);
          return relDate >= startDate && relDate <= endDate;
        });
      }
      
      // 应用状态筛选
      if (options.status && options.status !== 'all') {
        userReferrals = userReferrals.filter(rel => rel.status === options.status);
      }
      
      // 计算统计数据
      const totalReferrals = userReferrals.length;
      const successfulReferrals = userReferrals.filter(rel => rel.status === 'completed').length;
      const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals * 100) : 0;
      
      // 计算总收益
      const userPointsRecords = pointsRecords.filter(record => 
        record.user_id === userId && record.type === 'referral_reward'
      );
      const totalEarnings = userPointsRecords.reduce((sum, record) => sum + record.amount, 0);
      
      // 生成推广明细
      const referralDetails = userReferrals.map(rel => ({
        id: rel.id,
        createdAt: rel.created_at,
        referredUsername: `用户${rel.referred_id.slice(-4)}`,
        rewardCredits: 20, // 固定奖励20积分
        status: rel.status
      }));
      
      return {
        success: true,
        data: {
          totalReferrals,
          successfulReferrals,
          conversionRate,
          totalEarnings,
          referralDetails
        }
      };
    } catch (error) {
      console.error('获取推广统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取推广列表
  getReferralList: async (userId, options = {}) => {
    try {
      const relationships = getStorageData(STORAGE_KEYS.REFERRAL_RELATIONSHIPS);
      
      // 筛选该用户的推广关系
      let userReferrals = relationships.filter(rel => rel.referrer_id === userId);
      
      // 应用日期筛选
      if (options.dateRange && options.dateRange.length === 2) {
        const [startDate, endDate] = options.dateRange;
        userReferrals = userReferrals.filter(rel => {
          const relDate = new Date(rel.created_at);
          return relDate >= startDate && relDate <= endDate;
        });
      }
      
      // 应用状态筛选
      if (options.status && options.status !== 'all') {
        userReferrals = userReferrals.filter(rel => rel.status === options.status);
      }
      
      // 转换为前端需要的格式
      const referralList = userReferrals.map(rel => ({
        id: rel.id,
        createdAt: rel.created_at,
        referredUser: {
          id: rel.referred_id,
          username: `用户${rel.referred_id.slice(-4)}`,
          membershipType: 'normal' // 简化处理
        },
        registrationStatus: rel.status === 'completed' ? 'completed' : 'pending',
        rewardCredits: 20,
        status: rel.status
      }));
      
      return {
        success: true,
        data: referralList
      };
    } catch (error) {
      console.error('获取推广列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 获取积分历史
  getCreditHistory: async (userId) => {
    try {
      const pointsRecords = getStorageData(STORAGE_KEYS.POINTS_RECORDS);
      const userRecords = pointsRecords.filter(record => record.user_id === userId);
      
      // 按时间倒序排列
      userRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return {
        success: true,
        data: userRecords
      };
    } catch (error) {
      console.error('获取积分历史失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 导出所有API
export default {
  referralCodeApi,
  referralRelationshipApi,
  pointsApi,
  systemConfigApi,
  adminApi,
  adminSystemConfigApi
};