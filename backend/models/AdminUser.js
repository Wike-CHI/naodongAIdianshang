const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    index: {
      unique: true,
      partialFilterExpression: { username: { $type: 'string' } }
    },
    minlength: [3, '用户名至少需要3个字符'],
    maxlength: [30, '用户名不能超过30个字符'],
    trim: true
  },
  password_hash: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少需要6个字符']
  },
  role: {
    type: String,
    enum: ['super_admin', 'operation_admin', 'tech_admin'],
    required: [true, '角色是必需的']
  },
  permissions: [{
    type: String,
    enum: [
      '*', // 所有权限
      'users.read', 'users.write', 'users.delete',
      'ai_tools.read', 'ai_tools.write', 'ai_tools.delete',
      'credits.read', 'credits.write',
      'subscriptions.read', 'subscriptions.write',
      'content.read', 'content.write', 'content.delete',
      'database.read', 'database.write',
      'settings.read', 'settings.write'
    ]
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date,
    default: null
  },
  login_attempts: {
    type: Number,
    default: 0
  },
  locked_until: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 密码加密中间件
adminUserSchema.pre('save', async function(next) {
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
adminUserSchema.methods.validatePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// 更新最后登录时间
adminUserSchema.methods.updateLastLogin = function() {
  this.last_login = new Date();
  this.login_attempts = 0;
  this.locked_until = null;
  return this.save();
};

// 增加登录失败次数
adminUserSchema.methods.incrementLoginAttempts = function() {
  this.login_attempts += 1;
  
  // 如果失败次数达到5次，锁定账户30分钟
  if (this.login_attempts >= 5) {
    this.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30分钟
  }
  
  return this.save();
};

// 检查账户是否被锁定
adminUserSchema.methods.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

// 检查权限
adminUserSchema.methods.hasPermission = function(permission) {
  if (this.permissions.includes('*')) return true;
  return this.permissions.includes(permission);
};

// 隐藏敏感字段
adminUserSchema.methods.toJSON = function() {
  const adminObject = this.toObject();
  delete adminObject.password_hash;
  return adminObject;
};

// 创建索引
adminUserSchema.index({ role: 1 });
adminUserSchema.index({ is_active: 1 });

module.exports = mongoose.model('AdminUser', adminUserSchema);