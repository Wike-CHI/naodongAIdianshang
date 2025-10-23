const jwt = require('jsonwebtoken');

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'naodongai_secret_key_2024';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // 生成JWT token
  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  // 验证JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // 生成用户token
  generateUserToken(user) {
    const payload = {
      user_id: user._id,
      username: user.username,
      user_type: user.user_type,
      role: 'user',
      permissions: []
    };
    return this.generateToken(payload);
  }

  // 生成管理员token
  generateAdminToken(admin) {
    const payload = {
      user_id: admin._id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions
    };
    return this.generateToken(payload);
  }

  // 从请求头中提取token
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

module.exports = new JWTService();