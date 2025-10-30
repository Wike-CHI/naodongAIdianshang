const axios = require('axios');

async function testSubscription() {
  try {
    // 先登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      phone: '13800138000',
      password: '123456'
    });
    
    console.log('登录成功:', loginResponse.data);
    
    const token = loginResponse.data.data.token;
    
    // 获取订阅套餐列表
    const plansResponse = await axios.get('http://localhost:8080/api/subscriptions/plans', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('订阅套餐列表:', plansResponse.data);
    
    // 选择第一个套餐进行订阅
    const plans = plansResponse.data.data.plans;
    if (plans && plans.length > 0) {
      const plan = plans[0];
      console.log('选择套餐:', plan);
      
      // 创建订阅
      const subscriptionResponse = await axios.post('http://localhost:8080/api/subscriptions', {
        plan_id: plan._id,
        payment_method: 'alipay',
        transaction_id: `txn_${Date.now()}`,
        auto_renew: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('订阅结果:', subscriptionResponse.data);
    } else {
      console.log('没有可用的订阅套餐');
    }
  } catch (error) {
    console.error('测试失败:', error.response ? error.response.data : error.message);
  }
}

testSubscription();