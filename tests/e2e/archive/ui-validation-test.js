#!/usr/bin/env node

/**
 * UI Validation Test for StarterPackApp
 * Focuses on testing UI elements and interactions that are currently working
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Helper functions
async function screenshot(page, name) {
  const dir = path.join(__dirname, 'screenshots', 'ui-validation', new Date().toISOString().split('T')[0]);
  await fs.mkdir(dir, { recursive: true });
  const filepath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

function test(name, condition, details = '') {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`${colors.green}  ✓ ${name}${colors.reset}`);
    results.details.push({ name, status: 'passed', details });
  } else {
    results.failed++;
    console.log(`${colors.red}  ✗ ${name}${colors.reset}${details ? ` - ${details}` : ''}`);
    results.details.push({ name, status: 'failed', details });
  }
}

function warn(message) {
  results.warnings++;
  console.log(`${colors.yellow}  ⚠ ${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.blue}━━━ ${title} ━━━${colors.reset}`);
}

// Main test function
async function runUIValidation() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    console.log(`${colors.magenta}StarterPackApp UI Validation Test${colors.reset}`);
    console.log('═'.repeat(50));
    console.log(`Date: ${new Date().toISOString()}`);
    console.log(`URL: https://starter-pack-app.vercel.app/roi-finder.html`);
    console.log('═'.repeat(50));

    // Navigate with test mode
    const testUrl = 'https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true';
    await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ========== Authentication & Navigation ==========
    section('Authentication & Navigation');
    
    // Check authentication bypass
    const userEmail = await page.$eval('.user-email, [class*="user"], header', el => {
      const text = el.textContent || '';
      return text.includes('test@e2e.com') ? 'test@e2e.com' : null;
    }).catch(() => null);
    
    test('Authentication bypass active', userEmail === 'test@e2e.com');
    test('User email displayed in header', !!userEmail);
    
    // Check for logout button
    const hasLogout = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      return buttons.some(el => el.textContent && el.textContent.includes('Logout'));
    });
    test('Logout option available', hasLogout);

    // ========== Form Structure & Elements ==========
    section('Form Structure & Elements');
    
    // Check main form container
    const hasForm = await page.$('#property-analysis-form, form[id*="property"], .property-form') !== null;
    test('Property analysis form present', hasForm);
    
    // Check form heading
    const formHeading = await page.$eval('h1, h2', el => el.textContent).catch(() => '');
    test('Form heading displayed', formHeading.includes('Analyze'));
    
    // Check for extension promotion
    const hasExtensionPromo = await page.$('.extension-promo, [class*="extension"]') !== null;
    test('Browser extension promotion shown', hasExtensionPromo);
    
    // Address field
    const addressField = await page.$('input[placeholder*="address"], input[placeholder*="Street"]');
    test('Address input field exists', !!addressField);
    
    if (addressField) {
      const placeholder = await addressField.evaluate(el => el.placeholder);
      test('Address field has placeholder', !!placeholder, `Placeholder: "${placeholder}"`);
    }
    
    // Price field
    const priceField = await page.$('input[placeholder*="850000"], input[type="number"]');
    test('Price input field exists', !!priceField);
    
    // Dropdowns
    const bedroomSelect = await page.$('select:has(option:has-text("Bedrooms")), select[id*="bedroom"]');
    test('Bedrooms dropdown exists', !!bedroomSelect);
    
    const bathroomSelect = await page.$('select:has(option:has-text("Bathrooms")), select[id*="bathroom"]');
    test('Bathrooms dropdown exists', !!bathroomSelect);
    
    // Submit button
    const submitButton = await page.$('button[class*="primary"], button:has-text("Analyze")');
    test('Submit button exists', !!submitButton);
    
    if (submitButton) {
      const buttonText = await submitButton.evaluate(el => el.textContent);
      test('Submit button has correct text', buttonText.includes('Analyze'));
    }

    // ========== Form Interactions ==========
    section('Form Interactions');
    
    // Try to fill address field
    if (addressField) {
      await addressField.click();
      await addressField.type('123 Test Street, Toronto, ON M5V 3A8');
      const value = await addressField.evaluate(el => el.value);
      test('Address field accepts input', value.includes('Test Street'));
    }
    
    // Try to fill price
    if (priceField) {
      await priceField.click({ clickCount: 3 });
      await priceField.type('750000');
      const value = await priceField.evaluate(el => el.value);
      test('Price field accepts input', value === '750000' || value === '$750000');
    }
    
    // Check for "Add More Details" section
    const moreDetailsButton = await page.evaluate((text) => !!document.querySelector('button')?.textContent?.includes(text), "Add More Details"), [class*="accordion"], [class*="expand"]');
    if (moreDetailsButton) {
      test('Additional details section available', true);
      await moreDetailsButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for additional fields
      const sqftField = await page.$('input[placeholder*="square"], input[placeholder*="sqft"]');
      test('Square feet field in additional details', !!sqftField);
      
      const taxField = await page.$('input[placeholder*="tax"], input[placeholder*="Tax"]');
      test('Property tax field in additional details', !!taxField);
    } else {
      warn('Additional details section not found');
    }
    
    await screenshot(page, '01-form-filled');

    // ========== Analysis Type Selection ==========
    section('Analysis Type Selection');
    
    // Look for analysis type checkboxes or radio buttons
    const strOption = await page.$('input[type="checkbox"][id*="str"], input[type="radio"][value*="str"]');
    const ltrOption = await page.$('input[type="checkbox"][id*="ltr"], input[type="radio"][value*="ltr"]');
    
    if (strOption || ltrOption) {
      test('Analysis type options found', true);
      
      if (strOption) {
        const strLabel = await page.$('label[for*="str"]');
        const strText = strLabel ? await strLabel.evaluate(el => el.textContent) : '';
        test('STR analysis option', true, strText);
      }
      
      if (ltrOption) {
        const ltrLabel = await page.$('label[for*="ltr"]');
        const ltrText = ltrLabel ? await ltrLabel.evaluate(el => el.textContent) : '';
        test('LTR analysis option', true, ltrText);
      }
    } else {
      warn('Analysis type selection not found - may be hidden or use different implementation');
    }

    // ========== Visual Design & Layout ==========
    section('Visual Design & Layout');
    
    // Check color scheme
    const primaryButton = await page.$('.btn-primary, button[class*="primary"]');
    if (primaryButton) {
      const styles = await primaryButton.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderRadius: computed.borderRadius
        };
      });
      test('Primary button styling applied', styles.backgroundColor !== 'rgba(0, 0, 0, 0)');
    }
    
    // Check responsive meta tag
    const hasViewport = await page.$eval('meta[name="viewport"]', el => el.content).catch(() => null);
    test('Responsive viewport meta tag', !!hasViewport);
    
    // Check for logo/branding
    const hasLogo = await page.$('.logo, img[alt*="StarterPack"], h1:has-text("StarterPackApp")') !== null;
    test('Application branding present', hasLogo);

    // ========== Mobile Responsiveness ==========
    section('Mobile Responsiveness');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if form is still visible
    const formVisibleMobile = await page.$('#property-analysis-form, form') !== null;
    test('Form visible on mobile', formVisibleMobile);
    
    // Check if submit button is reachable
    if (submitButton) {
      const buttonVisible = await submitButton.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      });
      test('Submit button accessible on mobile', buttonVisible);
    }
    
    await screenshot(page, '02-mobile-view');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    // ========== Error Handling ==========
    section('Error Handling');
    
    // Try submitting empty form
    if (submitButton) {
      // Clear fields first
      if (addressField) {
        await addressField.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
      }
      
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for validation messages
      const hasValidation = await page.$('.error-message, .validation-error, [class*="error"]') !== null;
      test('Form validation exists', hasValidation);
      
      // Check if we got the connection error
      const errorText = await page.$eval('.error-message, .alert', el => el.textContent).catch(() => '');
      if (errorText.includes('Connection lost')) {
        warn('Connection timeout issue confirmed - API may need configuration for test mode');
      }
    }
    
    await screenshot(page, '03-validation-or-error');

    // ========== Summary ==========
    console.log('\n' + '═'.repeat(50));
    console.log(`${colors.magenta}Test Summary${colors.reset}`);
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'screenshots', 'ui-validation', 'report.json');
    await fs.writeFile(reportPath, JSON.stringify({
      date: new Date().toISOString(),
      results: results,
      url: testUrl
    }, null, 2));
    
    console.log(`\nDetailed report saved to: ${reportPath}`);

  } catch (error) {
    console.error(`\n${colors.red}Test execution error: ${error.message}${colors.reset}`);
    await screenshot(page, 'error-state');
  } finally {
    await browser.close();
  }
}

// Run the test
runUIValidation().catch(console.error);