const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateUser, authenticateAdmin, requirePermission } = require('../middlewares/auth');

// 公开路由
router.get('/plans', subscriptionController.getPlans);

// 用户路由
router.get('/current', authenticateUser, subscriptionController.getUserSubscription);
router.post('/subscribe', authenticateUser, subscriptionController.createSubscription);
router.post('/payment/callback', authenticateUser, subscriptionController.simulateSubscriptionPayment);
router.post('/cancel', authenticateUser, subscriptionController.cancelSubscription);
router.post('/renew', authenticateUser, subscriptionController.renewSubscription);
router.get('/history', authenticateUser, subscriptionController.getUserSubscriptionHistory);

// 管理员路由
router.get('/admin/plans', authenticateAdmin, requirePermission('subscriptions_manage'), subscriptionController.getAllPlans);
router.post('/admin/plans', authenticateAdmin, requirePermission('subscriptions_manage'), subscriptionController.createPlan);
router.put('/admin/plans/:id', authenticateAdmin, requirePermission('subscriptions_manage'), subscriptionController.updatePlan);
router.delete('/admin/plans/:id', authenticateAdmin, requirePermission('subscriptions_manage'), subscriptionController.deletePlan);
router.get('/admin/stats', authenticateAdmin, requirePermission('subscriptions_view'), subscriptionController.getSubscriptionStats);
router.get('/admin/all', authenticateAdmin, requirePermission('subscriptions_view'), subscriptionController.getAllSubscriptions);

module.exports = router;