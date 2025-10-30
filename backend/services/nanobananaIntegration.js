const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class NanobananaIntegrationService {
  constructor() {
    this.baseUrl = process.env.NANOBANANA_API_URL || 'http://localhost:3001';
    this.timeout = 60000; // 60秒超时
  }

  // 工具配置映射
  toolConfigs = {
    'ai-model': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Professional model wearing {clothing_description}, studio lighting, fashion photography, high quality, detailed fabric texture, realistic fit',
      defaultParams: {
        width: 1024,
        height: 1024,
        steps: 30,
        cfg_scale: 7.5
      },
      creditCost: 15
    },
    'try-on-clothes': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Model trying on {new_clothing}, same pose and lighting as reference image, realistic fit, natural draping, {fit_type} fit',
      defaultParams: {
        width: 1024,
        height: 1024,
        steps: 25,
        cfg_scale: 8.0
      },
      creditCost: 12
    },
    'glasses-tryon': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Person wearing {accessory_type}, natural lighting, realistic placement, high detail, proper fit on face',
      defaultParams: {
        width: 512,
        height: 512,
        steps: 20,
        cfg_scale: 7.0
      },
      creditCost: 10
    },
    'pose-variation': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Model in {pose_description}, maintaining clothing and appearance, professional photography, {smoothness} transition',
      defaultParams: {
        width: 1024,
        height: 1024,
        steps: 35,
        cfg_scale: 8.5
      },
      creditCost: 9
    },
    'model-video': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Fashion model {motion_type} sequence, smooth movement, professional runway, {video_length} duration',
      defaultParams: {
        width: 1024,
        height: 1024,
        steps: 40,
        cfg_scale: 9.0
      },
      creditCost: 25
    },
    'shoe-tryon': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Feet wearing {shoe_type}, realistic fit and lighting, detailed texture, proper proportions',
      defaultParams: {
        width: 768,
        height: 768,
        steps: 25,
        cfg_scale: 7.5
      },
      creditCost: 11
    },
    'scene-change': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Product in {scene_description}, professional lighting, commercial photography, {lighting_style} atmosphere',
      defaultParams: {
        width: 1024,
        height: 768,
        steps: 30,
        cfg_scale: 8.0
      },
      creditCost: 10
    },
    'color-change': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Product in {target_color}, maintaining original texture and lighting, high quality, realistic material',
      defaultParams: {
        width: 1024,
        height: 1024,
        steps: 20,
        cfg_scale: 6.5
      },
      creditCost: 8
    },
    'background-remove': {
      endpoint: '/api/generate',
      model: 'nanobanana',
      promptTemplate: 'Clean product cutout, transparent background, sharp edges, professional quality, isolated object',
      defaultParams: {
        width: 1024,
        height: 1024,
        steps: 15,
        cfg_scale: 5.0
      },
      creditCost: 6
    }
  };

  // 构建提示词
  buildPrompt(template, params) {
    let prompt = template;
    
    // 替换模板变量
    prompt = prompt.replace(/\{(\w+)\}/g, (match, key) => {
      if (params.options && params.options[key]) {
        return params.options[key];
      }
      return params[key] || match;
    });

    // 添加用户自定义提示词
    if (params.prompt && params.prompt.trim()) {
      prompt += `, ${params.prompt}`;
    }

    return prompt;
  }

  // 检查nanobanana服务状态
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: 5000
      });
      return {
        status: 'ok',
        data: response.data
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  // 获取支持的模型列表
  async getSupportedModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/models`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  // 生成图片
  async generateImage(toolId, params) {
    const config = this.toolConfigs[toolId];
    if (!config) {
      throw new Error(`不支持的工具类型: ${toolId}`);
    }

    try {
      const startTime = Date.now();
      
      // 构建提示词
      const prompt = this.buildPrompt(config.promptTemplate, params);
      
      // 准备请求数据
      const requestData = {
        prompt,
        model: config.model,
        ...config.defaultParams,
        ...params.options
      };

      // 如果有图片，添加到请求中
      if (params.images && params.images.length > 0) {
        requestData.images = params.images;
      }

      console.log(`调用nanobanana生成图片 - 工具: ${toolId}, 提示词: ${prompt}`);

      const response = await axios.post(
        `${this.baseUrl}${config.endpoint}`,
        requestData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          imageUrl: response.data.imageUrl || response.data.content,
          metadata: response.data.metadata || {},
          processingTime,
          seed: response.data.seed,
          model: config.model,
          prompt
        },
        creditCost: config.creditCost
      };

    } catch (error) {
      console.error(`nanobanana生成失败 - 工具: ${toolId}`, error);
      
      let errorMessage = '生成失败';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.statusText;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'nanobanana服务不可用';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '生成超时，请稍后重试';
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        creditCost: 0
      };
    }
  }

  // 批量生成
  async batchGenerate(requests) {
    const results = [];
    
    for (const request of requests) {
      try {
        const result = await this.generateImage(request.toolId, request.params);
        results.push({
          id: request.id,
          ...result
        });
      } catch (error) {
        results.push({
          id: request.id,
          success: false,
          error: error.message,
          creditCost: 0
        });
      }
    }
    
    return results;
  }

  // 获取工具配置
  getToolConfig(toolId) {
    return this.toolConfigs[toolId] || null;
  }

  // 获取所有工具配置
  getAllToolConfigs() {
    return this.toolConfigs;
  }

  // 更新工具配置
  updateToolConfig(toolId, config) {
    if (this.toolConfigs[toolId]) {
      this.toolConfigs[toolId] = {
        ...this.toolConfigs[toolId],
        ...config
      };
      return true;
    }
    return false;
  }

  // 验证参数
  validateParams(toolId, params) {
    const config = this.toolConfigs[toolId];
    if (!config) {
      return { valid: false, error: `不支持的工具类型: ${toolId}` };
    }

    // 基本参数验证
    if (!params.prompt && !params.images) {
      return { valid: false, error: '必须提供提示词或图片' };
    }

    // 图片数量验证
    if (params.images && params.images.length > 5) {
      return { valid: false, error: '最多支持5张图片' };
    }

    return { valid: true };
  }

  // 预处理图片
  async preprocessImages(images) {
    const processedImages = [];
    
    for (const image of images) {
      try {
        // 这里可以添加图片预处理逻辑
        // 比如格式转换、尺寸调整、质量压缩等
        processedImages.push({
          type: image.type || 'main',
          data: image.data,
          name: image.name || 'image.jpg'
        });
      } catch (error) {
        console.error('图片预处理失败:', error);
        throw new Error(`图片预处理失败: ${error.message}`);
      }
    }
    
    return processedImages;
  }

  // 获取生成统计
  async getGenerationStats() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/stats`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('获取生成统计失败:', error);
      return null;
    }
  }
}

module.exports = new NanobananaIntegrationService();