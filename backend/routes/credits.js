const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 获取积分记录列表
router.get('/', authenticateToken, requireAdmin, creditController.getCreditRecords);

// 根据ID获取积分记录
router.get('/:id', authenticateToken, requireAdmin, creditController.getCreditRecordById);

// 调整用户积分
router.post('/adjust', authenticateToken, requireAdmin, creditController.adjustUserCredits);

// 批量调整积分
router.post('/batch-adjust', authenticateToken, requireAdmin, creditController.batchAdjustCredits);

// 获取积分统计
router.get('/stats', authenticateToken, requireAdmin, creditController.getCreditStats);

// 获取积分类型列表
router.get('/types', authenticateToken, requireAdmin, creditController.getCreditTypes);

// 导出积分记录
router.get('/export', authenticateToken, requireAdmin, creditController.exportCreditRecords);

module.exports = router;