const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

// 导入模型
const AIGeneration = require('../models/AIGeneration');
const AITool = require('../models/AiTool');
const User = require('../models/User');
const CreditRecord = require('../models/CreditRecord');

class AIHubMixService {
  constructor() {
    // 从环境变量获取配置
    this.apiKey = process.env.NANOBANANA_API_KEY || 'sk-0EbSrOEdrPEXmT9g7a5123Ca99E345528d94D2Fd057dAaC3';
    this.baseUrl = 'https://aihubmix.com/v1';
    this.model = 'gemini-2.5-flash-image';
    this.timeout = 60000; // 60秒超时
    
    // 确保生成目录存在
    this.generatedDir = path.join(__dirname, '..', 'generated');
    this.ensureDirExists(this.generatedDir);
  }

  async ensureDirExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      // 如果目录不存在，创建它
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // 工具配置
  toolConfigs = {
    'ai-model': {
      name: 'AI模特生成',
      description: '上传服饰图片，生成专业模特穿着效果图',
      creditCost: 15,
      instruction: "Seamlessly replace the face in the first image with the face from the second image. Maintain the original lighting, angle, and style. Make it look natural and professional."
    },
    'try-on-clothes': {
      name: '同版型试衣',
      description: '保持版型一致的试穿效果展示',
      creditCost: 12,
      instruction: "Replace the clothing on the person in the first image with the clothing from the second image. Keep the person's pose, body shape, and face exactly the same. Only change the clothes to match the style, fit, and appearance from the second image. Ensure realistic lighting, shadows, and natural wrinkles/folds in the fabric."
    },
    'glasses-tryon': {
      name: '配件试戴',
      description: '眼镜试戴效果图生成',
      creditCost: 10,
      instruction: "Take the glasses (or other accessory) from the second image and place them onto the face in the first image. The glasses must fit perfectly on the person's face - adjust the size, angle, rotation, and position to match the face's perspective and proportions exactly. Ensure the glasses appear natural with proper shadows, reflections, and lighting. The glasses should look like they are actually being worn by the person, not just overlaid. Pay extremely close attention to: 1) Correct size relative to face, 2) Proper angle matching face orientation, 3) Natural positioning on nose and ears, 4) Realistic shadows and reflections, 5) Integration with existing lighting."
    },
    'shoe-tryon': {
      name: '鞋靴试穿',
      description: '鞋靴电商穿着效果图生成',
      creditCost: 11,
      instruction: "Replace the footwear on the person in the first image with the shoes from the second image. The shoes must fit perfectly on the person's feet - adjust the size, angle, perspective, and position to match the person's stance, foot angle, and body proportions exactly. Keep the person's pose, body, and everything else exactly the same, only change the shoes. Ensure the shoes appear natural with proper shadows, reflections, ground contact, and lighting that matches the scene. The shoes should look like they are actually being worn by the person with realistic fit and positioning. Pay extremely close attention to: 1) Correct size and scale relative to the person, 2) Proper angle matching foot orientation and perspective, 3) Natural positioning on the ground with realistic contact, 4) Realistic shadows under and around the shoes, 5) Integration with existing lighting and scene, 6) Maintaining the exact pose and stance of the person."
    },
    'scene-change': {
      name: '场景更换',
      description: '替换背景场景以匹配商品氛围',
      creditCost: 10,
      instruction: "Change the background scene to: {prompt}. Keep the main subject unchanged, only modify the background environment. Make it look natural and realistic with proper lighting and perspective."
    },
    'color-change': {
      name: '商品换色',
      description: '保持材质不变的商品快速换色',
      creditCost: 8,
      instruction: "Change the product color to: {prompt}. Maintain all other details, textures, and lighting. Only modify the color."
    }
  };

  // 生成图片
  async generateImage(toolKey, images = [], prompt = "", userId) {
    try {
      console.log(`开始调用AIHubMix服务生成图像... 工具: ${toolKey}`);
      
      // 获取工具配置
      const toolConfig = this.toolConfigs[toolKey];
      if (!toolConfig) {
        throw new Error(`不支持的工具类型: ${toolKey}`);
      }

      // 检查用户积分
      const user = await User.findById(userId);
      if (!user || user.credits_balance < toolConfig.creditCost) {
        throw new Error('积分不足，请先充值或升级套餐');
      }

      // 确保AI工具记录存在
      const aiTool = await this.ensureAiToolRecord(toolKey, toolConfig);

      // 构建消息内容
      let content = [];
      
      // 对于需要双图像处理的工具
      if ((toolKey === 'ai-model' || toolKey === 'try-on-clothes' || toolKey === 'glasses-tryon' || toolKey === 'shoe-tryon') && 
          images.length >= 2) {
        content = [
          {
            type: "text",
            text: toolConfig.instruction
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${images[0].mime_type};base64,${images[0].data}`
            }
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${images[1].mime_type};base64,${images[1].data}`
            }
          }
        ];
      } 
      // 对于单图像处理的工具
      else if ((toolKey === 'scene-change' || toolKey === 'color-change') && images.length >= 1) {
        const instruction = toolConfig.instruction.replace('{prompt}', prompt);
        content = [
          {
            type: "text",
            text: instruction
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${images[0].mime_type};base64,${images[0].data}`
            }
          }
        ];
      } 
      // 对于纯文本生成
      else {
        let enhancedPrompt = prompt;
        switch (toolKey) {
          case "ai-model":
            enhancedPrompt = `Professional fashion model photography: ${prompt}. High quality, studio lighting, detailed, realistic`;
            break;
          case "try-on-clothes":
            enhancedPrompt = `E-commerce product photography with model wearing clothes: ${prompt}. Clean background, professional lighting`;
            break;
          case "glasses-tryon":
            enhancedPrompt = `Fashion model wearing accessories: ${prompt}. Close-up, detailed, professional photography`;
            break;
          case "shoe-tryon":
            enhancedPrompt = `Professional footwear photography: ${prompt}. Clear details, studio lighting`;
            break;
          case "scene-change":
            enhancedPrompt = `Product photography in different scene: ${prompt}. Realistic background, natural lighting`;
            break;
          case "color-change":
            enhancedPrompt = `Product with color variation: ${prompt}. Clean, detailed, professional photography`;
            break;
          default:
            enhancedPrompt = `Professional e-commerce photography: ${prompt}`;
        }
        
        content = [
          {
            type: "text",
            text: enhancedPrompt
          }
        ];
      }

      // 调用AIHubMix API
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        modalities: ["text", "image"],
        temperature: 0.7,
      }, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: this.timeout
      });

      // 检查返回的图像内容
      if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        console.log("🖼️ [Image content received]");
        
        // 提取图像数据
        let imageUrl = null;
        
        // 尝试从 images 数组获取
        if (response.data.choices[0].message.images?.[0]?.image_url?.url) {
          imageUrl = response.data.choices[0].message.images[0].image_url.url;
        }
        // 尝试从 multi_mod_content 获取
        else if (response.data.choices[0].message.multi_mod_content) {
          for (const part of response.data.choices[0].message.multi_mod_content) {
            if (part.inline_data?.data) {
              imageUrl = `data:image/png;base64,${part.inline_data.data}`;
              break;
            }
          }
        }
        // 尝试从 content 获取
        else if (response.data.choices[0].message.content) {
          const content = response.data.choices[0].message.content;
          if (typeof content === 'string' && content.startsWith('data:image')) {
            imageUrl = content;
          }
        }
        
        if (!imageUrl) {
          throw new Error("No image data in response");
        }

        // 保存图像到本地并记录到数据库
        const result = await this.saveGeneratedImage(imageUrl, toolKey, userId, aiTool._id, toolConfig.creditCost);
        
        // 返回与AI生成服务期望的格式一致的数据结构
        return {
          success: true,
          images: [result],
          text_outputs: [],
          timing_ms: response.data.usage?.total_time || 0,
          tool: {
            id: toolKey,
            name: toolConfig.name,
            creditCost: toolConfig.creditCost
          }
        };
      } else {
        throw new Error("No valid response received from AI service");
      }
    } catch (error) {
      console.error(`Error generating image: ${error.message}`);
      throw error;
    }
  }

  // 确保AI工具记录存在
  async ensureAiToolRecord(toolKey, toolConfig) {
    const update = {
      identifier: toolKey,
      name: toolConfig.name,
      description: toolConfig.description,
      type: 'image_generation',
      category: '创意生成',
      credit_cost: toolConfig.creditCost,
      enabled: true,
      tags: ['ai', 'image', toolKey],
      config: {
        max_resolution: '2560x1440',
        max_prompt_length: 500,
        supported_formats: ['image/png', 'image/jpeg', 'image/webp']
      }
    };

    const tool = await AITool.findOneAndUpdate({ identifier: toolKey }, { $set: update }, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });

    return tool;
  }

  // 保存生成的图像（不使用事务）
  async saveGeneratedImage(imageUrl, toolKey, userId, toolId, creditCost) {
    try {
      let base64Data = null;
      let mimeType = 'image/png';
      
      // 如果是base64数据URL
      if (imageUrl.startsWith('data:image')) {
        const parts = imageUrl.split(',');
        if (parts.length === 2) {
          const mimeMatch = /^data:(.*?);/i.exec(parts[0]);
          mimeType = mimeMatch?.[1] || mimeType;
          base64Data = parts[1];
        }
      } 
      // 如果是普通URL，需要下载
      else {
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        mimeType = response.headers['content-type'] || mimeType;
        base64Data = Buffer.from(response.data).toString('base64');
      }
      
      if (!base64Data) {
        throw new Error('无法获取图像数据');
      }

      // 生成文件名
      const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1] || 'png';
      const fileName = `${toolKey}_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      const filePath = path.join(this.generatedDir, fileName);
      
      // 保存图像到磁盘
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(filePath, buffer);
      
      // 检查用户积分
      const user = await User.findById(userId);
      if (!user || user.credits_balance < creditCost) {
        throw new Error('积分不足，请先充值或升级套餐');
      }
      
      // 扣除用户积分
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { credits_balance: -creditCost }
        },
        { new: true }
      );
      
      if (!updatedUser || updatedUser.credits_balance < 0) {
        throw new Error('积分扣减失败或积分不足');
      }
      
      // 记录积分消费
      await CreditRecord.create({
        user_id: userId,
        type: 'consumption',
        amount: -creditCost,
        balance_before: updatedUser.credits_balance + creditCost,
        balance_after: updatedUser.credits_balance,
        description: `${toolKey} 生成扣减`,
        metadata: {
          tool_key: toolKey,
          credit_cost: creditCost
        }
      });
      
      // 创建生成记录
      const generationRecord = await AIGeneration.create({
        user_id: userId,
        tool_key: toolKey,
        tool_id: toolId,
        input_data: {
          prompt: '',
          options: {}
        },
        output_data: {
          images: [{
            file_path: filePath,
            file_name: fileName,
            public_url: `/generated/${fileName}`,
            mime_type: mimeType
          }]
        },
        status: 'completed',
        credits_used: creditCost,
        processing_time: 0
      });
      
      // 更新工具使用次数
      await AITool.findByIdAndUpdate(
        toolId,
        {
          $inc: {
            usage_count: 1,
            total_credits_charged: creditCost
          }
        }
      );
      
      console.log(`✅ Image saved to: ${filePath}`);
      
      return {
        index: 0,
        mimeType: mimeType,
        data_url: `data:${mimeType};base64,${base64Data}`,
        public_url: `/generated/${fileName}`,
        file_path: filePath,
        file_name: fileName
      };
    } catch (error) {
      console.error('保存生成图像失败:', error);
      throw error;
    }
  }
}

module.exports = new AIHubMixService();