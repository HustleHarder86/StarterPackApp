const { test, expect } = require('@playwright/test');
const { VisualDebugger } = require('./helpers/visual-debugger');

test.describe('Firebase Authentication Test Page', () => {
  test('test Firebase configuration and authentication', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    // Navigate to the test page
    await page.goto('https://starter-pack-app.vercel.app/test-firebase-auth.html');
    await page.waitForLoadState('networkidle');
    await debugger.captureState('initial-page-load');
    
    // Test 1: Config Loading
    console.log('Testing config loading...');
    await page.click('button:has-text("Test Config Loading")');
    await page.waitForTimeout(2000);
    await debugger.captureState('after-config-test');
    
    // Test 2: Firebase Initialization
    console.log('Testing Firebase initialization...');
    await page.click('button:has-text("Test Firebase Init")');
    await page.waitForTimeout(1000);
    await debugger.captureState('after-firebase-init');
    
    // Check for any error messages
    const configResult = await page.locator('#config-result').textContent();
    const initResult = await page.locator('#init-result').textContent();
    
    console.log('Config Result:', configResult);
    console.log('Init Result:', initResult);
    
    // Take a final screenshot showing all results
    await debugger.captureState('final-test-results');
  });
});