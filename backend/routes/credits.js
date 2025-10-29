const express = require('express');
const router = express.Router();
const creditController = require('../controllers/creditController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 获取积分记录列表
router.get('/', authenticateToken, validate(schemas.pagination), creditController.getCreditRecords);

// 管理员调整用户积分
router.post('/adjust', authenticateToken, requireAdmin, validate(schemas.adjustCredits), creditController.adjustUserCredits);

// 批量调整用户积分（管理员）
router.post('/batch-adjust', authenticateToken, requireAdmin, validate(schemas.batchAdjustCredits), creditController.batchAdjustCredits);

// 获取积分统计
router.get('/stats', authenticateToken, creditController.getCreditStats);

// 获取积分类型统计
router.get('/type-stats', authenticateToken, creditController.getCreditTypeStats);

// 获取积分排行榜
router.get('/leaderboard', authenticateToken, creditController.getCreditLeaderboard);

// 导出积分记录
router.get('/export', authenticateToken, creditController.exportCreditRecords);

// 管理员获取积分规则
router.get('/rules', authenticateToken, requireAdmin, creditController.getCreditRules);

// 管理员创建积分规则
router.post('/rules', authenticateToken, requireAdmin, creditController.createCreditRule);

// 管理员更新积分规则
router.put('/rules/:id', authenticateToken, requireAdmin, creditController.updateCreditRule);

// 管理员删除积分规则
router.delete('/rules/:id', authenticateToken, requireAdmin, creditController.deleteCreditRule);

// 管理员获取积分交易记录
router.get('/transactions', authenticateToken, requireAdmin, creditController.getCreditTransactions);

// 管理员获取积分图表数据
router.get('/chart-data', authenticateToken, requireAdmin, creditController.getCreditChartData);

module.exports = router;