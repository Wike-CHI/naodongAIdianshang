const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8080;
const JWT_SECRET = 'your-secret-key-here';

// 中间件
app.use(cors());
app.use(express.json());

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
  
  // 模拟数据
  const mockData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    referrerId: `user_${i + 100}`,
    refereeId: `user_${i + 200}`,
    referrerName: `推荐人${i + 1}`,
    refereeName: `被推荐人${i + 1}`,
    status: ['active', 'pending', 'inactive'][i % 3],
    creditsEarned: (i + 1) * 100,
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  // 过滤数据
  let filteredData = mockData;
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

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器已启动，运行在 http://localhost:${PORT}`);
});