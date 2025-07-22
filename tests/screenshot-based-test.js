const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotDir = path.join(__dirname, 'analysis-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function captureAnalysisScreenshots(propertyData, testName) {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log(`Browser [${msg.type()}]:`, msg.text()));
  page.on('pageerror', error => console.error('Page error:', error));
  
  try {
    console.log(`\n=== Running Test: ${testName} ===`);
    
    // Navigate to ROI Finder
    await page.goto('http://localhost:3000/roi-finder.html', { waitUntil: 'networkidle2' });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-01-initial.png`,
      fullPage: true 
    });
    
    // Login if needed (mock login for testing)
    const needsLogin = await page.$('#google-signin-btn');
    if (needsLogin) {
      await page.type('input[type="email"]', 'test@example.com');
      await page.type('input[type="password"]', 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
    
    // Inject property data (simulating browser extension)
    await page.evaluate((data) => {
      window.propertyData = data;
      console.log('Property data injected:', data);
    }, propertyData);
    
    // Fill the form
    await page.type('#property-address', propertyData.address);
    await page.type('#property-price', propertyData.price.toString());
    await page.select('#bedrooms', propertyData.bedrooms.toString());
    await page.select('#bathrooms', propertyData.bathrooms.toString());
    
    // Take screenshot of filled form
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-02-form-filled.png`,
      fullPage: true 
    });
    
    // Click analyze button
    console.log('Starting analysis...');
    await page.click('#analyze-btn');
    
    // Wait for analysis to complete
    await page.waitForSelector('#analysis-result', { 
      visible: true,
      timeout: 60000 
    });
    
    // Wait a bit more for all components to render
    await page.waitForTimeout(3000);
    
    // Take screenshot of complete analysis
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-03-analysis-complete.png`,
      fullPage: true 
    });
    
    // Scroll to and screenshot specific sections
    
    // 1. Investment Verdict Section
    const verdictSection = await page.$('.investment-verdict');
    if (verdictSection) {
      await verdictSection.scrollIntoView();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-04-investment-verdict.png`,
        fullPage: true 
      });
    }
    
    // 2. Airbnb Listings Section
    const airbnbSection = await page.$('.airbnb-listings');
    if (airbnbSection) {
      await airbnbSection.scrollIntoView();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-05-airbnb-listings.png`,
        fullPage: true 
      });
      
      // Check if listings show correct location
      const listingsText = await airbnbSection.evaluate(el => el.textContent);
      console.log('Airbnb listings content preview:', listingsText.substring(0, 200));
    }
    
    // 3. Financial Calculator Section
    const calculatorSection = await page.$('.financial-calculator');
    if (calculatorSection) {
      await calculatorSection.scrollIntoView();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-06-financial-calculator.png`,
        fullPage: true 
      });
      
      // Extract calculator values for verification
      const propertyTaxInput = await page.$('input[id*="propertyTax"], input[name*="propertyTax"]');
      if (propertyTaxInput) {
        const taxValue = await propertyTaxInput.evaluate(el => el.value);
        console.log('Property tax value in calculator:', taxValue);
        console.log('Expected monthly tax:', Math.round(propertyData.propertyTaxes / 12));
      }
    }
    
    // 4. Key Metrics Section
    const metricsSection = await page.$('.key-metrics, [class*="metrics"]');
    if (metricsSection) {
      await metricsSection.scrollIntoView();
      await page.waitForTimeout(500);
      await page.screenshot({ 
        path: `${screenshotDir}/${testName}-07-key-metrics.png`,
        fullPage: true 
      });
    }
    
    // Test View All Comparables button
    const viewAllButton = await page.$('button:has-text("View All Comparable Listings")');
    if (viewAllButton) {
      console.log('Testing View All button...');
      await viewAllButton.click();
      await page.waitForTimeout(1000);
      
      // Check if modal appeared
      const modal = await page.$('.fixed.inset-0');
      if (modal) {
        console.log('✅ View All modal opened successfully');
        await page.screenshot({ 
          path: `${screenshotDir}/${testName}-08-comparables-modal.png`,
          fullPage: true 
        });
        
        // Close modal
        await page.keyboard.press('Escape');
      } else {
        console.log('❌ View All modal did not open');
      }
    }
    
    // Extract and log key information
    const analysisData = await page.evaluate(() => {
      return {
        propertyData: window.propertyData,
        analysisData: window.analysisData,
        // Extract visible values
        visiblePropertyTax: document.querySelector('[data-field="propertyTax"]')?.value ||
                           document.querySelector('#property-tax-input')?.value ||
                           document.querySelector('.property-tax-value')?.textContent,
        dataSourceLabels: Array.from(document.querySelectorAll('.data-source-indicator, [class*="source"]'))
                              .map(el => el.textContent),
        strRevenue: document.querySelector('.str-revenue')?.textContent ||
                   document.querySelector('[class*="monthly-income"]')?.textContent
      };
    });
    
    console.log('\n=== Extracted Data ===');
    console.log('Visible property tax:', analysisData.visiblePropertyTax);
    console.log('Data source labels:', analysisData.dataSourceLabels);
    console.log('STR Revenue:', analysisData.strRevenue);
    
    // Save analysis data
    fs.writeFileSync(
      `${screenshotDir}/${testName}-analysis-data.json`,
      JSON.stringify(analysisData, null, 2)
    );
    
    console.log(`\n✅ Test "${testName}" completed. Check screenshots in ${screenshotDir}`);
    
  } catch (error) {
    console.error(`❌ Test "${testName}" failed:`, error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/${testName}-ERROR.png`,
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Run tests for different properties
async function runAllTests() {
  console.log('Starting screenshot-based tests...\n');
  
  // Test 1: Tam O'Shanter Property (User's example)
  await captureAnalysisScreenshots({
    address: '611 - 115 BONIS AVENUE, Toronto (Tam O\'Shanter-Sullivan), Ontario M1T3S4',
    price: 449900,
    propertyTaxes: 1570,  // Annual - should show $131/month
    condoFees: 450,
    sqft: 499,
    propertyType: 'Condo',
    yearBuilt: 1995,
    bedrooms: 2,
    bathrooms: 2
  }, 'tam-oshanter-condo');
  
  // Test 2: Oakville Property
  await captureAnalysisScreenshots({
    address: '205 - 1071 QUEENS AVENUE, Oakville, Ontario L6H2R5',
    price: 599900,
    propertyTaxes: 5490,  // Annual - should show $458/month
    condoFees: 550,
    sqft: 850,
    propertyType: 'Condo',
    yearBuilt: 2018,
    bedrooms: 2,
    bathrooms: 1
  }, 'oakville-condo');
  
  // Test 3: Mississauga House
  await captureAnalysisScreenshots({
    address: '123 Main Street, Mississauga, Ontario L5B4G5',
    price: 850000,
    propertyTaxes: 7200,  // Annual - should show $600/month
    condoFees: 0,
    sqft: 2000,
    propertyType: 'Single Family',
    yearBuilt: 2010,
    bedrooms: 4,
    bathrooms: 3
  }, 'mississauga-house');
  
  console.log('\n=== All tests completed ===');
  console.log(`Screenshots saved in: ${screenshotDir}`);
}

// Run the tests
runAllTests().catch(console.error);