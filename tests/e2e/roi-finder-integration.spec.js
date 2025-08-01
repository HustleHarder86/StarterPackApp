const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('ROI Finder Integration Tests', () => {
  // Base URL for the local development server
  const baseURL = 'http://localhost:3000';
  
  // Test property data
  const testPropertyData = {
    street: '123 Test Street',
    city: 'Toronto',
    state: 'Ontario',
    country: 'Canada',
    postal: 'M5V 3A8',
    price: '850000',
    mlsNumber: 'TEST123',
    bedrooms: '3',
    bathrooms: '2',
    sqft: '1500',
    propertyType: 'Single Family',
    condoFees: '0',
    image: 'https://example.com/test-image.jpg'
  };

  test.beforeEach(async ({ page }) => {
    // Set up console log capture
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Capture any uncaught exceptions
    page.on('pageerror', exception => {
      console.log('Page error:', exception.message);
    });
  });

  test('should load roi-finder.html without JavaScript errors', async ({ page }) => {
    // Create URL with test mode to bypass auth
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    // Track console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the page
    await page.goto(url.toString());
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that there are no JavaScript errors
    expect(consoleErrors).toHaveLength(0);
    
    // Verify critical elements are present
    await expect(page.locator('#property-form')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should load all Compact Modern components without errors', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    await page.goto(url.toString());
    
    // Check that global components are defined
    const componentsLoaded = await page.evaluate(() => {
      return {
        ComponentLoader: typeof window.ComponentLoader !== 'undefined',
        ComponentLoaderCompactModern: typeof window.ComponentLoaderCompactModern !== 'undefined',
        CompactModernLayout: typeof window.CompactModernLayout !== 'undefined',
        PropertyHeroSection: typeof window.PropertyHeroSection !== 'undefined',
        FinancialSummaryCompactModern: typeof window.FinancialSummaryCompactModern !== 'undefined',
        InvestmentVerdictCompactModern: typeof window.InvestmentVerdictCompactModern !== 'undefined',
        MarketComparisonCompactModern: typeof window.MarketComparisonCompactModern !== 'undefined'
      };
    });
    
    // Verify all components are loaded
    expect(componentsLoaded.ComponentLoader).toBe(true);
    expect(componentsLoaded.ComponentLoaderCompactModern).toBe(true);
    expect(componentsLoaded.CompactModernLayout).toBe(true);
    expect(componentsLoaded.PropertyHeroSection).toBe(true);
    expect(componentsLoaded.FinancialSummaryCompactModern).toBe(true);
    expect(componentsLoaded.InvestmentVerdictCompactModern).toBe(true);
    expect(componentsLoaded.MarketComparisonCompactModern).toBe(true);
  });

  test('should handle property analysis with test data', async ({ page }) => {
    // Create URL with test mode and property data
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    // Add property data to URL (simulating extension data)
    Object.entries(testPropertyData).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    url.searchParams.set('fromExtension', 'true');
    url.searchParams.set('autoAnalyze', 'true');
    
    await page.goto(url.toString());
    
    // Wait for analysis to start
    await page.waitForFunction(() => {
      const loadingState = document.querySelector('.loading-container');
      return loadingState && loadingState.style.display !== 'none';
    }, { timeout: 10000 }).catch(() => {
      // If loading doesn't show, check if analysis already completed
    });
    
    // Wait for analysis to complete (max 30 seconds)
    await page.waitForFunction(() => {
      const resultsContainer = document.querySelector('#results-container');
      return resultsContainer && resultsContainer.innerHTML.trim() !== '';
    }, { timeout: 30000 });
    
    // Verify analysis results are displayed
    const resultsVisible = await page.evaluate(() => {
      const results = document.querySelector('#results-container');
      return results && results.innerHTML.includes('Property Investment Analysis');
    });
    
    expect(resultsVisible).toBe(true);
    
    // Check for Compact Modern components in results
    const hasCompactModernElements = await page.evaluate(() => {
      const sidebar = document.querySelector('.cm-sidebar');
      const mainContent = document.querySelector('.cm-main-content');
      return sidebar !== null || mainContent !== null;
    });
    
    expect(hasCompactModernElements).toBe(true);
  });

  test('should properly initialize mobile menu functionality', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(url.toString());
    await page.waitForLoadState('networkidle');
    
    // Check that mobile menu button is visible
    const mobileMenuButton = page.locator('.cm-mobile-menu-toggle');
    await expect(mobileMenuButton).toBeVisible();
    
    // Check that sidebar is hidden on mobile
    const sidebar = page.locator('.cm-sidebar');
    const sidebarTransform = await sidebar.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    
    expect(sidebarTransform).toContain('matrix'); // Should have transform applied
  });

  test('should handle form submission without errors', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    await page.goto(url.toString());
    await page.waitForLoadState('networkidle');
    
    // Fill in the property form
    await page.fill('#address', testPropertyData.street);
    await page.fill('#city', testPropertyData.city);
    await page.fill('#price', testPropertyData.price);
    await page.fill('#bedrooms', testPropertyData.bedrooms);
    await page.fill('#bathrooms', testPropertyData.bathrooms);
    await page.fill('#squareFeet', testPropertyData.sqft);
    
    // Track network requests to API
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/railway-api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for analysis to start
    await page.waitForFunction(() => {
      const loadingState = document.querySelector('.loading-container');
      return loadingState && loadingState.style.display !== 'none';
    }, { timeout: 5000 });
    
    // Verify API calls were made
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  test('should verify no module loading errors in production setup', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    // Specifically check for module-related errors
    const moduleErrors = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('export') || 
          text.includes('import') || 
          text.includes('module') ||
          text.includes('require') ||
          text.includes('undefined is not a constructor')) {
        moduleErrors.push(text);
      }
    });
    
    await page.goto(url.toString());
    await page.waitForLoadState('networkidle');
    
    // No module loading errors should occur
    expect(moduleErrors).toHaveLength(0);
    
    // Verify component loader is properly initialized
    const componentLoaderCheck = await page.evaluate(() => {
      return {
        hasComponentLoader: window.componentLoader instanceof window.ComponentLoader,
        isCompactModern: window.componentLoader instanceof window.ComponentLoaderCompactModern
      };
    });
    
    expect(componentLoaderCheck.hasComponentLoader).toBe(true);
    expect(componentLoaderCheck.isCompactModern).toBe(true);
  });
});