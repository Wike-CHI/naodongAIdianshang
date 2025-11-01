const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const AIGeneration = require('../models/AIGeneration');
const AITool = require('../models/AiTool');
const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');

// 导入新的AI模型服务
const aiModelService = require('./aiModelService');
const aiHubMixService = require('./aiHubMixService');

const nanobananaIntegration = require('./nanobananaIntegration');

const USER_ASSET_LIMIT = parseInt(process.env.USER_ASSET_LIMIT || '200', 10);
const USER_ASSET_SLICE = Number.isFinite(USER_ASSET_LIMIT) && USER_ASSET_LIMIT > 0 ? -USER_ASSET_LIMIT : -200;

// 工具目录配置
const TOOL_CATALOG = {
  'ai-model': {
    name: 'AI模特生成',
    description: '上传服饰图片，生成专业模特穿着效果图',
    type: 'image_generation',
    category: '创意生成',
    creditCost: 15,
    tags: ['model', 'fashion', 'studio'],
    promptTemplate: '高清商业摄影模特，{product_description}，专业灯光，真实肤质',
    defaultOptions: {
      product_description: '时尚服饰展示',
      product_type: '服装',
      style: '时尚'
    }
  },
  'try-on-clothes': {
    name: '同版型试衣',
    description: '保持版型一致的试穿效果展示',
    type: 'image_generation',
    category: '创意生成',
    creditCost: 12,
    tags: ['try-on', 'fashion', 'fit'],
    promptTemplate: '同版型试穿展示，{fabric_description}，自然姿态，真实合身效果',
    defaultOptions: {
      fabric_description: '高品质面料',
      fabric_type: '棉质',
      clothing_style: '修身'
    }
  },
  'glasses-tryon': {
    name: '配件试戴',
    description: '眼镜试戴效果图生成',
    type: 'image_generation',
    category: '创意生成',
    creditCost: 10,
    tags: ['accessory', 'face', 'closeup'],
    promptTemplate: '模特佩戴{accessory_type}，面部特写，自然表情，高清质感',
    defaultOptions: {
      accessory_type: '眼镜',
      accessory_category: '眼镜'
    }
  },
  'shoe-tryon': {
    name: '鞋靴试穿',
    description: '鞋靴电商穿着效果图生成',
    type: 'image_generation',
    category: '创意生成',
    creditCost: 11,
    tags: ['shoes', 'footwear'],
    promptTemplate: '鞋靴试穿展示，{shoe_description}，适配脚型，专业灯光',
    defaultOptions: {
      shoe_description: '潮流鞋靴',
      shoe_type: '运动鞋'
    }
  },
  'scene-change': {
    name: '场景更换',
    description: '替换背景场景以匹配商品氛围',
    type: 'image_generation',
    category: '创意生成',
    creditCost: 10,
    tags: ['scene', 'background'],
    promptTemplate: '商品展示背景替换为{scene_description}，协调光影，高级质感',
    defaultOptions: {
      scene_description: '高级商业背景',
      scene_type: '室内'
    }
  },
  'color-change': {
    name: '商品换色',
    description: '保持材质不变的商品快速换色',
    type: 'image_generation',
    category: '创意生成',
    creditCost: 8,
    tags: ['color', 'product'],
    promptTemplate: '商品换色，目标颜色{target_color}，保留材质质感',
    defaultOptions: {
      target_color: '目标色彩',
      target_color_name: '红色'
    }
  }
};

const RESOLUTION_PRESETS = {
  '0.5k': { width: 960, height: 540, label: '0.5K (960×540)' },
  '1080p': { width: 1920, height: 1080, label: '1080P (1920×1080)' },
  '2k': { width: 2560, height: 1440, label: '2K (2560×1440)' }
};

const ensureOutputDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const saveImageToDisk = (base64Data, mimeType, toolKey) => {
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1] || 'png';
  const outputDir = path.join(__dirname, '..', 'generated');
  ensureOutputDir(outputDir);
  const fileName = `${toolKey}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, buffer);
  return {
    filePath: outputPath,
    fileName,
    publicUrl: `/generated/${fileName}`
  };
};

const ensureAiToolRecord = async (toolKey) => {
  const config = TOOL_CATALOG[toolKey];
  if (!config) {
    throw new Error(`未识别的工具: ${toolKey}`);
  }

  const update = {
    identifier: toolKey,
    name: config.name,
    description: config.description,
    type: config.type,
    config: {
      max_resolution: '2560x1440',
      max_prompt_length: 500,
      supported_formats: ['image/png', 'image/jpeg', 'image/webp'],
      resolutions: Object.values(RESOLUTION_PRESETS).map((preset) => ({
        label: preset.label,
        value: `${preset.width}x${preset.height}`,
        credits: config.creditCost
      })),
      batch_processing: false,
      max_batch_size: 1
    },
    credit_cost: config.creditCost,
    enabled: true,
    tags: config.tags,
    category: config.category,
    prompt_template: config.promptTemplate
  };

  const tool = await AITool.findOneAndUpdate({ identifier: toolKey }, { $set: update }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  return tool;
};

const mapFilesToPayload = (files = []) => {
  return files.map((file, index) => {
    let role = 'reference';
    if (index === 0) {
      role = 'base_model';
    } else if (index === 1) {
      role = 'face_reference';
    } else {
      role = `reference_${index}`;
    }

    return {
      data: file.buffer.toString('base64'),
      mime_type: file.mimetype,
      role,
      file_name: file.originalname
    };
  });
};

// 更精细的提示词生成函数
const generateDetailedPrompt = (body, files, catalogConfig, options) => {
  // 获取工具的默认选项
  const defaultOptions = catalogConfig.defaultOptions || {};
  
  // 基础占位符值，优先使用传入的选项，其次使用工具默认选项
  const placeholderValues = {
    product_description: options.product_description || defaultOptions.product_description || '时尚服饰展示',
    product_type: options.product_type || defaultOptions.product_type || '服装',
    style: options.style || defaultOptions.style || '时尚',
    fabric_description: options.fabric_description || defaultOptions.fabric_description || '高品质面料',
    fabric_type: options.fabric_type || defaultOptions.fabric_type || '棉质',
    clothing_style: options.clothing_style || defaultOptions.clothing_style || '修身',
    accessory_type: options.accessory_type || defaultOptions.accessory_type || '眼镜',
    accessory_category: options.accessory_category || defaultOptions.accessory_category || '眼镜',
    shoe_description: options.shoe_description || defaultOptions.shoe_description || '潮流鞋靴',
    shoe_type: options.shoe_type || defaultOptions.shoe_type || '运动鞋',
    scene_description: options.scene_description || defaultOptions.scene_description || '高级商业背景',
    scene_type: options.scene_type || defaultOptions.scene_type || '室内',
    target_color: options.target_color || defaultOptions.target_color || '目标色彩',
    target_color_name: options.target_color_name || defaultOptions.target_color_name || '红色'
  };

  // 使用占位符值替换模板中的变量
  let prompt = catalogConfig.promptTemplate || '';
  Object.entries(placeholderValues).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    prompt = prompt.replace(regex, value);
  });

  // 如果有自定义提示词，则追加
  if (body.prompt && body.prompt.trim()) {
    prompt += `, ${body.prompt.trim()}`;
  }

  return prompt;
};

// 构建服务选项
const buildServiceOptions = (body = {}) => {
  try {
    const options = typeof body.options === 'string' ? JSON.parse(body.options) : body.options || {};
    return {
      resolution: options.resolution || '1080p',
      quantity: parseInt(options.quantity) || 1,
      mode: options.mode || 'fast',
      ...options
    };
  } catch (error) {
    console.warn('解析选项失败，使用默认选项:', error);
    return {
      resolution: '1080p',
      quantity: 1,
      mode: 'fast'
    };
  }
};

// 构建元数据
const buildServiceMetadata = (body = {}) => {
  try {
    return typeof body.metadata === 'string' ? JSON.parse(body.metadata) : body.metadata || {};
  } catch (error) {
    console.warn('解析元数据失败，使用空对象:', error);
    return {};
  }
};

// 生成AI图片（使用AIHubMix服务）
const generateAIImage = async ({ toolKey, userId, body, files, catalogConfig, aiToolDoc }) => {
  try {
    console.log(`开始调用AIHubMix服务生成AI图片... 工具: ${toolKey}`);
    
    // 检查用户
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      throw new Error('用户不存在');
    }

    // 检查积分
    if (userDoc.credits_balance < catalogConfig.creditCost) {
      throw new Error('积分不足，请先充值或升级套餐');
    }

    // 准备图像数据
    const images = mapFilesToPayload(files);
    
    // 调用AIHubMix服务生成图片
    const result = await aiHubMixService.generateImage(toolKey, images, body.prompt, userId);

    // AIHubMix服务返回的结果结构不同，需要重新组织返回数据
    return {
      record: null, // AIHubMix服务内部已处理数据库记录，这里不需要返回记录
      tool: aiToolDoc,
      creditsUsed: catalogConfig.creditCost,
      result: result
    };
  } catch (error) {
    console.error('AIHubMix生成失败:', error);
    throw new Error(`AIHubMix生成失败: ${error.message}`);
  }
};

const generateWithTool = async ({ toolKey, userId, body, files }) => {
  const catalogConfig = TOOL_CATALOG[toolKey];
  if (!catalogConfig) {
    throw new Error(`暂不支持的工具类型: ${toolKey}`);
  }

  catalogConfig.identifier = toolKey;

  const userDoc = await User.findById(userId);
  if (!userDoc) {
    throw new Error('用户不存在');
  }

  if (userDoc.credits_balance < catalogConfig.creditCost) {
    throw new Error('积分不足，请先充值或升级套餐');
  }

  const aiToolDoc = await ensureAiToolRecord(toolKey);

  // 对于所有工具，使用AIHubMix服务
  return await generateAIImage({ toolKey, userId, body, files, catalogConfig, aiToolDoc });

  // 以下代码已废弃，因为所有工具都使用AIHubMix服务
  /*
  const options = buildServiceOptions(body);
  const metadata = buildServiceMetadata(body);
  const prompt = generateDetailedPrompt(body, files, catalogConfig, options);

  const payload = {
    prompt,
    options,
    images: mapFilesToPayload(files),
    metadata: {
      ...metadata,
      userId,
      requestId: `${toolKey}-${Date.now()}`
    }
  };

  const providerResult = await nanobananaIntegration.generateImage(toolKey, payload);

  const normalizedImages = (providerResult.images || []).map((image, index) => {
    const mimeType = image.mime_type || image.mimeType || 'image/png';
    const base64Data = image.data || image.data_base64 || image.base64;
    const dataUrl = image.data_url || (base64Data ? `data:${mimeType};base64,${base64Data}` : undefined);

    return {
      index,
      mimeType,
      base64Data,
      dataUrl,
      width: image.width,
      height: image.height
    };
  });

  if (!normalizedImages.length) {
    throw new Error('生成服务未返回任何图像');
  }

  const savedImages = normalizedImages.map((image) => {
    const stored = saveImageToDisk(image.base64Data, image.mimeType, toolKey);
    return {
      ...stored,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height
    };
  });

  const dataUrls = normalizedImages.map((image) => image.dataUrl || `data:${image.mimeType};base64,${image.base64Data}`);

  const promptMetadata = providerResult.metadata || {};
  const transactionSession = await mongoose.startSession();
  let generationRecord;

  try {
    await transactionSession.withTransaction(async () => {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { credits_balance: -catalogConfig.creditCost }
        },
        { new: true, session: transactionSession }
      );

      if (!updatedUser || updatedUser.credits_balance < 0) {
        throw new Error('积分扣减失败或积分不足');
      }

      await CreditRecord.create([
        {
          user_id: userId,
          type: 'consumption',
          amount: -catalogConfig.creditCost,
          balance_before: updatedUser.credits_balance + catalogConfig.creditCost,
          balance_after: updatedUser.credits_balance,
          description: `${catalogConfig.name} 生成扣减`,
          metadata: {
            tool_key: toolKey,
            credit_cost: catalogConfig.creditCost,
            generation_id: null
          }
        }
      ], { session: transactionSession });

      generationRecord = await AIGeneration.create([{
        user_id: userId,
        tool_key: toolKey,
        tool_id: aiToolDoc._id,
        input_data: {
          prompt,
          options,
          files: payload.images.map(({ file_name, role, mime_type }) => ({ file_name, role, mime_type }))
        },
        output_data: {
          images: savedImages,
          data_urls: dataUrls,
          text_outputs: providerResult.text_outputs || []
        },
        status: 'completed',
        credits_used: catalogConfig.creditCost,
        processing_time: Math.round((providerResult.timing_ms || 0) / 1000),
        metadata: {
          prompt: promptMetadata.prompt || prompt,
          model_id: promptMetadata.model_id,
          aspect_ratio: promptMetadata.aspect_ratio,
          resolution: promptMetadata.resolution
        },
        error_message: null
      }], { session: transactionSession });

      generationRecord = generationRecord[0];

      await CreditRecord.updateOne(
        {
          user_id: userId,
          type: 'consumption',
          'metadata.tool_key': toolKey
        },
        {
          $set: {
            'metadata.generation_id': generationRecord._id
          }
        },
        { session: transactionSession }
      );

      await AITool.findByIdAndUpdate(
        aiToolDoc._id,
        {
          $inc: {
            usage_count: 1,
            total_credits_charged: catalogConfig.creditCost
          }
        },
        { session: transactionSession }
      );

      const userAssets = buildUserAssetDocuments(savedImages, generationRecord, toolKey);

      if (userAssets.length) {
        await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              generated_assets: {
                $each: userAssets,
                $slice: USER_ASSET_SLICE
              }
            }
          },
          { session: transactionSession }
        );
      }

      await AIGeneration.updateOne(
        { _id: generationRecord._id },
        {
          $set: {
            total_credits_charged: catalogConfig.creditCost,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        },
        { session: transactionSession }
      );
    });
  } finally {
    await transactionSession.endSession();
  }

  return {
    record: generationRecord,
    tool: aiToolDoc,
    creditsUsed: catalogConfig.creditCost,
    result: {
      success: true,
      images: savedImages.map((image, index) => ({
        index,
        mimeType: image.mimeType,
        data_url: image.dataUrl,
        public_url: image.publicUrl,
        file_path: image.filePath,
        file_name: image.fileName,
        width: image.width,
        height: image.height
      })),
      text_outputs: providerResult.text_outputs || [],
      timing_ms: providerResult.timing_ms || 0
    }
  };
  */
};

// 构建用户资产文档
const buildUserAssetDocuments = (savedImages, generationRecord, toolKey) => {
  return savedImages.map((image) => ({
    generation_id: generationRecord._id,
    tool_key: toolKey,
    file_path: image.filePath,
    file_name: image.fileName,
    public_url: image.publicUrl,
    mime_type: image.mimeType,
    created_at: new Date()
  }));
};

const buildToolUsagePipeline = ({ userId, includeAdminView, startDate }) => {
  const matchStage = {};
  if (userId && !includeAdminView) {
    matchStage.user_id = mongoose.Types.ObjectId(userId);
  }
  if (startDate) {
    matchStage.created_at = { $gte: startDate };
  }

  return [
    { $match: matchStage },
    {
      $group: {
        _id: '$tool_key',
        total: { $sum: 1 },
        credits: { $sum: '$credits_used' },
        avg_time: { $avg: '$processing_time' }
      }
    },
    { $sort: { total: -1 } }
  ];
};

const buildStatusPipeline = ({ userId, includeAdminView, days }) => {
  const matchStage = {};
  if (userId && !includeAdminView) {
    matchStage.user_id = mongoose.Types.ObjectId(userId);
  }
  if (days) {
    matchStage.created_at = {
      $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    };
  }

  return [
    { $match: Object.keys(matchStage).length ? matchStage : {} },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
};

const getPaginatedHistory = async ({ userId, page = 1, limit = 20, toolId, status, days, includeAdminView = false }) => {
  const filter = {};

  if (userId && !includeAdminView) {
    filter.user_id = userId;
  } else if (includeAdminView && userId) {
    filter.user_id = userId;
  }

  if (toolId) {
    filter.tool_key = toolId;
  }

  if (status) {
    filter.status = status;
  }

  if (days) {
    filter.created_at = {
      $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    };
  }

  const recordsQuery = AIGeneration.find(filter)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('tool_id', 'name credit_cost')
    .populate('user_id', 'username email')
    .lean();

  const [records, total] = await Promise.all([
    recordsQuery,
    AIGeneration.countDocuments(filter)
  ]);

  return {
    records,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getHistoryRecord = async ({ recordId, userId, remove = false }) => {
  const filter = { _id: recordId };
  if (userId) {
    filter.user_id = userId;
  }

  if (remove) {
    return AIGeneration.findOneAndDelete(filter);
  }

  return AIGeneration.findOne(filter)
    .populate('tool_id', 'name credit_cost config')
    .lean();
};

const getGenerationStats = async ({ userId, includeAdminView = false }) => {
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const matchFilter = userId && !includeAdminView ? { user_id: mongoose.Types.ObjectId(userId) } : {};

  const [toolUsage, statusStats, recentRecords, totalCredits] = await Promise.all([
    AIGeneration.aggregate(buildToolUsagePipeline({ userId, includeAdminView, startDate })),
    AIGeneration.aggregate(buildStatusPipeline({ userId, includeAdminView, days: 30 })),
    AIGeneration.find(matchFilter)
      .sort({ created_at: -1 })
      .limit(10)
      .select('tool_key status credits_used created_at processing_time')
      .lean(),
    AIGeneration.aggregate([
      { $match: { ...matchFilter, created_at: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalCredits: { $sum: '$credits_used' },
          totalGenerations: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    toolUsage,
    statusStats,
    recentRecords,
    summary: {
      totalCredits: totalCredits[0]?.totalCredits || 0,
      totalGenerations: totalCredits[0]?.totalGenerations || 0
    }
  };
};

// 新增获取工具使用统计的函数
const getToolUsageStats = async (days = 30) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await AIGeneration.aggregate([
    { 
      $match: { 
        created_at: { $gte: startDate } 
      } 
    },
    {
      $group: {
        _id: '$tool_key',
        total: { $sum: 1 },
        credits: { $sum: '$credits_used' },
        avg_time: { $avg: '$processing_time' }
      }
    },
    { $sort: { total: -1 } }
  ]);
  
  return stats;
};

// 新增获取用户积分消费统计的函数
const getUserCreditStats = async (userId, days = 30) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await CreditRecord.aggregate([
    {
      $match: {
        user_id: mongoose.Types.ObjectId(userId),
        type: 'consumption',
        created_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return stats;
};

// 新增获取用户个人统计信息的函数
const getUserPersonalStats = async (userId) => {
  try {
    // 获取用户总生成次数和累计消耗积分
    const generationStats = await AIGeneration.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalGenerations: { $sum: 1 },
          totalCreditsUsed: { $sum: '$credits_used' }
        }
      }
    ]);

    // 获取用户最常用的工具
    const toolUsageStats = await AIGeneration.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: '$tool_key',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 1
      }
    ]);

    // 获取用户最近的生成记录
    const recentRecords = await AIGeneration.find({
      user_id: userId
    })
    .sort({ created_at: -1 })
    .limit(5)
    .select('tool_key credits_used created_at')
    .lean();

    return {
      totalGenerations: generationStats[0]?.totalGenerations || 0,
      totalCreditsUsed: Math.abs(generationStats[0]?.totalCreditsUsed || 0),
      mostUsedTool: toolUsageStats[0]?._id || null,
      recentRecords: recentRecords
    };
  } catch (error) {
    console.error('获取用户个人统计信息失败:', error);
    throw error;
  }
};

module.exports = {
  generateWithTool,
  getPaginatedHistory,
  getGenerationStats,
  getHistoryRecord,
  getToolUsageStats,
  getUserCreditStats,
  getUserPersonalStats
};