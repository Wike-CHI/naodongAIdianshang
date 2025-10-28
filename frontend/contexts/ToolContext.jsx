import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

const ToolContext = createContext()

const defaultTools = [
  {
    id: 'ai-model',
    name: 'AI模特生成',
    description: '上传服装图，生成真实模特展示效果',
    category: 'model',
    icon: '🧍',
    creditCost: 15
  },
  {
    id: 'try-on-clothes',
    name: '同版型试衣',
    description: '让模特自动试穿相似版型的服装',
    category: 'tryon',
    icon: '👗',
    creditCost: 12
  },
  {
    id: 'glasses-tryon',
    name: '配件试戴',
    description: '生成眼镜、帽饰等配件试戴效果图',
    category: 'accessory',
    icon: '🕶️',
    creditCost: 10
  },
  {
    id: 'pose-variation',
    name: '姿态变换',
    description: '智能调整模特姿态，匹配不同商品角度',
    category: 'modeling',
    icon: '🧘',
    creditCost: 9
  },
  {
    id: 'model-video',
    name: '模特视频生成',
    description: '将静态图片转换为动态走秀视频',
    category: 'video',
    icon: '🎥',
    creditCost: 25
  },
  {
    id: 'shoe-tryon',
    name: '鞋靴试穿',
    description: '自动合成鞋靴穿着效果图',
    category: 'product',
    icon: '👟',
    creditCost: 11
  },
  {
    id: 'scene-change',
    name: '场景更换',
    description: '快速替换电商宣传背景，增强氛围感',
    category: 'scene',
    icon: '🏙️',
    creditCost: 10
  },
  {
    id: 'color-change',
    name: '商品换色',
    description: '一键生成多种颜色组合，提升SKU展示效率',
    category: 'product',
    icon: '🎨',
    creditCost: 8
  },
  {
    id: 'background-removal',
    name: '抠图去底',
    description: '自动识别主体并精细抠图，秒级完成',
    category: 'editing',
    icon: '✂️',
    creditCost: 6
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
  const [tools, setTools] = useState(defaultTools)
  const [selectedTool, setSelectedTool] = useState(defaultTools[0])
  const [generationHistory, setGenerationHistory] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchTools = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.TOOLS.LIST)
      const toolList = response?.data?.data

      if (response?.data?.success && Array.isArray(toolList) && toolList.length > 0) {
        setTools(toolList)
        setSelectedTool((currentTool) => {
          if (!currentTool) {
            return toolList[0]
          }

          const matchedTool = toolList.find((candidate) => candidate.id === currentTool.id)
          return matchedTool || toolList[0]
        })
        return
      }

      throw new Error('工具列表为空')
    } catch (error) {
      console.error('获取工具列表失败，使用默认工具:', error)
      setTools(defaultTools)
      setSelectedTool((currentTool) => currentTool || defaultTools[0])
    }
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
    setIsGenerating(false)

    return result
  }

  const value = {
    tools,
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
