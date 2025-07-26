const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const TEST_CONFIG = {
  email: 'amy__ali@hotmail.com',
  password: 'YFJ3-zSx',
  baseUrl: 'https://starterpackapp.vercel.app', // Adjust this if different
  timeout: 60000,
  screenshotDir: path.join(__dirname, 'screenshots', 'login-test', new Date().toISOString().split('T')[0])
};

// Toronto condo example data
const TORONTO_CONDO = {
  address: '88 Harbour Street, Unit 2012',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5J 0C3',
  price: '749900',
  squareFootage: '850',
  bedrooms: '2',
  bathrooms: '2',
  yearBuilt: '2017',
  propertyType: 'Condo',
  propertyTax: '5490',
  monthlyCondoFees: '450',
  description: 'Luxury waterfront condo with stunning lake views'
};

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
  }
}

async function takeScreenshot(page, name) {
  const filename = path.join(TEST_CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot saved: ${name}.png`);
  return filename;
}

async function waitAndClick(page, selector, description) {
  console.log(`Clicking: ${description}`);
  await page.waitForSelector(selector, { visible: true, timeout: 30000 });
  await page.click(selector);
}

async function waitAndType(page, selector, text, description) {
  console.log(`Typing into: ${description}`);
  await page.waitForSelector(selector, { visible: true, timeout: 30000 });
  await page.click(selector);
  await page.type(selector, text);
}

async function checkConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

async function runLoginTest() {
  console.log('Starting comprehensive login and functionality test...');
  console.log('='.repeat(80));
  
  await ensureDirectoryExists(TEST_CONFIG.screenshotDir);
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI/CD
    defaultViewport: {
      width: 1280,
      height: 800
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const errors = checkConsoleErrors(page);
  
  try {
    // Test results tracking
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      screenshots: [],
      errors: []
    };
    
    // 1. Navigate to the application
    console.log('\n1. Navigating to application...');
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle2', timeout: TEST_CONFIG.timeout });
    testResults.screenshots.push(await takeScreenshot(page, '01-initial-load'));
    
    // Check if redirected to roi-finder.html
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (!currentUrl.includes('roi-finder')) {
      console.log('Navigating directly to roi-finder.html...');
      await page.goto(`${TEST_CONFIG.baseUrl}/roi-finder.html`, { waitUntil: 'networkidle2' });
    }
    
    // 2. Check for login form
    console.log('\n2. Looking for login form...');
    try {
      await page.waitForSelector('#login-section', { visible: true, timeout: 10000 });
      console.log('Login section found');
      testResults.screenshots.push(await takeScreenshot(page, '02-login-page'));
    } catch (e) {
      console.log('Login section not immediately visible, checking auth status...');
      // Check if already logged in
      const appSection = await page.$('#app-section');
      if (appSection) {
        console.log('App section found - user might be already logged in');
        testResults.screenshots.push(await takeScreenshot(page, '02-already-logged-in'));
      }
    }
    
    // 3. Attempt login
    console.log('\n3. Attempting login with provided credentials...');
    try {
      // Clear any existing session
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload({ waitUntil: 'networkidle2' });
      
      // Wait for login form
      await page.waitForSelector('#login-email', { visible: true, timeout: 30000 });
      
      // Enter credentials
      await waitAndType(page, '#login-email', TEST_CONFIG.email, 'email field');
      await waitAndType(page, '#login-password', TEST_CONFIG.password, 'password field');
      testResults.screenshots.push(await takeScreenshot(page, '03-credentials-entered'));
      
      // Click login button
      await waitAndClick(page, '#login-button', 'login button');
      
      // Wait for either success or error
      await page.waitForFunction(() => {
        return document.querySelector('#app-section') || document.querySelector('.error-message');
      }, { timeout: 30000 });
      
      // Check for errors
      const errorMessage = await page.$('.error-message');
      if (errorMessage) {
        const errorText = await page.evaluate(el => el.textContent, errorMessage);
        console.error('Login error:', errorText);
        testResults.errors.push({ step: 'login', error: errorText });
        testResults.screenshots.push(await takeScreenshot(page, '03-login-error'));
        
        // Try alternative methods
        console.log('\n3a. Trying alternative login methods...');
        
        // Try incognito mode
        const context = await browser.createIncognitoBrowserContext();
        const incognitoPage = await context.newPage();
        await incognitoPage.goto(`${TEST_CONFIG.baseUrl}/roi-finder.html`, { waitUntil: 'networkidle2' });
        testResults.screenshots.push(await incognitoPage.screenshot({ 
          path: path.join(TEST_CONFIG.screenshotDir, '03a-incognito-attempt.png'),
          fullPage: true 
        }));
        await context.close();
      } else {
        console.log('Login successful!');
        testResults.tests.push({ name: 'Login', status: 'PASSED' });
        testResults.screenshots.push(await takeScreenshot(page, '04-login-success'));
      }
      
    } catch (loginError) {
      console.error('Login process failed:', loginError.message);
      testResults.errors.push({ step: 'login', error: loginError.message });
      testResults.tests.push({ name: 'Login', status: 'FAILED', error: loginError.message });
      
      // Capture console errors
      if (errors.length > 0) {
        console.log('\nConsole errors detected:');
        errors.forEach(err => console.error(err));
        testResults.errors.push({ step: 'console', errors });
      }
      
      // Capture network errors
      const failedRequests = [];
      page.on('requestfailed', request => {
        failedRequests.push({
          url: request.url(),
          failure: request.failure().errorText
        });
      });
      
      if (failedRequests.length > 0) {
        console.log('\nFailed network requests:');
        failedRequests.forEach(req => console.error(`${req.url}: ${req.failure}`));
        testResults.errors.push({ step: 'network', requests: failedRequests });
      }
      
      testResults.screenshots.push(await takeScreenshot(page, '04-login-failed'));
    }
    
    // 4. If login successful, test property form
    const appSection = await page.$('#app-section');
    if (appSection) {
      console.log('\n4. Testing property form submission...');
      
      try {
        // Wait for form to be ready
        await page.waitForSelector('#property-form', { visible: true, timeout: 30000 });
        
        // Fill property form
        console.log('Filling property form with Toronto condo data...');
        await waitAndType(page, '#address', TORONTO_CONDO.address, 'address');
        await waitAndType(page, '#city', TORONTO_CONDO.city, 'city');
        await page.select('#province', TORONTO_CONDO.province);
        await waitAndType(page, '#postal-code', TORONTO_CONDO.postalCode, 'postal code');
        await waitAndType(page, '#price', TORONTO_CONDO.price, 'price');
        await waitAndType(page, '#square-footage', TORONTO_CONDO.squareFootage, 'square footage');
        await waitAndType(page, '#bedrooms', TORONTO_CONDO.bedrooms, 'bedrooms');
        await waitAndType(page, '#bathrooms', TORONTO_CONDO.bathrooms, 'bathrooms');
        await waitAndType(page, '#year-built', TORONTO_CONDO.yearBuilt, 'year built');
        await page.select('#property-type', TORONTO_CONDO.propertyType);
        await waitAndType(page, '#property-tax', TORONTO_CONDO.propertyTax, 'property tax');
        await waitAndType(page, '#monthly-condo-fees', TORONTO_CONDO.monthlyCondoFees, 'condo fees');
        await waitAndType(page, '#description', TORONTO_CONDO.description, 'description');
        
        testResults.screenshots.push(await takeScreenshot(page, '05-form-filled'));
        
        // Submit form
        console.log('Submitting property form...');
        await waitAndClick(page, '#analyze-button', 'analyze button');
        
        // Wait for results
        await page.waitForSelector('#results-section', { visible: true, timeout: 60000 });
        console.log('Analysis results received!');
        testResults.tests.push({ name: 'Property Form Submission', status: 'PASSED' });
        testResults.screenshots.push(await takeScreenshot(page, '06-analysis-results'));
        
        // 5. Test all three tabs
        console.log('\n5. Testing all analysis tabs...');
        
        // Long-term rental tab
        await waitAndClick(page, '[data-tab="ltr"]', 'LTR tab');
        await page.waitForTimeout(2000);
        testResults.screenshots.push(await takeScreenshot(page, '07-ltr-tab'));
        testResults.tests.push({ name: 'LTR Tab', status: 'PASSED' });
        
        // Short-term rental tab
        await waitAndClick(page, '[data-tab="str"]', 'STR tab');
        await page.waitForTimeout(2000);
        testResults.screenshots.push(await takeScreenshot(page, '08-str-tab'));
        testResults.tests.push({ name: 'STR Tab', status: 'PASSED' });
        
        // Investment analysis tab
        await waitAndClick(page, '[data-tab="investment"]', 'Investment tab');
        await page.waitForTimeout(2000);
        testResults.screenshots.push(await takeScreenshot(page, '09-investment-tab'));
        testResults.tests.push({ name: 'Investment Tab', status: 'PASSED' });
        
        // 6. Test interactive elements
        console.log('\n6. Testing interactive elements...');
        
        // Test calculator if visible
        const calculator = await page.$('.financial-calculator');
        if (calculator) {
          console.log('Testing financial calculator...');
          await page.evaluate(() => {
            const input = document.querySelector('.financial-calculator input[type="number"]');
            if (input) {
              input.value = '100000';
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });
          await page.waitForTimeout(1000);
          testResults.screenshots.push(await takeScreenshot(page, '10-calculator-test'));
          testResults.tests.push({ name: 'Financial Calculator', status: 'PASSED' });
        }
        
        // Test PDF generation
        const pdfButton = await page.$('[id*="pdf"], [class*="pdf"]');
        if (pdfButton) {
          console.log('Testing PDF generation...');
          await pdfButton.click();
          await page.waitForTimeout(3000);
          testResults.screenshots.push(await takeScreenshot(page, '11-pdf-generation'));
          testResults.tests.push({ name: 'PDF Generation', status: 'PASSED' });
        }
        
      } catch (formError) {
        console.error('Form testing failed:', formError.message);
        testResults.errors.push({ step: 'form-testing', error: formError.message });
        testResults.tests.push({ name: 'Property Form Testing', status: 'FAILED', error: formError.message });
        testResults.screenshots.push(await takeScreenshot(page, 'form-error'));
      }
    }
    
    // 7. Generate test report
    console.log('\n7. Generating test report...');
    const reportPath = path.join(TEST_CONFIG.screenshotDir, 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total tests: ${testResults.tests.length}`);
    console.log(`Passed: ${testResults.tests.filter(t => t.status === 'PASSED').length}`);
    console.log(`Failed: ${testResults.tests.filter(t => t.status === 'FAILED').length}`);
    console.log(`Errors: ${testResults.errors.length}`);
    console.log(`Screenshots: ${testResults.screenshots.length}`);
    console.log(`\nReport saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${TEST_CONFIG.screenshotDir}`);
    
    return testResults;
    
  } catch (error) {
    console.error('\nTest execution failed:', error);
    await takeScreenshot(page, 'critical-error');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
runLoginTest()
  .then(results => {
    console.log('\nTest completed successfully');
    process.exit(results.errors.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  });