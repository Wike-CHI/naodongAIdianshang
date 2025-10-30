require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const { initializeModels } = require('./startup/initializeModels');
const seedToolPresets = require('./startup/seedToolPresets');

const app = express();
const PORT = process.env.PORT || 8080;

const FRONTEND_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:3006',
  'http://localhost:3007',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://localhost:8084'

].filter(Boolean);

app.use(cors({
  origin: FRONTEND_ORIGINS,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/generated', express.static(path.join(__dirname, 'generated'), { maxAge: '1d' }));

const bootstrapDatabase = async () => {
  try {
    await connectDB();
    await initializeModels();
    await seedToolPresets();
    if (typeof logger.log === 'function') {
      logger.log('✅ 数据库初始化完成');
    } else {
      console.log('[startup] 数据库初始化完成');
    }
  } catch (error) {
    if (typeof logger.error === 'function') {
      logger.error('❌ 数据库初始化失败:', error);
    } else {
      console.error('[startup] 数据库初始化失败:', error);
    }
    process.exit(1);
  }
};

bootstrapDatabase();

// 引入路由
const authRoutes = require('./routes/auth');
const aiGenerationRoutes = require('./routes/aiGeneration');
const aiToolsRoutes = require('./routes/aiTools');
const aiModelToolsAdminRoutes = require('./routes/aiModelToolsAdmin');
const usersRoutes = require('./routes/users');
const subscriptionsRoutes = require('./routes/subscriptions');
const creditsRoutes = require('./routes/credits');
const creditPackagesRoutes = require('./routes/creditPackages');

app.get('/api/health', (req, res) => {
  const mongoStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const connectionState = mongoStates[mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'ok',
    dbState: connectionState,
    dbName: mongoose.connection.db?.databaseName || null,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiGenerationRoutes);
app.use('/api/admin/ai-tools', aiToolsRoutes);
app.use('/api/admin/ai-model-tools', aiModelToolsAdminRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/credit-packages', creditPackagesRoutes);

// 用户相关路由（注意：这些路由与 /api/admin/users 不同，是给普通用户使用的）
app.use('/api/user', usersRoutes);

// 全局错误处理
app.use((error, req, res, next) => {
  if (typeof logger.error === 'function') {
    logger.error('Unhandled error:', error);
  } else {
    console.error('Unhandled error:', error);
  }
  res.status(error.status || 500).json({
    success: false,
    message: error.message || '服务器内部错误'
  });
});

app.listen(PORT, () => {
  if (typeof logger.log === 'function') {
    logger.log(`✅ 后端服务已启动：http://localhost:${PORT}`);
  } else {
    console.log(`[server] listening on http://localhost:${PORT}`);
  }
});
