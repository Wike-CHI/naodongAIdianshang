const mongoose = require('mongoose');
require('dotenv').config();

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

// 检查数据
const checkData = async () => {
  try {
    await connectDB();
    
    // 检查订阅套餐
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const plans = await SubscriptionPlan.find({});
    console.log('订阅套餐:');
    console.log(plans);
    
    // 检查用户
    const User = require('../models/User');
    const users = await User.find({});
    console.log('用户:');
    console.log(users);
    
    // 检查积分记录
    const CreditRecord = require('../models/CreditRecord');
    const creditRecords = await CreditRecord.find({});
    console.log('积分记录:');
    console.log(creditRecords);
    
    // 检查订阅
    const Subscription = require('../models/Subscription');
    const subscriptions = await Subscription.find({});
    console.log('订阅记录:');
    console.log(subscriptions);
    
    // 删除所有订阅记录（用于测试）
    if (subscriptions.length > 0) {
      await Subscription.deleteMany({});
      console.log('已删除所有订阅记录');
    }
    
    // 重置用户积分
    await User.updateOne(
      { phone: '13800138000' },
      { 
        $set: { 
          credits_balance: 100,
          role: 'user'
        }
      }
    );
    console.log('已重置用户积分和角色');
    
    process.exit(0);
  } catch (error) {
    console.error('检查数据时出错:', error);
    process.exit(1);
  }
};

checkData();