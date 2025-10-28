const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 仪表板统计数据
router.get('/dashboard/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    // 模拟仪表板统计数据
    const stats = {
      totalUsers: global.memoryUsers ? global.memoryUsers.length : 0,
      activeUsers: global.memoryUsers ? Math.floor(global.memoryUsers.length * 0.8) : 0,
      totalCreditsConsumed: 12450,
      totalRevenue: 8960,
      newUsersToday: 5,
      creditsConsumedToday: 320,
      revenueToday: 180,
      popularTools: [
        { name: 'AI模特生成', usage: 1250 },
        { name: '同版型试衣', usage: 980 },
        { name: '配件试戴', usage: 750 }
      ],
      recentActivity: [
        {
          id: 1,
          type: 'user_registration',
          description: '新用户注册',
          user: '脑洞商家',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'tool_usage',
          description: '使用AI模特生成',
          user: '脑洞商家',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取仪表板统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

// 用户管理 - 获取用户列表
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let users = global.memoryUsers || [];
    
    // 搜索过滤
    if (search) {
      users = users.filter(user => 
        user.username.includes(search) || 
        user.email.includes(search) || 
        user.phone.includes(search)
      );
    }
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        users: paginatedUsers.map(user => ({
          ...user,
          password: undefined // 不返回密码
        })),
        total: users.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(users.length / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// AI工具管理 - 获取工具列表
router.get('/tools', authenticateToken, requireAdmin, (req, res) => {
  try {
    const tools = global.memoryTools || [];
    
    res.json({
      success: true,
      data: tools
    });
  } catch (error) {
    console.error('获取AI工具列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取AI工具列表失败'
    });
  }
});

// 订阅管理 - 获取订阅套餐
router.get('/subscriptions', authenticateToken, requireAdmin, (req, res) => {
  try {
    const plans = global.memorySubscriptionPlans || [];
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('获取订阅套餐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订阅套餐失败'
    });
  }
});

// 积分管理 - 获取积分统计
router.get('/credits/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stats = {
      totalCreditsIssued: 50000,
      totalCreditsConsumed: 12450,
      totalCreditsRemaining: 37550,
      averageCreditsPerUser: 860,
      topConsumers: [
        { username: '脑洞商家', credits: 860, consumed: 140 }
      ]
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取积分统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取积分统计失败'
    });
  }
});

module.exports = router;