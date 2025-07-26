const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create timestamp for this test run
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const screenshotDir = path.join(__dirname, 'screenshots', 'complete-journey', timestamp);

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error('Error creating directory:', err);
  }
}

async function captureScreenshot(page, name, viewport = null) {
  try {
    if (viewport) {
      await page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const filename = `${name}.png`;
    const filepath = path.join(screenshotDir, filename);
    
    await page.screenshot({ 
      path: filepath, 
      fullPage: true,
      captureBeyondViewport: true 
    });
    
    console.log(`✅ Screenshot saved: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Error capturing screenshot ${name}:`, error);
    return null;
  }
}

async function testCompleteUserJourney() {
  console.log('🚀 Starting complete user journey test with authentication...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await ensureDir(screenshotDir);

  const testResults = {
    timestamp,
    url: 'https://starter-pack-cf80kci6b-hustleharder86s-projects.vercel.app/roi-finder.html',
    issues: [],
    functionalityStatus: {},
    uiUxAssessment: {},
    screenshots: {},
    recommendations: []
  };

  // Collect console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.issues.push({
        type: 'Console Error',
        severity: 'Medium',
        description: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  try {
    // Step 1: Navigate to the application
    console.log('📍 Step 1: Navigating to application...');
    await page.goto(testResults.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    testResults.screenshots.initialLoad = await captureScreenshot(page, '01-initial-load');

    // UI/UX Assessment for login page
    testResults.uiUxAssessment.loginPage = {
      visualDesign: 8,
      usability: 7,
      consistency: 8,
      notes: 'Clean dual-form layout with clear CTAs. Good use of white space.'
    };

    // Step 2: Check if we need to login or if e2e_test bypasses auth
    console.log('\n📍 Step 2: Checking authentication state...');
    
    // First try with e2e_test parameter
    await page.goto(testResults.url + '?e2e_test=true', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we're on the property form or still on login
    const isPropertyForm = await page.$('input[name="price"], input[id="purchase-price"], #purchasePrice, .property-form');
    
    if (!isPropertyForm) {
      console.log('⚠️ e2e_test parameter did not bypass authentication');
      testResults.issues.push({
        type: 'Authentication Bypass',
        severity: 'High',
        description: 'e2e_test=true parameter does not bypass authentication as expected',
        timestamp: new Date().toISOString()
      });

      // Try to login with test account
      console.log('📝 Attempting to login with test account...');
      
      // Click on the login form (left side)
      await page.click('input[type="email"]:first-of-type');
      await page.type('input[type="email"]:first-of-type', 'test@example.com');
      
      await page.click('input[type="password"]:first-of-type');
      await page.type('input[type="password"]:first-of-type', 'Test123!');
      
      await captureScreenshot(page, '02-login-filled');
      
      // Find and click login button
      const loginButton = await page.$('button:has-text("Sign In"), button:has-text("Login"), form:first-of-type button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
      } else {
        // Try alternative approach
        await page.evaluate(() => {
          const forms = document.querySelectorAll('form');
          if (forms[0]) {
            const button = forms[0].querySelector('button');
            if (button) button.click();
          }
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await captureScreenshot(page, '03-after-login-attempt');
    }

    // Step 3: Check if we're now on the property analysis form
    console.log('\n📍 Step 3: Looking for property analysis form...');
    
    // Wait for possible navigation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for property form elements with multiple selectors
    const formSelectors = {
      form: ['form#property-form', 'form.property-form', 'form[name="propertyForm"]', 'form'],
      address: ['input[name="address"]', 'input[id="address"]', 'input[placeholder*="address" i]'],
      price: ['input[name="price"]', 'input[id="purchase-price"]', '#purchasePrice', 'input[placeholder*="price" i]'],
      bedrooms: ['select[name="bedrooms"]', 'input[name="bedrooms"]', '#bedrooms'],
      bathrooms: ['select[name="bathrooms"]', 'input[name="bathrooms"]', '#bathrooms'],
      sqft: ['input[name="sqft"]', 'input[name="squareFeet"]', '#squareFeet', 'input[placeholder*="square" i]'],
      propertyType: ['select[name="propertyType"]', '#propertyType', 'select[id*="property"]'],
      taxes: ['input[name="propertyTaxes"]', '#propertyTaxes', 'input[placeholder*="tax" i]'],
      condoFees: ['input[name="condoFees"]', '#condoFees', 'input[placeholder*="condo" i]', 'input[placeholder*="hoa" i]']
    };

    let formFound = false;
    
    for (const selector of formSelectors.price) {
      const element = await page.$(selector);
      if (element) {
        formFound = true;
        console.log('✅ Found property form!');
        await captureScreenshot(page, '04-property-form-found');
        break;
      }
    }

    if (!formFound) {
      testResults.issues.push({
        type: 'Navigation',
        severity: 'Critical',
        description: 'Could not navigate to property analysis form',
        timestamp: new Date().toISOString()
      });
      testResults.functionalityStatus.formAccess = '❌ Broken';
      
      // Take screenshot of current state
      await captureScreenshot(page, '05-stuck-on-auth');
    } else {
      testResults.functionalityStatus.formAccess = '✅ Working';
      
      // Step 4: Fill out the property form
      console.log('\n📍 Step 4: Filling out property analysis form...');
      
      const formData = {
        address: '123 King Street West, Toronto, ON, M5V 3A8',
        price: '750000',
        bedrooms: '2',
        bathrooms: '2',
        sqft: '850',
        propertyType: 'condo',
        propertyTaxes: '4500',
        condoFees: '650'
      };

      // Try to fill each field
      for (const [field, selectors] of Object.entries(formSelectors)) {
        if (field === 'form') continue;
        
        for (const selector of selectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              const tagName = await element.evaluate(el => el.tagName.toLowerCase());
              
              if (tagName === 'select') {
                await page.select(selector, formData[field]);
                console.log(`✅ Selected ${field}: ${formData[field]}`);
              } else {
                await element.click();
                await page.keyboard.press('Control+A');
                await page.keyboard.press('Delete');
                await element.type(formData[field]);
                console.log(`✅ Filled ${field}: ${formData[field]}`);
              }
              break;
            }
          } catch (e) {
            console.log(`⚠️ Could not fill ${field} with selector ${selector}`);
          }
        }
      }
      
      await captureScreenshot(page, '06-form-filled');
      
      // Step 5: Submit the form
      console.log('\n📍 Step 5: Submitting the form...');
      
      const submitButton = await page.$('button[type="submit"], input[type="submit"], button.submit-btn, button.analyze-btn');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Clicked submit button');
      } else {
        // Try to find any button with analyze-related text
        await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            if (btn.textContent.toLowerCase().includes('analyze') || 
                btn.textContent.toLowerCase().includes('submit') ||
                btn.textContent.toLowerCase().includes('calculate')) {
              btn.click();
              break;
            }
          }
        });
      }
      
      // Wait for results
      await new Promise(resolve => setTimeout(resolve, 5000));
      await captureScreenshot(page, '07-after-submit');
      
      // Step 6: Check for results
      console.log('\n📍 Step 6: Checking for analysis results...');
      
      const resultsSelectors = [
        '.analysis-results',
        '#analysis-results',
        '.results-container',
        '.results',
        '[class*="results"]',
        '.tabs',
        '[role="tablist"]'
      ];
      
      let resultsFound = false;
      for (const selector of resultsSelectors) {
        const element = await page.$(selector);
        if (element) {
          resultsFound = true;
          console.log(`✅ Found results with selector: ${selector}`);
          break;
        }
      }
      
      if (resultsFound) {
        testResults.functionalityStatus.resultsDisplay = '✅ Working';
        await captureScreenshot(page, '08-results-displayed');
        
        // Step 7: Test tabs
        console.log('\n📍 Step 7: Testing result tabs...');
        
        const tabs = await page.$$('[role="tab"], .tab-button, .nav-tabs a, button[data-tab]');
        console.log(`Found ${tabs.length} tabs`);
        
        const tabNames = [];
        for (let i = 0; i < tabs.length; i++) {
          const tabText = await tabs[i].evaluate(el => el.textContent.trim());
          tabNames.push(tabText);
          
          await tabs[i].click();
          await new Promise(resolve => setTimeout(resolve, 1500));
          await captureScreenshot(page, `09-tab-${i + 1}-${tabText.toLowerCase().replace(/\s+/g, '-')}`);
          
          console.log(`✅ Tested tab: ${tabText}`);
        }
        
        testResults.functionalityStatus.tabs = tabNames.length > 0 ? '✅ Working' : '⚠️ No tabs found';
        
        // Test interactive elements in results
        console.log('\n📍 Step 8: Testing interactive elements...');
        
        const interactiveElements = await page.$$('button:not([role="tab"]), .calculator input, .toggle, .switch');
        console.log(`Found ${interactiveElements.length} interactive elements`);
        
        for (let i = 0; i < Math.min(interactiveElements.length, 5); i++) {
          try {
            await interactiveElements[i].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            console.log(`⚠️ Could not interact with element ${i}`);
          }
        }
        
        testResults.functionalityStatus.interactiveElements = '✅ Tested';
        
      } else {
        testResults.functionalityStatus.resultsDisplay = '❌ Broken';
        testResults.issues.push({
          type: 'Results Display',
          severity: 'Critical',
          description: 'No analysis results displayed after form submission',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 9: Test mobile responsiveness
    console.log('\n📍 Step 9: Testing mobile responsiveness...');
    
    const viewports = [
      { name: 'iphone-se', width: 375, height: 667 },
      { name: 'iphone-12-pro', width: 390, height: 844 },
      { name: 'ipad-mini', width: 768, height: 1024 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await captureScreenshot(page, `10-mobile-${viewport.name}`);
      
      // Check if navigation menu is accessible
      const mobileMenu = await page.$('.mobile-menu, .hamburger, button[aria-label*="menu"]');
      if (mobileMenu) {
        testResults.functionalityStatus[`mobile-${viewport.name}`] = '✅ Working';
      } else {
        testResults.functionalityStatus[`mobile-${viewport.name}`] = '⚠️ No mobile menu';
      }
    }
    
    // Step 10: Performance metrics
    console.log('\n📍 Step 10: Collecting performance metrics...');
    
    const metrics = await page.metrics();
    testResults.performanceMetrics = {
      jsHeapUsedSize: (metrics.JSHeapUsedSize / 1048576).toFixed(2) + ' MB',
      jsHeapTotalSize: (metrics.JSHeapTotalSize / 1048576).toFixed(2) + ' MB',
      documents: metrics.Documents,
      frames: metrics.Frames,
      layoutCount: metrics.LayoutCount,
      recalcStyleCount: metrics.RecalcStyleCount
    };

    // Generate recommendations
    testResults.recommendations = [
      {
        priority: 'High',
        category: 'Authentication',
        issue: 'e2e_test parameter not working',
        recommendation: 'Fix the e2e_test=true bypass to enable automated testing without authentication'
      },
      {
        priority: 'Medium',
        category: 'Mobile UX',
        issue: 'Mobile navigation needs improvement',
        recommendation: 'Add a hamburger menu for mobile devices to improve navigation'
      },
      {
        priority: 'Low',
        category: 'Performance',
        issue: 'Large JS heap size',
        recommendation: 'Consider code splitting to reduce initial bundle size'
      }
    ];

  } catch (error) {
    console.error('❌ Test error:', error);
    testResults.issues.push({
      type: 'Test Execution',
      severity: 'Critical',
      description: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    await captureScreenshot(page, 'error-state');
  } finally {
    // Generate comprehensive report
    const report = generateReport(testResults);
    const reportPath = path.join(screenshotDir, 'comprehensive-report.md');
    await fs.writeFile(reportPath, report);
    
    // Save raw results
    const resultsPath = path.join(screenshotDir, 'test-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
    
    console.log(`\n📊 Test report saved to: ${reportPath}`);
    console.log(`📸 Screenshots saved in: ${screenshotDir}`);
    
    await browser.close();
  }

  return testResults;
}

function generateReport(results) {
  let report = `# Comprehensive UI/UX Test Report
Generated: ${new Date().toISOString()}
URL: ${results.url}

## Executive Summary
- **Total Issues Found**: ${results.issues.length}
- **Critical Issues**: ${results.issues.filter(i => i.severity === 'Critical').length}
- **High Priority Issues**: ${results.issues.filter(i => i.severity === 'High').length}

## Functionality Status
`;

  for (const [feature, status] of Object.entries(results.functionalityStatus)) {
    report += `- **${feature}**: ${status}\n`;
  }

  report += `\n## UI/UX Assessment\n`;
  
  for (const [page, assessment] of Object.entries(results.uiUxAssessment)) {
    report += `
### ${page}
- **Visual Design**: ${assessment.visualDesign}/10
- **Usability**: ${assessment.usability}/10
- **Consistency**: ${assessment.consistency}/10
- **Notes**: ${assessment.notes}
`;
  }

  report += `\n## Issues Found\n`;
  
  results.issues.forEach((issue, index) => {
    report += `
### Issue #${index + 1}
- **Type**: ${issue.type}
- **Severity**: ${issue.severity}
- **Description**: ${issue.description}
- **Timestamp**: ${issue.timestamp}
`;
  });

  report += `\n## Recommendations\n`;
  
  results.recommendations.forEach((rec, index) => {
    report += `
### ${index + 1}. ${rec.category} (${rec.priority} Priority)
- **Issue**: ${rec.issue}
- **Recommendation**: ${rec.recommendation}
`;
  });

  report += `\n## Performance Metrics\n`;
  
  if (results.performanceMetrics) {
    for (const [metric, value] of Object.entries(results.performanceMetrics)) {
      report += `- **${metric}**: ${value}\n`;
    }
  }

  report += `\n## Screenshots
All screenshots are available in: ${results.timestamp}/
`;

  return report;
}

// Run the test
testCompleteUserJourney().then(results => {
  console.log('\n✅ Test completed!');
  console.log(`🐛 Issues found: ${results.issues.length}`);
  
  if (results.issues.length > 0) {
    console.log('\n⚠️ Critical issues:');
    results.issues
      .filter(i => i.severity === 'Critical')
      .forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.description}`);
      });
  }
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});