const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotDir = path.join(__dirname, 'simple-calculator-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function testSimpleCalculator() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log(`Browser:`, msg.text()));
  
  try {
    console.log('\n=== Simple Calculator Test - Realtor.ca Data ===\n');
    
    // Navigate to test page
    await page.goto('http://localhost:3001/tests/simple-calculator-test.html', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take initial screenshot
    await page.screenshot({ 
      path: `${screenshotDir}/01-initial-page.png`,
      fullPage: true 
    });
    
    // Click load calculator button
    await page.click('.btn-primary');
    console.log('✓ Clicked load calculator button');
    
    // Wait for calculator to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of loaded calculator
    await page.screenshot({ 
      path: `${screenshotDir}/02-calculator-loaded.png`,
      fullPage: true 
    });
    
    // Extract test results
    const testResults = await page.evaluate(() => {
      const resultsText = document.getElementById('test-results')?.textContent || '';
      const mortgageInput = document.getElementById('mortgage');
      const propertyTaxInput = document.getElementById('propertyTax');
      const hoaInput = document.getElementById('hoaFees');
      
      // Check for visual indicators
      const greenCheckmark = document.querySelector('.text-green-600.font-semibold')?.textContent || '';
      const actualIndicators = Array.from(document.querySelectorAll('.text-green-600'))
        .filter(el => el.textContent.includes('actual'))
        .map(el => el.textContent);
      
      return {
        resultsText,
        mortgage: mortgageInput?.value,
        propertyTax: propertyTaxInput?.value,
        hoa: hoaInput?.value,
        hasGreenCheckmark: greenCheckmark.includes('Using actual listing data'),
        actualIndicators,
        // Get property tax label text
        propertyTaxLabel: Array.from(document.querySelectorAll('span'))
          .find(span => span.textContent.includes('Property Tax'))
          ?.parentElement?.textContent || ''
      };
    });
    
    console.log('\n=== Test Results ===');
    console.log('Mortgage value:', testResults.mortgage);
    console.log('Property Tax value:', testResults.propertyTax);
    console.log('HOA/Condo Fees:', testResults.hoa);
    console.log('Has green checkmark:', testResults.hasGreenCheckmark);
    console.log('Property tax label:', testResults.propertyTaxLabel);
    
    // Focus on calculator section
    await page.evaluate(() => {
      const calculator = document.querySelector('h3')?.parentElement?.parentElement;
      if (calculator) calculator.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take close-up of calculator
    await page.screenshot({ 
      path: `${screenshotDir}/03-calculator-closeup.png`,
      fullPage: true 
    });
    
    // Check if property tax shows actual data
    const usesActualData = testResults.propertyTax === '265' && 
                          testResults.propertyTaxLabel.includes('actual');
    
    console.log('\n=== Final Assessment ===');
    console.log(`Property Tax: ${usesActualData ? '✅' : '❌'} ${usesActualData ? 'USING ACTUAL DATA' : 'NOT USING ACTUAL DATA'}`);
    console.log(`- Expected: $265/month (from $3,180/year Realtor.ca data)`);
    console.log(`- Actual: $${testResults.propertyTax}/month`);
    console.log(`- Marked as: ${testResults.propertyTaxLabel.includes('actual') ? 'actual' : 'estimated'}`);
    
    // Take final screenshot with test summary visible
    await page.screenshot({ 
      path: `${screenshotDir}/04-test-summary.png`,
      fullPage: true 
    });
    
    console.log('\n✅ Test completed! Screenshots saved to:', screenshotDir);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ 
      path: `${screenshotDir}/ERROR.png`,
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testSimpleCalculator().catch(console.error);