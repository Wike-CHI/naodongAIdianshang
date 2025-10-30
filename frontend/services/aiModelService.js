// AI模特生成服务 - 调用统一的AI中间层接口

class AIModelService {
  constructor() {
    this.baseUrl = '/api/ai';
    this.timeout = 60000; // 60秒超时
  }

  // 中间层识别的工具ID映射
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

  buildFormData(toolId, params = {}) {
    const formData = new FormData();

    formData.append('prompt', params.prompt || '');

    const options = {
      resolution: params.options?.resolution || '1080p',
      quantity: params.options?.quantity || 1,
      mode: params.options?.mode || 'fast',
      ...params.options
    };
    formData.append('options', JSON.stringify(options));

    const isFaceSwap = toolId === 'ai-model';
    const metadata = {
      toolId,
      hasMain: Boolean(params.mainImage?.file),
      hasReference: Boolean(params.referenceImage?.file),
      faceSwap: isFaceSwap,
      faceReferenceProvided: isFaceSwap && Boolean(params.referenceImage?.file),
      ...params.metadata
    };
    formData.append('metadata', JSON.stringify(metadata));

    const appendFile = (wrapper) => {
      if (wrapper?.file instanceof File) {
        formData.append('images', wrapper.file);
      }
    };

    appendFile(params.mainImage);
    appendFile(params.referenceImage);

    if (Array.isArray(params.images)) {
      params.images.forEach(appendFile);
    }

    return formData;
  }

  async generateWithTool(toolId, params = {}) {
    const mappedToolId = this.toolMapping[toolId];
    if (!mappedToolId) {
      throw new Error(`不支持的工具类型: ${toolId}`);
    }

    const formData = this.buildFormData(toolId, params);
    console.log(`调用AI生成 - 工具: ${toolId}`);

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/generate/${mappedToolId}`, {
      method: 'POST',
      body: formData,
      headers,
      signal: AbortSignal.timeout(this.timeout)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || '生成失败');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '生成失败');
    }

    return result.data || result;
  }

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

  async generateBackgroundRemoval(params) {
    return this.generateWithTool('background-removal', params);
  }

  async batchGenerate(requests = []) {
    const response = await fetch(`${this.baseUrl}/batch-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
      signal: AbortSignal.timeout(this.timeout * 2)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '批量生成失败');
    }

    return response.json();
  }
}

const aiModelService = new AIModelService();

export default aiModelService;
