require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// 连接数据库
const connectDB = require('./config/database');

const createTestUser = async () => {
  try {
    await connectDB();
    
    // 使用现有的测试用户ID或者创建新的
    const userId = '661234567890123456789012';
    
    // 检查用户是否已存在
    let user = await User.findById(userId);
    if (user) {
      console.log('测试用户已存在:', user.username);
      console.log('用户ID:', user._id);
      return user;
    }
    
    // 查找现有的testuser
    user = await User.findOne({ username: 'testuser' });
    if (user) {
      console.log('找到现有的testuser:', user.username);
      console.log('用户ID:', user._id);
      return user;
    }
    
    // 查找现有的test@example.com邮箱用户
    user = await User.findOne({ email: 'test@example.com' });
    if (user) {
      console.log('找到现有的test@example.com用户:', user.username);
      console.log('用户ID:', user._id);
      return user;
    }
    
    // 创建新用户
    const userData = {
      _id: userId,
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123',
      credits_balance: 1000,
      membershipType: 'free',
      role: 'user'
    };
    
    user = new User(userData);
    await user.save();
    
    console.log('测试用户创建成功:');
    console.log('- 用户名:', user.username);
    console.log('- 邮箱:', user.email);
    console.log('- 用户ID:', user._id);
    console.log('- 积分余额:', user.credits_balance);
    
    return user;
  } catch (error) {
    console.error('创建测试用户失败:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// 运行脚本
createTestUser();