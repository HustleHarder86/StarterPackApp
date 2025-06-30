const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function testFirebaseAuth() {
  console.log('Starting Firebase authentication test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to test page
    console.log('Navigating to test page...');
    await page.goto('https://starter-pack-app.vercel.app/test-firebase-auth.html');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/firebase-test-1-initial.png',
      fullPage: true 
    });
    console.log('Screenshot 1: Initial page load saved');
    
    // Wait for auto-load to complete
    await page.waitForTimeout(2000);
    
    // Take screenshot after config loads
    await page.screenshot({ 
      path: 'tests/screenshots/firebase-test-2-config-loaded.png',
      fullPage: true 
    });
    console.log('Screenshot 2: After config auto-load saved');
    
    // Click Firebase Init button
    console.log('Testing Firebase initialization...');
    await page.click('button:has-text("Test Firebase Init")');
    await page.waitForTimeout(1000);
    
    // Take screenshot after Firebase init
    await page.screenshot({ 
      path: 'tests/screenshots/firebase-test-3-firebase-init.png',
      fullPage: true 
    });
    console.log('Screenshot 3: After Firebase init saved');
    
    // Get results
    const configResult = await page.locator('#config-result').textContent();
    const initResult = await page.locator('#init-result').textContent();
    
    console.log('\n=== Test Results ===');
    console.log('Config Result:', configResult);
    console.log('Init Result:', initResult);
    
    // Keep browser open for 5 seconds to view results
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ 
      path: 'tests/screenshots/firebase-test-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
    console.log('\nTest completed. Screenshots saved in tests/screenshots/');
  }
}

// Create screenshots directory
async function ensureScreenshotsDir() {
  const dir = path.join(__dirname, 'tests', 'screenshots');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Run the test
ensureScreenshotsDir().then(() => {
  testFirebaseAuth();
});