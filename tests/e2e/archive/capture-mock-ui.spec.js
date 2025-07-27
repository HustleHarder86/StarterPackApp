// Capture mock UI states for visual analysis
const { test } = require('@playwright/test');
const path = require('path');

test.describe('Capture Mock UI States', () => {
  test('capture all UI states', async ({ page }) => {
    const mockStatesDir = path.join(__dirname, 'mock-states');
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // 1. Initial Form State
    await page.goto(`file://${path.join(mockStatesDir, 'initial-form.html')}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mock-01-initial-form.png',
      fullPage: true 
    });
    console.log('✅ Captured initial form');
    
    // 2. Loading State
    await page.goto(`file://${path.join(mockStatesDir, 'loading-state.html')}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mock-02-loading.png',
      fullPage: true 
    });
    console.log('✅ Captured loading state');
    
    // 3. Results State
    await page.goto(`file://${path.join(mockStatesDir, 'results-state.html')}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Let charts render
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mock-03-results.png',
      fullPage: true 
    });
    console.log('✅ Captured results state');
    
    // 4. Mobile Views
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12
    
    // Mobile form
    await page.goto(`file://${path.join(mockStatesDir, 'initial-form.html')}`);
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mock-04-mobile-form.png',
      fullPage: true 
    });
    console.log('✅ Captured mobile form');
    
    // Mobile results
    await page.goto(`file://${path.join(mockStatesDir, 'results-state.html')}`);
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mock-05-mobile-results.png',
      fullPage: true 
    });
    console.log('✅ Captured mobile results');
    
    // 5. Tablet View
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto(`file://${path.join(mockStatesDir, 'results-state.html')}`);
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mock-06-tablet-results.png',
      fullPage: true 
    });
    console.log('✅ Captured tablet results');
    
    console.log('\n🎉 All mock UI states captured!');
    console.log('📁 Screenshots saved to: tests/e2e/screenshots/');
  });
});