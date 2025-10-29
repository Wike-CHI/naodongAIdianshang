require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const logger = require('./utils/logger');
const connectDB = require('./config/database');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'naodong-ai-dev-secret';
const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true';

const FRONTEND_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8082'  // 添加管理后台端口
].filter(Boolean);

app.use(cors({
  origin: FRONTEND_ORIGINS,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!USE_MEMORY_DB) {
  connectDB();
} else {
  logger.log('🔄 正在使用内存数据模式运行后端服务');
}

// 引入路由
const authRoutes = require('./routes/auth');
const aiGenerationRoutes = require('./routes/aiGeneration');
const aiToolsRoutes = require('./routes/aiTools');
const aiModelToolsAdminRoutes = require('./routes/aiModelToolsAdmin');
const usersRoutes = require('./routes/users');
const subscriptionsRoutes = require('./routes/subscriptions');
const creditsRoutes = require('./routes/credits');
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiGenerationRoutes);
app.use('/api/admin/ai-tools', aiToolsRoutes);
app.use('/api/admin/ai-model-tools', aiModelToolsAdminRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/credits', creditsRoutes);

// 引入控制器
const aiToolController = require('./controllers/aiToolController');
const subscriptionController = require('./controllers/subscriptionController');

// ---------------- 内存数据 ----------------
const memoryUsers = [
  {
    id: 'user-1001',
    phone: '13800138000',
    email: 'test@example.com',
    password: '123456',
    username: '脑洞商家',
    avatar: 'https://avatars.githubusercontent.com/u/1342004?v=4',
    credits: 860,
    credits_balance: 860,
    membershipType: 'vip',
    loginMethod: 'phone',
    referralCode: 'ND2024',
    createdAt: new Date().toISOString()
  }
];

const memoryTools = [
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
];

const memorySubscriptionPlans = [
  {
    id: 'plan-free',
    name: '基础版',
    price: 0,
    originalPrice: 0,
    duration: 'monthly',
    credits: 100,
    benefits: ['每日100次生成', '基础模板', '标准客服'],
    popular: false,
    type: 'free'
  },
  {
    id: 'plan-pro',
    name: '专业版',
    price: 29,
    originalPrice: 49,
    duration: 'monthly',
    credits: 1000,
    benefits: ['每日1000次生成', '高级模板', '优先客服', '无广告'],
    popular: true,
    type: 'pro'
  },
  {
    id: 'plan-enterprise',
    name: '企业版',
    price: 99,
    originalPrice: 149,
    duration: 'monthly',
    credits: 5000,
    benefits: ['每日5000次生成', '全部模板', '专属客服', '定制功能'],
    popular: false,
    type: 'enterprise'
  }
];

const memoryReferralData = {
  'user-1001': {
    referralCode: 'ND2024',
    isActive: true,
    totalReferrals: 18,
    successfulReferrals: 12,
    conversionRate: 66.7,
    totalEarnings: 960,
    referralDetails: [
      {
        id: 'ref-1001',
        referredUsername: '优选潮流店',
        rewardCredits: 120,
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'ref-1002',
        referredUsername: '小熊童装',
        rewardCredits: 80,
        status: 'pending',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ],
    creditHistory: [
      {
        id: 'credit-9001',
        type: 'referral_reward',
        amount: 120,
        description: '邀请优选潮流店完成注册奖励',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'credit-9002',
        type: 'consumption',
        amount: -45,
        description: '使用AI模特生成消耗积分',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'credit-9003',
        type: 'recharge',
        amount: 300,
        description: '积分充值到账',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
      }
    ]
  }
};

const memoryGenerationHistory = {
  'user-1001': []
};

const memoryReferralCodes = {
  ND2024: {
    code: 'ND2024',
    referrerUserId: 'user-1001',
    referrerName: '脑洞商家',
    rewardCredits: 120,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
};

global.memoryUsers = memoryUsers;

// ---------------- 辅助方法 ----------------
const buildUserPayload = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email || null,
  phone: user.phone || null,
  avatar: user.avatar || null,
  credits: user.credits ?? user.credits_balance ?? 0,
  credits_balance: user.credits ?? user.credits_balance ?? 0,
  membershipType: user.membershipType || 'standard',
  loginMethod: user.loginMethod || 'phone',
  referralCode: user.referralCode || null,
  createdAt: user.createdAt || new Date().toISOString()
});

const createMockGeneration = ({
  toolId,
  creditsCost,
  seed,
  description,
  extraAssets
}) => ({
  id: `gen-${toolId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  toolId,
  creditsCost,
  resultImage: `https://picsum.photos/seed/${seed || toolId}/${400 + Math.floor(Math.random() * 50)}/${600 + Math.floor(Math.random() * 50)}`,
  description,
  additionalAssets: extraAssets || [],
  createdAt: new Date().toISOString()
});

const blendImages = async (mainImageBuffer, referenceImageBuffer) => {
  const mainImage = sharp(mainImageBuffer).resize(512, 512).blur(10);
  const referenceImage = await sharp(referenceImageBuffer)
    .resize(512, 512)
    .toBuffer();

  return sharp(await mainImage.toBuffer())
    .composite([{ input: referenceImage, gravity: 'center', blend: 'over' }])
    .png()
    .toBuffer();
};

const toolGenerators = {
  'ai-model': ({ prompt, user }) => {
    const record = createMockGeneration({
      toolId: 'ai-model',
      creditsCost: 15,
      seed: `model-${Date.now()}`,
      description: prompt || 'AI模特生成效果图'
    });
    return {
      record,
      creditsCost: 15,
      previewText: '已生成模特展示效果，包含动态姿态与布料细节。',
      additionalAssets: [],
      creditDescription: 'AI模特生成消耗积分'
    };
  },
  'try-on-clothes': ({ prompt }) => {
    const record = createMockGeneration({
      toolId: 'try-on-clothes',
      creditsCost: 12,
      seed: `tryon-${Date.now()}`,
      description: prompt || '同版型试衣展示图'
    });
    return {
      record,
      creditsCost: 12,
      previewText: '同版型试衣完成，可在动态视角查看合身度。',
      additionalAssets: [],
      creditDescription: '同版型试衣消耗积分'
    };
  },
  'glasses-tryon': ({ prompt }) => {
    const record = createMockGeneration({
      toolId: 'glasses-tryon',
      creditsCost: 10,
      seed: `accessory-${Date.now()}`,
      description: prompt || '配件试戴展示图'
    });
    return {
      record,
      creditsCost: 10,
      previewText: '配件试戴效果已生成，可预览多角度细节。',
      additionalAssets: [],
      creditDescription: '配件试戴消耗积分'
    };
  },
  'pose-variation': ({ prompt }) => {
    const record = createMockGeneration({
      toolId: 'pose-variation',
      creditsCost: 9,
      seed: `pose-${Date.now()}`,
      description: prompt || '姿态变换效果图'
    });
    return {
      record,
      creditsCost: 9,
      previewText: '姿态变换完成，模特肢体姿势自动适配商品。',
      additionalAssets: [],
      creditDescription: '姿态变换消耗积分'
    };
  },
  'model-video': ({ prompt }) => {
    const record = createMockGeneration({
      toolId: 'model-video',
      creditsCost: 25,
      seed: `video-${Date.now()}`,
      description: prompt || '模特视频生成预览'
    });
    return {
      record,
      creditsCost: 25,
      previewText: '模特走秀视频已生成，视频链接可在详情查看。',
      additionalAssets: [
        {
          type: 'video',
          url: `https://samplelib.com/lib/preview/mp4/sample-5s.mp4?seed=${Date.now()}`,
          description: '模特走秀短视频'
        }
      ],
      creditDescription: '模特视频生成消耗积分'
    };
  },
  'shoe-tryon': ({ prompt }) => {
    const record = createMockGeneration({
      toolId: 'shoe-tryon',
      creditsCost: 11,
      seed: `shoe-${Date.now()}`,
      description: prompt || '鞋靴试穿展示图'
    });
    return {
      record,
      creditsCost: 11,
      previewText: '鞋靴试穿效果已生成，包含侧视与脚部贴合细节。',
      additionalAssets: [],
      creditDescription: '鞋靴试穿消耗积分'
    };
  },
  'scene-change': ({ prompt }) => {
    const record = createMockGeneration({
      toolId: 'scene-change',
      creditsCost: 10,
      seed: `scene-${Date.now()}`,
      description: prompt || '场景更换效果图'
    });
    return {
      record,
      creditsCost: 10,
      previewText: '场景更换完成，生成多种氛围背景可选。',
      additionalAssets: [],
      creditDescription: '场景更换消耗积分'
    };
  },
  'color-change': ({ prompt }) => {
    const record = createMockGeneration({
      toolId: 'color-change',
      creditsCost: 8,
      seed: `color-${Date.now()}`,
      description: prompt || '商品换色效果图'
    });
    return {
      record,
      creditsCost: 8,
      previewText: '商品颜色已完成变换，支持多色对比图。',
      additionalAssets: [],
      creditDescription: '商品换色消耗积分'
    };
  },
  'background-removal': ({ prompt }) => {
    const record = createMockGeneration({
      toolId: 'background-removal',
      creditsCost: 6,
      seed: `cutout-${Date.now()}`,
      description: prompt || '抠图去底结果图'
    });
    record.resultImage = `https://picsum.photos/seed/${record.id}/600/600?grayscale`;
    return {
      record,
      creditsCost: 6,
      previewText: '抠图去底完成，可下载透明背景PNG。',
      additionalAssets: [
        {
          type: 'image/png',
          url: `https://picsum.photos/seed/${Date.now() + 1}/600/600`,
          description: '透明背景PNG下载链接'
        }
      ],
      creditDescription: '抠图去底消耗积分'
    };
  }
};

const createFallbackGeneration = ({ toolId, prompt }) => {
  const fallback = createMockGeneration({
    toolId,
    creditsCost: 10,
    seed: toolId,
    description: prompt || 'AI生成结果'
  });
  return {
    record: fallback,
    creditsCost: fallback.creditsCost,
    previewText: '生成完成',
    additionalAssets: [],
    creditDescription: `工具 ${toolId} 消耗积分`
  };
};

const signToken = (payload, expiresIn = '24h') => jwt.sign(payload, JWT_SECRET, { expiresIn });

const getUserByToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return memoryUsers.find((candidate) => candidate.id === decoded.userId) || null;
  } catch (error) {
    return null;
  }
};

const ensureAuth = (req, res) => {
  const user = getUserByToken(req);
  if (!user) {
    res.status(401).json({ success: false, message: '未授权访问' });
    return null;
  }
  return user;
};

const findReferralData = (userId) => {
  return memoryReferralData[userId] || {
    referralCode: null,
    isActive: false,
    totalReferrals: 0,
    successfulReferrals: 0,
    conversionRate: 0,
    totalEarnings: 0,
    referralDetails: [],
    creditHistory: []
  };
};

const syncCreditHistory = (userId) => {
  const user = memoryUsers.find((candidate) => candidate.id === userId);
  const referral = memoryReferralData[userId];
  if (!user || !referral) return;

  const totalCredits = referral.creditHistory.reduce((sum, item) => sum + item.amount, 0);
  user.credits = (referral.initialCredits || 860) + totalCredits;
  user.credits_balance = user.credits;
};

const refreshReferralConversion = (userId) => {
  const referral = memoryReferralData[userId];
  if (!referral) return;
  const total = referral.referralDetails.length;
  const success = referral.referralDetails.filter((item) => item.status === 'completed').length;
  referral.totalReferrals = total;
  referral.successfulReferrals = success;
  referral.conversionRate = total === 0 ? 0 : Number(((success / total) * 100).toFixed(1));
  referral.totalEarnings = referral.creditHistory
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
};

// ---------------- 通用路由 ----------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: USE_MEMORY_DB ? 'memory' : 'database', timestamp: new Date().toISOString() });
});

// ---------------- 认证相关 ----------------
// 管理员登录
app.post('/api/admin/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 简单的管理员验证
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { userId: 'admin-1', type: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: 'admin-1',
          username: 'admin',
          role: 'admin'
        },
        token
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// 管理员token验证
app.post('/api/admin/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证token'
    });
  }
  
  try {
    // 验证JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 检查是否为管理员token
    if (decoded.type === 'admin') {
      res.json({
        success: true,
        data: {
          user: {
            id: decoded.userId,
            username: 'admin',
            role: 'admin'
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '无效的管理员token'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'token验证失败'
    });
  }
});

// 仪表板统计数据接口
app.get('/api/admin/dashboard/stats', (req, res) => {
  try {
    // 计算统计数据
    const totalUsers = memoryUsers.length;
    const activeUsers = Math.floor(totalUsers * 0.7); // 假设70%为活跃用户
    const totalCredits = memoryUsers.reduce((sum, user) => sum + (user.credits || 0), 0);
    const todayGeneration = Math.floor(Math.random() * 100) + 50; // 模拟今日生成数

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalCredits,
        todayGeneration
      }
    });
  } catch (error) {
    logger.error('获取仪表板统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

// 仪表板图表数据接口
app.get('/api/admin/dashboard/charts', (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    // 生成模拟的使用趋势数据
    const usage = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      usage.push({
        date: date.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 20,
        generations: Math.floor(Math.random() * 200) + 100,
        credits: Math.floor(Math.random() * 1000) + 500
      });
    }

    res.json({
      success: true,
      data: {
        usage
      }
    });
  } catch (error) {
    logger.error('获取仪表板图表数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取图表数据失败'
    });
  }
});

// 仪表板最近活动接口
app.get('/api/admin/dashboard/activities', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // 生成模拟的最近活动数据
    const activities = [
      {
        id: 1,
        user: '用户001',
        action: '使用了模特图裂变工具',
        time: '2分钟前',
        avatarSeed: '1'
      },
      {
        id: 2,
        user: '用户002',
        action: '购买了高级会员',
        time: '5分钟前',
        avatarSeed: '2'
      },
      {
        id: 3,
        user: '用户003',
        action: '使用了商品图场景更换',
        time: '8分钟前',
        avatarSeed: '3'
      },
      {
        id: 4,
        user: '用户004',
        action: '充值了1000积分',
        time: '12分钟前',
        avatarSeed: '4'
      },
      {
        id: 5,
        user: '用户005',
        action: '使用了抠图去底工具',
        time: '15分钟前',
        avatarSeed: '5'
      },
      {
        id: 6,
        user: '用户006',
        action: '使用了商品换色工具',
        time: '18分钟前',
        avatarSeed: '6'
      },
      {
        id: 7,
        user: '用户007',
        action: '注册成为新用户',
        time: '25分钟前',
        avatarSeed: '7'
      },
      {
        id: 8,
        user: '用户008',
        action: '使用了姿态变换工具',
        time: '30分钟前',
        avatarSeed: '8'
      }
    ];

    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedActivities
    });
  } catch (error) {
    logger.error('获取仪表板活动数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取活动数据失败'
    });
  }
});

// AI工具管理接口
app.get('/api/admin/ai-tools', (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    
    let filteredTools = [...memoryTools];
    
    // 搜索过滤
    if (search) {
      filteredTools = filteredTools.filter(tool => 
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // 分类过滤
    if (category) {
      filteredTools = filteredTools.filter(tool => tool.category === category);
    }
    
    // 状态过滤 (为工具添加状态字段)
    filteredTools = filteredTools.map(tool => ({
      ...tool,
      status: tool.status || 'active', // 默认状态为active
      createdAt: tool.createdAt || new Date().toISOString(),
      updatedAt: tool.updatedAt || new Date().toISOString()
    }));
    
    if (status) {
      filteredTools = filteredTools.filter(tool => tool.status === status);
    }
    
    // 分页
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTools = filteredTools.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        tools: paginatedTools,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: filteredTools.length,
          totalPages: Math.ceil(filteredTools.length / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('获取AI工具列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工具列表失败'
    });
  }
});

// 获取单个AI工具详情
app.get('/api/admin/ai-tools/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tool = memoryTools.find(t => t.id === id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: '工具不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...tool,
        status: tool.status || 'active',
        createdAt: tool.createdAt || new Date().toISOString(),
        updatedAt: tool.updatedAt || new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('获取AI工具详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工具详情失败'
    });
  }
});

// 创建新的AI工具
app.post('/api/admin/ai-tools', (req, res) => {
  try {
    const { name, description, category, icon, creditCost } = req.body;
    
    if (!name || !description || !category || !creditCost) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的工具信息'
      });
    }
    
    const newTool = {
      id: `tool-${Date.now()}`,
      name,
      description,
      category,
      icon: icon || '🔧',
      creditCost: parseInt(creditCost),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    memoryTools.push(newTool);
    
    res.json({
      success: true,
      message: '工具创建成功',
      data: newTool
    });
  } catch (error) {
    logger.error('创建AI工具失败:', error);
    res.status(500).json({
      success: false,
      message: '创建工具失败'
    });
  }
});

// 更新AI工具
app.put('/api/admin/ai-tools/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, icon, creditCost, status } = req.body;
    
    const toolIndex = memoryTools.findIndex(t => t.id === id);
    if (toolIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '工具不存在'
      });
    }
    
    // 更新工具信息
    memoryTools[toolIndex] = {
      ...memoryTools[toolIndex],
      ...(name && { name }),
      ...(description && { description }),
      ...(category && { category }),
      ...(icon && { icon }),
      ...(creditCost && { creditCost: parseInt(creditCost) }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: '工具更新成功',
      data: memoryTools[toolIndex]
    });
  } catch (error) {
    logger.error('更新AI工具失败:', error);
    res.status(500).json({
      success: false,
      message: '更新工具失败'
    });
  }
});

// 删除AI工具
app.delete('/api/admin/ai-tools/:id', (req, res) => {
  try {
    const { id } = req.params;
    const toolIndex = memoryTools.findIndex(t => t.id === id);
    
    if (toolIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '工具不存在'
      });
    }
    
    memoryTools.splice(toolIndex, 1);
    
    res.json({
      success: true,
      message: '工具删除成功'
    });
  } catch (error) {
    logger.error('删除AI工具失败:', error);
    res.status(500).json({
      success: false,
      message: '删除工具失败'
    });
  }
});

// 切换AI工具状态
app.patch('/api/admin/ai-tools/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      });
    }
    
    const toolIndex = memoryTools.findIndex(t => t.id === id);
    if (toolIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '工具不存在'
      });
    }
    
    memoryTools[toolIndex].status = status;
    memoryTools[toolIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: '工具状态更新成功',
      data: memoryTools[toolIndex]
    });
  } catch (error) {
    logger.error('切换AI工具状态失败:', error);
    res.status(500).json({
      success: false,
      message: '状态更新失败'
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { phone, email, password } = req.body || {};
  if (!phone && !email) {
    return res.status(400).json({ success: false, message: '请提供手机号或邮箱登录' });
  }

  const user = memoryUsers.find((candidate) => {
    if (phone && candidate.phone === phone) return true;
    if (email && candidate.email === email) return true;
    return false;
  });

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: '账号或密码错误' });
  }

  const token = signToken({ userId: user.id, loginMethod: 'phone' });
  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      user: buildUserPayload({ ...user, loginMethod: 'phone' })
    }
  });
});

app.post('/api/auth/wechat-login', (req, res) => {
  const user = { ...memoryUsers[0], loginMethod: 'wechat' };
  const token = signToken({ userId: user.id, loginMethod: 'wechat' });
  res.json({
    success: true,
    message: '微信登录成功',
    data: {
      token,
      user: buildUserPayload(user)
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = ensureAuth(req, res);
  if (!user) return;
  res.json({ success: true, data: { user: buildUserPayload(user) } });
});

// ---------------- 工具相关 ----------------
app.get('/api/tools', (req, res) => {
  res.json({ success: true, data: memoryTools });
});

app.get('/api/tools/history', (req, res) => {
  const user = ensureAuth(req, res);
  if (!user) return;
  res.json({ success: true, data: memoryGenerationHistory[user.id] || [] });
});

app.post('/api/tools/generate', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'referenceImage', maxCount: 1 }
]), async (req, res) => {
  const user = ensureAuth(req, res);
  if (!user) return;

  const { toolId, prompt } = req.body || {};
  if (!toolId) {
    return res.status(400).json({ success: false, message: '缺少工具ID' });
  }

  const tool = memoryTools.find((candidate) => candidate.id === toolId);
  if (!tool) {
    return res.status(404).json({ success: false, message: '未找到指定工具' });
  }

  const mainImageBuffer = req.files?.mainImage?.[0]?.buffer;
  const referenceImageBuffer = req.files?.referenceImage?.[0]?.buffer;
  if (!mainImageBuffer || !referenceImageBuffer) {
    return res.status(400).json({ success: false, message: '主图和参考图均为必传' });
  }

  let generationRecord;
  try {
    const mergedImageBuffer = await blendImages(mainImageBuffer, referenceImageBuffer);
    const mergedImageBase64 = mergedImageBuffer.toString('base64');

    generationRecord = {
      id: `gen-${toolId}-${Date.now()}`,
      toolId,
      creditsCost: tool.creditCost,
      resultImage: `data:image/png;base64,${mergedImageBase64}`,
      createdAt: new Date().toISOString(),
      prompt: prompt || null,
      description: `${tool.name} 生成结果`
    };
  } catch (error) {
    logger.error('生成图片失败:', error);
    return res.status(500).json({ success: false, message: '生成图片失败，请稍后重试' });
  }

  const history = memoryGenerationHistory[user.id] || [];
  history.unshift(generationRecord);
  memoryGenerationHistory[user.id] = history;

  const referral = findReferralData(user.id);
  referral.creditHistory.unshift({
    id: `credit-${Date.now()}`,
    type: 'consumption',
    amount: -tool.creditCost,
    description: `${tool.name} 消耗积分`,
    createdAt: new Date().toISOString()
  });
  syncCreditHistory(user.id);

  res.json({
    success: true,
    data: generationRecord
  });
});

// ---------------- 订阅相关 ----------------
app.get('/api/subscription/plans', subscriptionController.getSubscriptionPlans);

// ---------------- 推广码相关 ----------------
app.post('/api/referral/code/generate', (req, res) => {
  const user = ensureAuth(req, res);
  if (!user) return;

  let referral = memoryReferralData[user.id];
  if (!referral) {
    referral = {
      referralCode: `ND${Date.now().toString().slice(-6)}`,
      isActive: true,
      referralDetails: [],
      creditHistory: []
    };
    memoryReferralData[user.id] = referral;
  }

  referral.referralCode = referral.referralCode || `ND${Date.now().toString().slice(-6)}`;
  referral.isActive = true;
  memoryReferralCodes[referral.referralCode] = {
    code: referral.referralCode,
    referrerUserId: user.id,
    referrerName: user.username,
    rewardCredits: 120,
    createdAt: new Date().toISOString()
  };

  res.json({ success: true, data: { referralCode: referral.referralCode } });
});

app.post('/api/referral/code/validate', (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ success: false, message: '缺少推广码' });
  }

  const record = memoryReferralCodes[code.toUpperCase()];
  if (!record) {
    return res.json({ success: true, data: { valid: false } });
  }

  res.json({
    success: true,
    data: {
      valid: true,
      referrer: {
        id: record.referrerUserId,
        name: record.referrerName
      }
    }
  });
});

// ---------------- 推广关系 ----------------
app.post('/api/referral/relationship', (req, res) => {
  const user = ensureAuth(req, res);
  if (!user) return;

  const { refereeId, referralCode } = req.body || {};
  if (!refereeId || !referralCode) {
    return res.status(400).json({ success: false, message: '缺少被推荐用户或推广码' });
  }

  const codeRecord = memoryReferralCodes[referralCode.toUpperCase()];
  if (!codeRecord) {
    return res.status(404).json({ success: false, message: '推广码无效' });
  }

  const referrerId = codeRecord.referrerUserId;
  let referral = memoryReferralData[referrerId];
  if (!referral) {
    referral = {
      referralCode,
      isActive: true,
      referralDetails: [],
      creditHistory: []
    };
    memoryReferralData[referrerId] = referral;
  }

  const newRelationship = {
    id: `ref-${Date.now()}`,
    referredUsername: refereeId,
    rewardCredits: codeRecord.rewardCredits,
    status: 'pending',
    registrationStatus: 'in_progress',
    createdAt: new Date().toISOString()
  };

  referral.referralDetails.unshift(newRelationship);
  referral.creditHistory.unshift({
    id: `credit-${Date.now()}`,
    type: 'referral_reward',
    amount: codeRecord.rewardCredits,
    description: `推广奖励：${refereeId}`,
    createdAt: new Date().toISOString()
  });

  refreshReferralConversion(referrerId);
  syncCreditHistory(referrerId);

  res.json({ success: true, data: newRelationship });
});

app.get('/api/referral/user/:userId', (req, res) => {
  const { userId } = req.params;
  const referral = findReferralData(userId);
  res.json({
    success: true,
    data: {
      referralCode: referral.referralCode,
      isActive: referral.isActive,
      totalReferrals: referral.totalReferrals,
      totalEarnings: referral.totalEarnings,
      successfulReferrals: referral.successfulReferrals,
      conversionRate: referral.conversionRate
    }
  });
});

app.get('/api/referral/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const referral = findReferralData(userId);
  res.json({ success: true, data: referral });
});

app.get('/api/referral/list/:userId', (req, res) => {
  const { userId } = req.params;
  const referral = findReferralData(userId);
  res.json({ success: true, data: referral.referralDetails });
});

app.get('/api/referral/credits/:userId', (req, res) => {
  const { userId } = req.params;
  const referral = findReferralData(userId);
  res.json({ success: true, data: referral.creditHistory });
});

// ---------------- 积分相关 ----------------
app.get('/api/credits/balance', (req, res) => {
  const user = ensureAuth(req, res);
  if (!user) return;
  res.json({ success: true, data: { credits: user.credits ?? 0 } });
});

app.get('/api/credits/history', (req, res) => {
  const user = ensureAuth(req, res);
  if (!user) return;
  const referral = findReferralData(user.id);
  res.json({ success: true, data: referral.creditHistory });
});

app.post('/api/credits/purchase', (req, res) => {
  const user = ensureAuth(req, res);
  if (!user) return;

  const { credits, bonus = 0 } = req.body || {};
  if (!credits || credits <= 0) {
    return res.status(400).json({ success: false, message: '积分数量无效' });
  }

  const total = credits + bonus;
  const referral = findReferralData(user.id);
  referral.creditHistory.unshift({
    id: `credit-${Date.now()}`,
    type: 'recharge',
    amount: total,
    description: `充值 ${credits} 积分${bonus > 0 ? `，赠送 ${bonus} 积分` : ''}`,
    createdAt: new Date().toISOString()
  });
  syncCreditHistory(user.id);

  res.json({ success: true, data: { credits: user.credits } });
});

// ---------------- 服务器启动 ----------------
app.listen(PORT, () => {
  logger.log(`✅ 后端服务已启动：http://localhost:${PORT}`);
});
