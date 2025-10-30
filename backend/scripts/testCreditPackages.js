const http = require('http');

// 测试获取积分套餐列表
const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/credit-packages',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`状态码: ${res.statusCode}`);
    console.log('响应数据:', data);
    
    try {
      const result = JSON.parse(data);
      console.log('解析后的数据:', result);
    } catch (error) {
      console.error('解析JSON失败:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
});

req.end();