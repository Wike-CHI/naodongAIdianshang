const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminUser = require('../models/AdminUser');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: '访问令牌缺失' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type === 'admin') {
      const adminUser = await AdminUser.findById(decoded.userId);
      if (!adminUser) {
        return res.status(401).json({ success: false, message: '管理员身份无效' });
      }
      req.user = {
        id: adminUser._id.toString(),
        type: 'admin',
        username: adminUser.username,
        role: adminUser.role
      };
      req.userType = 'admin';
      return next();
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在或已注销' });
    }

    req.user = user;
    req.userType = 'user';
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: '访问令牌无效', details: error.message });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.userType !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
};

const requireUserOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  if (req.userType === 'admin') {
    return next();
  }

  const targetUserId = req.params.id || req.params.userId || req.body.user_id;
  if (targetUserId && req.user._id.toString() !== targetUserId.toString()) {
    return res.status(403).json({ success: false, message: '无权访问此资源' });
  }

  next();
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type === 'admin') {
      const adminUser = await AdminUser.findById(decoded.userId);
      if (adminUser) {
        req.user = {
          id: adminUser._id.toString(),
          type: 'admin',
          username: adminUser.username,
          role: adminUser.role
        };
        req.userType = 'admin';
      }
      return next();
    }

    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
      req.userType = 'user';
    }
  } catch (error) {
    // ignore optional auth failures
  }

  next();
};

module.exports = { authenticateToken, requireAdmin, requireUserOrAdmin, optionalAuth };
