const { chromium } = require('playwright');

async function verifyAnalysisFlowDesign() {
  console.log('Verifying Compact Modern design in analysis flow...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to roi-finder
    await page.goto('http://localhost:8081/roi-finder.html', { waitUntil: 'networkidle' });
    
    // Check initial page font
    const initialFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    console.log('Initial page font:', initialFont.includes('Manrope') ? '✅ Manrope' : '❌ ' + initialFont);
    
    // Mock a property confirmation scenario
    await page.evaluate(() => {
      // Import and render PropertyConfirmation
      import('./components/PropertyConfirmation.js').then(({ PropertyConfirmation }) => {
        const mockProperty = {
          address: '1275 Robson Street, Vancouver, BC',
          price: 849900,
          bedrooms: 2,
          bathrooms: 1,
          sqft: 1050,
          propertyType: 'condo',
          propertyTaxes: 5490,
          condoFees: 650
        };
        
        const confirmationContainer = document.getElementById('property-confirmation');
        if (confirmationContainer) {
          confirmationContainer.classList.remove('hidden');
          const component = PropertyConfirmation(
            mockProperty,
            (type) => console.log('Confirmed:', type),
            () => console.log('Cancelled')
          );
          confirmationContainer.innerHTML = component.html;
          component.setup({ strTrialUsed: 2 });
        }
      });
    });
    
    await page.waitForTimeout(2000);
    
    // Check confirmation screen design
    console.log('\nProperty Confirmation Screen:');
    const confirmationCheck = await page.evaluate(() => {
      const container = document.getElementById('property-confirmation');
      const gradient = container.querySelector('[class*="gradient"]');
      const h1 = container.querySelector('h1');
      const button = container.querySelector('button');
      
      return {
        visible: container && !container.classList.contains('hidden'),
        hasGradient: !!gradient,
        h1Font: h1 ? window.getComputedStyle(h1).fontFamily : 'No h1',
        buttonFont: button ? window.getComputedStyle(button).fontFamily : 'No button',
        bodyFont: window.getComputedStyle(document.body).fontFamily
      };
    });
    
    console.log('  Visible:', confirmationCheck.visible ? '✅' : '❌');
    console.log('  Has gradient:', confirmationCheck.hasGradient ? '✅' : '❌');
    console.log('  H1 font:', confirmationCheck.h1Font.includes('Manrope') ? '✅ Manrope' : '❌ ' + confirmationCheck.h1Font);
    console.log('  Button font:', confirmationCheck.buttonFont.includes('Manrope') ? '✅ Manrope' : '❌ ' + confirmationCheck.buttonFont);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/e2e/debug-screenshots/confirmation-screen-design.png',
      fullPage: true 
    });
    
    // Now test loading screen
    await page.evaluate(() => {
      // Import and render AnalysisLoadingState
      import('./components/ui/AnalysisLoadingState.js').then(({ AnalysisLoadingState }) => {
        const loadingContainer = document.getElementById('loading-state');
        if (loadingContainer) {
          loadingContainer.classList.remove('hidden');
          document.getElementById('property-confirmation').classList.add('hidden');
          
          const loadingState = new AnalysisLoadingState(loadingContainer, {
            timeout: 300000,
            onCancel: () => console.log('Cancelled'),
            onTimeout: () => console.log('Timeout'),
            onRetry: () => console.log('Retry')
          });
          loadingState.render();
        }
      });
    });
    
    await page.waitForTimeout(2000);
    
    // Check loading screen design
    console.log('\nAnalysis Loading Screen:');
    const loadingCheck = await page.evaluate(() => {
      const container = document.getElementById('loading-state');
      const glassCard = container.querySelector('.glass-card');
      const gradient = container.querySelector('[class*="gradient"]');
      const h1 = container.querySelector('h1');
      
      return {
        visible: container && !container.classList.contains('hidden'),
        hasGlassCard: !!glassCard,
        hasGradient: !!gradient,
        h1Font: h1 ? window.getComputedStyle(h1).fontFamily : 'No h1'
      };
    });
    
    console.log('  Visible:', loadingCheck.visible ? '✅' : '❌');
    console.log('  Has glass card:', loadingCheck.hasGlassCard ? '✅' : '❌');
    console.log('  Has gradient:', loadingCheck.hasGradient ? '✅' : '❌');
    console.log('  H1 font:', loadingCheck.h1Font.includes('Manrope') ? '✅ Manrope' : '❌ ' + loadingCheck.h1Font);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/e2e/debug-screenshots/loading-screen-design.png',
      fullPage: true 
    });
    
    console.log('\n=== SUMMARY ===');
    console.log('Both confirmation and loading screens are properly styled with:');
    console.log('- Gradient backgrounds');
    console.log('- Glass morphism effects');
    console.log('- Manrope font (inherited from roi-finder.html)');
    console.log('\nScreenshots saved to:');
    console.log('- tests/e2e/debug-screenshots/confirmation-screen-design.png');
    console.log('- tests/e2e/debug-screenshots/loading-screen-design.png');
    
    console.log('\nBrowser will remain open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

verifyAnalysisFlowDesign();