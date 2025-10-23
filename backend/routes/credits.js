const express = require('express');
const router = express.Router();
const creditsController = require('../controllers/creditsController');
const { authenticateUser, authenticateAdmin, requirePermission } = require('../middlewares/auth');

// 用户路由
router.get('/balance', authenticateUser, creditsController.getUserCredits);
router.get('/packages', creditsController.getCreditPackages);
router.post('/orders', authenticateUser, creditsController.createCreditOrder);
router.get('/orders', authenticateUser, creditsController.getUserOrders);
router.post('/consume', authenticateUser, creditsController.consumeCredits);

// 支付回调（模拟）
router.post('/payment/callback', creditsController.simulatePaymentSuccess);

// 管理员路由
router.get('/admin/packages', authenticateAdmin, requirePermission('credits_manage'), creditsController.getAllPackages);
router.post('/admin/packages', authenticateAdmin, requirePermission('credits_manage'), creditsController.createPackage);
router.put('/admin/packages/:id', authenticateAdmin, requirePermission('credits_manage'), creditsController.updatePackage);
router.delete('/admin/packages/:id', authenticateAdmin, requirePermission('credits_manage'), creditsController.deletePackage);
router.get('/admin/stats', authenticateAdmin, requirePermission('credits_view'), creditsController.getCreditsStats);

module.exports = router;