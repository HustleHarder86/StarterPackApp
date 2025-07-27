const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function testAPIConnection() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  // Enable request interception to monitor API calls
  await page.setRequestInterception(true);
  
  const apiCalls = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('vercel.app')) {
      console.log('API Request:', url);
      apiCalls.push({
        url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
    request.continue();
  });
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('vercel.app')) {
      console.log('API Response:', url, response.status());
    }
  });

  // Capture console logs
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  try {
    console.log('Navigating to deployed app...');
    await page.goto('https://starter-pack-kvr6zbo9n-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Take initial screenshot
    const screenshotDir = path.join(__dirname, 'screenshots', 'api-test', new Date().toISOString().split('T')[0]);
    await fs.mkdir(screenshotDir, { recursive: true });
    
    await page.screenshot({
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: true
    });

    // Wait for page to fully load and check what's there
    console.log('Checking page content...');
    
    // Take screenshot to see what's loaded
    await page.screenshot({
      path: path.join(screenshotDir, '01a-checking-content.png'),
      fullPage: true
    });
    
    // Try to get page content
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasForm: !!document.querySelector('form'),
        hasPropertyAddress: !!document.querySelector('#property-address'),
        hasPurchasePrice: !!document.querySelector('#purchase-price'),
        hasAnalyzeBtn: !!document.querySelector('#analyze-btn'),
        bodyHTML: document.body.innerHTML.substring(0, 500)
      };
    });
    
    console.log('Page content check:', pageContent);
    
    // Wait for form to be ready
    try {
      await page.waitForSelector('#property-address', { timeout: 30000 });
      
      // Click on "Add More Details (Optional)" to expand the form
      console.log('Looking for expand button...');
      const expandClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const expandBtn = buttons.find(b => b.textContent.includes('Add More Details'));
        if (expandBtn) {
          expandBtn.click();
          return true;
        }
        return false;
      });
      
      if (expandClicked) {
        console.log('Clicked expand button');
      } else {
        console.log('Expand button not found');
      }
      
      // Wait a bit for form to expand
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check what fields are now available
      const formFields = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[name]'));
        return inputs.map(input => ({ name: input.name, id: input.id, type: input.type }));
      });
      console.log('Available form fields:', formFields);
      
      // Look for the analyze button
      const analyzeButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.includes('Analyze'));
        return btn ? btn.textContent : null;
      });
      console.log('Analyze button text:', analyzeButton);
    } catch (e) {
      console.error('Form elements not found:', e.message);
      // Take debug screenshot
      await page.screenshot({
        path: path.join(screenshotDir, '01b-form-not-found.png'),
        fullPage: true
      });
      throw e;
    }
    
    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Filling form with test data...');
    
    // Fill the basic form fields
    console.log('Filling basic form fields...');
    
    // Clear and type address
    await page.evaluate(() => {
      const addressInput = document.querySelector('#property-address');
      if (addressInput) addressInput.value = '';
    });
    await page.type('#property-address', '123 King Street West, Toronto, ON M5H 1A1');
    
    // Fill purchase price - try multiple possible selectors
    const priceSet = await page.evaluate(() => {
      const selectors = ['input[placeholder*="Purchase"]', 'input[placeholder*="$50"]', '#purchasePrice', '[name="purchasePrice"]'];
      for (const sel of selectors) {
        const input = document.querySelector(sel);
        if (input && input.type !== 'hidden') {
          input.value = '750000';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });
    console.log('Purchase price set:', priceSet);
    
    // Try to fill other visible fields
    await page.evaluate(() => {
      // Find all visible input fields
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]'));
      inputs.forEach(input => {
        if (input.offsetParent !== null) { // Check if visible
          const placeholder = input.placeholder || '';
          const name = input.name || '';
          
          if (placeholder.includes('Bedrooms') || name.includes('bedrooms')) {
            input.value = '2';
          } else if (placeholder.includes('Bathrooms') || name.includes('bathrooms')) {
            input.value = '2';
          } else if (placeholder.includes('Down Payment') || name.includes('downPayment')) {
            input.value = '150000';
          } else if (placeholder.includes('Interest Rate') || name.includes('interestRate')) {
            input.value = '5.5';
          } else if (placeholder.includes('Monthly Rent') || name.includes('monthlyRent')) {
            input.value = '3500';
          }
          
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    // Take screenshot of filled form
    await page.screenshot({
      path: path.join(screenshotDir, '02-form-filled.png'),
      fullPage: true
    });

    console.log('Submitting form...');
    
    // Click submit button
    console.log('Looking for Analyze button...');
    const analyzeClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyzeBtn = buttons.find(b => b.textContent.includes('Analyze Property'));
      if (analyzeBtn) {
        console.log('Clicking analyze button');
        analyzeBtn.click();
        return true;
      }
      return false;
    });
    console.log('Analyze button clicked:', analyzeClicked);
    
    // Wait for either success or error
    const result = await Promise.race([
      page.waitForSelector('[data-component="AnalysisResults"]', { visible: true, timeout: 60000 }).then(() => 'success'),
      page.waitForSelector('.error-message', { visible: true, timeout: 60000 }).then(() => 'error'),
      page.waitForSelector('[role="alert"]', { visible: true, timeout: 60000 }).then(() => 'alert')
    ]).catch(err => {
      console.error('Timeout waiting for response:', err.message);
      return 'timeout';
    });

    // Take screenshot of result
    await page.screenshot({
      path: path.join(screenshotDir, '03-submission-result.png'),
      fullPage: true
    });

    if (result === 'success') {
      console.log('✅ API call succeeded! Analysis results displayed.');
      
      // Wait a bit for all results to load
      await page.waitForTimeout(3000);
      
      // Take detailed screenshots of results
      await page.screenshot({
        path: path.join(screenshotDir, '04-analysis-results.png'),
        fullPage: true
      });
      
      // Check if STR section is visible
      const strSection = await page.$('#str-analysis');
      if (strSection) {
        await page.screenshot({
          path: path.join(screenshotDir, '05-str-analysis.png'),
          fullPage: true
        });
      }
    } else if (result === 'error' || result === 'alert') {
      console.log('❌ API call failed. Error displayed.');
      
      // Get error message
      try {
        const errorText = await page.evaluate(() => {
          const error = document.querySelector('.error-message') || document.querySelector('[role="alert"]');
          return error ? error.textContent : 'Unknown error';
        });
        console.log('Error message:', errorText);
      } catch (e) {
        console.log('Could not retrieve error message');
      }
    } else {
      console.log('⏱️ Request timed out');
    }

    // Log all API calls made
    console.log('\nAPI Calls made during test:');
    apiCalls.forEach(call => {
      console.log(`- ${call.method} ${call.url}`);
    });

    // Final screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '06-final-state.png'),
      fullPage: true
    });

    console.log(`\nScreenshots saved to: ${screenshotDir}`);

  } catch (error) {
    console.error('Test failed:', error);
    
    // Take error screenshot if screenshotDir exists
    try {
      const screenshotDir = path.join(__dirname, 'screenshots', 'api-test', new Date().toISOString().split('T')[0]);
      await fs.mkdir(screenshotDir, { recursive: true });
      await page.screenshot({
        path: path.join(screenshotDir, 'error-state.png'),  
        fullPage: true
      });
    } catch (e) {
      console.error('Could not save error screenshot:', e.message);
    }
  } finally {
    await browser.close();
  }
}

// Run the test
testAPIConnection().catch(console.error);