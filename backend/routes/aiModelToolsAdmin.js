const express = require('express');
const router = express.Router();

// 模拟AI模特工具配置数据
const aiModelToolsConfig = {
  'ai-model': {
    id: 'ai-model',
    name: 'AI模特生成',
    description: '基于服装图片生成专业模特展示效果',
    enabled: true,
    creditCost: 15,
    usageCount: 1234,
    successRate: 92.5,
    avgProcessTime: 15.3,
    endpoint: '/api/ai/ai-model',
    model: 'flux-dev',
    promptTemplate: '专业模特穿着{clothing_description}，{style_requirements}，高质量',
    negativePrompt: '低质量，模糊，变形',
    maxFileSize: 10,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'model'
  },
  'try-on-clothes': {
    id: 'try-on-clothes',
    name: '同版型试衣',
    description: '在相同版型上更换不同服装',
    enabled: true,
    creditCost: 8,
    usageCount: 876,
    successRate: 89.7,
    avgProcessTime: 12.1,
    endpoint: '/api/ai/try-on-clothes',
    model: 'flux-dev',
    promptTemplate: '模特试穿{clothing_type}，{fabric_description}，自然贴合',
    negativePrompt: '不合身，变形，低质量',
    maxFileSize: 8,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'clothing'
  },
  'glasses-tryon': {
    id: 'glasses-tryon',
    name: '配件试戴',
    description: '各类眼镜、帽子等配件的智能试戴',
    enabled: true,
    creditCost: 6,
    usageCount: 654,
    successRate: 93.2,
    avgProcessTime: 8.7,
    endpoint: '/api/ai/glasses-tryon',
    model: 'flux-dev',
    promptTemplate: '模特佩戴{accessory_type}，{style_description}，自然贴合',
    negativePrompt: '不贴合，变形，低质量',
    maxFileSize: 5,
    supportedFormats: ['jpg', 'png', 'webp'],
    lastUpdated: new Date().toISOString(),
    status: 'active',
    category: 'accessory'
  },
  // 隐藏姿态变换功能
  /*
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
  */
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
    
    // 更新指定工具的状态
    ids.forEach(id => {
      if (aiModelToolsConfig[id]) {
        aiModelToolsConfig[id].enabled = enabled;
        aiModelToolsConfig[id].status = enabled ? 'active' : 'inactive';
        aiModelToolsConfig[id].lastUpdated = new Date().toISOString();
      }
    });
    
    res.json({
      success: true,
      message: `成功更新${ids.length}个工具的状态`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取工具使用统计
router.get('/stats/usage', (req, res) => {
  try {
    const stats = Object.values(aiModelToolsConfig).map(tool => ({
      id: tool.id,
      name: tool.name,
      usageCount: tool.usageCount,
      successRate: tool.successRate,
      avgProcessTime: tool.avgProcessTime,
      enabled: tool.enabled
    }));
    
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

// 获取工具性能统计
router.get('/stats/performance', (req, res) => {
  try {
    const performanceData = Object.values(aiModelToolsConfig).map(tool => ({
      id: tool.id,
      name: tool.name,
      successRate: tool.successRate,
      avgProcessTime: tool.avgProcessTime,
      category: tool.category
    }));
    
    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;