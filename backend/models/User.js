const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } }
    },
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  phone: {
    type: String,
    index: {
      unique: true,
      partialFilterExpression: { phone: { $type: 'string' } }
    },
    match: [/^1[3-9]\d{9}$/, '请输入有效的手机号码']
  },
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    index: {
      unique: true,
      partialFilterExpression: { username: { $type: 'string' } }
    },
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
  wechat_id: {
    type: String,
    default: null,
    trim: true,
    maxlength: [50, '微信号不能超过50个字符']
  },
  business_type: {
    type: String,
    enum: ['个人', '个体工商户', '企业', '事业单位', '政府机关', '其他'],
    default: '个人'
  },
  credits_balance: {
    type: Number,
    default: 0,
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
  },
  profile_last_updated: {
    type: Date,
    default: null
  },
  profile_update_history: [{
    field: String,
    old_value: String,
    new_value: String,
    updated_at: {
      type: Date,
      default: Date.now
    }
  }],
  generated_assets: {
    type: [{
      generation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AIGeneration'
      },
      tool_key: {
        type: String,
        default: null
      },
      tool_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AiTool',
        default: null
      },
      public_url: {
        type: String,
        default: null
      },
      file_name: {
        type: String,
        default: null
      },
      mime_type: {
        type: String,
        default: null
      },
      width: {
        type: Number,
        default: null
      },
      height: {
        type: Number,
        default: null
      },
      index: {
        type: Number,
        default: 0
      },
      expires_at: {
        type: Date,
        default: null
      },
      created_at: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
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
userSchema.methods.deductCredits = async function(amount, options = {}) {
  if (this.credits_balance < amount) {
    throw new Error('积分余额不足');
  }
  this.credits_balance -= amount;

  if (options.record) {
    await this.model('CreditRecord').create({
      user_id: this._id,
      type: 'consumption',
      amount: -Math.abs(amount),
      balance_before: this.credits_balance + amount,
      balance_after: this.credits_balance,
      description: options.description || '生成内容消耗积分',
      metadata: options.metadata || {}
    });
  }

  return this.save();
};



// 增加积分
userSchema.methods.addCredits = async function(amount, options = {}) {
  this.credits_balance += amount;

  if (options.record) {
    await this.model('CreditRecord').create({
      user_id: this._id,
      type: 'bonus',
      amount: Math.abs(amount),
      balance_before: this.credits_balance - amount,
      balance_after: this.credits_balance,
      description: options.description || '积分奖励',
      metadata: options.metadata || {}
    });
  }

  return this.save();
};

// 检查是否可以修改个人资料（30天限制）
userSchema.methods.canUpdateProfile = function() {
  if (!this.profile_last_updated) {
    return { canUpdate: true, message: '首次修改' };
  }

  const now = new Date();
  const lastUpdate = new Date(this.profile_last_updated);
  const millisecondsInDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / millisecondsInDay);

  if (daysDiff >= 30) {
    return { canUpdate: true, message: '可以修改' };
  }

  const remainingDays = Math.max(30 - daysDiff, 0);
  return {
    canUpdate: false,
    message: `距离上次修改不足30天，还需等待${remainingDays}天`,
    remainingDays
  };
};

// 更新个人资料并记录历史
userSchema.methods.updateProfileWithHistory = function(updates = {}) {
  const restrictedFields = ['phone', 'email', 'wechat_id', 'business_type'];
  const updatedRestrictedFields = [];

  Object.entries(updates).forEach(([field, newValue]) => {
    const normalizedNewValue = newValue === undefined ? null : newValue;
    const currentValue = this[field] === undefined ? null : this[field];

    if (restrictedFields.includes(field) && normalizedNewValue !== currentValue) {
      this.profile_update_history.push({
        field,
        old_value: currentValue ?? '',
        new_value: normalizedNewValue ?? '',
        updated_at: new Date()
      });
      updatedRestrictedFields.push(field);
    }

    this[field] = normalizedNewValue;
  });

  if (updatedRestrictedFields.length > 0) {
    this.profile_last_updated = new Date();
  }

  return updatedRestrictedFields;
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

// 创建索引
userSchema.index({ created_at: -1 });
userSchema.index({ is_active: 1 });
userSchema.index({ 'generated_assets.created_at': -1 });

module.exports = mongoose.model('User', userSchema);
