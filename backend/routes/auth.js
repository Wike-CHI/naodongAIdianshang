const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// 用户注册
router.post('/register', validate(schemas.userRegister), authController.register);

// 用户登录
router.post('/login', validate(schemas.userLogin), authController.login);

// 管理员登录
router.post('/admin-login', validate(schemas.adminLogin), authController.adminLogin);

// 获取当前用户信息
router.get('/me', authenticateToken, authController.getCurrentUser);

// 刷新令牌
router.post('/refresh', authController.refreshToken);

// 修改密码
router.post('/change-password', authenticateToken, validate(schemas.changePassword), authController.changePassword);

// 请求密码重置
router.post('/forgot-password', validate(schemas.forgotPassword), authController.requestPasswordReset);

// 确认密码重置
router.post('/reset-password', validate(schemas.resetPassword), authController.confirmPasswordReset);

// 邮箱验证
router.post('/verify-email', validate(schemas.verifyEmail), authController.verifyEmail);

// 重新发送验证邮件
router.post('/resend-verification', authenticateToken, authController.resendVerificationEmail);

// 登出
router.post('/logout', optionalAuth, authController.logout);

module.exports = router;