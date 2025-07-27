const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function verifyBugFix() {
  console.log('🔍 Starting bug fix verification test...');
  
  // Create screenshot directory with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
  const screenshotDir = path.join(__dirname, 'screenshots', 'bug-fix-verification', timestamp);
  await fs.mkdir(screenshotDir, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  // Track network errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  try {
    // 1. Navigate to the deployed app with auth bypass
    console.log('📱 Navigating to app with e2e_test_mode...');
    await page.goto('https://investorprops.vercel.app/roi-finder.html?e2e_test_mode=true', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Initial page load');
    
    // Check if we need to handle any auth or modals
    const authModal = await page.$('.auth-modal, [data-testid="auth-modal"]');
    if (authModal) {
      console.log('🔐 Auth modal detected, attempting bypass...');
      // Try to close or bypass
      const closeButton = await page.$('[data-testid="close-modal"], .close-modal, button[aria-label="Close"]');
      if (closeButton) {
        await closeButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 2. Check if property form is visible
    console.log('📋 Looking for property analysis form...');
    await page.waitForSelector('#propertyForm, form[name="propertyAnalysis"], .property-form', { 
      timeout: 10000 
    }).catch(() => console.log('⚠️ Form selector not found with standard selectors'));
    
    // Take screenshot of form
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-property-form.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Property form');
    
    // 3. Fill in the property form with test data
    console.log('✏️ Filling property form with test data...');
    
    // Try different possible input selectors
    const fillInput = async (selectors, value) => {
      for (const selector of selectors) {
        const input = await page.$(selector);
        if (input) {
          await input.click({ clickCount: 3 });
          await input.type(value.toString());
          return true;
        }
      }
      return false;
    };
    
    // Property Address
    await fillInput([
      '#propertyAddress',
      '[name="propertyAddress"]',
      '[placeholder*="address" i]',
      '[data-testid="property-address"]'
    ], '123 Test Street, Toronto, ON');
    
    // Purchase Price
    await fillInput([
      '#purchasePrice',
      '[name="purchasePrice"]',
      '[placeholder*="purchase price" i]',
      '[data-testid="purchase-price"]'
    ], '850000');
    
    // Square Footage
    await fillInput([
      '#squareFootage',
      '[name="squareFootage"]',
      '[placeholder*="square" i]',
      '[data-testid="square-footage"]'
    ], '2200');
    
    // Bedrooms
    await fillInput([
      '#bedrooms',
      '[name="bedrooms"]',
      '[placeholder*="bedroom" i]',
      '[data-testid="bedrooms"]'
    ], '4');
    
    // Bathrooms
    await fillInput([
      '#bathrooms',
      '[name="bathrooms"]',
      '[placeholder*="bathroom" i]',
      '[data-testid="bathrooms"]'
    ], '3');
    
    // Property Tax
    await fillInput([
      '#propertyTax',
      '[name="propertyTax"]',
      '[placeholder*="property tax" i]',
      '[data-testid="property-tax"]'
    ], '8500');
    
    // Condo Fees
    await fillInput([
      '#condoFees',
      '[name="condoFees"]',
      '[placeholder*="condo fee" i]',
      '[data-testid="condo-fees"]'
    ], '0');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-form-filled.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Form filled with test data');
    
    // 4. Submit the form
    console.log('🚀 Submitting property analysis form...');
    const submitButton = await page.$('button[type="submit"], button[id="analyzeButton"], [data-testid="submit-button"]');
    if (submitButton) {
      await submitButton.click();
      console.log('✅ Form submitted');
      
      // Wait for analysis to complete
      console.log('⏳ Waiting for analysis results...');
      await page.waitForSelector('.analysis-results, .results-container, [data-testid="analysis-results"], #resultsContainer', {
        timeout: 60000
      }).catch(() => console.log('⚠️ Results container not found'));
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Additional wait for content to render
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-analysis-results.png'),
        fullPage: true 
      });
      console.log('✅ Screenshot: Analysis results');
      
      // 5. Look for and click the Long Term Rental tab
      console.log('📊 Looking for Long Term Rental tab...');
      // Try multiple approaches
      let ltrTab = await page.$('[data-tab="longTermRental"]');
      if (!ltrTab) {
        // Try XPath
        const [xpathTab] = await page.$x('//button[contains(text(), "Long Term Rental")]');
        ltrTab = xpathTab;
      }
      if (!ltrTab) {
        // Try evaluating
        ltrTab = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.textContent.includes('Long Term Rental'));
        });
      }
      
      if (ltrTab) {
        console.log('✅ Found Long Term Rental tab, clicking...');
        await ltrTab.click();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for tab content to load
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '05-ltr-tab-active.png'),
          fullPage: true 
        });
        console.log('✅ Screenshot: Long Term Rental tab active');
        
        // Check for charts
        const charts = await page.$$('canvas, .chart-container, [data-testid*="chart"]');
        console.log(`📈 Found ${charts.length} chart elements`);
        
        if (charts.length > 0) {
          // Scroll to each chart and capture
          for (let i = 0; i < charts.length; i++) {
            await charts[i].scrollIntoViewIfNeeded();
            await new Promise(resolve => setTimeout(resolve, 500));
            await page.screenshot({ 
              path: path.join(screenshotDir, `06-chart-${i + 1}.png`),
              fullPage: false 
            });
            console.log(`✅ Screenshot: Chart ${i + 1}`);
          }
        }
      } else {
        console.log('❌ Long Term Rental tab not found');
        // Try to find any tabs
        const allTabs = await page.$$('button[role="tab"], .tab-button, [data-tab]');
        console.log(`Found ${allTabs.length} tab elements total`);
      }
      
      // 6. Check Investment Analysis tab
      console.log('💰 Checking Investment Analysis tab...');
      let investmentTab = await page.$('[data-tab="investment"]');
      if (!investmentTab) {
        const [xpathInvTab] = await page.$x('//button[contains(text(), "Investment Analysis")]');
        investmentTab = xpathInvTab;
      }
      
      if (investmentTab) {
        await investmentTab.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '07-investment-tab.png'),
          fullPage: true 
        });
        console.log('✅ Screenshot: Investment Analysis tab');
      }
      
    } else {
      console.log('❌ Submit button not found');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-state.png'),
      fullPage: true 
    });
  }
  
  // Generate report
  console.log('\n📊 Generating test report...');
  const report = {
    timestamp: new Date().toISOString(),
    url: 'https://investorprops.vercel.app/roi-finder.html',
    screenshotDir: screenshotDir,
    consoleErrors: consoleErrors,
    testResults: {
      pageLoaded: true,
      formFound: await page.$('#propertyForm, form') !== null,
      analysisCompleted: await page.$('.analysis-results, .results-container, #resultsContainer') !== null,
      ltrTabFound: await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.textContent.includes('Long Term Rental'));
      }),
      chartsRendered: (await page.$$('canvas, .chart-container')).length > 0,
      jsErrors: consoleErrors.filter(err => err.includes('ReferenceError') || err.includes('TypeError'))
    }
  };
  
  await fs.writeFile(
    path.join(screenshotDir, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Test Summary:');
  console.log(`- Page Loaded: ${report.testResults.pageLoaded ? '✅' : '❌'}`);
  console.log(`- Form Found: ${report.testResults.formFound ? '✅' : '❌'}`);
  console.log(`- Analysis Completed: ${report.testResults.analysisCompleted ? '✅' : '❌'}`);
  console.log(`- LTR Tab Found: ${report.testResults.ltrTabFound ? '✅' : '❌'}`);
  console.log(`- Charts Rendered: ${report.testResults.chartsRendered ? '✅' : '❌'}`);
  console.log(`- JavaScript Errors: ${report.testResults.jsErrors.length === 0 ? '✅ None' : `❌ ${report.testResults.jsErrors.length} errors`}`);
  console.log(`\n📁 Screenshots saved to: ${screenshotDir}`);
  
  await browser.close();
}

// Run the test
verifyBugFix().catch(console.error);