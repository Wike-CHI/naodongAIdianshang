const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateUser, authenticateAdmin } = require('../middlewares/auth');

// 单文件上传 - 需要用户认证
router.post('/single', 
  authenticateUser,
  uploadController.upload.single('file'),
  uploadController.uploadSingle
);

// 多文件上传 - 需要用户认证
router.post('/multiple',
  authenticateUser,
  uploadController.upload.array('files', 5),
  uploadController.uploadMultiple
);

// 删除文件 - 需要用户认证
router.delete('/file',
  authenticateUser,
  uploadController.deleteFile
);

// 获取文件信息 - 需要用户认证
router.get('/info/:subDir/:fileName',
  authenticateUser,
  uploadController.getFileInfo
);

// 管理员路由
// 获取上传统计 - 需要管理员权限
router.get('/stats',
  authenticateAdmin,
  uploadController.getUploadStats
);

// 清理临时文件 - 需要管理员权限
router.post('/cleanup',
  authenticateAdmin,
  uploadController.cleanupTempFiles
);

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件数量超出限制'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: '意外的文件字段'
      });
    }
  }
  
  if (error.message === '不支持的文件类型') {
    return res.status(400).json({
      success: false,
      message: '不支持的文件类型'
    });
  }

  res.status(500).json({
    success: false,
    message: '文件上传失败'
  });
});

module.exports = router;