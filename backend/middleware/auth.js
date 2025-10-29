const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminUser = require('../models/AdminUser');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

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

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
  // 检查用户是否已认证
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  // 检查用户类型是否为管理员
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  next();
};

// 用户或管理员权限验证中间件
const requireUserOrAdmin = (req, res, next) => {
  // 检查用户是否已认证
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }

  // 检查是否为管理员或用户本人
  const userId = req.params.id;
  if (req.user.type === 'admin' || req.user._id.toString() === userId) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: '无权访问此资源'
    });
  }
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

module.exports = { authenticateToken, requireAdmin, requireUserOrAdmin, optionalAuth };