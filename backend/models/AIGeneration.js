const mongoose = require('mongoose');

const aiGenerationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tool_id: {
    type: String,
    required: true
  },
  tool_name: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  negative_prompt: {
    type: String,
    default: ''
  },
  input_images: [{
    type: String
  }],
  output_images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  credits_consumed: {
    type: Number,
    required: true
  },
  processing_time: {
    type: Number,
    default: 0
  },
  error_message: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  generation_params: {
    width: Number,
    height: Number,
    steps: Number,
    cfg_scale: Number,
    seed: Number,
    sampler: String
  }
}, {
  timestamps: true
});

// 索引
aiGenerationSchema.index({ user_id: 1, createdAt: -1 });
aiGenerationSchema.index({ tool_id: 1 });
aiGenerationSchema.index({ status: 1 });
aiGenerationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AIGeneration', aiGenerationSchema);