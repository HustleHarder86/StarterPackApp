// Visual analysis test - captures screenshots for review and improvement suggestions
const { test, expect } = require('@playwright/test');
const path = require('path');

// Skip authentication for visual tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Visual Analysis and UX Review', () => {
  const screenshotDir = 'tests/e2e/screenshots';
  
  // Test property for consistent results
  const TEST_PROPERTY = {
    address: '123 Main St, Toronto, ON M5V 3A8, Canada',
    price: 850000,
    propertyTaxes: 5490,
    bedrooms: '3 + 1',
    bathrooms: '2.5',
    sqft: 1850,
    propertyType: 'Condo'
  };

  test('capture and analyze property analysis flow', async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 1. Navigate to ROI Finder
    await page.goto('/roi-finder.html');
    await page.waitForLoadState('networkidle');
    
    // Capture initial page state
    await page.screenshot({ 
      path: `${screenshotDir}/01-initial-page.png`,
      fullPage: true 
    });
    console.log('📸 Captured: Initial page state');

    // 2. Fill in property data
    await page.fill('#property-address', TEST_PROPERTY.address);
    
    // Inject property data to simulate extension
    await page.evaluate((propertyData) => {
      window.propertyData = propertyData;
    }, TEST_PROPERTY);
    
    // 3. Show analysis mode selection
    await page.screenshot({ 
      path: `${screenshotDir}/02-analysis-modes.png`,
      fullPage: false,
      clip: {
        x: 0,
        y: 200,
        width: 1920,
        height: 600
      }
    });
    console.log('📸 Captured: Analysis mode selection');

    // 4. Select LTR mode and capture
    await page.click('#analysis-mode-ltr');
    await page.screenshot({ 
      path: `${screenshotDir}/03-ltr-mode-selected.png`,
      fullPage: false,
      clip: {
        x: 0,
        y: 200,
        width: 1920,
        height: 600
      }
    });
    console.log('📸 Captured: LTR mode selected');

    // 5. Click analyze and capture loading state
    await page.click('#analyze-property-btn');
    
    // Wait for loading to appear
    await page.waitForSelector('#loading-section', { state: 'visible' });
    await page.waitForTimeout(2000); // Let loading animation run
    
    await page.screenshot({ 
      path: `${screenshotDir}/04-loading-state.png`,
      fullPage: true 
    });
    console.log('📸 Captured: Loading state');

    // 6. Wait for results (mock if needed for faster testing)
    // For real API calls, this could take up to 60 seconds
    try {
      await page.waitForSelector('#results-section', { 
        state: 'visible',
        timeout: 65000 
      });
      
      // Let results fully render
      await page.waitForTimeout(2000);
      
      // 7. Capture full results
      await page.screenshot({ 
        path: `${screenshotDir}/05-full-results.png`,
        fullPage: true 
      });
      console.log('📸 Captured: Full results page');

      // 8. Capture specific sections
      // Property details section
      const propertyDetails = await page.$('#property-details-section');
      if (propertyDetails) {
        await propertyDetails.screenshot({
          path: `${screenshotDir}/06-property-details.png`
        });
        console.log('📸 Captured: Property details section');
      }

      // Financial metrics
      const financialMetrics = await page.$('#financial-metrics-section');
      if (financialMetrics) {
        await financialMetrics.screenshot({
          path: `${screenshotDir}/07-financial-metrics.png`
        });
        console.log('📸 Captured: Financial metrics');
      }

      // Charts/visualizations
      const charts = await page.$('#charts-section');
      if (charts) {
        await charts.screenshot({
          path: `${screenshotDir}/08-charts.png`
        });
        console.log('📸 Captured: Charts and visualizations');
      }

      // Recommendations
      const recommendations = await page.$('#recommendations-section');
      if (recommendations) {
        await recommendations.screenshot({
          path: `${screenshotDir}/09-recommendations.png`
        });
        console.log('📸 Captured: Recommendations');
      }

    } catch (error) {
      console.error('Failed to get results:', error);
      await page.screenshot({ 
        path: `${screenshotDir}/error-state.png`,
        fullPage: true 
      });
    }

    // 9. Test STR mode
    console.log('\n🔄 Testing STR mode...');
    
    // Go back to form
    await page.click('#back-to-form-btn');
    await page.waitForSelector('#analysis-form', { state: 'visible' });
    
    // Select STR mode
    await page.click('#analysis-mode-str');
    await page.screenshot({ 
      path: `${screenshotDir}/10-str-mode-selected.png`,
      fullPage: false,
      clip: {
        x: 0,
        y: 200,
        width: 1920,
        height: 600
      }
    });
    console.log('📸 Captured: STR mode selected');

    // Analyze with STR
    await page.click('#analyze-property-btn');
    
    try {
      await page.waitForSelector('#results-section', { 
        state: 'visible',
        timeout: 65000 
      });
      
      await page.waitForTimeout(2000);
      
      // Capture STR-specific results
      await page.screenshot({ 
        path: `${screenshotDir}/11-str-results.png`,
        fullPage: true 
      });
      console.log('📸 Captured: STR analysis results');

      // STR comparison view
      const strComparison = await page.$('#str-comparison-section');
      if (strComparison) {
        await strComparison.screenshot({
          path: `${screenshotDir}/12-str-comparison.png`
        });
        console.log('📸 Captured: STR vs LTR comparison');
      }

      // Airbnb comparables
      const comparables = await page.$('#comparables-section');
      if (comparables) {
        await comparables.screenshot({
          path: `${screenshotDir}/13-airbnb-comparables.png`
        });
        console.log('📸 Captured: Airbnb comparables');
      }

    } catch (error) {
      console.error('STR analysis failed:', error);
    }

    // 10. Test mobile view
    console.log('\n📱 Testing mobile responsiveness...');
    
    // iPhone 12 Pro viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/14-mobile-results.png`,
      fullPage: true 
    });
    console.log('📸 Captured: Mobile view');

    // Tablet view (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/15-tablet-results.png`,
      fullPage: true 
    });
    console.log('📸 Captured: Tablet view');

    console.log('\n✅ Visual capture complete!');
    console.log(`📁 Screenshots saved to: ${screenshotDir}`);
    console.log('\n💡 Run the analysis script to review screenshots and get improvement suggestions');
  });

  test('capture error states and edge cases', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/roi-finder.html');
    
    // Test empty form submission
    await page.click('#analyze-property-btn');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: `${screenshotDir}/16-empty-form-error.png`,
      fullPage: false,
      clip: {
        x: 0,
        y: 200,
        width: 1920,
        height: 400
      }
    });
    console.log('📸 Captured: Empty form error state');

    // Test with minimal data (no property data from extension)
    await page.fill('#property-address', '456 Unknown St, Small Town, ON');
    await page.click('#analyze-property-btn');
    
    await page.waitForSelector('#loading-section', { state: 'visible' });
    await page.screenshot({ 
      path: `${screenshotDir}/17-minimal-data-loading.png`,
      fullPage: true 
    });
    console.log('📸 Captured: Minimal data analysis');
  });
});