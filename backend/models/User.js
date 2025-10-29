const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,
    minlength: [2, '用户名至少需要2个字符'],
    maxlength: [50, '用户名不能超过50个字符'],
    trim: true
  },
  password_hash: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少需要6个字符']
  },
  avatar_url: {
    type: String,
    default: null
  },
  credits_balance: {
    type: Number,
    default: 100,
    min: [0, '积分余额不能为负数']
  },
  role: {
    type: String,
    enum: ['user', 'premium', 'vip'],
    default: 'user'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date,
    default: null
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  verification_token: {
    type: String,
    default: null
  },
  reset_password_token: {
    type: String,
    default: null
  },
  reset_password_expires: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 验证密码方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// 验证密码方法（兼容性）
userSchema.methods.validatePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// 更新最后登录时间
userSchema.methods.updateLastLogin = function() {
  this.last_login = new Date();
  return this.save();
};

// 扣除积分
userSchema.methods.deductCredits = async function(amount) {
  if (this.credits_balance < amount) {
    throw new Error('积分余额不足');
  }
  this.credits_balance -= amount;
  return this.save();
};

// 增加积分
userSchema.methods.addCredits = async function(amount) {
  this.credits_balance += amount;
  return this.save();
};

// 隐藏敏感字段
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password_hash;
  delete userObject.verification_token;
  delete userObject.reset_password_token;
  delete userObject.reset_password_expires;
  return userObject;
};

// 创建索引（注意：email、phone、username已在schema中定义为unique，会自动创建索引）
userSchema.index({ created_at: -1 });
userSchema.index({ is_active: 1 });

module.exports = mongoose.model('User', userSchema);