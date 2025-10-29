require('dotenv').config();
const jwt = require('jsonwebtoken');

// 生成JWT令牌
const generateToken = (userId, type = 'user', expiresIn = '7d') => {
  return jwt.sign(
    { userId, type },
    process.env.JWT_SECRET || 'your-secret-key-here',
    { expiresIn }
  );
};

// 验证JWT令牌
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
};

// 测试
const userId = 'test_user_id';
const token = generateToken(userId, 'user');
console.log('Generated token:', token);

try {
  const decoded = verifyToken(token);
  console.log('Decoded token:', decoded);
} catch (error) {
  console.error('Token verification failed:', error);
}