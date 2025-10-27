const mongoose = require('mongoose');

const aiToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '工具名称是必需的'],
    unique: true,
    trim: true,
    maxlength: [100, '工具名称不能超过100个字符']
  },
  description: {
    type: String,
    required: [true, '工具描述是必需的'],
    maxlength: [500, '工具描述不能超过500个字符']
  },
  type: {
    type: String,
    required: [true, '工具类型是必需的'],
    enum: ['image_generation', 'image_editing', 'style_transfer', 'text_to_image', 'image_to_image']
  },
  config: {
    // 图像生成配置
    max_resolution: {
      type: String,
      default: '1024x1024'
    },
    supported_styles: [{
      type: String
    }],
    max_prompt_length: {
      type: Number,
      default: 500
    },
    resolutions: [{
      label: String,
      value: String,
      credits: Number
    }],
    // 文件上传配置
    max_file_size: {
      type: String,
      default: '10MB'
    },
    supported_formats: [{
      type: String
    }],
    // 编辑类型
    edit_types: [{
      type: String
    }],
    // 风格选项
    styles: [{
      type: String
    }],
    // 其他配置
    quality_levels: [{
      label: String,
      value: String,
      credits_multiplier: Number
    }],
    batch_processing: {
      type: Boolean,
      default: false
    },
    max_batch_size: {
      type: Number,
      default: 1
    }
  },
  credit_cost: {
    type: Number,
    required: [true, '积分消耗是必需的'],
    min: [1, '积分消耗至少为1']
  },
  enabled: {
    type: Boolean,
    default: true
  },
  usage_count: {
    type: Number,
    default: 0
  },
  success_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  average_processing_time: {
    type: Number,
    default: 0 // 秒
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['创意生成', '图像处理', '风格转换', '内容编辑', '批量处理'],
    default: '创意生成'
  },
  api_endpoint: {
    type: String,
    default: null
  },
  model_version: {
    type: String,
    default: 'v1.0'
  },
  maintenance_mode: {
    type: Boolean,
    default: false
  },
  maintenance_message: {
    type: String,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 增加使用次数
aiToolSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  return this.save();
};

// 更新成功率
aiToolSchema.methods.updateSuccessRate = function(isSuccess) {
  const totalAttempts = this.usage_count;
  if (totalAttempts === 0) {
    this.success_rate = isSuccess ? 100 : 0;
  } else {
    const currentSuccesses = Math.round((this.success_rate / 100) * totalAttempts);
    const newSuccesses = isSuccess ? currentSuccesses + 1 : currentSuccesses;
    this.success_rate = Math.round((newSuccesses / (totalAttempts + 1)) * 100);
  }
  return this.save();
};

// 更新平均处理时间
aiToolSchema.methods.updateProcessingTime = function(processingTime) {
  if (this.usage_count === 0) {
    this.average_processing_time = processingTime;
  } else {
    this.average_processing_time = Math.round(
      (this.average_processing_time * this.usage_count + processingTime) / (this.usage_count + 1)
    );
  }
  return this.save();
};

// 检查工具是否可用
aiToolSchema.methods.isAvailable = function() {
  return this.enabled && !this.maintenance_mode;
};

// 获取工具状态
aiToolSchema.methods.getStatus = function() {
  if (this.maintenance_mode) return 'maintenance';
  if (!this.enabled) return 'disabled';
  return 'active';
};

// 创建索引
aiToolSchema.index({ name: 1 });
aiToolSchema.index({ type: 1 });
aiToolSchema.index({ enabled: 1 });
aiToolSchema.index({ category: 1 });
aiToolSchema.index({ created_at: -1 });
aiToolSchema.index({ usage_count: -1 });

module.exports = mongoose.model('AITool', aiToolSchema);