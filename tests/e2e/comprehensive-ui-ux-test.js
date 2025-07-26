const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  credentials: {
    email: 'amy__ali@hotmail.com',
    password: 'YFJ3-zSx'
  },
  property: {
    address: '123 King St W, Unit 2105, Toronto, ON M5H 1A1',
    price: '899000',
    bedrooms: '2',
    bathrooms: '2',
    squareFeet: '1100',
    propertyTaxes: '5400',
    condoFees: '650',
    propertyType: 'condo'
  },
  viewports: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 375, height: 812 }
  },
  timeout: 60000
};

// Create screenshots directory
const createScreenshotDir = async () => {
  const timestamp = new Date().toISOString().split('T')[0];
  const screenshotDir = path.join(__dirname, 'screenshots', 'comprehensive-ui-ux', timestamp);
  await fs.mkdir(screenshotDir, { recursive: true });
  return screenshotDir;
};

// Screenshot helper
async function captureScreenshot(page, name, dir) {
  const filename = `${name.replace(/\s+/g, '-').toLowerCase()}.png`;
  const filepath = path.join(dir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

// Wait and click helper
async function waitAndClick(page, selector, description) {
  try {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector);
    console.log(`✅ Clicked: ${description}`);
  } catch (error) {
    console.error(`❌ Failed to click ${description}: ${error.message}`);
    throw error;
  }
}

// Form fill helper
async function fillInput(page, selector, value, description) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector, { clickCount: 3 }); // Select all
    await page.type(selector, value);
    console.log(`✅ Filled: ${description} with "${value}"`);
  } catch (error) {
    console.error(`❌ Failed to fill ${description}: ${error.message}`);
    throw error;
  }
}

// Main test function
async function runComprehensiveUITest() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: TEST_CONFIG.viewports.desktop
  });

  const results = {
    timestamp: new Date().toISOString(),
    passed: [],
    failed: [],
    issues: {
      critical: [],
      high: [],
      medium: [],
      low: []
    }
  };

  try {
    const page = await browser.newPage();
    const screenshotDir = await createScreenshotDir();

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.issues.high.push(`Console Error: ${msg.text()}`);
      }
    });

    console.log('\n🚀 Starting Comprehensive UI/UX Test\n');

    // 1. LOGIN PROCESS
    console.log('📱 PHASE 1: Login Process\n');
    
    await page.goto(`${TEST_CONFIG.baseUrl}/roi-finder.html`, { waitUntil: 'networkidle2' });
    await captureScreenshot(page, '01-initial-page-load', screenshotDir);

    // Check if already logged in or need to show login form
    const loginSection = await page.$('#login-section');
    const propertyForm = await page.$('#propertyForm');
    
    if (!loginSection) {
      results.issues.critical.push('Login section not found on page');
      throw new Error('Login section missing');
    }
    
    // Check if login section is hidden (user might be already logged in)
    const isLoginHidden = await page.evaluate(() => {
      const section = document.querySelector('#login-section');
      return section && section.classList.contains('hidden');
    });
    
    if (isLoginHidden) {
      console.log('Login section is hidden - checking if already authenticated...');
      
      // Check if property form is visible (indicating user is logged in)
      const isPropertyFormVisible = await page.evaluate(() => {
        const form = document.querySelector('#propertyForm');
        return form && !form.classList.contains('hidden');
      });
      
      if (isPropertyFormVisible) {
        console.log('User appears to be already logged in');
        results.passed.push('Already authenticated - skipping login');
        await captureScreenshot(page, '01-already-logged-in', screenshotDir);
      } else {
        // Need to make login section visible
        await page.evaluate(() => {
          const loginSection = document.querySelector('#login-section');
          if (loginSection) loginSection.classList.remove('hidden');
        });
        await captureScreenshot(page, '01-login-section-shown', screenshotDir);
      }
    }

    // Only proceed with login if not already authenticated
    const needsLogin = await page.evaluate(() => {
      const loginSection = document.querySelector('#login-section');
      return loginSection && !loginSection.classList.contains('hidden');
    });
    
    if (needsLogin) {
      // Fill login credentials
      await fillInput(page, '#login-email', TEST_CONFIG.credentials.email, 'Email');
      await fillInput(page, '#login-password', TEST_CONFIG.credentials.password, 'Password');
      
      await captureScreenshot(page, '02-login-filled', screenshotDir);

      // Submit login - find the login button within login section
      const loginButton = await page.$('#login-section button[type="submit"], #loginBtn');
      if (loginButton) {
        await loginButton.click();
        console.log('✅ Clicked: Login button');
      } else {
        results.issues.critical.push('Login button not found');
        throw new Error('Cannot find login button');
      }

      // Wait for authentication - login section should be hidden
      await page.waitForFunction(
        () => {
          const loginSection = document.querySelector('#login-section');
          return loginSection && loginSection.classList.contains('hidden');
        },
        { timeout: 10000 }
      );

      await captureScreenshot(page, '03-logged-in', screenshotDir);
      results.passed.push('Login process completed successfully');
    }

    // 2. PROPERTY ANALYSIS FORM
    console.log('\n🏠 PHASE 2: Property Analysis Form\n');

    // Check if form is visible
    const formVisible = await page.$('#property-analysis-form') !== null;
    if (!formVisible) {
      results.issues.critical.push('Property form not visible after login');
    } else {
      results.passed.push('Property form loaded successfully');
    }

    // Fill property details
    await fillInput(page, '#property-address', TEST_CONFIG.property.address, 'Address');
    await fillInput(page, '#property-price', TEST_CONFIG.property.price, 'Price');
    
    // Select bedrooms and bathrooms
    await page.select('#property-bedrooms', TEST_CONFIG.property.bedrooms);
    console.log(`✅ Selected: ${TEST_CONFIG.property.bedrooms} bedrooms`);
    
    await page.select('#property-bathrooms', TEST_CONFIG.property.bathrooms);
    console.log(`✅ Selected: ${TEST_CONFIG.property.bathrooms} bathrooms`);
    
    // Click "Add More Details" to reveal optional fields
    const moreDetailsLink = await page.$('[onclick="toggleOptionalFields()"]');
    if (moreDetailsLink) {
      await moreDetailsLink.click();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for animation
      console.log('✅ Expanded optional details section');
    } else {
      console.log('Could not find Add More Details button');
    }
    
    // Fill optional fields if they exist
    try {
      await fillInput(page, '#property-sqft', TEST_CONFIG.property.squareFeet, 'Square Feet');
    } catch (e) {
      console.log('Square feet field not available');
    }
    
    try {
      await fillInput(page, '#property-taxes', TEST_CONFIG.property.propertyTaxes, 'Property Taxes');
    } catch (e) {
      console.log('Property taxes field not available');
    }
    
    try {
      await fillInput(page, '#property-condofees', TEST_CONFIG.property.condoFees, 'Condo Fees');
    } catch (e) {
      console.log('Condo fees field not available');
    }

    // Select property type if available
    try {
      await page.select('#property-type', TEST_CONFIG.property.propertyType);
      console.log(`✅ Selected: ${TEST_CONFIG.property.propertyType} property type`);
    } catch (e) {
      console.log('Property type field not available');
    }

    await captureScreenshot(page, '04-form-filled', screenshotDir);

    // Test form validation
    console.log('Testing form validation...');
    
    try {
      // Clear a required field and try to submit
      await page.evaluate(() => {
        const priceInput = document.querySelector('#property-price');
        if (priceInput) {
          priceInput.value = '';
          priceInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      // Try to submit form
      const submitButton = await page.$('#property-analysis-form button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
      }
      
      // Check if we're still on the form (validation prevented submission)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const stillOnForm = await page.evaluate(() => {
        const form = document.querySelector('#property-analysis-form');
        return form && !form.classList.contains('hidden');
      });
      
      if (stillOnForm) {
        results.passed.push('Form validation working correctly');
      } else {
        results.issues.medium.push('Form validation not preventing submission with empty required fields');
      }
      
      // Restore price
      await page.evaluate((price) => {
        const priceInput = document.querySelector('#property-price');
        if (priceInput) {
          priceInput.value = price;
          priceInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, TEST_CONFIG.property.price);
      
    } catch (error) {
      console.log('Form validation test skipped due to error:', error.message);
      results.issues.low.push('Could not fully test form validation');
    }
    
    await captureScreenshot(page, '05-form-ready-to-submit', screenshotDir);

    // Submit form
    await waitAndClick(page, '#property-analysis-form button[type="submit"]', 'Analyze button');

    // Wait for results
    console.log('Waiting for analysis results...');
    try {
      await page.waitForSelector('#analysis-results', { 
        visible: true,
        timeout: 30000 
      });
      
      // Wait a bit for content to fully render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await captureScreenshot(page, '06-results-loaded', screenshotDir);
      results.passed.push('Analysis results loaded successfully');
    } catch (error) {
      results.issues.critical.push('Results section did not load within 30 seconds');
      await captureScreenshot(page, '06-results-timeout', screenshotDir);
    }

    // 3. ANALYSIS RESULTS - TEST ALL TABS
    console.log('\n📊 PHASE 3: Analysis Results - All Tabs\n');

    // Test LTR Tab
    console.log('Testing Long Term Rental Tab...');
    const ltrTab = await page.$('#ltr-tab');
    if (ltrTab) {
      await ltrTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await captureScreenshot(page, '07-ltr-tab', screenshotDir);

      // Check if LTR content is visible
      const ltrContentVisible = await page.evaluate(() => {
        const content = document.querySelector('#ltr-content');
        return content && !content.classList.contains('hidden');
      });

      if (ltrContentVisible) {
        results.passed.push('LTR tab switching works correctly');
        
        // Check for key LTR elements in the content
        const ltrElements = {
          'Rental Income': '.rental-income, [data-ltr-income]',
          'Monthly Expenses': '.monthly-expenses, [data-ltr-expenses]',
          'Cash Flow': '.cash-flow, [data-ltr-cashflow]',
          'Financial Summary': '.financial-summary, .ltr-summary'
        };

        for (const [name, selector] of Object.entries(ltrElements)) {
          const element = await page.$(`#ltr-content ${selector}`);
          if (!element) {
            results.issues.medium.push(`LTR Tab: ${name} element not found`);
          } else {
            console.log(`✅ LTR Tab has ${name}`);
          }
        }
      } else {
        results.issues.high.push('LTR content not visible after clicking tab');
      }
    } else {
      results.issues.critical.push('LTR Tab button not found');
    }

    // Test STR Tab
    console.log('\nTesting Short Term Rental Tab...');
    const strTab = await page.$('#str-tab');
    if (strTab) {
      await strTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await captureScreenshot(page, '08-str-tab', screenshotDir);

      // Check if STR content is visible
      const strContentVisible = await page.evaluate(() => {
        const content = document.querySelector('#str-content');
        return content && !content.classList.contains('hidden');
      });

      if (strContentVisible) {
        results.passed.push('STR tab switching works correctly');
        
        // Check for STR elements
        const strElements = {
          'Airbnb Hero Section': '.airbnb-hero, .str-hero-section',
          'Revenue Projections': '.revenue-projection, [data-str-revenue]',
          'Occupancy Analysis': '.occupancy-analysis, [data-str-occupancy]',
          'Comparable Listings': '.comparable-listings, .str-comparables'
        };

        for (const [name, selector] of Object.entries(strElements)) {
          const element = await page.$(`#str-content ${selector}`);
          if (!element) {
            results.issues.medium.push(`STR Tab: ${name} element not found`);
          } else {
            console.log(`✅ STR Tab has ${name}`);
          }
        }
      } else {
        results.issues.high.push('STR content not visible after clicking tab');
      }
    } else {
      results.issues.critical.push('STR Tab button not found');
    }

    // Test Investment Analysis Tab
    console.log('\nTesting Investment Analysis Tab...');
    const investmentTab = await page.$('#investment-tab');
    if (investmentTab) {
      await investmentTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await captureScreenshot(page, '09-investment-tab', screenshotDir);

      // Check if investment content is visible
      const investmentContentVisible = await page.evaluate(() => {
        const content = document.querySelector('#investment-content');
        return content && !content.classList.contains('hidden');
      });

      if (investmentContentVisible) {
        results.passed.push('Investment tab switching works correctly');
        
        // Check for investment elements
        const investmentElements = {
          'Investment Summary': '.investment-summary, [data-investment-summary]',
          'ROI Calculations': '.roi-calculations, [data-roi]',
          'Financial Charts': '.financial-charts, canvas',
          'Investment Metrics': '.investment-metrics, .metrics-grid'
        };

        for (const [name, selector] of Object.entries(investmentElements)) {
          const element = await page.$(`#investment-content ${selector}`);
          if (!element) {
            results.issues.medium.push(`Investment Tab: ${name} element not found`);
          } else {
            console.log(`✅ Investment Tab has ${name}`);
          }
        }
      } else {
        results.issues.high.push('Investment content not visible after clicking tab');
      }
    } else {
      results.issues.critical.push('Investment Tab button not found');
    }

    // 4. UI/UX TESTING
    console.log('\n🎨 PHASE 4: UI/UX Testing\n');

    // Test all buttons
    console.log('Testing interactive elements...');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons to test`);

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const buttonText = await button.evaluate(el => el.textContent);
      const isDisabled = await button.evaluate(el => el.disabled);
      
      if (!isDisabled && buttonText && !buttonText.includes('Sign Out')) {
        try {
          await button.hover();
          const hasHoverEffect = await button.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.cursor === 'pointer';
          });
          
          if (!hasHoverEffect) {
            results.issues.low.push(`Button "${buttonText}" missing hover cursor`);
          }
        } catch (e) {
          // Button might have been removed from DOM
        }
      }
    }

    // Test mobile responsiveness
    console.log('\nTesting mobile responsiveness...');
    await page.setViewport(TEST_CONFIG.viewports.mobile);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await captureScreenshot(page, '10-mobile-view', screenshotDir);

    // Check if mobile menu exists
    const mobileMenu = await page.$('.mobile-menu, .hamburger-menu, [data-mobile-menu]');
    if (!mobileMenu && (await page.$$('nav')).length > 0) {
      results.issues.medium.push('No mobile menu found for navigation');
    }

    // Return to desktop view
    await page.setViewport(TEST_CONFIG.viewports.desktop);

    // 5. FUNCTIONALITY TESTING
    console.log('\n⚡ PHASE 5: Functionality Testing\n');

    // Test PDF download
    console.log('Testing PDF download...');
    const downloadBtn = await page.$('#downloadReportBtn, #downloadPDF, [onclick*="downloadReport"], button:has-text("Download Report")');
    if (downloadBtn) {
      // Set up download handling
      const downloadPath = path.join(screenshotDir, 'downloads');
      await fs.mkdir(downloadPath, { recursive: true });
      
      const client = await page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
      });

      await downloadBtn.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const files = await fs.readdir(downloadPath);
      if (files.length > 0) {
        results.passed.push('PDF download functionality working');
      } else {
        results.issues.high.push('PDF download failed - no file created');
      }
    } else {
      results.issues.medium.push('PDF download button not found');
    }

    // Test print functionality
    console.log('Testing print functionality...');
    const printBtn = await page.$('#printReport, [data-action="print"], button:has-text("Print")');
    if (printBtn) {
      // Intercept print dialog
      await page.evaluateOnNewDocument(() => {
        window.print = () => {
          window.printCalled = true;
        };
      });
      
      await printBtn.click();
      
      const printCalled = await page.evaluate(() => window.printCalled);
      if (printCalled) {
        results.passed.push('Print functionality triggered successfully');
      }
    } else {
      results.issues.low.push('Print button not found');
    }

    // 6. ERROR SCENARIOS
    console.log('\n🚨 PHASE 6: Error Scenario Testing\n');

    // Test with invalid data
    console.log('Testing error handling...');
    
    // Navigate back to form
    await page.goto(`${TEST_CONFIG.baseUrl}/roi-finder.html`, { waitUntil: 'networkidle2' });
    
    // Wait for property form to be visible
    await page.waitForSelector('#property-analysis-form', { timeout: 5000 });
    
    // Try to submit with negative price
    await fillInput(page, '#property-price', '-1000', 'Negative price');
    await page.click('#property-analysis-form button[type="submit"]');
    
    const errorMessage = await page.$('.error-message, [role="alert"], .alert-danger');
    if (errorMessage) {
      results.passed.push('Error handling for invalid data working');
      await captureScreenshot(page, '11-error-handling', screenshotDir);
    } else {
      results.issues.medium.push('No error message shown for invalid data');
    }

    // Generate final report
    console.log('\n📝 Generating Test Report...\n');

    const report = {
      ...results,
      summary: {
        total: results.passed.length + results.failed.length,
        passed: results.passed.length,
        failed: results.failed.length,
        criticalIssues: results.issues.critical.length,
        highIssues: results.issues.high.length,
        mediumIssues: results.issues.medium.length,
        lowIssues: results.issues.low.length
      },
      screenshotDir
    };

    // Save report
    const reportPath = path.join(screenshotDir, 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('=' * 60);
    console.log('TEST SUMMARY');
    console.log('=' * 60);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`\n🚨 Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`⚠️  High Issues: ${report.summary.highIssues}`);
    console.log(`📌 Medium Issues: ${report.summary.mediumIssues}`);
    console.log(`💡 Low Issues: ${report.summary.lowIssues}`);
    console.log(`\n📸 Screenshots saved to: ${screenshotDir}`);

    // Print detailed issues
    if (results.issues.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      results.issues.critical.forEach(issue => console.log(`  - ${issue}`));
    }

    if (results.issues.high.length > 0) {
      console.log('\n⚠️  HIGH PRIORITY ISSUES:');
      results.issues.high.forEach(issue => console.log(`  - ${issue}`));
    }

    if (results.issues.medium.length > 0) {
      console.log('\n📌 MEDIUM PRIORITY ISSUES:');
      results.issues.medium.forEach(issue => console.log(`  - ${issue}`));
    }

    if (results.issues.low.length > 0) {
      console.log('\n💡 LOW PRIORITY ISSUES:');
      results.issues.low.forEach(issue => console.log(`  - ${issue}`));
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    results.failed.push(`Test execution failed: ${error.message}`);
    results.issues.critical.push(`Test framework error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run the test
runComprehensiveUITest().catch(console.error);