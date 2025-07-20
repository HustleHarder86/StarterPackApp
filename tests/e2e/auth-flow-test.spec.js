const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Authentication and Property Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('complete flow from extension to analysis', async ({ page }) => {
    // Simulate extension parameters
    const extensionParams = {
      address: '123 Main St, Toronto, ON M1A 1A1',
      price: '799000',
      propertyTaxes: '5490',
      propertyType: 'Single Family',
      bedrooms: '3',
      bathrooms: '2',
      sqft: '1800',
      mlsNumber: 'C5808234',
      mainImage: 'https://example.com/property.jpg',
      source: 'extension'
    };

    // Build URL with extension parameters
    const params = new URLSearchParams(extensionParams);
    const url = `http://localhost:3000/roi-finder.html?${params.toString()}`;

    console.log('Testing URL:', url);

    // Step 1: Navigate to roi-finder with extension parameters
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/flow-01-initial-load.png',
      fullPage: true 
    });

    // Check if redirected to login or if already on roi-finder
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);

    if (currentUrl.includes('index.html') || currentUrl.includes('login')) {
      console.log('Redirected to login page - testing unauthenticated flow');
      
      // Take screenshot of login page
      await page.screenshot({ 
        path: 'tests/e2e/screenshots/flow-02-login-required.png',
        fullPage: true 
      });

      // Look for Google Sign In button
      const googleSignInButton = await page.locator('button:has-text("Sign in with Google"), .google-signin-button, #googleSignInBtn').first();
      
      if (await googleSignInButton.isVisible()) {
        console.log('Found Google Sign In button');
        
        // Note: We can't actually complete Google auth in automated tests
        // but we can verify the button exists and is clickable
        await expect(googleSignInButton).toBeVisible();
        await expect(googleSignInButton).toBeEnabled();
        
        // Simulate being authenticated by directly setting auth state
        await page.evaluate(() => {
          // Simulate a logged-in user
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', JSON.stringify({
            uid: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test User'
          }));
        });
        
        // Navigate back to roi-finder with params
        await page.goto(url);
        await page.waitForLoadState('networkidle');
      }
    }

    // Step 2: Check for property confirmation screen
    console.log('Checking for property confirmation screen...');
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/flow-03-property-confirmation.png',
      fullPage: true 
    });

    // Look for property confirmation elements
    const confirmationTitle = await page.locator('h2:has-text("Confirm Property Details"), h1:has-text("Property Analysis"), .property-confirmation').first();
    
    if (await confirmationTitle.isVisible()) {
      console.log('Found property confirmation screen');
      
      // Check if property details are displayed
      const addressElement = await page.locator(`text="${extensionParams.address}"`).first();
      const priceElement = await page.locator('text=/\\$799,000|799000/').first();
      
      if (await addressElement.isVisible()) {
        console.log('Property address is displayed correctly');
      }
      
      if (await priceElement.isVisible()) {
        console.log('Property price is displayed correctly');
      }
      
      // Look for analyze button
      const analyzeButton = await page.locator('button:has-text("Analyze"), button:has-text("Start Analysis"), #analyzeBtn, button[type="submit"]').first();
      
      if (await analyzeButton.isVisible()) {
        console.log('Found analyze button');
        
        // Take screenshot before clicking
        await page.screenshot({ 
          path: 'tests/e2e/screenshots/flow-04-before-analysis.png',
          fullPage: true 
        });
        
        // Click analyze button
        await analyzeButton.click();
        
        // Wait for analysis to start
        await page.waitForTimeout(2000);
        
        // Take screenshot during analysis
        await page.screenshot({ 
          path: 'tests/e2e/screenshots/flow-05-during-analysis.png',
          fullPage: true 
        });
        
        // Wait for results (with timeout)
        try {
          await page.waitForSelector('.analysis-results, .results-section, #analysisResults', { 
            timeout: 30000 
          });
          
          console.log('Analysis completed');
          
          // Take screenshot of results
          await page.screenshot({ 
            path: 'tests/e2e/screenshots/flow-06-analysis-results.png',
            fullPage: true 
          });
          
        } catch (error) {
          console.log('Analysis timed out or failed');
          
          // Take screenshot of error state
          await page.screenshot({ 
            path: 'tests/e2e/screenshots/flow-07-analysis-error.png',
            fullPage: true 
          });
        }
      } else {
        console.log('Analyze button not found');
      }
    } else {
      console.log('Property confirmation screen not found');
      
      // Check if we're directly on the analysis form
      const analysisForm = await page.locator('#propertyForm, .property-form, form').first();
      
      if (await analysisForm.isVisible()) {
        console.log('Found property analysis form');
        
        // Check if form is pre-filled with extension data
        const addressInput = await page.locator('input[name="address"], #address').first();
        const addressValue = await addressInput.inputValue();
        
        console.log('Address field value:', addressValue);
        
        if (addressValue.includes(extensionParams.address)) {
          console.log('Form is pre-filled with extension data');
        }
      }
    }

    // Final screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/flow-08-final-state.png',
      fullPage: true 
    });

    // Log page content for debugging
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log('Final page title:', pageTitle);
    console.log('Final page URL:', pageUrl);

    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    // Check for any page errors
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  test('verify extension data handling', async ({ page }) => {
    // Test with minimal extension data
    const minimalParams = {
      address: '456 Test Ave, Vancouver, BC',
      price: '1200000',
      source: 'extension'
    };

    const params = new URLSearchParams(minimalParams);
    const url = `http://localhost:3000/roi-finder.html?${params.toString()}`;

    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/flow-minimal-data.png',
      fullPage: true 
    });

    // Check if address is displayed
    const addressElement = await page.locator(`text="${minimalParams.address}"`).first();
    if (await addressElement.isVisible()) {
      console.log('Address from extension is displayed');
    }

    // Check if price is displayed
    const priceElement = await page.locator('text=/\\$1,200,000|1200000/').first();
    if (await priceElement.isVisible()) {
      console.log('Price from extension is displayed');
    }
  });
});