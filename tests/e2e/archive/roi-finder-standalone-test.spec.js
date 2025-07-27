const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('ROI Finder Standalone JavaScript Testing', () => {
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

    // Load the ROI Finder HTML file directly
    const htmlPath = path.join(__dirname, '../../roi-finder.html');
    await page.goto(`file://${htmlPath}`);
  });

  test('should load roi-finder.html without critical JavaScript errors', async () => {
    // Wait for page to load and scripts to execute
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Give time for all scripts to load

    console.log('\n=== CONSOLE OUTPUT ANALYSIS ===');
    console.log('Total Console Messages:', consoleMessages.length);
    console.log('Errors:', consoleErrors.length);
    console.log('Warnings:', consoleWarnings.length);

    // Filter for critical JavaScript errors (excluding Firebase/network errors)
    const criticalErrors = consoleErrors.filter(error => 
      (error.includes('SyntaxError') || 
       error.includes('has already been declared') ||
       error.includes('Identifier') ||
       error.includes('Unexpected token') ||
       error.includes('ReferenceError') ||
       error.includes('TypeError')) &&
      !error.includes('Failed to fetch') && // Exclude Firebase connection errors
      !error.includes('TypeError: Failed to fetch') // Exclude specific fetch errors
    );

    console.log('\nCRITICAL ERRORS FOUND:');
    criticalErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });

    // Check for duplicate variable errors specifically
    const duplicateVarErrors = consoleErrors.filter(error => 
      error.includes('confirmLtrBtn') || 
      error.includes('confirmStrBtn') ||
      error.includes('has already been declared')
    );

    console.log('\nDUPLICATE VARIABLE ERRORS:');
    duplicateVarErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });

    // Verify the page loaded correctly
    const title = await page.title();
    expect(title).toContain('ROI Finder');
    
    // Main test: No critical JavaScript errors should be present
    expect(criticalErrors.length).toBe(0);
  });

  test('should have required DOM elements present', async () => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for key elements
    const analyzeButton = page.locator('#analyze-btn');
    const loadingScreen = page.locator('#loading-screen');
    const confirmationScreen = page.locator('#confirmation-screen');
    const resultsScreen = page.locator('#results-screen');

    // Verify elements exist
    await expect(analyzeButton).toBeAttached();
    await expect(loadingScreen).toBeAttached();
    await expect(confirmationScreen).toBeAttached();
    await expect(resultsScreen).toBeAttached();

    console.log('✓ All required DOM elements are present');
  });

  test('should verify showView function works without errors', async () => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Test the showView function directly
    const result = await page.evaluate(() => {
      const results = [];
      
      try {
        // Test if showView function exists
        if (typeof showView === 'function') {
          results.push('showView function exists');
          
          // Test switching to different views
          showView('loading');
          results.push('loading view switched successfully');
          
          showView('confirmation');
          results.push('confirmation view switched successfully');
          
          showView('results');
          results.push('results view switched successfully');
          
          return { success: true, results };
        } else {
          return { success: false, error: 'showView function not found' };
        }
      } catch (error) {
        return { success: false, error: error.message, results };
      }
    });

    console.log('ShowView Function Test Results:', result);
    
    if (!result.success) {
      console.log('Error:', result.error);
    }

    expect(result.success).toBeTruthy();
  });

  test('should verify confirmation mode buttons are properly defined', async () => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Test for duplicate variable declarations in confirmation buttons
    const buttonTest = await page.evaluate(() => {
      const results = {
        globalScope: {},
        confirmationScope: {},
        errors: []
      };

      try {
        // Show confirmation screen first
        if (typeof showView === 'function') {
          showView('confirmation');
        }

        // Check if buttons exist in DOM
        const confirmLtrBtn = document.getElementById('confirm-ltr-mode-btn');
        const confirmStrBtn = document.getElementById('confirm-str-mode-btn');
        
        results.globalScope.confirmLtrBtn = !!confirmLtrBtn;
        results.globalScope.confirmStrBtn = !!confirmStrBtn;

        // Test button functionality
        if (confirmLtrBtn) {
          confirmLtrBtn.click();
          results.confirmationScope.ltrClickable = true;
        }

        return { success: true, results };
      } catch (error) {
        results.errors.push(error.message);
        return { success: false, results };
      }
    });

    console.log('Confirmation Buttons Test:', buttonTest);

    // Should not have errors when interacting with buttons
    expect(buttonTest.results.errors.length).toBe(0);
  });

  test('should simulate analyze button click workflow', async () => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Fill out required form fields
    await page.fill('#address', '123 Main Street, Toronto, ON');
    await page.fill('#price', '850000');
    await page.fill('#property_tax_annual', '5490');
    await page.fill('#hoa_monthly', '650');
    await page.selectOption('#bedrooms', '2');
    await page.selectOption('#bathrooms', '2');

    // Mock the API endpoint to prevent actual requests
    await page.route('**/api/analyze-property', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { analysis: { cashFlow: 500 } }
        })
      });
    });

    // Test analyze button click
    const clickResult = await page.evaluate(() => {
      try {
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
          analyzeBtn.click();
          return { success: true, message: 'Analyze button clicked successfully' };
        } else {
          return { success: false, error: 'Analyze button not found' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('Analyze Button Click Result:', clickResult);
    expect(clickResult.success).toBeTruthy();

    // Wait for any transitions
    await page.waitForTimeout(1000);

    // Check if any JavaScript errors occurred during the click
    const postClickErrors = consoleErrors.filter(error => 
      !error.includes('Failed to fetch') && // Ignore network errors from mocked API
      !error.includes('net::ERR')
    );

    console.log('Post-click JavaScript errors:', postClickErrors);
    expect(postClickErrors.length).toBe(0);
  });

  test('should generate comprehensive test report', async () => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Generate final report
    const report = {
      timestamp: new Date().toISOString(),
      testSummary: {
        totalTests: 6,
        passedTests: 0, // Will be updated based on actual results
        failedTests: 0
      },
      jsAnalysis: {
        totalConsoleMessages: consoleMessages.length,
        errorCount: consoleErrors.length,
        warningCount: consoleWarnings.length,
        criticalErrors: consoleErrors.filter(error => 
          (error.includes('SyntaxError') || 
           error.includes('has already been declared') ||
           error.includes('ReferenceError') ||
           error.includes('TypeError')) &&
          !error.includes('Failed to fetch')
        ),
        duplicateVariableErrors: consoleErrors.filter(error => 
          error.includes('confirmLtrBtn') || 
          error.includes('confirmStrBtn')
        )
      },
      recommendations: [],
      allErrors: consoleErrors,
      allWarnings: consoleWarnings
    };

    // Add recommendations based on findings
    if (report.jsAnalysis.duplicateVariableErrors.length > 0) {
      report.recommendations.push('Fix duplicate variable declarations for confirmLtrBtn and confirmStrBtn');
    }

    if (report.jsAnalysis.criticalErrors.length > 0) {
      report.recommendations.push('Address critical JavaScript errors that prevent proper execution');
    }

    if (report.jsAnalysis.errorCount === 0) {
      report.recommendations.push('JavaScript is loading cleanly - good job!');
    }

    console.log('\n=== COMPREHENSIVE ROI FINDER TEST REPORT ===');
    console.log('Generated:', report.timestamp);
    console.log('\nJavaScript Analysis:');
    console.log('  Total Console Messages:', report.jsAnalysis.totalConsoleMessages);
    console.log('  Errors Found:', report.jsAnalysis.errorCount);
    console.log('  Warnings Found:', report.jsAnalysis.warningCount);
    console.log('  Critical Errors:', report.jsAnalysis.criticalErrors.length);
    console.log('  Duplicate Variable Errors:', report.jsAnalysis.duplicateVariableErrors.length);

    if (report.jsAnalysis.criticalErrors.length > 0) {
      console.log('\nCRITICAL ERRORS:');
      report.jsAnalysis.criticalErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log('\n=== END REPORT ===\n');

    // Test passes if no critical errors
    expect(report.jsAnalysis.criticalErrors.length).toBe(0);
  });
});