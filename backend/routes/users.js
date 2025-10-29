const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireUserOrAdmin } = require('../middleware/auth');

// 获取用户列表（管理员）
router.get('/', authenticateToken, requireAdmin, validate(schemas.pagination), userController.getUsers);

// 获取用户详情
router.get('/:id', authenticateToken, requireUserOrAdmin, validate(schemas.idParam), userController.getUserById);

// 更新用户信息
router.put('/:id', authenticateToken, requireUserOrAdmin, validate(schemas.idParam), validate(schemas.userUpdate), userController.updateUser);

// 软删除用户（管理员）
router.delete('/:id', authenticateToken, requireAdmin, validate(schemas.idParam), userController.deleteUser);

// 获取用户积分记录
router.get('/:id/credits', authenticateToken, requireUserOrAdmin, validate(schemas.idParam), validate(schemas.pagination), userController.getUserCreditRecords);

// 获取用户AI生成历史
router.get('/:id/generations', authenticateToken, requireUserOrAdmin, validate(schemas.idParam), validate(schemas.pagination), userController.getUserGenerations);

// 管理员调整用户积分
router.post('/:id/adjust-credits', authenticateToken, requireAdmin, validate(schemas.idParam), validate(schemas.adjustCredits), userController.adjustUserCredits);

// 获取用户订阅信息
router.get('/:id/subscription', authenticateToken, requireUserOrAdmin, validate(schemas.idParam), userController.getUserSubscription);

// 获取用户统计（管理员）
router.get('/stats', authenticateToken, requireAdmin, userController.getUserStats);

// 批量操作用户（管理员）
router.post('/batch', authenticateToken, requireAdmin, validate(schemas.batchUserUpdate), userController.batchUpdateUsers);

module.exports = router;