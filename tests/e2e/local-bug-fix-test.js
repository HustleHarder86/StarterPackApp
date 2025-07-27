const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

async function runLocalBugFixTest() {
  console.log('🔍 Starting local bug fix verification test...');
  
  // Create screenshot directory
  const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
  const screenshotDir = path.join(__dirname, 'screenshots', 'local-bug-fix-test', timestamp);
  await fs.mkdir(screenshotDir, { recursive: true });
  
  // Start the development server
  console.log('🚀 Starting local development server...');
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '../..'),
    env: { ...process.env, PORT: '3000' }
  });
  
  // Wait for server to start
  await new Promise((resolve) => {
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output);
      if (output.includes('Ready') || output.includes('started') || output.includes('localhost:3000')) {
        setTimeout(resolve, 3000); // Additional wait
      }
    });
    devServer.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });
    // Timeout fallback
    setTimeout(resolve, 15000);
  });
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Track errors
  const consoleErrors = [];
  const pageErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      console.log('❌ Console Error:', text);
      
      // Check for temporal dead zone error
      if (text.includes('Cannot access') && text.includes('before initialization')) {
        console.log('🚨 TEMPORAL DEAD ZONE ERROR DETECTED!');
      }
    }
  });
  
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log('❌ Page Error:', error.message);
  });
  
  try {
    // Navigate to local server
    console.log('📱 Navigating to local server...');
    await page.goto('http://localhost:3000/roi-finder.html?e2e_test_mode=true', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Initial page load');
    
    // Wait for form to be ready
    console.log('📋 Waiting for property form...');
    await page.waitForSelector('#propertyForm', { timeout: 10000 });
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-property-form.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Property form visible');
    
    // Fill the form
    console.log('✏️ Filling property form...');
    await page.type('#propertyAddress', '123 Test Street, Toronto, ON M5V 3A8');
    await page.type('#purchasePrice', '850000');
    await page.type('#squareFootage', '2200');
    await page.type('#bedrooms', '4');
    await page.type('#bathrooms', '3');
    await page.type('#propertyTax', '8500');
    await page.type('#condoFees', '0');
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-form-filled.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Form filled');
    
    // Submit form
    console.log('🚀 Submitting form...');
    await page.click('#analyzeButton');
    
    // Wait for results
    console.log('⏳ Waiting for analysis results...');
    await page.waitForSelector('#resultsContainer', {
      visible: true,
      timeout: 60000
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '04-analysis-results.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Analysis results loaded');
    
    // Find and click Long Term Rental tab
    console.log('📊 Looking for Long Term Rental tab...');
    const ltrTabFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ltrButton = buttons.find(btn => 
        btn.textContent.includes('Long Term Rental') || 
        btn.getAttribute('data-tab') === 'longTermRental'
      );
      if (ltrButton) {
        ltrButton.click();
        return true;
      }
      return false;
    });
    
    if (ltrTabFound) {
      console.log('✅ Clicked Long Term Rental tab');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-ltr-tab-active.png'),
        fullPage: true 
      });
      console.log('✅ Screenshot: LTR tab active');
      
      // Check for charts
      const chartCount = await page.$$eval('canvas', canvases => canvases.length);
      console.log(`📈 Found ${chartCount} chart(s)`);
      
      if (chartCount > 0) {
        // Take individual chart screenshots
        const canvases = await page.$$('canvas');
        for (let i = 0; i < canvases.length; i++) {
          await canvases[i].scrollIntoViewIfNeeded();
          const box = await canvases[i].boundingBox();
          if (box) {
            await page.screenshot({
              path: path.join(screenshotDir, `06-chart-${i + 1}.png`),
              clip: {
                x: box.x - 10,
                y: box.y - 10,
                width: box.width + 20,
                height: box.height + 20
              }
            });
            console.log(`✅ Screenshot: Chart ${i + 1}`);
          }
        }
      }
    } else {
      console.log('❌ Long Term Rental tab not found');
      // List all buttons for debugging
      const buttonTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim());
      });
      console.log('Available buttons:', buttonTexts);
    }
    
    // Test Investment Analysis tab
    console.log('💰 Testing Investment Analysis tab...');
    const investmentTabFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const invButton = buttons.find(btn => 
        btn.textContent.includes('Investment Analysis') || 
        btn.getAttribute('data-tab') === 'investment'
      );
      if (invButton) {
        invButton.click();
        return true;
      }
      return false;
    });
    
    if (investmentTabFound) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.screenshot({ 
        path: path.join(screenshotDir, '07-investment-tab.png'),
        fullPage: true 
      });
      console.log('✅ Screenshot: Investment tab');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-state.png'),
      fullPage: true 
    });
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:3000/roi-finder.html',
    screenshotDir: screenshotDir,
    errors: {
      console: consoleErrors,
      page: pageErrors,
      temporalDeadZone: consoleErrors.some(err => 
        err.includes('Cannot access') && err.includes('before initialization')
      )
    },
    summary: {
      totalConsoleErrors: consoleErrors.length,
      totalPageErrors: pageErrors.length,
      hasTemporalDeadZoneError: consoleErrors.some(err => 
        err.includes('Cannot access') && err.includes('before initialization')
      ),
      chartErrors: consoleErrors.filter(err => 
        err.includes('Chart') || err.includes('chart')
      ).length
    }
  };
  
  await fs.writeFile(
    path.join(screenshotDir, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Generate markdown report
  const mdReport = `# Bug Fix Verification Report

**Date:** ${new Date().toISOString()}
**URL:** http://localhost:3000/roi-finder.html

## Summary

- **Total Console Errors:** ${report.summary.totalConsoleErrors}
- **Total Page Errors:** ${report.summary.totalPageErrors}
- **Temporal Dead Zone Error:** ${report.summary.hasTemporalDeadZoneError ? '❌ PRESENT' : '✅ FIXED'}
- **Chart-related Errors:** ${report.summary.chartErrors}

## Console Errors
${consoleErrors.length === 0 ? '✅ No console errors detected' : consoleErrors.map(err => `- ${err}`).join('\n')}

## Page Errors
${pageErrors.length === 0 ? '✅ No page errors detected' : pageErrors.map(err => `- ${err}`).join('\n')}

## Screenshots
- Initial Load: 01-initial-load.png
- Property Form: 02-property-form.png
- Form Filled: 03-form-filled.png
- Analysis Results: 04-analysis-results.png
- LTR Tab: 05-ltr-tab-active.png
- Charts: 06-chart-*.png
- Investment Tab: 07-investment-tab.png

## Conclusion
${report.summary.hasTemporalDeadZoneError ? 
  '❌ The temporal dead zone error is still present. The bug has NOT been fixed.' : 
  '✅ No temporal dead zone errors detected. The bug appears to be FIXED.'}
`;
  
  await fs.writeFile(
    path.join(screenshotDir, 'bug-fix-report.md'),
    mdReport
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Errors: ${consoleErrors.length + pageErrors.length}`);
  console.log(`Temporal Dead Zone Error: ${report.summary.hasTemporalDeadZoneError ? '❌ DETECTED' : '✅ NOT FOUND'}`);
  console.log(`Screenshots saved to: ${screenshotDir}`);
  console.log(`Report saved to: ${path.join(screenshotDir, 'bug-fix-report.md')}`);
  
  await browser.close();
  
  // Kill dev server
  devServer.kill();
  
  return report;
}

// Run the test
runLocalBugFixTest().catch(console.error);