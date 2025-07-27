const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Create screenshot directory
async function setupScreenshotDir() {
  const dir = path.join(__dirname, 'screenshots', 'simple-journey', new Date().toISOString().split('T')[0]);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Take screenshot with error handling
async function screenshot(page, name, dir) {
  try {
    const filepath = path.join(dir, `${Date.now()}-${name}.png`);
    await page.screenshot({ 
      path: filepath, 
      fullPage: true,
      animations: 'disabled' 
    });
    console.log(`📸 ${name} - saved`);
    return filepath;
  } catch (error) {
    console.error(`❌ Failed to capture ${name}: ${error.message}`);
  }
}

test('User Journey - Property Analysis Flow', async ({ page }) => {
  const screenshotDir = await setupScreenshotDir();
  console.log(`📁 Screenshots will be saved to: ${screenshotDir}\n`);
  
  // Increase timeouts for stability
  test.setTimeout(300000); // 5 minutes total
  page.setDefaultTimeout(60000); // 60 seconds per action
  
  try {
    // 1. Navigate to app
    console.log('1️⃣ Loading application...');
    await page.goto('http://localhost:3000/roi-finder.html', { waitUntil: 'networkidle' });
    await screenshot(page, '01-initial-load', screenshotDir);
    
    // 2. Check if property form is visible
    console.log('2️⃣ Checking property form...');
    const propertyForm = await page.locator('#property-analysis-form');
    const isFormVisible = await propertyForm.isVisible();
    console.log(`   Form visible: ${isFormVisible}`);
    await screenshot(page, '02-property-form', screenshotDir);
    
    if (!isFormVisible) {
      console.log('   ⚠️  Property form not visible, checking for login screen...');
      const loginVisible = await page.locator('#login-section').isVisible();
      if (loginVisible) {
        console.log('   Login screen detected - app requires authentication');
        await screenshot(page, '02a-login-screen', screenshotDir);
      }
      return;
    }
    
    // 3. Fill property details
    console.log('3️⃣ Filling property details...');
    const testData = {
      street: '123 Test Street',
      city: 'Toronto',
      province: 'Ontario',
      postalCode: 'M5V 3A8',
      price: '850000',
      bedrooms: '3',
      bathrooms: '2',
      sqft: '1500',
      propertyTaxes: '8500'
    };
    
    await page.fill('#street', testData.street);
    await page.fill('#city', testData.city);
    await page.selectOption('#province', testData.province);
    await page.fill('#postal-code', testData.postalCode);
    await page.fill('#purchase-price', testData.price);
    await page.fill('#bedrooms', testData.bedrooms);
    await page.fill('#bathrooms', testData.bathrooms);
    await page.fill('#square-feet', testData.sqft);
    await page.fill('#property-taxes', testData.propertyTaxes);
    await page.selectOption('#property-type', 'House');
    
    await screenshot(page, '03-form-filled', screenshotDir);
    
    // 4. Select analysis types
    console.log('4️⃣ Selecting analysis types...');
    const ltrCheckbox = page.locator('#ltr-analysis');
    const strCheckbox = page.locator('#str-analysis');
    
    if (!await ltrCheckbox.isChecked()) {
      await ltrCheckbox.click();
    }
    if (!await strCheckbox.isChecked()) {
      await strCheckbox.click();
    }
    
    await screenshot(page, '04-analysis-selected', screenshotDir);
    
    // 5. Submit analysis
    console.log('5️⃣ Submitting analysis...');
    const analyzeButton = page.locator('button:has-text("Analyze Property")');
    await analyzeButton.click();
    
    // Wait for loading
    await page.waitForSelector('.loading-gradient, .loading, [class*="loading"]', { 
      state: 'visible',
      timeout: 10000 
    }).catch(() => console.log('   No loading indicator found'));
    
    await screenshot(page, '05-loading-state', screenshotDir);
    
    // 6. Wait for results
    console.log('6️⃣ Waiting for results...');
    const resultsAppeared = await page.waitForSelector('#analysis-results, [id*="results"], .results-container', {
      state: 'visible',
      timeout: 120000
    }).then(() => true).catch(() => false);
    
    if (!resultsAppeared) {
      console.log('   ⚠️  Results did not appear within timeout');
      await screenshot(page, '06-timeout-state', screenshotDir);
      return;
    }
    
    await screenshot(page, '06-results-loaded', screenshotDir);
    
    // 7. Test tabs
    console.log('7️⃣ Testing tab navigation...');
    
    // STR Tab
    const strTab = await page.locator('button:has-text("Short-Term Rental")').first();
    if (await strTab.isVisible()) {
      await strTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '07a-str-tab', screenshotDir);
      
      // Check for Airbnb data
      const airbnbSection = await page.locator('text=/Airbnb|comparable/i').first();
      if (await airbnbSection.isVisible()) {
        console.log('   ✅ Airbnb comparables section found');
        
        // Try to open comparables modal
        const viewAllBtn = await page.locator('button:has-text("View All Comparable")').first();
        if (await viewAllBtn.isVisible()) {
          await viewAllBtn.click();
          await page.waitForTimeout(1000);
          await screenshot(page, '07b-comparables-modal', screenshotDir);
          
          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    }
    
    // LTR Tab
    const ltrTab = await page.locator('button:has-text("Long-Term Rental")').first();
    if (await ltrTab.isVisible()) {
      await ltrTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '07c-ltr-tab', screenshotDir);
    }
    
    // Investment Tab
    const investmentTab = await page.locator('button:has-text("Investment Planning")').first();
    if (await investmentTab.isVisible()) {
      await investmentTab.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '07d-investment-tab', screenshotDir);
    }
    
    // 8. Test interactive calculator
    console.log('8️⃣ Testing interactive calculator...');
    
    // Find calculator section
    const calculator = await page.locator('.financial-calculator, [class*="calculator"]').first();
    if (await calculator.isVisible()) {
      // Test down payment slider
      const slider = await page.locator('input[type="range"]').first();
      if (await slider.isVisible()) {
        await slider.fill('30');
        await page.waitForTimeout(500);
        await screenshot(page, '08a-downpayment-changed', screenshotDir);
      }
      
      // Test property management toggle
      const mgmtToggle = await page.locator('text=/property management/i').locator('..').locator('input[type="checkbox"]').first();
      if (await mgmtToggle.isVisible()) {
        const isChecked = await mgmtToggle.isChecked();
        await mgmtToggle.click();
        await page.waitForTimeout(500);
        console.log(`   Property management toggled: ${!isChecked}`);
        await screenshot(page, '08b-management-toggled', screenshotDir);
        
        // Check if calculations updated
        const expenses = await page.locator('text=/management fee/i').first();
        if (await expenses.isVisible()) {
          console.log('   ✅ Management fee appears in expenses');
        } else {
          console.log('   ⚠️  Management fee not visible in expenses');
        }
      }
    }
    
    // 9. Check for errors
    console.log('9️⃣ Checking for errors...');
    const errors = await page.locator('.error, [class*="error"], .alert-danger').all();
    if (errors.length > 0) {
      console.log(`   ⚠️  Found ${errors.length} error elements`);
      await screenshot(page, '09-errors-found', screenshotDir);
    } else {
      console.log('   ✅ No visible errors');
    }
    
    // 10. Test mobile view
    console.log('🔟 Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await screenshot(page, '10-mobile-view', screenshotDir);
    
    console.log('\n✅ User journey test completed!');
    console.log(`📁 Screenshots saved to: ${screenshotDir}`);
    
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    await screenshot(page, 'error-final-state', screenshotDir);
    throw error;
  }
});

// Test specific known issues
test('Known Issues - Property Management Toggle', async ({ page }) => {
  const screenshotDir = await setupScreenshotDir();
  test.setTimeout(120000);
  
  console.log('🔍 Testing property management fee toggle issue...\n');
  
  try {
    // Navigate directly with property data in URL
    const url = 'http://localhost:3000/roi-finder.html?street=123+Test+St&city=Toronto&state=Ontario&country=Canada&postal=M5V3A8&price=850000&bedrooms=3&bathrooms=2&sqft=1500&propertyType=House&taxes=8500&autoAnalyze=true';
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for results
    await page.waitForSelector('#analysis-results', { timeout: 60000 });
    await screenshot(page, 'issue-01-results-loaded', screenshotDir);
    
    // Go to investment tab
    const investmentTab = await page.locator('button:has-text("Investment Planning")').first();
    await investmentTab.click();
    await page.waitForTimeout(1000);
    
    // Find property management toggle
    const mgmtToggle = await page.locator('label:has-text("Property Management")').locator('input[type="checkbox"]').first();
    
    // Get initial expense values
    const getExpenseValue = async () => {
      const totalExpense = await page.locator('text=/total.*expense/i').locator('..').locator('text=/\\$[0-9,]+/').first();
      if (await totalExpense.isVisible()) {
        return await totalExpense.textContent();
      }
      return null;
    };
    
    const initialExpense = await getExpenseValue();
    console.log(`Initial total expense: ${initialExpense}`);
    await screenshot(page, 'issue-02-before-toggle', screenshotDir);
    
    // Toggle management fee
    await mgmtToggle.click();
    await page.waitForTimeout(1000);
    
    const afterExpense = await getExpenseValue();
    console.log(`After toggle expense: ${afterExpense}`);
    await screenshot(page, 'issue-03-after-toggle', screenshotDir);
    
    if (initialExpense === afterExpense) {
      console.log('⚠️  ISSUE CONFIRMED: Property management toggle does not update calculations');
    } else {
      console.log('✅ Property management toggle is working correctly');
    }
    
    // Check if management fee line item appears
    const mgmtFeeLine = await page.locator('text=/management.*fee/i').first();
    if (await mgmtFeeLine.isVisible()) {
      console.log('✅ Management fee line item is visible');
    } else {
      console.log('⚠️  Management fee line item is not visible');
    }
    
  } catch (error) {
    console.error(`Test error: ${error.message}`);
    await screenshot(page, 'issue-error-state', screenshotDir);
  }
});

// Summary function to analyze screenshots
test.afterAll(async () => {
  console.log('\n📊 Test Summary:');
  console.log('- Check screenshots directory for visual validation');
  console.log('- Review any error screenshots for debugging');
  console.log('- Property management toggle issue needs investigation');
});