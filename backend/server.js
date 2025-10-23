const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 导入数据库连接
const Database = require('./config/database');

// 导入路由
const authRoutes = require('./routes/auth');
const aiToolsRoutes = require('./routes/aiTools');
const usersRoutes = require('./routes/users');
const creditsRoutes = require('./routes/credits');
const subscriptionsRoutes = require('./routes/subscriptions');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 8080;

// 连接数据库
const database = Database;
database.connect();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '脑洞AI后台服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 挂载路由
app.use('/api/auth', authRoutes);
app.use('/api/ai-tools', aiToolsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/upload', uploadRoutes);

// 静态文件服务 - 提供上传文件的访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器已启动，运行在 http://localhost:${PORT}`);
});