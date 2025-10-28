const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 获取用户列表（管理员）
router.get('/', authenticateToken, requireAdmin, validate(schemas.pagination), userController.getUsers);

// 获取用户详情
router.get('/:id', authenticateToken, requireAdmin, userController.getUserById);

// 更新用户信息
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);

// 软删除用户（管理员）
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);

// 获取用户积分记录
router.get('/:id/credits', authenticateToken, requireAdmin, userController.getUserCreditRecords);

// 获取用户生成记录
router.get('/:id/generations', authenticateToken, requireAdmin, userController.getUserGenerations);

// 调整用户积分（管理员）
router.post('/:id/adjust-credits', authenticateToken, requireAdmin, userController.adjustUserCredits);

// 获取用户统计（管理员）
router.get('/stats', authenticateToken, requireAdmin, userController.getUserStats);

// 批量更新用户（管理员）
router.post('/batch', authenticateToken, requireAdmin, userController.batchUpdateUsers);

module.exports = router;