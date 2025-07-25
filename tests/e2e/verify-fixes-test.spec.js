const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Screenshot helper
async function screenshot(page, name) {
  const dir = path.join(__dirname, 'screenshots', 'verify-fixes', new Date().toISOString().split('T')[0]);
  await fs.mkdir(dir, { recursive: true });
  const filepath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 ${name}`);
  return filepath;
}

test('Verify tab navigation and property management percentage input fixes', async ({ page }) => {
  test.setTimeout(300000);
  
  console.log('🔧 Verifying fixes for tab navigation and property management percentage input...\n');
  
  // Load app with test mode and property data that triggers analysis
  const testUrl = 'https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true&street=123+Test+St&city=Toronto&state=Ontario&country=Canada&postal=M5V3A8&price=850000&bedrooms=3&bathrooms=2&sqft=1500&propertyType=House&taxes=8500';
  
  await page.goto(testUrl);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '01-loaded');
  
  // Fill form and submit
  console.log('1️⃣ Submitting property analysis...');
  
  // Check both analysis types
  await page.check('#ltr-analysis');
  await page.check('#str-analysis');
  
  // Submit
  await page.click('button:has-text("Analyze Property")');
  
  // Wait for results
  console.log('2️⃣ Waiting for results...');
  await page.waitForSelector('#analysis-results', { 
    state: 'visible', 
    timeout: 180000 
  });
  await page.waitForTimeout(2000); // Extra wait for everything to load
  await screenshot(page, '02-results-loaded');
  
  // Test 1: Verify all tabs work
  console.log('\n3️⃣ Testing tab navigation...');
  
  const tabs = [
    { name: 'Short-Term Rental', id: 'str-content' },
    { name: 'Long-Term Rental', id: 'ltr-content' },
    { name: 'Investment Planning', id: 'investment-content' }
  ];
  
  for (const tab of tabs) {
    console.log(`   Testing ${tab.name} tab...`);
    
    // Click tab
    await page.click(`button:has-text("${tab.name}")`);
    await page.waitForTimeout(1000);
    
    // Check if content is visible
    const content = page.locator(`#${tab.id}`);
    const isVisible = await content.isVisible();
    const hasHiddenClass = await content.evaluate(el => el.classList.contains('hidden'));
    
    console.log(`   ✅ ${tab.name}: visible=${isVisible}, hidden=${hasHiddenClass}`);
    
    // Take screenshot
    await screenshot(page, `03-${tab.id}`);
    
    // Verify content is actually visible
    expect(isVisible).toBe(true);
    expect(hasHiddenClass).toBe(false);
  }
  
  // Test 2: Verify property management percentage input
  console.log('\n4️⃣ Testing property management percentage input...');
  
  // Make sure we're on Investment Planning tab
  await page.click('button:has-text("Investment Planning")');
  await page.waitForTimeout(1000);
  
  // Find the management fee input and expense field
  const mgmtFeeInput = page.locator('#managementFeeInput');
  const mgmtExpense = page.locator('#propertyMgmt');
  const monthlyRevenue = page.locator('#monthlyRevenue');
  
  // Get initial values
  const initialPercent = await mgmtFeeInput.inputValue();
  const initialExpense = await mgmtExpense.inputValue();
  const revenue = await monthlyRevenue.inputValue();
  console.log(`   Initial state: ${initialPercent}%, expense=$${initialExpense}, revenue=$${revenue}`);
  
  // Test changing percentage to 15%
  await mgmtFeeInput.fill('15');
  await page.waitForTimeout(500); // Wait for calculations
  
  const newExpense15 = await mgmtExpense.inputValue();
  const expectedExpense15 = Math.round(parseFloat(revenue) * 0.15);
  console.log(`   After 15%: expense=$${newExpense15} (expected=$${expectedExpense15})`);
  await screenshot(page, '04-mgmt-fee-15-percent');
  
  // Verify calculation
  expect(parseInt(newExpense15)).toBe(expectedExpense15);
  
  // Test changing percentage to 0%
  await mgmtFeeInput.fill('0');
  await page.waitForTimeout(500); // Wait for calculations
  
  const newExpense0 = await mgmtExpense.inputValue();
  console.log(`   After 0%: expense=$${newExpense0}`);
  await screenshot(page, '05-mgmt-fee-0-percent');
  
  // Verify it's 0
  expect(parseInt(newExpense0)).toBe(0);
  
  // Test changing back to 10%
  await mgmtFeeInput.fill('10');
  await page.waitForTimeout(500); // Wait for calculations
  
  const newExpense10 = await mgmtExpense.inputValue();
  const expectedExpense10 = Math.round(parseFloat(revenue) * 0.10);
  console.log(`   After 10%: expense=$${newExpense10} (expected=$${expectedExpense10})`);
  
  // Verify calculation
  expect(parseInt(newExpense10)).toBe(expectedExpense10);
  
  console.log('\n✅ All fixes verified successfully!');
  console.log('📊 Summary:');
  console.log('   - All tabs are accessible and show content');
  console.log('   - Property management percentage input updates in real-time');
  console.log('   - Calculations are accurate based on percentage of revenue');
});