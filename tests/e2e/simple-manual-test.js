const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const FILE_PATH = path.join(__dirname, '../../roi-finder.html');
const BASE_URL = `file://${FILE_PATH}`;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'manual-test', new Date().toISOString().split('T')[0]);

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  try {
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot: ${filename}`);
  } catch (error) {
    console.error(`Failed to take screenshot ${name}:`, error.message);
  }
  return filepath;
}

// Main test
async function runManualTest() {
  console.log('🚀 Starting Manual E2E Test...');
  console.log(`📁 Testing: ${FILE_PATH}`);
  console.log(`📁 Screenshots: ${SCREENSHOT_DIR}\n`);
  
  await ensureScreenshotDir();
  
  const browser = await puppeteer.launch({
    headless: false, // Run in headed mode to see what's happening
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });
  
  try {
    const page = await browser.newPage();
    
    // Step 1: Load the page
    console.log('📄 Step 1: Loading page...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await wait(3000); // Wait for any dynamic content
    await takeScreenshot(page, '01-initial-load');
    
    // Step 2: Check what's visible
    console.log('\n🔍 Step 2: Checking visible sections...');
    const visibleSections = await page.evaluate(() => {
      const sections = {
        'loading-state': document.getElementById('loading-state'),
        'login-section': document.getElementById('login-section'),
        'property-input-section': document.getElementById('property-input-section'),
        'property-confirmation': document.getElementById('property-confirmation'),
        'analysis-results': document.getElementById('analysis-results'),
        'error-state': document.getElementById('error-state')
      };
      
      const visible = {};
      for (const [name, element] of Object.entries(sections)) {
        visible[name] = element ? !element.classList.contains('hidden') : false;
      }
      return visible;
    });
    
    console.log('Visible sections:', visibleSections);
    
    // Step 3: Try test mode with pre-filled data
    console.log('\n🧪 Step 3: Testing with pre-filled data...');
    const testUrl = `${BASE_URL}?test=true&street=123+Test+Street&city=Toronto&province=ON&postalCode=M5V3A8&price=750000&bedrooms=3&bathrooms=2&sqft=1500&propertyType=Condo&taxes=6500&condoFees=450`;
    
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await wait(3000);
    await takeScreenshot(page, '02-test-mode-loaded');
    
    // Check if property form is now visible
    const propertyFormVisible = await page.evaluate(() => {
      const section = document.getElementById('property-input-section');
      return section && !section.classList.contains('hidden');
    });
    
    if (propertyFormVisible) {
      console.log('✅ Property form is visible in test mode');
      
      // Check form values
      const formData = await page.evaluate(() => {
        const fields = {
          'property-address': document.getElementById('property-address'),
          'property-price': document.getElementById('property-price'),
          'property-bedrooms': document.getElementById('property-bedrooms'),
          'property-bathrooms': document.getElementById('property-bathrooms'),
          'property-sqft': document.getElementById('property-sqft'),
          'property-taxes': document.getElementById('property-taxes'),
          'property-condofees': document.getElementById('property-condofees')
        };
        
        const values = {};
        for (const [name, element] of Object.entries(fields)) {
          values[name] = element ? element.value : 'NOT FOUND';
        }
        return values;
      });
      
      console.log('\nForm field values:');
      Object.entries(formData).forEach(([field, value]) => {
        console.log(`  ${field}: ${value || '(empty)'}`);
      });
      
      await takeScreenshot(page, '03-form-values');
      
      // Step 4: Try to submit the form
      console.log('\n📝 Step 4: Attempting form submission...');
      
      // Find and click the analyze button
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        const buttonText = await page.evaluate(el => el.textContent.trim(), submitButton);
        console.log(`Found submit button: "${buttonText}"`);
        
        // Check if it's the right button (not login)
        if (buttonText.includes('Analyze')) {
          await submitButton.click();
          console.log('✅ Clicked Analyze button');
          await wait(3000);
          await takeScreenshot(page, '04-after-analyze-click');
          
          // Check what happened
          const afterSubmit = await page.evaluate(() => {
            const sections = {
              'loading': document.getElementById('loading-state'),
              'login': document.getElementById('login-section'),
              'property': document.getElementById('property-input-section'),
              'confirmation': document.getElementById('property-confirmation'),
              'results': document.getElementById('analysis-results'),
              'error': document.getElementById('error-state')
            };
            
            const visible = [];
            for (const [name, element] of Object.entries(sections)) {
              if (element && !element.classList.contains('hidden')) {
                visible.push(name);
              }
            }
            
            // Also check for any modals
            const modals = document.querySelectorAll('.modal, [role="dialog"]');
            const visibleModals = Array.from(modals).filter(m => 
              m.style.display !== 'none' && !m.classList.contains('hidden')
            );
            
            return { sections: visible, modals: visibleModals.length };
          });
          
          console.log('After submit - Visible sections:', afterSubmit.sections);
          console.log('Visible modals:', afterSubmit.modals);
          
        } else {
          console.log('⚠️  Submit button is not the Analyze button');
        }
      } else {
        console.log('❌ No submit button found');
      }
      
    } else {
      console.log('❌ Property form not visible even in test mode');
      
      // Check if login is required
      const loginVisible = await page.evaluate(() => {
        const section = document.getElementById('login-section');
        return section && !section.classList.contains('hidden');
      });
      
      if (loginVisible) {
        console.log('ℹ️  Login section is visible - authentication may be required');
        await takeScreenshot(page, '05-login-required');
      }
    }
    
    // Step 5: Test mobile view
    console.log('\n📱 Step 5: Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 812 });
    await wait(1000);
    await takeScreenshot(page, '06-mobile-view');
    
    const mobileOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    console.log(`Mobile view: ${mobileOverflow ? '❌ Has horizontal overflow' : '✅ No overflow'}`);
    
    // Step 6: Check console errors
    console.log('\n⚠️  Step 6: Checking for console errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.reload();
    await wait(2000);
    
    if (consoleErrors.length > 0) {
      console.log(`Found ${consoleErrors.length} console errors`);
    } else {
      console.log('✅ No console errors detected');
    }
    
    console.log('\n✅ Test completed! Check screenshots for visual verification.');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for 10 seconds for manual inspection...');
    await wait(10000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the test
runManualTest().catch(console.error);