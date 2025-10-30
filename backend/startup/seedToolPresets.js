const AITool = require('../models/AiTool');

const PRESET_TOOLS = [
  {
    identifier: 'ai-model',
    name: 'AI模特生成',
    description: '上传服装图，生成真实模特展示效果',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 15,
    config: {
      max_resolution: '2560x1440',
      supported_formats: ['image/png', 'image/jpeg', 'image/webp'],
      max_prompt_length: 500,
      resolutions: [
        { label: '0.5K (960×540)', value: '960x540', credits: 10 },
        { label: '1080P (1920×1080)', value: '1920x1080', credits: 15 },
        { label: '2K (2560×1440)', value: '2560x1440', credits: 18 }
      ],
      styles: ['商业摄影', '白底摄影', '街拍风格'],
      batch_processing: false,
      max_batch_size: 1
    },
    tags: ['model', 'fashion', 'studio']
  },
  {
    identifier: 'try-on-clothes',
    name: '同版型试衣',
    description: '保持版型一致的智能试衣效果',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 12,
    config: {
      max_resolution: '1920x1080',
      supported_formats: ['image/png', 'image/jpeg'],
      edit_types: ['fit_adjustment', 'style_transfer'],
      options: ['保留背景', '替换背景', '同步光照'],
      max_prompt_length: 400
    },
    tags: ['tryon', 'fit', 'fashion']
  },
  {
    identifier: 'glasses-tryon',
    name: '配件试戴',
    description: '眼镜、帽饰等配件智能试戴',
    type: 'image_generation',
    category: '创意生成',
    credit_cost: 10,
    config: {
      max_resolution: '1024x1024',
      supported_formats: ['image/png', 'image/jpeg'],
      edit_types: ['glasses', 'hat', 'jewelry'],
      styles: ['商务', '潮流', '复古'],
      max_prompt_length: 300
    },
    tags: ['accessory', 'face', 'closeup']
  },
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
