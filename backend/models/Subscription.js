const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必需的']
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: [true, '套餐ID是必需的']
  },
  start_date: {
    type: Date,
    required: [true, '开始日期是必需的'],
    default: Date.now
  },
  end_date: {
    type: Date,
    required: [true, '结束日期是必需的']
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended', 'trial'],
    default: 'active'
  },
  amount_paid: {
    type: Number,
    required: [true, '支付金额是必需的'],
    min: [0, '支付金额不能为负数']
  },
  currency: {
    type: String,
    default: 'CNY',
    enum: ['CNY', 'USD', 'EUR']
  },
  payment_method: {
    type: String,
    enum: ['alipay', 'wechat', 'stripe', 'paypal', 'admin'],
    required: [true, '支付方式是必需的']
  },
  transaction_id: {
    type: String,
    required: [true, '交易ID是必需的']
  },
  auto_renewal: {
    type: Boolean,
    default: true
  },
  renewal_date: {
    type: Date,
    default: null
  },
  cancelled_at: {
    type: Date,
    default: null
  },
  cancellation_reason: {
    type: String,
    default: null
  },
  trial_end_date: {
    type: Date,
    default: null
  },
  credits_granted: {
    type: Number,
    default: 0
  },
  credits_used: {
    type: Number,
    default: 0
  },
  usage_stats: {
    total_generations: {
      type: Number,
      default: 0
    },
    total_processing_time: {
      type: Number,
      default: 0
    },
    favorite_tools: [{
      tool_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AITool'
      },
      usage_count: Number
    }]
  },
  metadata: {
    // 订单相关信息
    order_id: String,
    invoice_id: String,
    
    // 推广相关
    referral_code: String,
    discount_code: String,
    discount_amount: Number,
    
    // 升级/降级记录
    previous_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan'
    },
    upgrade_date: Date,
    
    // 管理员操作
    admin_notes: String,
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 虚拟字段：是否活跃
subscriptionSchema.virtual('is_active').get(function() {
  return this.status === 'active' && this.end_date > new Date();
});

// 虚拟字段：剩余天数
subscriptionSchema.virtual('days_remaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diffTime = this.end_date - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// 虚拟字段：使用率
subscriptionSchema.virtual('usage_percentage').get(function() {
  if (this.credits_granted === 0) return 0;
  return Math.round((this.credits_used / this.credits_granted) * 100);
});

// 静态方法：获取用户当前订阅
subscriptionSchema.statics.getCurrentSubscription = function(userId) {
  return this.findOne({
    user_id: userId,
    status: 'active',
    end_date: { $gt: new Date() }
  }).populate('plan_id');
};

// 静态方法：获取即将到期的订阅
subscriptionSchema.statics.getExpiringSubscriptions = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    end_date: { $lte: futureDate, $gt: new Date() },
    auto_renewal: false
  }).populate('user_id plan_id');
};

// 静态方法：获取订阅统计
subscriptionSchema.statics.getStats = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        created_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_revenue: { $sum: '$amount_paid' }
      }
    }
  ]);
  
  return stats;
};

// 实例方法：续费
subscriptionSchema.methods.renew = async function(months = 1) {
  const newEndDate = new Date(this.end_date);
  newEndDate.setMonth(newEndDate.getMonth() + months);
  
  this.end_date = newEndDate;
  this.status = 'active';
  this.renewal_date = new Date();
  
  return this.save();
};

// 实例方法：取消订阅
subscriptionSchema.methods.cancel = async function(reason = null) {
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  this.cancellation_reason = reason;
  this.auto_renewal = false;
  
  return this.save();
};

// 实例方法：暂停订阅
subscriptionSchema.methods.suspend = async function() {
  this.status = 'suspended';
  return this.save();
};

// 实例方法：恢复订阅
subscriptionSchema.methods.resume = async function() {
  if (this.end_date > new Date()) {
    this.status = 'active';
  } else {
    this.status = 'expired';
  }
  return this.save();
};

// 实例方法：检查是否可以使用功能
subscriptionSchema.methods.canUseFeature = function(featureName) {
  if (!this.is_active) return false;
  
  // 这里需要结合套餐信息来判断
  // 实际使用时需要populate plan_id
  return true;
};

// 实例方法：更新使用统计
subscriptionSchema.methods.updateUsageStats = function(toolId, creditsUsed, processingTime) {
  this.credits_used += creditsUsed;
  this.usage_stats.total_generations += 1;
  this.usage_stats.total_processing_time += processingTime;
  
  // 更新最常用工具统计
  const existingTool = this.usage_stats.favorite_tools.find(
    tool => tool.tool_id.toString() === toolId.toString()
  );
  
  if (existingTool) {
    existingTool.usage_count += 1;
  } else {
    this.usage_stats.favorite_tools.push({
      tool_id: toolId,
      usage_count: 1
    });
  }
  
  // 保持最多10个最常用工具
  this.usage_stats.favorite_tools.sort((a, b) => b.usage_count - a.usage_count);
  this.usage_stats.favorite_tools = this.usage_stats.favorite_tools.slice(0, 10);
  
  return this.save();
};

// 中间件：自动更新过期状态
subscriptionSchema.pre('save', function(next) {
  if (this.status === 'active' && this.end_date <= new Date()) {
    this.status = 'expired';
  }
  next();
});

// 创建索引
subscriptionSchema.index({ user_id: 1, status: 1 });
subscriptionSchema.index({ plan_id: 1 });
subscriptionSchema.index({ status: 1, end_date: 1 });
subscriptionSchema.index({ created_at: -1 });
subscriptionSchema.index({ end_date: 1 });
subscriptionSchema.index({ auto_renewal: 1, end_date: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);