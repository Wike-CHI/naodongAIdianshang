const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser, authenticateAdmin, requirePermission } = require('../middlewares/auth');

// 用户自己的路由
router.get('/profile', authenticateUser, userController.updateProfile);
router.put('/profile', authenticateUser, userController.updateProfile);

// 管理员路由
router.get('/', authenticateAdmin, requirePermission('users_manage'), userController.getUsers);
router.get('/stats', authenticateAdmin, requirePermission('users_view'), userController.getUserStats);
router.get('/:id', authenticateAdmin, requirePermission('users_view'), userController.getUserById);
router.put('/:id', authenticateAdmin, requirePermission('users_manage'), userController.updateUser);
router.delete('/:id', authenticateAdmin, requirePermission('users_manage'), userController.deleteUser);
router.post('/:id/reset-password', authenticateAdmin, requirePermission('users_manage'), userController.resetUserPassword);

module.exports = router;