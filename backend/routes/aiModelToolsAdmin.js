const express = require('express');
const router = express.Router();
const nanobananaService = require('../services/nanobananaIntegration');

// AI模特工具配置数据（实际项目中应该使用数据库）
const aiModelToolsConfig = {
  'ai-model': {
    id: 'ai-model',
    name: 'AI模特生成',
    description: '基于商品图片生成专业模特展示图',
    enabled: true,
    creditCost: 10,
    usageCount: 1250,
    successRate: 95.2,
    avgProcessTime: 8.5,
    endpoint: '/api/ai/generate',
    model: 'flux-dev',
    promptTemplate: '专业模特展示商品，{product_description}，高质量摄影，商业级别',
    negativePrompt: '低质量，模糊，变形',
    maxFileSize: 10,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'model-generation'
  },
  'try-on-clothes': {
    id: 'try-on-clothes',
    name: '同版型试衣',
    description: '保持服装版型的智能试衣功能',
    enabled: true,
    creditCost: 15,
    usageCount: 890,
    successRate: 92.8,
    avgProcessTime: 12.3,
    endpoint: '/api/ai/try-on',
    model: 'flux-dev',
    promptTemplate: '模特试穿{clothing_type}，保持原版型，{style_description}',
    negativePrompt: '版型变形，不合身，低质量',
    maxFileSize: 15,
    supportedFormats: ['jpg', 'png'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'try-on'
  },
  'glasses-tryon': {
    id: 'glasses-tryon',
    name: '配件试戴',
    description: '眼镜、帽子等配件的智能试戴',
    enabled: true,
    creditCost: 8,
    usageCount: 567,
    successRate: 89.5,
    avgProcessTime: 6.8,
    endpoint: '/api/ai/accessory-tryon',
    model: 'flux-dev',
    promptTemplate: '模特佩戴{accessory_type}，{style_description}，自然效果',
    negativePrompt: '不自然，变形，低质量',
    maxFileSize: 8,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'accessory'
  },
  'pose-transform': {
    id: 'pose-transform',
    name: '姿态变换',
    description: '改变模特姿态和动作',
    enabled: false,
    creditCost: 12,
    usageCount: 234,
    successRate: 87.3,
    avgProcessTime: 10.2,
    endpoint: '/api/ai/pose-transform',
    model: 'flux-dev',
    promptTemplate: '模特{pose_description}，{style_requirements}',
    negativePrompt: '不自然姿态，变形，低质量',
    maxFileSize: 12,
    supportedFormats: ['jpg', 'png'],
    lastUpdated: new Date().toISOString(),
    status: 'inactive',
    category: 'pose'
  },
  'model-video': {
    id: 'model-video',
    name: '模特视频生成',
    description: '生成动态模特展示视频',
    enabled: false,
    creditCost: 25,
    usageCount: 89,
    successRate: 78.9,
    avgProcessTime: 45.6,
    endpoint: '/api/ai/model-video',
    model: 'flux-dev',
    promptTemplate: '模特视频展示，{video_description}，流畅动作',
    negativePrompt: '卡顿，低质量，不自然',
    maxFileSize: 20,
    supportedFormats: ['jpg', 'png', 'mp4'],
    lastUpdated: new Date().toISOString(),
    status: 'inactive',
    category: 'video'
  },
  'shoes-tryon': {
    id: 'shoes-tryon',
    name: '鞋靴试穿',
    description: '各类鞋靴的智能试穿效果',
    enabled: true,
    creditCost: 10,
    usageCount: 445,
    successRate: 91.2,
    avgProcessTime: 9.1,
    endpoint: '/api/ai/shoes-tryon',
    model: 'flux-dev',
    promptTemplate: '模特试穿{shoes_type}，{style_description}，合适尺码',
    negativePrompt: '不合脚，变形，低质量',
    maxFileSize: 10,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'footwear'
  },
  'scene-change': {
    id: 'scene-change',
    name: '场景更换',
    description: '更换商品展示的背景场景',
    enabled: true,
    creditCost: 6,
    usageCount: 1123,
    successRate: 94.7,
    avgProcessTime: 5.3,
    endpoint: '/api/ai/scene-change',
    model: 'flux-dev',
    promptTemplate: '{scene_description}背景，{lighting_requirements}，专业摄影',
    negativePrompt: '不协调背景，低质量，模糊',
    maxFileSize: 8,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'background'
  },
  'color-change': {
    id: 'color-change',
    name: '商品换色',
    description: '智能更换商品颜色和材质',
    enabled: true,
    creditCost: 5,
    usageCount: 1567,
    successRate: 96.1,
    avgProcessTime: 4.2,
    endpoint: '/api/ai/color-change',
    model: 'flux-dev',
    promptTemplate: '商品颜色更换为{target_color}，{material_description}，保持质感',
    negativePrompt: '不自然颜色，质感丢失，低质量',
    maxFileSize: 6,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'color'
  },
  'background-removal': {
    id: 'background-removal',
    name: '抠图去底',
    description: '智能抠图和背景移除',
    enabled: true,
    creditCost: 3,
    usageCount: 2234,
    successRate: 97.8,
    avgProcessTime: 2.8,
    endpoint: '/api/ai/background-removal',
    model: 'flux-dev',
    promptTemplate: '精确抠图，{edge_requirements}，透明背景',
    negativePrompt: '边缘粗糙，不准确，低质量',
    maxFileSize: 5,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'editing'
  }
};

// 获取AI模特工具列表
router.get('/', (req, res) => {
  try {
    const toolsList = Object.values(aiModelToolsConfig);
    res.json({
      success: true,
      data: toolsList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取AI模特工具详情
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tool = aiModelToolsConfig[id];
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: '工具不存在'
      });
    }
    
    res.json({
      success: true,
      data: tool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新AI模特工具配置
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!aiModelToolsConfig[id]) {
      return res.status(404).json({
        success: false,
        error: '工具不存在'
      });
    }
    
    // 更新配置
    aiModelToolsConfig[id] = {
      ...aiModelToolsConfig[id],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: aiModelToolsConfig[id],
      message: '配置更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 批量更新工具状态
router.post('/batch-status', (req, res) => {
  try {
    const { ids, enabled } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: 'ids必须是数组'
      });
    }
    
    const updatedTools = [];
    ids.forEach(id => {
      if (aiModelToolsConfig[id]) {
        aiModelToolsConfig[id].enabled = enabled;
        aiModelToolsConfig[id].status = enabled ? 'active' : 'inactive';
        aiModelToolsConfig[id].lastUpdated = new Date().toISOString();
        updatedTools.push(aiModelToolsConfig[id]);
      }
    });
    
    res.json({
      success: true,
      data: updatedTools,
      message: `成功更新${updatedTools.length}个工具状态`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 重置工具配置
router.post('/:id/reset', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!aiModelToolsConfig[id]) {
      return res.status(404).json({
        success: false,
        error: '工具不存在'
      });
    }
    
    // 重置为默认配置（这里简化处理，实际应该有默认配置模板）
    aiModelToolsConfig[id].lastUpdated = new Date().toISOString();
    
    res.json({
      success: true,
      data: aiModelToolsConfig[id],
      message: '配置重置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 批量重置工具配置
router.post('/batch-reset', (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: 'ids必须是数组'
      });
    }
    
    const resetTools = [];
    ids.forEach(id => {
      if (aiModelToolsConfig[id]) {
        aiModelToolsConfig[id].lastUpdated = new Date().toISOString();
        resetTools.push(aiModelToolsConfig[id]);
      }
    });
    
    res.json({
      success: true,
      data: resetTools,
      message: `成功重置${resetTools.length}个工具配置`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取统计数据
router.get('/stats', (req, res) => {
  try {
    const tools = Object.values(aiModelToolsConfig);
    
    const stats = {
      totalUsage: tools.reduce((sum, tool) => sum + tool.usageCount, 0),
      totalCreditsConsumed: tools.reduce((sum, tool) => sum + (tool.usageCount * tool.creditCost), 0),
      enabledTools: tools.filter(tool => tool.enabled).length,
      totalTools: tools.length,
      avgSuccessRate: tools.reduce((sum, tool) => sum + tool.successRate, 0) / tools.length,
      todayUsage: Math.floor(Math.random() * 200) + 50, // 模拟今日使用量
      categories: {
        'model-generation': tools.filter(t => t.category === 'model-generation').length,
        'try-on': tools.filter(t => t.category === 'try-on').length,
        'accessory': tools.filter(t => t.category === 'accessory').length,
        'pose': tools.filter(t => t.category === 'pose').length,
        'video': tools.filter(t => t.category === 'video').length,
        'footwear': tools.filter(t => t.category === 'footwear').length,
        'background': tools.filter(t => t.category === 'background').length,
        'color': tools.filter(t => t.category === 'color').length,
        'editing': tools.filter(t => t.category === 'editing').length
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取工具使用历史
router.get('/:id/history', (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    
    if (!aiModelToolsConfig[id]) {
      return res.status(404).json({
        success: false,
        error: '工具不存在'
      });
    }
    
    // 模拟历史记录数据
    const mockHistory = Array.from({ length: 50 }, (_, index) => ({
      id: `history_${id}_${index}`,
      toolId: id,
      userId: `user_${Math.floor(Math.random() * 100)}`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.1 ? 'success' : 'failed',
      creditsCost: aiModelToolsConfig[id].creditCost,
      processTime: Math.random() * 20 + 2,
      inputParams: {
        prompt: '示例提示词',
        imageCount: 1
      }
    }));
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedHistory = mockHistory.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        records: paginatedHistory,
        total: mockHistory.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 测试工具配置
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const testParams = req.body;
    
    if (!aiModelToolsConfig[id]) {
      return res.status(404).json({
        success: false,
        error: '工具不存在'
      });
    }
    
    const tool = aiModelToolsConfig[id];
    
    // 模拟测试结果
    const testResult = {
      success: Math.random() > 0.2, // 80%成功率
      responseTime: Math.random() * 10 + 2,
      timestamp: new Date().toISOString(),
      toolConfig: {
        id: tool.id,
        name: tool.name,
        model: tool.model,
        endpoint: tool.endpoint
      },
      testParams,
      message: Math.random() > 0.2 ? '测试成功' : '测试失败：连接超时'
    };
    
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;