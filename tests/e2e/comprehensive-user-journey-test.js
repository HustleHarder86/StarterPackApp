const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create timestamp for this test run
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const screenshotDir = path.join(__dirname, 'screenshots', 'user-journey', timestamp);

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
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for viewport change
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

async function testUserJourney() {
  console.log('🚀 Starting comprehensive user journey test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await ensureDir(screenshotDir);

  const testResults = {
    timestamp,
    url: 'https://starter-pack-cf80kci6b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test=true',
    issues: [],
    functionalityStatus: {},
    uiUxScores: {},
    screenshots: {}
  };

  try {
    // Step 1: Navigate to the application
    console.log('📍 Step 1: Navigating to application...');
    await page.goto(testResults.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    testResults.screenshots.initialLoad = await captureScreenshot(page, '01-initial-load-desktop');

    // Test mobile view
    testResults.screenshots.initialLoadMobile = await captureScreenshot(page, '02-initial-load-mobile', { width: 375, height: 812 });
    
    // Back to desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Analyze the initial UI
    console.log('\n📍 Step 2: Analyzing initial UI elements...');
    
    // Check for main elements
    const elements = {
      header: await page.$('header, .header, nav'),
      form: await page.$('form, #property-form, .property-form'),
      addressInput: await page.$('input[name="address"], input[id*="address"], input[placeholder*="address" i]'),
      priceInput: await page.$('input[name="price"], input[id*="price"], input[placeholder*="price" i]'),
      bedroomsInput: await page.$('input[name="bedrooms"], input[id*="bedrooms"], select[name="bedrooms"]'),
      bathroomsInput: await page.$('input[name="bathrooms"], input[id*="bathrooms"], select[name="bathrooms"]'),
      sqftInput: await page.$('input[name="sqft"], input[id*="sqft"], input[placeholder*="square" i]'),
      propertyTypeSelect: await page.$('select[name="propertyType"], select[id*="property-type"]'),
      taxesInput: await page.$('input[name="propertyTaxes"], input[id*="taxes"], input[placeholder*="tax" i]'),
      condoFeesInput: await page.$('input[name="condoFees"], input[id*="condo"], input[placeholder*="condo" i]'),
      submitButton: await page.$('button[type="submit"]') || await page.$('input[type="submit"]') || await page.$('button')
    };

    // Log element presence
    for (const [name, element] of Object.entries(elements)) {
      if (!element) {
        testResults.issues.push({
          type: 'Missing Element',
          severity: 'High',
          description: `Could not find ${name} element`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Step 3: Fill out the form
    console.log('\n📍 Step 3: Filling out property analysis form...');
    
    // Try to find and fill form fields using multiple selectors
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

    // Fill address
    const addressSelectors = [
      'input[name="address"]',
      'input[id="address"]',
      'input[placeholder*="address" i]',
      'input[type="text"]:first-of-type'
    ];
    
    for (const selector of addressSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        await page.type(selector, formData.address, { delay: 50 });
        console.log(`✅ Filled address using selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`⚠️ Could not use selector ${selector} for address`);
      }
    }

    await captureScreenshot(page, '03-form-address-filled');

    // Fill price
    const priceSelectors = [
      'input[name="price"]',
      'input[id="price"]',
      'input[placeholder*="price" i]',
      'input[type="number"]:nth-of-type(1)'
    ];
    
    for (const selector of priceSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.type(selector, formData.price, { delay: 50 });
        console.log(`✅ Filled price using selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`⚠️ Could not use selector ${selector} for price`);
      }
    }

    await captureScreenshot(page, '04-form-price-filled');

    // Fill bedrooms
    try {
      // Check if it's a select element
      const bedroomSelect = await page.$('select[name="bedrooms"], select[id*="bedroom"]');
      if (bedroomSelect) {
        await page.select('select[name="bedrooms"], select[id*="bedroom"]', formData.bedrooms);
        console.log('✅ Selected bedrooms from dropdown');
      } else {
        // Try input field
        await page.type('input[name="bedrooms"], input[id*="bedroom"]', formData.bedrooms, { delay: 50 });
        console.log('✅ Typed bedrooms in input field');
      }
    } catch (e) {
      console.log('⚠️ Could not fill bedrooms:', e.message);
    }

    // Fill bathrooms
    try {
      const bathroomSelect = await page.$('select[name="bathrooms"], select[id*="bathroom"]');
      if (bathroomSelect) {
        await page.select('select[name="bathrooms"], select[id*="bathroom"]', formData.bathrooms);
        console.log('✅ Selected bathrooms from dropdown');
      } else {
        await page.type('input[name="bathrooms"], input[id*="bathroom"]', formData.bathrooms, { delay: 50 });
        console.log('✅ Typed bathrooms in input field');
      }
    } catch (e) {
      console.log('⚠️ Could not fill bathrooms:', e.message);
    }

    // Fill square feet
    const sqftSelectors = [
      'input[name="sqft"]',
      'input[id="sqft"]',
      'input[name="squareFeet"]',
      'input[id="squareFeet"]',
      'input[placeholder*="square" i]'
    ];
    
    for (const selector of sqftSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.type(selector, formData.sqft, { delay: 50 });
        console.log(`✅ Filled square feet using selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`⚠️ Could not use selector ${selector} for sqft`);
      }
    }

    await captureScreenshot(page, '05-form-basic-info-filled');

    // Select property type
    try {
      await page.select('select[name="propertyType"], select[id*="property-type"], select[id*="propertyType"]', formData.propertyType);
      console.log('✅ Selected property type');
    } catch (e) {
      console.log('⚠️ Could not select property type:', e.message);
    }

    // Fill property taxes
    const taxSelectors = [
      'input[name="propertyTaxes"]',
      'input[id="propertyTaxes"]',
      'input[name="propertyTax"]',
      'input[id="propertyTax"]',
      'input[placeholder*="tax" i]'
    ];
    
    for (const selector of taxSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.type(selector, formData.propertyTaxes, { delay: 50 });
        console.log(`✅ Filled property taxes using selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`⚠️ Could not use selector ${selector} for taxes`);
      }
    }

    // Fill condo fees
    const condoSelectors = [
      'input[name="condoFees"]',
      'input[id="condoFees"]',
      'input[name="hoaFees"]',
      'input[id="hoaFees"]',
      'input[placeholder*="condo" i]',
      'input[placeholder*="hoa" i]'
    ];
    
    for (const selector of condoSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.type(selector, formData.condoFees, { delay: 50 });
        console.log(`✅ Filled condo fees using selector: ${selector}`);
        break;
      } catch (e) {
        console.log(`⚠️ Could not use selector ${selector} for condo fees`);
      }
    }

    await captureScreenshot(page, '06-form-all-fields-filled');

    // Step 4: Submit the form
    console.log('\n📍 Step 4: Submitting the form...');
    
    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      '.submit-button',
      '#submit-button',
      'button.analyze-button',
      'button.btn-primary',
      'button'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await captureScreenshot(page, '07-before-submit');
          await button.click();
          console.log(`✅ Clicked submit button using selector: ${selector}`);
          submitted = true;
          break;
        }
      } catch (e) {
        console.log(`⚠️ Could not click selector ${selector}`);
      }
    }

    if (!submitted) {
      // Try clicking any visible button
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && (text.includes('Analyze') || text.includes('Submit') || text.includes('Get'))) {
          await button.click();
          console.log(`✅ Clicked button with text: ${text}`);
          submitted = true;
          break;
        }
      }
    }

    if (!submitted) {
      testResults.issues.push({
        type: 'Form Submission',
        severity: 'Critical',
        description: 'Could not find or click submit button',
        timestamp: new Date().toISOString()
      });
    }

    // Wait for results or error
    await new Promise(resolve => setTimeout(resolve, 3000));
    await captureScreenshot(page, '08-after-submit');

    // Step 5: Check for results or errors
    console.log('\n📍 Step 5: Checking for analysis results...');
    
    // Wait for results to load
    try {
      await page.waitForSelector('.results, .analysis-results, #results, .error, .alert', { timeout: 30000 });
      console.log('✅ Results or error message appeared');
    } catch (e) {
      console.log('⚠️ No results appeared within 30 seconds');
      testResults.issues.push({
        type: 'Results Loading',
        severity: 'Critical',
        description: 'No results or error message appeared after form submission',
        timestamp: new Date().toISOString()
      });
    }

    await captureScreenshot(page, '09-results-loaded');

    // Step 6: Test tabs if present
    console.log('\n📍 Step 6: Testing tabs...');
    
    const tabSelectors = [
      'button[role="tab"]',
      '.tab-button',
      '.tabs button',
      '[data-tab]',
      '.nav-tabs a',
      '.tab'
    ];

    let tabsFound = false;
    for (const selector of tabSelectors) {
      const tabs = await page.$$(selector);
      if (tabs.length > 0) {
        tabsFound = true;
        console.log(`Found ${tabs.length} tabs using selector: ${selector}`);
        
        for (let i = 0; i < tabs.length; i++) {
          try {
            const tabText = await page.evaluate(el => el.textContent, tabs[i]);
            console.log(`Clicking tab ${i + 1}: ${tabText}`);
            await tabs[i].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            await captureScreenshot(page, `10-tab-${i + 1}-${tabText.toLowerCase().replace(/\s+/g, '-')}`);
          } catch (e) {
            console.log(`⚠️ Error clicking tab ${i + 1}:`, e.message);
          }
        }
        break;
      }
    }

    if (!tabsFound) {
      console.log('⚠️ No tabs found in the results');
    }

    // Step 7: Test interactive elements
    console.log('\n📍 Step 7: Testing interactive elements...');
    
    // Find all buttons and clickable elements
    const interactiveSelectors = [
      'button:not([type="submit"])',
      'a[href="#"]',
      '.clickable',
      '[onclick]',
      '.btn',
      '.button'
    ];

    for (const selector of interactiveSelectors) {
      const elements = await page.$$(selector);
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      
      for (let i = 0; i < Math.min(elements.length, 5); i++) { // Test up to 5 of each type
        try {
          const text = await page.evaluate(el => el.textContent, elements[i]);
          if (text && text.trim()) {
            console.log(`Clicking element: ${text.trim()}`);
            await elements[i].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await captureScreenshot(page, `11-interactive-${selector.replace(/[^a-z0-9]/gi, '-')}-${i}`);
          }
        } catch (e) {
          console.log(`⚠️ Error clicking element:`, e.message);
        }
      }
    }

    // Step 8: Test mobile responsiveness
    console.log('\n📍 Step 8: Testing mobile responsiveness...');
    
    const viewports = [
      { name: 'iphone-se', width: 375, height: 667 },
      { name: 'iphone-12', width: 390, height: 844 },
      { name: 'ipad', width: 768, height: 1024 },
      { name: 'desktop-sm', width: 1366, height: 768 }
    ];

    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await captureScreenshot(page, `12-responsive-${viewport.name}`);
    }

    // Step 9: Check for console errors
    console.log('\n📍 Step 9: Checking for console errors...');
    
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

    // Step 10: Performance check
    console.log('\n📍 Step 10: Checking performance metrics...');
    
    const metrics = await page.metrics();
    testResults.performanceMetrics = {
      timestamp: metrics.Timestamp,
      documents: metrics.Documents,
      frames: metrics.Frames,
      jsEventListeners: metrics.JSEventListeners,
      nodes: metrics.Nodes,
      layoutCount: metrics.LayoutCount,
      recalcStyleCount: metrics.RecalcStyleCount,
      layoutDuration: metrics.LayoutDuration,
      recalcStyleDuration: metrics.RecalcStyleDuration,
      scriptDuration: metrics.ScriptDuration,
      taskDuration: metrics.TaskDuration,
      jsHeapUsedSize: (metrics.JSHeapUsedSize / 1048576).toFixed(2) + ' MB',
      jsHeapTotalSize: (metrics.JSHeapTotalSize / 1048576).toFixed(2) + ' MB'
    };

    // Final screenshot
    await page.setViewport({ width: 1920, height: 1080 });
    await captureScreenshot(page, '13-final-state');

  } catch (error) {
    console.error('❌ Test error:', error);
    testResults.issues.push({
      type: 'Test Execution',
      severity: 'Critical',
      description: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Capture error screenshot
    await captureScreenshot(page, 'error-state');
  } finally {
    // Save test results
    const reportPath = path.join(screenshotDir, 'test-results.json');
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📊 Test results saved to: ${reportPath}`);
    
    await browser.close();
  }

  return testResults;
}

// Run the test
testUserJourney().then(results => {
  console.log('\n✅ Test completed!');
  console.log(`📸 Screenshots saved in: ${screenshotDir}`);
  console.log(`🐛 Issues found: ${results.issues.length}`);
  
  if (results.issues.length > 0) {
    console.log('\n⚠️ Issues detected:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.type}: ${issue.description}`);
    });
  }
}).catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});