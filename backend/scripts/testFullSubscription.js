require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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

// 模拟验证中间件
const { validate, schemas } = require('../middleware/validation');

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
    
    // 生成令牌
    const token = generateToken(user._id.toString(), 'user');
    console.log('生成的令牌:', token);
    
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
    
    // 模拟请求体
    const requestBody = {
      plan_id: planId,
      payment_method: 'alipay',
      transaction_id: 'test_transaction_001',
      auto_renew: true
    };
    
    console.log('请求体:', requestBody);
    
    // 验证请求体
    const { error } = schemas.createSubscription.validate(requestBody);
    if (error) {
      console.log('验证失败:', error.details[0].message);
      process.exit(1);
      return;
    }
    
    console.log('请求体验证通过');
    
    // 执行创建订阅逻辑
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    // 检查是否为年度会员套餐
    let grantedCredits = plan.benefits.monthly_credits || 0;
    let isYearlyMember = false;
    let yearlyCreditsGranted = 0;
    
    if (plan.isYearlyPlan()) {
      // 年度会员套餐
      isYearlyMember = true;
      // 年度会员默认获得12个月的积分
      yearlyCreditsGranted = plan.getYearlyMemberCredits();
      grantedCredits = yearlyCreditsGranted;
      // 设置订阅时长为12个月
      endDate.setMonth(endDate.getMonth() + plan.getYearlyMemberDuration());
    } else {
      // 普通套餐
      endDate.setMonth(endDate.getMonth() + plan.duration_months);
    }
    
    console.log('订阅信息:');
    console.log('- 开始日期:', startDate);
    console.log('- 结束日期:', endDate);
    console.log('- 赠送积分:', grantedCredits);
    console.log('- 是否为年度会员:', isYearlyMember);
    console.log('- 年度会员赠送积分:', yearlyCreditsGranted);
    
    console.log('所有检查通过，可以创建订阅');
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

test();