#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner
 * Runs the full test suite with detailed reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

async function runTests() {
  console.log('🚀 Starting Comprehensive E2E Test Suite');
  console.log('=' .repeat(60));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`📁 Test file: comprehensive-e2e.spec.js`);
  console.log('=' .repeat(60) + '\n');

  // Create results directory
  const resultsDir = path.join(__dirname, 'test-results', new Date().toISOString().split('T')[0]);
  await fs.mkdir(resultsDir, { recursive: true });

  // Run tests with various options
  const testProcess = spawn('npx', [
    'playwright',
    'test',
    'comprehensive-e2e.spec.js',
    '--headed',  // Show browser (remove for headless)
    '--workers=1',  // Run tests sequentially
    '--reporter=list,html',  // Multiple reporters
    '--screenshot=on',  // Always take screenshots
    '--video=retain-on-failure',  // Record video on failures
    '--trace=retain-on-failure',  // Record trace on failures
    `--output=${resultsDir}`
  ], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  testProcess.on('close', async (code) => {
    console.log('\n' + '=' .repeat(60));
    
    if (code === 0) {
      console.log('✅ All tests passed successfully!');
      
      // Generate summary report
      const summaryPath = path.join(resultsDir, 'summary.txt');
      const summary = `
Comprehensive E2E Test Summary
=============================
Date: ${new Date().toISOString()}
Status: PASSED
Test File: comprehensive-e2e.spec.js

Coverage Areas:
- Form submission and analysis flow
- Tab navigation (STR, LTR, Investment)
- Financial calculator interactions
- Property management percentage
- Interest rate adjustments
- Down payment modifications
- Expense editing
- Reset functionality
- Airbnb comparables modal
- Key metrics indicators
- Responsive design (Mobile, Tablet, Desktop)
- Edge cases and error states
- Data persistence

Screenshots: ${resultsDir}/screenshots/
HTML Report: playwright-report/index.html
`;
      
      await fs.writeFile(summaryPath, summary);
      console.log(`📄 Summary written to: ${summaryPath}`);
      console.log('\n📊 View detailed HTML report: npx playwright show-report');
      
    } else {
      console.log('❌ Some tests failed!');
      console.log(`Exit code: ${code}`);
      console.log('\n🔍 Check the following for details:');
      console.log(`  - Screenshots: ${resultsDir}/screenshots/`);
      console.log('  - HTML Report: npx playwright show-report');
      console.log('  - Videos: test-results/');
      console.log('  - Traces: test-results/');
    }
    
    console.log('=' .repeat(60));
  });
}

// Add test categories for selective running
async function runCategory(category) {
  const categories = {
    'navigation': 'Tab Navigation Testing',
    'calculator': 'Financial Calculator Interactions',
    'modals': 'Airbnb Comparables Modal',
    'responsive': 'Responsive Design Testing',
    'edge-cases': 'Error States & Edge Cases'
  };

  if (!categories[category]) {
    console.log('Available categories:', Object.keys(categories).join(', '));
    return;
  }

  console.log(`Running tests for: ${categories[category]}`);
  
  // Run with grep to filter tests
  const testProcess = spawn('npx', [
    'playwright',
    'test',
    'comprehensive-e2e.spec.js',
    '--grep',
    categories[category]
  ], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });
}

// Check command line arguments
const args = process.argv.slice(2);
if (args[0] === '--category' && args[1]) {
  runCategory(args[1]);
} else {
  runTests();
}

// Export for use in other scripts
module.exports = { runTests, runCategory };