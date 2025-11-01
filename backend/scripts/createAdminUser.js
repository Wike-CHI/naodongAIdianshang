require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser');

async function createAdminUser() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/naodongai');
    console.log('✅ MongoDB 连接成功');

    // 检查是否已存在管理员用户
    const existingAdmin = await AdminUser.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ 管理员用户已存在');
      console.log('用户名:', existingAdmin.username);
      console.log('角色:', existingAdmin.role);
      return;
    }

    // 创建默认管理员用户
    const adminUser = new AdminUser({
      username: 'admin',
      password_hash: 'admin123', // 这将在保存时被加密
      role: 'super_admin',
      permissions: ['*'], // 所有权限
      is_active: true
    });

    await adminUser.save();
    console.log('✅ 管理员用户创建成功');
    console.log('用户名:', adminUser.username);
    console.log('角色:', adminUser.role);
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭');
  }
}

createAdminUser();