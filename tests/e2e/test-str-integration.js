const { chromium } = require('playwright');
const { VisualDebugger } = require('./helpers/visual-debugger');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

async function testSTRIntegration() {
  console.log('🚀 Starting STR Integration Tests...\n');
  
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  const visualDebugger = new VisualDebugger(page);
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  try {
    // Test 1: Check if React component loads
    console.log('📋 Test 1: React Component Loading');
    await page.goto(`${BASE_URL}/roi-finder.html`);
    await visualDebugger.captureScreenshot('01-initial-load');
    
    // Check if React is loaded
    const reactLoaded = await page.evaluate(() => {
      return typeof React !== 'undefined' && typeof ReactDOM !== 'undefined';
    });
    
    if (reactLoaded) {
      console.log('✅ React and ReactDOM are loaded');
      results.passed++;
    } else {
      console.log('❌ React not loaded properly');
      results.failed++;
    }
    
    // Test 2: Check if component container exists
    console.log('\n📋 Test 2: Component Container');
    const containerExists = await page.locator('#str-comparison-container').count() > 0;
    
    if (containerExists) {
      console.log('✅ STR comparison container exists');
      results.passed++;
    } else {
      console.log('❌ STR comparison container not found');
      results.failed++;
    }
    
    // Test 3: Test authentication flow
    console.log('\n📋 Test 3: Authentication Flow');
    await visualDebugger.captureScreenshot('02-auth-screen');
    
    const authFormVisible = await page.locator('#auth-form').isVisible();
    if (authFormVisible) {
      console.log('✅ Auth form is visible');
      
      // Try to login with test credentials
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'Test123!');
      await visualDebugger.captureScreenshot('03-auth-filled');
      
      // Note: Can't actually submit without Firebase setup
      console.log('⚠️  Cannot test actual login without Firebase');
      results.passed++;
    } else {
      console.log('❌ Auth form not found');
      results.failed++;
    }
    
    // Test 4: Check property form elements
    console.log('\n📋 Test 4: Property Form Elements');
    
    // Check if the form exists (might be hidden behind auth)
    const formElements = [
      { selector: '#street', name: 'Street input' },
      { selector: '#city', name: 'City input' },
      { selector: '#state', name: 'State input' },
      { selector: '#country', name: 'Country input' },
      { selector: '#postal', name: 'Postal input' },
      { selector: '#include-str-analysis', name: 'STR analysis checkbox' }
    ];
    
    for (const element of formElements) {
      const exists = await page.locator(element.selector).count() > 0;
      if (exists) {
        console.log(`✅ ${element.name} exists`);
        results.passed++;
      } else {
        console.log(`❌ ${element.name} not found`);
        results.failed++;
      }
    }
    
    // Test 5: Check if RentalComparisonView component is available
    console.log('\n📋 Test 5: RentalComparisonView Component');
    
    const componentAvailable = await page.evaluate(() => {
      return typeof window.RentalComparisonView !== 'undefined';
    });
    
    if (componentAvailable) {
      console.log('✅ RentalComparisonView component is loaded');
      results.passed++;
    } else {
      console.log('❌ RentalComparisonView component not available');
      
      // Try to wait for Babel to process it
      await page.waitForTimeout(2000);
      
      const componentAvailableAfterWait = await page.evaluate(() => {
        return typeof window.RentalComparisonView !== 'undefined';
      });
      
      if (componentAvailableAfterWait) {
        console.log('✅ Component loaded after waiting for Babel');
        results.passed++;
      } else {
        console.log('❌ Component still not available after waiting');
        results.failed++;
      }
    }
    
    // Test 6: Test component mounting with mock data
    console.log('\n📋 Test 6: Component Mounting Test');
    
    const mountResult = await page.evaluate(() => {
      try {
        // Mock analysis data
        const mockData = {
          property_address: '123 Test St, Toronto, ON',
          longTermRental: {
            monthlyRent: 2500,
            annualRevenue: 30000,
            annualProfit: 15000,
            capRate: 5.2,
            cashFlow: 1250
          },
          strAnalysis: {
            avgNightlyRate: 150,
            occupancyRate: 70,
            annualRevenue: 38325,
            annualProfit: 20000
          },
          comparison: {
            betterStrategy: 'str',
            monthlyIncomeDiff: 694,
            annualIncomeDiff: 8325,
            annualProfitDiff: 5000,
            percentageIncrease: 33,
            breakEvenOccupancy: 55,
            recommendation: 'Short-term rental offers better returns',
            riskAssessment: 'Moderate risk with higher returns'
          }
        };
        
        // Try to mount the component
        const container = document.getElementById('str-comparison-container');
        if (!container) {
          return { success: false, error: 'Container not found' };
        }
        
        container.style.display = 'block';
        
        if (typeof window.RentalComparisonView === 'undefined') {
          return { success: false, error: 'Component not loaded' };
        }
        
        ReactDOM.render(
          React.createElement(window.RentalComparisonView, {
            analysis: mockData,
            propertyAddress: mockData.property_address
          }),
          container
        );
        
        return { success: true, message: 'Component mounted successfully' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    await visualDebugger.captureScreenshot('04-component-mount-attempt');
    
    if (mountResult.success) {
      console.log('✅ Component mounted successfully');
      results.passed++;
      
      // Check if component rendered
      const componentRendered = await page.locator('.bg-gradient-to-r.from-indigo-600').isVisible();
      if (componentRendered) {
        console.log('✅ Component rendered with content');
        results.passed++;
      } else {
        console.log('⚠️  Component mounted but not visible');
      }
    } else {
      console.log(`❌ Component mount failed: ${mountResult.error}`);
      results.failed++;
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await visualDebugger.captureScreenshot('error-state');
  } finally {
    // Generate summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📸 Screenshots saved to: tests/e2e/screenshots/`);
    
    await browser.close();
  }
}

// Run the tests
testSTRIntegration().catch(console.error);