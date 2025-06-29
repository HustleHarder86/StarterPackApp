// Debug current issues using visual debugging
const { test, expect } = require('@playwright/test');
const { VisualDebugger } = require('./helpers/visual-debugger');
const path = require('path');
const fs = require('fs').promises;

test.describe('Debug Current Issues', () => {
  test('explore roi-finder page structure', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    debugger.setupConsoleCapture();
    
    // Navigate to ROI Finder page
    await page.goto('/roi-finder.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait for React components
    
    // Capture initial state
    await debugger.captureState('roi-finder-loaded');
    
    // Extract all form elements
    const formElements = await page.evaluate(() => {
      const elements = [];
      
      // Find all inputs
      document.querySelectorAll('input').forEach(el => {
        elements.push({
          type: 'input',
          inputType: el.type,
          id: el.id,
          name: el.name,
          placeholder: el.placeholder,
          className: el.className,
          visible: el.offsetParent !== null,
          value: el.value
        });
      });
      
      // Find all buttons
      document.querySelectorAll('button').forEach(el => {
        elements.push({
          type: 'button',
          id: el.id,
          className: el.className,
          text: el.innerText,
          onclick: el.onclick ? 'has onclick' : 'no onclick',
          visible: el.offsetParent !== null
        });
      });
      
      // Find all containers that might hold results
      document.querySelectorAll('[id*="result"], [class*="result"], [id*="analysis"], [class*="analysis"]').forEach(el => {
        elements.push({
          type: 'container',
          tag: el.tagName,
          id: el.id,
          className: el.className,
          visible: el.offsetParent !== null,
          hasContent: el.innerText.length > 0
        });
      });
      
      return elements;
    });
    
    // Save findings
    const report = {
      url: page.url(),
      timestamp: new Date().toISOString(),
      formElements,
      expectedElements: {
        propertyAddress: formElements.find(el => el.id === 'propertyAddress' || el.id?.includes('address')),
        analyzeBtn: formElements.find(el => el.id === 'analyze-btn' || (el.type === 'button' && el.text?.includes('Analyze'))),
        resultsContainer: formElements.find(el => el.id === 'results-container' || el.id?.includes('result'))
      },
      recommendations: []
    };
    
    // Generate recommendations
    if (!report.expectedElements.propertyAddress) {
      report.recommendations.push({
        issue: 'Property address input not found',
        found: formElements.filter(el => el.type === 'input').map(el => ({
          id: el.id,
          placeholder: el.placeholder
        })),
        suggestion: 'Update test to use correct input selector'
      });
    }
    
    if (!report.expectedElements.analyzeBtn) {
      report.recommendations.push({
        issue: 'Analyze button not found',
        found: formElements.filter(el => el.type === 'button').map(el => ({
          id: el.id,
          text: el.text
        })),
        suggestion: 'Update test to use correct button selector'
      });
    }
    
    // Save report
    await fs.writeFile(
      path.join(__dirname, 'debug-reports', 'roi-finder-analysis.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('ROI Finder Analysis:', JSON.stringify(report, null, 2));
    
    // Try to fill and submit form with whatever we find
    const addressInput = formElements.find(el => 
      el.type === 'input' && 
      (el.placeholder?.toLowerCase().includes('address') || el.name?.includes('address'))
    );
    
    if (addressInput) {
      await page.fill(`#${addressInput.id}`, '123 Test St, Toronto, ON, Canada');
      await debugger.captureState('after-address-fill');
    }
    
    // Look for any submit button
    const submitButton = formElements.find(el => 
      el.type === 'button' && 
      (el.text?.includes('Analyze') || el.text?.includes('Submit') || el.text?.includes('Calculate'))
    );
    
    if (submitButton) {
      // Click and see what happens
      if (submitButton.id) {
        await page.click(`#${submitButton.id}`);
      } else if (submitButton.text) {
        await page.click(`button:has-text("${submitButton.text}")`);
      }
      
      await page.waitForTimeout(3000);
      await debugger.captureState('after-submit');
    }
  });

  test('debug authentication issues', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    
    // Check if Firebase is loaded
    await page.goto('/roi-finder.html');
    
    const firebaseStatus = await page.evaluate(() => {
      return {
        firebaseLoaded: typeof firebase !== 'undefined',
        firebaseAuth: typeof firebase?.auth !== 'undefined',
        currentUser: firebase?.auth?.()?.currentUser,
        authElements: Array.from(document.querySelectorAll('[id*="auth"], [id*="login"], [id*="user"]')).map(el => ({
          id: el.id,
          className: el.className,
          text: el.innerText?.substring(0, 50)
        }))
      };
    });
    
    console.log('Firebase Status:', firebaseStatus);
    
    // Capture auth state
    await debugger.captureState('auth-state');
    
    // Try to find login form
    const loginElements = await page.evaluate(() => {
      return {
        emailInput: document.querySelector('input[type="email"]'),
        passwordInput: document.querySelector('input[type="password"]'),
        loginButton: Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.toLowerCase().includes('login') || 
          b.innerText.toLowerCase().includes('sign in')
        )
      };
    });
    
    console.log('Login Elements:', loginElements);
  });

  test('check for JavaScript errors', async ({ page }, testInfo) => {
    const debugger = new VisualDebugger(page, testInfo);
    await debugger.init();
    debugger.setupConsoleCapture();
    
    const errors = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          text: msg.text(),
          location: msg.location()
        });
      }
    });
    
    // Navigate to each main page
    const pages = ['/roi-finder.html', '/portfolio.html', '/reports.html'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForTimeout(2000);
      
      const pageErrors = await page.evaluate(() => {
        // Check for any error messages in the DOM
        const errorElements = [];
        document.querySelectorAll('[class*="error"], [id*="error"], .alert-danger').forEach(el => {
          if (el.offsetParent !== null && el.innerText) {
            errorElements.push(el.innerText);
          }
        });
        return errorElements;
      });
      
      await debugger.captureState(`${pageUrl.replace('/', '').replace('.html', '')}-state`);
      
      if (pageErrors.length > 0 || errors.length > 0) {
        console.log(`Errors on ${pageUrl}:`, { pageErrors, consoleErrors: errors });
      }
    }
  });
});

// Create debug reports directory
test.beforeAll(async () => {
  const debugDir = path.join(__dirname, 'debug-reports');
  await fs.mkdir(debugDir, { recursive: true });
});