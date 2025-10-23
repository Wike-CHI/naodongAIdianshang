const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  plan_id: { 
    type: String, 
    ref: 'SubscriptionPlan', 
    required: true 
  },
  start_date: { 
    type: Date, 
    required: true 
  },
  end_date: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled'], 
    default: 'active' 
  },
  paid_amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    default: null
  },
  transaction_id: {
    type: String,
    default: null
  },
  auto_renew: {
    type: Boolean,
    default: false
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

// 创建索引
subscriptionSchema.index({ user_id: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ end_date: 1 });
subscriptionSchema.index({ plan_id: 1 });

// 实例方法：检查订阅是否有效
subscriptionSchema.methods.isValid = function() {
  return this.status === 'active' && this.end_date > new Date();
};

// 实例方法：取消订阅
subscriptionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.auto_renew = false;
  return this.save();
};

// 实例方法：续费
subscriptionSchema.methods.renew = function(months, paidAmount) {
  const currentEndDate = this.end_date > new Date() ? this.end_date : new Date();
  this.end_date = new Date(currentEndDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);
  this.status = 'active';
  this.paid_amount += paidAmount;
  return this.save();
};

// 静态方法：获取用户当前有效订阅
subscriptionSchema.statics.getUserActiveSubscription = function(userId) {
  return this.findOne({
    user_id: userId,
    status: 'active',
    end_date: { $gt: new Date() }
  }).populate('plan_id');
};

// 静态方法：获取即将过期的订阅
subscriptionSchema.statics.getExpiringSubscriptions = function(days = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return this.find({
    status: 'active',
    end_date: { 
      $gte: new Date(),
      $lte: expiryDate 
    }
  }).populate('user_id plan_id');
};

// 静态方法：更新过期订阅
subscriptionSchema.statics.updateExpiredSubscriptions = function() {
  return this.updateMany(
    {
      status: 'active',
      end_date: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

module.exports = mongoose.model('Subscription', subscriptionSchema);