import React, { createContext, useContext, useState, useEffect } from 'react'
import { aiToolsApi } from '../services/api'

const ToolContext = createContext()

export const useTool = () => {
  const context = useContext(ToolContext)
  if (!context) {
    throw new Error('useTool must be used within a ToolProvider')
  }
  return context
}

export const useToolContext = useTool

export const ToolProvider = ({ children }) => {
  const [tools, setTools] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  const [generationHistory, setGenerationHistory] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  // 加载AI工具列表
  useEffect(() => {
    loadTools()
  }, [])

  const loadTools = async () => {
    try {
      const response = await aiToolsApi.getTools()
      if (response.success) {
        setTools(response.data)
        if (response.data.length > 0) {
          setSelectedTool(response.data[0])
        }
      }
    } catch (error) {
      console.error('加载工具列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectTool = (toolId) => {
    const tool = tools.find(t => t.id === toolId)
    if (tool) {
      setSelectedTool(tool)
    }
  }

  const generateImage = async (params) => {
    setIsGenerating(true)
    
    try {
      // TODO: 实现真实的AI图片生成API调用
      // const response = await aiToolsApi.generateImage(selectedTool.id, params)
      
      // 临时模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const result = {
        id: Date.now().toString(),
        toolId: selectedTool.id,
        inputParams: params,
        resultImage: `https://picsum.photos/400/600?random=${Date.now()}`,
        createdAt: new Date(),
        creditsCost: selectedTool.creditCost
      }
      
      setGenerationHistory(prev => [result, ...prev])
      return result
    } catch (error) {
      console.error('图片生成失败:', error)
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
    loading,
    loadTools
  }

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  )
}