// Fixed E2E test using actual element IDs
const { test, expect } = require('@playwright/test');
const { VisualDebugger } = require('./helpers/visual-debugger');
const path = require('path');

test.describe('ROI Finder - Fixed Tests', () => {
  let debugger;

  test.beforeEach(async ({ page }, testInfo) => {
    debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    debugger.setupConsoleCapture();
  });

  test('complete property analysis flow with actual IDs', async ({ page }) => {
    // Start by opening the HTML file directly (no webserver needed)
    const filePath = `file://${path.resolve(__dirname, '../../roi-finder.html')}`;
    await page.goto(filePath);
    
    // Take initial screenshot
    await debugger.captureState('1-initial-load');
    
    // Wait for auth screen to be visible
    await page.waitForSelector('#auth-screen', { state: 'visible' });
    
    // Check if we need to sign up or sign in
    const authTitle = await page.textContent('#auth-title');
    console.log('Auth screen title:', authTitle);
    
    // Fill sign up form (or sign in if already registered)
    if (authTitle.includes('Sign Up')) {
      await page.fill('#name', 'Test User');
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'Test123!');
      
      await debugger.captureState('2-auth-filled');
      
      // Click the auth button (text changes based on mode)
      await page.click('#auth-form button[type="submit"]');
      
      // If already registered, switch to sign in
      const authError = await page.$('#auth-error');
      if (authError) {
        const errorText = await authError.textContent();
        if (errorText.includes('already in use')) {
          await page.click('#auth-switch');
          await page.fill('#email', 'test@example.com');
          await page.fill('#password', 'Test123!');
          await page.click('#auth-form button[type="submit"]');
        }
      }
    } else {
      // Sign in
      await page.fill('#email', 'test@example.com');
      await page.fill('#password', 'Test123!');
      await page.click('#auth-form button[type="submit"]');
    }
    
    // Wait for dashboard to appear
    await page.waitForSelector('#dashboard-screen', { state: 'visible', timeout: 10000 });
    await debugger.captureState('3-dashboard');
    
    // Click new analysis button
    await page.click('#new-analysis-btn');
    
    // Wait for property form
    await page.waitForSelector('#property-form-screen', { state: 'visible' });
    await debugger.captureState('4-property-form');
    
    // Fill property address (separate fields!)
    await page.fill('#street', '123 Main Street');
    await page.fill('#city', 'Toronto');
    await page.fill('#state', 'Ontario');
    await page.fill('#country', 'Canada');
    await page.fill('#postal', 'M5V 3A8');
    
    // Check STR analysis checkbox
    const strCheckbox = await page.$('#include-str-analysis');
    if (strCheckbox) {
      await page.check('#include-str-analysis');
    }
    
    await debugger.captureState('5-form-filled');
    
    // Submit form (find the actual submit button)
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    } else {
      // Try clicking any button with "Analyze" text
      await page.click('button:has-text("Analyze")');
    }
    
    // Wait for results
    await page.waitForSelector('#results-screen', { state: 'visible', timeout: 30000 });
    await debugger.captureState('6-results-shown');
    
    // Verify some results are displayed
    const propertyValue = await page.textContent('#result-value');
    const monthlyRent = await page.textContent('#result-rent');
    const capRate = await page.textContent('#result-cap-rate');
    
    console.log('Results:', { propertyValue, monthlyRent, capRate });
    
    expect(propertyValue).toBeTruthy();
    expect(monthlyRent).toBeTruthy();
    expect(capRate).toBeTruthy();
    
    // Check if STR comparison is shown
    const strContainer = await page.$('#str-comparison-container');
    if (strContainer) {
      await debugger.captureState('7-str-comparison');
      
      const strRate = await page.textContent('#str-rate');
      const strOccupancy = await page.textContent('#str-occupancy');
      
      console.log('STR Results:', { strRate, strOccupancy });
    }
    
    // Save the analysis
    await page.click('#save-analysis');
    await debugger.captureState('8-analysis-saved');
  });

  test('test navigation between screens', async ({ page }) => {
    const filePath = `file://${path.resolve(__dirname, '../../roi-finder.html')}`;
    await page.goto(filePath);
    
    // Mock being logged in
    await page.evaluate(() => {
      // Simulate auth state
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('userId', 'test-user-123');
      
      // Trigger auth state change if possible
      if (window.handleAuthStateChange) {
        window.handleAuthStateChange({ uid: 'test-user-123', email: 'test@example.com' });
      }
    });
    
    await page.reload();
    await debugger.captureState('mocked-auth-state');
    
    // Check which screen is visible
    const screens = ['#auth-screen', '#dashboard-screen', '#property-form-screen', '#results-screen'];
    for (const screen of screens) {
      const isVisible = await page.isVisible(screen);
      console.log(`${screen}: ${isVisible ? 'visible' : 'hidden'}`);
    }
  });

  test('analyze current page issues', async ({ page }) => {
    const filePath = `file://${path.resolve(__dirname, '../../roi-finder.html')}`;
    await page.goto(filePath);
    
    // Extract all interactive elements
    const pageAnalysis = await page.evaluate(() => {
      const analysis = {
        screens: [],
        forms: [],
        buttons: [],
        errors: [],
        reactComponents: []
      };
      
      // Find all screens
      ['auth-screen', 'dashboard-screen', 'property-form-screen', 'results-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          analysis.screens.push({
            id,
            visible: el.style.display !== 'none',
            classes: el.className
          });
        }
      });
      
      // Find all forms
      document.querySelectorAll('form').forEach(form => {
        analysis.forms.push({
          id: form.id,
          action: form.action,
          inputs: Array.from(form.querySelectorAll('input')).map(input => ({
            id: input.id,
            type: input.type,
            name: input.name,
            required: input.required
          }))
        });
      });
      
      // Find all buttons
      document.querySelectorAll('button').forEach(button => {
        analysis.buttons.push({
          id: button.id,
          text: button.innerText,
          type: button.type,
          onclick: button.onclick ? 'has handler' : 'no handler'
        });
      });
      
      // Check for React
      analysis.reactComponents = {
        reactLoaded: typeof React !== 'undefined',
        reactDOMLoaded: typeof ReactDOM !== 'undefined',
        componentsInWindow: Object.keys(window).filter(key => 
          key.includes('Component') || key.includes('View')
        )
      };
      
      return analysis;
    });
    
    console.log('Page Analysis:', JSON.stringify(pageAnalysis, null, 2));
    await debugger.captureState('page-analysis-complete');
    
    // Generate recommendations
    const recommendations = [];
    
    if (!pageAnalysis.screens.find(s => s.id === 'dashboard-screen' && s.visible)) {
      recommendations.push('Dashboard not visible - need to handle auth first');
    }
    
    if (!pageAnalysis.buttons.find(b => b.id === 'analyze-btn')) {
      recommendations.push('No analyze-btn found - use form submit button instead');
    }
    
    console.log('\nRecommendations:', recommendations);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // Run analyzer on failure
    const analyzer = require('./screenshot-analyzer');
    const analysis = await analyzer.analyzeScreenshots();
    console.log('Failure analysis:', analysis);
  }
});