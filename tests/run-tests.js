#!/usr/bin/env node

const { runAllTests } = require('./index');
const { runDetailedFrontendTests } = require('./frontend-detailed-tests');
const { runDetailedAdminTests } = require('./admin-detailed-tests');

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  console.log('Naodong AI Platform - Automated Testing Suite');
  console.log('=============================================\n');
  
  try {
    switch (testType) {
      case 'all':
        await runAllTests();
        break;
        
      case 'frontend':
        console.log('Running frontend tests only...');
        // Import and run frontend tests
        const { runFrontendTests } = require('./frontend-tests');
        await runFrontendTests();
        break;
        
      case 'admin':
        console.log('Running admin panel tests only...');
        // Import and run admin tests
        const { runAdminTests } = require('./admin-tests');
        await runAdminTests();
        break;
        
      case 'backend':
        console.log('Running backend API tests only...');
        // Import and run backend tests
        const { runBackendTests } = require('./backend-tests');
        await runBackendTests();
        break;
        
      case 'frontend-detailed':
        console.log('Running detailed frontend tests...');
        await runDetailedFrontendTests();
        break;
        
      case 'admin-detailed':
        console.log('Running detailed admin panel tests...');
        await runDetailedAdminTests();
        break;
        
      default:
        console.log(`Unknown test type: ${testType}`);
        console.log('Available test types: all, frontend, admin, backend, frontend-detailed, admin-detailed');
        process.exit(1);
    }
    
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Tests failed with error:', error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}