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

// 创建索引
subscriptionPlanSchema.index({ active: 1, sort_order: 1 });
subscriptionPlanSchema.index({ popular: 1 });
subscriptionPlanSchema.index({ price: 1 });
subscriptionPlanSchema.index({ billing_cycle: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);