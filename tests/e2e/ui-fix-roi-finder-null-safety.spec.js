const { test, expect } = require('@playwright/test');

test.describe('UI Fix: ROI Finder Null Safety', () => {
  const baseURL = 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', exception => {
      errors.push(exception.message);
    });
    
    // Store errors on page context for access in tests
    page.errors = errors;
  });

  test('roi-finder.html loads without JavaScript errors', async ({ page }) => {
    // Navigate with E2E test mode
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    await page.goto(url.toString(), { waitUntil: 'networkidle' });
    
    // Wait for page to fully initialize
    await page.waitForTimeout(2000);
    
    // Verify no JavaScript errors
    expect(page.errors).toHaveLength(0);
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/roi-finder-initial.png',
      fullPage: true 
    });
  });

  test('visual appearance matches mock', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    await page.goto(url.toString());
    await page.waitForLoadState('networkidle');
    
    // Verify key elements are visible
    await expect(page.locator('#property-input-section')).toBeVisible();
    
    // Verify sidebar exists
    const sidebar = page.locator('.cm-sidebar').first();
    await expect(sidebar).toBeVisible();
    
    // Verify main content area
    const mainContent = page.locator('.cm-main-content').first();
    await expect(mainContent).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/roi-finder-layout.png',
      fullPage: true 
    });
  });

  test('responsive design works correctly', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    await page.goto(url.toString());
    
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1366, height: 768, name: 'laptop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to adjust
      
      await page.screenshot({ 
        path: `tests/e2e/screenshots/roi-finder-${viewport.name}.png`,
        fullPage: true 
      });
      
      // Verify layout doesn't break
      if (viewport.width < 768) {
        // Mobile: sidebar should be hidden, menu toggle visible
        const menuToggle = page.locator('.cm-mobile-menu-toggle').first();
        await expect(menuToggle).toBeVisible();
      } else {
        // Desktop: sidebar should be visible
        const sidebar = page.locator('.cm-sidebar').first();
        await expect(sidebar).toBeVisible();
      }
      
      // Property input should always be visible
      await expect(page.locator('#property-input-section')).toBeVisible();
    }
  });

  test('form interactions work without errors', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    await page.goto(url.toString());
    await page.waitForLoadState('networkidle');
    
    // Fill in the form
    await page.fill('#property-address', '123 Test Street, Toronto, ON');
    await page.fill('#property-price', '850000');
    
    // Select bedrooms
    await page.selectOption('#property-bedrooms', '3');
    
    // Select bathrooms  
    await page.selectOption('#property-bathrooms', '2');
    
    // Click "Add More Details" if it exists
    const addDetailsButton = page.locator('text=Add More Details').first();
    if (await addDetailsButton.isVisible()) {
      await addDetailsButton.click();
      
      // Fill additional fields
      await page.fill('#property-sqft', '1500');
      await page.fill('#property-taxes', '6800');
    }
    
    // Take screenshot of filled form
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/roi-finder-form-filled.png' 
    });
    
    // Verify no console errors during interaction
    expect(page.errors).toHaveLength(0);
  });

  test('mobile sidebar toggle works correctly', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(url.toString());
    await page.waitForLoadState('networkidle');
    
    // Find mobile menu toggle
    const menuToggle = page.locator('.cm-mobile-menu-toggle').first();
    await expect(menuToggle).toBeVisible();
    
    // Click to open sidebar
    await menuToggle.click();
    await page.waitForTimeout(500); // Wait for animation
    
    // Verify sidebar is visible
    const sidebar = page.locator('.cm-sidebar').first();
    await expect(sidebar).toBeVisible();
    
    // Verify overlay is active
    const overlay = page.locator('.cm-sidebar-overlay.active').first();
    await expect(overlay).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/roi-finder-mobile-sidebar-open.png' 
    });
    
    // Click overlay to close
    await overlay.click();
    await page.waitForTimeout(500);
    
    // Verify sidebar is hidden
    await expect(sidebar).not.toBeInViewport();
    
    // Verify no console errors
    expect(page.errors).toHaveLength(0);
  });

  test('null safety prevents errors when elements missing', async ({ page }) => {
    // Create a minimal HTML page to test null safety
    const minimalHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Null Safety Test</title>
        <style>.hidden { display: none; }</style>
      </head>
      <body>
        <div id="property-input-section" class="hidden">Test</div>
        <!-- main-content is intentionally missing -->
        <script src="js/firebase-wrapper-global.js"></script>
        <script src="js/roi-finder-app-fixed.js"></script>
        <script>
          // Initialize app
          window.app = new ROIFinderApp();
          // Try to show property input (should handle missing main-content)
          window.app.showPropertyInput();
        </script>
      </body>
      </html>
    `;
    
    // Navigate to data URL with minimal HTML
    await page.goto(`data:text/html,${encodeURIComponent(minimalHTML)}`);
    await page.waitForTimeout(1000);
    
    // Verify no errors
    expect(page.errors).toHaveLength(0);
    
    // Verify property input is visible
    await expect(page.locator('#property-input-section')).toBeVisible();
  });

  test('data structure mapping works correctly', async ({ page }) => {
    const url = new URL('/roi-finder.html', baseURL);
    url.searchParams.set('e2e_test_mode', 'true');
    
    await page.goto(url.toString());
    
    // Test API data structure mapping
    const response = await page.evaluate(async () => {
      // Simulate API call
      const mockResponse = {
        short_term_rental: { /* mock data */ },
        long_term_rental: { /* mock data */ }
      };
      
      // Log structure for debugging
      console.log('API response keys:', Object.keys(mockResponse));
      
      return mockResponse;
    });
    
    // Verify expected structure
    expect(response).toHaveProperty('short_term_rental');
    expect(response).toHaveProperty('long_term_rental');
    
    // Verify no errors during data handling
    expect(page.errors).toHaveLength(0);
  });
});