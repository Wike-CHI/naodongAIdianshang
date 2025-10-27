const Joi = require('joi');

// 验证中间件
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
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
  })
};

module.exports = { validate, schemas };