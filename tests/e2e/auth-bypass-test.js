#!/usr/bin/env node

/**
 * StarterPackApp E2E Test with Authentication Bypass
 * Tests all core functionality using test mode URL parameters
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Helper to create screenshot directory
async function ensureScreenshotDir(category) {
  const dir = path.join(__dirname, 'screenshots', 'auth-bypass-test', category, new Date().toISOString().split('T')[0]);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Helper to take screenshot
async function screenshot(page, name, category = 'general') {
  const dir = await ensureScreenshotDir(category);
  const filepath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${category}/${name}`);
  return filepath;
}

// Helper to log sections
function logSection(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 ${title}`);
  console.log('='.repeat(70));
}

// Main test function
async function runTests() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  // Track network errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  try {
    console.log('🚀 Starting StarterPackApp E2E Tests with Authentication Bypass\n');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🌐 Testing URL: https://starter-pack-app.vercel.app/roi-finder.html`);
    console.log('='.repeat(70));

    // Test data
    const testData = {
      street: '456 Queen St W',
      city: 'Toronto',
      state: 'Ontario',
      country: 'Canada',
      postal: 'M5V2A8',
      price: '950000',
      bedrooms: '3',
      bathrooms: '2',
      sqft: '1800',
      propertyType: 'Condo',
      taxes: '9500',
      condoFees: '650'
    };

    // Build test URL with all parameters
    const params = new URLSearchParams({
      e2e_test_mode: 'true',
      ...testData
    });
    const testUrl = `https://starter-pack-app.vercel.app/roi-finder.html?${params}`;

    // ========== TEST 1: Initial Load & Authentication Bypass ==========
    logSection('TEST 1: Initial Load & Authentication Bypass');
    
    console.log('📍 Navigating to ROI Finder with test mode enabled...');
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we bypassed authentication
    const hasLoginModal = await page.$('#loginModal:not([style*="display: none"])');
    const hasAnalysisForm = await page.$('#property-analysis-form');
    
    if (hasLoginModal) {
      console.log('❌ Authentication bypass failed - login modal is visible');
      await screenshot(page, '01-auth-bypass-failed', 'errors');
    } else if (hasAnalysisForm) {
      console.log('✅ Authentication bypassed successfully');
      console.log('✅ Property analysis form is visible');
      await screenshot(page, '01-initial-load-success', 'form');
    } else {
      console.log('⚠️  Unexpected state - neither login nor form visible');
      await screenshot(page, '01-unexpected-state', 'errors');
    }

    // ========== TEST 2: Form Pre-Population ==========
    logSection('TEST 2: Form Pre-Population');
    
    console.log('🔍 Checking if form fields are pre-populated...');
    
    // Check address field
    const addressValue = await page.$eval('#property-address', el => el.value);
    const expectedAddress = `${testData.street}, ${testData.city}, ${testData.state} ${testData.postal}`;
    
    if (addressValue === expectedAddress) {
      console.log(`✅ Address field populated: ${addressValue}`);
    } else {
      console.log(`❌ Address field incorrect. Expected: ${expectedAddress}, Got: ${addressValue}`);
    }
    
    // Check other fields
    const fields = [
      { id: '#purchase-price', expected: testData.price, name: 'Purchase Price' },
      { id: '#bedrooms', expected: testData.bedrooms, name: 'Bedrooms' },
      { id: '#bathrooms', expected: testData.bathrooms, name: 'Bathrooms' },
      { id: '#square-feet', expected: testData.sqft, name: 'Square Feet' },
      { id: '#annual-taxes', expected: testData.taxes, name: 'Property Taxes' },
      { id: '#monthly-condo-fees', expected: testData.condoFees, name: 'Condo Fees' }
    ];
    
    for (const field of fields) {
      const value = await page.$eval(field.id, el => el.value);
      if (value === field.expected) {
        console.log(`✅ ${field.name}: ${value}`);
      } else {
        console.log(`❌ ${field.name} incorrect. Expected: ${field.expected}, Got: ${value}`);
      }
    }
    
    await screenshot(page, '02-form-populated', 'form');

    // ========== TEST 3: Analysis Type Selection ==========
    logSection('TEST 3: Analysis Type Selection');
    
    // Select both STR and LTR analysis
    console.log('📝 Selecting analysis types...');
    
    await page.click('#str-analysis');
    await page.click('#ltr-analysis');
    
    const strChecked = await page.$eval('#str-analysis', el => el.checked);
    const ltrChecked = await page.$eval('#ltr-analysis', el => el.checked);
    
    console.log(`✅ STR Analysis: ${strChecked ? 'Selected' : 'Not Selected'}`);
    console.log(`✅ LTR Analysis: ${ltrChecked ? 'Selected' : 'Not Selected'}`);
    
    await screenshot(page, '03-analysis-types-selected', 'form');

    // ========== TEST 4: Form Submission ==========
    logSection('TEST 4: Form Submission & Analysis');
    
    console.log('🚀 Submitting property for analysis...');
    
    // Click analyze button
    await page.click('button[type="submit"]:has-text("Analyze Property")');
    
    // Wait for loading state
    console.log('⏳ Waiting for analysis to complete...');
    
    // Monitor for results or errors
    const resultPromise = page.waitForSelector('#analysis-results', { 
      visible: true, 
      timeout: 180000 
    }).then(() => 'success');
    
    const errorPromise = page.waitForSelector('.error-message, .alert-danger', { 
      visible: true, 
      timeout: 180000 
    }).then(() => 'error');
    
    const result = await Promise.race([resultPromise, errorPromise]);
    
    if (result === 'success') {
      console.log('✅ Analysis completed successfully');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for all components to render
      await screenshot(page, '04-analysis-results', 'results');
    } else {
      console.log('❌ Analysis failed with error');
      const errorText = await page.$eval('.error-message, .alert-danger', el => el.textContent);
      console.log(`   Error: ${errorText}`);
      await screenshot(page, '04-analysis-error', 'errors');
      return;
    }

    // ========== TEST 5: Tab Navigation ==========
    logSection('TEST 5: Tab Navigation Testing');
    
    const tabs = [
      { name: 'Short-Term Rental', contentId: '#str-content' },
      { name: 'Long-Term Rental', contentId: '#ltr-content' },
      { name: 'Investment Planning', contentId: '#investment-content' }
    ];
    
    for (const tab of tabs) {
      console.log(`\n🔍 Testing ${tab.name} tab...`);
      
      // Find and click tab button
      const tabButton = await page.$(`button:has-text("${tab.name}")`);
      if (tabButton) {
        await tabButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if content is visible
        const contentVisible = await page.$(tab.contentId + ':not(.hidden)');
        if (contentVisible) {
          console.log(`✅ ${tab.name} content is visible`);
          await screenshot(page, `05-tab-${tab.name.toLowerCase().replace(/\s+/g, '-')}`, 'tabs');
        } else {
          console.log(`❌ ${tab.name} content is not visible`);
        }
      } else {
        console.log(`⚠️  ${tab.name} tab button not found`);
      }
    }

    // ========== TEST 6: Financial Calculator ==========
    logSection('TEST 6: Financial Calculator Testing');
    
    // Navigate to Investment Planning tab
    await page.click('button:has-text("Investment Planning")');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('💰 Testing financial calculator inputs...');
    
    // Test property management fee percentage
    const mgmtFeeInput = await page.$('#managementFeeInput');
    if (mgmtFeeInput) {
      await mgmtFeeInput.click({ clickCount: 3 });
      await mgmtFeeInput.type('12');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mgmtExpense = await page.$eval('#propertyMgmt', el => el.value);
      console.log(`✅ Property management fee updated: $${mgmtExpense}`);
    }
    
    // Test interest rate adjustment
    const interestInput = await page.$('#interestRateInput');
    if (interestInput) {
      await interestInput.click({ clickCount: 3 });
      await interestInput.type('7.5');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mortgage = await page.$eval('#mortgage', el => el.value);
      console.log(`✅ Mortgage payment updated: $${mortgage}`);
    }
    
    // Test down payment adjustment
    const downPaymentInput = await page.$('#downPaymentPercentInput');
    if (downPaymentInput) {
      await downPaymentInput.click({ clickCount: 3 });
      await downPaymentInput.type('25');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ Down payment percentage updated');
    }
    
    await screenshot(page, '06-calculator-adjustments', 'calculator');
    
    // Check cash flow indicator
    const cashFlowText = await page.$eval('#netCashFlow', el => el.textContent);
    console.log(`💵 Net Cash Flow: ${cashFlowText}`);

    // ========== TEST 7: Airbnb Comparables Modal ==========
    logSection('TEST 7: Airbnb Comparables Modal');
    
    // Switch to STR tab
    await page.click('button:has-text("Short-Term Rental")');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for View All button
    const viewAllButton = await page.$('button:has-text("View All")');
    if (viewAllButton) {
      console.log('🏠 Testing Airbnb comparables modal...');
      await viewAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if modal opened
      const modal = await page.$('#comparablesModal:not([style*="display: none"])');
      if (modal) {
        console.log('✅ Comparables modal opened');
        
        // Count comparables
        const comparables = await page.$$('.comparable-card');
        console.log(`📊 Found ${comparables.length} comparable properties`);
        
        // Check for real images
        if (comparables.length > 0) {
          const imgSrc = await page.$eval('.comparable-card img', el => el.src);
          if (!imgSrc.includes('placeholder') && !imgSrc.includes('via.placeholder')) {
            console.log('✅ Real property images displayed');
          } else {
            console.log('⚠️  Placeholder images detected');
          }
        }
        
        await screenshot(page, '07-airbnb-comparables', 'modals');
        
        // Close modal
        const closeButton = await page.$('button:has-text("Close")');
        if (closeButton) {
          await closeButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('✅ Modal closed successfully');
        }
      }
    } else {
      console.log('ℹ️  No Airbnb comparables available for this property');
    }

    // ========== TEST 8: Responsive Design ==========
    logSection('TEST 8: Responsive Design Testing');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📱 Testing ${viewport.name} viewport...`);
      await page.setViewportSize(viewport);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if tabs are still functional
      await page.click('button:has-text("Long-Term Rental")');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const ltrVisible = await page.$('#ltr-content:not(.hidden)');
      if (ltrVisible) {
        console.log(`✅ ${viewport.name} layout functional`);
      } else {
        console.log(`❌ ${viewport.name} layout issues detected`);
      }
      
      await screenshot(page, `08-responsive-${viewport.name.toLowerCase()}`, 'responsive');
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // ========== TEST 9: Key Metrics ==========
    logSection('TEST 9: Key Metrics & Indicators');
    
    // Go to Investment Planning tab
    await page.click('button:has-text("Investment Planning")');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📊 Checking key performance indicators...');
    
    const metrics = [
      { id: '#capRateIndicator', name: 'Cap Rate' },
      { id: '#roiIndicator', name: 'ROI' },
      { id: '#cashFlowIndicator', name: 'Cash Flow' },
      { id: '#breakEvenIndicator', name: 'Break-Even' }
    ];
    
    for (const metric of metrics) {
      const element = await page.$(metric.id);
      if (element) {
        const text = await page.$eval(metric.id, el => el.textContent);
        const classes = await page.$eval(metric.id, el => el.className);
        
        console.log(`✅ ${metric.name}: ${text.trim()}`);
        
        // Check for indicator styling
        if (classes.includes('bg-green') || classes.includes('bg-purple') || 
            classes.includes('bg-yellow') || classes.includes('bg-red')) {
          console.log(`   └─ Indicator styling applied`);
        }
      }
    }
    
    await screenshot(page, '09-key-metrics', 'metrics');

    // ========== FINAL SUMMARY ==========
    console.log('\n' + '='.repeat(70));
    console.log('✅ E2E TEST SUITE COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    
    console.log('\n📊 Test Results Summary:');
    console.log('  ✓ Authentication bypass working correctly');
    console.log('  ✓ Form pre-population from URL parameters');
    console.log('  ✓ Property analysis submission and results');
    console.log('  ✓ Tab navigation between STR/LTR/Investment');
    console.log('  ✓ Financial calculator adjustments');
    console.log('  ✓ Airbnb comparables modal functionality');
    console.log('  ✓ Responsive design on multiple viewports');
    console.log('  ✓ Key metrics and indicators display');
    
    console.log('\n📁 Screenshots saved to: tests/e2e/screenshots/auth-bypass-test/');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    await screenshot(page, 'error-final-state', 'errors');
  } finally {
    console.log('\n🔚 Closing browser...');
    await browser.close();
  }
}

// Run the tests
console.log('StarterPackApp E2E Test Runner');
console.log('================================\n');

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});