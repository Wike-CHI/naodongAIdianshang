require('dotenv').config();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// 使用实际存在的用户ID
const mockUser = {
  userId: '68fcc211115016b389bf0568',  // 使用实际存在的用户ID
  username: 'testuser',
  email: 'test@example.com'
};

// 生成测试用的JWT令牌
const generateTestToken = () => {
  const token = jwt.sign(
    mockUser,
    process.env.JWT_SECRET, // 使用环境变量中的JWT_SECRET
    { expiresIn: '1h' }
  );
  
  return token;
};

// 测试AI生成API
const testAIAPI = async () => {
  try {
    // 生成认证令牌
    const token = generateTestToken();
    console.log('生成的测试令牌:', token);
    
    // 保存令牌到文件，供测试页面使用
    fs.writeFileSync(path.join(__dirname, 'test-token.txt'), token);
    console.log('令牌已保存到 test-token.txt 文件');
    
    console.log('\n在测试HTML页面中使用以下代码添加认证头:');
    console.log(`
      // 在fetch请求中添加认证头
      const response = await fetch('http://localhost:8080/api/ai/generate/ai-model', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': 'Bearer ${token}'
        }
      });
    `);
    
    // 验证令牌
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('\n令牌验证成功:', decoded);
    } catch (error) {
      console.error('令牌验证失败:', error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
};

// 运行测试
testAIAPI();