const jwtService = require('../utils/jwt');
const { User, AdminUser } = require('../models');

// 用户认证中间件
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const decoded = jwtService.verifyToken(token);
    
    if (decoded.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 查找用户
    const user = await User.findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    req.user = user;
    req.token = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证令牌无效'
    });
  }
};

// 管理员认证中间件
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const decoded = jwtService.verifyToken(token);
    
    if (!['admin', 'super_admin', 'operator'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 查找管理员
    const admin = await AdminUser.findById(decoded.user_id);
    if (!admin || !admin.is_active) {
      return res.status(401).json({
        success: false,
        message: '管理员账户不存在或已被禁用'
      });
    }

    req.admin = admin;
    req.token = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证令牌无效'
    });
  }
};

// 权限检查中间件
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    if (!req.admin.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `缺少权限: ${permission}`
      });
    }

    next();
  };
};

// 可选认证中间件（用于可选登录的接口）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = jwtService.verifyToken(token);
      
      if (decoded.role === 'user') {
        const user = await User.findById(decoded.user_id);
        if (user) {
          req.user = user;
          req.token = decoded;
        }
      } else if (['admin', 'super_admin', 'operator'].includes(decoded.role)) {
        const admin = await AdminUser.findById(decoded.user_id);
        if (admin && admin.is_active) {
          req.admin = admin;
          req.token = decoded;
        }
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next();
  }
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  requirePermission,
  optionalAuth
};