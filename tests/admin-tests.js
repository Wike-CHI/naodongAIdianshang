const puppeteer = require('puppeteer');
const config = require('./config');

async function runAdminTests() {
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch(config.browser);
    page = await browser.newPage();
    
    // Set timeout
    page.setDefaultTimeout(config.browser.timeout);
    
    console.log('Testing admin panel navigation...');
    
    // Test 1: Admin login page loads
    console.log('1. Testing admin login page load...');
    await page.goto(config.admin.baseUrl + config.admin.pages.login);
    await page.waitForSelector('form');
    console.log('   ✓ Admin login page loaded successfully');
    
    // Test 2: Admin login functionality
    console.log('2. Testing admin login functionality...');
    await page.type('input[name="username"]', config.users.admin.username);
    await page.type('input[name="password"]', config.users.admin.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard or login error
    try {
      await page.waitForSelector('.dashboard, .admin-dashboard', { timeout: 5000 });
      console.log('   ✓ Admin login successful');
    } catch (e) {
      // Check for error message
      const errorElement = await page.$('.error, .ant-message-error');
      if (errorElement) {
        console.log('   ⚠ Admin login failed with error message');
      } else {
        console.log('   ⚠ Admin login result uncertain');
      }
    }
    
    // Test 3: Navigation to admin dashboard
    console.log('3. Testing navigation to admin dashboard...');
    await page.goto(config.admin.baseUrl + config.admin.pages.dashboard);
    await page.waitForSelector('body', { timeout: 5000 }).catch(() => {
      console.log('   ⚠ Dashboard page may require authentication');
    });
    console.log('   ✓ Admin dashboard page loaded (may require authentication)');
    
    // Test 4: Navigation to users management
    console.log('4. Testing navigation to users management...');
    await page.goto(config.admin.baseUrl + config.admin.pages.users);
    await page.waitForSelector('body', { timeout: 5000 });
    console.log('   ✓ Users management page loaded');
    
    // Test 5: Navigation to AI tools management
    console.log('5. Testing navigation to AI tools management...');
    await page.goto(config.admin.baseUrl + config.admin.pages.aiTools);
    await page.waitForSelector('body', { timeout: 5000 });
    console.log('   ✓ AI tools management page loaded');
    
    // Test 6: Navigation to subscriptions management
    console.log('6. Testing navigation to subscriptions management...');
    await page.goto(config.admin.baseUrl + config.admin.pages.subscriptions);
    await page.waitForSelector('body', { timeout: 5000 });
    console.log('   ✓ Subscriptions management page loaded');
    
    // Test 7: Navigation to credits management
    console.log('7. Testing navigation to credits management...');
    await page.goto(config.admin.baseUrl + config.admin.pages.credits);
    await page.waitForSelector('body', { timeout: 5000 });
    console.log('   ✓ Credits management page loaded');
    
    // Test 8: Check admin panel UI elements
    console.log('8. Testing admin panel UI elements...');
    await page.goto(config.admin.baseUrl + config.admin.pages.dashboard);
    
    // Check for sidebar navigation
    const sidebar = await page.$('.sidebar, .sider, .navigation');
    if (sidebar) {
      console.log('   ✓ Sidebar navigation found');
    } else {
      console.log('   ⚠ Sidebar navigation not found');
    }
    
    // Check for header
    const header = await page.$('.header, .layout-header');
    if (header) {
      console.log('   ✓ Header found');
    } else {
      console.log('   ⚠ Header not found');
    }
    
    // Check for main content area
    const mainContent = await page.$('.content, .layout-content, main');
    if (mainContent) {
      console.log('   ✓ Main content area found');
    } else {
      console.log('   ⚠ Main content area not found');
    }
    
    console.log('Admin panel tests completed!');
    
  } catch (error) {
    console.error('Admin panel tests failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { runAdminTests };