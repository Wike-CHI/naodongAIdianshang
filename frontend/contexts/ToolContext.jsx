import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ToolContext = createContext()

// 硬编码的AI工具列表 - 不允许增删，但允许改查
const hardcodedTools = [
  {
    id: 'ai-model',
    name: 'AI模特生成',
    description: '上传服装图，生成真实模特展示效果',
    category: 'model',
    icon: '🧍',
    creditCost: 15,
    // 每个工具都有2个图片上传窗口，3个可选项窗口，1个提示词窗口
    inputConfig: {
      imageSlots: 2,
      optionSlots: 3,
      promptSlot: 1
    }
  },
  {
    id: 'try-on-clothes',
    name: '同版型试衣',
    description: '让模特自动试穿相似版型的服装',
    category: 'tryon',
    icon: '👗',
    creditCost: 12,
    inputConfig: {
      imageSlots: 2,
      optionSlots: 3,
      promptSlot: 1
    }
  },
  {
    id: 'glasses-tryon',
    name: '配件试戴',
    description: '生成眼镜、帽饰等配件试戴效果图',
    category: 'accessory',
    icon: '🕶️',
    creditCost: 10,
    inputConfig: {
      imageSlots: 2,
      optionSlots: 3,
      promptSlot: 1
    }
  },
  {
    id: 'pose-variation',
    name: '姿态变换',
    description: '智能调整模特姿态，匹配不同商品角度',
    category: 'modeling',
    icon: '🧘',
    creditCost: 9,
    inputConfig: {
      imageSlots: 2,
      optionSlots: 3,
      promptSlot: 1
    }
  },
  {
    id: 'shoe-tryon',
    name: '鞋靴试穿',
    description: '自动合成鞋靴穿着效果图',
    category: 'product',
    icon: '👟',
    creditCost: 11,
    inputConfig: {
      imageSlots: 2,
      optionSlots: 3,
      promptSlot: 1
    }
  },
  {
    id: 'scene-change',
    name: '场景更换',
    description: '快速替换电商宣传背景，增强氛围感',
    category: 'scene',
    icon: '🏙️',
    creditCost: 10,
    inputConfig: {
      imageSlots: 2,
      optionSlots: 3,
      promptSlot: 1
    }
  },
  {
    id: 'color-change',
    name: '商品换色',
    description: '一键生成多种颜色组合，提升SKU展示效率',
    category: 'product',
    icon: '🎨',
    creditCost: 8,
    inputConfig: {
      imageSlots: 2,
      optionSlots: 3,
      promptSlot: 1
    }
  }
]

export const useTool = () => {
  const context = useContext(ToolContext)
  if (!context) {
    throw new Error('useTool must be used within a ToolProvider')
  }
  return context
}

export const useToolContext = useTool

export const ToolProvider = ({ children }) => {
  const [tools, setTools] = useState(hardcodedTools)
  const [selectedTool, setSelectedTool] = useState(hardcodedTools[0])
  const [generationHistory, setGenerationHistory] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchTools = useCallback(async () => {
    // 直接使用硬编码工具列表，不再调用后端API
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

  const generateImage = async (params) => {
    setIsGenerating(true)

    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const result = {
        id: Date.now().toString(),
        toolId: selectedTool.id,
        inputParams: params,
        resultImage: `https://picsum.photos/400/600?random=${Date.now()}`,
        createdAt: new Date(),
        creditsCost: selectedTool.creditCost ?? 0
      }

      setGenerationHistory((prevHistory) => [result, ...prevHistory])
      return result
    } catch (error) {
      console.error('生成图片失败:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }

  const value = {
    tools: hardcodedTools, // 始终使用硬编码工具列表
    selectedTool,
    setSelectedTool,
    selectTool,
    generationHistory,
    generateImage,
    isGenerating,
    reloadTools: fetchTools
  }

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  )
}