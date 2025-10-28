const mongoose = require('mongoose');

const creditRecordSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['consumption', 'recharge', 'referral_reward', 'admin_adjustment', 'subscription_bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  balance_before: {
    type: Number,
    required: true
  },
  balance_after: {
    type: Number,
    required: true
  },
  related_id: {
    type: String,
    default: null
  },
  admin_operation: {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    admin_username: String,
    reason: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// 索引
creditRecordSchema.index({ user_id: 1, createdAt: -1 });
creditRecordSchema.index({ type: 1 });
creditRecordSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CreditRecord', creditRecordSchema);