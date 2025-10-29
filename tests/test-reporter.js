class TestReporter {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }
  
  startTestSuite(suiteName) {
    console.log(`\n=== ${suiteName} ===`);
    this.currentSuite = suiteName;
  }
  
  pass(testName, details = '') {
    const result = {
      suite: this.currentSuite,
      test: testName,
      status: 'PASS',
      details: details,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`   ✓ ${testName} ${details ? '- ' + details : ''}`);
  }
  
  fail(testName, error, details = '') {
    const result = {
      suite: this.currentSuite,
      test: testName,
      status: 'FAIL',
      error: error.message || error,
      details: details,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`   ✗ ${testName} - ${error.message || error} ${details ? '- ' + details : ''}`);
  }
  
  skip(testName, reason = '') {
    const result = {
      suite: this.currentSuite,
      test: testName,
      status: 'SKIP',
      reason: reason,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    console.log(`   ⚠ ${testName} (skipped${reason ? ': ' + reason : ''})`);
  }
  
  generateSummary() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const skippedTests = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Skipped: ${skippedTests}`);
    console.log(`Duration: ${duration}ms`);
    
    if (failedTests > 0) {
      console.log('\nFailed tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.suite} > ${r.test}: ${r.error}`);
        });
    }
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      skipped: skippedTests,
      duration: duration,
      results: this.results
    };
  }
  
  generateDetailedReport() {
    const summary = this.generateSummary();
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: summary,
      detailedResults: this.results
    };
    
    return report;
  }
}

module.exports = TestReporter;