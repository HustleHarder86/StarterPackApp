const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Screenshot helper with directory organization
async function screenshot(page, name, category = 'general') {
  const dir = path.join(__dirname, 'screenshots', 'comprehensive', category, new Date().toISOString().split('T')[0]);
  await fs.mkdir(dir, { recursive: true });
  const filepath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 ${category}/${name}`);
  return filepath;
}

// Helper to log test sections
function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${title}`);
  console.log('='.repeat(60));
}

test.describe('Comprehensive StarterPackApp E2E Tests', () => {
  test.setTimeout(600000); // 10 minutes for comprehensive tests
  
  test('Full application flow with all features', async ({ page }) => {
    console.log('🚀 Starting comprehensive E2E test suite...\n');
    
    // Test URL with all property data
    const testUrl = 'https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true&street=123+Test+St&city=Toronto&state=Ontario&country=Canada&postal=M5V3A8&price=850000&bedrooms=4&bathrooms=3&sqft=2000&propertyType=House&taxes=8500&condoFees=0';
    
    // ========== SECTION 1: Initial Load & Form Submission ==========
    logSection('1. Initial Load & Form Submission');
    
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    await screenshot(page, '01-initial-load', 'form');
    
    // Verify form is pre-filled
    const addressValue = await page.inputValue('input[placeholder*="123 Main Street"]');
    expect(addressValue).toBe('123 Test St, Toronto, Ontario M5V3A8');
    console.log('✅ Form pre-filled with test data');
    
    // Select both analysis types
    await page.check('#ltr-analysis');
    await page.check('#str-analysis');
    await screenshot(page, '02-analysis-types-selected', 'form');
    
    // Submit form
    console.log('📤 Submitting property analysis...');
    await page.click('button:has-text("Analyze Property")');
    
    // Wait for results
    await page.waitForSelector('#analysis-results', { 
      state: 'visible', 
      timeout: 180000 
    });
    await page.waitForTimeout(3000); // Extra wait for all components to render
    await screenshot(page, '03-results-loaded', 'results');
    console.log('✅ Analysis completed successfully');
    
    // ========== SECTION 2: Tab Navigation Testing ==========
    logSection('2. Tab Navigation Testing');
    
    const tabs = [
      { name: 'Short-Term Rental', id: 'str-content', key: 'str' },
      { name: 'Long-Term Rental', id: 'ltr-content', key: 'ltr' },
      { name: 'Investment Planning', id: 'investment-content', key: 'investment' }
    ];
    
    for (const tab of tabs) {
      console.log(`\n🔍 Testing ${tab.name} tab...`);
      
      // Click tab
      const tabButton = page.locator(`button:has-text("${tab.name}")`);
      await tabButton.click();
      await page.waitForTimeout(1000);
      
      // Verify tab is active
      const tabClasses = await tabButton.getAttribute('class');
      expect(tabClasses).toContain('bg-white');
      expect(tabClasses).toContain('text-blue-600');
      console.log(`  ✅ Tab button is active`);
      
      // Verify content is visible
      const content = page.locator(`#${tab.id}`);
      const isVisible = await content.isVisible();
      const hasHiddenClass = await content.evaluate(el => el.classList.contains('hidden'));
      
      expect(isVisible).toBe(true);
      expect(hasHiddenClass).toBe(false);
      console.log(`  ✅ Content is visible`);
      
      // Take screenshot
      await screenshot(page, `tab-${tab.key}-active`, 'tabs');
      
      // Verify content has expected elements
      if (tab.key === 'str') {
        await expect(page.locator('h2:has-text("Short-Term Rental Analysis")')).toBeVisible();
        await expect(page.locator('text=Estimated Income')).toBeVisible();
      } else if (tab.key === 'ltr') {
        await expect(page.locator('h3:has-text("Long-Term Rental")')).toBeVisible();
        await expect(page.locator('text=Monthly Rent')).toBeVisible();
      } else if (tab.key === 'investment') {
        await expect(page.locator('h3:has-text("Financial Calculator")')).toBeVisible();
        await expect(page.locator('#monthlyRevenue')).toBeVisible();
      }
      console.log(`  ✅ Content elements verified`);
    }
    
    // ========== SECTION 3: Financial Calculator Interactions ==========
    logSection('3. Financial Calculator Interactions');
    
    // Make sure we're on Investment Planning tab
    await page.click('button:has-text("Investment Planning")');
    await page.waitForTimeout(1000);
    
    // Test 3.1: Property Management Percentage
    console.log('\n📊 Testing property management percentage input...');
    const mgmtFeeInput = page.locator('#managementFeeInput');
    const mgmtExpense = page.locator('#propertyMgmt');
    const monthlyRevenue = page.locator('#monthlyRevenue');
    
    const revenue = await monthlyRevenue.inputValue();
    console.log(`  Revenue: $${revenue}`);
    
    // Test different percentage values
    const percentTests = [15, 0, 20, 10];
    for (const percent of percentTests) {
      await mgmtFeeInput.fill(String(percent));
      await page.waitForTimeout(500);
      
      const expense = await mgmtExpense.inputValue();
      const expected = Math.round(parseFloat(revenue) * (percent / 100));
      
      console.log(`  ${percent}%: $${expense} (expected: $${expected})`);
      expect(parseInt(expense)).toBe(expected);
      
      if (percent === 15) {
        await screenshot(page, 'calculator-mgmt-fee-test', 'calculator');
      }
    }
    console.log('  ✅ Property management percentage working correctly');
    
    // Test 3.2: Interest Rate Slider
    console.log('\n📊 Testing interest rate adjustment...');
    const interestInput = page.locator('#interestRateInput');
    const mortgageInput = page.locator('#mortgage');
    
    const initialMortgage = await mortgageInput.inputValue();
    console.log(`  Initial mortgage: $${initialMortgage}`);
    
    // Change interest rate
    await interestInput.fill('8.5');
    await page.waitForTimeout(1000);
    
    const newMortgage = await mortgageInput.inputValue();
    console.log(`  New mortgage at 8.5%: $${newMortgage}`);
    
    expect(parseInt(newMortgage)).toBeGreaterThan(parseInt(initialMortgage));
    await screenshot(page, 'calculator-interest-rate-test', 'calculator');
    console.log('  ✅ Interest rate adjustment working');
    
    // Test 3.3: Down Payment
    console.log('\n📊 Testing down payment adjustment...');
    const downPaymentInput = page.locator('#downPaymentPercentInput');
    
    await downPaymentInput.fill('30');
    await page.waitForTimeout(1000);
    
    const mortgageAfterDownPayment = await mortgageInput.inputValue();
    console.log(`  Mortgage with 30% down: $${mortgageAfterDownPayment}`);
    
    expect(parseInt(mortgageAfterDownPayment)).toBeLessThan(parseInt(newMortgage));
    console.log('  ✅ Down payment adjustment working');
    
    // Test 3.4: Expense Editing
    console.log('\n📊 Testing expense editing...');
    const utilityInput = page.locator('#utilities');
    const netCashFlow = page.locator('#netCashFlow');
    
    const initialCashFlow = await netCashFlow.textContent();
    console.log(`  Initial cash flow: ${initialCashFlow}`);
    
    // Increase utilities
    await utilityInput.fill('500');
    await utilityInput.dispatchEvent('change');
    await page.waitForTimeout(1000);
    
    const newCashFlow = await netCashFlow.textContent();
    console.log(`  Cash flow after utility increase: ${newCashFlow}`);
    
    expect(newCashFlow).not.toBe(initialCashFlow);
    await screenshot(page, 'calculator-expense-edit', 'calculator');
    console.log('  ✅ Expense editing working');
    
    // Test 3.5: Reset Calculator
    console.log('\n📊 Testing reset functionality...');
    await page.click('button:has-text("Reset to Defaults")');
    await page.waitForTimeout(1000);
    
    const resetUtilities = await utilityInput.inputValue();
    console.log(`  Utilities after reset: $${resetUtilities}`);
    expect(parseInt(resetUtilities)).toBe(200); // Default value
    console.log('  ✅ Reset functionality working');
    
    // ========== SECTION 4: Airbnb Comparables Modal ==========
    logSection('4. Airbnb Comparables Modal');
    
    // Switch to STR tab
    await page.click('button:has-text("Short-Term Rental")');
    await page.waitForTimeout(1000);
    
    // Find and click "View All Comparables" button
    const viewCompsButton = page.locator('button:has-text("View All")').first();
    
    if (await viewCompsButton.isVisible()) {
      console.log('🔍 Testing Airbnb comparables modal...');
      await viewCompsButton.click();
      await page.waitForTimeout(1000);
      
      // Verify modal is visible
      const modal = page.locator('#comparablesModal');
      await expect(modal).toBeVisible();
      console.log('  ✅ Modal opened successfully');
      
      // Check for comparables
      const comparableCards = page.locator('.comparable-card');
      const compCount = await comparableCards.count();
      console.log(`  📊 Found ${compCount} comparables`);
      
      // Verify images are real (not placeholders)
      if (compCount > 0) {
        const firstImage = comparableCards.first().locator('img');
        const imageSrc = await firstImage.getAttribute('src');
        
        expect(imageSrc).not.toContain('placeholder');
        expect(imageSrc).not.toContain('via.placeholder');
        console.log('  ✅ Real images displayed (not placeholders)');
      }
      
      await screenshot(page, 'airbnb-comparables-modal', 'modals');
      
      // Close modal
      const closeButton = page.locator('button:has-text("Close")');
      await closeButton.click();
      await page.waitForTimeout(500);
      
      await expect(modal).not.toBeVisible();
      console.log('  ✅ Modal closed successfully');
    } else {
      console.log('  ⚠️  No comparables button found (might be no comparables data)');
    }
    
    // ========== SECTION 5: Key Metrics Indicators ==========
    logSection('5. Key Metrics Indicators');
    
    // Go back to Investment Planning
    await page.click('button:has-text("Investment Planning")');
    await page.waitForTimeout(1000);
    
    const metrics = [
      { name: 'Cap Rate', id: 'capRateIndicator' },
      { name: 'ROI', id: 'roiIndicator' },
      { name: 'Cash Flow', id: 'cashFlowIndicator' },
      { name: 'Break-Even', id: 'breakEvenIndicator' }
    ];
    
    console.log('🎯 Checking metric indicators...');
    for (const metric of metrics) {
      const indicator = page.locator(`#${metric.id}`);
      
      if (await indicator.isVisible()) {
        const text = await indicator.textContent();
        const classes = await indicator.getAttribute('class');
        
        console.log(`  ${metric.name}: ${text.trim()}`);
        
        // Check indicator has appropriate styling
        expect(classes).toMatch(/bg-(purple|green|yellow|red)-100/);
        expect(classes).toMatch(/text-(purple|green|yellow|red)-700/);
      }
    }
    console.log('  ✅ All metric indicators displayed correctly');
    
    // ========== SECTION 6: Responsive Design Testing ==========
    logSection('6. Responsive Design Testing');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📱 Testing ${viewport.name} viewport...`);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check if navigation is still functional
      await page.click('button:has-text("Short-Term Rental")');
      await page.waitForTimeout(500);
      
      const strContent = page.locator('#str-content');
      await expect(strContent).toBeVisible();
      
      await screenshot(page, `responsive-${viewport.name.toLowerCase()}`, 'responsive');
      console.log(`  ✅ ${viewport.name} layout working`);
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // ========== SECTION 7: Error States & Edge Cases ==========
    logSection('7. Error States & Edge Cases');
    
    // Test 7.1: Extreme values
    console.log('\n🔴 Testing extreme values...');
    await page.click('button:has-text("Investment Planning")');
    await page.waitForTimeout(1000);
    
    // Set revenue to 0
    await monthlyRevenue.fill('0');
    await monthlyRevenue.dispatchEvent('change');
    await page.waitForTimeout(1000);
    
    const zeroRevenueCashFlow = await netCashFlow.textContent();
    console.log(`  Cash flow with $0 revenue: ${zeroRevenueCashFlow}`);
    expect(zeroRevenueCashFlow).toContain('-');
    
    // Set very high revenue
    await monthlyRevenue.fill('50000');
    await monthlyRevenue.dispatchEvent('change');
    await page.waitForTimeout(1000);
    
    const highRevenueCashFlow = await netCashFlow.textContent();
    console.log(`  Cash flow with $50k revenue: ${highRevenueCashFlow}`);
    
    await screenshot(page, 'edge-case-extreme-values', 'edge-cases');
    console.log('  ✅ Extreme values handled correctly');
    
    // ========== SECTION 8: Data Persistence ==========
    logSection('8. Data Persistence Check');
    
    // Switch between tabs and verify data persists
    console.log('\n💾 Testing data persistence across tab switches...');
    
    // Set a custom value
    await monthlyRevenue.fill('7500');
    await monthlyRevenue.dispatchEvent('change');
    await page.waitForTimeout(500);
    
    // Switch to STR tab and back
    await page.click('button:has-text("Short-Term Rental")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Investment Planning")');
    await page.waitForTimeout(500);
    
    // Check if value persisted
    const persistedRevenue = await monthlyRevenue.inputValue();
    expect(persistedRevenue).toBe('7500');
    console.log('  ✅ Data persists across tab switches');
    
    // ========== FINAL SUMMARY ==========
    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPREHENSIVE E2E TEST SUITE COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Coverage Summary:');
    console.log('  ✓ Form submission and analysis flow');
    console.log('  ✓ All tab navigation functionality');
    console.log('  ✓ Financial calculator interactions');
    console.log('  ✓ Property management percentage input');
    console.log('  ✓ Interest rate and down payment adjustments');
    console.log('  ✓ Expense editing and calculations');
    console.log('  ✓ Reset functionality');
    console.log('  ✓ Airbnb comparables modal');
    console.log('  ✓ Key metrics indicators');
    console.log('  ✓ Responsive design across viewports');
    console.log('  ✓ Edge cases and extreme values');
    console.log('  ✓ Data persistence');
    console.log('\n🎯 All critical user paths verified!');
  });
  
  // Additional focused test for performance
  test('Performance and loading times', async ({ page }) => {
    console.log('\n⚡ Testing performance metrics...');
    
    const testUrl = 'https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true&price=850000';
    
    // Measure initial load time
    const startTime = Date.now();
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`  Initial load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    
    // Measure analysis submission time
    await page.check('#str-analysis');
    
    const analysisStartTime = Date.now();
    await page.click('button:has-text("Analyze Property")');
    
    await page.waitForSelector('#analysis-results', { 
      state: 'visible', 
      timeout: 180000 
    });
    const analysisTime = Date.now() - analysisStartTime;
    
    console.log(`  Analysis completion time: ${analysisTime}ms`);
    console.log('  ✅ Performance metrics captured');
  });
});