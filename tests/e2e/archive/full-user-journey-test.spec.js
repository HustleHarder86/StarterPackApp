const { test, expect } = require('@playwright/test');
const { VisualDebugger } = require('../helpers/visual-debugger');
const path = require('path');
const fs = require('fs').promises;

// Helper to take and save screenshots with descriptive names
async function captureStep(page, stepName, visualDebugger) {
  const screenshotDir = path.join(__dirname, 'screenshots', 'user-journey', new Date().toISOString().split('T')[0]);
  await fs.mkdir(screenshotDir, { recursive: true });
  
  const filename = `${Date.now()}-${stepName.replace(/\s+/g, '-').toLowerCase()}.png`;
  const filepath = path.join(screenshotDir, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: true,
    animations: 'disabled'
  });
  
  // Also capture debug state
  const state = await visualDebugger.capturePageState();
  console.log(`📸 Step: ${stepName} - Screenshot saved to ${filename}`);
  console.log(`   Page URL: ${state.url}`);
  console.log(`   Clickable elements: ${state.clickableElements.length}`);
  console.log(`   Form fields: ${state.formFields.length}`);
  if (state.errors.length > 0) {
    console.log(`   ⚠️  Errors detected: ${state.errors.join(', ')}`);
  }
  
  return { filepath, state };
}

test.describe('Complete User Journey E2E Test', () => {
  let visualDebugger;
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    visualDebugger = new VisualDebugger(page);
    
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Full property analysis journey with all features', async () => {
    console.log('🚀 Starting comprehensive user journey test...\n');

    // Step 1: Landing Page
    console.log('Step 1: Visiting landing page...');
    await page.goto('https://starter-pack-app.vercel.app');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '01-landing-page', visualDebugger);

    // Step 2: Navigate to ROI Finder
    console.log('\nStep 2: Navigating to ROI Finder...');
    const roiFinderButton = await page.locator('text="Free ROI Finder"').first();
    await roiFinderButton.click();
    await page.waitForURL('**/roi-finder.html');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '02-roi-finder-page', visualDebugger);

    // Step 3: Check if user is logged in, if not use guest mode
    console.log('\nStep 3: Checking authentication status...');
    const isLoginVisible = await page.locator('#login-section').isVisible();
    if (isLoginVisible) {
      console.log('   Not logged in - continuing as guest');
      await captureStep(page, '03-login-screen', visualDebugger);
    } else {
      console.log('   Already logged in');
      await captureStep(page, '03-authenticated-view', visualDebugger);
    }

    // Step 4: Fill property details form
    console.log('\nStep 4: Filling property details form...');
    
    // Use test data for a real property
    const testProperty = {
      street: '3485 OAKGLADE CRESCENT',
      city: 'Mississauga',
      province: 'Ontario',
      postalCode: 'L5C 1X4',
      price: '999999',
      bedrooms: '5',
      bathrooms: '2',
      sqft: '1300',
      propertyType: 'House',
      propertyTaxes: '5722'
    };

    // Fill the form
    await page.fill('#street', testProperty.street);
    await page.fill('#city', testProperty.city);
    await page.selectOption('#province', testProperty.province);
    await page.fill('#postal-code', testProperty.postalCode);
    await page.fill('#purchase-price', testProperty.price);
    await page.fill('#bedrooms', testProperty.bedrooms);
    await page.fill('#bathrooms', testProperty.bathrooms);
    await page.fill('#square-feet', testProperty.sqft);
    await page.selectOption('#property-type', testProperty.propertyType);
    await page.fill('#property-taxes', testProperty.propertyTaxes);
    
    await captureStep(page, '04-property-form-filled', visualDebugger);

    // Step 5: Select analysis type (LTR + STR)
    console.log('\nStep 5: Selecting analysis types...');
    const ltrCheckbox = await page.locator('#ltr-analysis');
    const strCheckbox = await page.locator('#str-analysis');
    
    if (!await ltrCheckbox.isChecked()) {
      await ltrCheckbox.click();
    }
    if (!await strCheckbox.isChecked()) {
      await strCheckbox.click();
    }
    
    await captureStep(page, '05-analysis-types-selected', visualDebugger);

    // Step 6: Submit analysis
    console.log('\nStep 6: Submitting analysis...');
    const analyzeButton = await page.locator('button:has-text("Analyze Property")');
    await analyzeButton.click();
    
    // Wait for loading state
    await page.waitForSelector('.loading-gradient', { state: 'visible' });
    await captureStep(page, '06-analysis-loading', visualDebugger);

    // Step 7: Wait for results (with extended timeout for API calls)
    console.log('\nStep 7: Waiting for analysis results...');
    await page.waitForSelector('#analysis-results', { 
      state: 'visible',
      timeout: 300000 // 5 minutes for API calls
    });
    await page.waitForLoadState('networkidle');
    await captureStep(page, '07-analysis-results-initial', visualDebugger);

    // Step 8: Test Short-Term Rental tab
    console.log('\nStep 8: Testing Short-Term Rental tab...');
    const strTab = await page.locator('button:has-text("Short-Term Rental")');
    await strTab.click();
    await page.waitForTimeout(1000); // Wait for tab transition
    await captureStep(page, '08-str-tab-active', visualDebugger);

    // Step 8a: Test Airbnb comparables modal
    console.log('\nStep 8a: Testing Airbnb comparables modal...');
    const viewAllComparablesBtn = await page.locator('button:has-text("View All Comparable Listings")');
    if (await viewAllComparablesBtn.isVisible()) {
      await viewAllComparablesBtn.click();
      await page.waitForSelector('.fixed.inset-0', { state: 'visible' });
      await captureStep(page, '08a-airbnb-comparables-modal', visualDebugger);
      
      // Close modal
      const closeBtn = await page.locator('button:has-text("×")').first();
      await closeBtn.click();
      await page.waitForSelector('.fixed.inset-0', { state: 'hidden' });
    }

    // Step 9: Test Long-Term Rental tab
    console.log('\nStep 9: Testing Long-Term Rental tab...');
    const ltrTab = await page.locator('button:has-text("Long-Term Rental")');
    await ltrTab.click();
    await page.waitForTimeout(1000);
    await captureStep(page, '09-ltr-tab-active', visualDebugger);

    // Step 10: Test Investment Planning tab
    console.log('\nStep 10: Testing Investment Planning tab...');
    const investmentTab = await page.locator('button:has-text("Investment Planning")');
    await investmentTab.click();
    await page.waitForTimeout(1000);
    await captureStep(page, '10-investment-tab-active', visualDebugger);

    // Step 11: Test Interactive Calculator
    console.log('\nStep 11: Testing Interactive Financial Calculator...');
    
    // Test down payment slider
    const downPaymentSlider = await page.locator('input[type="range"]').first();
    if (await downPaymentSlider.isVisible()) {
      await downPaymentSlider.fill('25'); // 25% down payment
      await captureStep(page, '11a-down-payment-adjusted', visualDebugger);
    }

    // Test interest rate input
    const interestRateInput = await page.locator('input[placeholder*="interest"]');
    if (await interestRateInput.isVisible()) {
      await interestRateInput.fill('6.5');
      await captureStep(page, '11b-interest-rate-adjusted', visualDebugger);
    }

    // Test property management toggle (known issue)
    console.log('\nStep 11c: Testing property management fee toggle...');
    const mgmtToggle = await page.locator('label:has-text("Property Management")').locator('input[type="checkbox"]');
    if (await mgmtToggle.isVisible()) {
      await mgmtToggle.click();
      await page.waitForTimeout(500); // Wait for calculations
      await captureStep(page, '11c-management-fee-enabled', visualDebugger);
      
      // Check if calculations updated
      const state = await visualDebugger.capturePageState();
      const hasError = state.errors.some(err => err.includes('management') || err.includes('calculation'));
      if (hasError) {
        console.log('   ⚠️  Property management toggle issue detected');
      }
    }

    // Step 12: Test Key Assumptions section
    console.log('\nStep 12: Testing Key Assumptions inputs...');
    
    // Find and test various assumption inputs
    const assumptionInputs = await page.locator('.key-assumptions input[type="number"]').all();
    console.log(`   Found ${assumptionInputs.length} assumption inputs`);
    
    if (assumptionInputs.length > 0) {
      // Test vacancy rate
      const vacancyInput = await page.locator('input[placeholder*="vacancy"]');
      if (await vacancyInput.isVisible()) {
        await vacancyInput.fill('10');
        await captureStep(page, '12a-vacancy-rate-adjusted', visualDebugger);
      }
      
      // Test maintenance percentage
      const maintenanceInput = await page.locator('input[placeholder*="maintenance"]');
      if (await maintenanceInput.isVisible()) {
        await maintenanceInput.fill('2');
        await captureStep(page, '12b-maintenance-adjusted', visualDebugger);
      }
    }

    // Step 13: Test Save to Portfolio
    console.log('\nStep 13: Testing Save to Portfolio...');
    const saveBtn = await page.locator('button:has-text("Save to Portfolio")');
    if (await saveBtn.isVisible() && !isLoginVisible) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      
      // Check for success message
      const successMsg = await page.locator('text=/saved|added/i');
      if (await successMsg.isVisible()) {
        console.log('   ✅ Property saved successfully');
      }
      await captureStep(page, '13-save-to-portfolio', visualDebugger);
    } else {
      console.log('   Skipping save - requires authentication');
    }

    // Step 14: Test Export PDF
    console.log('\nStep 14: Testing Export PDF functionality...');
    const exportBtn = await page.locator('button:has-text("Export PDF")');
    if (await exportBtn.isVisible()) {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      
      try {
        const download = await downloadPromise;
        console.log(`   ✅ PDF download started: ${download.suggestedFilename()}`);
        await captureStep(page, '14-export-pdf-clicked', visualDebugger);
      } catch (error) {
        console.log('   ⚠️  PDF download did not trigger');
        await captureStep(page, '14-export-pdf-error', visualDebugger);
      }
    }

    // Step 15: Test responsive design
    console.log('\nStep 15: Testing mobile responsive design...');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.waitForTimeout(1000);
    await captureStep(page, '15-mobile-view', visualDebugger);

    // Step 16: Check for any console errors
    console.log('\nStep 16: Checking for console errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate through tabs one more time to catch any errors
    await strTab.click();
    await page.waitForTimeout(500);
    await ltrTab.click();
    await page.waitForTimeout(500);
    await investmentTab.click();
    await page.waitForTimeout(500);
    
    if (consoleErrors.length > 0) {
      console.log('   ⚠️  Console errors detected:');
      consoleErrors.forEach(err => console.log(`      - ${err}`));
    } else {
      console.log('   ✅ No console errors detected');
    }

    // Final screenshot
    await page.setViewportSize({ width: 1920, height: 1080 });
    await captureStep(page, '16-final-state', visualDebugger);

    console.log('\n✅ User journey test completed!');
    console.log(`📁 Screenshots saved to: tests/e2e/screenshots/user-journey/${new Date().toISOString().split('T')[0]}`);
  });

  test('Error handling and edge cases', async () => {
    console.log('🧪 Testing error handling and edge cases...\n');

    // Test 1: Invalid property data
    console.log('Test 1: Testing invalid property data...');
    await page.goto('https://starter-pack-app.vercel.app/roi-finder.html');
    await page.waitForLoadState('networkidle');
    
    // Fill with invalid data
    await page.fill('#purchase-price', '-1000');
    await page.fill('#bedrooms', '0');
    await captureStep(page, 'error-01-invalid-data', visualDebugger);
    
    const analyzeBtn = await page.locator('button:has-text("Analyze Property")');
    await analyzeBtn.click();
    
    // Check for validation errors
    await page.waitForTimeout(1000);
    await captureStep(page, 'error-02-validation-errors', visualDebugger);

    // Test 2: API timeout simulation
    console.log('\nTest 2: Testing API timeout handling...');
    // This would require mocking or a special test endpoint
    
    // Test 3: Missing required fields
    console.log('\nTest 3: Testing missing required fields...');
    await page.reload();
    await page.fill('#street', 'Test Street');
    await page.fill('#city', 'Toronto');
    // Leave other required fields empty
    await analyzeBtn.click();
    await captureStep(page, 'error-03-missing-fields', visualDebugger);

    console.log('\n✅ Error handling tests completed!');
  });
});

// Run screenshot analysis after tests
test.afterAll(async () => {
  console.log('\n🔍 Running screenshot analysis...');
  const { exec } = require('child_process');
  exec('npm run analyze:screenshots', (error, stdout, stderr) => {
    if (error) {
      console.error(`Analysis error: ${error}`);
      return;
    }
    console.log(stdout);
  });
});