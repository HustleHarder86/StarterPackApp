const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('STR Progress Indicator Visual Test', () => {
  test('should display progress indicators during STR analysis', async ({ page }) => {
    // Load the test page directly
    const testPath = path.join(__dirname, '../../test-progress-indicator.html');
    await page.goto(`file://${testPath}`);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/progress-initial.png',
      fullPage: true 
    });
    
    // Click the start button
    await page.click('#startTest');
    
    // Wait for warning to appear
    await page.waitForSelector('#str-timeout-warning', { timeout: 5000 });
    
    // Take screenshot with warning
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/progress-warning.png',
      fullPage: true 
    });
    
    // Wait for progress timer
    await page.waitForSelector('#str-progress-timer', { timeout: 5000 });
    
    // Wait a few seconds to see progress
    await page.waitForTimeout(3000);
    
    // Take screenshot with progress timer
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/progress-timer-3s.png',
      fullPage: true 
    });
    
    // Verify warning text
    const warningText = await page.textContent('#str-timeout-warning');
    expect(warningText).toContain('STR Analysis in Progress');
    expect(warningText).toContain('up to 5 minutes');
    
    // Verify progress timer is updating
    const progressText1 = await page.textContent('#str-progress-timer');
    await page.waitForTimeout(2000);
    const progressText2 = await page.textContent('#str-progress-timer');
    expect(progressText1).not.toBe(progressText2); // Should have changed
    
    // Take screenshot at 5 seconds
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/progress-timer-5s.png',
      fullPage: true 
    });
    
    // Verify spinner animation exists
    const spinner = await page.$('svg.animate-spin');
    expect(spinner).toBeTruthy();
    
    // Verify stage text changes
    const stageText = await page.textContent('#str-progress-timer');
    expect(stageText).toContain('Searching properties');
    
    console.log('✅ Visual test completed successfully');
    console.log('Screenshots saved to tests/e2e/screenshots/');
  });
});