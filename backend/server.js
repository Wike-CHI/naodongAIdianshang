const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const logger = require('./utils/logger');

const app = express();
const PORT = 8080;
const JWT_SECRET = 'your-secret-key-here';

// 内存数据存储
let memoryUsers = [
  {
    id: 1,
    phone: '13800138000',
    password: '$2b$10$rQZ8kqH5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5', // 123456
    username: 'testuser',
    email: 'test@example.com',
    credits: 100,
    createdAt: new Date()
  }
];

// 连接MongoDB（如果失败则使用内存存储）
let useMemoryDB = false;
mongoose.connect('mongodb://localhost:27017/naodongai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.log('MongoDB连接成功');
}).catch(err => {
  console.error('MongoDB连接失败:', err);
  logger.log('🔄 切换到内存数据库模式');
  useMemoryDB = true;
});

// 中间件
app.use(cors());
app.use(express.json());

// 引入路由
const authRoutes = require('./routes/auth');

// 使用路由
app.use('/api/auth', authRoutes);

// 管理员登录API
app.post('/api/admin/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 简单的管理员验证（实际项目中应该使用数据库验证）
  if (username === 'admin' && password === 'admin123') {
    // 生成JWT token
    const token = jwt.sign(
      { 
        id: 1, 
        username: 'admin', 
        role: 'admin' 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// Token验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: '未提供访问令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// Token验证API
app.post('/api/admin/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '令牌有效',
    data: {
      user: req.user
    }
  });
});

// 推荐系统概览API
app.get('/api/admin/referral/overview', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1250,
      totalRelationships: 856,
      totalCredits: 125600,
      todayNewUsers: 23,
      todayNewRelationships: 15,
      todayCreditsIssued: 2300
    }
  });
});

// 推荐关系列表API
app.get('/api/admin/referral/relationships', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, search = '', status = '' } = req.query;
  
  // TODO: 从数据库获取推广关系数据
  // 暂时返回空数据，等待数据库集成
  let filteredData = [];
  if (search) {
    filteredData = filteredData.filter(item => 
      item.referrerName.includes(search) || 
      item.refereeName.includes(search) ||
      item.referrerId.includes(search) ||
      item.refereeId.includes(search)
    );
  }
  if (status) {
    filteredData = filteredData.filter(item => item.status === status);
  }
  
  // 分页
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      list: paginatedData,
      total: filteredData.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

// 删除推荐关系API
app.delete('/api/admin/referral/relationships/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `推荐关系 ${id} 已删除`
  });
});

// 更新推荐关系状态API
app.put('/api/admin/referral/relationships/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  res.json({
    success: true,
    message: `推荐关系 ${id} 状态已更新为 ${status}`
  });
});

// 系统配置API
app.get('/api/admin/system/config', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      referralCredits: 100,
      maxReferrals: 10,
      creditExpireDays: 365,
      enableReferralSystem: true
    }
  });
});

app.put('/api/admin/system/config', authenticateToken, (req, res) => {
  const config = req.body;
  
  res.json({
    success: true,
    message: '系统配置已更新',
    data: config
  });
});

app.post('/api/admin/system/config/reset', authenticateToken, (req, res) => {
  const defaultConfig = {
    referralCredits: 100,
    maxReferrals: 10,
    creditExpireDays: 365,
    enableReferralSystem: true
  };
  
  res.json({
    success: true,
    message: '系统配置已重置为默认值',
    data: defaultConfig
  });
});

// 系统统计API
app.get('/api/admin/system/stats', authenticateToken, (req, res) => {
  // TODO: 从数据库获取真实的系统统计数据
  const stats = {
    totalUsers: 0,
    activeUsers: 0,
    todayNewUsers: 0,
    systemUptime: Math.floor(process.uptime()), // 系统运行时间（秒）
    storageUsage: {
      used: 0, // MB
      total: 1024, // MB
      percentage: 0
    },
    memoryUsage: {
      used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      total: process.memoryUsage().heapTotal / 1024 / 1024, // MB
      percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(1)
    },
    databaseStatus: 'disconnected', // TODO: 检查真实数据库连接状态
    databaseSize: 0, // MB
    lastBackup: null, // TODO: 从数据库获取最后备份时间
    serverInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
    }
  };

  res.json({
    success: true,
    data: stats
  });
});

// 前端工具列表API (不需要认证)
app.get('/api/tools', (req, res) => {
  // 返回前端需要的工具列表数据
  const tools = [
    {
      id: 1,
      name: '商品主图生成',
      description: '生成高质量的商品主图，适用于电商平台展示',
      category: 'product',
      icon: '🛍️',
      creditCost: 10
    },
    {
      id: 2,
      name: '详情页设计',
      description: '生成商品详情页设计，提升转化率',
      category: 'design',
      icon: '📄',
      creditCost: 15
    },
    {
      id: 3,
      name: 'AI文案生成',
      description: '智能生成商品文案和营销内容',
      category: 'text',
      icon: '✍️',
      creditCost: 5
    },
    {
      id: 4,
      name: '背景移除',
      description: '智能移除图片背景，制作透明图片',
      category: 'image',
      icon: '🖼️',
      creditCost: 8
    },
    {
      id: 5,
      name: '图片增强',
      description: '提升图片质量和清晰度',
      category: 'image',
      icon: '✨',
      creditCost: 12
    }
  ];

  res.json({
    success: true,
    data: tools
  });
});

// 启动服务器
app.listen(PORT, () => {
  logger.log(`后端服务器已启动，运行在 http://localhost:${PORT}`);
});

// 积分系统API
app.get('/api/admin/credits/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalCredits: 125600,
      totalUsers: 1250,
      totalTransactions: 3456,
      averageCreditsPerUser: 100.48,
      todayCreditsIssued: 2300,
      todayCreditsUsed: 1850,
      monthlyCreditsIssued: 45600,
      monthlyCreditsUsed: 38900
    }
  });
});

app.get('/api/admin/credits/rules', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: '每日签到',
        type: 'daily_checkin',
        credits: 10,
        description: '每日签到获得积分',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: '推荐新用户',
        type: 'referral',
        credits: 100,
        description: '成功推荐新用户注册',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: '完成任务',
        type: 'task_completion',
        credits: 50,
        description: '完成指定任务获得积分',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ]
  });
});

app.post('/api/admin/credits/rules', authenticateToken, (req, res) => {
  const { name, type, credits, description, isActive } = req.body;
  
  const newRule = {
    id: Date.now(),
    name,
    type,
    credits: parseInt(credits),
    description,
    isActive: isActive !== false,
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: '积分规则创建成功',
    data: newRule
  });
});

app.put('/api/admin/credits/rules/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, type, credits, description, isActive } = req.body;
  
  res.json({
    success: true,
    message: `积分规则 ${id} 更新成功`,
    data: {
      id: parseInt(id),
      name,
      type,
      credits: parseInt(credits),
      description,
      isActive,
      updatedAt: new Date().toISOString()
    }
  });
});

app.delete('/api/admin/credits/rules/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `积分规则 ${id} 删除成功`
  });
});

app.get('/api/admin/credits/transactions', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, type = '', userId = '' } = req.query;
  
  // TODO: 从数据库获取积分交易记录
  // 暂时返回空数据，等待数据库集成
  let filteredData = [];
  if (type) {
    filteredData = filteredData.filter(item => item.type === type);
  }
  if (userId) {
    filteredData = filteredData.filter(item => item.userId.includes(userId) || item.userName.includes(userId));
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      list: paginatedData,
      total: filteredData.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

app.get('/api/admin/credits/chart-data', authenticateToken, (req, res) => {
  const { period = '7d' } = req.query;
  
  let days = 7;
  if (period === '30d') days = 30;
  if (period === '90d') days = 90;
  
  const chartData = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      earned: Math.floor(Math.random() * 1000) + 500,
      spent: Math.floor(Math.random() * 800) + 300
    };
  });
  
  res.json({
    success: true,
    data: chartData
  });
});

// 订阅系统API
app.get('/api/admin/subscriptions/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalSubscriptions: 456,
      activeSubscriptions: 389,
      totalRevenue: 125600,
      monthlyRevenue: 15600,
      conversionRate: 12.5,
      churnRate: 3.2
    }
  });
});

app.get('/api/admin/subscriptions/plans', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: '基础版',
        price: 29,
        duration: 'monthly',
        features: ['100积分/月', '基础AI工具', '邮件支持'],
        isActive: true,
        subscriberCount: 156,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: '专业版',
        price: 99,
        duration: 'monthly',
        features: ['500积分/月', '全部AI工具', '优先支持', '高级功能'],
        isActive: true,
        subscriberCount: 233,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: '企业版',
        price: 299,
        duration: 'monthly',
        features: ['无限积分', '全部功能', '专属客服', 'API访问'],
        isActive: true,
        subscriberCount: 67,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ]
  });
});

app.post('/api/admin/subscriptions/plans', authenticateToken, (req, res) => {
  const { name, price, duration, features, isActive } = req.body;
  
  const newPlan = {
    id: Date.now(),
    name,
    price: parseFloat(price),
    duration,
    features: Array.isArray(features) ? features : [],
    isActive: isActive !== false,
    subscriberCount: 0,
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: '订阅套餐创建成功',
    data: newPlan
  });
});

app.put('/api/admin/subscriptions/plans/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, price, duration, features, isActive } = req.body;
  
  res.json({
    success: true,
    message: `订阅套餐 ${id} 更新成功`,
    data: {
      id: parseInt(id),
      name,
      price: parseFloat(price),
      duration,
      features: Array.isArray(features) ? features : [],
      isActive,
      updatedAt: new Date().toISOString()
    }
  });
});

app.delete('/api/admin/subscriptions/plans/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `订阅套餐 ${id} 删除成功`
  });
});

app.get('/api/admin/subscriptions/list', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, status = '', planId = '' } = req.query;
  
  // TODO: 从数据库获取订阅列表
  // 暂时返回空数据，等待数据库集成
  let filteredData = [];
  if (status) {
    filteredData = filteredData.filter(item => item.status === status);
  }
  if (planId) {
    filteredData = filteredData.filter(item => item.planId === parseInt(planId));
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      list: paginatedData,
      total: filteredData.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

// 仪表盘API
app.get('/api/admin/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1250,
      totalCredits: 125600,
      totalSubscriptions: 456,
      totalRevenue: 125600,
      todayNewUsers: 23,
      todayCreditsUsed: 1850,
      todayNewSubscriptions: 5,
      todayRevenue: 890
    }
  });
});

app.get('/api/admin/dashboard/chart-data', authenticateToken, (req, res) => {
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split('T')[0],
      users: Math.floor(Math.random() * 50) + 20,
      credits: Math.floor(Math.random() * 2000) + 1000,
      revenue: Math.floor(Math.random() * 1000) + 500
    };
  });
  
  res.json({
    success: true,
    data: chartData
  });
});

app.get('/api/admin/dashboard/recent-activities', authenticateToken, (req, res) => {
  const activities = [
    { id: 1, type: 'user_register', message: '新用户注册：用户123', time: '2分钟前' },
    { id: 2, type: 'subscription', message: '用户456购买了专业版套餐', time: '5分钟前' },
    { id: 3, type: 'credit_usage', message: '用户789使用了50积分', time: '8分钟前' },
    { id: 4, type: 'tool_usage', message: 'AI图片生成工具被使用了15次', time: '12分钟前' },
    { id: 5, type: 'referral', message: '用户101成功推荐了新用户', time: '15分钟前' }
  ];
  
  res.json({
    success: true,
    data: activities
  });
});

// AI工具管理API
// 添加路由别名以兼容前端请求
app.get('/api/admin/ai-tools', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, category = '', status = '' } = req.query;
  
  // TODO: 从数据库获取AI工具列表
  // 暂时返回空数据，等待数据库集成
  let filteredData = [];
  if (category) {
    filteredData = filteredData.filter(item => item.category === category);
  }
  if (status) {
    filteredData = filteredData.filter(item => item.status === status);
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      list: paginatedData,
      total: filteredData.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

app.get('/api/admin/tools/list', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, category = '', status = '' } = req.query;
  
  // TODO: 从数据库获取工具列表
  // 暂时返回空数据，等待数据库集成
  let filteredData = [];
  if (category) {
    filteredData = filteredData.filter(item => item.category === category);
  }
  if (status) {
    filteredData = filteredData.filter(item => item.status === status);
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      list: paginatedData,
      total: filteredData.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

app.post('/api/admin/tools', authenticateToken, (req, res) => {
  const { name, category, description, creditCost, status, settings } = req.body;
  
  const newTool = {
    id: Date.now(),
    name,
    category,
    description,
    creditCost: parseInt(creditCost),
    status: status || 'active',
    usageCount: 0,
    icon: category === 'image' ? 'image' : category === 'text' ? 'file-text' : 'code',
    settings: settings || {},
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'AI工具创建成功',
    data: newTool
  });
});

app.put('/api/admin/tools/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, category, description, creditCost, status, settings } = req.body;
  
  res.json({
    success: true,
    message: `AI工具 ${id} 更新成功`,
    data: {
      id: parseInt(id),
      name,
      category,
      description,
      creditCost: parseInt(creditCost),
      status,
      settings: settings || {},
      updatedAt: new Date().toISOString()
    }
  });
});

app.delete('/api/admin/tools/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: `AI工具 ${id} 删除成功`
  });
});

app.get('/api/admin/tools/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalTools: 15,
      activeTools: 12,
      totalUsage: 4580,
      todayUsage: 156,
      popularTools: [
        { name: 'AI文本生成', usage: 2340 },
        { name: 'AI图片生成', usage: 1250 },
        { name: 'AI代码生成', usage: 890 }
      ]
    }
  });
});

// 用户管理API
// 添加路由别名以兼容前端请求
app.get('/api/admin/users', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, search = '', status = '' } = req.query;
  
  // TODO: 从数据库获取用户列表
  // 暂时返回空数据，等待数据库集成
  let filteredData = [];
  if (search) {
    filteredData = filteredData.filter(item => 
      item.username.includes(search) || 
      item.email.includes(search)
    );
  }
  if (status) {
    filteredData = filteredData.filter(item => item.status === status);
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      list: paginatedData,
      total: filteredData.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

app.get('/api/admin/users/list', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 10, search = '', status = '' } = req.query;
  
  // TODO: 从数据库获取用户列表
  // 暂时返回空数据，等待数据库集成
  let filteredData = [];
  if (search) {
    filteredData = filteredData.filter(item => 
      item.username.includes(search) || 
      item.email.includes(search)
    );
  }
  if (status) {
    filteredData = filteredData.filter(item => item.status === status);
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      list: paginatedData,
      total: filteredData.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

app.get('/api/admin/users/stats', authenticateToken, (req, res) => {
  // TODO: 从数据库获取真实的用户统计数据
  res.json({
    success: true,
    data: {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newUsersThisMonth: 0,
      userGrowthRate: 0
    }
  });
});