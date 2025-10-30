const mongoose = require('mongoose');

const aiGenerationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必需的']
  },
  tool_key: {
    type: String,
    required: [true, '工具标识是必需的'],
    trim: true
  },
  tool_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiTool',
    required: [true, '工具ID是必需的']
  },
  input_data: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, '输入数据是必需的']
  },
  output_data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  credits_used: {
    type: Number,
    default: 0,
    min: [0, '使用的积分不能为负数']
  },
  total_credits_charged: {
    type: Number,
    default: 0,
    min: [0, '总积分消耗不能为负数']
  },
  processing_time: {
    type: Number,
    default: 0
  },
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  error_message: {
    type: String,
    default: null
  },
  metadata: {
    prompt: String,
    style: String,
    resolution: String,
    model: String,
    seed: Number,
    additional_params: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 创建索引
aiGenerationSchema.index({ user_id: 1, created_at: -1 });
aiGenerationSchema.index({ tool_id: 1 });
aiGenerationSchema.index({ tool_key: 1 });
aiGenerationSchema.index({ status: 1 });
aiGenerationSchema.index({ created_at: -1 });
aiGenerationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// 静态方法：获取用户生成统计
aiGenerationSchema.statics.getUserGenerationStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_credits: { $sum: '$credits_used' },
        avg_processing_time: { $avg: '$processing_time' }
      }
    }
  ]);
  
  return stats;
};

// 静态方法：获取工具使用统计
aiGenerationSchema.statics.getToolUsageStats = async function(toolId) {
  const stats = await this.aggregate([
    { $match: { tool_id: mongoose.Types.ObjectId(toolId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_credits: { $sum: '$credits_used' },
        avg_processing_time: { $avg: '$processing_time' }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('AIGeneration', aiGenerationSchema);