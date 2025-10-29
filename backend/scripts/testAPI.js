const http = require('http');

// 先登录获取token
const loginOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const loginData = JSON.stringify({
  phone: '13800138000',
  password: '123456'
});

const loginReq = http.request(loginOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('登录结果:', result);
    
    if (result.success) {
      const token = result.data.token;
      console.log('获取到的token:', token);
      
      // 使用token创建订阅
      const subscriptionOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/subscriptions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      const subscriptionData = JSON.stringify({
        plan_id: '6901f6d8f453fefd3ddf054a',
        payment_method: 'alipay',
        transaction_id: 'test_transaction_001',
        auto_renew: true
      });
      
      const subscriptionReq = http.request(subscriptionOptions, (res) => {
        console.log(`创建订阅状态码: ${res.statusCode}`);
        
        res.on('data', (chunk) => {
          console.log(`创建订阅响应体: ${chunk}`);
        });
      });
      
      subscriptionReq.on('error', (error) => {
        console.error('创建订阅请求错误:', error);
      });
      
      subscriptionReq.write(subscriptionData);
      subscriptionReq.end();
    }
  });
});

loginReq.on('error', (error) => {
  console.error('登录请求错误:', error);
});

loginReq.write(loginData);
loginReq.end();