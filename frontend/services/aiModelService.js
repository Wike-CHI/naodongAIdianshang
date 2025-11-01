// AI模特生成服务 - 调用统一的AI中间层接口

class AIModelService {
  constructor() {
    this.baseUrl = '/api/ai'
    this.timeout = 60000 // 60秒超时
  }

  // 中间层识别的工具ID映射
  toolMapping = {
    'ai-model': 'ai-model',
    'try-on-clothes': 'try-on-clothes',
    'glasses-tryon': 'glasses-tryon',
    'shoe-tryon': 'shoe-tryon',
    'scene-change': 'scene-change',
    'color-change': 'color-change'
  }

  buildFormData(toolId, params = {}) {
    const formData = new FormData()

    if (params.prompt && params.prompt.trim().length > 0) {
      formData.append('prompt', params.prompt)
    }

    const options = {
      resolution: params.options?.resolution || '1080p',
      quantity: params.options?.quantity || 1,
      mode: params.options?.mode || 'fast',
      ...params.options
    }
    formData.append('options', JSON.stringify(options))

    const isFaceSwap = toolId === 'ai-model'
    const metadata = {
      toolId,
      hasMain: Boolean(params.mainImage?.file),
      hasReference: Boolean(params.referenceImage?.file),
      faceSwap: isFaceSwap,
      faceReferenceProvided: isFaceSwap && Boolean(params.referenceImage?.file),
      ...params.metadata
    }
    formData.append('metadata', JSON.stringify(metadata))

    const appendFile = (wrapper) => {
      if (wrapper?.file instanceof File) {
        formData.append('images', wrapper.file)
      }
    }

    appendFile(params.mainImage)
    appendFile(params.referenceImage)

    if (Array.isArray(params.images)) {
      params.images.forEach(appendFile)
    }

    return formData
  }

  async generateWithTool(toolId, params = {}) {
    const mappedToolId = this.toolMapping[toolId]
    if (!mappedToolId) {
      throw new Error(`不支持的工具类型: ${toolId}`)
    }

    const requestFormData = params.skipFormBuilding && params.formData instanceof FormData
      ? params.formData
      : this.buildFormData(toolId, params)

    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    console.log('🚀 发送AI生成请求:', {
      url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${this.baseUrl}/generate/${mappedToolId}`,
      method: 'POST',
      headers,
      hasToken: !!token
    })

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${this.baseUrl}/generate/${mappedToolId}`, {
      method: 'POST',
      body: requestFormData,
      headers,
      signal: AbortSignal.timeout(this.timeout)
    })

    console.log('📥 收到AI生成响应:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ AI生成失败:', errorData)
      throw new Error(errorData.error || errorData.detail || '生成失败')
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || '生成失败')
    }

    return result.data || result
  }

  async generateModel(params) {
    return this.generateWithTool('ai-model', params)
  }

  async generateTryOn(params) {
    return this.generateWithTool('try-on-clothes', params)
  }

  async generateAccessoryTryOn(params) {
    return this.generateWithTool('glasses-tryon', params)
  }

  async generateShoeTryOn(params) {
    return this.generateWithTool('shoe-tryon', params)
  }

  async generateSceneChange(params) {
    return this.generateWithTool('scene-change', params)
  }

  async generateColorChange(params) {
    return this.generateWithTool('color-change', params)
  }

  async batchGenerate(requests = []) {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${this.baseUrl}/batch-generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requests }),
      signal: AbortSignal.timeout(this.timeout * 2)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '批量生成失败')
    }

    return response.json()
  }
}

const aiModelService = new AIModelService()

export default aiModelService