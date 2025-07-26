/**
 * Test script to verify security fixes
 * Ensures authentication and CORS are properly implemented
 */

const axios = require('axios');

// Test configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-firebase-token';

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

async function testEndpoint(name, url, options = {}) {
  console.log(`\nTesting ${name}...`);
  
  try {
    // Test without authentication
    log('Testing without auth...', 'yellow');
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        data: options.data,
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://starterpackapp.com'
        }
      });
      
      if (options.requiresAuth) {
        log('❌ FAIL: Endpoint allowed access without authentication', 'red');
        return false;
      } else {
        log('✓ PASS: Endpoint accessible without auth (as expected)', 'green');
      }
    } catch (error) {
      if (options.requiresAuth && error.response?.status === 401) {
        log('✓ PASS: Endpoint correctly rejected unauthenticated request', 'green');
      } else {
        log(`❌ FAIL: Unexpected error: ${error.response?.status} ${error.message}`, 'red');
        return false;
      }
    }
    
    // Test with authentication
    if (options.requiresAuth) {
      log('Testing with auth...', 'yellow');
      try {
        const response = await axios({
          url,
          method: options.method || 'GET',
          data: options.data,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Origin': 'https://starterpackapp.com'
          }
        });
        log('✓ PASS: Endpoint accessible with authentication', 'green');
      } catch (error) {
        log(`❌ FAIL: Authenticated request failed: ${error.response?.status} ${error.message}`, 'red');
        return false;
      }
    }
    
    // Test CORS headers
    log('Testing CORS...', 'yellow');
    try {
      const response = await axios({
        url,
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://starterpackapp.com',
          'Access-Control-Request-Method': options.method || 'GET',
          'Access-Control-Request-Headers': 'Authorization, Content-Type'
        }
      });
      
      const corsHeaders = response.headers;
      const allowedOrigin = corsHeaders['access-control-allow-origin'];
      
      if (allowedOrigin === '*') {
        log('❌ FAIL: CORS allows wildcard origin', 'red');
        return false;
      } else if (allowedOrigin === 'https://starterpackapp.com') {
        log('✓ PASS: CORS properly configured', 'green');
      } else {
        log(`⚠ WARNING: Unexpected CORS origin: ${allowedOrigin}`, 'yellow');
      }
    } catch (error) {
      log(`❌ FAIL: CORS preflight failed: ${error.message}`, 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ FAIL: Unexpected error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n=== Security Fixes Test Suite ===\n', 'yellow');
  
  const tests = [
    {
      name: 'Config Endpoint',
      url: `${BASE_URL}/config`,
      requiresAuth: false
    },
    {
      name: 'Submit Analysis Endpoint',
      url: `${BASE_URL}/submit-analysis`,
      method: 'POST',
      data: {
        name: 'Test User',
        email: 'test@example.com',
        address: '123 Test St'
      },
      requiresAuth: false // Optional auth
    },
    {
      name: 'Analyze Property Endpoint',
      url: `${BASE_URL}/analyze-property`,
      method: 'POST',
      data: {
        propertyAddress: '123 Test St',
        propertyData: {
          price: 500000,
          bedrooms: 3,
          bathrooms: 2
        }
      },
      requiresAuth: true
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test);
    if (result) passed++;
    else failed++;
  }
  
  console.log('\n=== Test Summary ===');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed > 0) {
    log('\n❌ Some tests failed. Please review the security implementation.', 'red');
    process.exit(1);
  } else {
    log('\n✓ All security tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  log(`\nTest suite error: ${error.message}`, 'red');
  process.exit(1);
});