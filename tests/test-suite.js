const { runFrontendTests } = require('./frontend-tests');
const { runAdminTests } = require('./admin-tests');
const { runBackendTests } = require('./backend-tests');
const { runDetailedFrontendTests } = require('./frontend-detailed-tests');
const { runDetailedAdminTests } = require('./admin-detailed-tests');

class TestSuite {
  constructor() {
    this.testModules = {
      frontend: runFrontendTests,
      admin: runAdminTests,
      backend: runBackendTests,
      'frontend-detailed': runDetailedFrontendTests,
      'admin-detailed': runDetailedAdminTests
    };
  }
  
  async run(testTypes = ['frontend', 'admin', 'backend']) {
    console.log('🚀 Starting Naodong AI Test Suite');
    console.log('=====================================\n');
    
    const results = [];
    
    for (const testType of testTypes) {
      if (this.testModules[testType]) {
        try {
          console.log(`🧪 Running ${testType} tests...`);
          await this.testModules[testType]();
          results.push({ testType, status: 'passed' });
          console.log(`✅ ${testType} tests completed successfully\n`);
        } catch (error) {
          console.error(`❌ ${testType} tests failed:`, error.message);
          results.push({ testType, status: 'failed', error: error.message });
        }
      } else {
        console.log(`⚠️  Unknown test type: ${testType}`);
        results.push({ testType, status: 'unknown' });
      }
    }
    
    // Generate summary report
    this.generateReport(results);
    
    return results;
  }
  
  generateReport(results) {
    console.log('\n📋 Test Suite Summary');
    console.log('====================');
    
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const unknown = results.filter(r => r.status === 'unknown').length;
    
    console.log(`Total test suites: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Unknown: ${unknown}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed test suites:');
      results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  - ${r.testType}: ${r.error}`));
    }
    
    console.log('\n🏁 Test suite execution completed');
  }
}

module.exports = TestSuite;