require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/naodongai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB 连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 模拟认证控制器中的generateToken函数
const generateToken = (userId, type = 'user', expiresIn = '7d') => {
  return jwt.sign(
    { userId, type },
    process.env.JWT_SECRET || 'your-secret-key-here',
    { expiresIn }
  );
};

// 模拟认证中间件中的authenticateToken函数
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const authenticateToken = (token) => {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error('访问令牌缺失'));
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        reject(new Error('访问令牌无效'));
        return;
      }
      resolve(user);
    });
  });
};

// 测试
async function test() {
  try {
    await connectDB();
    
    // 创建一个测试用户
    const user = await User.findOne({ phone: '13800138000' });
    if (!user) {
      console.log('用户不存在');
      process.exit(1);
      return;
    }
    
    console.log('用户ID:', user._id);
    
    // 生成令牌
    const token = generateToken(user._id.toString(), 'user');
    console.log('生成的令牌:', token);
    
    // 验证令牌
    const decoded = await authenticateToken(token);
    console.log('解码的令牌:', decoded);
    
    console.log('认证成功!');
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

test();