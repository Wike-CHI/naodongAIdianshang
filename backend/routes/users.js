const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireUserOrAdmin } = require('../middleware/auth');

// 配置multer用于头像上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'), false);
    }
  }
});

// 获取用户列表（管理员）
router.get('/', authenticateToken, requireAdmin, validate(schemas.pagination, 'query'), userController.getUsers);

// 获取用户统计（管理员）
router.get('/stats', authenticateToken, requireAdmin, userController.getUserStats);

// 批量操作用户（管理员）
router.post('/batch', authenticateToken, requireAdmin, validate(schemas.batchUserUpdate), userController.batchUpdateUsers);

// 获取用户详情
router.get('/:id', authenticateToken, requireUserOrAdmin, validate(schemas.idParam, 'params'), userController.getUserById);

// 检查用户是否可以修改资料
router.get('/:id/profile-update-permission', authenticateToken, requireUserOrAdmin, validate(schemas.idParam, 'params'), userController.checkProfileUpdatePermission);

// 更新用户信息
router.put('/:id', authenticateToken, requireUserOrAdmin, validate(schemas.idParam, 'params'), validate(schemas.userUpdate), userController.updateUser);

// 上传用户头像
router.post('/:id/avatar', authenticateToken, requireUserOrAdmin, validate(schemas.idParam, 'params'), upload.single('avatar'), userController.uploadAvatar);

// 软删除用户（管理员）
router.delete('/:id', authenticateToken, requireAdmin, validate(schemas.idParam, 'params'), userController.deleteUser);

// 获取用户积分记录
router.get('/:id/credits', authenticateToken, requireUserOrAdmin, validate(schemas.idParam, 'params'), validate(schemas.pagination, 'query'), userController.getUserCreditRecords);

// 获取用户AI生成历史
router.get('/:id/generations', authenticateToken, requireUserOrAdmin, validate(schemas.idParam, 'params'), validate(schemas.pagination, 'query'), userController.getUserGenerations);

// 管理员调整用户积分
router.post('/:id/adjust-credits', authenticateToken, requireAdmin, validate(schemas.idParam, 'params'), validate(schemas.adjustCredits, 'body'), userController.adjustUserCredits);

// 获取用户订阅信息
router.get('/:id/subscription', authenticateToken, requireUserOrAdmin, validate(schemas.idParam, 'params'), userController.getUserSubscription);

module.exports = router;