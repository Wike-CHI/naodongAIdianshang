const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// 获取订阅套餐列表（公开接口）
router.get('/plans', optionalAuth, subscriptionController.getSubscriptionPlans);

// 创建订阅套餐（管理员）
router.post('/plans', authenticateToken, requireAdmin, subscriptionController.createSubscriptionPlan);

// 更新订阅套餐（管理员）
router.put('/plans/:id', authenticateToken, requireAdmin, subscriptionController.updateSubscriptionPlan);

// 删除订阅套餐（管理员）
router.delete('/plans/:id', authenticateToken, requireAdmin, subscriptionController.deleteSubscriptionPlan);

// 获取用户订阅列表
router.get('/', authenticateToken, subscriptionController.getUserSubscriptions);

// 创建订阅
router.post('/', authenticateToken, subscriptionController.createSubscription);

// 取消订阅
router.post('/:id/cancel', authenticateToken, subscriptionController.cancelSubscription);

// 续费订阅
router.post('/:id/renew', authenticateToken, subscriptionController.renewSubscription);

// 获取订阅统计信息（管理员）
router.get('/meta/stats', authenticateToken, requireAdmin, subscriptionController.getSubscriptionStats);

// 获取即将过期的订阅（管理员）
router.get('/meta/expiring', authenticateToken, requireAdmin, subscriptionController.getExpiringSubscriptions);

// 批量更新订阅（管理员）
router.post('/batch', authenticateToken, requireAdmin, subscriptionController.batchUpdateSubscriptions);

module.exports = router;