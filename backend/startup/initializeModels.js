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

function extractIndexNameFromError(error) {
  const possibleMessages = [
    error?.errorResponse?.errmsg,
    error?.errmsg,
    error?.message
  ].filter(Boolean);

  for (const message of possibleMessages) {
    const match = message.match(/name: "([^\"]+)"/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

async function ensureModelIndexes(model) {
  try {
    await model.init();
  } catch (error) {
    if (error?.code === 86 || error?.codeName === 'IndexOptionsConflict') {
      const conflictingIndexName = extractIndexNameFromError(error);

      if (conflictingIndexName) {
        try {
          await model.collection.dropIndex(conflictingIndexName);
          if (typeof logger.warn === 'function') {
            logger.warn(`[startup] 重新创建索引 ${model.collection.collectionName}.${conflictingIndexName}`);
          } else {
            console.warn(`[startup] 重新创建索引 ${model.collection.collectionName}.${conflictingIndexName}`);
          }
        } catch (dropError) {
          if (
            dropError?.codeName !== 'IndexNotFound' &&
            dropError?.code !== 27 &&
            dropError?.codeName !== 'NamespaceNotFound' &&
            dropError?.code !== 26
          ) {
            throw dropError;
          }
        }

        await model.init();
        return;
      }
    }

    throw error;
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
    throw error;
  }
}

module.exports = { initializeModels, dropStaleIndexes, ensureModelIndexes };
