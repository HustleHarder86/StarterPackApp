#!/usr/bin/env node

/**
 * Simple Real API Test
 * Quick test to verify real API calls are working
 */

const { chromium } = require('@playwright/test');
const path = require('path');

async function runTest() {
  console.log('🚀 Simple Real API Test');
  console.log('Testing real API calls with actual data...\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  // Monitor API calls
  let apiCallMade = false;
  let apiResponse = null;
  
  context.on('response', async response => {
    if (response.url().includes('/api/analysis/property')) {
      apiCallMade = true;
      console.log(`📡 API Call: ${response.url()}`);
      console.log(`   Status: ${response.status()}`);
      
      try {
        const data = await response.json();
        apiResponse = data;
        console.log(`   Success: ${data.success}`);
        if (data.success) {
          console.log(`   Property: ${data.propertyAddress}`);
          console.log(`   Execution Time: ${data.executionTime}ms`);
          console.log(`   Has LTR Analysis: ${!!data.longTermRental}`);
          console.log(`   Has STR Analysis: ${!!data.strAnalysis}`);
          console.log(`   Monthly Rent: $${data.cashFlow?.monthlyRental || 'N/A'}`);
          console.log(`   Cash Flow: $${data.cashFlow?.netCashFlow || 'N/A'}`);
          console.log(`   Cap Rate: ${data.metrics?.capRate || 'N/A'}%`);
        }
      } catch (e) {
        console.log('   Failed to parse response');
      }
    }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the ROI finder page
    console.log('📍 Navigating to: http://localhost:3000/roi-finder.html');
    await page.goto('http://localhost:3000/roi-finder.html');
    await page.waitForLoadState('networkidle');
    
    // Check for auth bypass
    const hasAuthBypass = await page.locator('#auth-bypass-btn').count() > 0;
    if (hasAuthBypass) {
      console.log('🔓 Auth bypass available, clicking...');
      await page.click('#auth-bypass-btn');
      await page.waitForTimeout(1000);
    }
    
    // Fill in property details
    const testProperty = {
      address: '488 University Ave Unit 2710, Toronto, ON',
      price: 899000,
      downPayment: 20,
      interestRate: 6.5
    };
    
    console.log('\n📝 Filling property form:');
    console.log(`   Address: ${testProperty.address}`);
    console.log(`   Price: $${testProperty.price.toLocaleString()}`);
    
    await page.fill('#property-address', testProperty.address);
    await page.fill('#property-price', testProperty.price.toString());
    
    // Submit form
    console.log('\n🚀 Submitting form and waiting for real API response...');
    const startTime = Date.now();
    
    // Try to find and click the analyze button
    const analyzeButton = page.locator('button[type="submit"]:has-text("Analyze")').first();
    await analyzeButton.click();
    
    // Wait for results (up to 60 seconds for real API call)
    await page.waitForSelector('#analysis-results:not(.hidden)', {
      timeout: 60000,
      state: 'visible'
    });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n✅ Results received in ${duration.toFixed(1)} seconds`);
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, 'screenshots', `real-api-test-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    
    // Check if API was called
    if (apiCallMade) {
      console.log('\n🎉 SUCCESS: Real API call was made!');
      if (apiResponse?.success) {
        console.log('   API returned valid data');
        console.log(`   Data source: ${apiResponse.dataSource || 'Perplexity AI'}`);
      }
    } else {
      console.log('\n⚠️ WARNING: No API call detected');
    }
    
    // Check for data in the UI
    const hasResults = await page.locator('#financial-analysis').count() > 0;
    if (hasResults) {
      console.log('✅ Financial analysis displayed in UI');
    }
    
    // Wait a bit to see the results
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n🏁 Test complete');
}

// Run the test
runTest().catch(console.error);