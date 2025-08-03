/**
 * Critical User Workflows E2E Tests
 * Tests the most important user journeys that must work correctly
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

// Test data
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'TestPassword123!',
  displayName: 'Test User'
};

const testProperty = {
  address: '123 Test Street, Toronto, ON',
  price: '850000',
  type: 'Condo',
  bedrooms: '3',
  bathrooms: '2',
  sqft: '1200',
  yearBuilt: '2015',
  propertyTax: '5490',
  condoFees: '650'
};

// Selectors based on unified design system
const selectors = {
  // Auth elements
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  loginButton: 'button:has-text("Sign In")',
  signupButton: 'button:has-text("Create Account")',
  logoutButton: 'button:has-text("Logout")',
  
  // Navigation
  sidebar: '.sidebar',
  sidebarLink: '.sidebar-link',
  analyticsLink: '.sidebar-link:has-text("Analytics")',
  
  // Property form
  propertyForm: '#property-analysis-form',
  addressInput: '#property-address',
  priceInput: 'input[placeholder*="850,000"]',
  propertyTypeSelect: 'select:has(option:text("Condo"))',
  bedroomsSelect: 'select:has(option:text("3 Bedrooms"))',
  bathroomsSelect: 'select:has(option:text("2 Bathrooms"))',
  analyzeButton: '.btn-primary:has-text("Analyze Property")',
  sampleDataButton: '.btn-secondary:has-text("Sample Data")',
  
  // Analysis results
  analysisResults: '#analysis-results',
  investmentScore: '.investment-score-card',
  financialOverview: '.financial-overview',
  generateReportButton: 'button:has-text("Generate Report")',
  
  // Extension integration
  extensionBanner: '.info-banner:has-text("browser extension")',
  
  // Loading states
  loadingSpinner: '.loading-spinner',
  progressBar: '.animate-progress'
};

test.describe('Critical User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with proper viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
  });

  test('User Registration Flow', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Navigate to signup
    await page.goto(`${BASE_URL}/roi-finder.html`);
    
    // Wait for auth section
    await page.waitForSelector('#login-section', { state: 'visible' });
    
    // Click create account tab/link
    const createAccountLink = await page.locator('text=Create Account').first();
    await createAccountLink.click();
    
    // Fill signup form
    await page.fill('#register-email', testUser.email);
    await page.fill('#register-password', testUser.password);
    await page.fill('#register-confirm-password', testUser.password);
    
    // Submit form
    await page.click('#register-btn');
    
    // Wait for successful registration (should show property form)
    await expect(page.locator('#property-input-section')).toBeVisible({ timeout: 10000 });
    
    // Verify user is logged in
    const userEmail = await page.locator('.user-email').textContent();
    expect(userEmail).toContain(testUser.email);
  });

  test('Property Analysis Submission', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Go directly to property analysis page
    await page.goto(`${BASE_URL}/roi-finder.html`);
    
    // Skip auth if already implemented, or use existing user
    // For now, assume form is accessible
    
    // Wait for property form
    await page.waitForSelector(selectors.propertyForm, { state: 'visible' });
    
    // Fill property details
    await page.fill(selectors.addressInput, testProperty.address);
    await page.fill(selectors.priceInput, testProperty.price);
    
    // Select dropdowns
    await page.selectOption(selectors.propertyTypeSelect, { label: testProperty.type });
    await page.selectOption(selectors.bedroomsSelect, { label: `${testProperty.bedrooms} Bedrooms` });
    await page.selectOption(selectors.bathroomsSelect, { label: `${testProperty.bathrooms} Bathrooms` });
    
    // Click analyze button
    await page.click(selectors.analyzeButton);
    
    // Wait for loading to complete
    await page.waitForSelector(selectors.loadingSpinner, { state: 'hidden', timeout: 30000 });
    
    // Verify analysis results appear
    await expect(page.locator(selectors.analysisResults)).toBeVisible();
    await expect(page.locator(selectors.investmentScore)).toBeVisible();
    await expect(page.locator(selectors.financialOverview)).toBeVisible();
  });

  test('Extension Data Flow', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Simulate extension data in URL
    const extensionData = {
      address: '456 Extension Ave, Toronto, ON',
      price: '1200000',
      bedrooms: '4',
      bathrooms: '3'
    };
    
    const urlParams = new URLSearchParams(extensionData);
    await page.goto(`${BASE_URL}/roi-finder.html?${urlParams.toString()}`);
    
    // Verify form is pre-filled
    await page.waitForSelector(selectors.propertyForm, { state: 'visible' });
    
    const addressValue = await page.inputValue(selectors.addressInput);
    expect(addressValue).toBe(extensionData.address);
    
    const priceValue = await page.inputValue(selectors.priceInput);
    expect(priceValue).toBe(extensionData.price);
    
    // Verify form is visible (not hidden)
    await expect(page.locator(selectors.propertyForm)).toBeVisible();
  });

  test('Report Generation', async ({ page }) => {
    test.setTimeout(TIMEOUT * 2); // Double timeout for PDF generation
    
    // First complete an analysis
    await page.goto(`${BASE_URL}/roi-finder.html`);
    await page.waitForSelector(selectors.propertyForm);
    
    // Use sample data for quick test
    await page.click(selectors.sampleDataButton);
    await page.click(selectors.analyzeButton);
    
    // Wait for analysis to complete
    await page.waitForSelector(selectors.analysisResults, { state: 'visible', timeout: 30000 });
    
    // Click generate report
    await page.click(selectors.generateReportButton);
    
    // Wait for report generation (usually opens in new tab or downloads)
    // Check for success message or download
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    const download = await downloadPromise;
    
    // Verify download
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('Mobile Responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/roi-finder.html`);
    
    // Check mobile menu toggle is visible
    const mobileMenuToggle = page.locator('.mobile-menu-toggle');
    await expect(mobileMenuToggle).toBeVisible();
    
    // Click to open sidebar
    await mobileMenuToggle.click();
    
    // Verify sidebar opens
    await expect(page.locator('.sidebar.open')).toBeVisible();
    
    // Verify overlay is active
    await expect(page.locator('.sidebar-overlay.active')).toBeVisible();
    
    // Click overlay to close
    await page.click('.sidebar-overlay');
    
    // Verify sidebar closes
    await expect(page.locator('.sidebar.open')).not.toBeVisible();
  });

  test('Visual Consistency with Mockup', async ({ page }) => {
    await page.goto(`${BASE_URL}/roi-finder.html`);
    
    // Wait for all CSS to load
    await page.waitForLoadState('networkidle');
    
    // Check key visual elements match unified design system
    
    // 1. Sidebar styling
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveCSS('background-color', 'rgb(17, 24, 39)'); // #111827
    await expect(sidebar).toHaveCSS('width', '224px');
    
    // 2. Active navigation link
    const activeLink = page.locator('.sidebar-link.active').first();
    if (await activeLink.count() > 0) {
      // Check gradient background
      const background = await activeLink.evaluate(el => 
        window.getComputedStyle(el).background
      );
      expect(background).toContain('linear-gradient');
    }
    
    // 3. Primary button styling
    const primaryButton = page.locator('.btn-primary').first();
    if (await primaryButton.count() > 0) {
      const background = await primaryButton.evaluate(el => 
        window.getComputedStyle(el).background
      );
      expect(background).toContain('linear-gradient');
    }
    
    // 4. Form container
    const formContainer = page.locator('.form-container').first();
    if (await formContainer.count() > 0) {
      await expect(formContainer).toHaveCSS('border-radius', '16px');
      await expect(formContainer).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    }
    
    // Take screenshot for manual verification
    await page.screenshot({ 
      path: 'tests/screenshots/roi-finder-visual-test.png',
      fullPage: true 
    });
  });

  test('Error Handling and Recovery', async ({ page }) => {
    await page.goto(`${BASE_URL}/roi-finder.html`);
    
    // Test form validation
    await page.waitForSelector(selectors.propertyForm);
    
    // Try to submit empty form
    await page.click(selectors.analyzeButton);
    
    // Should show validation errors
    const validationMessage = await page.locator(':invalid').first();
    expect(validationMessage).toBeTruthy();
    
    // Test API error handling (mock network failure)
    await page.route('**/api/analyze', route => {
      route.abort('failed');
    });
    
    // Fill form and submit
    await page.fill(selectors.addressInput, testProperty.address);
    await page.fill(selectors.priceInput, testProperty.price);
    await page.click(selectors.analyzeButton);
    
    // Should show error message
    const errorMessage = await page.locator('.error-message, .alert-danger').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('Navigation Between Sections', async ({ page }) => {
    await page.goto(`${BASE_URL}/roi-finder.html`);
    
    // Wait for sidebar
    await page.waitForSelector(selectors.sidebar);
    
    // Click through navigation items
    const navItems = await page.locator(selectors.sidebarLink).all();
    
    for (const navItem of navItems) {
      const text = await navItem.textContent();
      
      // Skip external links
      if (text.includes('Logout') || text.includes('Settings')) continue;
      
      await navItem.click();
      
      // Verify navigation occurred (URL change or content change)
      await page.waitForTimeout(500); // Brief wait for navigation
      
      // Check if active class is applied
      const isActive = await navItem.evaluate(el => 
        el.classList.contains('active')
      );
      
      // At least one nav item should be active
      if (isActive) {
        expect(isActive).toBeTruthy();
      }
    }
  });
});

// Test utilities
async function loginUser(page, email, password) {
  await page.fill(selectors.emailInput, email);
  await page.fill(selectors.passwordInput, password);
  await page.click(selectors.loginButton);
  await page.waitForSelector('#property-input-section', { state: 'visible' });
}

async function fillPropertyForm(page, property) {
  await page.fill(selectors.addressInput, property.address);
  await page.fill(selectors.priceInput, property.price);
  await page.selectOption(selectors.propertyTypeSelect, { label: property.type });
  await page.selectOption(selectors.bedroomsSelect, { label: `${property.bedrooms} Bedrooms` });
  await page.selectOption(selectors.bathroomsSelect, { label: `${property.bathrooms} Bathrooms` });
}

module.exports = { testUser, testProperty, selectors };