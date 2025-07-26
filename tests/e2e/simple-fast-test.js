#!/usr/bin/env node

/**
 * Simple, fast E2E test for StarterPackApp
 * Target duration: < 30 seconds
 * Purpose: Test core functionality only
 */

const puppeteer = require('puppeteer');

const TEST_URL = 'https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true';
const TEST_DATA = {
  address: '123 King Street West, Toronto, ON, M5V 3A8',
  price: '750000',
  bedrooms: '2',
  bathrooms: '2',
  sqft: '850',
  propertyType: 'Condo',
  taxes: '4500',
  condoFees: '650'
};

async function runTest() {
  const startTime = Date.now();
  let browser;
  
  try {
    console.log('🚀 Starting fast E2E test...\n');
    
    // Launch browser (headless for speed)
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to page
    console.log('📍 Navigating to:', TEST_URL);
    await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Check if form is visible (e2e_test_mode should bypass auth)
    const formVisible = await page.$('#property-analysis-form') !== null;
    if (!formVisible) {
      throw new Error('❌ Form not visible - E2E test mode may not be working');
    }
    console.log('✅ Form is visible - E2E test mode working');
    
    // Fill form quickly (no waits between fields)
    console.log('📝 Filling form...');
    await page.type('#property-address', TEST_DATA.address);
    await page.type('#property-price', TEST_DATA.price);
    await page.select('#property-bedrooms', TEST_DATA.bedrooms);
    await page.select('#property-bathrooms', TEST_DATA.bathrooms);
    await page.type('#property-sqft', TEST_DATA.sqft);
    await page.type('#property-taxes', TEST_DATA.taxes);
    await page.type('#property-condofees', TEST_DATA.condoFees);
    await page.select('#property-type', TEST_DATA.propertyType.toLowerCase());
    
    // Submit form
    console.log('🔄 Submitting form...');
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/analyze-property') && 
        response.status() !== 404,
        { timeout: 15000 }
      ),
      page.click('button[type="submit"]')
    ]);
    
    // Check for results or error
    await page.waitForSelector('#analysis-results, .error-message', { timeout: 10000 });
    
    const hasResults = await page.$('#analysis-results') !== null;
    const hasError = await page.$('.error-message') !== null;
    
    if (hasResults) {
      console.log('✅ Analysis results received!');
      
      // Quick check that key elements exist
      const hasLTR = await page.$('#ltr-content') !== null;
      const hasSTR = await page.$('#str-content') !== null;
      console.log(`  - LTR tab: ${hasLTR ? '✅' : '❌'}`);
      console.log(`  - STR tab: ${hasSTR ? '✅' : '❌'}`);
    } else if (hasError) {
      const errorText = await page.$eval('.error-message', el => el.textContent);
      console.log('❌ Error occurred:', errorText);
    } else {
      console.log('⚠️  No results or error shown');
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Test completed in ${duration} seconds`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Only take screenshot on error
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: 'tests/e2e/error-screenshot.png' });
        console.log('📸 Error screenshot saved');
      }
    }
    
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
runTest();