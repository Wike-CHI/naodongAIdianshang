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
      // 使用真实的MongoDB数据库
      connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/naodongai';
    }

    const conn = await mongoose.connect(connectionString);

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
    // 如果连接失败，不创建内存用户数据，而是抛出错误
    throw new Error('无法连接到MongoDB数据库，请确保MongoDB服务正在运行');
  }
};

module.exports = connectDB;