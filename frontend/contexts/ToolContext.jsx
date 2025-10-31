import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import aiModelService from '../services/aiModelService'
import { message } from 'antd'
import { useAuth } from './AuthContext'

const ToolContext = createContext()

// 统一的通用选项配置
const commonOptions = {
  resolution: {
    id: 'resolution',
    label: '分辨率',
    type: 'select',
    options: [
      { value: '0.5k', label: '0.5K (960×540)', width: 960, height: 540 },
      { value: '1080p', label: '1080P (1920×1080)', width: 1920, height: 1080 },
      { value: '2k', label: '2K (2560×1440)', width: 2560, height: 1440 }
    ],
    default: '1080p'
  },
  quantity: {
    id: 'quantity',
    label: '生成数量',
    type: 'slider',
    min: 1,
    max: 4,
    default: 1
  },
  mode: {
    id: 'mode',
    label: '生成模式',
    type: 'radio',
    options: [
      { value: 'fast', label: '快速模式' },
      { value: 'ultra', label: '极速模式' }
    ],
    default: 'fast'
  }
}

const hardcodedTools = [
  {
    id: 'ai-model',
    name: 'AI模特生成',
    description: '上传模特图和人物图，自动完成专业换脸',
    creditCost: 15,
    builtinPrompt: '高清商业摄影模特换脸，面部融合自然，肤质真实，高级灯光，真实穿搭拍摄',
    requiresReference: true,
    requiresPromptInput: false
  },
  {
    id: 'try-on-clothes',
    name: '同版型试衣',
    description: '人物图与服装图融合，生成专业试衣效果',
    creditCost: 12,
    builtinPrompt: '同版型服装自动试穿，服装贴合人物身形，面料纹理清晰，灯光均匀，商业摄影风格',
    requiresReference: true,
    requiresPromptInput: false
  },
  {
    id: 'glasses-tryon',
    name: '配件试戴',
    description: '人脸图与眼镜图结合，智能生成试戴效果',
    creditCost: 10,
    builtinPrompt: '眼镜佩戴自然贴合鼻梁耳朵，面部光影匹配，写实风格，高清细节',
    requiresReference: true,
    requiresPromptInput: false
  },
  {
    id: 'shoe-tryon',
    name: '鞋靴试穿',
    description: '人物图与鞋靴图互换脚部穿搭效果',
    creditCost: 11,
    builtinPrompt: '鞋靴穿戴贴合脚型，阴影自然，地面接触真实，高级卖场灯光氛围',
    requiresReference: true,
    requiresPromptInput: false
  },
  {
    id: 'scene-change',
    name: '场景更换',
    description: '商品/人物主图快速替换电商常用场景',
    creditCost: 10,
    builtinPrompt: '',
    requiresReference: false,
    requiresPromptInput: true
  },
  {
    id: 'color-change',
    name: '商品换色',
    description: '商品主图批量生成电商常用颜色方案',
    creditCost: 8,
    builtinPrompt: '',
    requiresReference: false,
    requiresPromptInput: true
  }
]

export const useTool = () => {
  const context = useContext(ToolContext)
  if (!context) {
    throw new Error('useTool must be used within a ToolProvider')
  }
  return context
}

// 确保正确导出 useToolContext
export const useToolContext = useTool

export const ToolProvider = ({ children }) => {
  const [tools, setTools] = useState(hardcodedTools)
  const [selectedTool, setSelectedTool] = useState(hardcodedTools[0])
  const [generationHistory, setGenerationHistory] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const { user, updateCredits } = useAuth()

  const fetchTools = useCallback(() => {
    setTools(hardcodedTools)
    setSelectedTool((currentTool) => currentTool || hardcodedTools[0])
  }, [])

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const selectTool = (toolId) => {
    const targetTool = tools.find((tool) => tool.id === toolId)
    if (targetTool) {
      setSelectedTool(targetTool)
    }
  }

  const generateImage = async ({
    mainImage,
    referenceImage,
    prompt,
    metadata = {},
    options = {}
  }) => {
    if (!user) {
      message.error('请先登录')
      return
    }

    if ((user.credits ?? 0) < selectedTool.creditCost) {
      message.error('积分不足，请充值后再试')
      return
    }

    if (!mainImage?.file) {
      message.error('请上传主图片')
      return
    }

    if (selectedTool.requiresReference && !referenceImage?.file) {
      message.error('请上传参考图片')
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('images', mainImage.file)
      if (referenceImage?.file) {
        formData.append('images', referenceImage.file)
      }

      const mergedOptions = {
        resolution: options.resolution || '1080p',
        quantity: options.quantity || 1,
        mode: options.mode || 'fast',
        ...options
      }

      formData.append('options', JSON.stringify(mergedOptions))
      formData.append(
        'metadata',
        JSON.stringify({
          ...metadata,
          builtinPromptApplied:
            !selectedTool.requiresPromptInput && !prompt,
          promptSource: metadata.promptSource || (prompt ? 'manual' : 'builtin')
        })
      )
      formData.append('prompt', prompt || selectedTool.builtinPrompt || '')

      const result = await aiModelService.generateWithTool(selectedTool.id, {
        formData,
        skipFormBuilding: true
      })

      const newCredits = (user.credits ?? 0) - selectedTool.creditCost
      updateCredits(newCredits)

      const historyItem = {
        id: Date.now().toString(),
        toolId: selectedTool.id,
        resultImage:
          result.images?.[0]?.data_url ||
          result.images?.[0]?.public_url ||
          '',
        createdAt: new Date(),
        creditsCost: selectedTool.creditCost,
        metadata
      }

      setGenerationHistory((prevHistory) => [historyItem, ...prevHistory])
      message.success('生成成功！')
      return result
    } catch (error) {
      console.error('生成图片失败:', error)
      message.error(error.message || '生成失败，请重试')
      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  const value = {
    tools,
    selectedTool,
    setSelectedTool,
    selectTool,
    generationHistory,
    generateImage,
    isGenerating,
    reloadTools: fetchTools,
    commonOptions // 添加 commonOptions 到 context value 中
  }

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  )
}