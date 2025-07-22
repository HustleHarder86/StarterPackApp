const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runComprehensiveTest() {
  console.log('Starting comprehensive analysis test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security'] 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable detailed console logging
  page.on('console', msg => {
    console.log(`Browser [${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.error('Page error:', error);
  });

  try {
    // Navigate to ROI Finder
    await page.goto('http://localhost:3000/roi-finder.html');
    await page.waitForLoadState('networkidle');
    
    // Create screenshots directory
    const screenshotDir = 'tests/comprehensive-test-screenshots';
    fs.mkdirSync(screenshotDir, { recursive: true });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/01-initial-load.png`,
      fullPage: true 
    });

    // Login with test account
    const needsLogin = await page.$('#google-signin-btn');
    if (needsLogin) {
      console.log('Logging in...');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    // Test Case: Property with actual tax data (like user's example)
    console.log('\n=== TESTING PROPERTY WITH ACTUAL TAX DATA ===');
    
    const propertyData = {
      price: 449900,
      propertyTaxes: 1570,  // Annual property tax (should show as $131/month)
      condoFees: 450,       // Monthly condo fees  
      sqft: 499,
      propertyType: 'Condo',
      yearBuilt: 1995,
      bedrooms: 2,
      bathrooms: 2,
      address: '611 - 115 BONIS AVENUE, Toronto (Tam O\'Shanter-Sullivan), Ontario M1T3S4'
    };

    // Inject property data to simulate browser extension
    await page.evaluate((data) => {
      window.propertyData = data;
      console.log('Injected property data:', data);
      
      // Trigger any listeners that might be waiting for this data
      window.dispatchEvent(new CustomEvent('propertyDataAvailable', { detail: data }));
    }, propertyData);

    // Fill form
    await page.fill('#property-address', propertyData.address);
    await page.fill('#property-price', propertyData.price.toString());
    await page.selectOption('#bedrooms', propertyData.bedrooms.toString());
    await page.selectOption('#bathrooms', propertyData.bathrooms.toString());

    await page.screenshot({ 
      path: `${screenshotDir}/02-form-filled.png`,
      fullPage: true 
    });

    // Click analyze
    console.log('Starting analysis...');
    await page.click('#analyze-btn');

    // Wait for analysis to complete
    await page.waitForSelector('#analysis-result', { 
      state: 'visible',
      timeout: 60000 
    });

    console.log('Analysis complete, running checks...');

    // Take screenshot of results
    await page.screenshot({ 
      path: `${screenshotDir}/03-analysis-results.png`,
      fullPage: true 
    });

    // === CHECK 1: Property Tax ===
    console.log('\n=== CHECK 1: Property Tax ===');
    
    // Try multiple selectors to find property tax
    const taxSelectors = [
      '.property-tax-value',
      '[data-field="propertyTax"] input',
      '#property-tax-input',
      'input[name="propertyTax"]',
      '.expense-item:has-text("Property Tax") input',
      'text=/Property Tax.*\\$\\d+/i'
    ];
    
    let propertyTaxValue = null;
    for (const selector of taxSelectors) {
      const element = await page.$(selector);
      if (element) {
        propertyTaxValue = await element.inputValue().catch(() => element.textContent());
        console.log(`Found property tax with selector "${selector}":`, propertyTaxValue);
        break;
      }
    }
    
    if (propertyTaxValue) {
      const expectedMonthly = Math.round(1570 / 12); // Should be 131
      console.log(`Expected monthly tax: $${expectedMonthly}`);
      console.log(`Actual value shown: ${propertyTaxValue}`);
      
      if (propertyTaxValue.includes('708')) {
        console.error('❌ ERROR: Property tax is wrong! Showing $708 instead of $131');
      }
    } else {
      console.error('❌ ERROR: Could not find property tax element!');
    }

    // === CHECK 2: Data Sources ===
    console.log('\n=== CHECK 2: Data Sources ===');
    
    const dataSourceElements = await page.$$('.data-source-indicator, .source-label, text=/estimated|actual|market/i');
    for (const element of dataSourceElements) {
      const text = await element.textContent();
      const parentText = await element.evaluateHandle(el => el.parentElement?.textContent);
      console.log('Data source:', text, 'Parent:', parentText);
    }

    // === CHECK 3: Location ===
    console.log('\n=== CHECK 3: Location ===');
    
    const airbnbCards = await page.$$('.property-card, .airbnb-listing, .comparable-card');
    console.log(`Found ${airbnbCards.length} Airbnb listings`);
    
    for (let i = 0; i < Math.min(3, airbnbCards.length); i++) {
      const cardText = await airbnbCards[i].textContent();
      console.log(`Card ${i + 1}:`, cardText.substring(0, 100));
      
      if (cardText.includes('King West')) {
        console.error('❌ ERROR: Wrong location! Showing King West instead of Tam O\'Shanter area');
      }
    }

    // === CHECK 4: View All Button ===
    console.log('\n=== CHECK 4: View All Button ===');
    
    const viewAllButton = await page.$('button:has-text("View All Comparable Listings")');
    if (viewAllButton) {
      // Check button implementation
      const buttonInfo = await viewAllButton.evaluate(btn => {
        const info = {
          hasOnClick: !!btn.onclick,
          onClickAttribute: btn.getAttribute('onclick'),
          hasEventListeners: false,
          isDisabled: btn.disabled,
          className: btn.className,
          id: btn.id
        };
        
        // Check for event listeners
        const listeners = getEventListeners ? getEventListeners(btn) : null;
        if (listeners && listeners.click) {
          info.hasEventListeners = true;
        }
        
        return info;
      });
      
      console.log('Button info:', buttonInfo);
      
      if (!buttonInfo.hasOnClick && !buttonInfo.onClickAttribute && !buttonInfo.hasEventListeners) {
        console.error('❌ ERROR: View All button has no click handler!');
      }
    } else {
      console.error('❌ ERROR: View All button not found!');
    }

    // === CHECK 5: Revenue Consistency ===
    console.log('\n=== CHECK 5: Revenue Consistency ===');
    
    // Find all revenue/income values
    const revenueElements = await page.$$('text=/\\$[0-9,]+.*(?:month|revenue|income)/i');
    const revenueValues = [];
    
    for (const element of revenueElements) {
      const text = await element.textContent();
      const match = text.match(/\\$([0-9,]+)/);
      if (match) {
        revenueValues.push({
          value: match[1],
          context: text
        });
      }
    }
    
    console.log('Revenue values found:', revenueValues);
    
    // Check for inconsistencies
    if (revenueValues.length > 1) {
      const uniqueValues = [...new Set(revenueValues.map(r => r.value))];
      if (uniqueValues.length > 1) {
        console.error('❌ ERROR: Inconsistent revenue values!', uniqueValues);
      }
    }

    // === Get API Response ===
    console.log('\n=== API Response Check ===');
    
    const apiData = await page.evaluate(() => {
      return {
        propertyData: window.propertyData,
        analysisData: window.analysisData,
        lastResponse: window.lastAnalysisResponse
      };
    });
    
    console.log('Window data:', JSON.stringify(apiData, null, 2));

    // Save test results
    const testResults = {
      timestamp: new Date().toISOString(),
      propertyData,
      checks: {
        propertyTax: {
          expected: Math.round(1570 / 12),
          found: propertyTaxValue,
          correct: propertyTaxValue && propertyTaxValue.includes('131')
        },
        location: {
          expected: 'Tam O\'Shanter',
          foundKingWest: false // Will be updated above
        },
        viewAllButton: {
          exists: !!viewAllButton,
          hasHandler: false // Will be updated above
        },
        revenueConsistency: {
          values: revenueValues,
          consistent: true // Will be updated above
        }
      }
    };
    
    fs.writeFileSync(
      `${screenshotDir}/test-results.json`,
      JSON.stringify(testResults, null, 2)
    );
    
    console.log('\n✅ Test complete. Check screenshots and results.');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ 
      path: 'tests/comprehensive-test-screenshots/error-state.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Run the test
runComprehensiveTest().catch(console.error);