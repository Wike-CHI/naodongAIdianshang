// 简单测试脚本，直接查询数据库验证积分套餐是否创建成功
const mongoose = require('mongoose');
require('dotenv').config();

// 数据库连接
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

// 测试积分套餐API
const testCreditPackages = async () => {
  try {
    await connectDB();
    
    // 加载模型
    const CreditPackage = require('../models/CreditPackage');
    
    // 查询所有积分套餐
    const packages = await CreditPackage.find({}).sort({ sort_order: 1 });
    
    console.log('积分套餐列表:');
    packages.forEach(pkg => {
      console.log(`- ${pkg.name}: ${pkg.credits}积分 + ${pkg.bonus_credits}奖励积分, ¥${pkg.price}`);
    });
    
    console.log(`\n总共找到 ${packages.length} 个积分套餐`);
    
    // 断开连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
};

testCreditPackages();