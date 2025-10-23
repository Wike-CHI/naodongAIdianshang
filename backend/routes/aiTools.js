const express = require('express');
const router = express.Router();
const aiToolsController = require('../controllers/aiToolsController');
const { authenticateUser, authenticateAdmin, requirePermission } = require('../middlewares/auth');

// 公开路由
router.get('/tools', aiToolsController.getTools);
router.get('/tools/active', aiToolsController.getActiveTools);
router.get('/tools/categories', aiToolsController.getCategories);
router.get('/tools/:id', aiToolsController.getToolById);
router.get('/tools/:id/config', aiToolsController.getToolConfig);

// 用户认证路由
router.get('/generations', authenticateUser, aiToolsController.getUserGenerations);
router.get('/generations/:id', authenticateUser, aiToolsController.getGenerationById);

// 管理员路由
router.post('/tools', authenticateAdmin, requirePermission('ai_tools_manage'), aiToolsController.createTool);
router.put('/tools/:id', authenticateAdmin, requirePermission('ai_tools_manage'), aiToolsController.updateTool);
router.delete('/tools/:id', authenticateAdmin, requirePermission('ai_tools_manage'), aiToolsController.deleteTool);
router.put('/tools/:id/config', authenticateAdmin, requirePermission('ai_tools_manage'), aiToolsController.updateToolConfig);

module.exports = router;