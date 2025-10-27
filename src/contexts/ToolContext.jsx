import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { API_ENDPOINTS } from '../config/api'

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

  // 获取工具列表
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.TOOLS.LIST)
        if (response.data.success) {
          setTools(response.data.data)
          if (response.data.data.length > 0) {
            setSelectedTool(response.data.data[0])
          }
        } else {
          // 如果API失败，使用默认工具
          const defaultTools = [
            {
              id: 1,
              name: '商品主图生成',
              description: '生成高质量的商品主图',
              category: 'product',
              icon: '🛍️'
            },
            {
              id: 2,
              name: '详情页设计',
              description: '生成商品详情页设计',
              category: 'design',
              icon: '📄'
            }
          ]
          setTools(defaultTools)
          setSelectedTool(defaultTools[0])
        }
      } catch (error) {
        console.error('获取工具列表失败:', error)
        // 使用默认工具
        const defaultTools = [
          {
            id: 1,
            name: '商品主图生成',
            description: '生成高质量的商品主图',
            category: 'product',
            icon: '🛍️'
          },
          {
            id: 2,
            name: '详情页设计',
            description: '生成商品详情页设计',
            category: 'design',
            icon: '📄'
          }
        ]
        setTools(defaultTools)
        setSelectedTool(defaultTools[0])
      }
    }

    fetchTools()
  }, [])

  const selectTool = (toolId) => {
    const tool = tools.find(t => t.id === toolId)
    if (tool) {
      setSelectedTool(tool)
    }
  }

  const generateImage = async (params) => {
    setIsGenerating(true)
    
    // 模拟API调用延迟
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
    isGenerating
  }

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  )
}