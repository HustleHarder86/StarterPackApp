const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const screenshotDir = path.join(__dirname, 'screenshots', 'str-tab-visual', timestamp);
fs.mkdirSync(screenshotDir, { recursive: true });

async function testSTRTabUI() {
  console.log('🚀 Starting STR Tab Visual Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // Set longer timeout
  page.setDefaultTimeout(60000);
  
  const report = {
    url: 'https://starter-pack-app.vercel.app/roi-finder.html',
    timestamp: new Date().toISOString(),
    visualFindings: [],
    functionalityChecks: [],
    recommendations: []
  };

  try {
    // Navigate with shorter timeout and retry logic
    console.log('📍 Navigating to application...');
    try {
      await page.goto(report.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 20000 
      });
      console.log('✅ Page loaded successfully\n');
    } catch (navError) {
      console.log('⚠️  Initial navigation timed out, retrying...');
      await page.goto(report.url, { 
        waitUntil: 'load',
        timeout: 30000 
      });
    }

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Screenshot 1: Initial page state
    console.log('📸 Capturing initial page state...');
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-initial-page.png'),
      fullPage: true 
    });

    // Check for form elements
    console.log('🔍 Checking form elements...');
    const formFields = {
      street: await page.$('#street') !== null,
      city: await page.$('#city') !== null,
      province: await page.$('#province') !== null,
      price: await page.$('#price') !== null,
      bedrooms: await page.$('#bedrooms') !== null,
      bathrooms: await page.$('#bathrooms') !== null,
      sqft: await page.$('#sqft') !== null,
      propertyTaxes: await page.$('#propertyTaxes') !== null,
      condoFees: await page.$('#condoFees') !== null
    };

    console.log('Form fields found:', formFields);
    report.functionalityChecks.push({
      name: 'Form Fields',
      status: Object.values(formFields).every(v => v) ? '✅ All present' : '⚠️ Some missing',
      details: formFields
    });

    // Fill the form
    console.log('\n📝 Filling property form...');
    const formData = [
      { selector: '#street', value: '123 Main Street' },
      { selector: '#city', value: 'Toronto' },
      { selector: '#province', value: 'Ontario' },
      { selector: '#price', value: '850000' },
      { selector: '#bedrooms', value: '3' },
      { selector: '#bathrooms', value: '2' },
      { selector: '#sqft', value: '1800' },
      { selector: '#propertyTaxes', value: '8500' },
      { selector: '#condoFees', value: '450' }
    ];

    for (const field of formData) {
      try {
        await page.waitForSelector(field.selector, { timeout: 5000 });
        await page.click(field.selector, { clickCount: 3 });
        await page.type(field.selector, field.value);
        console.log(`  ✓ ${field.selector}: ${field.value}`);
      } catch (e) {
        console.log(`  ✗ Failed to fill ${field.selector}`);
      }
    }

    // Screenshot 2: Filled form
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-filled-form.png'),
      fullPage: true 
    });

    // Submit form
    console.log('\n🚀 Submitting form...');
    const submitButton = await page.$('button[type="submit"], button.btn-primary');
    if (submitButton) {
      await submitButton.click();
      console.log('✅ Form submitted');
      
      // Wait for analysis
      await page.waitForTimeout(8000);
    } else {
      console.log('❌ Submit button not found');
      report.functionalityChecks.push({
        name: 'Submit Button',
        status: '❌ Not found'
      });
    }

    // Screenshot 3: After submission
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-after-submission.png'),
      fullPage: true 
    });

    // Look for tabs
    console.log('\n🔍 Looking for tab navigation...');
    const tabs = await page.$$('[role="tab"], .tab-button, button.tab');
    console.log(`Found ${tabs.length} tabs`);
    
    if (tabs.length > 0) {
      // Check for STR tab
      let strTabFound = false;
      for (let i = 0; i < tabs.length; i++) {
        const tabText = await tabs[i].evaluate(el => el.textContent);
        console.log(`  Tab ${i + 1}: ${tabText}`);
        if (tabText.includes('Short-Term Rental') || tabText.includes('STR')) {
          strTabFound = true;
          console.log('  ✅ STR tab found!');
          
          // Click STR tab
          await tabs[i].click();
          await page.waitForTimeout(2000);
          
          // Screenshot 4: STR tab active
          await page.screenshot({ 
            path: path.join(screenshotDir, '04-str-tab-active.png'),
            fullPage: true 
          });
          break;
        }
      }
      
      if (!strTabFound) {
        console.log('  ❌ STR tab not found among tabs');
      }
    }

    // Visual analysis of STR content
    console.log('\n📊 Analyzing STR tab content...');
    
    // Check for charts
    const charts = await page.$$('canvas, .chart-container, [class*="chart"]');
    console.log(`  Charts found: ${charts.length}`);
    if (charts.length > 0) {
      await page.screenshot({ 
        path: path.join(screenshotDir, '05-charts-view.png'),
        fullPage: false 
      });
    }

    // Check for calculator
    const calculator = await page.$$('.calculator, .str-calculator, [class*="calculator"]');
    console.log(`  Calculator sections found: ${calculator.length}`);

    // Check for property image
    const propertyImages = await page.$$('img[alt*="property"], .property-image img');
    console.log(`  Property images found: ${propertyImages.length}`);
    
    if (propertyImages.length > 0) {
      const imgSrc = await propertyImages[0].evaluate(el => el.src);
      console.log(`  Image source: ${imgSrc}`);
      report.visualFindings.push({
        element: 'Property Image',
        status: imgSrc.includes('default') ? 'Default placeholder' : 'Custom image',
        source: imgSrc
      });
    }

    // Check layout
    console.log('\n🎨 Checking layout...');
    const gridElements = await page.$$('.grid, .grid-cols-2, [style*="grid"]');
    const flexElements = await page.$$('.flex, [style*="flex"]');
    console.log(`  Grid elements: ${gridElements.length}`);
    console.log(`  Flex elements: ${flexElements.length}`);

    // Mobile responsiveness test
    console.log('\n📱 Testing mobile view...');
    await page.setViewport({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: path.join(screenshotDir, '06-mobile-view.png'),
      fullPage: true 
    });

    // Generate visual report
    report.visualFindings.push({
      element: 'Tab Navigation',
      status: tabs.length > 0 ? '✅ Present' : '❌ Missing',
      count: tabs.length,
      note: tabs.length > 4 ? 'Possible duplicate tabs' : 'Normal count'
    });

    report.visualFindings.push({
      element: 'Charts/Visualizations',
      status: charts.length > 0 ? '✅ Present' : '❌ Missing',
      count: charts.length
    });

    report.visualFindings.push({
      element: 'Calculator Section',
      status: calculator.length > 0 ? '✅ Present' : '❌ Missing',
      count: calculator.length
    });

    // Recommendations
    if (tabs.length > 4) {
      report.recommendations.push('Remove duplicate tab navigation');
    }
    if (charts.length === 0) {
      report.recommendations.push('Charts not rendering - check data flow');
    }
    if (!propertyImages.length) {
      report.recommendations.push('Add property image display');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    report.error = error.message;
    
    // Capture error screenshot
    await page.screenshot({ 
      path: path.join(screenshotDir, 'error-state.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
    
    // Save report
    const reportPath = path.join(screenshotDir, 'visual-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VISUAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📁 Screenshots saved to: ${screenshotDir}`);
    console.log(`\n🔍 Visual Findings:`);
    report.visualFindings.forEach(finding => {
      console.log(`  ${finding.status} ${finding.element}`);
      if (finding.note) console.log(`     Note: ${finding.note}`);
    });
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
    console.log('='.repeat(60));
  }
}

// Run the test
testSTRTabUI().catch(console.error);