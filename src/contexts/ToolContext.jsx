import React, { createContext, useContext, useState } from 'react'
import { mockTools } from '../services/mockApi'

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
  const [selectedTool, setSelectedTool] = useState(mockTools[0])
  const [generationHistory, setGenerationHistory] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  const selectTool = (toolId) => {
    const tool = mockTools.find(t => t.id === toolId)
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
    tools: mockTools,
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