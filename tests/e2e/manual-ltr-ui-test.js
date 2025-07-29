const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const screenshotDir = path.join(__dirname, 'screenshots', 'ltr-manual-test', timestamp);

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory: ${error}`);
  }
}

async function takeScreenshot(page, name, description) {
  const filename = `${name}.png`;
  const filepath = path.join(screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${name} - ${description}`);
  return filepath;
}

async function testLTRManually() {
  console.log('🚀 Starting manual LTR UI/UX test...\n');
  console.log('📌 Please ensure your test file is served at: http://localhost:8080/tests/test-ltr-option5-implementation.html\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Run in headed mode so you can see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    await ensureDir(screenshotDir);
    const page = await browser.newPage();
    
    // Navigate to the absolute file path
    const testFilePath = path.resolve(__dirname, '../../tests/test-ltr-option5-implementation.html');
    console.log('Opening test file:', testFilePath);
    
    // Read the HTML content and serve it directly
    const htmlContent = await fs.readFile(testFilePath, 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Wait for components to initialize
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('\n📱 Test 1: Initial Desktop View');
    await takeScreenshot(page, '01-desktop-full', 'Full desktop view of LTR tab');
    
    // Check if LTR content loaded
    const ltrContent = await page.$('#ltr-content');
    if (!ltrContent) {
      console.error('❌ LTR content container not found!');
      return;
    }
    
    // Check for revenue banner
    const revenueBanner = await page.$('.revenue-banner');
    if (revenueBanner) {
      console.log('✅ Revenue banner found');
      await page.evaluate(() => {
        document.querySelector('.revenue-banner').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '02-revenue-banner', 'Revenue banner section');
    } else {
      console.error('❌ Revenue banner not found');
    }
    
    // Check key metrics
    const metricsGrid = await page.$('.grid.grid-cols-2.md\\:grid-cols-4');
    if (metricsGrid) {
      console.log('✅ Key metrics grid found');
      await page.evaluate(() => {
        document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '03-key-metrics', 'Key metrics display');
    } else {
      console.error('❌ Key metrics grid not found');
    }
    
    // Check market panels
    const marketPanels = await page.$$('.grid.md\\:grid-cols-2.gap-6 > div');
    if (marketPanels.length > 0) {
      console.log(`✅ Found ${marketPanels.length} market analysis panels`);
      await page.evaluate(() => {
        const panels = document.querySelector('.grid.md\\:grid-cols-2.gap-6');
        if (panels) panels.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '04-market-panels', 'Market analysis panels');
    }
    
    // Check chart
    const chart = await page.$('#ltr-revenue-chart');
    if (chart) {
      console.log('✅ Revenue chart canvas found');
      await page.evaluate(() => {
        document.getElementById('ltr-revenue-chart').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 1000));
      await takeScreenshot(page, '05-revenue-chart', 'Revenue projection chart');
    } else {
      console.error('❌ Revenue chart not found');
    }
    
    // Check calculator
    const calculator = await page.$('#ltr-calc-rent');
    if (calculator) {
      console.log('✅ Financial calculator found');
      await page.evaluate(() => {
        document.getElementById('ltr-calc-rent').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '06-calculator', 'Financial calculator section');
      
      // Test calculator interaction
      await page.click('#ltr-calc-rent');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.type('#ltr-calc-rent', '4000');
      
      const recalcButton = await page.$('button[onclick="window.LTRAnalysis.recalculate()"]');
      if (recalcButton) {
        await recalcButton.click();
        await new Promise(r => setTimeout(r, 500));
        await takeScreenshot(page, '07-calculator-updated', 'Calculator after update');
        console.log('✅ Calculator recalculation tested');
      }
    }
    
    // Check collapsible assumptions
    const assumptionsButton = await page.$('button[onclick="window.LTRAnalysis.toggleAssumptions()"]');
    if (assumptionsButton) {
      console.log('✅ Assumptions toggle found');
      await assumptionsButton.click();
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '08-assumptions-expanded', 'Expanded assumptions');
      
      await assumptionsButton.click();
      await new Promise(r => setTimeout(r, 500));
      await takeScreenshot(page, '09-assumptions-collapsed', 'Collapsed assumptions');
    }
    
    // Test mobile view
    console.log('\n📱 Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '10-mobile-view', 'Mobile responsive view');
    
    // Tablet view
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '11-tablet-view', 'Tablet responsive view');
    
    console.log('\n✅ Test completed successfully!');
    console.log(`📸 Screenshots saved to: ${screenshotDir}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testLTRManually().catch(console.error);