const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

async function testDeploymentForm() {
  const screenshotDir = path.join(__dirname, 'screenshots', 'deployment-test-quick', new Date().toISOString().split('T')[0]);
  await fs.ensureDir(screenshotDir);

  let browser;
  try {
    console.log('🚀 Starting deployment form test...');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Enable console logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('error', err => console.error('Browser error:', err));
    page.on('pageerror', err => console.error('Page error:', err));

    const url = 'https://starter-pack-cpl95dq4b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
    
    console.log('📍 Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: true 
    });
    console.log('📸 Screenshot: Initial page load');

    // Wait for form to be ready - wait for the analyze button
    await page.waitForFunction(
      () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent.includes('Analyze Property'));
      },
      { timeout: 30000 }
    );
    
    // Fill in the form fields
    console.log('📝 Filling form fields...');
    
    // Clear and fill address field (it's pre-filled)
    const addressInput = await page.$('input[placeholder*="Property Address"]');
    await addressInput.click({ clickCount: 3 }); // Select all
    await addressInput.type('123 King Street West, Toronto, ON, M5V 3A8');
    
    // Clear and fill purchase price (it's pre-filled)
    const priceInput = await page.$('input[placeholder*="Purchase Price"]');
    await priceInput.click({ clickCount: 3 }); // Select all
    await priceInput.type('750000');
    
    // Select bedrooms from dropdown
    const bedroomsSelect = await page.$('select[name="bedrooms"]');
    await bedroomsSelect.select('2');
    
    // Select bathrooms from dropdown
    const bathroomsSelect = await page.$('select[name="bathrooms"]');
    await bathroomsSelect.select('2');
    
    // Click "Add More Details" to show additional fields
    const moreDetailsButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Add More Details'));
    });
    if (moreDetailsButton && await moreDetailsButton.evaluate(el => el !== null)) {
      await moreDetailsButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Fill square feet if visible
    const sqftInput = await page.$('input[placeholder*="Square Feet"]');
    if (sqftInput) {
      await sqftInput.type('850');
    }
    
    // Select property type if visible
    const propertyTypeSelect = await page.$('select[name="propertyType"]');
    if (propertyTypeSelect) {
      await propertyTypeSelect.select('condo');
    }
    
    // Fill property taxes if visible
    const taxesInput = await page.$('input[placeholder*="Property Taxes"]');
    if (taxesInput) {
      await taxesInput.type('4500');
    }
    
    // Fill condo fees if visible
    const condoInput = await page.$('input[placeholder*="Condo Fees"]');
    if (condoInput) {
      await condoInput.type('650');
    }
    
    // Take screenshot of filled form
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-form-filled.png'),
      fullPage: true 
    });
    console.log('📸 Screenshot: Form filled');

    // Submit the form
    console.log('🚀 Submitting form...');
    const submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Analyze Property'));
    });
    await submitButton.click();
    
    // Take screenshot immediately after submission
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-form-submitted.png'),
      fullPage: true 
    });
    console.log('📸 Screenshot: Form submitted');

    // Wait for loading state
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-loading-state.png'),
      fullPage: true 
    });
    console.log('📸 Screenshot: Loading state');

    // Wait for results (with longer timeout)
    try {
      await page.waitForSelector('#results-container', { 
        visible: true, 
        timeout: 120000 // 2 minutes for API processing
      });
      
      console.log('✅ Results container appeared!');
      
      // Wait a bit for all content to load
      await page.waitForTimeout(5000);
      
      // Take screenshot of results
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-analysis-results.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot: Analysis results');
      
      // Check for different tabs and capture each
      const tabs = ['summary', 'rental', 'str', 'comparison'];
      
      for (const tab of tabs) {
        try {
          const tabButton = await page.$(`[data-tab="${tab}"]`);
          if (tabButton) {
            await tabButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ 
              path: path.join(screenshotDir, `06-tab-${tab}.png`),
              fullPage: true 
            });
            console.log(`📸 Screenshot: ${tab} tab`);
          }
        } catch (err) {
          console.log(`⚠️  Could not capture ${tab} tab:`, err.message);
        }
      }
      
      // Check for any error messages
      const errorElement = await page.$('.error-message, .alert-danger, [role="alert"]');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.error('❌ Error message found:', errorText);
      } else {
        console.log('✅ No error messages detected');
      }
      
      console.log('🎉 Test completed successfully!');
      
    } catch (error) {
      console.error('❌ Failed to get results:', error.message);
      
      // Take error screenshot
      await page.screenshot({ 
        path: path.join(screenshotDir, 'error-state.png'),
        fullPage: true 
      });
      
      // Try to get any error messages
      const pageContent = await page.content();
      if (pageContent.includes('error') || pageContent.includes('Error')) {
        console.log('🔍 Page contains error indicators');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log(`📁 Screenshots saved to: ${screenshotDir}`);
  }
}

// Run the test
testDeploymentForm();