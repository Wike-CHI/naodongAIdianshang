const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    maxlength: 50,
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: { 
    type: String, 
    unique: true, 
    sparse: true,
    trim: true
  },
  wechat_openid: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  avatar_url: {
    type: String,
    default: null
  },
  user_type: { 
    type: String, 
    enum: ['normal', 'vip'], 
    default: 'normal' 
  },
  password_hash: {
    type: String,
    required: function() {
      return !this.wechat_openid; // 微信登录用户不需要密码
    }
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 创建索引
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ wechat_openid: 1 });

// 虚拟字段：获取用户积分
userSchema.virtual('credits', {
  ref: 'UserCredits',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true
});

// 实例方法：检查是否为VIP用户
userSchema.methods.isVip = function() {
  return this.user_type === 'vip';
};

// 静态方法：根据登录类型查找用户
userSchema.statics.findByLoginType = function(type, identifier) {
  const query = {};
  switch (type) {
    case 'username':
      query.username = identifier;
      break;
    case 'email':
      query.email = identifier;
      break;
    case 'phone':
      query.phone = identifier;
      break;
    case 'wechat':
      query.wechat_openid = identifier;
      break;
    default:
      throw new Error('不支持的登录类型');
  }
  return this.findOne(query);
};

module.exports = mongoose.model('User', userSchema);