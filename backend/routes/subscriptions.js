const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// 获取订阅套餐列表（公开接口）
router.get('/plans', optionalAuth, subscriptionController.getSubscriptionPlans);

// 创建订阅套餐（管理员）
router.post('/plans', authenticateToken, requireAdmin, validate(schemas.subscriptionPlan), subscriptionController.createSubscriptionPlan);

// 更新订阅套餐（管理员）
router.put('/plans/:id', authenticateToken, requireAdmin, validate(schemas.idParam), validate(schemas.subscriptionPlan), subscriptionController.updateSubscriptionPlan);

// 删除订阅套餐（管理员）
router.delete('/plans/:id', authenticateToken, requireAdmin, validate(schemas.idParam), subscriptionController.deleteSubscriptionPlan);

// 获取用户订阅列表
router.get('/', authenticateToken, validate(schemas.pagination), subscriptionController.getUserSubscriptions);

// 获取当前用户订阅信息
router.get('/current', authenticateToken, subscriptionController.getCurrentUserSubscription);

// 创建订阅
router.post('/', authenticateToken, validate(schemas.createSubscription), subscriptionController.createSubscription);

// 取消订阅
router.post('/:id/cancel', authenticateToken, validate(schemas.idParam), subscriptionController.cancelSubscription);

// 续费订阅
router.post('/:id/renew', authenticateToken, validate(schemas.idParam), validate(schemas.renewSubscription), subscriptionController.renewSubscription);

// 获取订阅统计（管理员）
router.get('/meta/stats', authenticateToken, requireAdmin, subscriptionController.getSubscriptionStats);

// 获取即将到期的订阅（管理员）
router.get('/meta/expiring', authenticateToken, requireAdmin, subscriptionController.getExpiringSubscriptions);

// 批量操作订阅（管理员）
router.post('/batch', authenticateToken, requireAdmin, validate(schemas.batchSubscriptionUpdate), subscriptionController.batchUpdateSubscriptions);

module.exports = router;