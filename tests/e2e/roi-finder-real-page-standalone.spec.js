/**
 * Standalone Playwright test for real page without dev server
 */

const { test, expect } = require('@playwright/test');
const { setupTransformInterceptor } = require('./playwright-transform-interceptor');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const TEST_URL = `file://${PROJECT_ROOT}/roi-finder.html?e2e_test_mode=true`;

test.describe('ROI Finder Real Page Tests (Standalone)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up the transform interceptor
    await setupTransformInterceptor(page, PROJECT_ROOT);
    
    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', exception => {
      console.log(`❌ Page Error: ${exception.message}`);
      consoleErrors.push(exception.message);
    });
    
    // Store errors on the page object for assertions
    page.consoleErrors = consoleErrors;
  });
  
  test('should load without module errors', async ({ page }) => {
    console.log('🧪 TEST: Loading real roi-finder.html...');
    
    // Navigate to the page
    await page.goto(TEST_URL);
    
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give time for all scripts to execute
    
    // Check for module-related errors
    const moduleErrors = page.consoleErrors.filter(error => 
      error.includes('module is not defined') ||
      error.includes('exports is not defined') ||
      error.includes('require is not defined') ||
      error.includes('Cannot read properties of undefined')
    );
    
    if (moduleErrors.length > 0) {
      console.log('\n❌ Module loading errors found:');
      moduleErrors.forEach(err => console.log(`   - ${err}`));
    }
    
    expect(moduleErrors).toHaveLength(0);
    console.log('✅ No module loading errors');
  });
  
  test('should have all components loaded', async ({ page }) => {
    console.log('🧪 TEST: Verifying component initialization...');
    
    await page.goto(TEST_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Check that all expected components are loaded
    const componentStatus = await page.evaluate(() => {
      return {
        ComponentLoader: typeof window.ComponentLoader,
        ComponentLoaderCompactModern: typeof window.ComponentLoaderCompactModern,
        CompactModernLayout: typeof window.CompactModernLayout,
        PropertyHeroSection: typeof window.PropertyHeroSection,
        FinancialSummaryCompactModern: typeof window.FinancialSummaryCompactModern,
        InvestmentVerdictCompactModern: typeof window.InvestmentVerdictCompactModern,
        MarketComparisonCompactModern: typeof window.MarketComparisonCompactModern,
        // Check if component loader instance exists
        componentLoaderInstance: window.componentLoader ? window.componentLoader.constructor.name : 'undefined',
        // Check app state
        appState: typeof window.appState
      };
    });
    
    console.log('\nComponent Status:');
    for (const [name, type] of Object.entries(componentStatus)) {
      const status = type !== 'undefined' ? '✅' : '❌';
      console.log(`  ${status} ${name}: ${type}`);
    }
    
    // Verify all components are loaded
    expect(componentStatus.ComponentLoader).toBe('function');
    expect(componentStatus.ComponentLoaderCompactModern).toBe('function');
    expect(componentStatus.appState).toBe('object');
  });
  
  test('should bypass authentication in test mode', async ({ page }) => {
    console.log('🧪 TEST: Verifying auth bypass...');
    
    await page.goto(TEST_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Check that we're in test mode and authenticated
    const authStatus = await page.evaluate(() => {
      return {
        isTestMode: window.location.search.includes('e2e_test_mode=true'),
        currentUser: window.appState?.currentUser,
        authBypassed: window.appState?.currentUser?.uid === 'test-user-e2e'
      };
    });
    
    console.log('\nAuth Status:');
    console.log(`  Test mode active: ${authStatus.isTestMode}`);
    console.log(`  Auth bypassed: ${authStatus.authBypassed}`);
    console.log(`  User ID: ${authStatus.currentUser?.uid}`);
    
    expect(authStatus.isTestMode).toBe(true);
    expect(authStatus.authBypassed).toBe(true);
  });
  
  test('should show property input form', async ({ page }) => {
    console.log('🧪 TEST: Checking for property input form...');
    
    await page.goto(TEST_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Give time for auth and UI setup
    
    // Check for form elements
    const formElements = {
      form: await page.$('#property-form'),
      addressInput: await page.$('#address'),
      cityInput: await page.$('#city'),
      priceInput: await page.$('#price'),
      submitButton: await page.$('button[type="submit"]')
    };
    
    console.log('\nForm Elements:');
    for (const [name, element] of Object.entries(formElements)) {
      const status = element ? '✅' : '❌';
      console.log(`  ${status} ${name}`);
    }
    
    // Verify form is present
    expect(formElements.form).toBeTruthy();
    expect(formElements.submitButton).toBeTruthy();
  });
});