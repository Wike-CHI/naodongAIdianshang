const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();

const connectDB = async () => {
  try {
    let connectionString;
    
    // 检查是否使用内存数据库
    if (process.env.USE_MEMORY_DB === 'true') {
      // 使用内存数据库
      connectionString = 'mongodb://127.0.0.1:27017/naodongai_memory';
      logger.log('🔄 使用内存数据库模式');
    } else {
      connectionString = process.env.MONGODB_URI;
    }

    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.log(`✅ MongoDB 连接成功: ${conn.connection.host}`);
    
    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.log('⚠️ MongoDB 连接断开');
    });

    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.log('📴 MongoDB 连接已关闭');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    logger.log('🔄 尝试创建内存用户数据...');
    
    // 如果连接失败，创建内存用户数据
    await createMemoryData();
  }
};

// 创建内存用户数据
const createMemoryData = async () => {
  try {
    // 这里我们将在server.js中处理内存数据
    logger.log('📝 将使用内存数据存储');
  } catch (error) {
    console.error('❌ 创建内存数据失败:', error);
  }
};

module.exports = connectDB;