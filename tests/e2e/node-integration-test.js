/**
 * Node.js-based integration test for ROI Finder
 * Uses http-server package to avoid Vercel dev issues
 */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 8080;
const TEST_URL = `http://localhost:${PORT}/roi-finder-test-simple.html?e2e_test_mode=true`;
const PROJECT_ROOT = path.join(__dirname, '../..');

let serverProcess = null;

async function startServer() {
  console.log(`📦 Starting HTTP server on port ${PORT}...`);
  
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npx', ['http-server', '-p', PORT, '-c-1'], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'ignore', 'ignore']
    });
    
    serverProcess.on('error', reject);
    
    // Give server time to start
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    // Give it time to clean up
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function runIntegrationTest() {
  console.log('🧪 ROI Finder Integration Test');
  console.log('='.repeat(50));
  
  try {
    // Start server
    await startServer();
    console.log('✅ Server started successfully');
    
    // Launch browser
    console.log('\n🌐 Launching browser...');
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Capture console messages
      const consoleErrors = [];
      const consoleLogs = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
          console.log(`  ❌ Console Error: ${msg.text()}`);
        } else if (msg.type() === 'log' && (msg.text().includes('[INIT]') || msg.text().includes('[TEST MODE]'))) {
          consoleLogs.push(msg.text());
          console.log(`  📝 ${msg.text()}`);
        }
      });
      
      page.on('pageerror', exception => {
        console.log(`  ❌ Page Error: ${exception.message}`);
        consoleErrors.push(exception.message);
      });
      
      // Navigate to page
      console.log(`\n📂 Loading: ${TEST_URL}`);
      await page.goto(TEST_URL);
      await page.waitForLoadState('domcontentloaded');
      
      // Wait a bit for JavaScript to initialize
      await page.waitForTimeout(1000);
      
      // Check for JavaScript errors
      console.log('\n🔍 Checking for JavaScript errors...');
      if (consoleErrors.length > 0) {
        console.log(`❌ Found ${consoleErrors.length} console errors`);
        for (const error of consoleErrors.slice(0, 5)) {
          console.log(`   - ${error}`);
        }
        return false;
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
      // Check component initialization
      console.log('\n🔍 Checking component initialization...');
      const componentsCheck = await page.evaluate(() => {
        return {
          ComponentLoader: typeof window.ComponentLoader,
          ComponentLoaderCompactModern: typeof window.ComponentLoaderCompactModern,
          CompactModernLayout: typeof window.CompactModernLayout,
          PropertyHeroSection: typeof window.PropertyHeroSection,
          FinancialSummaryCompactModern: typeof window.FinancialSummaryCompactModern,
          InvestmentVerdictCompactModern: typeof window.InvestmentVerdictCompactModern,
          MarketComparisonCompactModern: typeof window.MarketComparisonCompactModern,
          componentLoader: window.componentLoader ? window.componentLoader.constructor.name : 'undefined'
        };
      });
      
      let allComponentsLoaded = true;
      for (const [name, type] of Object.entries(componentsCheck)) {
        const status = type !== 'undefined' ? '✅' : '❌';
        console.log(`  ${status} ${name}: ${type}`);
        if (type === 'undefined' && name !== 'componentLoader') {
          allComponentsLoaded = false;
        }
      }
      
      if (!allComponentsLoaded) {
        console.log('\n❌ Not all components loaded properly');
        return false;
      }
      
      // Check component loader instance
      console.log('\n🔍 Checking component loader instance...');
      const loaderCheck = await page.evaluate(() => {
        if (!window.componentLoader) return { exists: false };
        return {
          exists: true,
          isComponentLoader: window.componentLoader instanceof window.ComponentLoader,
          isCompactModern: window.componentLoader instanceof window.ComponentLoaderCompactModern,
          className: window.componentLoader.constructor.name
        };
      });
      
      if (!loaderCheck.exists) {
        console.log('❌ Component loader not found');
        return false;
      } else if (!loaderCheck.isCompactModern) {
        console.log('❌ Component loader is not CompactModernLoader instance');
        return false;
      } else {
        console.log(`✅ Component loader initialized: ${loaderCheck.className}`);
      }
      
      // Check UI elements
      console.log('\n🔍 Checking UI elements...');
      const uiElements = {
        'Form': '#property-form',
        'Submit Button': 'button[type="submit"]',
        'Address Field': '#address',
        'City Field': '#city',
        'Price Field': '#price',
        'Sidebar': '.cm-sidebar',
        'Main Content': '.cm-main-content'
      };
      
      let allUiPresent = true;
      for (const [name, selector] of Object.entries(uiElements)) {
        const element = await page.$(selector);
        const status = element ? '✅' : '❌';
        console.log(`  ${status} ${name}`);
        if (!element) {
          allUiPresent = false;
        }
      }
      
      if (!allUiPresent) {
        console.log('\n❌ Not all UI elements present');
        return false;
      }
      
      // Test form interaction
      console.log('\n🔍 Testing form interaction...');
      await page.fill('#address', '123 Test Street');
      await page.fill('#city', 'Test City');
      await page.fill('#price', '500000');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for mock response
      await page.waitForTimeout(1500);
      
      // Check for results
      const results = await page.$('#results-container .cm-success');
      if (results) {
        console.log('✅ Form submission handled successfully');
      } else {
        console.log('❌ Form submission did not produce expected results');
        return false;
      }
      
      // Test mobile responsiveness
      console.log('\n🔍 Testing mobile responsiveness...');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Check if sidebar is hidden on mobile
      const sidebarVisible = await page.isVisible('.cm-sidebar');
      if (sidebarVisible) {
        console.log('⚠️  Sidebar visible on mobile (should be hidden by default)');
      } else {
        console.log('✅ Sidebar hidden on mobile');
      }
      
      console.log('\n✅ All integration tests passed!');
      return true;
      
    } finally {
      await browser.close();
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    return false;
  } finally {
    await stopServer();
  }
}

// Run the test
runIntegrationTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});