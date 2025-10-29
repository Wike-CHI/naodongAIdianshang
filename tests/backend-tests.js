const axios = require('axios');
const config = require('./config');

async function runBackendTests() {
  console.log('Testing backend API endpoints...');
  
  try {
    // Test 1: Health check endpoint
    console.log('1. Testing health check endpoint...');
    try {
      const healthResponse = await axios.get(`${config.backend.baseUrl}/api/health`);
      console.log(`   ✓ Health check successful: ${JSON.stringify(healthResponse.data)}`);
    } catch (error) {
      console.log(`   ⚠ Health check failed: ${error.message}`);
    }
    
    // Test 2: Auth endpoints
    console.log('2. Testing auth endpoints...');
    
    // Test login endpoint
    try {
      const loginResponse = await axios.post(`${config.backend.baseUrl}/api/auth/login`, {
        email: 'test@example.com',
        password: '123456'
      });
      console.log(`   ✓ Login endpoint responded: ${loginResponse.status}`);
    } catch (error) {
      console.log(`   ⚠ Login endpoint test failed: ${error.message}`);
    }
    
    // Test admin login endpoint
    try {
      const adminLoginResponse = await axios.post(`${config.backend.baseUrl}/api/auth/admin-login`, {
        username: config.users.admin.username,
        password: config.users.admin.password
      });
      console.log(`   ✓ Admin login endpoint responded: ${adminLoginResponse.status}`);
    } catch (error) {
      console.log(`   ⚠ Admin login endpoint test failed: ${error.message}`);
    }
    
    // Test 3: User management endpoints
    console.log('3. Testing user management endpoints...');
    
    // Test get users endpoint (may require auth)
    try {
      const usersResponse = await axios.get(`${config.backend.baseUrl}/api/admin/users`);
      console.log(`   ✓ Get users endpoint responded: ${usersResponse.status}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ⚠ Get users endpoint requires authentication (401)');
      } else {
        console.log(`   ⚠ Get users endpoint test failed: ${error.message}`);
      }
    }
    
    // Test 4: AI tools endpoints
    console.log('4. Testing AI tools endpoints...');
    
    // Test get AI tools endpoint
    try {
      const toolsResponse = await axios.get(`${config.backend.baseUrl}/api/admin/ai-tools`);
      console.log(`   ✓ Get AI tools endpoint responded: ${toolsResponse.status}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ⚠ Get AI tools endpoint requires authentication (401)');
      } else {
        console.log(`   ⚠ Get AI tools endpoint test failed: ${error.message}`);
      }
    }
    
    // Test 5: Subscription endpoints
    console.log('5. Testing subscription endpoints...');
    
    // Test get subscription plans endpoint
    try {
      const plansResponse = await axios.get(`${config.backend.baseUrl}/api/subscriptions/plans`);
      console.log(`   ✓ Get subscription plans endpoint responded: ${plansResponse.status}`);
    } catch (error) {
      console.log(`   ⚠ Get subscription plans endpoint test failed: ${error.message}`);
    }
    
    // Test 6: Credits endpoints
    console.log('6. Testing credits endpoints...');
    
    // Test get credit logs endpoint (may require auth)
    try {
      const creditsResponse = await axios.get(`${config.backend.baseUrl}/api/credits`);
      console.log(`   ✓ Get credits endpoint responded: ${creditsResponse.status}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ⚠ Get credits endpoint requires authentication (401)');
      } else {
        console.log(`   ⚠ Get credits endpoint test failed: ${error.message}`);
      }
    }
    
    // Test 7: AI generation endpoints
    console.log('7. Testing AI generation endpoints...');
    
    // Test AI models endpoint
    try {
      const modelsResponse = await axios.get(`${config.backend.baseUrl}/api/ai/models`);
      console.log(`   ✓ Get AI models endpoint responded: ${modelsResponse.status}`);
    } catch (error) {
      console.log(`   ⚠ Get AI models endpoint test failed: ${error.message}`);
    }
    
    console.log('Backend API tests completed!');
    
  } catch (error) {
    console.error('Backend API tests failed:', error);
    throw error;
  }
}

module.exports = { runBackendTests };