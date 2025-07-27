const { test, expect } = require('@playwright/test');

/**
 * Critical Workflows Test Suite
 * Tests the most important user journeys that must always work
 */

test.describe('Critical User Workflows', () => {
  
  test('Browser Extension → Analyze Button → Confirmation Screen workflow', async ({ page }) => {
    // Navigate to ROI Finder
    await page.goto('/roi-finder.html');
    
    // Wait for app to initialize
    await page.waitForSelector('#loading-screen', { state: 'visible' });
    await page.waitForSelector('#property-form', { state: 'visible', timeout: 10000 });
    
    // Simulate browser extension data injection
    const propertyData = {
      address: {
        street: '123 Main Street',
        city: 'Toronto',
        state: 'ON',
        postal: 'M5V 3A8'
      },
      price: 850000,
      propertyTaxes: 5490,
      condoFees: 850,
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      propertyType: 'Condo',
      mlsNumber: 'C1234567'
    };
    
    // Inject property data (simulating browser extension)
    await page.evaluate((data) => {
      if (window.ingestPropertyData) {
        window.ingestPropertyData(data);
      }
    }, propertyData);
    
    // Verify property data populated in form
    await expect(page.locator('#property-address')).toHaveValue('123 Main Street, Toronto, ON M5V 3A8');
    await expect(page.locator('#property-price')).toHaveValue('850000');
    await expect(page.locator('#property-taxes')).toHaveValue('5490');
    
    // Click analyze button
    await page.click('#analyze-property-btn');
    
    // Verify transition to confirmation screen
    await page.waitForSelector('#confirmation-screen', { state: 'visible', timeout: 5000 });
    
    // Verify property details shown correctly
    await expect(page.locator('#confirm-address')).toContainText('123 Main Street');
    await expect(page.locator('#confirm-price')).toContainText('$850,000');
    await expect(page.locator('#confirm-bedrooms')).toContainText('2');
    
    // Test mode selection buttons work
    await page.click('#confirm-str-mode-btn');
    await expect(page.locator('#confirm-analysis-mode')).toHaveValue('str');
    
    await page.click('#confirm-ltr-mode-btn');
    await expect(page.locator('#confirm-analysis-mode')).toHaveValue('ltr');
  });
  
  test('Property Form Manual Entry → Analysis workflow', async ({ page }) => {
    await page.goto('/roi-finder.html');
    await page.waitForSelector('#property-form', { state: 'visible' });
    
    // Fill form manually
    await page.fill('#property-address', '456 Oak Avenue, Vancouver, BC V6B 1A1');
    await page.fill('#property-price', '1200000');
    await page.fill('#property-taxes', '8500');
    await page.fill('#bedrooms', '3');
    await page.fill('#bathrooms', '2');
    await page.fill('#sqft', '1500');
    
    // Submit form
    await page.click('#analyze-property-btn');
    
    // Should go to confirmation screen
    await page.waitForSelector('#confirmation-screen', { state: 'visible' });
    await expect(page.locator('#confirm-address')).toContainText('456 Oak Avenue');
  });
  
  test('Authentication flow works correctly', async ({ page }) => {
    await page.goto('/roi-finder.html');
    
    // Should redirect to auth if not logged in (or show login prompt)
    // This test depends on your auth implementation
    const authRequired = await page.locator('#auth-required').isVisible().catch(() => false);
    
    if (authRequired) {
      // Test login flow
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'testpassword');
      await page.click('#login-btn');
      
      // Should proceed to main app
      await page.waitForSelector('#property-form', { state: 'visible' });
    }
  });
  
  test('Analysis completion workflow', async ({ page }) => {
    await page.goto('/roi-finder.html');
    await page.waitForSelector('#property-form', { state: 'visible' });
    
    // Quick property entry
    await page.fill('#property-address', '789 Test Street, Toronto, ON M5A 1A1');
    await page.fill('#property-price', '750000');
    await page.fill('#property-taxes', '4500');
    await page.fill('#bedrooms', '2');
    await page.fill('#bathrooms', '1');
    
    await page.click('#analyze-property-btn');
    await page.waitForSelector('#confirmation-screen', { state: 'visible' });
    
    // Start analysis
    await page.click('#start-analysis-btn');
    
    // Should show loading screen with progress
    await page.waitForSelector('#loading-screen', { state: 'visible' });
    await expect(page.locator('#progress-indicator')).toBeVisible();
    
    // Wait for results (with long timeout for real API calls)
    await page.waitForSelector('#results-screen', { state: 'visible', timeout: 90000 });
    
    // Verify key results are displayed
    await expect(page.locator('#result-address')).toBeVisible();
    await expect(page.locator('#result-value')).toBeVisible();
    await expect(page.locator('#monthly-cash-flow')).toBeVisible();
  });
  
  test('Error handling for missing data', async ({ page }) => {
    await page.goto('/roi-finder.html');
    await page.waitForSelector('#property-form', { state: 'visible' });
    
    // Try to submit with minimal data
    await page.fill('#property-address', 'Incomplete Address');
    await page.click('#analyze-property-btn');
    
    // Should show validation errors
    const errorVisible = await page.locator('.error-message').isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });
  
  test('Mobile responsiveness check', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/roi-finder.html');
    await page.waitForSelector('#property-form', { state: 'visible' });
    
    // Verify mobile layout
    const formVisible = await page.locator('#property-form').isVisible();
    expect(formVisible).toBeTruthy();
    
    // Test form interaction on mobile
    await page.fill('#property-address', 'Mobile Test Address');
    await page.fill('#property-price', '500000');
    
    // Should be able to submit on mobile
    await page.click('#analyze-property-btn');
    await page.waitForSelector('#confirmation-screen', { state: 'visible' });
  });
});