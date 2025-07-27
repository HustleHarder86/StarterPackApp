const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function startSimpleServer() {
  console.log('🚀 Starting simple HTTP server...');
  
  // Kill any existing process on port 8080
  try {
    await execAsync('lsof -ti:8080 | xargs kill -9');
  } catch (e) {
    // Ignore errors if no process is running
  }
  
  // Start Python HTTP server in the background
  const server = exec('python3 -m http.server 8080', {
    cwd: path.join(__dirname, '../..')
  });
  
  server.stdout.on('data', (data) => {
    console.log('Server:', data.toString());
  });
  
  server.stderr.on('data', (data) => {
    console.log('Server:', data.toString());
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return server;
}

async function runBugFixTest() {
  console.log('🔍 Starting bug fix verification test with simple server...');
  
  // Create screenshot directory
  const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, -5);
  const screenshotDir = path.join(__dirname, 'screenshots', 'simple-server-test', timestamp);
  await fs.mkdir(screenshotDir, { recursive: true });
  
  let server;
  let browser;
  
  try {
    // Start server
    server = await startSimpleServer();
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1440, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Track errors
    const consoleErrors = [];
    const temporalDeadZoneErrors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.log('❌ Console Error:', text);
        
        // Check for temporal dead zone error
        if (text.includes('Cannot access') && text.includes('before initialization')) {
          temporalDeadZoneErrors.push(text);
          console.log('🚨 TEMPORAL DEAD ZONE ERROR DETECTED!');
        }
      } else if (msg.type() === 'log') {
        console.log('📝 Console Log:', text);
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    // Navigate to the app
    console.log('📱 Navigating to http://localhost:8080/roi-finder.html...');
    await page.goto('http://localhost:8080/roi-finder.html?e2e_test_mode=true', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial-load.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Initial page load');
    
    // Wait for any modals and close them
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to close any modal
    const closeModal = await page.evaluate(() => {
      const modal = document.querySelector('.modal, [role="dialog"]');
      if (modal) {
        const closeBtn = modal.querySelector('button[class*="close"], button[aria-label="Close"], .close-button');
        if (closeBtn) {
          closeBtn.click();
          return true;
        }
      }
      return false;
    });
    
    if (closeModal) {
      console.log('✅ Closed modal');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check if form is visible
    const formVisible = await page.$('#propertyForm');
    if (!formVisible) {
      console.log('⚠️ Form not immediately visible, waiting...');
      await page.waitForSelector('#propertyForm', { timeout: 10000 }).catch(() => {});
    }
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-after-modal.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: After modal handling');
    
    // Fill the form
    console.log('✏️ Filling property form...');
    const formFilled = await page.evaluate(() => {
      const inputs = {
        '#propertyAddress': '123 Test Street, Toronto, ON M5V 3A8',
        '#purchasePrice': '850000',
        '#squareFootage': '2200',
        '#bedrooms': '4',
        '#bathrooms': '3',
        '#propertyTax': '8500',
        '#condoFees': '0'
      };
      
      let filled = 0;
      for (const [selector, value] of Object.entries(inputs)) {
        const input = document.querySelector(selector);
        if (input) {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          filled++;
        }
      }
      return filled;
    });
    
    console.log(`✅ Filled ${formFilled} form fields`);
    
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-form-filled.png'),
      fullPage: true 
    });
    console.log('✅ Screenshot: Form filled');
    
    // Submit form
    console.log('🚀 Submitting form...');
    const submitted = await page.evaluate(() => {
      const submitBtn = document.querySelector('#analyzeButton, button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    });
    
    if (submitted) {
      console.log('✅ Form submitted, waiting for results...');
      
      // Wait for results with a more flexible approach
      await page.waitForFunction(
        () => {
          const results = document.querySelector('#resultsContainer, .results-container, .analysis-results');
          return results && results.children.length > 0;
        },
        { timeout: 60000 }
      ).catch(() => console.log('⚠️ Results timeout'));
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.screenshot({ 
        path: path.join(screenshotDir, '04-analysis-results.png'),
        fullPage: true 
      });
      console.log('✅ Screenshot: Analysis results');
      
      // Find tabs
      console.log('🔍 Looking for tabs...');
      const tabs = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons
          .filter(btn => btn.textContent.includes('Term Rental') || btn.textContent.includes('Investment'))
          .map(btn => ({
            text: btn.textContent.trim(),
            dataTab: btn.getAttribute('data-tab'),
            classes: btn.className
          }));
      });
      
      console.log('Found tabs:', tabs);
      
      // Click Long Term Rental tab
      console.log('📊 Clicking Long Term Rental tab...');
      const ltrClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const ltrBtn = buttons.find(btn => btn.textContent.includes('Long Term Rental'));
        if (ltrBtn) {
          ltrBtn.click();
          return true;
        }
        return false;
      });
      
      if (ltrClicked) {
        console.log('✅ Clicked LTR tab');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '05-ltr-tab.png'),
          fullPage: true 
        });
        console.log('✅ Screenshot: LTR tab');
        
        // Check for charts
        const chartInfo = await page.evaluate(() => {
          const canvases = document.querySelectorAll('canvas');
          const chartContainers = document.querySelectorAll('.chart-container, [class*="chart"]');
          return {
            canvasCount: canvases.length,
            containerCount: chartContainers.length,
            canvasIds: Array.from(canvases).map(c => c.id || 'no-id')
          };
        });
        
        console.log('Chart info:', chartInfo);
      }
    }
    
    // Final error summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 ERROR ANALYSIS');
    console.log('='.repeat(50));
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    console.log(`Temporal Dead Zone Errors: ${temporalDeadZoneErrors.length}`);
    
    if (temporalDeadZoneErrors.length > 0) {
      console.log('\n🚨 TEMPORAL DEAD ZONE ERRORS FOUND:');
      temporalDeadZoneErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    } else {
      console.log('\n✅ NO TEMPORAL DEAD ZONE ERRORS DETECTED');
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:8080/roi-finder.html',
      errors: {
        console: consoleErrors,
        temporalDeadZone: temporalDeadZoneErrors
      },
      bugFixed: temporalDeadZoneErrors.length === 0
    };
    
    await fs.writeFile(
      path.join(screenshotDir, 'bug-test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n📁 Screenshots and report saved to: ${screenshotDir}`);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
  }
}

// Run the test
runBugFixTest().catch(console.error);