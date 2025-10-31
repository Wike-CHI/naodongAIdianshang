import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import aiModelService from '../services/aiModelService'
import { message } from 'antd'
import { useAuth } from './AuthContext'

const ToolContext = createContext()

// 统一的通用选项配置 - 所有AI工具模块都使用相同的三个选项
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

// 硬编码的AI工具列表 - 不允许增删，但允许改查
// 所有工具都遵循统一的界面布局：2个图片上传窗口，3个可选项窗口，1个提示词窗口
// 隐藏姿态变换功能
const hardcodedTools = [
  {
    id: 'ai-model',
    name: 'AI模特生成',
    description: '上传模特服装图与真人参考照，自动完成无缝换脸生成',
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
    description: '生成眼镜试戴效果图',
    category: 'accessory',
    icon: '🕶️',
    creditCost: 10,
    inputConfig: {
      imageSlots: 2,
      optionSlots: 3,
      promptSlot: 1
    }
  },
  // 隐藏姿态变换功能
  /*
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
  */
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
  const { user, updateCredits } = useAuth()

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
    if (!user) {
      message.error('请先登录')
      return
    }

    if (user.credits < selectedTool.creditCost) {
      message.error('积分不足，请充值后再试')
      return
    }

    setIsGenerating(true)

    try {
      // 根据不同的工具类型添加特定的选项参数
      const enhancedOptions = {
        resolution: params.resolution || '1080p',
        quantity: params.quantity || 1,
        mode: params.mode || 'fast',
        ...getToolSpecificOptions(selectedTool.id, params)
      };

      // 调用真实的AI生成服务
      const result = await aiModelService.generateWithTool(selectedTool.id, {
        ...params,
        options: enhancedOptions
      })

      // 更新用户积分
      const newCredits = user.credits - selectedTool.creditCost
      updateCredits(newCredits)

      // 将结果添加到生成历史
      const historyItem = {
        id: Date.now().toString(),
        toolId: selectedTool.id,
        inputParams: params,
        resultImage: result.images?.[0]?.data_url || result.images?.[0]?.public_url || `https://picsum.photos/400/600?random=${Date.now()}`,
        createdAt: new Date(),
        creditsCost: selectedTool.creditCost
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

  // 根据工具类型获取特定的选项参数
  const getToolSpecificOptions = (toolId, params) => {
    const options = {};
    
    switch (toolId) {
      case 'ai-model':
        // AI模特生成特定选项
        if (params.productType) options.product_type = params.productType;
        if (params.style) options.style = params.style;
        break;
        
      case 'try-on-clothes':
        // 同版型试衣特定选项
        if (params.fabricType) options.fabric_type = params.fabricType;
        if (params.clothingStyle) options.clothing_style = params.clothingStyle;
        break;
        
      case 'glasses-tryon':
        // 配件试戴只支持眼镜，固定参数
        options.accessory_category = '眼镜';
        options.accessory_type = '眼镜';
        break;
        
      // 隐藏姿态变换功能
      /*
      case 'pose-variation':
        // 姿态变换特定选项
        if (params.poseType) options.pose_type = params.poseType;
        break;
      */
        
      case 'shoe-tryon':
        // 鞋靴试穿特定选项
        if (params.shoeType) options.shoe_type = params.shoeType;
        break;
        
      case 'scene-change':
        // 场景更换特定选项
        if (params.sceneType) options.scene_type = params.sceneType;
        break;
        
      case 'color-change':
        // 商品换色特定选项
        if (params.targetColorName) options.target_color_name = params.targetColorName;
        break;
    }
    
    return options;
  }

  const value = {
    tools: hardcodedTools, // 始终使用硬编码工具列表
    commonOptions, // 添加通用选项配置
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