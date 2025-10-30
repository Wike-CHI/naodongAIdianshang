const express = require('express');
const router = express.Router();
const creditPackageController = require('../controllers/creditPackageController');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 获取积分套餐列表（仅限年度会员用户）
router.get('/', authenticateToken, creditPackageController.getCreditPackages);

// 创建积分套餐（管理员）
router.post('/', authenticateToken, requireAdmin, validate(schemas.creditPackage), creditPackageController.createCreditPackage);

// 更新积分套餐（管理员）
router.put('/:id', authenticateToken, requireAdmin, validate(schemas.idParam), validate(schemas.creditPackage), creditPackageController.updateCreditPackage);

// 删除积分套餐（管理员）
router.delete('/:id', authenticateToken, requireAdmin, validate(schemas.idParam), creditPackageController.deleteCreditPackage);

// 购买积分套餐
router.post('/purchase', authenticateToken, validate(schemas.purchaseCreditPackage), creditPackageController.purchaseCreditPackage);

module.exports = router;