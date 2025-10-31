const AITool = require('../models/AiTool');

// 预设工具配置 - 与前端保持一致
const PRESET_TOOLS = [
  {
    identifier: 'ai-model',
    name: 'AI模特生成',
    description: '上传服饰图片，生成专业模特穿着效果图',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 15,
    config: {
      max_resolution: '2560x1440',
      supported_formats: ['image/png', 'image/jpeg'],
      styles: ['商务', '休闲', '运动', '时尚'],
      max_prompt_length: 500
    },
    tags: ['model', 'fashion', 'studio']
  },
  {
    identifier: 'try-on-clothes',
    name: '同版型试衣',
    description: '保持版型一致的试穿效果展示',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 12,
    config: {
      max_resolution: '1920x1080',
      supported_formats: ['image/png', 'image/jpeg'],
      fabric_types: ['棉质', '丝绸', '羊毛', '化纤'],
      styles: ['修身', '宽松', '直筒'],
      max_prompt_length: 300
    },
    tags: ['try-on', 'fashion', 'fit']
  },
  {
    identifier: 'glasses-tryon',
    name: '配件试戴',
    description: '生成眼镜试戴效果图',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 10,
    config: {
      max_resolution: '1920x1080',
      supported_formats: ['image/png', 'image/jpeg'],
      edit_types: ['glasses', 'hat', 'jewelry'],
      styles: ['商务', '潮流', '复古'],
      max_prompt_length: 300
    },
    tags: ['accessory', 'face', 'closeup']
  },
  // 隐藏姿态变换功能
  /*
  {
    identifier: 'pose-variation',
    name: '姿态变换',
    description: '保持人物特征，自动调整姿态',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 9,
    config: {
      max_resolution: '1920x1080',
      supported_formats: ['image/png', 'image/jpeg'],
      styles: ['站立', '坐姿', '走秀', '动态'],
      max_prompt_length: 300
    },
    tags: ['pose', 'modeling']
  },
  */
  {
    identifier: 'shoe-tryon',
    name: '鞋靴试穿',
    description: '生成鞋靴穿着效果图',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 11,
    config: {
      max_resolution: '1920x1080',
      supported_formats: ['image/png', 'image/jpeg'],
      options: ['街拍场景', '棚拍场景'],
      max_prompt_length: 300
    },
    tags: ['footwear', 'product']
  },
  {
    identifier: 'scene-change',
    name: '场景更换',
    description: '快速切换宣传背景场景',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 10,
    config: {
      max_resolution: '2560x1440',
      supported_formats: ['image/png', 'image/jpeg'],
      styles: ['白底', '商业街', '潮流街头', '自然户外'],
      max_prompt_length: 350
    },
    tags: ['background', 'scene']
  },
  {
    identifier: 'color-change',
    name: '商品换色',
    description: '保持材质细节的快速换色',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 8,
    config: {
      max_resolution: '2048x2048',
      supported_formats: ['image/png', 'image/jpeg'],
      options: ['单色', '多色组合', '材质保持'],
      max_prompt_length: 250
    },
    tags: ['color', 'product']
  }
];

async function seedToolPresets() {
  const existedTools = await AITool.find({ identifier: { $in: PRESET_TOOLS.map((tool) => tool.identifier) } });
  const existedIdentifiers = new Set(existedTools.map((tool) => tool.identifier));

  const tasks = PRESET_TOOLS.map(async (preset) => {
    const payload = {
      identifier: preset.identifier,
      name: preset.name,
      description: preset.description,
      type: preset.type,
      category: preset.category,
      credit_cost: preset.credit_cost,
      config: preset.config,
      tags: preset.tags,
      enabled: true
    };

    return AITool.findOneAndUpdate(
      { identifier: preset.identifier },
      { $set: payload, $setOnInsert: { usage_count: 0, success_rate: 0 } },
      { upsert: true, new: true }
    );
  });

  await Promise.all(tasks);
}

module.exports = seedToolPresets;