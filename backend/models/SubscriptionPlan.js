const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '套餐名称是必需的'],
    unique: true,
    trim: true,
    maxlength: [100, '套餐名称不能超过100个字符']
  },
  description: {
    type: String,
    required: [true, '套餐描述是必需的'],
    maxlength: [500, '套餐描述不能超过500个字符']
  },
  price: {
    type: Number,
    required: [true, '价格是必需的'],
    min: [0, '价格不能为负数']
  },
  duration_months: {
    type: Number,
    required: [true, '订阅时长是必需的'],
    min: [1, '订阅时长至少为1个月']
  },
  benefits: {
    monthly_credits: {
      type: Number,
      required: [true, '每月积分是必需的'],
      min: [0, '每月积分不能为负数']
    },
    priority_processing: {
      type: Boolean,
      default: false
    },
    advanced_features: {
      type: Boolean,
      default: false
    },
    support_level: {
      type: String,
      enum: ['basic', 'priority', 'enterprise'],
      default: 'basic'
    },
    api_access: {
      type: Boolean,
      default: false
    },
    max_concurrent_jobs: {
      type: Number,
      default: 1
    },
    max_file_size: {
      type: String,
      default: '10MB'
    },
    custom_models: {
      type: Boolean,
      default: false
    },
    batch_processing: {
      type: Boolean,
      default: false
    },
    white_label: {
      type: Boolean,
      default: false
    },
    dedicated_support: {
      type: Boolean,
      default: false
    }
  },
  features: [{
    name: String,
    description: String,
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  // 年度会员特定权益
  yearly_benefits: {
    extra_credits: {
      type: Number,
      default: 0
    },
    exclusive_features: [{
      type: String
    }],
    priority_support: {
      type: Boolean,
      default: false
    }
  },
  limitations: {
    daily_generation_limit: {
      type: Number,
      default: null // null表示无限制
    },
    monthly_generation_limit: {
      type: Number,
      default: null
    },
    storage_limit: {
      type: String,
      default: '1GB'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  sort_order: {
    type: Number,
    default: 0
  },
  popular: {
    type: Boolean,
    default: false
  },
  trial_days: {
    type: Number,
    default: 0
  },
  discount_percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  original_price: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    default: 'CNY',
    enum: ['CNY', 'USD', 'EUR']
  },
  billing_cycle: {
    type: String,
    enum: ['monthly', 'yearly', 'one_time'],
    default: 'monthly'
  },
  auto_renewal: {
    type: Boolean,
    default: true
  },
  cancellation_policy: {
    type: String,
    default: '可随时取消，剩余时间按比例退款'
  },
  // 年度会员特定字段
  is_yearly: {
    type: Boolean,
    default: false
  },
  yearly_price: {
    type: Number,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 虚拟字段：实际价格（考虑折扣）
subscriptionPlanSchema.virtual('actual_price').get(function() {
  if (this.discount_percentage > 0) {
    return this.price * (1 - this.discount_percentage / 100);
  }
  return this.price;
});

// 虚拟字段：节省金额
subscriptionPlanSchema.virtual('savings').get(function() {
  if (this.discount_percentage > 0) {
    return this.price - this.actual_price;
  }
  return 0;
});

// 静态方法：获取活跃套餐
subscriptionPlanSchema.statics.getActivePlans = function() {
  return this.find({ active: true }).sort({ sort_order: 1, price: 1 });
};

// 静态方法：获取推荐套餐
subscriptionPlanSchema.statics.getPopularPlans = function() {
  return this.find({ active: true, popular: true }).sort({ sort_order: 1 });
};

// 实例方法：检查用户是否有权限使用某个功能
subscriptionPlanSchema.methods.hasFeature = function(featureName) {
  return this.benefits[featureName] === true;
};

// 实例方法：获取套餐等级
subscriptionPlanSchema.methods.getTier = function() {
  if (this.price === 0) return 'free';
  if (this.price < 50) return 'basic';
  if (this.price < 200) return 'professional';
  return 'enterprise';
};

// 实例方法：计算年度价格
subscriptionPlanSchema.methods.getYearlyPrice = function() {
  if (this.billing_cycle === 'yearly') return this.actual_price;
  return this.actual_price * 12 * 0.8; // 年付8折
};

// 实例方法：是否为年度会员套餐
subscriptionPlanSchema.methods.isYearlyPlan = function() {
  return this.is_yearly === true;
};

// 实例方法：获取年度会员价格
subscriptionPlanSchema.methods.getYearlyMemberPrice = function() {
  if (this.isYearlyPlan() && this.yearly_price) {
    return this.yearly_price;
  }
  // 默认年度会员价格299元
  return 299;
};

// 实例方法：获取年度会员积分
subscriptionPlanSchema.methods.getYearlyMemberCredits = function() {
  if (this.isYearlyPlan()) {
    // 年度会员默认赠送12个月的积分
    return this.benefits.monthly_credits * 12;
  }
  return this.benefits.monthly_credits;
};

// 实例方法：获取年度会员时长（月）
subscriptionPlanSchema.methods.getYearlyMemberDuration = function() {
  if (this.isYearlyPlan()) {
    return 12; // 12个月
  }
  return this.duration_months;
};

// 实例方法：获取年度会员描述
subscriptionPlanSchema.methods.getYearlyMemberDescription = function() {
  if (this.isYearlyPlan()) {
    return `${this.name} - 年度会员，包含12个月积分和专属权益`;
  }
  return this.description;
};

// 实例方法：获取年度会员折扣信息
subscriptionPlanSchema.methods.getYearlyMemberDiscount = function() {
  if (this.isYearlyPlan() && this.price && this.yearly_price) {
    const monthlyCost = this.price * 12;
    const discount = ((monthlyCost - this.yearly_price) / monthlyCost * 100).toFixed(1);
    return {
      monthlyCost: monthlyCost,
      yearlyPrice: this.yearly_price,
      discountPercentage: discount,
      savings: monthlyCost - this.yearly_price
    };
  }
  return null;
};

// 创建索引
subscriptionPlanSchema.index({ active: 1, sort_order: 1 });
subscriptionPlanSchema.index({ popular: 1 });
subscriptionPlanSchema.index({ price: 1 });
subscriptionPlanSchema.index({ billing_cycle: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);