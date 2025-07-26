/**
 * Verification script for security fixes
 * Checks that all critical issues have been resolved
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
  console.log(`\nChecking ${filePath}...`);
  
  try {
    const content = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
    let allPassed = true;
    
    for (const check of checks) {
      if (check.shouldNotContain) {
        if (content.includes(check.shouldNotContain)) {
          log(`  ❌ FAIL: Still contains "${check.shouldNotContain}"`, 'red');
          allPassed = false;
        } else {
          log(`  ✓ PASS: Does not contain "${check.shouldNotContain}"`, 'green');
        }
      }
      
      if (check.shouldContain) {
        if (content.includes(check.shouldContain)) {
          log(`  ✓ PASS: Contains "${check.shouldContain}"`, 'green');
        } else {
          log(`  ❌ FAIL: Missing "${check.shouldContain}"`, 'red');
          allPassed = false;
        }
      }
      
      if (check.pattern) {
        const regex = new RegExp(check.pattern);
        if (check.shouldMatch && regex.test(content)) {
          log(`  ✓ PASS: Matches pattern ${check.pattern}`, 'green');
        } else if (check.shouldMatch && !regex.test(content)) {
          log(`  ❌ FAIL: Does not match pattern ${check.pattern}`, 'red');
          allPassed = false;
        } else if (!check.shouldMatch && !regex.test(content)) {
          log(`  ✓ PASS: Does not match pattern ${check.pattern}`, 'green');
        } else if (!check.shouldMatch && regex.test(content)) {
          log(`  ❌ FAIL: Still matches pattern ${check.pattern}`, 'red');
          allPassed = false;
        }
      }
    }
    
    return allPassed;
  } catch (error) {
    log(`  ❌ ERROR: ${error.message}`, 'red');
    return false;
  }
}

function runChecks() {
  log('\n=== Security Fixes Verification ===\n', 'yellow');
  
  const checks = [
    {
      file: 'js/config.js',
      description: 'Client-side config should not contain hardcoded API keys',
      checks: [
        { pattern: 'apiKey.*:.*["\'][A-Za-z0-9]{20,}', shouldMatch: false },
        { shouldContain: 'window.ENV' },
        { shouldContain: 'your-api-key' } // Placeholder values
      ]
    },
    {
      file: 'roi-finder.html',
      description: 'Form prefill should have XSS protection',
      checks: [
        { shouldContain: 'DOMPurify' },
        { shouldContain: 'sanitizeInput' },
        { shouldContain: 'sanitizeNumber' }
      ]
    },
    {
      file: 'api/submit-analysis.js',
      description: 'Submit analysis endpoint should use proper CORS and auth',
      checks: [
        { shouldNotContain: "res.setHeader('Access-Control-Allow-Origin', '*')" },
        { shouldContain: 'applyCorsHeaders' },
        { shouldContain: 'optionalAuth' }
      ]
    },
    {
      file: 'api/analyze-property.js',
      description: 'Analyze property endpoint should use proper CORS, auth, and not log sensitive data',
      checks: [
        { shouldNotContain: "res.setHeader('Access-Control-Allow-Origin', '*')" },
        { shouldContain: 'applyCorsHeaders' },
        { shouldContain: 'authenticate' },
        { shouldNotContain: 'perplexityApiKey.substring(' },
        { shouldNotContain: 'API KEY VALIDATION ==========' }
      ]
    },
    {
      file: 'api/config.js',
      description: 'Config endpoint should use proper CORS',
      checks: [
        { shouldNotContain: "res.setHeader('Access-Control-Allow-Origin', '*')" },
        { shouldContain: 'applyCorsHeaders' }
      ]
    },
    {
      file: 'utils/cors-config.js',
      description: 'CORS config should have proper origin whitelist',
      checks: [
        { shouldContain: 'starterpackapp.vercel.app' },
        { shouldContain: 'starterpackapp.com' },
        { shouldNotContain: 'investorprops' }
      ]
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    log(`\n${check.description}`, 'yellow');
    if (checkFile(check.file, check.checks)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n=== Verification Summary ===');
  log(`Passed: ${passed}/${checks.length}`, passed === checks.length ? 'green' : 'yellow');
  log(`Failed: ${failed}/${checks.length}`, failed > 0 ? 'red' : 'green');
  
  if (failed > 0) {
    log('\n❌ Some security checks failed. Please review the implementation.', 'red');
    process.exit(1);
  } else {
    log('\n✓ All security fixes verified successfully!', 'green');
    log('\nNext steps:', 'yellow');
    log('1. Run comprehensive tests: npm run test:comprehensive', 'yellow');
    log('2. Test authentication flow with real Firebase tokens', 'yellow');
    log('3. Deploy to staging for integration testing', 'yellow');
    process.exit(0);
  }
}

// Run verification
runChecks();