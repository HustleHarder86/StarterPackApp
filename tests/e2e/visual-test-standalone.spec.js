// Standalone visual test - no authentication required
const { test, expect } = require('@playwright/test');

test.describe('Visual Analysis Standalone', () => {
  test('capture key screenshots', async ({ page }) => {
    console.log('🚀 Starting visual capture test...');
    
    // Navigate directly to ROI Finder (public page)
    await page.goto('/roi-finder.html');
    await page.waitForLoadState('networkidle');
    
    // 1. Initial page
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/01-initial-page.png',
      fullPage: true 
    });
    console.log('✅ Captured initial page');
    
    // 2. Fill in address
    await page.fill('#property-address', '123 Main St, Toronto, ON M5V 3A8');
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/02-form-filled.png',
      fullPage: false,
      clip: { x: 0, y: 100, width: 1920, height: 800 }
    });
    console.log('✅ Captured form with address');
    
    // 3. Show analysis modes if visible
    const modesVisible = await page.locator('#analysis-mode-ltr').isVisible();
    if (modesVisible) {
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/03-analysis-modes.png',
        fullPage: false,
        clip: { x: 0, y: 200, width: 1920, height: 600 }
      });
      console.log('✅ Captured analysis modes');
    }
    
    // 4. Error state - empty form
    await page.fill('#property-address', '');
    await page.click('#analyze-property-btn');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/04-error-state.png',
      fullPage: false,
      clip: { x: 0, y: 100, width: 1920, height: 400 }
    });
    console.log('✅ Captured error state');
    
    // 5. Mobile view
    await page.setViewportSize({ width: 390, height: 844 });
    await page.fill('#property-address', '123 Main St, Toronto, ON M5V 3A8');
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/05-mobile-view.png',
      fullPage: true 
    });
    console.log('✅ Captured mobile view');
    
    console.log('\n📸 Screenshots captured successfully!');
    console.log('📁 View them in: tests/e2e/screenshots/');
  });
});