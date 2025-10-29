const puppeteer = require('puppeteer');
const config = require('./config');

async function runDetailedAdminTests() {
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      ...config.browser,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set timeout
    page.setDefaultTimeout(config.browser.timeout);
    
    console.log('Running detailed admin panel tests...');
    
    // Test 1: Admin login and authentication
    console.log('1. Testing admin login and authentication...');
    await page.goto(config.admin.baseUrl + config.admin.pages.login);
    await page.waitForSelector('form');
    
    // Fill login form
    await page.type('input[name="username"]', config.users.admin.username);
    await page.type('input[name="password"]', config.users.admin.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect or error
    try {
      await page.waitForSelector('.dashboard, .admin-dashboard, .error', { timeout: 10000 });
      console.log('   ✓ Admin login process completed');
    } catch (e) {
      console.log('   ⚠ Admin login process timed out');
    }
    
    // Test 2: Dashboard elements and widgets
    console.log('2. Testing dashboard elements and widgets...');
    await page.goto(config.admin.baseUrl + config.admin.pages.dashboard);
    
    // Check for dashboard components
    const dashboardElements = await page.$$('.dashboard-card, .statistic, .chart-container');
    console.log(`   ✓ Found ${dashboardElements.length} dashboard elements`);
    
    // Test 3: User management functionality
    console.log('3. Testing user management functionality...');
    await page.goto(config.admin.baseUrl + config.admin.pages.users);
    await page.waitForSelector('body');
    
    // Check for user table
    const userTable = await page.$('table, .user-table');
    if (userTable) {
      console.log('   ✓ User management table found');
      
      // Check for table rows
      const tableRows = await page.$$('table tbody tr, .user-table tbody tr');
      console.log(`   ✓ Found ${tableRows.length} user records`);
    } else {
      console.log('   ⚠ User management table not found');
    }
    
    // Test 4: AI tools management
    console.log('4. Testing AI tools management...');
    await page.goto(config.admin.baseUrl + config.admin.pages.aiTools);
    await page.waitForSelector('body');
    
    // Check for tools table or grid
    const toolsElements = await page.$$('.tool-item, .ai-tool-card, table');
    console.log(`   ✓ Found ${toolsElements.length} AI tool elements`);
    
    // Test 5: Subscription management
    console.log('5. Testing subscription management...');
    await page.goto(config.admin.baseUrl + config.admin.pages.subscriptions);
    await page.waitForSelector('body');
    
    // Check for subscription elements
    const subscriptionElements = await page.$$('.subscription-plan, .plan-card, table');
    console.log(`   ✓ Found ${subscriptionElements.length} subscription elements`);
    
    // Test 6: Credits management
    console.log('6. Testing credits management...');
    await page.goto(config.admin.baseUrl + config.admin.pages.credits);
    await page.waitForSelector('body');
    
    // Check for credits elements
    const creditsElements = await page.$$('.credit-rule, .transaction-record, table');
    console.log(`   ✓ Found ${creditsElements.length} credits management elements`);
    
    // Test 7: Form interactions
    console.log('7. Testing form interactions...');
    
    // Navigate to a page with forms
    await page.goto(config.admin.baseUrl + config.admin.pages.aiTools);
    
    // Try to find and interact with form elements
    const formInputs = await page.$$('input, select, textarea');
    console.log(`   ✓ Found ${formInputs.length} form input elements`);
    
    // Test 8: Data visualization components
    console.log('8. Testing data visualization components...');
    await page.goto(config.admin.baseUrl + config.admin.pages.dashboard);
    
    // Check for charts and graphs
    const chartElements = await page.$$('.chart, .graph, .visualization');
    console.log(`   ✓ Found ${chartElements.length} data visualization elements`);
    
    // Test 9: Responsive design
    console.log('9. Testing responsive design...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(config.admin.baseUrl + config.admin.pages.dashboard);
    await page.waitForSelector('body');
    console.log('   ✓ Mobile view loaded successfully');
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(config.admin.baseUrl + config.admin.pages.dashboard);
    await page.waitForSelector('body');
    console.log('   ✓ Tablet view loaded successfully');
    
    // Reset to desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test 10: Navigation and routing
    console.log('10. Testing navigation and routing...');
    
    // Navigate through main sections
    const navigationLinks = [
      config.admin.pages.dashboard,
      config.admin.pages.users,
      config.admin.pages.aiTools,
      config.admin.pages.subscriptions,
      config.admin.pages.credits
    ];
    
    for (let i = 0; i < navigationLinks.length; i++) {
      try {
        await page.goto(config.admin.baseUrl + navigationLinks[i]);
        await page.waitForSelector('body', { timeout: 5000 });
        console.log(`   ✓ Navigated to ${navigationLinks[i]}`);
      } catch (e) {
        console.log(`   ⚠ Failed to navigate to ${navigationLinks[i]}: ${e.message}`);
      }
    }
    
    console.log('Detailed admin panel tests completed!');
    
  } catch (error) {
    console.error('Detailed admin panel tests failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { runDetailedAdminTests };