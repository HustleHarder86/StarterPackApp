const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const TEST_URL = 'https://starter-pack-app.vercel.app/roi-finder.html';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'property-analysis-test', new Date().toISOString().replace(/:/g, '-').split('.')[0]);

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
      errors.push(msg.text());
      console.error('🚨 Console Error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('🚨 Page Error:', error.message);
  });
  
  return errors;
}

// Main test function
async function runPropertyAnalysisTest() {
  console.log('🚀 Starting Property Analysis Comprehensive Test');
  console.log('========================================\n');
  
  let browser;
  const testResults = {
    timestamp: new Date().toISOString(),
    url: TEST_URL,
    testData: TEST_PROPERTY,
    results: {
      pageLoad: false,
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
    
    // Fill out the form
    console.log('\n📝 Filling out property analysis form...');
    try {
      // Wait for form to be visible
      await waitForElement(page, '#property-form');
      
      // Fill each field
      await page.type('#address', TEST_PROPERTY.address);
      await page.type('#purchasePrice', TEST_PROPERTY.price);
      await page.type('#bedrooms', TEST_PROPERTY.bedrooms);
      await page.type('#bathrooms', TEST_PROPERTY.bathrooms);
      await page.type('#sqft', TEST_PROPERTY.squareFeet);
      await page.type('#property-taxes', TEST_PROPERTY.propertyTaxes);
      await page.type('#condo-fees', TEST_PROPERTY.condoFees);
      
      testResults.results.formFill = true;
      console.log('✅ Form filled successfully');
      
      // Take screenshot of filled form
      await takeScreenshot(page, '02-form-filled', 'Form filled with test data');
    } catch (error) {
      console.error('❌ Failed to fill form:', error.message);
      testResults.errors.push(`Form fill failed: ${error.message}`);
      await takeScreenshot(page, 'error-form-fill', 'Form fill error state');
    }
    
    // Submit the form
    console.log('\n🚀 Submitting form...');
    try {
      // Click submit button
      await page.click('#analyze-button');
      console.log('⏳ Waiting for analysis to complete...');
      
      // Take screenshot of loading state
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '03-analysis-loading', 'Analysis loading state');
      
      // Wait for analysis to complete (look for results container)
      const analysisComplete = await waitForElement(page, '#results-container', 60000);
      
      if (analysisComplete) {
        testResults.results.formSubmit = true;
        testResults.results.analysisComplete = true;
        console.log('✅ Analysis completed successfully');
        
        // Wait a bit for everything to render
        await page.waitForTimeout(3000);
        await takeScreenshot(page, '04-analysis-complete', 'Analysis complete - initial view');
      } else {
        throw new Error('Analysis did not complete within timeout');
      }
    } catch (error) {
      console.error('❌ Form submission/analysis failed:', error.message);
      testResults.errors.push(`Analysis failed: ${error.message}`);
      await takeScreenshot(page, 'error-analysis', 'Analysis error state');
    }
    
    // Test each tab
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
        // Click on the tab
        const tabSelector = `#${tab.id}`;
        const tabExists = await waitForElement(page, tabSelector, 5000);
        
        if (!tabExists) {
          console.error(`❌ Tab not found: ${tab.displayName}`);
          testResults.results.tabs[tab.name].errors.push('Tab button not found');
          continue;
        }
        
        await page.click(tabSelector);
        await page.waitForTimeout(2000); // Wait for content to load
        
        testResults.results.tabs[tab.name].loaded = true;
        
        // Check for tab content
        const contentSelector = `#${tab.name.toLowerCase()}-content, #${tab.id.replace('-tab', '-content')}`;
        const hasContent = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return element && element.innerHTML.trim().length > 0;
        }, contentSelector);
        
        testResults.results.tabs[tab.name].hasContent = hasContent;
        
        // Check for charts in specific tabs
        if (['longTermRental', 'investmentAnalysis'].includes(tab.name)) {
          const hasCharts = await page.evaluate(() => {
            const canvasElements = document.querySelectorAll('canvas');
            const chartDivs = document.querySelectorAll('[id*="chart"], [class*="chart"]');
            return canvasElements.length > 0 || chartDivs.length > 0;
          });
          
          testResults.results.tabs[tab.name].hasCharts = hasCharts;
          console.log(`  ${hasCharts ? '✅' : '❌'} Charts detected: ${hasCharts}`);
        }
        
        console.log(`  ${hasContent ? '✅' : '❌'} Content loaded: ${hasContent}`);
        
        // Take screenshot of the tab
        await takeScreenshot(page, `05-tab-${tab.name}`, `${tab.displayName} tab content`);
        
      } catch (error) {
        console.error(`❌ Error testing ${tab.displayName} tab:`, error.message);
        testResults.results.tabs[tab.name].errors.push(error.message);
        await takeScreenshot(page, `error-tab-${tab.name}`, `${tab.displayName} tab error`);
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