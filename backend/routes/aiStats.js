const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getToolUsageStats, getUserCreditStats } = require('../services/aiGenerationService');

// 获取工具使用统计（管理员）
router.get('/tool-usage', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = await getToolUsageStats(parseInt(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取工具使用统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取用户积分消费统计（管理员）
router.get('/user-credits/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const stats = await getUserCreditStats(userId, parseInt(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取用户积分消费统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有用户积分消费统计（管理员）
router.get('/all-user-credits', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // 这里应该实现获取所有用户积分消费统计的逻辑
    // 暂时返回空数组
    const stats = [];
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取所有用户积分消费统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;