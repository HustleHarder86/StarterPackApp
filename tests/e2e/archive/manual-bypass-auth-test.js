const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create timestamp for this test run
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const screenshotDir = path.join(__dirname, 'screenshots', 'manual-test', timestamp);

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error('Error creating directory:', err);
  }
}

async function captureScreenshot(page, name) {
  try {
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

async function testWithManualBypass() {
  console.log('🚀 Starting manual bypass test...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for manual intervention
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await ensureDir(screenshotDir);

  try {
    // Step 1: Navigate directly with test user session
    console.log('📍 Step 1: Setting up test session...');
    
    // Set a test user in localStorage to bypass auth
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('currentUser', JSON.stringify({
        email: 'test@example.com',
        uid: 'test-user-123',
        subscriptionTier: 'free',
        strTrialUsed: 0
      }));
      localStorage.setItem('isAuthenticated', 'true');
    });

    // Navigate to the app
    await page.goto('https://starter-pack-cf80kci6b-hustleharder86s-projects.vercel.app/roi-finder.html', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    await captureScreenshot(page, '01-after-auth-bypass');

    // Check if we bypassed auth
    const isOnPropertyForm = await page.evaluate(() => {
      return document.querySelector('form') && 
             !document.querySelector('input[type="password"]');
    });

    if (isOnPropertyForm) {
      console.log('✅ Successfully bypassed authentication!');
      
      // Step 2: Fill the property form
      console.log('\n📍 Step 2: Filling property form...');
      
      // Try different selectors for form fields
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

      // Fill fields using evaluate to bypass selector issues
      await page.evaluate((data) => {
        // Address
        const addressInput = document.querySelector('input[type="text"]') || 
                           document.querySelector('input[name="address"]');
        if (addressInput) {
          addressInput.value = data.address;
          addressInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Price
        const priceInputs = document.querySelectorAll('input[type="number"]');
        if (priceInputs[0]) {
          priceInputs[0].value = data.price;
          priceInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Bedrooms
        const bedroomSelect = document.querySelector('select[name="bedrooms"]') || 
                            document.querySelectorAll('select')[0];
        if (bedroomSelect) {
          bedroomSelect.value = data.bedrooms;
          bedroomSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Bathrooms
        const bathroomSelect = document.querySelector('select[name="bathrooms"]') || 
                             document.querySelectorAll('select')[1];
        if (bathroomSelect) {
          bathroomSelect.value = data.bathrooms;
          bathroomSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Square feet
        const sqftInput = priceInputs[1] || document.querySelector('input[name="sqft"]');
        if (sqftInput) {
          sqftInput.value = data.sqft;
          sqftInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Property type
        const propertyTypeSelect = document.querySelector('select[name="propertyType"]') || 
                                 document.querySelectorAll('select')[2];
        if (propertyTypeSelect) {
          propertyTypeSelect.value = data.propertyType;
          propertyTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Property taxes
        const taxInput = priceInputs[2] || document.querySelector('input[name="propertyTaxes"]');
        if (taxInput) {
          taxInput.value = data.propertyTaxes;
          taxInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Condo fees
        const condoInput = priceInputs[3] || document.querySelector('input[name="condoFees"]');
        if (condoInput) {
          condoInput.value = data.condoFees;
          condoInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, formData);

      await new Promise(resolve => setTimeout(resolve, 1000));
      await captureScreenshot(page, '02-form-filled');

      // Submit form
      console.log('\n📍 Step 3: Submitting form...');
      await page.evaluate(() => {
        const submitBtn = document.querySelector('button[type="submit"]') || 
                         document.querySelector('button');
        if (submitBtn) submitBtn.click();
      });

      // Wait for results
      await new Promise(resolve => setTimeout(resolve, 10000));
      await captureScreenshot(page, '03-after-submit');

      // Check for results
      const hasResults = await page.evaluate(() => {
        return document.querySelector('.results') || 
               document.querySelector('.tabs') ||
               document.querySelector('[role="tablist"]');
      });

      if (hasResults) {
        console.log('✅ Results loaded successfully!');
        
        // Test tabs
        console.log('\n📍 Step 4: Testing tabs...');
        const tabCount = await page.evaluate(() => {
          const tabs = document.querySelectorAll('[role="tab"], .tab-button, .nav-link');
          return tabs.length;
        });

        console.log(`Found ${tabCount} tabs`);
        
        // Click each tab
        for (let i = 0; i < tabCount; i++) {
          await page.evaluate((index) => {
            const tabs = document.querySelectorAll('[role="tab"], .tab-button, .nav-link');
            if (tabs[index]) tabs[index].click();
          }, i);
          
          await new Promise(resolve => setTimeout(resolve, 1500));
          await captureScreenshot(page, `04-tab-${i + 1}`);
        }

        // Test mobile views
        console.log('\n📍 Step 5: Testing mobile responsiveness...');
        const viewports = [
          { name: 'mobile-portrait', width: 375, height: 812 },
          { name: 'mobile-landscape', width: 812, height: 375 },
          { name: 'tablet', width: 768, height: 1024 }
        ];

        for (const vp of viewports) {
          await page.setViewport(vp);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await captureScreenshot(page, `05-${vp.name}`);
        }

      } else {
        console.log('❌ No results found after submission');
        
        // Check for errors
        const errorText = await page.evaluate(() => {
          const error = document.querySelector('.error, .alert-danger, [role="alert"]');
          return error ? error.textContent : null;
        });
        
        if (errorText) {
          console.log(`Error found: ${errorText}`);
        }
      }

    } else {
      console.log('❌ Failed to bypass authentication');
      
      // Try clicking logout and then setting auth again
      console.log('Attempting alternative bypass...');
      
      await page.evaluate(() => {
        const logoutBtn = document.querySelector('button:contains("Logout"), a:contains("Logout")');
        if (logoutBtn) logoutBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await captureScreenshot(page, '06-current-state');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    await captureScreenshot(page, 'error-state');
  }

  console.log('\n⏸️  Browser will remain open for 30 seconds for manual inspection...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await browser.close();
}

// Run the test
testWithManualBypass().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});