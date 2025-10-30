const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
const connectDB = require('../config/database');
const CreditPackage = require('../models/CreditPackage');

// 积分套餐配置
const creditPackages = [
  {
    name: '基础积分包',
    description: '适合轻度用户使用',
    credits: 100,
    price: 10,
    bonus_credits: 0,
    requires_yearly_membership: true,
    active: true,
    sort_order: 1,
    popular: false
  },
  {
    name: '标准积分包',
    description: '适合中度用户使用',
    credits: 300,
    price: 25,
    bonus_credits: 50,
    requires_yearly_membership: true,
    active: true,
    sort_order: 2,
    popular: true
  },
  {
    name: '高级积分包',
    description: '适合重度用户使用',
    credits: 500,
    price: 40,
    bonus_credits: 100,
    requires_yearly_membership: true,
    active: true,
    sort_order: 3,
    popular: false
  },
  {
    name: '豪华积分包',
    description: '适合专业用户使用',
    credits: 1000,
    price: 70,
    bonus_credits: 300,
    requires_yearly_membership: true,
    active: true,
    sort_order: 4,
    popular: false
  }
];

async function initCreditPackages() {
  try {
    // 连接数据库
    await connectDB();
    
    console.log('数据库连接成功');
    
    // 检查是否已存在积分套餐
    const existingPackages = await CreditPackage.find({});
    
    if (existingPackages.length > 0) {
      console.log('积分套餐已存在，跳过初始化');
    } else {
      // 创建默认积分套餐
      for (const pkg of creditPackages) {
        const newPackage = new CreditPackage(pkg);
        await newPackage.save();
        console.log(`积分套餐创建成功: ${newPackage.name}`);
      }
    }
    
    // 显示所有套餐
    const allPackages = await CreditPackage.find().sort({ sort_order: 1 });
    console.log('\n当前所有积分套餐:');
    allPackages.forEach(pkg => {
      console.log(`- ${pkg.name} (${pkg.credits}积分 + ${pkg.bonus_credits}奖励积分, ¥${pkg.price})`);
    });
    
    console.log('\n积分套餐初始化完成!');
    
    // 断开数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('初始化积分套餐时出错:', error);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  initCreditPackages();
}

module.exports = { initCreditPackages, creditPackages };