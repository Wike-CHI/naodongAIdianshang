const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'your-secret-key-here';

// 验证JWT token中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '访问令牌无效'
      });
    }
    req.user = user;
    next();
  });
};

// 可选认证中间件
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// 管理员权限验证中间件
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要登录'
      });
    }

    // 检查用户是否为管理员
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.is_admin) {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: '权限验证失败',
      error: error.message
    });
  }
};

module.exports = { authenticateToken, optionalAuth, requireAdmin };