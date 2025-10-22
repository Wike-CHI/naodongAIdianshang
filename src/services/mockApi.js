// Mock API 数据和服务

export const mockTools = [
  {
    id: 'ai-model',
    name: 'AI模特',

    category: 'fashion',
    description: '将服装图片生成真人模特试穿效果',
    creditCost: 10,
    parameters: [
      {
        name: 'modelImage',
        type: 'upload',
        label: '模特图',
        required: true,
        placeholder: '请上传模特图片'
      },
      {
        name: 'modelAsset',
        type: 'upload',
        label: '模特',
        required: true,
        placeholder: '请上传模特素材'
      },
      {
        name: 'sceneImage',
        type: 'upload',
        label: '场景',
        required: true,
        placeholder: '请上传场景图片'
      },

      {
        name: 'style',
        type: 'select',
        label: '风格选择',
        required: false,
        options: ['时尚', '休闲', '商务', '运动']
      },
      {
        name: 'prompt',
        type: 'text',
        label: '描述词',
        required: false,
        placeholder: '输入详细描述，如背景、姿势等...'
      }
    ]
  },
  {
    id: 'try-on-clothes',
    name: '试衣',

    category: 'fashion',
    description: '将服装穿在指定人物身上',
    creditCost: 8,
    parameters: [
      {
        name: 'personImage',
        type: 'upload',
        label: '上传人物图片',
        required: true,
        placeholder: '请上传人物图片'
      },
      {
        name: 'clothingImage',
        type: 'upload',
        label: '上传服装图片',
        required: true,
        placeholder: '请上传服装图片'
      },
      {
        name: 'fitType',
        type: 'select',
        label: '贴合度',
        required: false,
        options: ['自然', '紧身', '宽松']
      }
    ]
  },
  {
    id: 'shoes-tryon',
    name: '鞋子上脚',
    icon: '👟',
    category: 'fashion',
    description: '将鞋子穿在脚上的效果展示',
    creditCost: 5,
    parameters: [
      {
        name: 'footImage',
        type: 'upload',
        label: '上传脚部图片',
        required: true,
        placeholder: '请上传脚部图片'
      },
      {
        name: 'shoeImage',
        type: 'upload',
        label: '上传鞋子图片',
        required: true,
        placeholder: '请上传鞋子图片'
      }
    ]
  },
  {
    id: 'glasses-tryon',
    name: '眼镜试戴',

    category: 'fashion',
    description: '虚拟试戴眼镜效果',
    creditCost: 4,
    parameters: [
      {
        name: 'faceImage',
        type: 'upload',
        label: '上传人脸图片',
        required: true,
        placeholder: '请上传正面人脸图片'
      },
      {
        name: 'glassesImage',
        type: 'upload',
        label: '上传眼镜图片',
        required: true,
        placeholder: '请上传眼镜图片'
      }
    ]
  },
  {
    id: 'pose-variation',
    name: '姿势裂变',

    category: 'fashion',
    description: '生成模特的不同姿势变化',
    creditCost: 12,
    parameters: [
      {
        name: 'modelImage',
        type: 'upload',
        label: '模特图',
        required: true,
        placeholder: '请上传模特图片'
      },
      {
        name: 'poseReferenceImages',
        type: 'upload',
        label: '姿势参考图（1-5张）',
        required: true,
        placeholder: '请上传姿势参考图片',
        multiple: true,
        maxCount: 5
      },
      {
        name: 'count',
        type: 'select',
        label: '生成数量',
        required: false,
        options: ['1张', '2张', '4张']
      }
    ]
  },
  {
    id: 'model-video',
    name: '模特视频',
    icon: '🎬',
    category: 'fashion',
    description: '将静态模特图片生成动态视频',
    creditCost: 20,
    parameters: [
      {
        name: 'modelImage',
        type: 'upload',
        label: '上传模特图片',
        required: true,
        placeholder: '请上传模特图片'
      },
      {
        name: 'videoType',
        type: 'select',
        label: '视频类型',
        required: true,
        options: ['走秀', '转身', '摆拍', '舞蹈']
      },
      {
        name: 'duration',
        type: 'select',
        label: '视频时长',
        required: false,
        options: ['3秒', '5秒', '10秒']
      }
    ]
  },
  {
    id: 'scene-change',
    name: '场景更换',

    category: 'product',
    description: '更换商品图片的背景场景',
    creditCost: 6,
    parameters: [
      {
        name: 'productImage',
        type: 'upload',
        label: '商品图',
        required: true,
        placeholder: '请上传商品图片'
      },
      {
        name: 'sceneImage',
        type: 'upload',
        label: '场景图',
        required: true,
        placeholder: '请上传场景图片'
      },
      {
        name: 'resolution',
        type: 'select',
        label: '分辨率',
        required: false,
        options: ['512x512', '768x768', '1024x1024', '1024x768', '768x1024']
      },
      {
        name: 'prompt',
        type: 'text',
        label: '描述词',
        required: false,
        placeholder: '输入详细描述，如风格、效果等...'
      }
    ]
  },
  {
    id: 'color-change',
    name: '商品换色',

    category: 'product',
    description: '更换商品的颜色',
    creditCost: 4,
    parameters: [
      {
        name: 'productImage',
        type: 'upload',
        label: '商品图',
        required: true,
        placeholder: '请上传商品图片'
      },
      {
        name: 'targetColor',
        type: 'colorPicker',
        label: '目标颜色',
        required: true,
        placeholder: '选择目标颜色'
      },
      {
        name: 'prompt',
        type: 'text',
        label: '描述词',
        required: false,
        placeholder: '输入详细描述，如效果、风格等...'
      }
    ]
  }
]

export const mockUser = {
  id: 'user_001',
  username: '用户001',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user001',
  credits: 100,
  membershipType: 'free',
  membershipExpiry: null,
  loginMethod: 'wechat'
}

export const mockSubscriptionPlans = [
  {
    id: 'monthly',
    name: '月度会员',
    price: 29,
    originalPrice: 39,
    duration: '1个月',
    benefits: [
      '每月赠送200积分',
      '生成费用8折优惠',
      '优先处理队列',
      '高清图片下载'
    ],
    popular: false
  },
  {
    id: 'yearly',
    name: '年度会员',
    price: 299,
    originalPrice: 468,
    duration: '12个月',
    benefits: [
      '每月赠送300积分',
      '生成费用7折优惠',
      '优先处理队列',
      '高清图片下载',
      '专属客服支持',
      '新功能抢先体验'
    ],
    popular: true
  }
]

// Mock API 函数
export const mockApi = {
  // 用户登录
  login: async (loginData) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      success: true,
      data: mockUser
    }
  },

  // 获取用户信息
  getUserInfo: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      success: true,
      data: mockUser
    }
  },

  // 获取工具列表
  getTools: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      success: true,
      data: mockTools
    }
  },

  // 生成图片
  generateImage: async (toolId, params) => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        toolId,
        resultImage: `https://picsum.photos/400/600?random=${Date.now()}`,
        createdAt: new Date().toISOString()
      }
    }
  },

  // 获取订阅计划
  getSubscriptionPlans: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      success: true,
      data: mockSubscriptionPlans
    }
  }
}