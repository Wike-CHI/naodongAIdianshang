const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/naodongai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 创建初始用户
const createInitialUser = async () => {
  try {
    // 检查是否已存在测试用户（通过手机号或用户名）
    const existingUser = await User.findOne({ 
      $or: [
        { phone: '13800138000' },
        { username: 'testuser' }
      ]
    });
    
    if (existingUser) {
      console.log('测试用户已存在:');
      console.log('手机号: 13800138000');
      console.log('密码: 123456');
      console.log('用户名: testuser');
      return existingUser;
    }

    // 创建新的测试用户
    const testUser = new User({
      phone: '13800138000',
      username: 'testuser',
      password_hash: '123456', // 将在pre-save中间件中加密
      credit_balance: 1000,
      role: 'user',
      is_active: true,
      email_verified: true
    });

    await testUser.save();
    console.log('初始测试用户创建成功:');
    console.log('手机号: 13800138000');
    console.log('密码: 123456');
    console.log('用户名:', testUser.username);
    
    return testUser;
  } catch (error) {
    console.error('创建初始用户失败:', error);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    await connectDB();
    await createInitialUser();
    console.log('初始用户创建完成');
  } catch (error) {
    console.error('脚本执行失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
};

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { createInitialUser };