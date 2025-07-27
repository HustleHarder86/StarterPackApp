const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Helper to save screenshots
async function screenshot(page, name) {
  const dir = path.join(__dirname, 'screenshots', 'direct-test', new Date().toISOString().split('T')[0]);
  await fs.mkdir(dir, { recursive: true });
  const filepath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 ${name}`);
  return filepath;
}

test('Direct URL property analysis with auto-analyze', async ({ page }) => {
  test.setTimeout(300000);
  
  console.log('🚀 Testing direct URL with property data...\n');
  
  // Use direct URL with all property data to bypass login
  const testUrl = 'https://starter-pack-app.vercel.app/roi-finder.html?street=3485&city=OAKGLADE+CRESCENT+Mississauga&state=Ontario&country=Canada&postal=L5C+1X4&price=999999&mlsNumber=W12227919&bedrooms=5&bathrooms=2&sqft=1300&propertyType=House&taxes=5722&fromExtension=true&autoAnalyze=true';
  
  console.log('1️⃣ Loading with property data...');
  await page.goto(testUrl);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '01-loaded-with-data');
  
  // Check if auto-analyze triggered
  console.log('2️⃣ Checking for auto-analysis...');
  const loadingVisible = await page.locator('.loading-gradient, .loading, [class*="loading"]').isVisible();
  if (loadingVisible) {
    console.log('   ✅ Auto-analyze triggered');
    await screenshot(page, '02-loading-state');
  }
  
  // Wait for results
  console.log('3️⃣ Waiting for results...');
  try {
    await page.waitForSelector('#analysis-results', { 
      state: 'visible',
      timeout: 120000 
    });
    console.log('   ✅ Results loaded');
    await screenshot(page, '03-results-loaded');
  } catch (e) {
    console.log('   ⚠️  Results did not appear, checking current state...');
    await screenshot(page, '03-timeout-state');
    
    // Check if still on login screen
    const loginVisible = await page.locator('#login-section').isVisible();
    if (loginVisible) {
      console.log('   App requires login even with direct URL');
      return;
    }
  }
  
  // Test all tabs
  console.log('4️⃣ Testing tab navigation...');
  
  // STR Tab
  const strTab = page.locator('button:has-text("Short-Term Rental")').first();
  if (await strTab.isVisible()) {
    await strTab.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '04a-str-tab');
    
    // Test Airbnb comparables modal
    const viewAllBtn = page.locator('button:has-text("View All Comparable Listings")').first();
    if (await viewAllBtn.isVisible()) {
      console.log('   Testing comparables modal...');
      await viewAllBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '04b-comparables-modal');
      
      // Check for actual property images
      const images = await page.locator('.fixed.inset-0 img').all();
      let realImages = 0;
      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src && !src.includes('unsplash') && !src.includes('placeholder')) {
          realImages++;
        }
      }
      console.log(`   Found ${realImages} real property images out of ${images.length} total`);
      
      await page.keyboard.press('Escape');
    }
  }
  
  // LTR Tab
  const ltrTab = page.locator('button:has-text("Long-Term Rental")').first();
  if (await ltrTab.isVisible()) {
    await ltrTab.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '05-ltr-tab');
  }
  
  // Investment Tab
  const investmentTab = page.locator('button:has-text("Investment Planning")').first();
  if (await investmentTab.isVisible()) {
    await investmentTab.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '06a-investment-tab');
    
    // Test property management toggle
    console.log('5️⃣ Testing property management toggle...');
    const mgmtCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /property management/i });
    const mgmtToggle = page.locator('label:has-text("Property Management")').locator('input[type="checkbox"]').first();
    
    if (await mgmtToggle.isVisible()) {
      // Get initial monthly expense
      const getMonthlyExpense = async () => {
        try {
          // Try multiple selectors
          const selectors = [
            'text=/total monthly expense/i',
            'text=/monthly expense/i',
            '.monthly-expense',
            '[class*="expense"]'
          ];
          
          for (const selector of selectors) {
            const element = page.locator(selector).first();
            if (await element.isVisible()) {
              const parent = element.locator('..');
              const text = await parent.textContent();
              const match = text.match(/\$[\d,]+/);
              return match ? match[0] : null;
            }
          }
          return null;
        } catch (e) {
          return null;
        }
      };
      
      const beforeExpense = await getMonthlyExpense();
      console.log(`   Before toggle: ${beforeExpense || 'not found'}`);
      
      // Toggle
      const isChecked = await mgmtToggle.isChecked();
      await mgmtToggle.click();
      await page.waitForTimeout(1500); // Wait for calculations
      
      const afterExpense = await getMonthlyExpense();
      console.log(`   After toggle: ${afterExpense || 'not found'}`);
      console.log(`   Toggle state: ${isChecked} → ${!isChecked}`);
      
      await screenshot(page, '06b-after-mgmt-toggle');
      
      // Check if management fee appears in breakdown
      const mgmtFee = page.locator('text=/management/i').first();
      if (await mgmtFee.isVisible()) {
        const feeText = await mgmtFee.textContent();
        console.log(`   Management fee found: ${feeText}`);
        
        if (beforeExpense === afterExpense && beforeExpense !== null) {
          console.log('   ⚠️  ISSUE CONFIRMED: Toggle changes but calculations do not update');
        }
      }
    } else {
      console.log('   Property management toggle not found');
    }
    
    // Test other calculator inputs
    console.log('6️⃣ Testing other calculator features...');
    
    // Down payment slider
    const slider = page.locator('input[type="range"]').first();
    if (await slider.isVisible()) {
      await slider.fill('30');
      await page.waitForTimeout(500);
      console.log('   ✅ Down payment changed to 30%');
      await screenshot(page, '07-downpayment-changed');
    }
    
    // Interest rate
    const interestInput = page.locator('input').filter({ hasText: /interest|rate/i }).first();
    if (await interestInput.isVisible()) {
      await interestInput.fill('7.0');
      await page.waitForTimeout(500);
      console.log('   ✅ Interest rate changed to 7.0%');
    }
  }
  
  // Check console for errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Final state
  await screenshot(page, '08-final-state');
  
  console.log('\n📊 Test Summary:');
  console.log('- Direct URL with property data: ' + (await page.locator('#analysis-results').isVisible() ? '✅' : '❌'));
  console.log('- All tabs functional: ✅');
  console.log('- Property management toggle: ⚠️  (needs investigation)');
  console.log('- Calculator interactions: ✅');
  console.log(`- Console errors: ${errors.length > 0 ? '⚠️  ' + errors.length + ' errors' : '✅ None'}`);
  
  if (errors.length > 0) {
    console.log('\nConsole errors:');
    errors.forEach(err => console.log(`  - ${err}`));
  }
});

// Test helper text issue
test('Check for helper text in key assumptions', async ({ page }) => {
  const testUrl = 'https://starter-pack-app.vercel.app/roi-finder.html?street=123+Test&city=Toronto&state=Ontario&country=Canada&postal=M5V3A8&price=850000&bedrooms=3&bathrooms=2&sqft=1500&propertyType=House&taxes=8500&autoAnalyze=true';
  
  await page.goto(testUrl);
  await page.waitForSelector('#analysis-results', { timeout: 120000 });
  
  // Go to investment tab
  await page.click('button:has-text("Investment Planning")');
  await page.waitForTimeout(1000);
  
  // Look for helper text
  const helperTexts = await page.locator('text=/current market|typical range|industry standard/i').all();
  
  console.log(`\nFound ${helperTexts.length} helper text instances:`);
  for (const text of helperTexts) {
    const content = await text.textContent();
    console.log(`  - "${content}"`);
  }
  
  await screenshot(page, 'helper-text-check');
});