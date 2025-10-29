const { runFrontendTests } = require('./frontend-tests');
const { runAdminTests } = require('./admin-tests');
const { runBackendTests } = require('./backend-tests');
const config = require('./config');

async function runAllTests() {
  console.log('Starting automated tests for Naodong AI platform...');
  
  try {
    // Run frontend tests
    console.log('\n=== Running Frontend Tests ===');
    await runFrontendTests();
    
    // Run admin panel tests
    console.log('\n=== Running Admin Panel Tests ===');
    await runAdminTests();
    
    // Run backend API tests
    console.log('\n=== Running Backend API Tests ===');
    await runBackendTests();
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Tests failed with error:', error);
    process.exit(1);
  }
}

// Run all tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };