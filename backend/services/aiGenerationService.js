const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const AIGeneration = require('../models/AIGeneration');
const AITool = require('../models/AiTool');
const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');

// 导入新的AI模型服务
const aiModelService = require('./aiModelService');

const fetchImpl = typeof fetch === 'function' ? fetch : (...args) => import('node-fetch').then(({ default: nodeFetch }) => nodeFetch(...args));

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || 'http://localhost:9001';
const USER_ASSET_LIMIT = parseInt(process.env.USER_ASSET_LIMIT || '200', 10);
const USER_ASSET_SLICE = Number.isFinite(USER_ASSET_LIMIT) && USER_ASSET_LIMIT > 0 ? -USER_ASSET_LIMIT : -200;

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
    description: '眼镜、帽饰等配件的试戴可视化',
    type: 'image_generation',
    category: '创意生成',
    creditCost: 10,
    tags: ['accessory', 'face', 'closeup'],
    promptTemplate: '模特佩戴{accessory_type}，面部特写，自然表情，高清质感',
    defaultOptions: {
      accessory_type: '时尚配饰',
      accessory_category: '眼镜'
    }
  },
  'pose-variation': {
    name: '姿态变换',
    description: '在保持人物特征的基础上调整姿态',
    type: 'image_generation',
    category: '创意生成',
    creditCost: 9,
    tags: ['pose', 'modeling'],
    promptTemplate: '模特姿态调整，{pose_description}，稳定构图，真实质感',
    defaultOptions: {
      pose_description: '自然动态姿态',
      pose_type: '站立'
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
    accessory_type: options.accessory_type || defaultOptions.accessory_type || '时尚配饰',
    accessory_category: options.accessory_category || defaultOptions.accessory_category || '眼镜',
    pose_description: options.pose_description || defaultOptions.pose_description || '自然动态姿态',
    pose_type: options.pose_type || defaultOptions.pose_type || '站立',
    shoe_description: options.shoe_description || defaultOptions.shoe_description || '潮流鞋靴',
    shoe_type: options.shoe_type || defaultOptions.shoe_type || '运动鞋',
    scene_description: options.scene_description || defaultOptions.scene_description || '高级商业背景',
    scene_type: options.scene_type || defaultOptions.scene_type || '室内',
    target_color: options.target_color || defaultOptions.target_color || '目标色彩',
    target_color_name: options.target_color_name || defaultOptions.target_color_name || '红色'
  };

  // 根据不同的工具类型生成更精细的提示词
  switch (catalogConfig.identifier) {
    case 'ai-model':
      // AI模特生成 - 根据服装类型和风格生成更具体的描述
      if (options.product_type) {
        placeholderValues.product_description = `${options.product_type}展示`;
      }
      if (options.style) {
        placeholderValues.product_description += `，${options.style}风格`;
      }
      break;
      
    case 'try-on-clothes':
      // 同版型试衣 - 根据面料和款式生成描述
      if (options.fabric_type) {
        placeholderValues.fabric_description = `${options.fabric_type}面料`;
      }
      if (options.clothing_style) {
        placeholderValues.fabric_description += `，${options.clothing_style}款式`;
      }
      break;
      
    case 'glasses-tryon':
      // 配件试戴 - 根据配件类型生成描述
      if (options.accessory_category) {
        placeholderValues.accessory_type = options.accessory_category;
      }
      break;
      
    case 'pose-variation':
      // 姿态变换 - 根据姿态类型生成描述
      if (options.pose_type) {
        placeholderValues.pose_description = options.pose_type;
      }
      break;
      
    case 'shoe-tryon':
      // 鞋靴试穿 - 根据鞋类生成描述
      if (options.shoe_type) {
        placeholderValues.shoe_description = options.shoe_type;
      }
      break;
      
    case 'scene-change':
      // 场景更换 - 根据场景类型生成描述
      if (options.scene_type) {
        placeholderValues.scene_description = options.scene_type;
      }
      break;
      
    case 'color-change':
      // 商品换色 - 根据颜色生成描述
      if (options.target_color_name) {
        placeholderValues.target_color = options.target_color_name;
      }
      break;
  }

  // 当用户传入了提示词就用用户的，当没有提示词就用内置的提示词模板
  let basePrompt = catalogConfig.promptTemplate; // 默认使用内置模板
  if (body.prompt && body.prompt.trim().length > 0) {
    basePrompt = body.prompt; // 使用用户提供的提示词
  }

  // 替换模板中的占位符
  const userPrompt = basePrompt.replace(/\{(\w+)_description\}/g, (_, key) => {
    const descriptorKey = `${key}_description`;
    return placeholderValues[descriptorKey] || placeholderValues[key] || '';
  }).replace(/\{(\w+)\}/g, (_, key) => placeholderValues[key] || '');

  return userPrompt;
};

const buildFastApiPayload = (body, files, catalogConfig) => {
  let options = {};
  let metadata = {};

  if (body.options) {
    try {
      options = typeof body.options === 'string' ? JSON.parse(body.options) : body.options;
    } catch (error) {
      throw new Error('选项参数格式错误，必须为JSON字符串');
    }
  }

  if (body.metadata) {
    try {
      metadata = typeof body.metadata === 'string' ? JSON.parse(body.metadata) : body.metadata;
    } catch (error) {
      throw new Error('metadata 参数格式错误，必须为JSON字符串');
    }
  }

  const resolutionKey = options.resolution || '1080p';
  const resolution = RESOLUTION_PRESETS[resolutionKey] || RESOLUTION_PRESETS['1080p'];

  // 生成更精细的提示词
  const userPrompt = generateDetailedPrompt(body, files, catalogConfig, options);

  return {
    user_prompt: userPrompt,
    options: {
      ...options,
      resolution: resolutionKey,
      resolution_detail: resolution,
      quantity: Number(options.quantity) || 1
    },
    images: mapFilesToPayload(files),
    metadata: {
      resolution,
      origin: 'node-backend',
      ...metadata
    }
  };
};

const callFastApiService = async (toolKey, payload) => {
  const response = await fetchImpl(`${AI_SERVICE_BASE_URL}/generate/${toolKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = errorPayload?.detail || errorPayload?.error || 'AI服务调用失败';
    const status = response.status;
    throw new Error(`AI服务错误(${status}): ${message}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'AI服务返回失败状态');
  }

  return result;
};

const buildUserAssetDocuments = (savedImages, fastApiResult, generationRecord, toolKey) => {
  const now = new Date();
  const resolutionMeta = fastApiResult.metadata?.resolution || {};

  return savedImages.map((imageMeta, index) => ({
    generation_id: generationRecord._id,
    tool_key: toolKey,
    tool_id: generationRecord.tool_id,
    public_url: imageMeta.publicUrl,
    file_name: imageMeta.fileName,
    mime_type: fastApiResult.images[index]?.mime_type || 'image/png',
    width: resolutionMeta.width,
    height: resolutionMeta.height,
    index,
    created_at: now,
    expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }));
};

const generateWithTool = async ({ toolKey, userId, body, files }) => {
  const catalogConfig = TOOL_CATALOG[toolKey];
  if (!catalogConfig) {
    throw new Error(`暂不支持的工具类型: ${toolKey}`);
  }

  // 添加工具标识符到配置中
  catalogConfig.identifier = toolKey;

  const userDoc = await User.findById(userId);
  if (!userDoc) {
    throw new Error('用户不存在');
  }

  if (userDoc.credits_balance < catalogConfig.creditCost) {
    throw new Error('积分不足，请先充值或升级套餐');
  }

  const aiToolDoc = await ensureAiToolRecord(toolKey);
  
  // 特殊处理AI模特生成功能
  if (toolKey === 'ai-model') {
    return await generateAIModelImage({ toolKey, userId, body, files, catalogConfig, aiToolDoc });
  }

  // 原有的处理逻辑
  const payload = buildFastApiPayload(body, files, catalogConfig);
  payload.metadata = {
    ...(payload.metadata || {}),
    userId,
    requestId: `${toolKey}-${Date.now()}`
  };

  const fastApiResult = await callFastApiService(toolKey, payload);

  const dataUrls = fastApiResult.images.map((image) => `data:${image.mime_type};base64,${image.data}`);
  const savedImages = fastApiResult.images.map((image) => saveImageToDisk(image.data, image.mime_type, toolKey));

  const session = await mongoose.startSession();
  let generationRecord;

  try {
    await session.withTransaction(async () => {
      // 更新用户积分
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { credits_balance: -catalogConfig.creditCost }
        },
        { new: true, session }
      );

      if (!updatedUser || updatedUser.credits_balance < 0) {
        throw new Error('积分扣减失败或积分不足');
      }

      // 记录积分消费明细
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
            generation_id: null // 将在后面更新
          }
        }
      ], { session });

      // 创建生成记录
      generationRecord = await AIGeneration.create([{
        user_id: userId,
        tool_key: toolKey,
        tool_id: aiToolDoc._id,
        input_data: {
          prompt: payload.user_prompt,
          options: payload.options,
          files: payload.images.map(({ file_name, role, mime_type }) => ({ file_name, role, mime_type }))
        },
        output_data: {
          images: savedImages,
          data_urls: dataUrls,
          text_outputs: fastApiResult.text_outputs || []
        },
        status: 'completed',
        credits_used: catalogConfig.creditCost,
        processing_time: Math.round((fastApiResult.timing_ms || 0) / 1000),
        metadata: {
          prompt: fastApiResult.built_prompt,
          model_id: fastApiResult.metadata?.model_id,
          aspect_ratio: fastApiResult.metadata?.aspect_ratio,
          resolution: fastApiResult.metadata?.resolution
        },
        error_message: null
      }], { session });

      generationRecord = generationRecord[0];

      // 更新积分记录中的生成ID
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
        { session }
      );

      // 更新工具使用统计
      await AITool.findByIdAndUpdate(
        aiToolDoc._id,
        {
          $inc: { 
            usage_count: 1,
            total_credits_charged: catalogConfig.creditCost
          }
        },
        { session }
      );

      const userAssets = buildUserAssetDocuments(savedImages, fastApiResult, generationRecord, toolKey);

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
          { session }
        );
      }

      const totalCreditsCharged = catalogConfig.creditCost;
      await AIGeneration.updateOne(
        { _id: generationRecord._id },
        {
          $set: {
            total_credits_charged: totalCreditsCharged,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return {
    record: generationRecord,
    tool: aiToolDoc,
    creditsUsed: catalogConfig.creditCost,
    result: {
      ...fastApiResult,
      images: fastApiResult.images.map((image, index) => ({
        ...image,
        data_url: dataUrls[index],
        public_url: savedImages[index]?.publicUrl,
        file_name: savedImages[index]?.fileName
      }))
    }
  };
};

// 新增AI模特图片生成函数
const generateAIModelImage = async ({ toolKey, userId, body, files, catalogConfig, aiToolDoc }) => {
  try {
    // 验证输入文件
    if (!files || files.length < 2) {
      throw new Error('AI模特生成需要至少两张图片：服装图和真人参考照');
    }

    // 提取图片数据
    const clothingImage = files[0]; // 服装图
    const faceImage = files[1];     // 真人参考照

    // 将图片转换为base64
    const clothingBase64 = clothingImage.buffer.toString('base64');
    const faceBase64 = faceImage.buffer.toString('base64');

    // 构建提示词 - 当用户传入了提示词就用用户的，当没有提示词就用内置的提示词模板
    let prompt = catalogConfig.promptTemplate; // 默认使用内置模板
    if (body.prompt && body.prompt.trim().length > 0) {
      prompt = body.prompt; // 使用用户提供的提示词
    }

    // 调用AI服务生成图片
    const aiResult = await aiModelService.generateModelImage(clothingBase64, faceBase64, prompt);

    // 构造返回结果
    const result = {
      images: [
        {
          index: 0,
          data: (await fs.readFile(aiResult.filePath)).toString('base64'),
          mime_type: 'image/png',
          size_bytes: (await fs.stat(aiResult.filePath)).size,
          data_url: `data:image/png;base64,${(await fs.readFile(aiResult.filePath)).toString('base64')}`,
          public_url: aiResult.publicUrl,
          file_name: aiResult.fileName
        }
      ],
      text_outputs: [],
      timing_ms: 5000, // 模拟处理时间
      built_prompt: prompt,
      metadata: {
        model_id: "gemini-2.5-flash-image",
        aspect_ratio: "16:9",
        resolution: "1920x1080",
        mode: "fast",
        quantity_request: 1
      }
    };

    // 扣除用户积分
    const session = await mongoose.startSession();
    let generationRecord;

    try {
      await session.withTransaction(async () => {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $inc: { credits_balance: -catalogConfig.creditCost }
          },
          { new: true, session }
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
              credit_cost: catalogConfig.creditCost
            }
          }
        ], { session });

        generationRecord = await AIGeneration.create([{
          user_id: userId,
          tool_key: toolKey,
          tool_id: aiToolDoc._id,
          input_data: {
            prompt: prompt,
            options: body.options || {},
            files: [
              { file_name: clothingImage.originalname, role: 'clothing', mime_type: clothingImage.mimetype },
              { file_name: faceImage.originalname, role: 'face', mime_type: faceImage.mimetype }
            ]
          },
          output_data: {
            images: [aiResult],
            data_urls: [result.images[0].data_url],
            text_outputs: []
          },
          status: 'completed',
          credits_used: catalogConfig.creditCost,
          processing_time: 5, // 模拟处理时间
          metadata: {
            prompt: prompt,
            model_id: "gemini-2.5-flash-image",
            aspect_ratio: "16:9",
            resolution: "1920x1080"
          },
          error_message: null
        }], { session });

        generationRecord = generationRecord[0];

        const userAssets = [{
          generation_id: generationRecord._id,
          tool_key: toolKey,
          tool_id: aiToolDoc._id,
          public_url: aiResult.publicUrl,
          file_name: aiResult.fileName,
          mime_type: 'image/png',
          width: 1920,
          height: 1080,
          index: 0,
          created_at: new Date(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }];

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
            { session }
          );
        }

        const totalCreditsCharged = catalogConfig.creditCost;
        await AIGeneration.updateOne(
          { _id: generationRecord._id },
          {
            $set: {
              total_credits_charged: totalCreditsCharged,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    return {
      record: generationRecord,
      tool: aiToolDoc,
      creditsUsed: catalogConfig.creditCost,
      result: result
    };
  } catch (error) {
    console.error('AI模特图片生成失败:', error);
    throw new Error(`AI模特图片生成失败: ${error.message}`);
  }
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
        _id: '$metadata.tool_key',
        total: { $sum: 1 },
        credits: { $sum: { $abs: '$amount' } }
      }
    },
    { $sort: { credits: -1 } }
  ]);
  
  return stats;
};

module.exports = {
  generateWithTool,
  getPaginatedHistory,
  getHistoryRecord,
  getGenerationStats,
  getToolUsageStats,
  getUserCreditStats,
  TOOL_CATALOG,
  RESOLUTION_PRESETS
};