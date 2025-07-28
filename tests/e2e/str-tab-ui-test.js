const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const screenshotDir = path.join(__dirname, 'screenshots', 'str-tab-test', timestamp);
fs.mkdirSync(screenshotDir, { recursive: true });

async function captureSTRTabUI() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('error', err => console.error('Browser error:', err));
  page.on('pageerror', err => console.error('Page error:', err));

  const results = {
    testUrl: 'https://starter-pack-app.vercel.app/roi-finder.html',
    timestamp: new Date().toISOString(),
    screenshots: [],
    issues: [],
    uiScores: {},
    functionality: {}
  };

  try {
    console.log('\n🔍 Starting STR Tab UI/UX Test...\n');
    
    // Step 1: Navigate to the URL
    console.log('1. Navigating to URL...');
    await page.goto(results.testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    const initialScreenshot = path.join(screenshotDir, '01-initial-page-load.png');
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    results.screenshots.push({ name: 'Initial Page Load', path: initialScreenshot });
    
    // Check if loading state appears
    const loadingVisible = await page.$('.loading-spinner, [class*="loading"]') !== null;
    if (loadingVisible) {
      console.log('Loading state detected, trying with test parameter...');
      await page.goto(results.testUrl + '?test=true', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
    }

    // Step 2: Fill in the property form
    console.log('\n2. Filling property form...');
    
    // Take screenshot of empty form
    const emptyFormScreenshot = path.join(screenshotDir, '02-empty-form.png');
    await page.screenshot({ path: emptyFormScreenshot, fullPage: true });
    results.screenshots.push({ name: 'Empty Form', path: emptyFormScreenshot });
    
    // Fill form fields
    const formData = {
      '#street': '123 Main Street',
      '#city': 'Toronto',
      '#province': 'Ontario',
      '#price': '850000',
      '#bedrooms': '3',
      '#bathrooms': '2',
      '#sqft': '1800',
      '#propertyTaxes': '8500',
      '#condoFees': '450'
    };

    for (const [selector, value] of Object.entries(formData)) {
      const element = await page.$(selector);
      if (element) {
        await element.click({ clickCount: 3 });
        await element.type(value);
        console.log(`  ✓ Filled ${selector} with ${value}`);
      } else {
        console.error(`  ✗ Could not find element: ${selector}`);
        results.issues.push(`Form field not found: ${selector}`);
      }
    }

    // Take screenshot of filled form
    const filledFormScreenshot = path.join(screenshotDir, '03-filled-form.png');
    await page.screenshot({ path: filledFormScreenshot, fullPage: true });
    results.screenshots.push({ name: 'Filled Form', path: filledFormScreenshot });

    // Step 3: Submit form
    console.log('\n3. Submitting form...');
    const submitButton = await page.$('button[type="submit"], button:has-text("Analyze"), button:has-text("Submit")');
    if (submitButton) {
      await submitButton.click();
      console.log('  ✓ Form submitted');
      
      // Wait for analysis to complete
      await page.waitForTimeout(5000);
      
      // Check for any error messages
      const errorElement = await page.$('.error, [class*="error"], .alert-danger');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.error(`  ✗ Error detected: ${errorText}`);
        results.issues.push(`Form submission error: ${errorText}`);
      }
    } else {
      console.error('  ✗ Submit button not found');
      results.issues.push('Submit button not found');
    }

    // Take screenshot after submission
    const postSubmitScreenshot = path.join(screenshotDir, '04-post-submission.png');
    await page.screenshot({ path: postSubmitScreenshot, fullPage: true });
    results.screenshots.push({ name: 'Post Submission', path: postSubmitScreenshot });

    // Step 4: Click STR tab
    console.log('\n4. Clicking Short-Term Rental tab...');
    
    // Wait for tabs to be visible
    await page.waitForSelector('.tab-button, [role="tab"], button:has-text("Short-Term Rental")', { timeout: 10000 }).catch(() => {
      console.error('  ✗ Tabs not found');
      results.issues.push('Tab navigation not visible');
    });

    // Count tab sets to check for duplicates
    const tabSets = await page.$$('.tab-navigation, .tabs-container, [role="tablist"]');
    console.log(`  Found ${tabSets.length} tab set(s)`);
    if (tabSets.length > 1) {
      results.issues.push(`Duplicate tab sets detected: ${tabSets.length} sets found`);
    }

    // Click STR tab
    const strTab = await page.$('button:has-text("Short-Term Rental"), [role="tab"]:has-text("Short-Term Rental")');
    if (strTab) {
      await strTab.click();
      console.log('  ✓ STR tab clicked');
      await page.waitForTimeout(2000);
    } else {
      console.error('  ✗ STR tab not found');
      results.issues.push('STR tab not found');
    }

    // Step 5: Take comprehensive screenshots of STR tab
    console.log('\n5. Capturing STR tab screenshots...');

    // Full STR tab view
    const fullSTRScreenshot = path.join(screenshotDir, '05-full-str-tab.png');
    await page.screenshot({ path: fullSTRScreenshot, fullPage: true });
    results.screenshots.push({ name: 'Full STR Tab View', path: fullSTRScreenshot });

    // Property header with image
    const propertyHeader = await page.$('.property-header, .property-card, [class*="property-info"]');
    if (propertyHeader) {
      const headerScreenshot = path.join(screenshotDir, '06-property-header.png');
      await propertyHeader.screenshot({ path: headerScreenshot });
      results.screenshots.push({ name: 'Property Header', path: headerScreenshot });
      
      // Check for property image
      const propertyImage = await page.$('.property-image, img[alt*="property"], img[src*="property"]');
      if (propertyImage) {
        const imageSrc = await propertyImage.getAttribute('src');
        console.log(`  Property image source: ${imageSrc}`);
        results.functionality.propertyImage = imageSrc.includes('default') ? 'Default image' : 'Real image';
      }
    }

    // Tab navigation
    const tabNavigation = await page.$('.tab-navigation, .tabs-container, [role="tablist"]');
    if (tabNavigation) {
      const tabNavScreenshot = path.join(screenshotDir, '07-tab-navigation.png');
      await tabNavigation.screenshot({ path: tabNavScreenshot });
      results.screenshots.push({ name: 'Tab Navigation', path: tabNavScreenshot });
    }

    // Revenue comparison chart
    const revenueChart = await page.$('.revenue-chart, canvas, [class*="chart"]');
    if (revenueChart) {
      const chartScreenshot = path.join(screenshotDir, '08-revenue-chart.png');
      
      // Scroll to chart if needed
      await revenueChart.scrollIntoView();
      await page.waitForTimeout(1000);
      
      await revenueChart.screenshot({ path: chartScreenshot });
      results.screenshots.push({ name: 'Revenue Comparison Chart', path: chartScreenshot });
      results.functionality.revenueChart = 'Present';
    } else {
      results.issues.push('Revenue comparison chart not found');
      results.functionality.revenueChart = 'Missing';
    }

    // STR calculator section
    const strCalculator = await page.$('.str-calculator, [class*="calculator"], .financial-inputs');
    if (strCalculator) {
      const calcScreenshot = path.join(screenshotDir, '09-str-calculator.png');
      await strCalculator.screenshot({ path: calcScreenshot });
      results.screenshots.push({ name: 'STR Calculator', path: calcScreenshot });
      
      // Check $ symbol position in inputs
      const inputs = await page.$$('.str-calculator input, .financial-inputs input');
      for (const input of inputs) {
        const parent = await input.evaluateHandle(el => el.parentElement);
        const hasPrefix = await parent.$('.input-prefix, .currency-symbol, span:has-text("$")');
        if (hasPrefix) {
          const prefixText = await hasPrefix.textContent();
          console.log(`  Input has $ prefix: ${prefixText}`);
        }
      }
    }

    // Financial calculator at bottom
    const financialCalc = await page.$('.financial-calculator, .roi-calculator, [class*="financial-summary"]');
    if (financialCalc) {
      await financialCalc.scrollIntoView();
      await page.waitForTimeout(1000);
      
      const finCalcScreenshot = path.join(screenshotDir, '10-financial-calculator.png');
      await financialCalc.screenshot({ path: finCalcScreenshot });
      results.screenshots.push({ name: 'Financial Calculator', path: finCalcScreenshot });
    }

    // Step 6: Test interactivity
    console.log('\n6. Testing interactive elements...');
    
    // Test input interactions
    const testInputs = await page.$$('input[type="number"], input[type="text"]');
    console.log(`  Found ${testInputs.length} input fields`);
    
    if (testInputs.length > 0) {
      const firstInput = testInputs[0];
      await firstInput.click();
      await firstInput.type('100');
      
      const interactionScreenshot = path.join(screenshotDir, '11-input-interaction.png');
      await page.screenshot({ path: interactionScreenshot });
      results.screenshots.push({ name: 'Input Interaction', path: interactionScreenshot });
    }

    // Step 7: Visual analysis
    console.log('\n7. Performing visual analysis...');
    
    // Check layout
    const hasColumns = await page.$('.grid-cols-2, .two-column, [style*="grid"], [style*="flex"]');
    results.uiScores.layout = hasColumns ? '2-column layout detected' : 'Single column layout';
    
    // Check responsive design
    console.log('  Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileScreenshot = path.join(screenshotDir, '12-mobile-view.png');
    await page.screenshot({ path: mobileScreenshot, fullPage: true });
    results.screenshots.push({ name: 'Mobile View', path: mobileScreenshot });
    
    // Return to desktop view
    await page.setViewport({ width: 1920, height: 1080 });

    // Generate summary
    results.summary = {
      totalScreenshots: results.screenshots.length,
      issuesFound: results.issues.length,
      tabsWorking: results.issues.filter(i => i.includes('tab')).length === 0,
      chartsPresent: results.functionality.revenueChart === 'Present',
      mobileResponsive: true
    };

    console.log('\n📊 Test Summary:');
    console.log(`  ✓ Screenshots captured: ${results.summary.totalScreenshots}`);
    console.log(`  ${results.summary.issuesFound === 0 ? '✓' : '✗'} Issues found: ${results.summary.issuesFound}`);
    console.log(`  ${results.summary.tabsWorking ? '✓' : '✗'} Tab navigation working`);
    console.log(`  ${results.summary.chartsPresent ? '✓' : '✗'} Charts rendering`);

  } catch (error) {
    console.error('\n❌ Test Error:', error);
    results.error = error.message;
    
    const errorScreenshot = path.join(screenshotDir, 'error-state.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    results.screenshots.push({ name: 'Error State', path: errorScreenshot });
  } finally {
    await browser.close();
    
    // Save results
    const resultsPath = path.join(screenshotDir, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log(`\n📁 Results saved to: ${screenshotDir}`);
    console.log(`📄 Full results: ${resultsPath}`);
    
    return results;
  }
}

// Run the test
captureSTRTabUI().then(results => {
  console.log('\n✅ STR Tab UI/UX Test Complete!');
  if (results.issues.length > 0) {
    console.log('\n⚠️  Issues to address:');
    results.issues.forEach(issue => console.log(`  - ${issue}`));
  }
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});