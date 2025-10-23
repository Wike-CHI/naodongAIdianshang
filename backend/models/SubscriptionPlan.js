const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
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
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  duration_months: { 
    type: Number, 
    required: true,
    min: 1
  },
  benefits: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

// 静态方法：获取活跃的套餐
subscriptionPlanSchema.statics.getActivePlans = function() {
  return this.find({ is_active: true }).sort({ price: 1 });
};

// 实例方法：计算折扣
subscriptionPlanSchema.methods.getDiscount = function() {
  return this.benefits?.discount || 1;
};

// 实例方法：检查是否有优先权
subscriptionPlanSchema.methods.hasPriority = function() {
  return this.benefits?.priority || false;
};

// 实例方法：获取专属工具
subscriptionPlanSchema.methods.getExclusiveTools = function() {
  return this.benefits?.exclusive_tools || [];
};

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);