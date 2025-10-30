require('dotenv').config();
const jwt = require('jsonwebtoken');

// 从文件读取令牌
const fs = require('fs');
const token = fs.readFileSync('./test-token.txt', 'utf8').trim();

console.log('Token from file:', token);
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token is valid:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
  console.error('Error name:', error.name);
}