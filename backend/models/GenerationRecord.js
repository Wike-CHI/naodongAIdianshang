const mongoose = require('mongoose');

const generationRecordSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tool_id: { 
    type: String, 
    ref: 'AiTool', 
    required: true 
  },
  input_parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  result_urls: [{
    type: String
  }],
  credits_consumed: { 
    type: Number, 
    default: 0,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  error_message: {
    type: String,
    default: null
  },
  task_id: {
    type: String,
    unique: true,
    sparse: true
  },
  estimated_time: {
    type: Number, // 预估完成时间（秒）
    default: 30
  },
  started_at: {
    type: Date,
    default: null
  },
  completed_at: {
    type: Date,
    default: null
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { createdAt: 'created_at' }
});

// 创建索引
generationRecordSchema.index({ user_id: 1 });
generationRecordSchema.index({ tool_id: 1 });
generationRecordSchema.index({ status: 1 });
generationRecordSchema.index({ created_at: -1 });
generationRecordSchema.index({ task_id: 1 }, { unique: true, sparse: true });

// 实例方法：更新状态
generationRecordSchema.methods.updateStatus = function(status, errorMessage = null) {
  this.status = status;
  if (errorMessage) {
    this.error_message = errorMessage;
  }
  
  if (status === 'processing' && !this.started_at) {
    this.started_at = new Date();
  } else if (status === 'completed' || status === 'failed') {
    this.completed_at = new Date();
  }
  
  return this.save();
};

// 实例方法：添加结果URL
generationRecordSchema.methods.addResultUrl = function(url) {
  this.result_urls.push(url);
  return this.save();
};

// 静态方法：获取用户生成历史
generationRecordSchema.statics.getUserHistory = function(userId, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  return this.find({ user_id: userId })
    .populate('tool_id', 'name category icon_url')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(pageSize);
};

// 静态方法：获取统计数据
generationRecordSchema.statics.getStats = function(startDate, endDate) {
  const matchCondition = {};
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
        totalGenerations: { $sum: 1 },
        totalCreditsConsumed: { $sum: '$credits_consumed' },
        completedGenerations: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedGenerations: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('GenerationRecord', generationRecordSchema);