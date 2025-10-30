const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
const connectDB = require('../config/database');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// 年度会员套餐配置
const yearlyMembershipPlan = {
  name: '年度会员',
  description: '年度会员套餐，享受全年AI工具使用权益',
  price: 299, // 年度价格299元
  duration_months: 12,
  is_yearly: true,
  yearly_price: 299,
  benefits: {
    monthly_credits: 500, // 每月500积分
    priority_processing: true,
    advanced_features: true,
    support_level: 'priority',
    api_access: true,
    max_concurrent_jobs: 5,
    max_file_size: '50MB',
    custom_models: true,
    batch_processing: true,
    white_label: false,
    dedicated_support: true
  },
  features: [
    { name: '优先处理', description: '生成任务优先处理', enabled: true },
    { name: '高级功能', description: '解锁所有高级AI工具', enabled: true },
    { name: '批量处理', description: '支持批量生成任务', enabled: true },
    { name: '大文件支持', description: '支持最大50MB文件上传', enabled: true },
    { name: '专属客服', description: '优先客服支持', enabled: true },
    { name: '月度积分', description: '每月500积分', enabled: true }
  ],
  limitations: {
    daily_generation_limit: null,
    monthly_generation_limit: null,
    storage_limit: '10GB'
  },
  active: true,
  sort_order: 1,
  popular: true,
  trial_days: 7,
  discount_percentage: 0,
  original_price: 3588, // 12个月普通会员价格
  currency: 'CNY',
  billing_cycle: 'yearly',
  auto_renewal: true,
  cancellation_policy: '可随时取消，剩余时间按比例退款'
};

async function initYearlyMembership() {
  try {
    // 连接数据库
    await connectDB();
    
    console.log('数据库连接成功');
    
    // 检查是否已存在年度会员套餐
    const existingPlan = await SubscriptionPlan.findOne({ name: '年度会员' });
    
    if (existingPlan) {
      console.log('年度会员套餐已存在，更新配置...');
      // 更新现有套餐
      const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(
        existingPlan._id,
        yearlyMembershipPlan,
        { new: true, runValidators: true }
      );
      console.log('年度会员套餐更新成功:', updatedPlan.name);
    } else {
      // 创建新的年度会员套餐
      const newPlan = new SubscriptionPlan(yearlyMembershipPlan);
      await newPlan.save();
      console.log('年度会员套餐创建成功:', newPlan.name);
    }
    
    // 显示所有套餐
    const allPlans = await SubscriptionPlan.find().sort({ sort_order: 1 });
    console.log('\n当前所有套餐:');
    allPlans.forEach(plan => {
      console.log(`- ${plan.name} (${plan.price}元${plan.is_yearly ? '/年' : '/月'})`);
    });
    
    console.log('\n年度会员套餐初始化完成!');
    
    // 断开数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('初始化年度会员套餐时出错:', error);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  initYearlyMembership();
}

module.exports = { initYearlyMembership, yearlyMembershipPlan };