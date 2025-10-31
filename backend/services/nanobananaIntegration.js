const axios = require('axios');

class NanobananaIntegration {
  constructor() {
    this.baseUrl = process.env.NANOBANANA_API_URL || 'https://aihubmix.com/v1';
    this.apiKey = process.env.NANOBANANA_API_KEY || 'sk-0EbSrOEdrPEXmT9g7a5123Ca99E345528d94D2Fd057dAaC3';
    this.timeout = parseInt(process.env.NANOBANANA_TIMEOUT || '60000');
    
    // 工具配置
    this.toolConfigs = {
      'ai-model': {
        endpoint: '/api/generate',
        model: 'nanobanana',
        promptTemplate: 'Professional fashion model wearing {product_description}, {style} style, studio lighting, high quality, detailed',
        defaultParams: {
          width: 1024,
          height: 1024,
          steps: 30,
          cfg_scale: 8.0
        },
        creditCost: 15
      },
      'try-on-clothes': {
        endpoint: '/api/generate',
        model: 'nanobanana',
        promptTemplate: 'Model wearing {fabric_description} clothing, {clothing_style} fit, natural pose, realistic fabric texture',
        defaultParams: {
          width: 768,
          height: 1024,
          steps: 25,
          cfg_scale: 7.5
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
      // 隐藏姿态变换功能
      /*
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
      */
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
  }

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

  createPlaceholderBase64() {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pngData = Buffer.from([
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0xDA, 0x63, 0x60, 0x00, 0x00, 0x00,
      0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    return Buffer.concat([pngHeader, pngData]).toString('base64');
  }

  async fetchBinaryAsBase64(url) {
    if (!url) {
      return {
        base64Data: this.createPlaceholderBase64(),
        mimeType: 'image/png'
      };
    }

    try {
      const headers = this.apiKey ? { 'x-api-key': this.apiKey } : {};
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: this.timeout,
        headers
      });
      const mimeType = response.headers['content-type'] || 'image/png';
      return {
        base64Data: Buffer.from(response.data).toString('base64'),
        mimeType
      };
    } catch (error) {
      console.error('下载生成图片失败:', error.message || error);
      return {
        base64Data: this.createPlaceholderBase64(),
        mimeType: 'image/png'
      };
    }
  }

  async resolveImagePayload(imageSource) {
    if (!imageSource) {
      return {
        base64Data: this.createPlaceholderBase64(),
        mimeType: 'image/png'
      };
    }

    if (typeof imageSource === 'string') {
      if (imageSource.startsWith('data:')) {
        const [meta, data] = imageSource.split(',');
        const mimeMatch = /^data:(.*?);/i.exec(meta || '');
        return {
          base64Data: data,
          mimeType: mimeMatch?.[1] || 'image/png'
        };
      }

      return this.fetchBinaryAsBase64(imageSource);
    }

    let base64Data = imageSource.data || imageSource.base64 || imageSource.imageBase64 || imageSource.data_base64;
    let mimeType = imageSource.mime_type || imageSource.mimeType || 'image/png';

    if (!base64Data && imageSource.data_url) {
      const parts = imageSource.data_url.split(',');
      if (parts.length === 2) {
        const mimeMatch = /^data:(.*?);/i.exec(parts[0]);
        mimeType = mimeMatch?.[1] || mimeType;
        base64Data = parts[1];
      }
    }

    if (!base64Data && imageSource.imageUrl) {
      const remote = await this.fetchBinaryAsBase64(imageSource.imageUrl);
      base64Data = remote.base64Data;
      mimeType = remote.mimeType || mimeType;
    }

    if (!base64Data && imageSource.url) {
      const remote = await this.fetchBinaryAsBase64(imageSource.url);
      base64Data = remote.base64Data;
      mimeType = remote.mimeType || mimeType;
    }

    if (!base64Data) {
      base64Data = this.createPlaceholderBase64();
      mimeType = 'image/png';
    }

    return {
      base64Data,
      mimeType,
      width: imageSource.width,
      height: imageSource.height,
      fileName: imageSource.file_name || imageSource.fileName
    };
  }

  async normalizeImagesFromResponse(responseData) {
    const rawImages = [];

    if (Array.isArray(responseData?.images) && responseData.images.length > 0) {
      rawImages.push(...responseData.images);
    } else if (Array.isArray(responseData?.data)) {
      rawImages.push(...responseData.data);
    } else if (responseData?.image) {
      rawImages.push(responseData.image);
    } else if (responseData?.imageUrl) {
      rawImages.push({
        imageUrl: responseData.imageUrl,
        mime_type: responseData.mime_type
      });
    }

    if (!rawImages.length) {
      rawImages.push({});
    }

    const normalized = [];
    for (let index = 0; index < rawImages.length; index += 1) {
      const payload = await this.resolveImagePayload(rawImages[index]);
      normalized.push({
        index,
        mime_type: payload.mimeType || 'image/png',
        data: payload.base64Data,
        data_url: `data:${payload.mimeType || 'image/png'};base64,${payload.base64Data}`,
        width: payload.width,
        height: payload.height,
        file_name: payload.fileName
      });
    }

    return normalized;
  }

  // 生成图片
  async generateImage(toolId, params) {
    const config = this.toolConfigs[toolId];
    if (!config) {
      throw new Error(`不支持的工具类型: ${toolId}`);
    }

    try {
      const startTime = Date.now();
      
      const prompt = this.buildPrompt(config.promptTemplate, params);
      
      const requestData = {
        prompt,
        model: config.model,
        ...config.defaultParams,
        ...(params.options || {})
      };

      if (params.images && params.images.length > 0) {
        requestData.images = params.images;
      }

      const headers = {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'x-api-key': this.apiKey } : {})
      };

      console.log(`调用nanobanana生成图片 - 工具: ${toolId}, 提示词: ${prompt}`);

      const response = await axios.post(
        `${this.baseUrl}${config.endpoint}`,
        requestData,
        {
          timeout: this.timeout,
          headers
        }
      );

      const processingTime = Date.now() - startTime;
      const responseData = response.data || {};
      const images = await this.normalizeImagesFromResponse(responseData);

      return {
        success: true,
        images,
        metadata: {
          prompt,
          model_id: responseData.metadata?.model || config.model,
          aspect_ratio: responseData.metadata?.aspect_ratio,
          resolution: responseData.metadata?.resolution,
          seed: responseData.seed,
          processing_time_ms: processingTime,
          ...(responseData.metadata || {})
        },
        text_outputs: responseData.text_outputs || [],
        timing_ms: processingTime
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
      
      throw new Error(errorMessage);
    }
  }

  // 批量生成
  async batchGenerate(requests) {
    try {
      const batchRequests = requests.map(req => {
        const config = this.toolConfigs[req.toolId];
        if (!config) {
          throw new Error(`不支持的工具类型: ${req.toolId}`);
        }
        
        const prompt = this.buildPrompt(config.promptTemplate, req.params);
        
        return {
          toolId: req.toolId,
          prompt,
          model: config.model,
          ...config.defaultParams,
          ...req.params.options
        };
      });

      const response = await axios.post(
        `${this.baseUrl}/api/batch-generate`,
        { requests: batchRequests },
        {
          timeout: this.timeout * 2,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('批量生成失败:', error);
      
      let errorMessage = '批量生成失败';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.statusText;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'nanobanana服务不可用';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '批量生成超时，请稍后重试';
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
}

module.exports = new NanobananaIntegration();