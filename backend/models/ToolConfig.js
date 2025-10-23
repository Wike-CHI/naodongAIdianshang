const mongoose = require('mongoose');

const toolConfigSchema = new mongoose.Schema({
  tool_id: { 
    type: String, 
    ref: 'AiTool', 
    required: true, 
    unique: true 
  },
  prompt_template: {
    type: String,
    default: ''
  },
  parameters_schema: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  api_mapping: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { updatedAt: 'updated_at' }
});

// 创建索引
toolConfigSchema.index({ tool_id: 1 }, { unique: true });

// 实例方法：验证参数
toolConfigSchema.methods.validateParameters = function(inputParams) {
  const schema = this.parameters_schema;
  const errors = [];

  if (schema && schema.parameters) {
    for (const param of schema.parameters) {
      const value = inputParams[param.name];
      
      // 检查必需参数
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`参数 ${param.name} 是必需的`);
        continue;
      }

      // 检查参数类型
      if (value !== undefined && value !== null) {
        switch (param.type) {
          case 'select':
            if (param.options && !param.options.includes(value)) {
              errors.push(`参数 ${param.name} 的值必须是: ${param.options.join(', ')}`);
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`参数 ${param.name} 必须是数字`);
            }
            break;
          case 'upload':
            // 文件上传验证在其他地方处理
            break;
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 静态方法：获取工具配置
toolConfigSchema.statics.getToolConfig = async function(toolId) {
  let config = await this.findOne({ tool_id: toolId });
  if (!config) {
    // 如果没有配置，创建默认配置
    config = new this({
      tool_id: toolId,
      prompt_template: '',
      parameters_schema: { parameters: [] },
      api_mapping: {}
    });
    await config.save();
  }
  return config;
};

module.exports = mongoose.model('ToolConfig', toolConfigSchema);