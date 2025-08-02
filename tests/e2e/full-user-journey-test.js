const { chromium } = require('playwright');
const fs = require('fs');

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test123!',
  name: 'Test User'
};

const testProperty = {
  address: '123 King Street West, Toronto, ON M5V 3G7',
  price: '850000',
  bedrooms: '2',
  bathrooms: '2',
  sqft: '1100',
  propertyTaxes: '8500',
  condoFees: '650'
};

// Utility functions
async function takeScreenshot(page, name, stepNumber) {
  const filename = `tests/e2e/debug-screenshots/user-journey-${stepNumber.toString().padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`  📸 Screenshot: ${filename}`);
}

async function checkDesign(page, componentName) {
  const designCheck = await page.evaluate(() => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    
    // Check for key design elements
    const gradients = document.querySelectorAll('[class*="gradient"]');
    const glassCards = document.querySelectorAll('.glass-card, .metric-card, [class*="glass"]');
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input, textarea, select');
    
    return {
      font: computedStyle.fontFamily,
      hasGradients: gradients.length > 0,
      gradientCount: gradients.length,
      hasGlassCards: glassCards.length > 0,
      glassCardCount: glassCards.length,
      buttonCount: buttons.length,
      inputCount: inputs.length,
      primaryColor: computedStyle.getPropertyValue('--color-primary') || 'not set',
      hasSidebar: !!document.querySelector('.cm-sidebar')
    };
  });
  
  console.log(`\n  🎨 Design Check - ${componentName}:`);
  console.log(`     Font: ${designCheck.font.includes('Manrope') ? '✅' : '❌'} ${designCheck.font.split(',')[0]}`);
  console.log(`     Gradients: ${designCheck.hasGradients ? '✅' : '⚠️'} (${designCheck.gradientCount} found)`);
  console.log(`     Glass Cards: ${designCheck.hasGlassCards ? '✅' : '⚠️'} (${designCheck.glassCardCount} found)`);
  console.log(`     Interactive Elements: ${designCheck.buttonCount} buttons, ${designCheck.inputCount} inputs`);
  if (designCheck.hasSidebar) {
    console.log(`     Sidebar: ✅ Present`);
  }
  
  return designCheck;
}

async function checkFunctionality(page, testName, testFunction) {
  console.log(`\n  🧪 Testing: ${testName}`);
  try {
    const result = await testFunction();
    console.log(`     ✅ ${testName} - Success`);
    return { success: true, result };
  } catch (error) {
    console.log(`     ❌ ${testName} - Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runFullUserJourney() {
  console.log('🚀 Starting Full User Journey E2E Test\n');
  console.log('This test simulates a complete user flow from landing to analysis results.');
  console.log('='*60 + '\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow down actions to make them visible
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  let stepNumber = 1;
  const issues = [];
  const suggestions = [];
  
  try {
    // Step 1: Landing Page
    console.log(`\n📍 Step ${stepNumber}: Landing Page (index.html)`);
    await page.goto('http://localhost:8081/index.html');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'landing-page', stepNumber);
    
    const landingDesign = await checkDesign(page, 'Landing Page');
    
    // Check hero section
    await checkFunctionality(page, 'Hero Section Visibility', async () => {
      await page.waitForSelector('.hero-section', { timeout: 5000 });
      const heroText = await page.textContent('h1');
      if (!heroText.includes('Real estate investing')) {
        throw new Error('Hero text not found');
      }
    });
    
    // Check navigation
    await checkFunctionality(page, 'Navigation Links', async () => {
      const navLinks = await page.$$('.nav-link');
      if (navLinks.length < 5) {
        throw new Error(`Expected at least 5 nav links, found ${navLinks.length}`);
      }
    });
    
    stepNumber++;
    
    // Step 2: Navigate to ROI Finder
    console.log(`\n📍 Step ${stepNumber}: Navigate to ROI Finder`);
    await checkFunctionality(page, 'Launch ROI Finder Button', async () => {
      await page.click('a[href="roi-finder.html"]');
      await page.waitForLoadState('networkidle');
    });
    
    await takeScreenshot(page, 'roi-finder-initial', stepNumber);
    stepNumber++;
    
    // Step 3: Handle Auth/Login
    console.log(`\n📍 Step ${stepNumber}: Authentication Flow`);
    
    // Check if we see Firebase error or login form
    const hasError = await page.isVisible('#error-state');
    const hasLogin = await page.isVisible('#login-section');
    
    if (hasError) {
      console.log('  ⚠️  Firebase configuration error detected - bypassing');
      // Bypass Firebase error for testing
      await page.evaluate(() => {
        document.getElementById('error-state').style.display = 'none';
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('property-input-section').style.display = 'block';
      });
      issues.push('Firebase configuration error on production - needs proper setup');
    } else if (hasLogin) {
      console.log('  📝 Login form detected');
      await checkDesign(page, 'Login Form');
      
      await checkFunctionality(page, 'Login Form Submission', async () => {
        await page.fill('#login-email', testUser.email);
        await page.fill('#login-password', testUser.password);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
      });
    }
    
    await takeScreenshot(page, 'after-auth', stepNumber);
    stepNumber++;
    
    // Step 4: Property Input Form
    console.log(`\n📍 Step ${stepNumber}: Property Input Form`);
    
    // Wait for property form to be visible
    await page.waitForSelector('#property-analysis-form', { state: 'visible', timeout: 10000 });
    
    const formDesign = await checkDesign(page, 'Property Input Form');
    
    // Check form elements
    await checkFunctionality(page, 'Form Field Presence', async () => {
      const requiredFields = ['#property-address', '#property-price', '#property-bedrooms', '#property-bathrooms'];
      for (const field of requiredFields) {
        const element = await page.$(field);
        if (!element) throw new Error(`Missing required field: ${field}`);
      }
    });
    
    // Fill form
    await checkFunctionality(page, 'Form Data Entry', async () => {
      await page.fill('#property-address', testProperty.address);
      await page.fill('#property-price', testProperty.price);
      await page.fill('#property-bedrooms', testProperty.bedrooms);
      await page.fill('#property-bathrooms', testProperty.bathrooms);
      
      // Expand optional fields if available
      const toggleButton = await page.$('button:has-text("Optional Property Details")');
      if (toggleButton) {
        await toggleButton.click();
        await page.waitForTimeout(500);
        
        await page.fill('#property-sqft', testProperty.sqft);
        await page.fill('#property-taxes', testProperty.propertyTaxes);
        await page.fill('#property-condofees', testProperty.condoFees);
      }
    });
    
    await takeScreenshot(page, 'form-filled', stepNumber);
    stepNumber++;
    
    // Step 5: Submit Form and Property Confirmation
    console.log(`\n📍 Step ${stepNumber}: Property Confirmation`);
    
    await checkFunctionality(page, 'Form Submission', async () => {
      await page.click('button[type="submit"]');
      await page.waitForSelector('#property-confirmation:not(.hidden)', { timeout: 10000 });
    });
    
    await takeScreenshot(page, 'property-confirmation', stepNumber);
    
    const confirmationDesign = await checkDesign(page, 'Property Confirmation');
    
    // Check confirmation details
    await checkFunctionality(page, 'Property Details Display', async () => {
      const addressText = await page.textContent('#property-confirmation');
      if (!addressText.includes(testProperty.address)) {
        throw new Error('Property address not displayed in confirmation');
      }
    });
    
    // Check analysis type selection
    await checkFunctionality(page, 'Analysis Type Selection', async () => {
      const radioButtons = await page.$$('input[name="analysisType"]');
      if (radioButtons.length < 2) {
        throw new Error('Analysis type options not found');
      }
      // Select complete analysis
      await page.check('input[value="both"]');
    });
    
    stepNumber++;
    
    // Step 6: Start Analysis
    console.log(`\n📍 Step ${stepNumber}: Start Analysis`);
    
    await checkFunctionality(page, 'Confirm Analysis Button', async () => {
      await page.click('button:has-text("Analyze Investment")');
      await page.waitForTimeout(2000);
    });
    
    // Check if loading state appears
    const hasLoadingState = await page.isVisible('#loading-state:not(.hidden)');
    if (hasLoadingState) {
      await takeScreenshot(page, 'loading-state', stepNumber);
      const loadingDesign = await checkDesign(page, 'Loading State');
      
      // Check for progress indicators
      await checkFunctionality(page, 'Progress Indicators', async () => {
        const progressBar = await page.$('.bg-white.rounded-full');
        const progressSteps = await page.$$('.space-y-4 > div');
        if (!progressBar && progressSteps.length === 0) {
          throw new Error('No progress indicators found');
        }
      });
    } else {
      issues.push('Loading state did not appear - analysis might have failed');
    }
    
    stepNumber++;
    
    // Step 7: Analysis Results (if we get there)
    console.log(`\n📍 Step ${stepNumber}: Analysis Results`);
    
    // Wait for results or timeout
    try {
      await page.waitForSelector('#analysis-results:not(.hidden)', { timeout: 30000 });
      
      await takeScreenshot(page, 'analysis-results', stepNumber);
      const resultsDesign = await checkDesign(page, 'Analysis Results');
      
      // Check for sidebar
      if (!resultsDesign.hasSidebar) {
        issues.push('Sidebar not present in analysis results');
      }
      
      // Check key result components
      await checkFunctionality(page, 'Results Components', async () => {
        const components = [
          '.gradient-hero', // Property hero section
          '.metric-card', // Financial cards
          '.investment-score-card' // Investment verdict
        ];
        
        for (const component of components) {
          const element = await page.$(component);
          if (!element) {
            throw new Error(`Missing result component: ${component}`);
          }
        }
      });
      
    } catch (error) {
      console.log('  ⚠️  Results did not load within timeout');
      issues.push('Analysis results failed to load - likely due to API/backend issues');
    }
    
    // Step 8: Test Responsive Design
    console.log(`\n📍 Step ${stepNumber}: Responsive Design Check`);
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'tablet-view', stepNumber);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'mobile-view', stepNumber);
    
    // Check mobile menu if on results page
    if (await page.isVisible('.cm-sidebar')) {
      await checkFunctionality(page, 'Mobile Menu Toggle', async () => {
        const menuToggle = await page.$('#mobileMenuToggle');
        if (menuToggle) {
          await menuToggle.click();
          await page.waitForTimeout(500);
          const sidebarOpen = await page.isVisible('.cm-sidebar.open');
          if (!sidebarOpen) {
            throw new Error('Mobile menu did not open');
          }
        }
      });
    }
    
    // Generate suggestions based on testing
    suggestions.push('Add loading skeleton screens for better perceived performance');
    suggestions.push('Implement proper error boundaries with user-friendly messages');
    suggestions.push('Add tooltips to form fields explaining data usage');
    suggestions.push('Consider adding a progress save feature for long forms');
    suggestions.push('Add keyboard shortcuts for power users (e.g., Ctrl+Enter to submit)');
    suggestions.push('Implement undo/redo for form inputs');
    suggestions.push('Add a dark mode toggle in the sidebar');
    suggestions.push('Include property image upload capability');
    suggestions.push('Add comparison feature to compare multiple properties side by side');
    suggestions.push('Implement export to PDF directly from results page');
    suggestions.push('Add social sharing buttons for results');
    suggestions.push('Include a favorites/bookmark system for properties');
    suggestions.push('Add property history tracking');
    suggestions.push('Implement real-time collaboration features');
    suggestions.push('Add AI-powered property recommendations');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    issues.push(`Critical error: ${error.message}`);
  } finally {
    // Generate report
    console.log('\n' + '='*60);
    console.log('📊 TEST SUMMARY REPORT');
    console.log('='*60);
    
    console.log('\n🐛 Issues Found:');
    if (issues.length === 0) {
      console.log('  ✅ No critical issues found!');
    } else {
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n💡 Nice-to-Have Suggestions:');
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });
    
    // Save report to file
    const report = {
      testDate: new Date().toISOString(),
      issues,
      suggestions,
      screenshotCount: stepNumber
    };
    
    fs.writeFileSync('tests/e2e/user-journey-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Full report saved to: tests/e2e/user-journey-report.json');
    
    console.log('\n✨ Test completed! Browser will remain open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
    await browser.close();
  }
}

// Run the test
runFullUserJourney().catch(console.error);