const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'security-test', new Date().toISOString().split('T')[0]);
const VIEWPORT_CONFIGS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 }
};

// Test data
const TEST_PROPERTY = {
  address: '123 Test Street, Toronto, ON',
  price: '750000',
  propertyTax: '6500',
  condoFees: '450',
  downPayment: '20',
  interestRate: '5.5',
  bedrooms: '3',
  bathrooms: '2',
  squareFeet: '1500'
};

// Utility functions
async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }
}

async function takeScreenshot(page, name, viewport = 'desktop') {
  const filename = `${viewport}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

async function waitForElement(page, selector, timeout = 30000) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    return true;
  } catch (error) {
    console.error(`Element not found: ${selector}`);
    return false;
  }
}

async function getConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  return errors;
}

// Test functions
async function testInitialPageLoad(browser, viewport = 'desktop') {
  console.log(`\n🧪 Testing Initial Page Load (${viewport})...`);
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIGS[viewport]);
  
  const errors = [];
  const consoleErrors = getConsoleErrors(page);
  
  try {
    // Navigate to the page
    const response = await page.goto(`${BASE_URL}/roi-finder.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Check response status
    if (response.status() !== 200) {
      errors.push(`Page returned status ${response.status()}`);
    }
    
    // Take initial screenshot
    await takeScreenshot(page, '01-initial-load', viewport);
    
    // Check for critical elements
    const criticalElements = [
      '#property-form',
      '#addressInput',
      '#analyzeButton',
      '.hero-section'
    ];
    
    for (const selector of criticalElements) {
      const exists = await waitForElement(page, selector, 5000);
      if (!exists) {
        errors.push(`Critical element missing: ${selector}`);
      }
    }
    
    // Check if JavaScript loaded properly
    const jsLoaded = await page.evaluate(() => {
      return typeof window.FinancialCalculator !== 'undefined';
    });
    
    if (!jsLoaded) {
      errors.push('JavaScript modules not loaded properly');
    }
    
    await page.close();
    return { success: errors.length === 0, errors, viewport };
    
  } catch (error) {
    errors.push(`Page load error: ${error.message}`);
    await takeScreenshot(page, 'error-page-load', viewport);
    await page.close();
    return { success: false, errors, viewport };
  }
}

async function testFormFunctionality(browser) {
  console.log('\n🧪 Testing Form Functionality...');
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIGS.desktop);
  
  const errors = [];
  
  try {
    await page.goto(`${BASE_URL}/roi-finder.html`, { waitUntil: 'networkidle2' });
    
    // Test form inputs
    await page.type('#addressInput', TEST_PROPERTY.address);
    await page.type('#purchasePrice', TEST_PROPERTY.price);
    await page.type('#propertyTax', TEST_PROPERTY.propertyTax);
    await page.type('#condoFees', TEST_PROPERTY.condoFees);
    
    await takeScreenshot(page, '02-form-filled');
    
    // Test validation - empty required fields
    await page.evaluate(() => {
      document.querySelector('#addressInput').value = '';
    });
    
    await page.click('#analyzeButton');
    await page.waitForTimeout(1000);
    
    // Check for validation message
    const validationVisible = await page.evaluate(() => {
      const alerts = document.querySelectorAll('.alert-danger');
      return alerts.length > 0;
    });
    
    if (!validationVisible) {
      errors.push('Form validation not working for empty fields');
    }
    
    await takeScreenshot(page, '03-validation-error');
    
    // Fill form properly
    await page.type('#addressInput', TEST_PROPERTY.address);
    await takeScreenshot(page, '04-form-complete');
    
    await page.close();
    return { success: errors.length === 0, errors };
    
  } catch (error) {
    errors.push(`Form functionality error: ${error.message}`);
    await takeScreenshot(page, 'error-form-test');
    await page.close();
    return { success: false, errors };
  }
}

async function testAuthenticationFlow(browser) {
  console.log('\n🧪 Testing Authentication Flow...');
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIGS.desktop);
  
  const errors = [];
  
  try {
    await page.goto(`${BASE_URL}/roi-finder.html`, { waitUntil: 'networkidle2' });
    
    // Fill form as guest
    await page.type('#addressInput', TEST_PROPERTY.address);
    await page.type('#purchasePrice', TEST_PROPERTY.price);
    await page.type('#propertyTax', TEST_PROPERTY.propertyTax);
    
    // Click analyze button
    await page.click('#analyzeButton');
    await page.waitForTimeout(2000);
    
    // Check if auth modal appears
    const authModalVisible = await page.evaluate(() => {
      const modal = document.querySelector('#authModal');
      return modal && modal.classList.contains('show');
    });
    
    if (!authModalVisible) {
      errors.push('Authentication modal not shown for guest user');
    }
    
    await takeScreenshot(page, '05-auth-modal');
    
    // Test guest continue
    const guestButton = await page.$('#guestContinue');
    if (guestButton) {
      await guestButton.click();
      await page.waitForTimeout(2000);
      
      // Check if modal closed
      const modalClosed = await page.evaluate(() => {
        const modal = document.querySelector('#authModal');
        return !modal || !modal.classList.contains('show');
      });
      
      if (!modalClosed) {
        errors.push('Auth modal did not close after guest continue');
      }
    } else {
      errors.push('Guest continue button not found');
    }
    
    await takeScreenshot(page, '06-after-guest-auth');
    
    await page.close();
    return { success: errors.length === 0, errors };
    
  } catch (error) {
    errors.push(`Authentication flow error: ${error.message}`);
    await takeScreenshot(page, 'error-auth-test');
    await page.close();
    return { success: false, errors };
  }
}

async function testAPIIntegration(browser) {
  console.log('\n🧪 Testing API Integration...');
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIGS.desktop);
  
  const errors = [];
  let apiCalls = [];
  
  try {
    // Intercept network requests
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('/railway-api/')) {
        apiCalls.push({
          url,
          method: request.method(),
          headers: request.headers()
        });
      }
      request.continue();
    });
    
    // Monitor responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('/railway-api/')) {
        if (response.status() >= 400) {
          errors.push(`API error: ${url} returned ${response.status()}`);
        }
      }
    });
    
    await page.goto(`${BASE_URL}/roi-finder.html`, { waitUntil: 'networkidle2' });
    
    // Fill form with test mode
    await page.goto(`${BASE_URL}/roi-finder.html?test=true&address=${encodeURIComponent(TEST_PROPERTY.address)}&price=${TEST_PROPERTY.price}&propertyTax=${TEST_PROPERTY.propertyTax}&downPayment=${TEST_PROPERTY.downPayment}`, { waitUntil: 'networkidle2' });
    
    await takeScreenshot(page, '07-prefilled-form');
    
    // Click analyze
    await page.click('#analyzeButton');
    
    // Wait for API call
    await page.waitForTimeout(5000);
    
    // Check if any API calls were made
    const analyzeAPICalled = apiCalls.some(call => 
      call.url.includes('analyze-property')
    );
    
    if (!analyzeAPICalled) {
      errors.push('analyze-property API was not called');
    }
    
    // Check CORS headers
    const corsIssues = apiCalls.filter(call => {
      const corsHeader = call.headers['access-control-allow-origin'];
      return !corsHeader || corsHeader === '';
    });
    
    if (corsIssues.length > 0) {
      errors.push(`CORS headers missing on ${corsIssues.length} API calls`);
    }
    
    await takeScreenshot(page, '08-api-response');
    
    await page.close();
    return { success: errors.length === 0, errors, apiCalls };
    
  } catch (error) {
    errors.push(`API integration error: ${error.message}`);
    await takeScreenshot(page, 'error-api-test');
    await page.close();
    return { success: false, errors };
  }
}

async function testResultsDisplay(browser) {
  console.log('\n🧪 Testing Results Display...');
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIGS.desktop);
  
  const errors = [];
  
  try {
    // Use test mode for faster results
    await page.goto(`${BASE_URL}/roi-finder.html?test=true&mockResults=true`, { waitUntil: 'networkidle2' });
    
    // Fill and submit form
    await page.type('#addressInput', TEST_PROPERTY.address);
    await page.type('#purchasePrice', TEST_PROPERTY.price);
    await page.type('#propertyTax', TEST_PROPERTY.propertyTax);
    
    await page.click('#analyzeButton');
    
    // Wait for results
    const resultsAppeared = await waitForElement(page, '#results-section', 10000);
    
    if (!resultsAppeared) {
      errors.push('Results section did not appear');
    } else {
      // Check for key result elements
      const resultElements = [
        '.monthly-costs',
        '.rental-analysis',
        '.investment-metrics'
      ];
      
      for (const selector of resultElements) {
        const exists = await page.$(selector);
        if (!exists) {
          errors.push(`Result element missing: ${selector}`);
        }
      }
    }
    
    await takeScreenshot(page, '09-results-display');
    
    // Check for proper data formatting
    const hasNumbers = await page.evaluate(() => {
      const text = document.querySelector('#results-section')?.textContent || '';
      return /\$[\d,]+/.test(text); // Check for currency formatting
    });
    
    if (!hasNumbers) {
      errors.push('Results do not contain properly formatted numbers');
    }
    
    await page.close();
    return { success: errors.length === 0, errors };
    
  } catch (error) {
    errors.push(`Results display error: ${error.message}`);
    await takeScreenshot(page, 'error-results-test');
    await page.close();
    return { success: false, errors };
  }
}

async function testMobileResponsiveness(browser) {
  console.log('\n🧪 Testing Mobile Responsiveness...');
  const results = [];
  
  for (const [device, viewport] of Object.entries(VIEWPORT_CONFIGS)) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    
    const errors = [];
    
    try {
      await page.goto(`${BASE_URL}/roi-finder.html`, { waitUntil: 'networkidle2' });
      
      // Check if content fits viewport
      const overflow = await page.evaluate(() => {
        const body = document.body;
        return body.scrollWidth > window.innerWidth;
      });
      
      if (overflow) {
        errors.push(`Horizontal overflow detected on ${device}`);
      }
      
      // Check if form is usable
      const formUsable = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        return Array.from(inputs).every(input => {
          const rect = input.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44; // Minimum touch target
        });
      });
      
      if (!formUsable) {
        errors.push(`Form inputs too small for touch on ${device}`);
      }
      
      await takeScreenshot(page, `10-responsive`, device);
      
      // Test navigation menu on mobile
      if (device === 'mobile') {
        const hamburger = await page.$('.mobile-menu-toggle');
        if (hamburger) {
          await hamburger.click();
          await page.waitForTimeout(500);
          await takeScreenshot(page, '11-mobile-menu', device);
        }
      }
      
      results.push({
        device,
        viewport,
        success: errors.length === 0,
        errors
      });
      
      await page.close();
      
    } catch (error) {
      errors.push(`${device} test error: ${error.message}`);
      results.push({
        device,
        viewport,
        success: false,
        errors
      });
      await page.close();
    }
  }
  
  return results;
}

async function testErrorHandling(browser) {
  console.log('\n🧪 Testing Error Handling...');
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIGS.desktop);
  
  const errors = [];
  
  try {
    await page.goto(`${BASE_URL}/roi-finder.html`, { waitUntil: 'networkidle2' });
    
    // Test invalid input
    await page.type('#addressInput', TEST_PROPERTY.address);
    await page.type('#purchasePrice', 'invalid-number');
    
    await page.click('#analyzeButton');
    await page.waitForTimeout(2000);
    
    // Check for error message
    const errorShown = await page.evaluate(() => {
      const alerts = document.querySelectorAll('.alert-danger');
      return alerts.length > 0;
    });
    
    if (!errorShown) {
      errors.push('No error shown for invalid input');
    }
    
    await takeScreenshot(page, '12-error-invalid-input');
    
    // Test network error handling
    await page.setOfflineMode(true);
    await page.type('#purchasePrice', TEST_PROPERTY.price);
    await page.click('#analyzeButton');
    await page.waitForTimeout(2000);
    
    const networkErrorShown = await page.evaluate(() => {
      const alerts = document.querySelectorAll('.alert');
      return Array.from(alerts).some(alert => 
        alert.textContent.toLowerCase().includes('network') ||
        alert.textContent.toLowerCase().includes('connection')
      );
    });
    
    if (!networkErrorShown) {
      errors.push('No error shown for network failure');
    }
    
    await takeScreenshot(page, '13-error-network');
    
    await page.close();
    return { success: errors.length === 0, errors };
    
  } catch (error) {
    errors.push(`Error handling test failed: ${error.message}`);
    await takeScreenshot(page, 'error-error-handling-test');
    await page.close();
    return { success: false, errors };
  }
}

async function testSecurity(browser) {
  console.log('\n🧪 Testing Security Features...');
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT_CONFIGS.desktop);
  
  const errors = [];
  const securityHeaders = {};
  
  try {
    // Intercept responses to check headers
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('/railway-api/')) {
        const headers = response.headers();
        securityHeaders[url] = headers;
        
        // Check CORS headers
        if (!headers['access-control-allow-origin']) {
          errors.push(`Missing CORS header on ${url}`);
        }
        
        // Check security headers
        const requiredHeaders = [
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection'
        ];
        
        for (const header of requiredHeaders) {
          if (!headers[header]) {
            console.warn(`Missing security header ${header} on ${url}`);
          }
        }
      }
    });
    
    await page.goto(`${BASE_URL}/roi-finder.html`, { waitUntil: 'networkidle2' });
    
    // Test XSS prevention
    const xssPayload = '<script>alert("XSS")</script>';
    await page.type('#addressInput', xssPayload);
    await page.type('#purchasePrice', TEST_PROPERTY.price);
    
    await takeScreenshot(page, '14-xss-test-input');
    
    // Check if script was sanitized
    const addressValue = await page.$eval('#addressInput', el => el.value);
    if (addressValue !== xssPayload) {
      console.log('✅ XSS payload was sanitized');
    }
    
    // Test authentication bypass attempt
    await page.evaluate(() => {
      // Try to bypass auth by setting localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', 'hacker@test.com');
    });
    
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Try to submit form
    await page.type('#addressInput', TEST_PROPERTY.address);
    await page.type('#purchasePrice', TEST_PROPERTY.price);
    await page.click('#analyzeButton');
    
    await page.waitForTimeout(3000);
    
    // Check if auth was properly validated
    const authModalShown = await page.evaluate(() => {
      const modal = document.querySelector('#authModal');
      return modal && modal.classList.contains('show');
    });
    
    if (!authModalShown) {
      errors.push('Authentication bypass possible - no auth modal shown');
    }
    
    await takeScreenshot(page, '15-auth-bypass-attempt');
    
    await page.close();
    return { success: errors.length === 0, errors, securityHeaders };
    
  } catch (error) {
    errors.push(`Security test error: ${error.message}`);
    await takeScreenshot(page, 'error-security-test');
    await page.close();
    return { success: false, errors };
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Comprehensive Security E2E Tests...');
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}`);
  
  await ensureScreenshotDir();
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  try {
    // Run all tests
    testResults.tests.pageLoad = {
      desktop: await testInitialPageLoad(browser, 'desktop'),
      mobile: await testInitialPageLoad(browser, 'mobile')
    };
    
    testResults.tests.formFunctionality = await testFormFunctionality(browser);
    testResults.tests.authentication = await testAuthenticationFlow(browser);
    testResults.tests.apiIntegration = await testAPIIntegration(browser);
    testResults.tests.resultsDisplay = await testResultsDisplay(browser);
    testResults.tests.mobileResponsiveness = await testMobileResponsiveness(browser);
    testResults.tests.errorHandling = await testErrorHandling(browser);
    testResults.tests.security = await testSecurity(browser);
    
  } catch (error) {
    console.error('Test suite error:', error);
    testResults.criticalError = error.message;
  } finally {
    await browser.close();
  }
  
  // Generate summary
  const summary = generateTestSummary(testResults);
  console.log(summary);
  
  // Save detailed report
  const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📊 Detailed report saved to: ${reportPath}`);
  
  return testResults;
}

function generateTestSummary(results) {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const issues = [];
  
  // Count test results
  for (const [testName, testResult] of Object.entries(results.tests)) {
    if (Array.isArray(testResult)) {
      // Mobile responsiveness returns array
      testResult.forEach(result => {
        totalTests++;
        if (result.success) passedTests++;
        else {
          failedTests++;
          issues.push({ test: `${testName}-${result.device}`, errors: result.errors });
        }
      });
    } else if (testResult.desktop) {
      // Page load has multiple viewports
      Object.entries(testResult).forEach(([viewport, result]) => {
        totalTests++;
        if (result.success) passedTests++;
        else {
          failedTests++;
          issues.push({ test: `${testName}-${viewport}`, errors: result.errors });
        }
      });
    } else {
      totalTests++;
      if (testResult.success) passedTests++;
      else {
        failedTests++;
        issues.push({ test: testName, errors: testResult.errors });
      }
    }
  }
  
  const summary = `
════════════════════════════════════════════════════════════════════

📊 TEST SUMMARY - ${new Date().toISOString()}

Total Tests: ${totalTests}
✅ Passed: ${passedTests}
❌ Failed: ${failedTests}
Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%

${failedTests > 0 ? `
🚨 ISSUES FOUND:
${issues.map(issue => `
  Test: ${issue.test}
  ${issue.errors.map(e => `  - ${e}`).join('\n')}
`).join('\n')}
` : '✨ All tests passed successfully!'}

════════════════════════════════════════════════════════════════════
`;
  
  return summary;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };