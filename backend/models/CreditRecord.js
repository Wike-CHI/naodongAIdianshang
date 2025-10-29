const mongoose = require('mongoose');

const creditRecordSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必需的']
  },
  type: {
    type: String,
    enum: ['earn', 'consumption', 'recharge', 'bonus', 'penalty', 'subscription', 'referral_reward'],
    required: [true, '积分类型是必需的']
  },
  amount: {
    type: Number,
    required: [true, '积分数量是必需的']
  },
  balance_before: {
    type: Number,
    required: [true, '变更前余额是必需的']
  },
  balance_after: {
    type: Number,
    required: [true, '变更后余额是必需的']
  },
  description: {
    type: String,
    maxlength: [500, '描述不能超过500个字符']
  },
  related_transaction_id: {
    type: String,
    default: null
  },
  metadata: {
    tool_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiTool'
    },
    subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    admin_operation: {
      admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
      },
      admin_username: String,
      operation_type: {
        type: String,
        enum: ['add', 'deduct']
      },
      reason: String
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 创建索引
creditRecordSchema.index({ user_id: 1, created_at: -1 });
creditRecordSchema.index({ type: 1 });
creditRecordSchema.index({ created_at: -1 });

// 静态方法：获取用户积分统计
creditRecordSchema.statics.getUserCreditStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        total_amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const balance = await this.findOne({ user_id: userId }).sort({ created_at: -1 }).select('balance_after');
  
  return {
    current_balance: balance ? balance.balance_after : 0,
    stats
  };
};

module.exports = mongoose.model('CreditRecord', creditRecordSchema);