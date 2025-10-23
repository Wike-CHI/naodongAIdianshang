const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser, authenticateAdmin } = require('../middlewares/auth');

// 用户认证路由
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// 管理员认证路由
router.post('/admin/login', authController.adminLogin);

// 需要认证的路由
router.get('/user/profile', authenticateUser, authController.getCurrentUser);
router.put('/user/password', authenticateUser, authController.changePassword);

// 管理员需要认证的路由
router.get('/admin/profile', authenticateAdmin, authController.getCurrentAdmin);

module.exports = router;