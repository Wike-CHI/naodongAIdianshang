const express = require('express');
const router = express.Router();
const aiToolController = require('../controllers/aiToolController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// 获取AI工具列表（公开接口，支持可选认证）
router.get('/', optionalAuth, aiToolController.getAITools);

// 获取AI工具详情（公开接口，支持可选认证）
router.get('/:id', optionalAuth, aiToolController.getAIToolById);

// 创建AI工具（管理员）
router.post('/', authenticateToken, requireAdmin, aiToolController.createAITool);

// 更新AI工具（管理员）
router.put('/:id', authenticateToken, requireAdmin, aiToolController.updateAITool);

// 删除AI工具（管理员）
router.delete('/:id', authenticateToken, requireAdmin, aiToolController.deleteAITool);

// 切换工具启用状态（管理员）
router.post('/:id/toggle', authenticateToken, requireAdmin, aiToolController.toggleAIToolStatus);

// 获取工具类型列表
router.get('/meta/types', aiToolController.getToolTypes);

// 获取工具分类列表
router.get('/meta/categories', aiToolController.getToolCategories);

// 获取工具统计信息（管理员）
router.get('/meta/stats', authenticateToken, requireAdmin, aiToolController.getToolStats);

// 测试工具可用性（管理员）
router.post('/:id/test', authenticateToken, requireAdmin, aiToolController.testToolAvailability);

// 批量更新工具（管理员）
router.post('/batch', authenticateToken, requireAdmin, aiToolController.batchUpdateTools);

module.exports = router;