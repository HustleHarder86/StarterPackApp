// E2E tests for property analysis flow
import { test, expect } from '@playwright/test';

test.describe('Property Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/roi-finder.html');
  });

  test('should analyze property with traditional rental only', async ({ page }) => {
    // Fill in property address
    await page.fill('#propertyAddress', '123 Main St, Toronto, ON, Canada');
    
    // Ensure STR toggle is off
    const strToggle = page.locator('#includeSTR');
    if (await strToggle.isChecked()) {
      await strToggle.click();
    }
    
    // Submit form
    await page.click('#analyze-btn');
    
    // Wait for loading to complete
    await page.waitForSelector('#results-container', { state: 'visible' });
    
    // Verify results are displayed
    await expect(page.locator('#property-value')).toBeVisible();
    await expect(page.locator('#monthly-rent')).toBeVisible();
    await expect(page.locator('#cash-flow')).toBeVisible();
    await expect(page.locator('#cap-rate')).toBeVisible();
    
    // Verify STR section is not shown
    await expect(page.locator('#str-analysis-section')).not.toBeVisible();
  });

  test('should analyze property with STR comparison', async ({ page }) => {
    // Fill in property address
    await page.fill('#propertyAddress', '456 Queen St, Vancouver, BC, Canada');
    
    // Enable STR analysis
    await page.click('#includeSTR');
    
    // Submit form
    await page.click('#analyze-btn');
    
    // Wait for loading
    await page.waitForSelector('#results-container', { state: 'visible' });
    
    // Verify both LTR and STR results
    await expect(page.locator('#monthly-rent')).toBeVisible();
    await expect(page.locator('#str-nightly-rate')).toBeVisible();
    await expect(page.locator('#str-occupancy')).toBeVisible();
    
    // Verify comparison chart
    await expect(page.locator('#comparison-chart')).toBeVisible();
    
    // Check recommendation
    await expect(page.locator('#rental-recommendation')).toContainText(/recommend/i);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Use invalid address to trigger error
    await page.fill('#propertyAddress', '');
    
    // Submit form
    await page.click('#analyze-btn');
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText(/address.*required/i);
  });

  test('should save property to portfolio', async ({ page }) => {
    // Analyze a property first
    await page.fill('#propertyAddress', '789 King St, Ottawa, ON, Canada');
    await page.click('#analyze-btn');
    await page.waitForSelector('#results-container', { state: 'visible' });
    
    // Click save to portfolio
    await page.click('#save-to-portfolio-btn');
    
    // Should show success message
    await expect(page.locator('.success-message')).toBeVisible();
    
    // Navigate to portfolio
    await page.goto('/portfolio.html');
    
    // Verify property appears in portfolio
    await expect(page.locator('.property-card')).toHaveCount(1);
    await expect(page.locator('.property-card')).toContainText('789 King St');
  });

  test('should export analysis as PDF', async ({ page }) => {
    // Analyze a property
    await page.fill('#propertyAddress', '321 Elm St, Calgary, AB, Canada');
    await page.click('#analyze-btn');
    await page.waitForSelector('#results-container', { state: 'visible' });
    
    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');
    
    // Click export PDF
    await page.click('#export-pdf-btn');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/property.*analysis.*\.pdf/i);
  });

  test('should show STR trial limit for free users', async ({ page }) => {
    // Mock free user with 4 trials used
    await page.evaluate(() => {
      window.currentUser = { 
        subscriptionTier: 'free',
        strTrialUsed: 4
      };
    });
    
    // Try to enable STR
    await page.click('#includeSTR');
    
    // Should show trial limit warning
    await expect(page.locator('.trial-warning')).toBeVisible();
    await expect(page.locator('.trial-warning')).toContainText('1 trial remaining');
    
    // After 5th analysis, should show upgrade prompt
    await page.fill('#propertyAddress', '999 Test St, Montreal, QC, Canada');
    await page.click('#analyze-btn');
    await page.waitForSelector('#results-container', { state: 'visible' });
    
    // Try another STR analysis
    await page.reload();
    await page.click('#includeSTR');
    
    // Should show upgrade modal
    await expect(page.locator('#upgrade-modal')).toBeVisible();
    await expect(page.locator('#upgrade-modal')).toContainText(/upgrade.*pro/i);
  });
});