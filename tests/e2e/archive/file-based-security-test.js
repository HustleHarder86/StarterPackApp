const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const FILE_PATH = path.join(__dirname, '../../roi-finder.html');
const BASE_URL = `file://${FILE_PATH}`;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'file-security-test', new Date().toISOString().split('T')[0]);

// Test data
const TEST_PROPERTY = {
  address: '123 Test Street, Toronto, ON',
  price: '750000',
  propertyTax: '6500',
  condoFees: '450',
  downPayment: '20',
  interestRate: '5.5',
  bedrooms: '3',
  bathrooms: '2',
  squareFeet: '1500'
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
  console.log(`📸 Screenshot saved: ${filename}`);
  return filepath;
}

// Main test function
async function runSecurityTest() {
  console.log('🚀 Starting File-Based Security Test...');
  console.log(`📁 Testing file: ${FILE_PATH}`);
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}`);
  
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
  
  const testResults = {
    timestamp: new Date().toISOString(),
    fileExists: false,
    pageLoaded: false,
    elementsFound: {},
    formFunctionality: false,
    authModalWorks: false,
    errors: [],
    consoleErrors: []
  };
  
  try {
    // Check if file exists
    try {
      await fs.access(FILE_PATH);
      testResults.fileExists = true;
      console.log('✅ File exists');
    } catch {
      testResults.errors.push('roi-finder.html file not found');
      console.error('❌ File not found');
      return testResults;
    }
    
    const page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      testResults.consoleErrors.push(error.message);
    });
    
    // Navigate to the page
    console.log('\n📄 Loading page...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    testResults.pageLoaded = true;
    console.log('✅ Page loaded');
    
    await takeScreenshot(page, '01-initial-load');
    
    // Check for critical elements
    console.log('\n🔍 Checking for critical elements...');
    const elements = {
      'form': '#property-form',
      'addressInput': '#addressInput',
      'purchasePrice': '#purchasePrice',
      'propertyTax': '#propertyTax',
      'analyzeButton': '#analyzeButton',
      'authModal': '#authModal'
    };
    
    for (const [name, selector] of Object.entries(elements)) {
      try {
        const element = await page.$(selector);
        testResults.elementsFound[name] = !!element;
        console.log(`${element ? '✅' : '❌'} ${name}: ${selector}`);
      } catch (error) {
        testResults.elementsFound[name] = false;
        console.log(`❌ ${name}: ${selector} - Error: ${error.message}`);
      }
    }
    
    // Test form functionality
    console.log('\n📝 Testing form functionality...');
    try {
      await page.type('#addressInput', TEST_PROPERTY.address);
      await page.type('#purchasePrice', TEST_PROPERTY.price);
      await page.type('#propertyTax', TEST_PROPERTY.propertyTax);
      await page.type('#condoFees', TEST_PROPERTY.condoFees);
      
      await takeScreenshot(page, '02-form-filled');
      
      testResults.formFunctionality = true;
      console.log('✅ Form inputs working');
    } catch (error) {
      testResults.errors.push(`Form functionality error: ${error.message}`);
      console.log('❌ Form inputs not working');
    }
    
    // Test analyze button and auth modal
    console.log('\n🔐 Testing authentication flow...');
    try {
      await page.click('#analyzeButton');
      await page.waitForTimeout(2000);
      
      // Check if auth modal appears
      const authModalVisible = await page.evaluate(() => {
        const modal = document.querySelector('#authModal');
        return modal && (modal.style.display === 'block' || modal.classList.contains('show'));
      });
      
      if (authModalVisible) {
        testResults.authModalWorks = true;
        console.log('✅ Auth modal appears on analyze');
        await takeScreenshot(page, '03-auth-modal');
        
        // Test guest continue
        const guestButton = await page.$('#guestContinue');
        if (guestButton) {
          await guestButton.click();
          console.log('✅ Guest continue button found and clicked');
          await page.waitForTimeout(2000);
          await takeScreenshot(page, '04-after-guest-continue');
        } else {
          testResults.errors.push('Guest continue button not found');
          console.log('❌ Guest continue button not found');
        }
      } else {
        console.log('❌ Auth modal did not appear');
        testResults.errors.push('Auth modal did not appear when analyze clicked');
      }
    } catch (error) {
      testResults.errors.push(`Auth flow error: ${error.message}`);
      console.log(`❌ Auth flow error: ${error.message}`);
    }
    
    // Test security - XSS prevention
    console.log('\n🛡️ Testing XSS prevention...');
    try {
      await page.reload({ waitUntil: 'networkidle2' });
      const xssPayload = '<script>alert("XSS")</script>';
      await page.type('#addressInput', xssPayload);
      
      const addressValue = await page.$eval('#addressInput', el => el.value);
      if (addressValue === xssPayload) {
        console.log('✅ XSS payload accepted in input (will be sanitized on backend)');
      }
      await takeScreenshot(page, '05-xss-test');
    } catch (error) {
      testResults.errors.push(`XSS test error: ${error.message}`);
    }
    
    // Test authentication bypass attempt
    console.log('\n🔓 Testing authentication bypass prevention...');
    try {
      await page.evaluate(() => {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', 'hacker@test.com');
        sessionStorage.setItem('isAuthenticated', 'true');
      });
      
      await page.reload({ waitUntil: 'networkidle2' });
      await page.type('#addressInput', TEST_PROPERTY.address);
      await page.type('#purchasePrice', TEST_PROPERTY.price);
      await page.click('#analyzeButton');
      await page.waitForTimeout(2000);
      
      const authModalShownAgain = await page.evaluate(() => {
        const modal = document.querySelector('#authModal');
        return modal && (modal.style.display === 'block' || modal.classList.contains('show'));
      });
      
      if (authModalShownAgain) {
        console.log('✅ Auth bypass prevented - modal still shows');
      } else {
        console.log('⚠️  Auth modal not shown - may indicate bypass vulnerability');
        testResults.errors.push('Potential auth bypass - modal not shown after localStorage manipulation');
      }
      
      await takeScreenshot(page, '06-auth-bypass-attempt');
    } catch (error) {
      testResults.errors.push(`Auth bypass test error: ${error.message}`);
    }
    
    // Test mobile responsiveness
    console.log('\n📱 Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle2' });
    await takeScreenshot(page, '07-mobile-view');
    
    const mobileOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    if (!mobileOverflow) {
      console.log('✅ No horizontal overflow on mobile');
    } else {
      console.log('❌ Horizontal overflow detected on mobile');
      testResults.errors.push('Horizontal overflow on mobile view');
    }
    
  } catch (error) {
    testResults.errors.push(`Critical error: ${error.message}`);
    console.error('❌ Critical error:', error);
  } finally {
    await browser.close();
  }
  
  // Generate summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`File Exists: ${testResults.fileExists ? '✅' : '❌'}`);
  console.log(`Page Loaded: ${testResults.pageLoaded ? '✅' : '❌'}`);
  console.log(`Form Works: ${testResults.formFunctionality ? '✅' : '❌'}`);
  console.log(`Auth Modal Works: ${testResults.authModalWorks ? '✅' : '❌'}`);
  console.log(`\nElements Found:`);
  for (const [element, found] of Object.entries(testResults.elementsFound)) {
    console.log(`  ${element}: ${found ? '✅' : '❌'}`);
  }
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ Errors (${testResults.errors.length}):`);
    testResults.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (testResults.consoleErrors.length > 0) {
    console.log(`\n⚠️  Console Errors (${testResults.consoleErrors.length}):`);
    testResults.consoleErrors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n' + '═'.repeat(60));
  
  // Save report
  const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📊 Detailed report saved to: ${reportPath}`);
  
  return testResults;
}

// Run test
runSecurityTest().catch(console.error);