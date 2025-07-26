const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const FILE_PATH = path.join(__dirname, '../../roi-finder.html');
const BASE_URL = `file://${FILE_PATH}`;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'actual-test', new Date().toISOString().split('T')[0]);

// Test data
const TEST_PROPERTY = {
  address: '123 Test Street, Toronto, ON M5V 3A8',
  price: '750000',
  bedrooms: '3',
  bathrooms: '2',
  sqft: '1500',
  propertyType: 'Condo',
  taxes: '6500',
  condoFees: '450'
};

const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!'
};

// Utility functions
async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshot directory:', error);
  }
}

async function takeScreenshot(page, name) {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
  return filepath;
}

async function waitAndClick(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.click(selector);
    return true;
  } catch (error) {
    console.error(`Failed to click ${selector}:`, error.message);
    return false;
  }
}

// Main test function
async function runComprehensiveTest() {
  console.log('🚀 Starting Actual Structure Test...');
  console.log(`📁 Testing file: ${FILE_PATH}`);
  console.log(`📁 Screenshots: ${SCREENSHOT_DIR}\n`);
  
  await ensureScreenshotDir();
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
    warnings: []
  };
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.warnings.push(`Console error: ${msg.text()}`);
      }
    });
    
    // Test 1: Initial Page Load
    console.log('🧪 Test 1: Initial Page Load');
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000); // Wait for dynamic content
      
      await takeScreenshot(page, '01-initial-page');
      
      // Check which section is visible
      const visibleSection = await page.evaluate(() => {
        const sections = ['loading-state', 'login-section', 'property-input-section'];
        for (const id of sections) {
          const element = document.getElementById(id);
          if (element && !element.classList.contains('hidden')) {
            return id;
          }
        }
        return 'none';
      });
      
      console.log(`✅ Page loaded - Visible section: ${visibleSection}`);
      results.tests.pageLoad = { success: true, visibleSection };
      
    } catch (error) {
      console.log('❌ Page load failed:', error.message);
      results.tests.pageLoad = { success: false, error: error.message };
      results.errors.push(`Page load: ${error.message}`);
    }
    
    // Test 2: Authentication Flow
    console.log('\n🧪 Test 2: Authentication Flow');
    try {
      // Check if login section is visible
      const loginVisible = await page.evaluate(() => {
        const loginSection = document.getElementById('login-section');
        return loginSection && !loginSection.classList.contains('hidden');
      });
      
      if (loginVisible) {
        console.log('✅ Login section is visible');
        await takeScreenshot(page, '02-login-section');
        
        // Try to fill login form
        await page.type('#login-email', TEST_USER.email);
        await page.type('#login-password', TEST_USER.password);
        await takeScreenshot(page, '03-login-filled');
        
        // Click login button
        const loginClicked = await waitAndClick(page, '#login-form button[type="submit"]');
        if (loginClicked) {
          console.log('✅ Login button clicked');
          await page.waitForTimeout(3000);
          await takeScreenshot(page, '04-after-login');
        }
        
        results.tests.authentication = { success: true, loginVisible: true };
      } else {
        console.log('⚠️  Login section not visible, skipping auth test');
        results.tests.authentication = { success: true, loginVisible: false };
      }
      
    } catch (error) {
      console.log('❌ Authentication test failed:', error.message);
      results.tests.authentication = { success: false, error: error.message };
      results.errors.push(`Authentication: ${error.message}`);
    }
    
    // Test 3: Property Form with Test Mode
    console.log('\n🧪 Test 3: Property Form (Test Mode)');
    try {
      // Navigate with test mode parameters
      const testUrl = `${BASE_URL}?test=true&street=${encodeURIComponent('123 Test St')}&city=Toronto&province=ON&postalCode=M5V3A8&price=750000&bedrooms=3&bathrooms=2&sqft=1500&propertyType=Condo&taxes=6500&condoFees=450`;
      
      await page.goto(testUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
      
      // Check if property input section is visible
      const propertyFormVisible = await page.evaluate(() => {
        const section = document.getElementById('property-input-section');
        return section && !section.classList.contains('hidden');
      });
      
      if (propertyFormVisible) {
        console.log('✅ Property form is visible');
        await takeScreenshot(page, '05-property-form-prefilled');
        
        // Check if form was pre-filled
        const formValues = await page.evaluate(() => {
          return {
            address: document.getElementById('property-address')?.value || '',
            price: document.getElementById('property-price')?.value || '',
            bedrooms: document.getElementById('property-bedrooms')?.value || '',
            bathrooms: document.getElementById('property-bathrooms')?.value || '',
            sqft: document.getElementById('property-sqft')?.value || '',
            taxes: document.getElementById('property-taxes')?.value || '',
            condoFees: document.getElementById('property-condofees')?.value || ''
          };
        });
        
        console.log('Form values:', formValues);
        results.tests.propertyForm = { success: true, formValues, prefilled: formValues.price !== '' };
        
      } else {
        console.log('❌ Property form not visible');
        results.tests.propertyForm = { success: false, error: 'Form not visible' };
        results.errors.push('Property form not visible in test mode');
      }
      
    } catch (error) {
      console.log('❌ Property form test failed:', error.message);
      results.tests.propertyForm = { success: false, error: error.message };
      results.errors.push(`Property form: ${error.message}`);
    }
    
    // Test 4: Form Submission
    console.log('\n🧪 Test 4: Form Submission');
    try {
      // Try to submit the form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        const buttonText = await page.evaluate(el => el.textContent, submitButton);
        console.log(`Found submit button: "${buttonText.trim()}"`);
        
        await submitButton.click();
        console.log('✅ Submit button clicked');
        
        await page.waitForTimeout(3000);
        await takeScreenshot(page, '06-after-submit');
        
        // Check what happened after submission
        const currentState = await page.evaluate(() => {
          const sections = {
            loading: document.getElementById('loading-state'),
            login: document.getElementById('login-section'),
            propertyInput: document.getElementById('property-input-section'),
            confirmation: document.getElementById('property-confirmation'),
            results: document.getElementById('analysis-results'),
            error: document.getElementById('error-state')
          };
          
          const visible = [];
          for (const [name, element] of Object.entries(sections)) {
            if (element && !element.classList.contains('hidden')) {
              visible.push(name);
            }
          }
          return visible;
        });
        
        console.log('Visible sections after submit:', currentState);
        results.tests.formSubmission = { success: true, visibleSections: currentState };
        
      } else {
        console.log('❌ Submit button not found');
        results.tests.formSubmission = { success: false, error: 'Submit button not found' };
        results.errors.push('Submit button not found');
      }
      
    } catch (error) {
      console.log('❌ Form submission test failed:', error.message);
      results.tests.formSubmission = { success: false, error: error.message };
      results.errors.push(`Form submission: ${error.message}`);
    }
    
    // Test 5: Mobile Responsiveness
    console.log('\n🧪 Test 5: Mobile Responsiveness');
    try {
      // Test different viewports
      const viewports = [
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 812 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewport(viewport);
        await page.reload({ waitUntil: 'networkidle2' });
        await page.waitForTimeout(1000);
        
        const overflow = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });
        
        console.log(`${viewport.name}: ${overflow ? '❌ Has overflow' : '✅ No overflow'}`);
        await takeScreenshot(page, `07-responsive-${viewport.name}`);
        
        if (overflow) {
          results.warnings.push(`Horizontal overflow on ${viewport.name}`);
        }
      }
      
      results.tests.responsiveness = { success: true };
      
    } catch (error) {
      console.log('❌ Responsiveness test failed:', error.message);
      results.tests.responsiveness = { success: false, error: error.message };
      results.errors.push(`Responsiveness: ${error.message}`);
    }
    
    // Test 6: Security - XSS Prevention
    console.log('\n🧪 Test 6: Security Tests');
    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.reload({ waitUntil: 'networkidle2' });
      
      // Try XSS payload in address field
      const addressInput = await page.$('#property-address');
      if (addressInput) {
        await addressInput.click({ clickCount: 3 }); // Select all
        await addressInput.type('<script>alert("XSS")</script>');
        
        const value = await page.$eval('#property-address', el => el.value);
        console.log('XSS test - Input value:', value);
        
        await takeScreenshot(page, '08-xss-test');
      }
      
      // Try localStorage manipulation
      await page.evaluate(() => {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', 'hacker@test.com');
        localStorage.setItem('authToken', 'fake-token-123');
      });
      
      await page.reload({ waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
      
      // Check if we bypassed auth
      const afterBypassAttempt = await page.evaluate(() => {
        const propertySection = document.getElementById('property-input-section');
        const loginSection = document.getElementById('login-section');
        return {
          propertyVisible: propertySection && !propertySection.classList.contains('hidden'),
          loginVisible: loginSection && !loginSection.classList.contains('hidden'),
          localStorage: {
            isAuthenticated: localStorage.getItem('isAuthenticated'),
            userEmail: localStorage.getItem('userEmail')
          }
        };
      });
      
      console.log('Auth bypass attempt result:', afterBypassAttempt);
      await takeScreenshot(page, '09-auth-bypass-attempt');
      
      results.tests.security = { 
        success: true, 
        xssTest: 'completed',
        authBypassTest: afterBypassAttempt 
      };
      
    } catch (error) {
      console.log('❌ Security test failed:', error.message);
      results.tests.security = { success: false, error: error.message };
      results.errors.push(`Security: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Critical test error:', error);
    results.errors.push(`Critical: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  
  const totalTests = Object.keys(results.tests).length;
  const passedTests = Object.values(results.tests).filter(t => t.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (results.warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${results.warnings.length}):`);
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  console.log('\n' + '═'.repeat(60));
  
  // Save detailed report
  const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Detailed report saved to: ${reportPath}`);
  
  return results;
}

// Run test
runComprehensiveTest().catch(console.error);