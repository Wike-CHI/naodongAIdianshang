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

// 模拟请求和响应对象
const createMockReqRes = (user, body) => {
  const req = {
    user: { _id: user._id },
    body: body
  };
  
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      console.log(`响应状态码: ${this.statusCode}`);
      console.log(`响应数据:`, data);
      return this;
    }
  };
  
  return { req, res };
};

// 测试
async function test() {
  try {
    await connectDB();
    
    // 加载控制器
    const subscriptionController = require('../controllers/subscriptionController');
    
    // 加载模型
    const User = require('../models/User');
    
    // 获取用户
    const user = await User.findOne({ phone: '13800138000' });
    if (!user) {
      console.log('用户不存在');
      process.exit(1);
      return;
    }
    
    console.log('用户ID:', user._id);
    
    // 创建模拟请求和响应
    const { req, res } = createMockReqRes(user, {
      plan_id: '6901f6d8f453fefd3ddf054a',
      payment_method: 'alipay',
      transaction_id: 'test_transaction_001',
      auto_renew: true
    });
    
    // 调用控制器方法
    await subscriptionController.createSubscription(req, res);
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

test();