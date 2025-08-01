/**
 * Static Integration Test
 * Tests the roi-finder.html page by serving it statically
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runIntegrationTest() {
  console.log('🧪 Running Static ROI Finder Integration Test...\n');
  
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
        console.log('❌ Console Error:', msg.text());
      } else if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Capture page errors
    page.on('pageerror', exception => {
      console.log('❌ Page Error:', exception.message);
      consoleErrors.push(exception.message);
    });
    
    // Load from HTTP server
    const url = 'http://localhost:8080/roi-finder.html?e2e_test_mode=true';
    
    console.log('📂 Loading:', url);
    await page.goto(url);
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    console.log('\n🔍 Checking JavaScript errors...');
    if (consoleErrors.length > 0) {
      console.log(`❌ Found ${consoleErrors.length} console errors`);
      return false;
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
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
    
    console.log('Component Status:');
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
    
    console.log('Component Loader:', JSON.stringify(loaderCheck, null, 2));
    
    if (!loaderCheck.exists || !loaderCheck.isCompactModern) {
      console.log('❌ Component loader not properly initialized');
      return false;
    }
    
    console.log('\n🔍 Checking UI elements...');
    const uiCheck = await page.evaluate(() => {
      return {
        hasForm: !!document.querySelector('#property-form'),
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        hasAddressField: !!document.querySelector('#address'),
        hasCityField: !!document.querySelector('#city'),
        hasPriceField: !!document.querySelector('#price')
      };
    });
    
    console.log('UI Elements:', JSON.stringify(uiCheck, null, 2));
    
    const allUiPresent = Object.values(uiCheck).every(v => v === true);
    if (!allUiPresent) {
      console.log('❌ Not all UI elements present');
      return false;
    }
    
    console.log('\n✅ All integration tests passed!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
runIntegrationTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});