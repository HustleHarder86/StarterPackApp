#!/usr/bin/env node

/**
 * Visual check - takes screenshots of key functionality
 * Use this to visually verify everything looks correct
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

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

async function visualCheck() {
  let browser;
  
  try {
    console.log('📸 Visual Check - Taking screenshots of key functionality\n');
    
    // Create screenshot directory
    const screenshotDir = path.join(__dirname, 'screenshots', 'visual-check', new Date().toISOString().split('T')[0]);
    await fs.mkdir(screenshotDir, { recursive: true });
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Load and fill form
    console.log('Loading page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
    
    // Screenshot 1: Initial form
    await page.screenshot({ path: path.join(screenshotDir, '01-form.png') });
    console.log('✅ Screenshot: Initial form');
    
    // Fill form
    await page.type('#property-address', TEST_DATA.address);
    await page.type('#property-price', TEST_DATA.price);
    await page.select('#property-bedrooms', TEST_DATA.bedrooms);
    await page.select('#property-bathrooms', TEST_DATA.bathrooms);
    await page.type('#property-sqft', TEST_DATA.sqft);
    await page.type('#property-taxes', TEST_DATA.taxes);
    await page.type('#property-condofees', TEST_DATA.condoFees);
    await page.select('#property-type', TEST_DATA.propertyType.toLowerCase());
    
    // Submit
    await Promise.all([
      page.waitForSelector('#analysis-results', { timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    
    await page.waitForTimeout(2000); // Let everything render
    
    // Screenshot 2: LTR Tab (default)
    await page.screenshot({ path: path.join(screenshotDir, '02-ltr-results.png'), fullPage: true });
    console.log('✅ Screenshot: LTR results');
    
    // Screenshot 3: STR Tab
    await page.click('#str-tab');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '03-str-results.png'), fullPage: true });
    console.log('✅ Screenshot: STR results');
    
    // Screenshot 4: Investment Tab
    await page.click('#investment-tab');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '04-investment-results.png'), fullPage: true });
    console.log('✅ Screenshot: Investment analysis');
    
    // Screenshot 5: Mobile view
    await page.setViewport({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '05-mobile-view.png'), fullPage: true });
    console.log('✅ Screenshot: Mobile view');
    
    console.log(`\n📁 Screenshots saved to: ${screenshotDir}`);
    console.log('👀 Review these screenshots to verify the UI looks correct');
    
  } catch (error) {
    console.error('❌ Visual check failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the check
visualCheck();