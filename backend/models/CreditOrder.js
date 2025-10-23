const mongoose = require('mongoose');

const creditOrderSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  package_id: { 
    type: String, 
    ref: 'CreditPackage', 
    required: true 
  },
  credits_purchased: { 
    type: Number, 
    required: true,
    min: 1
  },
  paid_amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  payment_method: {
    type: String,
    enum: ['alipay', 'wechat', 'bank_card'],
    default: null
  },
  transaction_id: {
    type: String,
    unique: true,
    sparse: true
  },
  order_no: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `CR${timestamp}${random}`;
    }
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

// 创建索引
creditOrderSchema.index({ user_id: 1 });
creditOrderSchema.index({ payment_status: 1 });
creditOrderSchema.index({ created_at: -1 });
creditOrderSchema.index({ order_no: 1 }, { unique: true });
creditOrderSchema.index({ transaction_id: 1 }, { unique: true, sparse: true });

// 生成订单号
creditOrderSchema.statics.generateOrderNo = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CR${timestamp}${random}`;
};

// 实例方法：标记为已支付
creditOrderSchema.methods.markAsPaid = function(transactionId) {
  this.payment_status = 'paid';
  this.transaction_id = transactionId;
  return this.save();
};

// 实例方法：标记为失败
creditOrderSchema.methods.markAsFailed = function() {
  this.payment_status = 'failed';
  return this.save();
};

// 静态方法：获取用户订单历史
creditOrderSchema.statics.getUserOrders = function(userId, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  return this.find({ user_id: userId })
    .populate('package_id', 'name credits_amount bonus_credits')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(pageSize);
};

// 静态方法：获取收入统计
creditOrderSchema.statics.getRevenueStats = function(startDate, endDate) {
  const matchCondition = {
    payment_status: 'paid'
  };
  
  if (startDate && endDate) {
    matchCondition.created_at = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$paid_amount' },
        totalOrders: { $sum: 1 },
        totalCredits: { $sum: '$credits_purchased' }
      }
    }
  ]);
};

module.exports = mongoose.model('CreditOrder', creditOrderSchema);