const AITool = require('../models/AiTool');

// 获取AI工具列表
const getAITools = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '', type = '', status = '' } = req.query;
    
    const query = {};
    
    // 搜索条件
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 分类筛选
    if (category) {
      query.category = category;
    }
    
    // 类型筛选
    if (type) {
      query.type = type;
    }
    
    // 状态筛选
    if (status === 'active') {
      query.enabled = true;
    } else if (status === 'inactive') {
      query.enabled = false;
    } else if (status === 'maintenance') {
      query.maintenance_mode = true;
    }

    const skip = (page - 1) * limit;
    
    const [tools, total] = await Promise.all([
      AITool.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AITool.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        tools,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get AI tools error:', error);
    res.status(500).json({
      success: false,
      message: '获取AI工具列表失败'
    });
  }
};

// 获取单个AI工具详情
const getAIToolById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tool = await AITool.findById(id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'AI工具不存在'
      });
    }

    res.json({
      success: true,
      data: tool
    });
  } catch (error) {
    console.error('Get AI tool by ID error:', error);
    res.status(500).json({
      success: false,
      message: '获取AI工具详情失败'
    });
  }
};

// 创建AI工具
const createAITool = async (req, res) => {
  try {
    const toolData = req.body;
    
    // 检查工具名称是否已存在
    const existingTool = await AITool.findOne({ name: toolData.name });
    if (existingTool) {
      return res.status(400).json({
        success: false,
        message: '工具名称已存在'
      });
    }

    const tool = new AITool(toolData);
    await tool.save();

    res.status(201).json({
      success: true,
      message: 'AI工具创建成功',
      data: tool
    });
  } catch (error) {
    console.error('Create AI tool error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: '创建AI工具失败'
    });
  }
};

// 更新AI工具
const updateAITool = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 移除不可更新的字段
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const tool = await AITool.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'AI工具不存在'
      });
    }

    res.json({
      success: true,
      message: 'AI工具更新成功',
      data: tool
    });
  } catch (error) {
    console.error('Update AI tool error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: '更新AI工具失败'
    });
  }
};

// 删除AI工具
const deleteAITool = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tool = await AITool.findByIdAndDelete(id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'AI工具不存在'
      });
    }

    res.json({
      success: true,
      message: 'AI工具删除成功'
    });
  } catch (error) {
    console.error('Delete AI tool error:', error);
    res.status(500).json({
      success: false,
      message: '删除AI工具失败'
    });
  }
};

// 切换AI工具启用状态
const toggleAIToolStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    const tool = await AITool.findByIdAndUpdate(
      id,
      { $set: { enabled: enabled } },
      { new: true }
    );
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'AI工具不存在'
      });
    }

    res.json({
      success: true,
      message: `AI工具已${enabled ? '启用' : '禁用'}`,
      data: { enabled: tool.enabled }
    });
  } catch (error) {
    console.error('Toggle AI tool status error:', error);
    res.status(500).json({
      success: false,
      message: '切换AI工具状态失败'
    });
  }
};

// 获取工具类型列表
const getToolTypes = async (req, res) => {
  try {
    const types = [
      { value: 'image_generation', label: '图像生成' },
      { value: 'image_editing', label: '图像编辑' },
      { value: 'style_transfer', label: '风格转换' },
      { value: 'text_to_image', label: '文本转图像' },
      { value: 'image_to_image', label: '图像转图像' }
    ];
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get tool types error:', error);
    res.status(500).json({
      success: false,
      message: '获取工具类型失败'
    });
  }
};

// 获取工具分类列表
const getToolCategories = async (req, res) => {
  try {
    const categories = [
      { value: '创意生成', label: '创意生成' },
      { value: '图像处理', label: '图像处理' },
      { value: '风格转换', label: '风格转换' },
      { value: '内容编辑', label: '内容编辑' },
      { value: '批量处理', label: '批量处理' }
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get tool categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取工具分类失败'
    });
  }
};

// 获取工具统计
const getToolStats = async (req, res) => {
  try {
    const stats = await AITool.aggregate([
      {
        $group: {
          _id: null,
          total_tools: { $sum: 1 },
          active_tools: {
            $sum: {
              $cond: [{ $eq: ['$enabled', true] }, 1, 0]
            }
          },
          total_usage: { $sum: '$usage_count' },
          avg_success_rate: { $avg: '$success_rate' },
          categories: {
            $push: '$category'
          }
        }
      }
    ]);

    const categoryStats = {};
    if (stats.length > 0 && stats[0].categories) {
      stats[0].categories.forEach(category => {
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        total_tools: stats[0]?.total_tools || 0,
        active_tools: stats[0]?.active_tools || 0,
        total_usage: stats[0]?.total_usage || 0,
        avg_success_rate: stats[0]?.avg_success_rate || 0,
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Get tool stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取工具统计失败'
    });
  }
};

// 测试工具可用性
const testToolAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tool = await AITool.findById(id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'AI工具不存在'
      });
    }

    // 模拟测试结果
    const isAvailable = tool.isAvailable();
    const status = tool.getStatus();
    
    res.json({
      success: true,
      data: {
        tool_id: tool._id,
        name: tool.name,
        is_available: isAvailable,
        status: status,
        message: isAvailable ? '工具可用' : status === 'maintenance' ? '工具维护中' : '工具已禁用'
      }
    });
  } catch (error) {
    console.error('Test tool availability error:', error);
    res.status(500).json({
      success: false,
      message: '测试工具可用性失败'
    });
  }
};

// 批量操作工具
const batchUpdateTools = async (req, res) => {
  try {
    const { tool_ids, action, data } = req.body;
    
    if (!tool_ids || !Array.isArray(tool_ids) || tool_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '工具ID列表不能为空'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'enable':
        updateData = { enabled: true };
        message = '工具已批量启用';
        break;
      case 'disable':
        updateData = { enabled: false };
        message = '工具已批量禁用';
        break;
      case 'delete':
        await AITool.deleteMany({ _id: { $in: tool_ids } });
        return res.json({
          success: true,
          message: `成功删除 ${tool_ids.length} 个工具`
        });
      case 'update_category':
        if (!data.category) {
          return res.status(400).json({
            success: false,
            message: '分类参数缺失'
          });
        }
        updateData = { category: data.category };
        message = '工具分类已批量更新';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '无效的操作类型'
        });
    }

    const result = await AITool.updateMany(
      { _id: { $in: tool_ids } },
      { $set: updateData }
    );

    res.json({
      success: true,
      message,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Batch update tools error:', error);
    res.status(500).json({
      success: false,
      message: '批量操作工具失败'
    });
  }
};

module.exports = {
  getAITools,
  getAIToolById,
  createAITool,
  updateAITool,
  deleteAITool,
  toggleAIToolStatus,
  getToolTypes,
  getToolCategories,
  getToolStats,
  testToolAvailability,
  batchUpdateTools
};