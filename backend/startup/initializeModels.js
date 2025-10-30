const logger = require('../utils/logger');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const CreditRecord = require('../models/CreditRecord');
const AITool = require('../models/AiTool');
const AIGeneration = require('../models/AIGeneration');
const AdminUser = require('../models/AdminUser');

const models = [
  User,
  SubscriptionPlan,
  Subscription,
  CreditRecord,
  AITool,
  AIGeneration,
  AdminUser
];

async function initializeModels() {
  try {
    await Promise.all(models.map((model) => model.init()))
      .catch(async (error) => {
        if (error?.codeName === 'IndexOptionsConflict') {
          // 当索引存在但选项不同的时候，逐个初始化可以避免批量失败
          for (const model of models) {
            try {
              await model.init();
            } catch (innerError) {
              if (innerError?.codeName !== 'IndexOptionsConflict') {
                throw innerError;
              }
            }
          }
        } else {
          throw error;
        }
      });

    if (typeof logger.log === 'function') {
      logger.log('✅ Mongoose 模型初始化完成');
    } else {
      console.log('[startup] Mongoose 模型初始化完成');
    }
  } catch (error) {
    if (typeof logger.error === 'function') {
      logger.error('❌ 初始化模型失败:', error);
    } else {
      console.error('[startup] 初始化模型失败:', error);
    }
    throw error;
  }
}

module.exports = initializeModels;
