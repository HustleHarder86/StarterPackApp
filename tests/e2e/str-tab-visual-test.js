const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const screenshotDir = path.join(__dirname, 'screenshots', 'str-ui-test', timestamp);
fs.mkdirSync(screenshotDir, { recursive: true });

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureSTRTabUI() {
  console.log('🎨 STR Tab UI/UX Visual Test\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const results = {
    screenshots: [],
    findings: [],
    recommendations: []
  };

  try {
    // 1. Navigate to the page
    console.log('Step 1: Loading page...');
    await page.goto('https://starter-pack-app.vercel.app/roi-finder.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await wait(3000);

    // Initial screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '01-initial-page.png'),
      fullPage: true
    });
    results.screenshots.push('01-initial-page.png');
    console.log('✅ Initial page captured\n');

    // 2. Fill the form
    console.log('Step 2: Filling property form...');
    
    // Type in each field
    await page.type('#street', '123 Main Street');
    await page.type('#city', 'Toronto');
    await page.type('#province', 'Ontario');
    await page.type('#price', '850000');
    await page.type('#bedrooms', '3');
    await page.type('#bathrooms', '2');
    await page.type('#sqft', '1800');
    await page.type('#propertyTaxes', '8500');
    await page.type('#condoFees', '450');

    await page.screenshot({
      path: path.join(screenshotDir, '02-filled-form.png'),
      fullPage: true
    });
    results.screenshots.push('02-filled-form.png');
    console.log('✅ Form filled\n');

    // 3. Submit form
    console.log('Step 3: Submitting form...');
    await page.click('button[type="submit"]');
    
    // Wait for analysis to complete
    await wait(10000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '03-after-submit.png'),
      fullPage: true
    });
    results.screenshots.push('03-after-submit.png');
    console.log('✅ Form submitted\n');

    // 4. Find and click STR tab
    console.log('Step 4: Looking for STR tab...');
    
    // Try multiple selectors for tabs
    const tabSelectors = [
      'button:contains("Short-Term Rental")',
      '[role="tab"]:contains("Short-Term Rental")',
      '.tab-button:contains("Short-Term Rental")',
      'button.tab:contains("Short-Term Rental")'
    ];

    let strTabClicked = false;
    
    // First, let's see what tabs exist
    const allButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(btn => btn.textContent);
    });
    console.log('All buttons found:', allButtons);

    // Try to find STR tab
    const strTab = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const strButton = buttons.find(btn => 
        btn.textContent.includes('Short-Term Rental') || 
        btn.textContent.includes('STR')
      );
      if (strButton) {
        strButton.click();
        return true;
      }
      return false;
    });

    if (strTab) {
      strTabClicked = true;
      console.log('✅ STR tab clicked');
      await wait(3000);
    } else {
      console.log('❌ STR tab not found');
      results.findings.push('STR tab not found - may need to check tab implementation');
    }

    // 5. Capture STR tab content
    console.log('\nStep 5: Capturing STR tab content...');
    
    // Full STR tab screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '04-str-tab-full.png'),
      fullPage: true
    });
    results.screenshots.push('04-str-tab-full.png');

    // Check for specific elements
    const elements = await page.evaluate(() => {
      return {
        charts: document.querySelectorAll('canvas, .chart-container').length,
        images: document.querySelectorAll('img').length,
        inputs: document.querySelectorAll('input').length,
        tables: document.querySelectorAll('table').length,
        tabs: document.querySelectorAll('[role="tab"], .tab-button').length
      };
    });

    console.log('Elements found:', elements);
    results.findings.push(`Charts: ${elements.charts}`);
    results.findings.push(`Images: ${elements.images}`);
    results.findings.push(`Input fields: ${elements.inputs}`);
    results.findings.push(`Tab buttons: ${elements.tabs}`);

    // Check for duplicate tabs
    if (elements.tabs > 5) {
      results.findings.push('⚠️ Possible duplicate tab sets detected');
      results.recommendations.push('Check for duplicate tab navigation components');
    }

    // 6. Test mobile view
    console.log('\nStep 6: Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 812 });
    await wait(1000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '05-mobile-view.png'),
      fullPage: true
    });
    results.screenshots.push('05-mobile-view.png');
    console.log('✅ Mobile view captured\n');

    // Visual Analysis
    console.log('='.repeat(50));
    console.log('📊 VISUAL ANALYSIS RESULTS');
    console.log('='.repeat(50));
    console.log('\n📸 Screenshots captured:');
    results.screenshots.forEach(s => console.log(`  - ${s}`));
    
    console.log('\n🔍 Key Findings:');
    results.findings.forEach(f => console.log(`  - ${f}`));
    
    if (results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      results.recommendations.forEach(r => console.log(`  - ${r}`));
    }
    
    console.log('\n📁 All screenshots saved to:');
    console.log(`   ${screenshotDir}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    
    // Capture error state
    await page.screenshot({
      path: path.join(screenshotDir, 'error-state.png'),
      fullPage: true
    });
  } finally {
    await browser.close();
  }
}

// Run the test
captureSTRTabUI().catch(console.error);