const Joi = require('joi');

// 验证中间件
const validate = (schema) => {
  return (req, res, next) => {
    // 根据请求方法决定验证哪个部分
    let dataToValidate;
    if (req.method === 'GET') {
      dataToValidate = req.query;
    } else {
      dataToValidate = req.body;
    }

    const { error } = schema.validate(dataToValidate);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
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
    password: Joi.string().required()
  }).or('email', 'phone'),

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

  // 分页验证
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().default('-created_at'),
    search: Joi.string().allow('').default('')
  }),

  // 用户管理验证
  userUpdate: Joi.object({
    username: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/),
    is_active: Joi.boolean(),
    credits: Joi.number().integer().min(0)
  }),

  // 积分调整验证
  creditAdjustment: Joi.object({
    user_id: Joi.string().required(),
    amount: Joi.number().required(),
    type: Joi.string().required(),
    description: Joi.string().allow(''),
    admin_notes: Joi.string().allow('')
  }),

  // AI工具验证
  aiToolCreate: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().required(),
    category: Joi.string().required(),
    cost_per_use: Joi.number().min(0).required(),
    is_active: Joi.boolean().default(true),
    config: Joi.object().default({})
  }),

  aiToolUpdate: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    type: Joi.string(),
    category: Joi.string(),
    cost_per_use: Joi.number().min(0),
    is_active: Joi.boolean(),
    config: Joi.object()
  })
};

module.exports = { validate, schemas };