// Comprehensive E2E test with screenshots for property analysis flow
// This test captures the entire journey from extension data to analysis results
const { test, expect } = require('@playwright/test');

test.describe('Property Analysis Screenshot Flow', () => {
  test.use({ baseURL: 'http://localhost:8080' });
  // Mock extension data that would typically come from Realtor.ca
  const mockExtensionData = {
    mlsNumber: 'X5859301',
    price: 899000,
    address: '1234 Wellington St W, Ottawa, ON K1Y 2Y7',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1850,
    propertyTaxes: 5490,
    condoFees: 0,
    propertyType: 'Single Family',
    yearBuilt: 1985,
    mainImage: 'https://example.com/property-image.jpg',
    parking: '2 garage spaces',
    dataSource: 'listing'
  };

  test('captures full property analysis flow with screenshots', async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Step 1: Navigate to roi-finder.html with extension parameters
    console.log('Step 1: Navigating with extension data...');
    const queryParams = new URLSearchParams({
      fromExtension: 'true',
      mlsNumber: mockExtensionData.mlsNumber,
      price: mockExtensionData.price,
      address: mockExtensionData.address,
      bedrooms: mockExtensionData.bedrooms,
      bathrooms: mockExtensionData.bathrooms,
      sqft: mockExtensionData.sqft,
      propertyTaxes: mockExtensionData.propertyTaxes,
      condoFees: mockExtensionData.condoFees,
      propertyType: mockExtensionData.propertyType,
      yearBuilt: mockExtensionData.yearBuilt,
      mainImage: mockExtensionData.mainImage,
      parking: mockExtensionData.parking
    });
    
    await page.goto(`/roi-finder.html?${queryParams.toString()}`);
    await page.waitForLoadState('networkidle');
    
    // Screenshot 1: Initial page load with extension data
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/01-initial-page-with-extension-data.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 1: Initial page with extension data');

    // Step 2: Handle authentication (mock for local testing)
    console.log('Step 2: Handling authentication...');
    
    // Check if we're on the login page
    const loginForm = await page.locator('form').filter({ hasText: 'Email Address' }).isVisible().catch(() => false);
    
    if (loginForm) {
      console.log('  - Login form detected, mocking authentication...');
      
      // Mock successful authentication by injecting user data
      await page.evaluate(() => {
        // Set up mock user
        window.currentUser = {
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          subscriptionTier: 'pro',
          strTrialUsed: 0
        };
        
        // Simulate successful authentication
        localStorage.setItem('authToken', 'mock-token');
        localStorage.setItem('userEmail', 'test@example.com');
        
        // If there's an auth handler, trigger it
        if (window.handleAuthStateChange) {
          window.handleAuthStateChange(window.currentUser);
        }
        
        // If there's a redirect function, use it
        if (window.handleSuccessfulLogin) {
          window.handleSuccessfulLogin();
        }
      });
      
      // Try to navigate directly to the form with extension data
      await page.goto(`/roi-finder.html?${queryParams.toString()}&authenticated=true`);
      await page.waitForLoadState('networkidle');
      
      // Screenshot 2: After authentication
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/02-after-authentication.png',
        fullPage: true 
      });
      console.log('✓ Screenshot 2: After authentication');
    } else {
      console.log('  - Authentication not required or already authenticated');
    }

    // Step 3: Verify property confirmation screen
    console.log('Step 3: Checking property confirmation screen...');
    
    // Wait for property confirmation to be visible
    const propertyConfirmation = await page.locator('#property-confirmation, .property-confirmation, [data-testid="property-confirmation"]').first();
    const isConfirmationVisible = await propertyConfirmation.isVisible().catch(() => false);
    
    if (isConfirmationVisible) {
      // Screenshot 3: Property confirmation screen
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/03-property-confirmation.png',
        fullPage: true 
      });
      console.log('✓ Screenshot 3: Property confirmation screen');
    } else {
      console.log('  - Property confirmation not shown (data may be auto-populated)');
    }

    // Step 4: Enable STR analysis for comprehensive results
    console.log('Step 4: Enabling STR analysis...');
    
    const strToggle = await page.locator('#includeSTR, [name="includeSTR"], .str-toggle').first();
    const strToggleExists = await strToggle.count() > 0;
    
    if (strToggleExists) {
      const isChecked = await strToggle.isChecked().catch(() => false);
      if (!isChecked) {
        await strToggle.click();
        console.log('  - STR analysis enabled');
      } else {
        console.log('  - STR analysis already enabled');
      }
    } else {
      console.log('  - STR toggle not found (may be pro-only feature)');
    }

    // Screenshot 4: Form ready to analyze
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/04-form-ready-to-analyze.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 4: Form ready to analyze');

    // Step 5: Click analyze button
    console.log('Step 5: Starting analysis...');
    
    // Find and click the analyze button - try multiple selectors
    const analyzeButtonSelectors = [
      '#analyze-btn',
      'button:has-text("Analyze Investment")',
      'button:has-text("Analyze")',
      '[data-testid="analyze-button"]',
      'button[type="submit"]',
      '.analyze-button'
    ];
    
    let analyzeButton = null;
    for (const selector of analyzeButtonSelectors) {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        analyzeButton = button;
        console.log(`  - Found analyze button with selector: ${selector}`);
        break;
      }
    }
    
    if (analyzeButton) {
      await analyzeButton.scrollIntoViewIfNeeded();
      await analyzeButton.click();
    } else {
      console.log('  - Warning: Could not find analyze button, taking screenshot of current state');
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/error-no-analyze-button.png',
        fullPage: true 
      });
    }
    
    // Wait a moment for loading state to appear
    await page.waitForTimeout(1000);
    
    // Screenshot 5: Analysis in progress
    const loadingIndicator = await page.locator('.loading, #loading-indicator, [data-loading="true"]').first();
    const isLoading = await loadingIndicator.isVisible().catch(() => false);
    
    if (isLoading) {
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/05-analysis-in-progress.png',
        fullPage: true 
      });
      console.log('✓ Screenshot 5: Analysis in progress');
    }

    // Step 6: Wait for results
    console.log('Step 6: Waiting for analysis results...');
    
    // Wait for results container with longer timeout
    await page.waitForSelector('#results-container, .results-container, [data-testid="results"]', { 
      state: 'visible',
      timeout: 60000 // 60 seconds for API calls
    });
    
    // Wait for animations to complete
    await page.waitForTimeout(2000);
    
    // Screenshot 6: Initial results view
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/06-analysis-results.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 6: Analysis results');

    // Step 7: Capture specific result sections
    console.log('Step 7: Capturing detailed result sections...');
    
    // Scroll to and capture financial metrics
    const financialSection = await page.locator('#financial-metrics, .financial-metrics, [data-section="financial"]').first();
    if (await financialSection.count() > 0) {
      await financialSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/07-financial-metrics.png',
        fullPage: false,
        clip: await financialSection.boundingBox()
      });
      console.log('✓ Screenshot 7: Financial metrics section');
    }

    // Capture STR analysis if visible
    const strSection = await page.locator('#str-analysis-section, .str-analysis, [data-section="str"]').first();
    if (await strSection.isVisible().catch(() => false)) {
      await strSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/08-str-analysis.png',
        fullPage: false,
        clip: await strSection.boundingBox()
      });
      console.log('✓ Screenshot 8: STR analysis section');
    }

    // Capture comparison chart if visible
    const comparisonChart = await page.locator('#comparison-chart, .comparison-chart, canvas').first();
    if (await comparisonChart.isVisible().catch(() => false)) {
      await comparisonChart.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/09-comparison-chart.png',
        fullPage: false,
        clip: await comparisonChart.boundingBox()
      });
      console.log('✓ Screenshot 9: Comparison chart');
    }

    // Step 8: Test action buttons
    console.log('Step 8: Testing action buttons...');
    
    // Check for save to portfolio button
    const saveButton = await page.locator('#save-to-portfolio-btn, button:has-text("Save"), [data-action="save"]').first();
    if (await saveButton.isVisible().catch(() => false)) {
      await saveButton.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/10-action-buttons.png',
        fullPage: false,
        clip: {
          x: 0,
          y: (await saveButton.boundingBox()).y - 50,
          width: await page.viewportSize().then(size => size.width),
          height: 200
        }
      });
      console.log('✓ Screenshot 10: Action buttons');
    }

    // Final full page screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/11-complete-results-page.png',
      fullPage: true 
    });
    console.log('✓ Screenshot 11: Complete results page');

    console.log('\n✅ All screenshots captured successfully!');
    console.log('Screenshots saved in: tests/e2e/screenshots/');
  });

  test('captures error states and edge cases', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test 1: Missing required data
    console.log('Testing error state: Missing required data...');
    await page.goto('/roi-finder.html?fromExtension=true&address=123 Main St');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/error-01-missing-data.png',
      fullPage: true 
    });
    console.log('✓ Error Screenshot 1: Missing required data');

    // Test 2: Invalid property data
    console.log('Testing error state: Invalid property data...');
    await page.goto('/roi-finder.html?fromExtension=true&price=-1000&bedrooms=abc');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/error-02-invalid-data.png',
      fullPage: true 
    });
    console.log('✓ Error Screenshot 2: Invalid property data');

    // Test 3: API error simulation
    console.log('Testing error state: API failure...');
    await page.route('**/api/analyze-property', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto(`/roi-finder.html?${new URLSearchParams(mockExtensionData).toString()}`);
    
    // Try to analyze
    const analyzeButton = await page.locator('#analyze-btn, button:has-text("Analyze")').first();
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/error-03-api-failure.png',
        fullPage: true 
      });
      console.log('✓ Error Screenshot 3: API failure');
    }
  });

  test('captures mobile responsive views', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    
    const queryParams = new URLSearchParams(mockExtensionData);
    await page.goto(`/roi-finder.html?${queryParams.toString()}`);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/mobile-01-initial.png',
      fullPage: true 
    });
    console.log('✓ Mobile Screenshot 1: Initial view');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/tablet-01-initial.png',
      fullPage: true 
    });
    console.log('✓ Tablet Screenshot 1: Initial view');
  });
});
