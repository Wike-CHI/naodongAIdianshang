const mongoose = require('mongoose');

const userCreditsSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  current_credits: { 
    type: Number, 
    default: 0,
    min: 0
  },
  total_earned: { 
    type: Number, 
    default: 0,
    min: 0
  },
  total_consumed: { 
    type: Number, 
    default: 0,
    min: 0
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { updatedAt: 'updated_at' }
});

// 创建索引
userCreditsSchema.index({ user_id: 1 }, { unique: true });

// 实例方法：增加积分
userCreditsSchema.methods.addCredits = function(amount, reason = '充值') {
  this.current_credits += amount;
  this.total_earned += amount;
  return this.save();
};

// 实例方法：消费积分
userCreditsSchema.methods.consumeCredits = function(amount, reason = '消费') {
  if (this.current_credits < amount) {
    throw new Error('积分不足');
  }
  this.current_credits -= amount;
  this.total_consumed += amount;
  return this.save();
};

// 实例方法：检查积分是否足够
userCreditsSchema.methods.hasEnoughCredits = function(amount) {
  return this.current_credits >= amount;
};

// 静态方法：获取用户积分
userCreditsSchema.statics.getUserCredits = async function(userId) {
  let credits = await this.findOne({ user_id: userId });
  if (!credits) {
    // 如果用户没有积分记录，创建一个
    credits = new this({
      user_id: userId,
      current_credits: 0,
      total_earned: 0,
      total_consumed: 0
    });
    await credits.save();
  }
  return credits;
};

module.exports = mongoose.model('UserCredits', userCreditsSchema);