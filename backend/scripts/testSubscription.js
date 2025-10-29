require('dotenv').config();
const mongoose = require('mongoose');

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

// 测试
async function test() {
  try {
    await connectDB();
    
    // 加载模型
    const Subscription = require('../models/Subscription');
    const User = require('../models/User');
    
    // 获取用户
    const user = await User.findOne({ phone: '13800138000' });
    if (!user) {
      console.log('用户不存在');
      process.exit(1);
      return;
    }
    
    console.log('用户ID:', user._id);
    
    // 检查用户是否有当前订阅
    const currentSubscription = await Subscription.getCurrentSubscription(user._id);
    console.log('当前订阅:', currentSubscription);
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

test();