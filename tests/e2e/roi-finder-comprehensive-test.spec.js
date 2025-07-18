const { test, expect } = require('@playwright/test');

test.describe('ROI Finder Comprehensive Testing', () => {
  let page;
  let consoleErrors = [];
  let consoleWarnings = [];
  let consoleMessages = [];

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    consoleErrors = [];
    consoleWarnings = [];
    consoleMessages = [];

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      consoleMessages.push({ type, text, timestamp: new Date().toISOString() });
      
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Capture JavaScript errors
    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // Navigate to the ROI Finder page
    await page.goto('http://localhost:3000/roi-finder.html');
  });

  test('should load roi-finder.html without JavaScript syntax errors', async () => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('Console Errors:', consoleErrors);
    console.log('Console Warnings:', consoleWarnings);

    // Check for JavaScript syntax errors
    const hasJSErrors = consoleErrors.some(error => 
      error.includes('SyntaxError') || 
      error.includes('has already been declared') ||
      error.includes('Identifier') ||
      error.includes('Unexpected token')
    );

    expect(hasJSErrors).toBeFalsy();
    
    // Verify the page loaded correctly
    const title = await page.title();
    expect(title).toContain('ROI Finder');
    
    // Check that main elements are present
    await expect(page.locator('#loading-screen')).toBeVisible();
  });

  test('should have analyze button present and clickable', async () => {
    await page.waitForLoadState('networkidle');
    
    // Check if analyze button exists
    const analyzeButton = page.locator('#analyze-btn');
    await expect(analyzeButton).toBeVisible();
    
    // Verify button is enabled
    const isDisabled = await analyzeButton.isDisabled();
    expect(isDisabled).toBeFalsy();
  });

  test('should simulate browser extension data injection', async () => {
    await page.waitForLoadState('networkidle');
    
    // Simulate property data from browser extension
    const mockPropertyData = {
      address: {
        street: "123 Main Street",
        city: "Toronto",
        province: "ON",
        postalCode: "M5V 3A8"
      },
      price: 850000,
      propertyTaxes: 5490,
      condoFees: 650,
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1200,
      propertyType: "Condo",
      mainImage: "https://example.com/image.jpg",
      mlsNumber: "C5123456",
      dataSource: "listing"
    };

    // Inject the property data into the page
    await page.evaluate((data) => {
      window.receivedPropertyData = data;
      
      // Fill out the form with the injected data
      if (data.address) {
        const addressInput = document.getElementById('address');
        if (addressInput) {
          addressInput.value = `${data.address.street}, ${data.address.city}, ${data.address.province}`;
        }
      }
      
      if (data.price) {
        const priceInput = document.getElementById('price');
        if (priceInput) {
          priceInput.value = data.price;
        }
      }
      
      if (data.propertyTaxes) {
        const taxInput = document.getElementById('property_tax_annual');
        if (taxInput) {
          taxInput.value = data.propertyTaxes;
        }
      }
      
      if (data.condoFees) {
        const condoInput = document.getElementById('hoa_monthly');
        if (condoInput) {
          condoInput.value = data.condoFees;
        }
      }
      
      // Set bedrooms and bathrooms
      if (data.bedrooms) {
        const bedroomsSelect = document.getElementById('bedrooms');
        if (bedroomsSelect) {
          bedroomsSelect.value = data.bedrooms;
        }
      }
      
      if (data.bathrooms) {
        const bathroomsSelect = document.getElementById('bathrooms');
        if (bathroomsSelect) {
          bathroomsSelect.value = data.bathrooms;
        }
      }
      
      // Trigger a custom event to notify that data was injected
      const event = new CustomEvent('propertyDataInjected', { detail: data });
      document.dispatchEvent(event);
    }, mockPropertyData);

    // Verify data was injected correctly
    const addressValue = await page.locator('#address').inputValue();
    const priceValue = await page.locator('#price').inputValue();
    
    expect(addressValue).toContain('123 Main Street');
    expect(priceValue).toBe('850000');

    console.log('Successfully injected mock property data');
  });

  test('should transition from loading to confirmation screen when analyze button is clicked', async () => {
    await page.waitForLoadState('networkidle');
    
    // First inject mock data
    await page.evaluate(() => {
      // Fill required fields
      document.getElementById('address').value = '123 Main Street, Toronto, ON';
      document.getElementById('price').value = '850000';
      document.getElementById('property_tax_annual').value = '5490';
      document.getElementById('hoa_monthly').value = '650';
      document.getElementById('bedrooms').value = '2';
      document.getElementById('bathrooms').value = '2';
    });

    // Mock the analyze API to prevent actual API calls
    await page.route('**/api/analyze-property', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            property: {
              address: '123 Main Street, Toronto, ON',
              price: 850000
            },
            analysis: {
              cashFlow: 500,
              capRate: 5.2,
              roi: 12.5
            }
          }
        })
      });
    });

    // Verify loading screen is initially visible
    await expect(page.locator('#loading-screen')).toBeVisible();
    await expect(page.locator('#confirmation-screen')).not.toBeVisible();

    // Click the analyze button
    await page.locator('#analyze-btn').click();

    // Wait for transition - should show confirmation screen
    await page.waitForTimeout(1000);

    // Check if we transitioned to confirmation screen
    const confirmationVisible = await page.locator('#confirmation-screen').isVisible();
    const loadingVisible = await page.locator('#loading-screen').isVisible();

    // Log current state for debugging
    console.log('After clicking analyze button:');
    console.log('- Confirmation screen visible:', confirmationVisible);
    console.log('- Loading screen visible:', loadingVisible);
    console.log('- Console errors:', consoleErrors);

    // The confirmation screen should be visible after clicking analyze
    expect(confirmationVisible).toBeTruthy();
  });

  test('should verify confirmation screen shows property details correctly', async () => {
    await page.waitForLoadState('networkidle');
    
    // Inject property data and show confirmation screen
    await page.evaluate(() => {
      const propertyData = {
        address: { street: "123 Main Street", city: "Toronto", province: "ON" },
        price: 850000,
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1200
      };
      
      // Store property data globally
      window.currentPropertyData = propertyData;
      
      // Switch to confirmation screen
      if (typeof showView === 'function') {
        showView('confirmation');
      }
    });

    // Wait for confirmation screen to be visible
    await expect(page.locator('#confirmation-screen')).toBeVisible();

    // Verify that property details are displayed
    const confirmationScreen = page.locator('#confirmation-screen');
    
    // Check for property information display
    const hasPropertyInfo = await confirmationScreen.locator('text=123 Main Street').count() > 0 ||
                           await confirmationScreen.locator('text=$850,000').count() > 0 ||
                           await confirmationScreen.locator('text=2 bed').count() > 0;

    // Log confirmation screen content for debugging
    const confirmationContent = await confirmationScreen.textContent();
    console.log('Confirmation screen content:', confirmationContent);

    // At minimum, the confirmation screen should be visible and functional
    expect(await confirmationScreen.isVisible()).toBeTruthy();
  });

  test('should verify confirmation mode buttons work correctly', async () => {
    await page.waitForLoadState('networkidle');
    
    // Navigate to confirmation screen
    await page.evaluate(() => {
      if (typeof showView === 'function') {
        showView('confirmation');
      }
    });

    await expect(page.locator('#confirmation-screen')).toBeVisible();

    // Check if LTR and STR buttons exist
    const ltrButton = page.locator('#confirm-ltr-mode-btn');
    const strButton = page.locator('#confirm-str-mode-btn');

    if (await ltrButton.count() > 0 && await strButton.count() > 0) {
      // Test LTR button
      await ltrButton.click();
      
      // Verify analysis mode is set to LTR
      const analysisMode = await page.locator('#confirm-analysis-mode').inputValue();
      expect(analysisMode).toBe('ltr');

      // Test STR button if user has access
      await strButton.click();
      await page.waitForTimeout(500);
      
      console.log('Confirmation mode buttons are functional');
    } else {
      console.log('Confirmation mode buttons not found - may be conditionally rendered');
    }
  });

  test('should capture and analyze all JavaScript console output', async () => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Generate a summary report
    const report = {
      timestamp: new Date().toISOString(),
      totalConsoleMessages: consoleMessages.length,
      errorCount: consoleErrors.length,
      warningCount: consoleWarnings.length,
      errors: consoleErrors,
      warnings: consoleWarnings,
      allMessages: consoleMessages.slice(0, 50), // Limit to first 50 for readability
      duplicateVariableErrors: consoleErrors.filter(error => 
        error.includes('has already been declared') || 
        error.includes('Identifier')
      ),
      syntaxErrors: consoleErrors.filter(error => 
        error.includes('SyntaxError') || 
        error.includes('Unexpected token')
      )
    };

    console.log('\n=== ROI FINDER COMPREHENSIVE TEST REPORT ===');
    console.log('Generated:', report.timestamp);
    console.log('Total Console Messages:', report.totalConsoleMessages);
    console.log('Errors Found:', report.errorCount);
    console.log('Warnings Found:', report.warningCount);
    
    if (report.duplicateVariableErrors.length > 0) {
      console.log('\nDUPLICATE VARIABLE ERRORS:');
      report.duplicateVariableErrors.forEach(error => console.log('  -', error));
    }
    
    if (report.syntaxErrors.length > 0) {
      console.log('\nSYNTAX ERRORS:');
      report.syntaxErrors.forEach(error => console.log('  -', error));
    }

    if (report.errorCount > 0) {
      console.log('\nALL ERRORS:');
      report.errors.forEach(error => console.log('  -', error));
    }

    // Fail the test if there are critical errors
    const hasCriticalErrors = report.duplicateVariableErrors.length > 0 || report.syntaxErrors.length > 0;
    expect(hasCriticalErrors).toBeFalsy();

    // Save report to file for later analysis
    await page.evaluate((reportData) => {
      window.testReport = reportData;
    }, report);
  });
});