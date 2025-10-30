require('dotenv').config();

console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);

// 测试JWT生成
const jwt = require('jsonwebtoken');

const testUser = {
  userId: '1234567890',
  username: 'testuser',
  email: 'test@example.com'
};

const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log('Generated token:', token);

// 验证令牌
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Decoded token:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}