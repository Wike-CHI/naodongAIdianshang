const Joi = require('joi');

// 验证中间件
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const target = property === 'query' ? req.query : property === 'params' ? req.params : req.body;
    const { error, value } = schema.validate(target, { abortEarly: false, stripUnknown: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((detail) => detail.message).join(', ')
      });
    }

    if (property === 'body') {
      req.body = value;
    } else if (property === 'query') {
      req.query = value;
    } else if (property === 'params') {
      req.params = value;
    }

    next();
  };
};

// 验证模式
const schemas = {
  userRegister: Joi.object({
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/),
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required()
  }).or('email', 'phone'),

  userLogin: Joi.object({
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/),
    username: Joi.string().min(2).max(50),
    password: Joi.string().required()
  }).or('email', 'phone', 'username'),

  adminLogin: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  verifyEmail: Joi.object({
    token: Joi.string().required()
  }),

  // AI工具验证模式
  aiTool: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    category: Joi.string().required(),
    type: Joi.string().required(),
    icon: Joi.string().optional(),
    credit_cost: Joi.number().min(0).required(),
    enabled: Joi.boolean().optional(),
    maintenance_mode: Joi.boolean().optional(),
    config: Joi.object().optional(),
    metadata: Joi.object().optional()
  }),

  // 批量AI工具更新验证模式
  batchAIToolUpdate: Joi.object({
    tool_ids: Joi.array().items(Joi.string()).min(1).required(),
    action: Joi.string().valid('enable', 'disable', 'delete', 'update_category').required(),
    data: Joi.object().optional()
  }),

  // 订阅套餐验证模式
  subscriptionPlan: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().min(0).required(),
    duration_months: Joi.number().min(1).required(),
    benefits: Joi.object({
      monthly_credits: Joi.number().min(0).required(),
      priority_processing: Joi.boolean().optional(),
      advanced_features: Joi.boolean().optional(),
      support_level: Joi.string().valid('basic', 'priority', 'enterprise').optional(),
      api_access: Joi.boolean().optional(),
      max_concurrent_jobs: Joi.number().min(1).optional(),
      max_file_size: Joi.string().optional(),
      custom_models: Joi.boolean().optional(),
      batch_processing: Joi.boolean().optional(),
      white_label: Joi.boolean().optional(),
      dedicated_support: Joi.boolean().optional()
    }).required(),
    features: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      enabled: Joi.boolean().optional()
    })).optional(),
    limitations: Joi.object({
      daily_generation_limit: Joi.number().min(0).allow(null).optional(),
      monthly_generation_limit: Joi.number().min(0).allow(null).optional(),
      storage_limit: Joi.string().optional()
    }).optional(),
    active: Joi.boolean().optional(),
    sort_order: Joi.number().optional(),
    popular: Joi.boolean().optional(),
    trial_days: Joi.number().min(0).optional(),
    discount_percentage: Joi.number().min(0).max(100).optional(),
    original_price: Joi.number().min(0).allow(null).optional(),
    currency: Joi.string().valid('CNY', 'USD', 'EUR').optional(),
    billing_cycle: Joi.string().valid('monthly', 'yearly', 'one_time').optional(),
    auto_renewal: Joi.boolean().optional(),
    cancellation_policy: Joi.string().optional()
  }),

  // 创建订阅验证模式
  createSubscription: Joi.object({
    plan_id: Joi.string().required(),
    payment_method: Joi.string().valid('alipay', 'wechat', 'stripe', 'paypal', 'admin').required(),
    transaction_id: Joi.string().required(),
    auto_renew: Joi.boolean().optional()
  }),

  // 续费订阅验证模式
  renewSubscription: Joi.object({
    payment_method: Joi.string().valid('alipay', 'wechat', 'stripe', 'paypal', 'admin').required(),
    transaction_id: Joi.string().required()
  }),

  // 批量更新订阅验证模式
  batchSubscriptionUpdate: Joi.object({
    subscription_ids: Joi.array().items(Joi.string()).min(1).required(),
    action: Joi.string().valid('cancel', 'pause', 'resume').required()
  }),

  // 调整积分验证模式
  adjustCredits: Joi.object({
    user_id: Joi.string().required(),
    amount: Joi.number().required(),
    type: Joi.string().valid('add', 'deduct').required(),
    description: Joi.string().optional()
  }),

  // 批量调整积分验证模式
  batchAdjustCredits: Joi.object({
    adjustments: Joi.array().items(Joi.object({
      user_id: Joi.string().required(),
      amount: Joi.number().required(),
      type: Joi.string().valid('add', 'deduct').required(),
      description: Joi.string().optional()
    })).min(1).required()
  }),

  // ID参数验证模式
  idParam: Joi.object({
    id: Joi.string().required()
  }),

  // 分页验证模式
  pagination: Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional()
  }),

  aiGenerate: Joi.object({
    prompt: Joi.string().allow('', null).optional(),
    options: Joi.object({
      resolution: Joi.string().valid('0.5k', '1080p', '2k').default('1080p'),
      quantity: Joi.number().integer().min(1).max(4).default(1),
      mode: Joi.string().valid('fast', 'ultra').default('fast')
    }).default({}),
    metadata: Joi.object({
      toolId: Joi.string().optional(),
      hasMain: Joi.boolean().optional(),
      hasReference: Joi.boolean().optional()
    }).default({})
  }).unknown(true),

  generateHistoryQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    toolId: Joi.string().optional(),
    status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled').optional(),
    days: Joi.number().integer().min(1).max(90).optional()
  }),

  generationIdParam: Joi.object({
    recordId: Joi.string().hex().length(24).required()
  })
};

module.exports = { validate, schemas };