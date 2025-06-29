// Self-healing E2E test example
const { test, expect } = require('@playwright/test');
const { VisualDebugger } = require('./helpers/visual-debugger');
const path = require('path');

test.describe('Self-Healing Property Analysis', () => {
  let debugger;

  test.beforeEach(async ({ page }, testInfo) => {
    // Initialize visual debugger
    debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    debugger.setupConsoleCapture();
    
    // Navigate to the app
    await page.goto('/roi-finder.html');
    
    // Take initial screenshot
    await debugger.captureState('initial-load');
  });

  test('analyzes property with self-healing selectors', async ({ page }) => {
    // Try to find and fill the address field with self-healing
    try {
      // First try the expected selector
      await debugger.fillWithHeal('#propertyAddress', '123 Main St, Toronto, ON, Canada');
    } catch (error) {
      // If that fails, capture state and try alternatives
      console.log('Primary selector failed, analyzing page...');
      
      const state = await debugger.capturePageState();
      console.log('Available form fields:', state.formFields.map(f => ({
        id: f.id,
        name: f.name,
        placeholder: f.placeholder
      })));
      
      // Try alternative selectors
      const addressSelectors = [
        'input[name="address"]',
        'input[placeholder*="address"]',
        'input[id*="address"]',
        '.property-address-input'
      ];
      
      let filled = false;
      for (const selector of addressSelectors) {
        try {
          await page.fill(selector, '123 Main St, Toronto, ON, Canada');
          filled = true;
          console.log(`Success with selector: ${selector}`);
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!filled) {
        throw new Error('Could not find address input field');
      }
    }
    
    // Take screenshot after filling address
    await debugger.captureState('address-filled');
    
    // Try to click analyze button with self-healing
    const analyzeSelectors = [
      '#analyze-btn',
      'button[type="submit"]',
      'button:has-text("Analyze")',
      '.analyze-button'
    ];
    
    let clicked = false;
    for (const selector of analyzeSelectors) {
      try {
        await page.click(selector);
        clicked = true;
        console.log(`Clicked with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!clicked) {
      // Capture current state for debugging
      const { screenshot, state } = await debugger.captureState('no-analyze-button');
      console.log('Could not find analyze button. Page state saved to:', state);
      throw new Error('Could not find analyze button');
    }
    
    // Wait for results with self-healing
    const resultSelectors = [
      '#results-container',
      '.analysis-results',
      '[data-testid="results"]',
      'div:has-text("Monthly Cash Flow")'
    ];
    
    let resultsFound = false;
    for (const selector of resultSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        resultsFound = true;
        console.log(`Results found with selector: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!resultsFound) {
      await debugger.captureState('no-results');
      throw new Error('Results not displayed');
    }
    
    // Take final screenshot
    await debugger.captureState('analysis-complete');
    
    // Verify some results are displayed
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Cash Flow');
  });

  test('handles errors gracefully', async ({ page }) => {
    // Submit without entering address
    try {
      await debugger.clickWithHeal('#analyze-btn');
    } catch (error) {
      console.log('Expected error:', error.message);
    }
    
    // Capture error state
    await debugger.captureState('error-state');
    
    // Look for error message
    const errorSelectors = [
      '.error-message',
      '.alert-danger',
      '[role="alert"]',
      'div:has-text("required")'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        console.log(`Error message found: ${text}`);
        errorFound = true;
        break;
      }
    }
    
    expect(errorFound).toBe(true);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      // On failure, do detailed analysis
      console.log('Test failed, performing detailed analysis...');
      
      const analysis = await debugger.analyzeFailure(testInfo.error);
      console.log('Analysis results:', JSON.stringify(analysis, null, 2));
      
      // Attach screenshots to test report
      await testInfo.attach('failure-screenshot', {
        path: analysis.screenshot,
        contentType: 'image/png'
      });
    }
  });
});

// Helper test to explore the page structure
test('explore page structure', async ({ page }) => {
  await page.goto('/roi-finder.html');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Extract all form inputs
  const inputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input, button, textarea, select');
    return Array.from(inputs).map(el => ({
      tag: el.tagName,
      type: el.type,
      id: el.id,
      name: el.name,
      class: el.className,
      placeholder: el.placeholder,
      text: el.innerText || el.value
    }));
  });
  
  console.log('Page inputs:', JSON.stringify(inputs, null, 2));
  
  // Save page structure
  const fs = require('fs').promises;
  await fs.writeFile(
    path.join(__dirname, 'page-structure.json'),
    JSON.stringify({ inputs, url: page.url() }, null, 2)
  );
});