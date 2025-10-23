const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    maxlength: 50,
    trim: true
  },
  password_hash: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'operator'], 
    default: 'admin' 
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  last_login: {
    type: Date,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

// 创建索引
adminUserSchema.index({ username: 1 }, { unique: true });
adminUserSchema.index({ email: 1 }, { unique: true });

// 密码加密中间件
adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 实例方法：验证密码
adminUserSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

// 实例方法：更新最后登录时间
adminUserSchema.methods.updateLastLogin = function() {
  this.last_login = new Date();
  return this.save();
};

// 实例方法：检查权限
adminUserSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  if (this.permissions.all) return true;
  return this.permissions[permission] === true;
};

// 静态方法：创建管理员
adminUserSchema.statics.createAdmin = async function(userData) {
  const admin = new this(userData);
  return admin.save();
};

module.exports = mongoose.model('AdminUser', adminUserSchema);