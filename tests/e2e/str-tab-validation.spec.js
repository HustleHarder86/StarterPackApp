const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('STR Tab Comprehensive Test', () => {
  test('Complete STR tab functionality and visual validation', async ({ page, browserName }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Create screenshot helper
    let screenshotCount = 0;
    const takeScreenshot = async (name) => {
      screenshotCount++;
      const filename = `${screenshotCount.toString().padStart(2, '0')}-${name}.png`;
      await page.screenshot({ 
        path: path.join('tests/e2e/screenshots', 'str-tab-validation', filename),
        fullPage: true 
      });
      console.log(`📸 Screenshot: ${filename}`);
    };

    // 1. Navigate to the app
    console.log('1. Navigating to ROI Finder...');
    await page.goto('http://localhost:3000/roi-finder.html');
    await page.waitForLoadState('networkidle');
    await takeScreenshot('initial-page-load');

    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 2. Fill in the property form
    console.log('2. Filling property form...');
    await page.fill('#street', '123 Test Street');
    await page.fill('#city', 'Toronto');
    await page.fill('#province', 'Ontario');
    await page.fill('#price', '850000');
    await page.fill('#bedrooms', '3');
    await page.fill('#bathrooms', '2');
    await page.fill('#sqft', '1800');
    await page.fill('#property-taxes', '8500');
    await page.fill('#condo-fees', '450');
    await takeScreenshot('form-filled');

    // 3. Submit the form
    console.log('3. Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for loading state
    await page.waitForSelector('.loading', { state: 'visible' });
    await takeScreenshot('loading-state');
    
    // Wait for results (max 60 seconds)
    console.log('Waiting for analysis...');
    await page.waitForSelector('.results-section', { state: 'visible', timeout: 60000 });
    await page.waitForTimeout(2000); // Let content settle
    await takeScreenshot('results-loaded');

    // 4. Click STR tab
    console.log('4. Finding and clicking STR tab...');
    
    // Count tabs
    const tabButtons = await page.$$('.tab-button');
    console.log(`Found ${tabButtons.length} tab buttons`);
    
    // Click STR tab
    const strTab = await page.locator('.tab-button:has-text("STR Analysis")').first();
    await strTab.click();
    
    // Wait for STR content
    await page.waitForSelector('#str-content', { state: 'visible' });
    await page.waitForTimeout(1000);
    await takeScreenshot('str-tab-active');

    // 5. Validate STR content
    console.log('5. Validating STR content...');
    
    // Property image check
    const propertyImg = await page.locator('.property-image img').first();
    const imgSrc = await propertyImg.getAttribute('src');
    const isDefaultImage = imgSrc.includes('default-property.jpg');
    console.log(`Property image: ${isDefaultImage ? '❌ Default' : '✅ Custom'} - ${imgSrc}`);
    
    // Check for duplicate tabs
    const tabContainers = await page.$$('.tabs');
    console.log(`Tab containers: ${tabContainers.length} ${tabContainers.length > 1 ? '❌ Duplicates!' : '✅ No duplicates'}`);
    
    // Check STR headers
    const strHeaders = await page.$$('.str-header');
    console.log(`STR headers: ${strHeaders.length} ${strHeaders.length > 1 ? '❌ Multiple!' : '✅ Clean'}`);
    
    // Scroll to revenue comparison
    await page.locator('.str-revenue-comparison').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await takeScreenshot('revenue-comparison-chart');
    
    // Check chart rendering
    const chartCanvas = await page.locator('.str-revenue-comparison canvas').count();
    console.log(`Revenue chart: ${chartCanvas > 0 ? '✅ Rendered' : '❌ Not rendered'}`);
    
    // 6. Test STR calculator
    console.log('6. Testing STR calculator...');
    
    // Scroll to calculator
    await page.locator('.str-calculator').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Check $ symbol formatting
    const inputGroups = await page.$$('.str-calculator .input-group');
    console.log(`Calculator inputs: ${inputGroups.length} groups found`);
    
    await takeScreenshot('str-calculator-initial');
    
    // Test occupancy slider
    const occupancySlider = await page.locator('#occupancy-rate');
    if (await occupancySlider.count() > 0) {
      await occupancySlider.fill('80');
      console.log('✅ Occupancy slider adjusted to 80%');
      await page.waitForTimeout(500);
      await takeScreenshot('str-calculator-adjusted');
    } else {
      console.log('❌ Occupancy slider not found');
    }
    
    // 7. Check financial calculator
    console.log('7. Checking financial calculator...');
    
    // Scroll to financial calculator
    const financialCalc = await page.locator('.financial-calculator');
    if (await financialCalc.count() > 0) {
      await financialCalc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const annualChart = await page.locator('.financial-calculator canvas').count();
      console.log(`Financial calculator: ✅ Found`);
      console.log(`Annual revenue chart: ${annualChart > 0 ? '✅ Rendered' : '❌ Not rendered'}`);
      
      await takeScreenshot('financial-calculator');
    } else {
      console.log('❌ Financial calculator not found');
    }
    
    // 8. Layout validation
    console.log('8. Validating layout...');
    
    const layoutInfo = await page.evaluate(() => {
      const strContent = document.querySelector('#str-content');
      if (!strContent) return { error: 'STR content not found' };
      
      const columns = strContent.querySelectorAll('.str-column');
      const computedStyle = window.getComputedStyle(strContent);
      
      return {
        columnsFound: columns.length,
        display: computedStyle.display,
        gridColumns: computedStyle.gridTemplateColumns
      };
    });
    
    console.log(`Layout: ${layoutInfo.columnsFound} columns ${layoutInfo.columnsFound === 2 ? '✅' : '❌'}`);
    console.log(`Display: ${layoutInfo.display}, Grid: ${layoutInfo.gridColumns}`);
    
    // Final screenshot
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await takeScreenshot('str-tab-complete');
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log(`  ❌ ${err}`));
    }
    
    // Assertions
    expect(tabContainers.length).toBe(1); // No duplicate tabs
    expect(strHeaders.length).toBe(1); // Clean header
    expect(chartCanvas).toBeGreaterThan(0); // Chart rendered
    expect(layoutInfo.columnsFound).toBe(2); // 2-column layout
  });
});