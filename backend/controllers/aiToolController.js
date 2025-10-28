const AITool = require('../models/AITool');

// 获取AI工具列表
const getAITools = async (req, res) => {
  try {
    const { page = 1, limit = 20, category = '', status = '', search = '' } = req.query;
    
    const query = {};
    
    // 分类筛选
    if (category) {
      query.category = category;
    }
    
    // 状态筛选
    if (status) {
      query.is_active = status === 'active';
    }
    
    // 搜索条件
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
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
      message: '获取AI工具列表失败',
      error: error.message
    });
  }
};

// 根据ID获取AI工具
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
      message: '获取AI工具详情失败',
      error: error.message
    });
  }
};

// 创建AI工具
const createAITool = async (req, res) => {
  try {
    const toolData = req.body;
    
    const tool = new AITool(toolData);
    await tool.save();

    res.status(201).json({
      success: true,
      message: 'AI工具创建成功',
      data: tool
    });
  } catch (error) {
    console.error('Create AI tool error:', error);
    res.status(500).json({
      success: false,
      message: '创建AI工具失败',
      error: error.message
    });
  }
};

// 更新AI工具
const updateAITool = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const tool = await AITool.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
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
    res.status(500).json({
      success: false,
      message: '更新AI工具失败',
      error: error.message
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
      message: '删除AI工具失败',
      error: error.message
    });
  }
};

// 切换AI工具状态
const toggleAIToolStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tool = await AITool.findById(id);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        message: 'AI工具不存在'
      });
    }

    tool.is_active = !tool.is_active;
    tool.updated_at = new Date();
    await tool.save();

    res.json({
      success: true,
      message: `AI工具已${tool.is_active ? '启用' : '禁用'}`,
      data: tool
    });
  } catch (error) {
    console.error('Toggle AI tool status error:', error);
    res.status(500).json({
      success: false,
      message: '切换AI工具状态失败',
      error: error.message
    });
  }
};

// 获取工具类型
const getToolTypes = async (req, res) => {
  try {
    const types = await AITool.distinct('type');
    
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get tool types error:', error);
    res.status(500).json({
      success: false,
      message: '获取工具类型失败',
      error: error.message
    });
  }
};

// 获取工具分类
const getToolCategories = async (req, res) => {
  try {
    const categories = await AITool.distinct('category');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get tool categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取工具分类失败',
      error: error.message
    });
  }
};

// 获取工具统计
const getToolStats = async (req, res) => {
  try {
    const [totalTools, activeTools, inactiveTools] = await Promise.all([
      AITool.countDocuments(),
      AITool.countDocuments({ is_active: true }),
      AITool.countDocuments({ is_active: false })
    ]);

    const categoryStats = await AITool.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total_tools: totalTools,
        active_tools: activeTools,
        inactive_tools: inactiveTools,
        category_stats: categoryStats
      }
    });
  } catch (error) {
    console.error('Get tool stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取工具统计失败',
      error: error.message
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

    // 这里可以添加实际的工具测试逻辑
    const isAvailable = tool.is_active;

    res.json({
      success: true,
      data: {
        tool_id: id,
        is_available: isAvailable,
        test_time: new Date()
      }
    });
  } catch (error) {
    console.error('Test tool availability error:', error);
    res.status(500).json({
      success: false,
      message: '测试工具可用性失败',
      error: error.message
    });
  }
};

// 批量更新工具
const batchUpdateTools = async (req, res) => {
  try {
    const { tool_ids, update_data } = req.body;
    
    if (!tool_ids || !Array.isArray(tool_ids) || tool_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的工具ID列表'
      });
    }

    const result = await AITool.updateMany(
      { _id: { $in: tool_ids } },
      { ...update_data, updated_at: new Date() }
    );

    res.json({
      success: true,
      message: `成功更新 ${result.modifiedCount} 个工具`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Batch update tools error:', error);
    res.status(500).json({
      success: false,
      message: '批量更新工具失败',
      error: error.message
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