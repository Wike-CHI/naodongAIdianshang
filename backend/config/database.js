const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/naodongai';
      
      this.connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log('✅ MongoDB连接成功');
      
      // 监听连接事件
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB连接错误:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB连接断开');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB重新连接成功');
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB连接失败:', error);
      console.log('⚠️ 继续运行服务器，但数据库功能将不可用');
      // 不退出进程，让服务器继续运行
      return null;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('✅ MongoDB连接已关闭');
    } catch (error) {
      console.error('❌ 关闭MongoDB连接时出错:', error);
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database();