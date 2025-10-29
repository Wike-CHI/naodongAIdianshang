const express = require('express');
const router = express.Router();
const nanobananaService = require('../services/nanobananaIntegration');
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

// 获取nanobanana服务状态
router.get('/health', async (req, res) => {
  try {
    const health = await nanobananaService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取支持的模型列表
router.get('/models', async (req, res) => {
  try {
    const models = await nanobananaService.getSupportedModels();
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取工具配置
router.get('/tools/:toolId/config', (req, res) => {
  try {
    const { toolId } = req.params;
    const config = nanobananaService.getToolConfig(toolId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: '工具不存在'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有工具配置
router.get('/tools/configs', (req, res) => {
  try {
    const configs = nanobananaService.getAllToolConfigs();
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 图片生成接口
router.post('/generate/:toolId', upload.array('images', 5), async (req, res) => {
  try {
    const { toolId } = req.params;
    const { prompt, options } = req.body;
    
    // 解析options（如果是字符串）
    let parsedOptions = {};
    if (options) {
      try {
        parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: '选项参数格式错误'
        });
      }
    }

    // 处理上传的图片
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        type: 'main',
        data: file.buffer.toString('base64'),
        name: file.originalname,
        mimetype: file.mimetype
      }));
    }

    // 构建参数
    const params = {
      prompt: prompt || '',
      options: parsedOptions,
      images: images
    };

    // 验证参数
    const validation = nanobananaService.validateParams(toolId, params);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // 调用生成服务
    const result = await nanobananaService.generateImage(toolId, params);

    // 保存生成记录
    if (result.success) {
      const record = {
        id: Date.now().toString(),
        toolId,
        params,
        result: result.data,
        timestamp: new Date().toISOString(),
        creditCost: result.creditCost
      };
      generationHistory.push(record);
      
      // 限制历史记录数量
      if (generationHistory.length > 1000) {
        generationHistory.splice(0, generationHistory.length - 1000);
      }
    }

    res.json(result);

  } catch (error) {
    console.error('生成请求处理失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 批量生成接口
router.post('/batch-generate', upload.array('images', 20), async (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({
        success: false,
        error: '请求格式错误'
      });
    }

    // 处理批量请求
    const processedRequests = requests.map((request, index) => ({
      id: request.id || `batch_${index}`,
      toolId: request.toolId,
      params: {
        prompt: request.prompt || '',
        options: request.options || {},
        images: request.images || []
      }
    }));

    const results = await nanobananaService.batchGenerate(processedRequests);

    // 保存成功的生成记录
    results.forEach(result => {
      if (result.success) {
        const record = {
          id: result.id,
          toolId: processedRequests.find(r => r.id === result.id)?.toolId,
          params: processedRequests.find(r => r.id === result.id)?.params,
          result: result.data,
          timestamp: new Date().toISOString(),
          creditCost: result.creditCost
        };
        generationHistory.push(record);
      }
    });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('批量生成请求处理失败:', error);
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

    // 获取nanobanana服务统计
    const serviceStats = await nanobananaService.getGenerationStats();

    res.json({
      success: true,
      data: {
        local: localStats,
        service: serviceStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新工具配置（管理员功能）
router.put('/tools/:toolId/config', (req, res) => {
  try {
    const { toolId } = req.params;
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        error: '配置参数不能为空'
      });
    }
    
    const updated = nanobananaService.updateToolConfig(toolId, config);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: '工具不存在'
      });
    }
    
    res.json({
      success: true,
      message: '配置已更新'
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