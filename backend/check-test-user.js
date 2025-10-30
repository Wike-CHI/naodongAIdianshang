require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// 连接数据库
const connectDB = require('./config/database');

const checkTestUser = async () => {
  try {
    await connectDB();
    
    // 查找测试用户
    const user = await User.findById('661234567890123456789012');
    
    if (user) {
      console.log('测试用户存在:');
      console.log('- 用户名:', user.username);
      console.log('- 邮箱:', user.email);
      console.log('- 用户ID:', user._id);
      console.log('- 积分余额:', user.credits_balance);
      console.log('- 会员类型:', user.membershipType);
      console.log('- 角色:', user.role);
    } else {
      console.log('测试用户不存在');
    }
    
    // 查找所有用户
    const allUsers = await User.find({});
    console.log('\n数据库中的所有用户:');
    allUsers.forEach(u => {
      console.log(`- ${u.username} (${u.email}) - ID: ${u._id} - 积分: ${u.credits_balance}`);
    });
    
  } catch (error) {
    console.error('检查测试用户失败:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// 运行脚本
checkTestUser();