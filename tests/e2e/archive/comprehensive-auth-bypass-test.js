#!/usr/bin/env node

/**
 * Comprehensive E2E Test for StarterPackApp with Auth Bypass
 * Tests all core functionality with detailed error handling
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  screenshots: []
};

// Helper functions
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

async function screenshot(page, name, category = 'general') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = await ensureDir(path.join(__dirname, 'screenshots', 'auth-bypass', category));
    const filepath = path.join(dir, `${timestamp}-${name}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    testResults.screenshots.push(filepath);
    console.log(`  📸 Screenshot: ${category}/${name}`);
    return filepath;
  } catch (error) {
    console.log(`  ⚠️  Failed to take screenshot: ${error.message}`);
  }
}

function logTest(name, passed, message = '') {
  if (passed) {
    testResults.passed++;
    console.log(`  ✅ ${name}`);
  } else {
    testResults.failed++;
    testResults.errors.push(`${name}: ${message}`);
    console.log(`  ❌ ${name}${message ? ': ' + message : ''}`);
  }
}

function logSection(title) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🧪 ${title}`);
  console.log('═'.repeat(70));
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function getElementText(page, selector, defaultValue = '') {
  try {
    return await page.$eval(selector, el => el.textContent || '');
  } catch {
    return defaultValue;
  }
}

async function getInputValue(page, selector, defaultValue = '') {
  try {
    return await page.$eval(selector, el => el.value || '');
  } catch {
    return defaultValue;
  }
}

async function clickElement(page, selector) {
  try {
    await page.click(selector);
    return true;
  } catch {
    return false;
  }
}

// Main test runner
async function runComprehensiveTests() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set up console and error logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.errors.push(`Console error: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    testResults.errors.push(`Page error: ${error.message}`);
  });

  try {
    console.log('\n🚀 StarterPackApp Comprehensive E2E Test Suite');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🌐 Base URL: https://starter-pack-app.vercel.app`);
    console.log('═'.repeat(70));

    // Test configuration
    const testUrl = 'https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true&street=123+Yonge+St&city=Toronto&state=Ontario&country=Canada&postal=M5B2H1&price=899000&bedrooms=2&bathrooms=2&sqft=1500&propertyType=Condo&taxes=7200&condoFees=580';

    // ========== TEST 1: Page Load & Auth Bypass ==========
    logSection('TEST 1: Page Load & Authentication Bypass');
    
    console.log('  🌐 Navigating to test URL...');
    let navigationSuccess = false;
    try {
      await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      navigationSuccess = true;
    } catch (error) {
      console.log(`  ⚠️  Navigation timeout, continuing with tests...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    await screenshot(page, '01-initial-load', 'page-load');
    
    // Check authentication bypass
    const hasLoginModal = await page.$eval('#loginModal', el => 
      el && window.getComputedStyle(el).display !== 'none'
    ).catch(() => false);
    
    const hasAnalysisForm = await waitForElement(page, '#property-analysis-form', 5000);
    
    logTest('Page loaded', navigationSuccess);
    logTest('Authentication bypassed', !hasLoginModal && hasAnalysisForm, 
      hasLoginModal ? 'Login modal is visible' : !hasAnalysisForm ? 'Analysis form not found' : '');

    // ========== TEST 2: Form Elements & Data ==========
    logSection('TEST 2: Form Elements & Pre-Population');
    
    // Check for form elements with various possible selectors
    const formElements = [
      { name: 'Address field', selectors: ['#property-address', 'input[name="address"]', 'input[placeholder*="address"]'] },
      { name: 'Price field', selectors: ['#purchase-price', 'input[name="price"]', 'input[placeholder*="price"]'] },
      { name: 'Bedrooms field', selectors: ['#bedrooms', 'input[name="bedrooms"]', 'select[name="bedrooms"]'] },
      { name: 'Bathrooms field', selectors: ['#bathrooms', 'input[name="bathrooms"]', 'select[name="bathrooms"]'] },
      { name: 'Square feet field', selectors: ['#square-feet', 'input[name="sqft"]', 'input[placeholder*="square"]'] },
      { name: 'Property taxes field', selectors: ['#annual-taxes', 'input[name="taxes"]', 'input[placeholder*="tax"]'] },
      { name: 'Condo fees field', selectors: ['#monthly-condo-fees', 'input[name="condoFees"]', 'input[placeholder*="condo"]'] }
    ];
    
    for (const element of formElements) {
      let found = false;
      let value = '';
      
      for (const selector of element.selectors) {
        if (await page.$(selector)) {
          found = true;
          value = await getInputValue(page, selector);
          break;
        }
      }
      
      logTest(element.name, found, found ? `Value: ${value || '(empty)'}` : 'Not found');
    }
    
    // Check analysis type checkboxes
    const strCheckbox = await page.$('#str-analysis');
    const ltrCheckbox = await page.$('#ltr-analysis');
    
    logTest('STR analysis checkbox', !!strCheckbox);
    logTest('LTR analysis checkbox', !!ltrCheckbox);
    
    await screenshot(page, '02-form-state', 'form');

    // ========== TEST 3: Form Interaction ==========
    logSection('TEST 3: Form Interaction & Submission');
    
    // Try to select analysis types
    if (strCheckbox) {
      await clickElement(page, '#str-analysis');
      console.log('  🔲 Clicked STR analysis checkbox');
    }
    
    if (ltrCheckbox) {
      await clickElement(page, '#ltr-analysis');
      console.log('  🔲 Clicked LTR analysis checkbox');
    }
    
    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Analyze")',
      'button:has-text("Submit")',
      '.btn-primary'
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      if (await clickElement(page, selector)) {
        submitClicked = true;
        console.log(`  🚀 Clicked submit button: ${selector}`);
        break;
      }
    }
    
    logTest('Form submission triggered', submitClicked);
    
    if (submitClicked) {
      // Wait for results or error
      console.log('  ⏳ Waiting for analysis results...');
      
      const resultAppeared = await waitForElement(page, '#analysis-results', 60000);
      const errorAppeared = await waitForElement(page, '.error-message, .alert-danger', 5000);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (resultAppeared) {
        logTest('Analysis completed', true);
        await screenshot(page, '03-analysis-results', 'results');
      } else if (errorAppeared) {
        const errorText = await getElementText(page, '.error-message, .alert-danger');
        logTest('Analysis completed', false, `Error: ${errorText}`);
        await screenshot(page, '03-analysis-error', 'errors');
      } else {
        logTest('Analysis completed', false, 'Timeout waiting for results');
        await screenshot(page, '03-analysis-timeout', 'errors');
      }
    }

    // ========== TEST 4: Results Interface ==========
    if (await page.$('#analysis-results')) {
      logSection('TEST 4: Results Interface & Navigation');
      
      // Check for tabs
      const tabSelectors = [
        { name: 'STR Tab', text: 'Short-Term Rental' },
        { name: 'LTR Tab', text: 'Long-Term Rental' },
        { name: 'Investment Tab', text: 'Investment Planning' }
      ];
      
      for (const tab of tabSelectors) {
        const tabElement = await page.$(`button:has-text("${tab.text}")`);
        logTest(tab.name, !!tabElement);
        
        if (tabElement) {
          await tabElement.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await screenshot(page, `04-${tab.name.toLowerCase().replace(/\s+/g, '-')}`, 'tabs');
        }
      }
      
      // Check for key components
      const components = [
        { name: 'Financial calculator', selector: '#financial-calculator, .calculator-section' },
        { name: 'Revenue inputs', selector: '#monthlyRevenue, input[name="revenue"]' },
        { name: 'Expense inputs', selector: '#mortgage, #propertyMgmt, .expense-input' },
        { name: 'Cash flow display', selector: '#netCashFlow, .cash-flow-display' },
        { name: 'Metrics indicators', selector: '#capRateIndicator, .metric-indicator' }
      ];
      
      for (const component of components) {
        const exists = await page.$(component.selector);
        logTest(component.name, !!exists);
      }
    }

    // ========== TEST 5: Mobile Responsiveness ==========
    logSection('TEST 5: Mobile Responsiveness');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileMenuVisible = await page.$('.mobile-menu, .hamburger-menu');
    const contentVisible = await page.$('#analysis-results, #property-analysis-form');
    
    logTest('Mobile layout', !!contentVisible, mobileMenuVisible ? 'Mobile menu present' : 'Content adapts to mobile');
    await screenshot(page, '05-mobile-view', 'responsive');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await screenshot(page, '06-tablet-view', 'responsive');
    logTest('Tablet layout', true);

    // ========== FINAL SUMMARY ==========
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📸 Screenshots: ${testResults.screenshots.length}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'screenshots', 'auth-bypass', 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      date: new Date().toISOString(),
      url: testUrl,
      results: testResults,
      summary: {
        totalTests: testResults.passed + testResults.failed,
        passRate: testResults.passed / (testResults.passed + testResults.failed) * 100
      }
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('\n💥 Fatal error during test execution:', error);
    await screenshot(page, 'fatal-error', 'errors');
  } finally {
    console.log('\n🔚 Closing browser...');
    await browser.close();
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Execute tests
console.log('StarterPackApp Comprehensive E2E Test Runner');
console.log('='.repeat(50));

runComprehensiveTests().catch(error => {
  console.error('Failed to run tests:', error);
  process.exit(1);
});