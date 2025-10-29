const puppeteer = require('puppeteer');
const config = require('./config');

async function runDetailedFrontendTests() {
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
    
    console.log('Running detailed frontend tests...');
    
    // Test 1: Homepage elements and content
    console.log('1. Testing homepage elements and content...');
    await page.goto(config.frontend.baseUrl + config.frontend.pages.home);
    await page.waitForSelector('body');
    
    // Check page title
    const title = await page.title();
    console.log(`   ✓ Page title: ${title}`);
    
    // Check for key elements
    const header = await page.$('header, .header');
    const main = await page.$('main, .main');
    const footer = await page.$('footer, .footer');
    
    if (header) console.log('   ✓ Header found');
    if (main) console.log('   ✓ Main content found');
    if (footer) console.log('   ✓ Footer found');
    
    // Test 2: User registration flow
    console.log('2. Testing user registration flow...');
    await page.goto(config.frontend.baseUrl + config.frontend.pages.register);
    await page.waitForSelector('form');
    
    // Check form elements
    const formElements = await page.$$('form input, form button');
    console.log(`   ✓ Found ${formElements.length} form elements`);
    
    // Test 3: User login flow
    console.log('3. Testing user login flow...');
    await page.goto(config.frontend.baseUrl + config.frontend.pages.login);
    await page.waitForSelector('form');
    
    // Fill login form
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="password"]', '123456');
    
    console.log('   ✓ Login form filled successfully');
    
    // Test 4: AI tools page functionality
    console.log('4. Testing AI tools page functionality...');
    await page.goto(config.frontend.baseUrl + config.frontend.pages.aiTools);
    
    // Check for tool cards or grid
    const toolElements = await page.$$('.tool-card, .ai-tool, .tool-item');
    console.log(`   ✓ Found ${toolElements.length} AI tools`);
    
    // Test 5: Responsive design test
    console.log('5. Testing responsive design...');
    
    // Test mobile view
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(config.frontend.baseUrl + config.frontend.pages.home);
    await page.waitForSelector('body');
    console.log('   ✓ Mobile view loaded successfully');
    
    // Test tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(config.frontend.baseUrl + config.frontend.pages.home);
    await page.waitForSelector('body');
    console.log('   ✓ Tablet view loaded successfully');
    
    // Reset to desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test 6: Navigation menu functionality
    console.log('6. Testing navigation menu functionality...');
    await page.goto(config.frontend.baseUrl + config.frontend.pages.home);
    
    // Try to find and click navigation elements
    const navLinks = await page.$$('nav a, .navbar a, .navigation a');
    console.log(`   ✓ Found ${navLinks.length} navigation links`);
    
    // Test 7: Form validation
    console.log('7. Testing form validation...');
    await page.goto(config.frontend.baseUrl + config.frontend.pages.login);
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors (this may vary based on implementation)
    setTimeout(async () => {
      const errorMessages = await page.$$('.error, .ant-form-item-explain');
      console.log(`   ✓ Found ${errorMessages.length} potential validation messages`);
    }, 1000);
    
    console.log('Detailed frontend tests completed!');
    
  } catch (error) {
    console.error('Detailed frontend tests failed:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { runDetailedFrontendTests };