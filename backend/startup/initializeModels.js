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

async function dropStaleIndexes() {
  const indexDrops = [
    { model: User, indexName: 'username_1' },
    { model: User, indexName: 'email_1' },
    { model: User, indexName: 'phone_1' },
    { model: AdminUser, indexName: 'username_1' },
    { model: AITool, indexName: 'name_1' }
  ];

  for (const { model, indexName } of indexDrops) {
    try {
      await model.collection.dropIndex(indexName);
      if (typeof logger.log === 'function') {
        logger.log(`[startup] 已移除旧索引 ${model.collection.collectionName}.${indexName}`);
      } else {
        console.log(`[startup] 已移除旧索引 ${model.collection.collectionName}.${indexName}`);
      }
    } catch (error) {
      if (
        error?.codeName === 'IndexNotFound' ||
        error?.code === 27 ||
        error?.codeName === 'NamespaceNotFound' ||
        error?.code === 26
      ) {
        continue;
      }

      if (typeof logger.warn === 'function') {
        logger.warn(`[startup] 删除索引 ${model.collection.collectionName}.${indexName} 失败`, error);
      } else {
        console.warn(`[startup] 删除索引 ${model.collection.collectionName}.${indexName} 失败`, error);
      }
    }
  }
}

async function ensureModelIndexes(model) {
  try {
    await model.init();
  } catch (error) {
    console.error(`模型 ${model.modelName} 初始化错误:`, error.message);
    
    // 如果是索引冲突错误，尝试删除所有索引然后重新初始化
    if (error?.code === 85 || error?.codeName === 'IndexOptionsConflict' || error?.code === 86 || error?.codeName === 'IndexBuildAborted' || error?.code === 276) {
      try {
        console.log(`尝试删除 ${model.modelName} 的所有索引...`);
        await model.collection.dropIndexes();
        console.log(`成功删除 ${model.modelName} 的所有索引，重新初始化...`);
        await model.init();
        console.log(`成功重新初始化 ${model.modelName} 的索引`);
      } catch (reinitError) {
        console.error(`重新初始化 ${model.modelName} 索引失败:`, reinitError.message);
        // 即使重新初始化失败，也不抛出错误，继续执行
        return;
      }
    } else {
      // 对于其他类型的错误，记录但不中断程序执行
      console.warn(`模型 ${model.modelName} 初始化警告:`, error.message);
      return;
    }
  }
}

async function initializeModels() {
  try {
    await dropStaleIndexes();

    for (const model of models) {
      await ensureModelIndexes(model);
    }

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
    // 即使模型初始化失败，也继续启动服务
    if (typeof logger.warn === 'function') {
      logger.warn('⚠️ 模型初始化失败，但服务将继续启动');
    } else {
      console.warn('[startup] 模型初始化失败，但服务将继续启动');
    }
  }
}

module.exports = { initializeModels, dropStaleIndexes, ensureModelIndexes };