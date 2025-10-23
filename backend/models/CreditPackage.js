const mongoose = require('mongoose');

const creditPackageSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    maxlength: 100,
    trim: true
  },
  credits_amount: { 
    type: Number, 
    required: true,
    min: 1
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  bonus_credits: { 
    type: Number, 
    default: 0,
    min: 0
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
  _id: false, // 禁用自动生成的 _id，使用自定义的字符串 _id
  timestamps: { createdAt: 'created_at' }
});

// 静态方法：获取活跃的充值套餐
creditPackageSchema.statics.getActivePackages = function() {
  return this.find({ is_active: true }).sort({ price: 1 });
};

// 实例方法：计算总积分（基础积分 + 赠送积分）
creditPackageSchema.methods.getTotalCredits = function() {
  return this.credits_amount + this.bonus_credits;
};

// 实例方法：计算性价比（积分/价格）
creditPackageSchema.methods.getValueRatio = function() {
  return this.getTotalCredits() / this.price;
};

module.exports = mongoose.model('CreditPackage', creditPackageSchema);