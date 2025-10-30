const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多5个文件
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPEG, PNG, WebP 格式的图片'));
    }
  }
});

// 生成历史记录存储（实际项目中应该使用数据库）
const generationHistory = [];

// 健康检查接口
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'ok',
      message: 'AI生成服务正常运行'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取生成历史
router.get('/history', (req, res) => {
  try {
    const { page = 1, limit = 20, toolId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let filteredHistory = generationHistory;
    
    // 按工具类型筛选
    if (toolId) {
      filteredHistory = generationHistory.filter(record => record.toolId === toolId);
    }
    
    // 按时间倒序排序
    filteredHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 分页
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedHistory = filteredHistory.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        records: paginatedHistory,
        total: filteredHistory.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredHistory.length / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取单个生成记录
router.get('/history/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const record = generationHistory.find(r => r.id === recordId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除生成记录
router.delete('/history/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const index = generationHistory.findIndex(r => r.id === recordId);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }
    
    generationHistory.splice(index, 1);
    
    res.json({
      success: true,
      message: '记录已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取生成统计
router.get('/stats', async (req, res) => {
  try {
    // 本地统计
    const localStats = {
      totalGenerations: generationHistory.length,
      toolUsage: {},
      totalCreditsUsed: 0,
      recentActivity: []
    };

    // 统计各工具使用情况
    generationHistory.forEach(record => {
      if (!localStats.toolUsage[record.toolId]) {
        localStats.toolUsage[record.toolId] = 0;
      }
      localStats.toolUsage[record.toolId]++;
      localStats.totalCreditsUsed += record.creditCost || 0;
    });

    // 最近7天的活动
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    localStats.recentActivity = generationHistory
      .filter(record => new Date(record.timestamp) > sevenDaysAgo)
      .length;

    res.json({
      success: true,
      data: {
        local: localStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件大小超过限制（最大10MB）'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: '文件数量超过限制（最多5个）'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message
  });
});

module.exports = router;