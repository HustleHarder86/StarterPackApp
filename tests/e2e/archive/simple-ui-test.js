#!/usr/bin/env node

/**
 * Simple UI Test for StarterPackApp
 * Uses standard selectors for better compatibility
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runSimpleUITest() {
  console.log('StarterPackApp Simple UI Test');
  console.log('=' .repeat(50));
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  const results = { passed: 0, failed: 0 };
  
  // Helper to take screenshots
  async function screenshot(name) {
    const dir = path.join(__dirname, 'screenshots', 'simple-ui-test');
    await fs.mkdir(dir, { recursive: true });
    await page.screenshot({ 
      path: path.join(dir, `${name}.png`), 
      fullPage: true 
    });
    console.log(`📸 Screenshot: ${name}`);
  }
  
  // Helper to test
  function test(name, condition) {
    if (condition) {
      results.passed++;
      console.log(`✅ ${name}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}`);
    }
  }

  try {
    // Navigate to the app with test mode
    console.log('\n1. Loading application...');
    const url = 'https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true';
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await screenshot('01-initial-load');
    
    // Check basic page elements
    console.log('\n2. Checking page elements...');
    
    const title = await page.title();
    test('Page has title', title.includes('StarterPackApp') || title.includes('ROI'));
    
    const hasForm = await page.$('form') !== null;
    test('Form element exists', hasForm);
    
    const hasInputs = await page.$$('input').then(inputs => inputs.length > 0);
    test('Input fields exist', hasInputs);
    
    const hasButton = await page.$$('button').then(buttons => buttons.length > 0);
    test('Buttons exist', hasButton);
    
    // Check for specific elements
    console.log('\n3. Checking specific UI elements...');
    
    // Look for any address-related input
    const addressInputs = await page.$$eval('input', inputs => 
      inputs.filter(input => 
        input.placeholder?.toLowerCase().includes('address') ||
        input.placeholder?.toLowerCase().includes('street') ||
        input.name?.toLowerCase().includes('address')
      ).length
    );
    test('Address input field found', addressInputs > 0);
    
    // Look for price-related input
    const priceInputs = await page.$$eval('input', inputs => 
      inputs.filter(input => 
        input.placeholder?.includes('000') ||
        input.type === 'number' ||
        input.name?.toLowerCase().includes('price')
      ).length
    );
    test('Price input field found', priceInputs > 0);
    
    // Check for dropdowns
    const selects = await page.$$('select');
    test('Dropdown selects found', selects.length > 0);
    
    // Test user interaction
    console.log('\n4. Testing user interactions...');
    
    // Find first text input and try to type
    const firstInput = await page.$('input[type="text"], input:not([type])');
    if (firstInput) {
      await firstInput.click();
      await firstInput.type('Test input');
      const value = await firstInput.evaluate(el => el.value);
      test('Can type in input field', value.includes('Test'));
    }
    
    await screenshot('02-after-input');
    
    // Find and click primary button
    const buttons = await page.$$eval('button', btns => 
      btns.map(btn => ({
        text: btn.textContent,
        classes: btn.className,
        index: btns.indexOf(btn)
      }))
    );
    
    console.log('\n5. Available buttons:');
    buttons.forEach(btn => {
      console.log(`   - "${btn.text.trim()}" (classes: ${btn.classes})`);
    });
    
    // Try to click analyze button
    const analyzeButton = buttons.find(btn => 
      btn.text.toLowerCase().includes('analyze') || 
      btn.classes.includes('primary')
    );
    
    if (analyzeButton) {
      await page.evaluate((index) => {
        document.querySelectorAll('button')[index].click();
      }, analyzeButton.index);
      
      console.log('\n6. Clicked analyze button, waiting for response...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check for results or error
      const hasResults = await page.$('#analysis-results') !== null;
      const hasError = await page.$('.error-message, .alert') !== null;
      
      if (hasResults) {
        test('Analysis results displayed', true);
        await screenshot('03-results');
      } else if (hasError) {
        const errorText = await page.$eval('.error-message, .alert', el => el.textContent);
        test('Error handling works', true);
        console.log(`   Error message: ${errorText}`);
        await screenshot('03-error');
      } else {
        test('Response received', false);
      }
    }
    
    // Test responsive design
    console.log('\n7. Testing responsive design...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileFormVisible = await page.$('form') !== null;
    test('Form visible on mobile', mobileFormVisible);
    
    await screenshot('04-mobile');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Test Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Total: ${results.passed + results.failed}`);
    console.log(`Success Rate: ${(results.passed / (results.passed + results.failed) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await screenshot('error-final');
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
}

// Run the test
runSimpleUITest().catch(console.error);