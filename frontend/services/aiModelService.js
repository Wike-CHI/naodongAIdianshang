// AI模特生成服务 - 集成AI接口
class AIModelService {
  constructor() {
    this.baseUrl = '/api/ai';
    this.timeout = 60000; // 60秒超时
  }

  // 工具映射
  toolMapping = {
    'ai-model': 'ai-model',
    'try-on-clothes': 'try-on-clothes',
    'glasses-tryon': 'glasses-tryon',
    'pose-variation': 'pose-variation',
    'model-video': 'model-video',
    'shoe-tryon': 'shoe-tryon',
    'scene-change': 'scene-change',
    'color-change': 'color-change',
    'background-removal': 'background-remove'
  };

  // 提示词模板
  promptTemplates = {
    'ai-model': 'Professional model wearing {clothing_description}, studio lighting, fashion photography, high quality, detailed fabric texture, realistic fit',
    'try-on-clothes': 'Model trying on {new_clothing}, same pose and lighting as reference image, realistic fit, natural draping, {fit_type} fit',
    'glasses-tryon': 'Person wearing {accessory_type}, natural lighting, realistic placement, high detail, proper fit on face',
    'pose-variation': 'Model in {pose_description}, maintaining clothing and appearance, professional photography, {smoothness} transition',
    'model-video': 'Fashion model {motion_type} sequence, smooth movement, professional runway, {video_length} duration',
    'shoe-tryon': 'Feet wearing {shoe_type}, realistic fit and lighting, detailed texture, proper proportions',
    'scene-change': 'Product in {scene_description}, professional lighting, commercial photography, {lighting_style} atmosphere',
    'color-change': 'Product in {target_color}, maintaining original texture and lighting, high quality, realistic material',
    'background-removal': 'Clean product cutout, transparent background, sharp edges, professional quality, isolated object'
  };

  // 默认参数
  defaultParams = {
    'ai-model': { width: 1024, height: 1024, steps: 30, cfg_scale: 7.5 },
    'try-on-clothes': { width: 1024, height: 1024, steps: 25, cfg_scale: 8.0 },
    'glasses-tryon': { width: 512, height: 512, steps: 20, cfg_scale: 7.0 },
    'pose-variation': { width: 1024, height: 1024, steps: 35, cfg_scale: 8.5 },
    'model-video': { width: 1024, height: 1024, steps: 40, cfg_scale: 9.0 },
    'shoe-tryon': { width: 768, height: 768, steps: 25, cfg_scale: 7.5 },
    'scene-change': { width: 1024, height: 768, steps: 30, cfg_scale: 8.0 },
    'color-change': { width: 1024, height: 1024, steps: 20, cfg_scale: 6.5 },
    'background-removal': { width: 1024, height: 1024, steps: 15, cfg_scale: 5.0 }
  };

  // 图片转Base64
  async imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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

  // 通用生成方法
  async generateWithTool(toolId, params) {
    try {
      const mappedToolId = this.toolMapping[toolId];
      if (!mappedToolId) {
        throw new Error(`不支持的工具类型: ${toolId}`);
      }

      // 准备FormData
      const formData = new FormData();
      
      // 添加提示词
      const template = this.promptTemplates[toolId] || '';
      const prompt = this.buildPrompt(template, params);
      formData.append('prompt', prompt);

      // 添加选项参数
      const options = {
        ...this.defaultParams[toolId],
        ...params.options
      };
      formData.append('options', JSON.stringify(options));

      // 添加图片
      if (params.images && params.images.length > 0) {
        params.images.forEach((image, index) => {
          if (image instanceof File) {
            formData.append('images', image);
          }
        });
      }

      console.log(`调用AI生成 - 工具: ${toolId}, 提示词: ${prompt}`);

      const response = await fetch(`${this.baseUrl}/generate/${mappedToolId}`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成失败');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '生成失败');
      }

      return result;

    } catch (error) {
      console.error(`AI生成失败 - 工具: ${toolId}`, error);
      throw error;
    }
  }

  // 具体工具方法
  async generateModel(params) {
    return this.generateWithTool('ai-model', params);
  }

  async generateTryOn(params) {
    return this.generateWithTool('try-on-clothes', params);
  }

  async generateAccessoryTryOn(params) {
    return this.generateWithTool('glasses-tryon', params);
  }

  async generatePoseVariation(params) {
    return this.generateWithTool('pose-variation', params);
  }

  async generateModelVideo(params) {
    return this.generateWithTool('model-video', params);
  }

  async generateShoeTryOn(params) {
    return this.generateWithTool('shoe-tryon', params);
  }

  async generateSceneChange(params) {
    return this.generateWithTool('scene-change', params);
  }

  async generateColorChange(params) {
    return this.generateWithTool('color-change', params);
  }

  // 抠图去底
  async generateBackgroundRemoval(params) {
    return this.generateWithTool('background-removal', params);
  }

  // 批量生成
  async batchGenerate(requests) {
    try {
      const response = await fetch(`${this.baseUrl}/batch-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests }),
        signal: AbortSignal.timeout(this.timeout * 2) // 批量生成允许更长时间
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '批量生成失败');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('批量生成失败:', error);
      throw error;
    }
  }

  // 获取生成历史
  async getGenerationHistory(page = 1, limit = 20, toolId = null) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (toolId) {
        params.append('toolId', toolId);
      }

      const response = await fetch(`${this.baseUrl}/history?${params}`);
      
      if (!response.ok) {
        throw new Error('获取历史记录失败');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('获取生成历史失败:', error);
      throw error;
    }
  }

  // 获取工具状态
  async getToolStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取工具状态失败:', error);
      return { status: 'error', error: error.message };
    }
  }

  // 获取支持的模型列表
  async getSupportedModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  // 获取工具配置
  async getToolConfig(toolId) {
    try {
      const mappedToolId = this.toolMapping[toolId];
      if (!mappedToolId) {
        throw new Error(`不支持的工具类型: ${toolId}`);
      }

      const response = await fetch(`${this.baseUrl}/tools/${mappedToolId}/config`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('获取工具配置失败:', error);
      return null;
    }
  }

  // 获取生成统计
  async getGenerationStats() {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('获取生成统计失败:', error);
      return null;
    }
  }
}

// 创建单例实例
export const aiModelService = new AIModelService();
export default aiModelService;