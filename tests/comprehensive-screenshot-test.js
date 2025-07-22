const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotDir = path.join(__dirname, 'comprehensive-analysis-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Issues tracking
const issues = [];
const suggestions = [];

async function captureAnalysisScreenshots(propertyData, testName) {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('ERROR') || text.includes('Failed')) {
      issues.push(`${testName}: Console error - ${text}`);
    }
    console.log(`Browser [${msg.type()}]:`, text);
  });
  page.on('pageerror', error => {
    issues.push(`${testName}: Page error - ${error.message}`);
    console.error('Page error:', error);
  });
  
  try {
    console.log(`\n=== Running Test: ${testName} ===`);
    console.log(`Property: ${propertyData.address}`);
    console.log(`Expected property tax: $${Math.round(propertyData.propertyTaxes / 12)}/month`);
    
    // Navigate to ROI Finder
    await page.goto('http://localhost:3001/roi-finder.html', { waitUntil: 'networkidle2' });
    
    // Stage 1: Initial page load
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-01-initial-page.png`,
      fullPage: true 
    });
    console.log('✓ Screenshot 1: Initial page');
    
    // Stage 2: Mock login
    await page.evaluate(() => {
      // Mock Firebase auth
      window.appState = {
        currentUser: {
          uid: 'test-user-123',
          email: 'test@example.com',
          getIdToken: async () => 'mock-token-123'
        },
        userData: {
          subscriptionTier: 'pro',
          strAnalysisEnabled: true
        }
      };
      // Trigger auth state change
      if (window.ROIFinderApp) {
        const app = new window.ROIFinderApp();
        app.showPropertyInput();
      }
    });
    
    await page.waitForSelector('#property-input-section', { visible: true });
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-02-property-input-form.png`,
      fullPage: true 
    });
    console.log('✓ Screenshot 2: Property input form');
    
    // Stage 3: Fill the form with property data
    await page.type('#property-address', propertyData.address);
    await page.type('#property-price', propertyData.price.toString());
    await page.select('#property-bedrooms', propertyData.bedrooms.toString());
    await page.select('#property-bathrooms', propertyData.bathrooms.toString());
    
    // Inject property data to simulate browser extension
    await page.evaluate((data) => {
      window.extensionPropertyData = {
        ...data,
        dataSource: 'listing'  // Mark as actual data
      };
    }, propertyData);
    
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-03-form-filled.png`,
      fullPage: true 
    });
    console.log('✓ Screenshot 3: Form filled with data');
    
    // Stage 4: Start analysis
    console.log('Starting property analysis...');
    await page.click('button[type="submit"]');
    
    // Stage 5: Loading state
    await page.waitForTimeout(2000);
    const hasEnhancedLoading = await page.$('.loading-step');
    if (hasEnhancedLoading) {
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-04-enhanced-loading.png`,
        fullPage: true 
      });
      console.log('✓ Screenshot 4: Enhanced loading state');
    } else {
      issues.push(`${testName}: Enhanced loading state not shown`);
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-04-basic-loading.png`,
        fullPage: true 
      });
      console.log('⚠ Screenshot 4: Basic loading state (enhanced not loaded)');
    }
    
    // Stage 6: Wait for analysis results
    await page.waitForSelector('#analysis-results', { 
      visible: true,
      timeout: 60000 
    });
    await page.waitForTimeout(3000); // Wait for all components to render
    
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-05-analysis-complete.png`,
      fullPage: true 
    });
    console.log('✓ Screenshot 5: Complete analysis results');
    
    // Stage 7: Check Investment Verdict
    const verdictSection = await page.$('[class*="investment-verdict"], [class*="InvestmentVerdict"]');
    if (verdictSection) {
      await verdictSection.scrollIntoView();
      await page.waitForTimeout(500);
      
      const verdictText = await verdictSection.evaluate(el => el.textContent);
      console.log('Investment verdict found:', verdictText.substring(0, 100));
      
      // Check for revenue consistency
      const revenueMatches = verdictText.match(/\$[\d,]+/g);
      if (revenueMatches && revenueMatches.length > 1) {
        const uniqueRevenues = [...new Set(revenueMatches)];
        if (uniqueRevenues.length > 1) {
          issues.push(`${testName}: Revenue inconsistency in verdict - found ${uniqueRevenues.join(', ')}`);
        }
      }
    } else {
      issues.push(`${testName}: Investment verdict section not found`);
    }
    
    // Stage 8: Check Airbnb Listings (HERO section)
    const airbnbSection = await page.$('[class*="airbnb-listings"], [class*="AirbnbListings"]');
    if (airbnbSection) {
      await airbnbSection.scrollIntoView();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-06-airbnb-listings.png`,
        fullPage: true 
      });
      console.log('✓ Screenshot 6: Airbnb listings section');
      
      // Check location accuracy
      const listingsText = await airbnbSection.evaluate(el => el.textContent);
      const expectedCity = propertyData.address.split(',')[1]?.trim();
      console.log(`Checking if listings are from ${expectedCity}...`);
      
      if (!listingsText.includes(expectedCity) && !listingsText.includes(expectedCity.toUpperCase())) {
        issues.push(`${testName}: Airbnb listings not showing correct location (expected ${expectedCity})`);
      }
      
      // Check for nightly rates
      const priceElements = await airbnbSection.$$('[class*="price"], [class*="rate"]');
      const hasValidPrices = await Promise.all(priceElements.map(async el => {
        const text = await el.evaluate(node => node.textContent);
        return text && !text.includes('N/A') && text.includes('$');
      }));
      
      if (!hasValidPrices.some(v => v)) {
        issues.push(`${testName}: Airbnb listings showing N/A for prices`);
      }
    } else {
      issues.push(`${testName}: Airbnb listings section not found`);
    }
    
    // Stage 9: Test View All Comparables button
    const viewAllButton = await page.$('button:has-text("View All"), button:contains("View All Comparable")');
    if (viewAllButton) {
      console.log('Testing View All button...');
      await viewAllButton.click();
      await page.waitForTimeout(1500);
      
      const modal = await page.$('.fixed.inset-0, [class*="modal"]');
      if (modal) {
        await page.screenshot({ 
          path: `${screenshotDir}/${testName}-07-comparables-modal.png`,
          fullPage: true 
        });
        console.log('✓ Screenshot 7: View All modal opened');
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        issues.push(`${testName}: View All Comparable Listings button not working`);
      }
    } else {
      issues.push(`${testName}: View All button not found`);
    }
    
    // Stage 10: Check Financial Calculator
    const calculatorSection = await page.$('[class*="financial-calculator"], [class*="FinancialCalculator"]');
    if (calculatorSection) {
      await calculatorSection.scrollIntoView();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-08-financial-calculator.png`,
        fullPage: true 
      });
      console.log('✓ Screenshot 8: Financial calculator');
      
      // Check property tax value
      const taxInputs = await page.$$('input[id*="tax"], input[name*="tax"]');
      let foundCorrectTax = false;
      const expectedMonthlyTax = Math.round(propertyData.propertyTaxes / 12);
      
      for (const input of taxInputs) {
        const value = await input.evaluate(el => el.value);
        const numValue = parseInt(value.replace(/[^\d]/g, ''));
        console.log(`Found tax input value: ${value} (expected: $${expectedMonthlyTax}/month)`);
        
        if (Math.abs(numValue - expectedMonthlyTax) <= 5) {
          foundCorrectTax = true;
          break;
        }
      }
      
      if (!foundCorrectTax) {
        issues.push(`${testName}: Property tax incorrect - expected $${expectedMonthlyTax}/month`);
      }
      
      // Check data source indicators
      const sourceIndicators = await calculatorSection.$$('[class*="source"], [class*="data-source"]');
      let hasActualSource = false;
      
      for (const indicator of sourceIndicators) {
        const text = await indicator.evaluate(el => el.textContent);
        if (text.toLowerCase().includes('actual')) {
          hasActualSource = true;
          break;
        }
      }
      
      if (!hasActualSource) {
        issues.push(`${testName}: Calculator not showing "actual" data source`);
      }
    } else {
      issues.push(`${testName}: Financial calculator section not found`);
    }
    
    // Stage 11: Check Key Metrics
    const metricsSection = await page.$('[class*="key-metrics"], [class*="KeyMetrics"]');
    if (metricsSection) {
      await metricsSection.scrollIntoView();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-09-key-metrics.png`,
        fullPage: true 
      });
      console.log('✓ Screenshot 9: Key metrics');
    }
    
    // Stage 12: Extract and analyze all data
    const pageData = await page.evaluate(() => {
      return {
        // Check if live data badge exists
        hasLiveDataBadge: !!document.querySelector('[class*="live-data"], [class*="LiveData"]'),
        
        // Extract all visible prices/revenues
        visibleRevenues: Array.from(document.querySelectorAll('*')).map(el => {
          const text = el.textContent;
          const match = text.match(/\$[\d,]+.*(?:month|revenue)/i);
          return match ? match[0] : null;
        }).filter(Boolean),
        
        // Check for hover effects
        hasHoverEffects: !!document.querySelector('[class*="hover\\:"], :hover'),
        
        // Get error messages
        errorMessages: Array.from(document.querySelectorAll('[class*="error"], .text-red-500')).map(el => el.textContent),
        
        // Check responsive design
        isMobileOptimized: !!document.querySelector('.mobile-only, .mobile-hidden')
      };
    });
    
    console.log('\n--- Page Analysis ---');
    console.log('Live data badge:', pageData.hasLiveDataBadge ? '✓' : '✗');
    console.log('Hover effects:', pageData.hasHoverEffects ? '✓' : '✗');
    console.log('Mobile optimized:', pageData.isMobileOptimized ? '✓' : '✗');
    console.log('Revenue values found:', pageData.visibleRevenues.length);
    
    if (!pageData.hasLiveDataBadge) {
      suggestions.push('Add animated live data indicator to show real-time data');
    }
    
    if (!pageData.hasHoverEffects) {
      suggestions.push('Add hover effects to Airbnb cards for better interactivity');
    }
    
    // Save detailed analysis data
    fs.writeFileSync(
      `${screenshotDir}/${testName}-analysis-data.json`,
      JSON.stringify({
        propertyData,
        pageData,
        issues: issues.filter(i => i.startsWith(testName)),
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    
    console.log(`\n✅ Test "${testName}" completed successfully`);
    
  } catch (error) {
    console.error(`❌ Test "${testName}" failed:`, error);
    issues.push(`${testName}: Test failed - ${error.message}`);
    
    // Take error screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-ERROR.png`,
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Test properties from 3 different cities
async function runAllTests() {
  console.log('Starting comprehensive screenshot tests...\n');
  
  // Test 1: Toronto - Tam O'Shanter Condo
  await captureAnalysisScreenshots({
    address: '611 - 115 BONIS AVENUE, Toronto (Tam O\'Shanter-Sullivan), Ontario M1T3S4',
    price: 449900,
    propertyTaxes: 1570,  // Annual - should show $131/month
    condoFees: 450,
    sqft: 499,
    propertyType: 'Condo',
    yearBuilt: 1995,
    bedrooms: 2,
    bathrooms: 2,
    mlsNumber: 'C8455321'
  }, '1-toronto-tam-oshanter');
  
  await new Promise(resolve => setTimeout(resolve, 3000)); // Pause between tests
  
  // Test 2: Oakville - Queens Avenue Condo
  await captureAnalysisScreenshots({
    address: '205 - 1071 QUEENS AVENUE, Oakville, Ontario L6H2R5',
    price: 599900,
    propertyTaxes: 5490,  // Annual - should show $458/month
    condoFees: 550,
    sqft: 850,
    propertyType: 'Condo',
    yearBuilt: 2018,
    bedrooms: 2,
    bathrooms: 1,
    mlsNumber: 'W8234567'
  }, '2-oakville-queens-ave');
  
  await new Promise(resolve => setTimeout(resolve, 3000)); // Pause between tests
  
  // Test 3: Mississauga - Single Family House
  await captureAnalysisScreenshots({
    address: '4567 Ridgeway Drive, Mississauga, Ontario L5M7P9',
    price: 1250000,
    propertyTaxes: 9800,  // Annual - should show $817/month
    condoFees: 0,  // No condo fees for house
    sqft: 2800,
    propertyType: 'Single Family',
    yearBuilt: 2015,
    bedrooms: 4,
    bathrooms: 3.5,
    mlsNumber: 'W8901234'
  }, '3-mississauga-house');
  
  // Generate final report
  console.log('\n\n' + '='.repeat(80));
  console.log('COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📋 ISSUES FOUND:');
  if (issues.length === 0) {
    console.log('✅ No critical issues found!');
  } else {
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ❌ ${issue}`);
    });
  }
  
  console.log('\n💡 SUGGESTIONS FOR IMPROVEMENT:');
  // Add standard suggestions based on testing
  suggestions.push(
    'Add property image display in the analysis results',
    'Include neighborhood demographics and school ratings',
    'Add ability to save analysis as PDF report',
    'Implement comparison view for multiple properties',
    'Add historical price trends chart',
    'Include mortgage calculator with different down payment scenarios',
    'Add property appreciation forecast based on historical data',
    'Implement dark mode for better viewing experience',
    'Add tooltips explaining each financial metric',
    'Include local market trends and insights',
    'Add ability to adjust assumptions (vacancy rate, maintenance costs)',
    'Implement portfolio tracking for multiple properties',
    'Add email notifications for saved searches',
    'Include walkability and transit scores',
    'Add integration with property management tools'
  );
  
  suggestions.forEach((suggestion, i) => {
    console.log(`${i + 1}. 💡 ${suggestion}`);
  });
  
  console.log(`\n📸 Screenshots saved in: ${screenshotDir}`);
  console.log('\n✅ All tests completed!');
  
  // Save full report
  fs.writeFileSync(
    `${screenshotDir}/TEST-REPORT.md`,
    `# Comprehensive Test Report\n\n` +
    `Date: ${new Date().toISOString()}\n\n` +
    `## Issues Found\n\n${issues.length === 0 ? '✅ No critical issues found!' : issues.map(i => `- ❌ ${i}`).join('\n')}\n\n` +
    `## Suggestions for Improvement\n\n${suggestions.map(s => `- 💡 ${s}`).join('\n')}\n\n` +
    `## Test Properties\n\n` +
    `1. **Toronto** - 611 - 115 BONIS AVENUE (Condo)\n` +
    `2. **Oakville** - 205 - 1071 QUEENS AVENUE (Condo)\n` +
    `3. **Mississauga** - 4567 Ridgeway Drive (House)\n`
  );
}

// Run the tests
runAllTests().catch(console.error);