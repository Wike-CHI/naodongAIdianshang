const mongoose = require('mongoose');

const creditPackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '套餐名称是必需的'],
    unique: true,
    trim: true,
    maxlength: [100, '套餐名称不能超过100个字符']
  },
  description: {
    type: String,
    maxlength: [500, '套餐描述不能超过500个字符']
  },
  credits: {
    type: Number,
    required: [true, '积分数量是必需的'],
    min: [1, '积分数量至少为1']
  },
  price: {
    type: Number,
    required: [true, '价格是必需的'],
    min: [0, '价格不能为负数']
  },
  bonus_credits: {
    type: Number,
    default: 0,
    min: [0, '奖励积分不能为负数']
  },
  // 限制只有年度会员可以购买
  requires_yearly_membership: {
    type: Boolean,
    default: true
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
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 静态方法：获取活跃套餐
creditPackageSchema.statics.getActivePackages = function() {
  return this.find({ active: true }).sort({ sort_order: 1, price: 1 });
};

// 静态方法：获取推荐套餐
creditPackageSchema.statics.getPopularPackages = function() {
  return this.find({ active: true, popular: true }).sort({ sort_order: 1 });
};

// 虚拟字段：总积分（包含奖励积分）
creditPackageSchema.virtual('total_credits').get(function() {
  return this.credits + this.bonus_credits;
});

// 虚拟字段：单价（每积分价格）
creditPackageSchema.virtual('price_per_credit').get(function() {
  return this.price / this.total_credits;
});

// 创建索引
creditPackageSchema.index({ active: 1, sort_order: 1 });
creditPackageSchema.index({ popular: 1 });
creditPackageSchema.index({ price: 1 });

module.exports = mongoose.model('CreditPackage', creditPackageSchema);