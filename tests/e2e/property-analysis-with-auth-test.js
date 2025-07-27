const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const TEST_URL = 'https://starter-pack-app.vercel.app/roi-finder.html';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'property-analysis-auth-test', new Date().toISOString().replace(/:/g, '-').split('.')[0]);

// Test credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!@#',
  fullName: 'Test User'
};

// Test data
const TEST_PROPERTY = {
  address: '123 Test Street, Toronto, ON M5V 3A8',
  price: '750000',
  bedrooms: '2',
  bathrooms: '2',
  squareFeet: '1200',
  propertyTaxes: '6000',
  condoFees: '500'
};

// Helper function to wait
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to create screenshot directory
async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    console.log(`📁 Screenshot directory created: ${SCREENSHOT_DIR}`);
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }
}

// Helper function to take screenshot with error handling
async function takeScreenshot(page, name, description) {
  try {
    const filename = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${name}.png - ${description}`);
    return filename;
  } catch (error) {
    console.error(`❌ Failed to take screenshot ${name}:`, error.message);
  }
}

// Helper function to wait and check for elements
async function waitForElement(page, selector, timeout = 30000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`❌ Element not found: ${selector}`);
    return false;
  }
}

// Helper function to check for JavaScript errors
function setupErrorLogging(page) {
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore some common benign errors
      if (!text.includes('favicon.ico') && !text.includes('manifest.json')) {
        errors.push(text);
        console.error('🚨 Console Error:', text);
      }
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('🚨 Page Error:', error.message);
  });
  
  return errors;
}

// Helper function to handle authentication
async function handleAuthentication(page) {
  console.log('\n🔐 Handling authentication...');
  
  try {
    // Check if we're on the login page
    const hasLoginForm = await page.$('#auth-form') !== null;
    
    if (hasLoginForm) {
      console.log('  📝 Login form detected');
      
      // Check if there's a "Create Account" tab/button and click it
      const createAccountTab = await page.$('[role="tab"]:has-text("Create Account"), button:has-text("Create Account")');
      if (createAccountTab) {
        await createAccountTab.click();
        await new Promise(r => setTimeout(r, 1000));
        console.log('  📝 Switched to Create Account');
        
        // Fill registration form
        await page.type('input[name="fullName"], input[placeholder*="full name"]', TEST_USER.fullName);
        await page.type('input[name="email"], input[type="email"]', TEST_USER.email);
        await page.type('input[name="password"], input[type="password"]', TEST_USER.password);
        
        // Submit registration
        await page.click('button[type="submit"]');
        console.log('  📤 Registration form submitted');
      } else {
        // Try to login
        console.log('  📝 Attempting login');
        await page.type('input[name="email"], input[type="email"]', TEST_USER.email);
        await page.type('input[name="password"], input[type="password"]', TEST_USER.password);
        
        // Submit login
        await page.click('button[type="submit"]');
        console.log('  📤 Login form submitted');
      }
      
      // Wait for navigation or form to disappear
      await wait(3000);
      
      // Check if we're still on auth page
      const stillOnAuth = await page.$('#auth-form') !== null;
      if (!stillOnAuth) {
        console.log('  ✅ Authentication successful');
        return true;
      } else {
        console.log('  ⚠️ Still on authentication page');
        return false;
      }
    } else {
      console.log('  ✅ Already authenticated or no auth required');
      return true;
    }
  } catch (error) {
    console.error('  ❌ Authentication failed:', error.message);
    return false;
  }
}

// Main test function
async function runPropertyAnalysisTest() {
  console.log('🚀 Starting Property Analysis Comprehensive Test (with Auth)');
  console.log('================================================\n');
  
  let browser;
  const testResults = {
    timestamp: new Date().toISOString(),
    url: TEST_URL,
    testData: TEST_PROPERTY,
    results: {
      pageLoad: false,
      authentication: false,
      formVisible: false,
      formFill: false,
      formSubmit: false,
      analysisComplete: false,
      tabs: {
        overview: { loaded: false, hasContent: false, errors: [] },
        longTermRental: { loaded: false, hasContent: false, hasCharts: false, errors: [] },
        investmentAnalysis: { loaded: false, hasContent: false, hasCharts: false, errors: [] },
        shortTermRental: { loaded: false, hasContent: false, errors: [] },
        financialCalculator: { loaded: false, hasContent: false, errors: [] }
      }
    },
    errors: [],
    screenshots: []
  };
  
  try {
    // Create screenshot directory
    await ensureScreenshotDir();
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    const errors = setupErrorLogging(page);
    testResults.errors = errors;
    
    // Navigate to the page
    console.log(`📍 Navigating to: ${TEST_URL}`);
    try {
      await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      testResults.results.pageLoad = true;
      console.log('✅ Page loaded successfully');
      
      // Take initial screenshot
      await takeScreenshot(page, '01-initial-page', 'Initial page load');
    } catch (error) {
      console.error('❌ Failed to load page:', error.message);
      testResults.errors.push(`Page load failed: ${error.message}`);
      throw error;
    }
    
    // Handle authentication if needed
    testResults.results.authentication = await handleAuthentication(page);
    
    if (testResults.results.authentication) {
      await takeScreenshot(page, '02-after-auth', 'After authentication');
    }
    
    // Wait a bit for any redirects or page updates
    await wait(2000);
    
    // Check if property form is visible
    console.log('\n🔍 Looking for property analysis form...');
    const formSelectors = ['#property-form', '#propertyForm', 'form[id*="property"]', 'form'];
    let formFound = false;
    let formSelector = null;
    
    for (const selector of formSelectors) {
      if (await page.$(selector) !== null) {
        formFound = true;
        formSelector = selector;
        console.log(`  ✅ Form found with selector: ${selector}`);
        break;
      }
    }
    
    testResults.results.formVisible = formFound;
    
    if (!formFound) {
      console.error('  ❌ Property form not found');
      await takeScreenshot(page, 'error-no-form', 'No property form found');
    } else {
      // Fill out the form
      console.log('\n📝 Filling out property analysis form...');
      try {
        // Try different selector patterns for form fields
        const fieldMappings = [
          { field: 'address', selectors: ['#address', 'input[name="address"]', 'input[placeholder*="address" i]'] },
          { field: 'price', selectors: ['#purchasePrice', '#price', 'input[name="purchasePrice"]', 'input[name="price"]', 'input[placeholder*="price" i]'] },
          { field: 'bedrooms', selectors: ['#bedrooms', 'input[name="bedrooms"]', 'select[name="bedrooms"]'] },
          { field: 'bathrooms', selectors: ['#bathrooms', 'input[name="bathrooms"]', 'select[name="bathrooms"]'] },
          { field: 'squareFeet', selectors: ['#sqft', '#squareFeet', 'input[name="sqft"]', 'input[name="squareFeet"]'] },
          { field: 'propertyTaxes', selectors: ['#property-taxes', '#propertyTaxes', 'input[name="propertyTaxes"]'] },
          { field: 'condoFees', selectors: ['#condo-fees', '#condoFees', 'input[name="condoFees"]'] }
        ];
        
        for (const mapping of fieldMappings) {
          let filled = false;
          for (const selector of mapping.selectors) {
            try {
              if (await page.$(selector) !== null) {
                await page.type(selector, TEST_PROPERTY[mapping.field]);
                console.log(`  ✅ Filled ${mapping.field} using ${selector}`);
                filled = true;
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          if (!filled) {
            console.error(`  ❌ Could not fill ${mapping.field}`);
          }
        }
        
        testResults.results.formFill = true;
        console.log('✅ Form filled successfully');
        
        // Take screenshot of filled form
        await takeScreenshot(page, '03-form-filled', 'Form filled with test data');
      } catch (error) {
        console.error('❌ Failed to fill form:', error.message);
        testResults.errors.push(`Form fill failed: ${error.message}`);
        await takeScreenshot(page, 'error-form-fill', 'Form fill error state');
      }
      
      // Submit the form
      console.log('\n🚀 Submitting form...');
      try {
        // Try different submit button selectors
        const submitSelectors = [
          '#analyze-button',
          'button[type="submit"]',
          'button:has-text("Analyze")',
          'input[type="submit"]'
        ];
        
        let submitted = false;
        for (const selector of submitSelectors) {
          try {
            if (await page.$(selector) !== null) {
              await page.click(selector);
              console.log(`  ✅ Clicked submit button: ${selector}`);
              submitted = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!submitted) {
          throw new Error('Could not find submit button');
        }
        
        console.log('⏳ Waiting for analysis to complete...');
        
        // Take screenshot of loading state
        await wait(2000);
        await takeScreenshot(page, '04-analysis-loading', 'Analysis loading state');
        
        // Wait for analysis to complete (look for results container)
        const resultSelectors = ['#results-container', '#analysis-results', '.results-section', '[class*="results"]'];
        let analysisComplete = false;
        
        for (const selector of resultSelectors) {
          if (await waitForElement(page, selector, 60000)) {
            analysisComplete = true;
            console.log(`  ✅ Results found with selector: ${selector}`);
            break;
          }
        }
        
        if (analysisComplete) {
          testResults.results.formSubmit = true;
          testResults.results.analysisComplete = true;
          console.log('✅ Analysis completed successfully');
          
          // Wait a bit for everything to render
          await wait(3000);
          await takeScreenshot(page, '05-analysis-complete', 'Analysis complete - initial view');
        } else {
          throw new Error('Analysis did not complete within timeout');
        }
      } catch (error) {
        console.error('❌ Form submission/analysis failed:', error.message);
        testResults.errors.push(`Analysis failed: ${error.message}`);
        await takeScreenshot(page, 'error-analysis', 'Analysis error state');
      }
    }
    
    // Test each tab if analysis completed
    if (testResults.results.analysisComplete) {
      console.log('\n📑 Testing all tabs...');
      const tabs = [
        { id: 'overview-tab', name: 'overview', displayName: 'Overview' },
        { id: 'ltr-tab', name: 'longTermRental', displayName: 'Long Term Rental' },
        { id: 'investment-tab', name: 'investmentAnalysis', displayName: 'Investment Analysis' },
        { id: 'str-tab', name: 'shortTermRental', displayName: 'Short Term Rental' },
        { id: 'calculator-tab', name: 'financialCalculator', displayName: 'Financial Calculator' }
      ];
      
      for (const tab of tabs) {
        console.log(`\n🔍 Testing ${tab.displayName} tab...`);
        
        try {
          // Try different tab selectors
          const tabSelectors = [
            `#${tab.id}`,
            `button[id="${tab.id}"]`,
            `[role="tab"]:has-text("${tab.displayName}")`,
            `button:has-text("${tab.displayName}")`
          ];
          
          let tabClicked = false;
          for (const selector of tabSelectors) {
            try {
              if (await page.$(selector) !== null) {
                await page.click(selector);
                tabClicked = true;
                console.log(`  ✅ Clicked tab with selector: ${selector}`);
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          
          if (!tabClicked) {
            console.error(`  ❌ Tab not found: ${tab.displayName}`);
            testResults.results.tabs[tab.name].errors.push('Tab button not found');
            continue;
          }
          
          await wait(2000); // Wait for content to load
          
          testResults.results.tabs[tab.name].loaded = true;
          
          // Check for tab content
          const hasContent = await page.evaluate(() => {
            // Look for any content that indicates the tab has loaded
            const contentElements = document.querySelectorAll('[id*="content"], .tab-content, .panel, main > div');
            for (const element of contentElements) {
              if (element.offsetHeight > 0 && element.innerHTML.trim().length > 50) {
                return true;
              }
            }
            return false;
          });
          
          testResults.results.tabs[tab.name].hasContent = hasContent;
          
          // Check for charts in specific tabs
          if (['longTermRental', 'investmentAnalysis'].includes(tab.name)) {
            const hasCharts = await page.evaluate(() => {
              const canvasElements = document.querySelectorAll('canvas');
              const chartDivs = document.querySelectorAll('[id*="chart"], [class*="chart"]');
              // Check if canvas elements have actual content
              for (const canvas of canvasElements) {
                if (canvas.width > 0 && canvas.height > 0) {
                  return true;
                }
              }
              return chartDivs.length > 0;
            });
            
            testResults.results.tabs[tab.name].hasCharts = hasCharts;
            console.log(`  ${hasCharts ? '✅' : '❌'} Charts detected: ${hasCharts}`);
          }
          
          console.log(`  ${hasContent ? '✅' : '❌'} Content loaded: ${hasContent}`);
          
          // Take screenshot of the tab
          await takeScreenshot(page, `06-tab-${tab.name}`, `${tab.displayName} tab content`);
          
        } catch (error) {
          console.error(`❌ Error testing ${tab.displayName} tab:`, error.message);
          testResults.results.tabs[tab.name].errors.push(error.message);
          await takeScreenshot(page, `error-tab-${tab.name}`, `${tab.displayName} tab error`);
        }
      }
    }
    
    // Check for any remaining console errors
    console.log('\n🔍 Checking for JavaScript errors...');
    if (errors.length > 0) {
      console.error(`❌ Found ${errors.length} JavaScript errors`);
      errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Generate summary report
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Page Load: ${testResults.results.pageLoad ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Authentication: ${testResults.results.authentication ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Form Visible: ${testResults.results.formVisible ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Form Fill: ${testResults.results.formFill ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Form Submit: ${testResults.results.formSubmit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Analysis Complete: ${testResults.results.analysisComplete ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\nTab Results:');
    Object.entries(testResults.results.tabs).forEach(([tabName, results]) => {
      const status = results.loaded && results.hasContent ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${tabName}: ${status}`);
      if (results.hasCharts !== undefined) {
        console.log(`    - Charts: ${results.hasCharts ? '✅' : '❌'}`);
      }
      if (results.errors.length > 0) {
        console.log(`    - Errors: ${results.errors.join(', ')}`);
      }
    });
    
    console.log(`\nTotal Errors: ${errors.length}`);
    console.log(`Screenshots: ${SCREENSHOT_DIR}`);
    
    // Save detailed report
    const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
  } catch (error) {
    console.error('\n🚨 Test failed with critical error:', error);
    testResults.errors.push(`Critical error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  return testResults;
}

// Run the test
runPropertyAnalysisTest()
  .then(results => {
    const success = results.results.analysisComplete && 
                   Object.values(results.results.tabs).every(tab => tab.loaded && tab.hasContent);
    
    console.log(`\n🏁 Test completed ${success ? 'successfully' : 'with failures'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('🚨 Test execution failed:', error);
    process.exit(1);
  });