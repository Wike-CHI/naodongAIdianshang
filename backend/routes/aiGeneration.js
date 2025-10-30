const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { generateWithTool, getPaginatedHistory, getGenerationStats, getHistoryRecord } = require('../services/aiGenerationService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 4
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPEG, PNG, WebP 格式的图片'));
    }
  }
});

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.post(
  '/generate/:toolKey',
  authenticateToken,
  upload.array('images', 4),
  async (req, res) => {
    try {
      const { toolKey } = req.params;
      const userId = req.user?.id || req.user?._id;

      if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json({ success: false, error: '无法识别用户身份' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: '请至少上传一张主图片' });
      }

      const bodyValidation = schemas.aiGenerate.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
      if (bodyValidation.error) {
        return res.status(400).json({
          success: false,
          error: bodyValidation.error.details.map((detail) => detail.message).join(', ')
        });
      }

      const serviceResult = await generateWithTool({
        toolKey,
        userId,
        body: {
          ...bodyValidation.value,
          options: JSON.stringify(bodyValidation.value.options),
          metadata: JSON.stringify(bodyValidation.value.metadata)
        },
        files: req.files
      });

      res.json({
        success: true,
        data: {
          generationId: serviceResult.record._id,
          images: serviceResult.result.images,
          text_outputs: serviceResult.result.text_outputs,
          timing_ms: serviceResult.result.timing_ms,
          tool: {
            id: toolKey,
            name: serviceResult.tool.name,
            creditCost: serviceResult.tool.credit_cost
          },
          credits_used: serviceResult.creditsUsed
        }
      });
    } catch (error) {
      console.error('AI生成失败:', error);
      res.status(500).json({
        success: false,
        error: error.message || '生成失败，请稍后重试'
      });
    }
  }
);

router.get('/health', async (_req, res) => {
  res.json({ success: true, status: 'ok', message: 'AI生成服务正常运行' });
});

router.get(
  '/history',
  authenticateToken,
  validate(schemas.generateHistoryQuery, 'query'),
  async (req, res) => {
    try {
      const queryUserId = req.userType === 'admin' && req.query.userId && isValidObjectId(req.query.userId)
        ? req.query.userId
        : req.user._id;

      const history = await getPaginatedHistory({
        userId: queryUserId,
        page: req.query.page,
        limit: req.query.limit,
        toolId: req.query.toolId,
        status: req.query.status,
        days: req.query.days,
        includeAdminView: req.userType === 'admin'
      });

      res.json({ success: true, data: history });
    } catch (error) {
      console.error('获取生成历史失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get(
  '/history/:recordId',
  authenticateToken,
  validate(schemas.generationIdParam, 'params'),
  async (req, res) => {
    try {
      const record = await getHistoryRecord({
        recordId: req.params.recordId,
        userId: req.userType === 'admin' ? null : req.user._id
      });

      if (!record) {
        return res.status(404).json({ success: false, error: '记录不存在' });
      }

      res.json({ success: true, data: record });
    } catch (error) {
      console.error('获取生成记录失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.delete(
  '/history/:recordId',
  authenticateToken,
  validate(schemas.generationIdParam, 'params'),
  async (req, res) => {
    try {
      const isAdmin = req.userType === 'admin';
      const removed = await getHistoryRecord({
        recordId: req.params.recordId,
        userId: isAdmin ? null : req.user._id,
        remove: true
      });

      if (!removed) {
        return res.status(404).json({ success: false, error: '记录不存在' });
      }

      res.json({ success: true, message: '记录已删除' });
    } catch (error) {
      console.error('删除生成记录失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.get(
  '/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const stats = await getGenerationStats({
        userId: req.userType === 'admin' ? null : req.user._id,
        includeAdminView: req.userType === 'admin'
      });

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('获取生成统计失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: '文件大小超过限制（最大10MB）' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, error: '文件数量超过限制（最多4个）' });
    }
  }

  res.status(500).json({ success: false, error: error.message });
});

module.exports = router;
