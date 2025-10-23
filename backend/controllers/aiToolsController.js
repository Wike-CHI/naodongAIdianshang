const { AiTool, ToolConfig, GenerationRecord } = require('../models');

class AiToolsController {
  // 获取所有AI工具列表
  async getTools(req, res) {
    try {
      const { category, status, page = 1, limit = 20 } = req.query;
      
      const filter = {};
      if (category) filter.category = category;
      if (status) filter.status = status;

      const skip = (page - 1) * limit;
      
      const tools = await AiTool.find(filter)
        .sort({ sort_order: 1, created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await AiTool.countDocuments(filter);

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
      console.error('获取AI工具列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取AI工具列表失败'
      });
    }
  }

  // 获取活跃的AI工具
  async getActiveTools(req, res) {
    try {
      const { category } = req.query;
      
      const tools = await AiTool.getActiveTools(category);

      res.json({
        success: true,
        data: { tools }
      });
    } catch (error) {
      console.error('获取活跃AI工具错误:', error);
      res.status(500).json({
        success: false,
        message: '获取活跃AI工具失败'
      });
    }
  }

  // 获取工具分类
  async getCategories(req, res) {
    try {
      const categories = await AiTool.distinct('category', { status: 'active' });
      
      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      console.error('获取工具分类错误:', error);
      res.status(500).json({
        success: false,
        message: '获取工具分类失败'
      });
    }
  }

  // 获取单个AI工具详情
  async getToolById(req, res) {
    try {
      const { id } = req.params;
      
      const tool = await AiTool.findById(id);
      if (!tool) {
        return res.status(404).json({
          success: false,
          message: 'AI工具不存在'
        });
      }

      // 获取工具配置
      const config = await ToolConfig.findOne({ tool_id: id });

      res.json({
        success: true,
        data: {
          tool,
          config
        }
      });
    } catch (error) {
      console.error('获取AI工具详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取AI工具详情失败'
      });
    }
  }

  // 创建AI工具（管理员）
  async createTool(req, res) {
    try {
      const {
        name,
        description,
        category,
        cost_credits,
        api_endpoint,
        icon_url,
        sort_order,
        status = 'active'
      } = req.body;

      if (!name || !description || !category || !cost_credits || !api_endpoint) {
        return res.status(400).json({
          success: false,
          message: '请填写所有必填字段'
        });
      }

      const tool = new AiTool({
        name,
        description,
        category,
        cost_credits,
        api_endpoint,
        icon_url,
        sort_order,
        status
      });

      await tool.save();

      res.status(201).json({
        success: true,
        message: 'AI工具创建成功',
        data: { tool }
      });
    } catch (error) {
      console.error('创建AI工具错误:', error);
      res.status(500).json({
        success: false,
        message: '创建AI工具失败'
      });
    }
  }

  // 更新AI工具（管理员）
  async updateTool(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const tool = await AiTool.findByIdAndUpdate(
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
        data: { tool }
      });
    } catch (error) {
      console.error('更新AI工具错误:', error);
      res.status(500).json({
        success: false,
        message: '更新AI工具失败'
      });
    }
  }

  // 删除AI工具（管理员）
  async deleteTool(req, res) {
    try {
      const { id } = req.params;

      const tool = await AiTool.findByIdAndDelete(id);
      if (!tool) {
        return res.status(404).json({
          success: false,
          message: 'AI工具不存在'
        });
      }

      // 删除相关配置
      await ToolConfig.deleteMany({ tool_id: id });

      res.json({
        success: true,
        message: 'AI工具删除成功'
      });
    } catch (error) {
      console.error('删除AI工具错误:', error);
      res.status(500).json({
        success: false,
        message: '删除AI工具失败'
      });
    }
  }

  // 获取工具配置
  async getToolConfig(req, res) {
    try {
      const { id } = req.params;

      const config = await ToolConfig.findOne({ tool_id: id });
      if (!config) {
        return res.status(404).json({
          success: false,
          message: '工具配置不存在'
        });
      }

      res.json({
        success: true,
        data: { config }
      });
    } catch (error) {
      console.error('获取工具配置错误:', error);
      res.status(500).json({
        success: false,
        message: '获取工具配置失败'
      });
    }
  }

  // 更新工具配置（管理员）
  async updateToolConfig(req, res) {
    try {
      const { id } = req.params;
      const { prompt_template, parameters_schema, api_mapping } = req.body;

      let config = await ToolConfig.findOne({ tool_id: id });
      
      if (!config) {
        config = new ToolConfig({
          tool_id: id,
          prompt_template,
          parameters_schema,
          api_mapping
        });
      } else {
        config.prompt_template = prompt_template;
        config.parameters_schema = parameters_schema;
        config.api_mapping = api_mapping;
        config.updated_at = new Date();
      }

      await config.save();

      res.json({
        success: true,
        message: '工具配置更新成功',
        data: { config }
      });
    } catch (error) {
      console.error('更新工具配置错误:', error);
      res.status(500).json({
        success: false,
        message: '更新工具配置失败'
      });
    }
  }

  // 获取用户生成记录
  async getUserGenerations(req, res) {
    try {
      const { page = 1, limit = 20, tool_id, status } = req.query;
      const user_id = req.user._id;

      const filter = { user_id };
      if (tool_id) filter.tool_id = tool_id;
      if (status) filter.status = status;

      const skip = (page - 1) * limit;

      const records = await GenerationRecord.find(filter)
        .populate('tool_id', 'name category icon_url')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await GenerationRecord.countDocuments(filter);

      res.json({
        success: true,
        data: {
          records,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('获取用户生成记录错误:', error);
      res.status(500).json({
        success: false,
        message: '获取生成记录失败'
      });
    }
  }

  // 获取生成记录详情
  async getGenerationById(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user._id;

      const record = await GenerationRecord.findOne({ _id: id, user_id })
        .populate('tool_id', 'name category icon_url');

      if (!record) {
        return res.status(404).json({
          success: false,
          message: '生成记录不存在'
        });
      }

      res.json({
        success: true,
        data: { record }
      });
    } catch (error) {
      console.error('获取生成记录详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取生成记录详情失败'
      });
    }
  }
}

module.exports = new AiToolsController();