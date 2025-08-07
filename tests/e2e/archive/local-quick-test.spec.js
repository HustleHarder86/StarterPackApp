const { test, expect } = require('@playwright/test');
const { VisualDebugger } = require('../helpers/visual-debugger');
const path = require('path');

test.describe('Local File System Test', () => {
  test('check ROI finder page structure', async ({ page }, testInfo) => {
    const visualDebugger = new VisualDebugger(page, testInfo);
    await visualDebugger.init();
    
    // Load ROI finder directly from file system
    const filePath = `file://${path.resolve(__dirname, '../../roi-finder.html')}`;
    await page.goto(filePath);
    await page.waitForTimeout(2000); // Wait for JS to load
    
    await visualDebugger.captureState('1-roi-finder-loaded');
    
    // Check page structure
    const pageContent = await page.content();
    console.log('Page loaded, checking structure...');
    
    // Check for main sections
    const hasAuthSection = pageContent.includes('auth-section') || pageContent.includes('sign-in');
    const hasPropertyForm = pageContent.includes('property-form') || pageContent.includes('property-details');
    const hasAnalysisMode = pageContent.includes('analysis-mode') || pageContent.includes('LTR') || pageContent.includes('STR');
    
    console.log('Has auth section:', hasAuthSection);
    console.log('Has property form:', hasPropertyForm);
    console.log('Has analysis mode:', hasAnalysisMode);
    
    // List all visible buttons
    const buttons = await page.locator('button:visible').all();
    console.log(`Found ${buttons.length} visible buttons`);
    for (const button of buttons) {
      const text = await button.textContent();
      console.log(`Button: "${text}"`);
    }
    
    // List all form inputs
    const inputs = await page.locator('input:visible, select:visible').all();
    console.log(`Found ${inputs.length} visible form inputs`);
    
    await visualDebugger.captureState('2-final-state');
  });
  
  test('check index page', async ({ page }, testInfo) => {
    const visualDebugger = new VisualDebugger(page, testInfo);
    await visualDebugger.init();
    
    const filePath = `file://${path.resolve(__dirname, '../../index.html')}`;
    await page.goto(filePath);
    await page.waitForTimeout(1000);
    
    await visualDebugger.captureState('index-page');
    
    const title = await page.title();
    console.log('Index page title:', title);
    
    // Check for main CTA elements
    const ctaButtons = await page.locator('a[href*="roi-finder"], button:has-text("Get Started")').all();
    console.log(`Found ${ctaButtons.length} CTA elements`);
  });
});