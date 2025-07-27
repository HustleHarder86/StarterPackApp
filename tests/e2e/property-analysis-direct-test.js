const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration - using direct analysis page URL
const TEST_URL = 'https://starter-pack-app.vercel.app/analyze-property.html';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'property-analysis-direct', new Date().toISOString().replace(/:/g, '-').split('.')[0]);

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

// Helper functions
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    console.log(`📁 Screenshot directory created: ${SCREENSHOT_DIR}`);
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }
}

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

async function waitForElement(page, selector, timeout = 30000) {
  try {
    await page.waitForSelector(selector, { timeout, visible: true });
    return true;
  } catch (error) {
    console.error(`❌ Element not found: ${selector}`);
    return false;
  }
}

function setupErrorLogging(page) {
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore some common benign errors
      if (!text.includes('favicon.ico') && !text.includes('manifest.json') && !text.includes('404')) {
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

// Main test function
async function runPropertyAnalysisTest() {
  console.log('🚀 Starting Property Analysis Direct Test');
  console.log('=========================================\n');
  
  let browser;
  const testResults = {
    timestamp: new Date().toISOString(),
    url: TEST_URL,
    testData: TEST_PROPERTY,
    results: {
      pageLoad: false,
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
    await ensureScreenshotDir();
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    const errors = setupErrorLogging(page);
    testResults.errors = errors;
    
    // Add auth bypass to local storage before navigation
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('authBypass', 'true');
      localStorage.setItem('userEmail', 'test@example.com');
    });
    
    // Navigate to the page
    console.log(`📍 Navigating to: ${TEST_URL}`);
    try {
      await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      testResults.results.pageLoad = true;
      console.log('✅ Page loaded successfully');
      
      await takeScreenshot(page, '01-initial-page', 'Initial page load');
    } catch (error) {
      console.error('❌ Failed to load page:', error.message);
      testResults.errors.push(`Page load failed: ${error.message}`);
      throw error;
    }
    
    // Wait for page to stabilize
    await wait(2000);
    
    // Check if we need to handle any modals or auth redirects
    const authForm = await page.$('#auth-form');
    if (authForm) {
      console.log('⚠️ Auth form detected, attempting to bypass...');
      
      // Try to close any modal or navigate away
      await page.evaluate(() => {
        const modal = document.querySelector('.modal, [role="dialog"]');
        if (modal) modal.style.display = 'none';
        
        const authContainer = document.querySelector('#auth-container, .auth-wrapper');
        if (authContainer) authContainer.style.display = 'none';
        
        // Show main content
        const mainContent = document.querySelector('main, .main-content, #app');
        if (mainContent) mainContent.style.display = 'block';
      });
      
      await wait(1000);
    }
    
    // Look for the property form with multiple selectors
    console.log('\n🔍 Looking for property analysis form...');
    const formSelectors = [
      '#propertyForm',
      '#property-form',
      'form[action*="analyze"]',
      '.property-form',
      'form'
    ];
    
    let formFound = false;
    let actualFormSelector = null;
    
    for (const selector of formSelectors) {
      const form = await page.$(selector);
      if (form) {
        // Check if it's actually a property form by looking for expected fields
        const hasAddressField = await page.$(`${selector} input[name="address"], ${selector} input[id="address"], ${selector} input[placeholder*="address" i]`);
        const hasPriceField = await page.$(`${selector} input[name="price"], ${selector} input[id*="price" i], ${selector} input[placeholder*="price" i]`);
        
        if (hasAddressField || hasPriceField) {
          formFound = true;
          actualFormSelector = selector;
          console.log(`✅ Property form found with selector: ${selector}`);
          break;
        }
      }
    }
    
    testResults.results.formVisible = formFound;
    
    if (!formFound) {
      console.error('❌ Property form not found on page');
      await takeScreenshot(page, 'error-no-form', 'No property form found');
      
      // Log page structure for debugging
      const pageStructure = await page.evaluate(() => {
        const forms = Array.from(document.querySelectorAll('form'));
        return {
          formCount: forms.length,
          formIds: forms.map(f => f.id),
          visibleText: document.body.innerText.substring(0, 500)
        };
      });
      console.log('Page structure:', pageStructure);
    } else {
      // Fill out the form
      console.log('\n📝 Filling out property analysis form...');
      try {
        // Clear existing values first
        await page.evaluate(() => {
          document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
            input.value = '';
          });
        });
        
        // Fill fields with more flexible selectors
        const fillField = async (value, ...selectors) => {
          for (const selector of selectors) {
            try {
              const element = await page.$(selector);
              if (element) {
                await element.click({ clickCount: 3 }); // Triple click to select all
                await element.type(value);
                return true;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          return false;
        };
        
        // Fill each field
        const filled = {
          address: await fillField(TEST_PROPERTY.address, '#address', 'input[name="address"]', 'input[placeholder*="address" i]'),
          price: await fillField(TEST_PROPERTY.price, '#purchasePrice', '#price', 'input[name="purchasePrice"]', 'input[name="price"]', 'input[placeholder*="price" i]'),
          bedrooms: await fillField(TEST_PROPERTY.bedrooms, '#bedrooms', 'input[name="bedrooms"]', 'select[name="bedrooms"]'),
          bathrooms: await fillField(TEST_PROPERTY.bathrooms, '#bathrooms', 'input[name="bathrooms"]', 'select[name="bathrooms"]'),
          squareFeet: await fillField(TEST_PROPERTY.squareFeet, '#sqft', '#squareFeet', 'input[name="sqft"]', 'input[name="squareFeet"]', 'input[placeholder*="square" i]'),
          propertyTaxes: await fillField(TEST_PROPERTY.propertyTaxes, '#property-taxes', '#propertyTaxes', 'input[name="propertyTaxes"]', 'input[placeholder*="tax" i]'),
          condoFees: await fillField(TEST_PROPERTY.condoFees, '#condo-fees', '#condoFees', 'input[name="condoFees"]', 'input[placeholder*="condo" i]', 'input[placeholder*="hoa" i]')
        };
        
        // Log which fields were filled
        Object.entries(filled).forEach(([field, success]) => {
          console.log(`  ${success ? '✅' : '❌'} ${field}: ${success ? 'filled' : 'not found'}`);
        });
        
        testResults.results.formFill = Object.values(filled).some(v => v);
        
        await takeScreenshot(page, '02-form-filled', 'Form filled with test data');
      } catch (error) {
        console.error('❌ Failed to fill form:', error.message);
        testResults.errors.push(`Form fill failed: ${error.message}`);
        await takeScreenshot(page, 'error-form-fill', 'Form fill error state');
      }
      
      // Submit the form
      console.log('\n🚀 Submitting form...');
      try {
        // Find and click submit button
        const submitSelectors = [
          'button[type="submit"]',
          '#analyze-button',
          'button:contains("Analyze")',
          'input[type="submit"]',
          'button.primary',
          'button.btn-primary'
        ];
        
        let submitted = false;
        for (const selector of submitSelectors) {
          try {
            // Use evaluate to find button with text
            const buttonClicked = await page.evaluate((sel) => {
              let button;
              if (sel.includes(':contains')) {
                const searchText = sel.match(/:contains\("(.+)"\)/)?.[1];
                if (searchText) {
                  const buttons = Array.from(document.querySelectorAll('button'));
                  button = buttons.find(b => b.textContent.includes(searchText));
                }
              } else {
                button = document.querySelector(sel);
              }
              
              if (button && !button.disabled) {
                button.click();
                return true;
              }
              return false;
            }, selector);
            
            if (buttonClicked) {
              submitted = true;
              console.log(`✅ Clicked submit button`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (!submitted) {
          throw new Error('Could not find or click submit button');
        }
        
        console.log('⏳ Waiting for analysis to complete...');
        
        // Wait for loading indicator to appear and disappear
        await wait(2000);
        await takeScreenshot(page, '03-analysis-loading', 'Analysis loading state');
        
        // Wait for results with multiple possible selectors
        const resultSelectors = [
          '#results-container',
          '#analysis-results',
          '.results-section',
          '.analysis-results',
          '[data-results]',
          '.property-analysis-results'
        ];
        
        let resultsFound = false;
        for (const selector of resultSelectors) {
          if (await waitForElement(page, selector, 60000)) {
            resultsFound = true;
            console.log(`✅ Results appeared with selector: ${selector}`);
            break;
          }
        }
        
        if (resultsFound) {
          testResults.results.formSubmit = true;
          testResults.results.analysisComplete = true;
          
          // Wait for all content to render
          await wait(3000);
          await takeScreenshot(page, '04-analysis-complete', 'Analysis complete - initial view');
          
          // Test tabs
          console.log('\n📑 Testing all tabs...');
          
          // Find tab container
          const tabSelectors = [
            '.tabs',
            '[role="tablist"]',
            '.tab-navigation',
            '.nav-tabs',
            '#property-tabs'
          ];
          
          let tabsFound = false;
          for (const selector of tabSelectors) {
            const tabContainer = await page.$(selector);
            if (tabContainer) {
              tabsFound = true;
              console.log(`✅ Tab container found: ${selector}`);
              
              // Get all tabs
              const tabs = await page.evaluate((sel) => {
                const container = document.querySelector(sel);
                if (!container) return [];
                
                const tabElements = container.querySelectorAll('button, [role="tab"], a');
                return Array.from(tabElements).map(tab => ({
                  text: tab.textContent.trim(),
                  id: tab.id,
                  className: tab.className
                }));
              }, selector);
              
              console.log(`Found ${tabs.length} tabs:`, tabs.map(t => t.text));
              
              // Click each tab and check content
              for (const tab of tabs) {
                const tabName = tab.text.toLowerCase().replace(/\s+/g, '');
                console.log(`\n🔍 Testing tab: ${tab.text}`);
                
                try {
                  // Click the tab
                  await page.evaluate((tabId, tabText) => {
                    const tabElement = tabId ? document.getElementById(tabId) : 
                                      Array.from(document.querySelectorAll('button, [role="tab"]'))
                                           .find(el => el.textContent.includes(tabText));
                    if (tabElement) tabElement.click();
                  }, tab.id, tab.text);
                  
                  await wait(1500);
                  
                  // Check for content
                  const hasContent = await page.evaluate(() => {
                    // Look for visible content areas
                    const contentAreas = document.querySelectorAll('.tab-pane.active, .tab-content:not(.hidden), [role="tabpanel"]:not([hidden])');
                    return Array.from(contentAreas).some(area => area.offsetHeight > 50 && area.textContent.trim().length > 50);
                  });
                  
                  // Map tab names to our test structure
                  let testTabName = 'overview';
                  if (tabName.includes('longterm') || tabName.includes('ltr')) testTabName = 'longTermRental';
                  else if (tabName.includes('investment')) testTabName = 'investmentAnalysis';
                  else if (tabName.includes('shortterm') || tabName.includes('str')) testTabName = 'shortTermRental';
                  else if (tabName.includes('calculator') || tabName.includes('financial')) testTabName = 'financialCalculator';
                  
                  if (testResults.results.tabs[testTabName]) {
                    testResults.results.tabs[testTabName].loaded = true;
                    testResults.results.tabs[testTabName].hasContent = hasContent;
                    
                    // Check for charts
                    if (['longTermRental', 'investmentAnalysis'].includes(testTabName)) {
                      const hasCharts = await page.evaluate(() => {
                        const canvases = document.querySelectorAll('canvas');
                        return Array.from(canvases).some(canvas => canvas.width > 100 && canvas.height > 100);
                      });
                      testResults.results.tabs[testTabName].hasCharts = hasCharts;
                      console.log(`  Charts detected: ${hasCharts ? '✅' : '❌'}`);
                    }
                    
                    console.log(`  Content loaded: ${hasContent ? '✅' : '❌'}`);
                    await takeScreenshot(page, `05-tab-${testTabName}`, `${tab.text} tab content`);
                  }
                } catch (error) {
                  console.error(`  ❌ Error testing tab ${tab.text}:`, error.message);
                }
              }
              
              break;
            }
          }
          
          if (!tabsFound) {
            console.log('⚠️ No tab container found, results may be in single view');
          }
        } else {
          throw new Error('Analysis results did not appear within timeout');
        }
      } catch (error) {
        console.error('❌ Form submission/analysis failed:', error.message);
        testResults.errors.push(`Analysis failed: ${error.message}`);
        await takeScreenshot(page, 'error-analysis', 'Analysis error state');
      }
    }
    
    // Final error check
    console.log('\n🔍 Final JavaScript error check...');
    if (errors.length > 0) {
      console.error(`❌ Found ${errors.length} JavaScript errors`);
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Generate summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Page Load: ${testResults.results.pageLoad ? '✅ PASS' : '❌ FAIL'}`);
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
    });
    
    console.log(`\nTotal Errors: ${errors.length}`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
    
    // Save report
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
                   Object.values(results.results.tabs).some(tab => tab.loaded && tab.hasContent);
    
    console.log(`\n🏁 Test completed ${success ? 'successfully' : 'with failures'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('🚨 Test execution failed:', error);
    process.exit(1);
  });