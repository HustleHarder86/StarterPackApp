const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test.describe('Extension Authentication Debug', () => {
  let browser;
  let context;
  let extensionId;

  test.beforeAll(async () => {
    // Launch browser with extension
    const pathToExtension = path.join(__dirname, '../../extension');
    
    browser = await chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    });
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Debug full authentication flow', async () => {
    // Create context
    context = await browser.newContext();
    
    // Step 1: Check if main app is accessible
    console.log('Step 1: Checking main app...');
    const mainPage = await context.newPage();
    
    await mainPage.goto('https://starterpackapp.vercel.app/roi-finder.html');
    await mainPage.waitForTimeout(3000);
    
    // Take screenshot of main app
    await mainPage.screenshot({ 
      path: 'tests/e2e/screenshots/main-app-state.png',
      fullPage: true 
    });
    
    // Check current URL
    const currentUrl = mainPage.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we're on auth page or dashboard
    const isAuthPage = await mainPage.locator('#auth-container').isVisible().catch(() => false);
    const isDashboard = await mainPage.locator('#dashboard').isVisible().catch(() => false);
    
    console.log('Is auth page:', isAuthPage);
    console.log('Is dashboard:', isDashboard);
    
    // Step 2: Check localStorage
    console.log('\nStep 2: Checking localStorage...');
    const localStorageData = await mainPage.evaluate(() => {
      return {
        authToken: localStorage.getItem('starterpack_auth_token'),
        user: localStorage.getItem('starterpack_user'),
        allKeys: Object.keys(localStorage)
      };
    });
    
    console.log('LocalStorage data:', localStorageData);
    
    // Step 3: Check extension pages
    console.log('\nStep 3: Getting extension ID...');
    const extensionPage = await context.newPage();
    await extensionPage.goto('chrome://extensions/');
    await extensionPage.waitForTimeout(2000);
    
    // Get extension ID (this is tricky with Playwright)
    // For now, let's check the extension welcome page
    
    // Step 4: Test extension welcome page
    console.log('\nStep 4: Testing extension welcome page...');
    const welcomePage = await context.newPage();
    
    try {
      await welcomePage.goto('https://starterpackapp.vercel.app/extension-welcome.html');
      await welcomePage.waitForTimeout(2000);
      
      const welcomePageTitle = await welcomePage.title();
      console.log('Welcome page title:', welcomePageTitle);
      
      await welcomePage.screenshot({ 
        path: 'tests/e2e/screenshots/extension-welcome.png' 
      });
      
      // Check if 404
      const is404 = await welcomePage.locator('text=404').isVisible().catch(() => false);
      console.log('Is 404 page:', is404);
      
    } catch (error) {
      console.error('Welcome page error:', error);
    }
    
    // Step 5: Test API endpoints
    console.log('\nStep 5: Testing API endpoints...');
    
    const apiTests = [
      {
        name: 'User Management API',
        url: 'https://starterpackapp.vercel.app/api/user-management',
        method: 'GET'
      },
      {
        name: 'Properties Ingest API',
        url: 'https://starterpackapp.vercel.app/api/properties/ingest',
        method: 'OPTIONS'
      },
      {
        name: 'Config API',
        url: 'https://starterpackapp.vercel.app/api/config',
        method: 'GET'
      }
    ];
    
    for (const apiTest of apiTests) {
      try {
        const response = await mainPage.evaluate(async ({ url, method }) => {
          const res = await fetch(url, { method });
          return {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries())
          };
        }, apiTest);
        
        console.log(`\n${apiTest.name}:`, response);
      } catch (error) {
        console.error(`${apiTest.name} error:`, error.message);
      }
    }
    
    // Step 6: Check for deployment issues
    console.log('\nStep 6: Checking deployment...');
    
    // Test a simple static file
    const testPage = await context.newPage();
    await testPage.goto('https://starterpackapp.vercel.app/extension-test.html');
    await testPage.waitForTimeout(2000);
    
    const testPageTitle = await testPage.title();
    console.log('Test page title:', testPageTitle);
    
    const is404Test = await testPage.locator('text=404').isVisible().catch(() => false);
    console.log('Test page is 404:', is404Test);
    
    await testPage.screenshot({ 
      path: 'tests/e2e/screenshots/extension-test-page.png' 
    });
    
    // Generate report
    console.log('\n=== DEBUGGING REPORT ===');
    console.log('1. Main app accessible:', !isAuthPage || isDashboard);
    console.log('2. Auth token in localStorage:', !!localStorageData.authToken);
    console.log('3. Extension welcome page exists:', !is404);
    console.log('4. API endpoints responding:', 'See above');
    console.log('5. Deployment working:', !is404Test);
  });
});