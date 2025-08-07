const { test, expect } = require('@playwright/test');
const { VisualDebugger } = require('../helpers/visual-debugger');

test.describe('Quick Application Test', () => {
  test('check homepage and main components', async ({ page }, testInfo) => {
    const visualDebugger = new VisualDebugger(page, testInfo);
    await visualDebugger.init();
    
    // Test 1: Check homepage
    await page.goto('/');
    await visualDebugger.captureState('1-homepage');
    
    // Check for main elements
    const title = await page.title();
    console.log('Page title:', title);
    
    // Test 2: Navigate to ROI Finder
    await page.goto('/roi-finder.html');
    await visualDebugger.captureState('2-roi-finder-page');
    
    // Check if form exists
    const propertyForm = await page.locator('#property-form').count();
    console.log('Property form found:', propertyForm > 0);
    
    // Test 3: Check for auth elements
    const authSection = await page.locator('.auth-section, #auth-section, [data-auth]').count();
    console.log('Auth section found:', authSection > 0);
    
    // Test 4: Check for analysis mode toggle
    const analysisToggle = await page.locator('.analysis-mode-toggle, #analysis-mode-toggle, [data-analysis-mode]').count();
    console.log('Analysis mode toggle found:', analysisToggle > 0);
    
    // Capture final state
    await visualDebugger.captureState('3-final-state');
  });
  
  test('check form fields and structure', async ({ page }, testInfo) => {
    const visualDebugger = new VisualDebugger(page, testInfo);
    await visualDebugger.init();
    
    await page.goto('/roi-finder.html');
    await page.waitForLoadState('networkidle');
    
    await visualDebugger.captureState('form-structure');
    
    // List all input fields
    const inputs = await page.locator('input, select, textarea').all();
    console.log(`Found ${inputs.length} form inputs`);
    
    for (const input of inputs) {
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`Input: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
    }
  });
});