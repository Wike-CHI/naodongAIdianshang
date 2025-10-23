const mongoose = require('mongoose');

const aiToolSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    maxlength: 100,
    trim: true
  },
  category: { 
    type: String, 
    required: true, 
    maxlength: 50,
    trim: true
  },
  icon_url: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: 500
  },
  cost_credits: { 
    type: Number, 
    default: 1,
    min: 0
  },
  api_endpoint: {
    type: String,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'maintenance'], 
    default: 'active' 
  },
  sort_order: { 
    type: Number, 
    default: 0 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  _id: false, // 禁用自动生成的 _id，使用自定义的字符串 _id
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 创建索引
aiToolSchema.index({ category: 1 });
aiToolSchema.index({ status: 1 });
aiToolSchema.index({ sort_order: 1 });
aiToolSchema.index({ name: 'text' }); // 文本搜索索引

// 虚拟字段：获取工具配置
aiToolSchema.virtual('config', {
  ref: 'ToolConfig',
  localField: '_id',
  foreignField: 'tool_id',
  justOne: true
});

// 实例方法：检查工具是否可用
aiToolSchema.methods.isAvailable = function() {
  return this.status === 'active';
};

// 静态方法：获取活跃的工具列表
aiToolSchema.statics.getActiveTools = function(category = null) {
  const query = { status: 'active' };
  if (category) {
    query.category = category;
  }
  return this.find(query).sort({ sort_order: 1, created_at: -1 });
};

// 静态方法：按分类获取工具
aiToolSchema.statics.getToolsByCategory = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    { 
      $group: {
        _id: '$category',
        tools: { 
          $push: {
            id: '$_id',
            name: '$name',
            icon_url: '$icon_url',
            description: '$description',
            cost_credits: '$cost_credits',
            sort_order: '$sort_order'
          }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

module.exports = mongoose.model('AiTool', aiToolSchema);