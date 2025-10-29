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
    const SubscriptionPlan = require('../models/SubscriptionPlan');
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
    
    // 获取套餐
    const planId = '6901f6d8f453fefd3ddf054a';
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      console.log('套餐不存在');
      process.exit(1);
      return;
    }
    
    console.log('套餐信息:');
    console.log('- ID:', plan._id);
    console.log('- 名称:', plan.name);
    console.log('- 是否激活:', plan.active);
    console.log('- 是否为年度会员套餐:', plan.is_yearly);
    
    // 检查套餐是否激活
    if (!plan.active) {
      console.log('错误: 套餐已停用');
      process.exit(1);
      return;
    }
    
    // 检查用户是否已有活跃订阅
    const existingSubscription = await Subscription.getCurrentSubscription(user._id);
    if (existingSubscription) {
      console.log('错误: 用户已有活跃订阅');
      process.exit(1);
      return;
    }
    
    console.log('所有检查通过，可以创建订阅');
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

test();