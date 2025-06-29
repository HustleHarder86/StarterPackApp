// E2E tests for browser extension
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

test.describe('Browser Extension', () => {
  let browser;
  let context;
  let page;

  test.beforeAll(async () => {
    // Load extension
    const pathToExtension = path.join(__dirname, '../../src/extension');
    browser = await chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    });
    
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('should inject analyze button on Realtor.ca listings', async () => {
    // Navigate to a Realtor.ca listing (mock URL for testing)
    await page.goto('https://www.realtor.ca/real-estate/12345/123-main-st-toronto');
    
    // Wait for extension to inject button
    await page.waitForSelector('.investorprops-analyze-btn', { timeout: 5000 });
    
    // Verify button is visible
    const analyzeBtn = page.locator('.investorprops-analyze-btn');
    await expect(analyzeBtn).toBeVisible();
    await expect(analyzeBtn).toContainText('Analyze with InvestorProps');
  });

  test('should extract property data correctly', async () => {
    // Mock Realtor.ca page structure
    await page.setContent(`
      <html>
        <body>
          <div class="listingDetailsContainer">
            <span class="price">$850,000</span>
            <h1 class="address">123 Main St, Toronto, ON M5V 3A8</h1>
            <div class="propertyDetailsSectionContainer">
              <span>3 Bedrooms</span>
              <span>2 Bathrooms</span>
              <span>1,800 sqft</span>
            </div>
          </div>
        </body>
      </html>
    `);
    
    // Inject and run content script
    await page.addScriptTag({ path: path.join(__dirname, '../../src/extension/content.js') });
    
    // Click analyze button
    await page.click('.investorprops-analyze-btn');
    
    // Wait for data extraction
    await page.waitForTimeout(1000);
    
    // Verify extracted data
    const extractedData = await page.evaluate(() => window.extractedPropertyData);
    expect(extractedData).toMatchObject({
      price: 850000,
      address: '123 Main St, Toronto, ON M5V 3A8',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800
    });
  });

  test('should open popup with property data', async () => {
    // Get extension ID (this would be dynamic in real test)
    const extensionId = 'abcdefghijklmnopqrstuvwxyz123456';
    
    // Open extension popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Verify popup loads
    await expect(popupPage.locator('h2')).toContainText('InvestorProps Analyzer');
    
    // Should show property data if available
    await expect(popupPage.locator('#property-info')).toBeVisible();
  });

  test('should handle authentication in popup', async () => {
    // Open popup without auth
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://extension-id/popup.html`);
    
    // Should show login prompt
    await expect(popupPage.locator('#login-prompt')).toBeVisible();
    
    // Click login
    await popupPage.click('#login-btn');
    
    // Should open new tab with login page
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      popupPage.click('#login-btn')
    ]);
    
    expect(newPage.url()).toContain('/index.html');
  });

  test('should send property data to API', async () => {
    // Mock authenticated state
    await page.evaluate(() => {
      chrome.storage.local.set({ 
        authToken: 'mock-auth-token',
        userId: 'test-user-123'
      });
    });
    
    // Mock property data
    const mockPropertyData = {
      mlsNumber: 'C5789012',
      price: 950000,
      address: '456 Queen St, Vancouver, BC',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2200
    };
    
    // Intercept API call
    await page.route('**/api/properties/ingest', route => {
      expect(route.request().postDataJSON()).toMatchObject({
        userId: 'test-user-123',
        mlsNumber: 'C5789012',
        propertyData: mockPropertyData
      });
      
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, propertyId: 'prop-123' })
      });
    });
    
    // Trigger analysis
    await page.evaluate((data) => {
      window.postMessage({ 
        type: 'ANALYZE_PROPERTY', 
        data 
      }, '*');
    }, mockPropertyData);
    
    // Verify success message
    await expect(page.locator('.success-toast')).toBeVisible();
    await expect(page.locator('.success-toast')).toContainText('Property saved');
  });
});