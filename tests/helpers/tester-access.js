/**
 * Tester Access Helper
 * Provides utilities for tests to use tester accounts with unlimited STR analysis
 */

// Default tester credentials
const TESTER_ACCOUNTS = {
  primary: {
    userId: 'yBilXCUnWAdqUuJfy2YwXnRz4Xy2',
    email: 'tester@starterpackapp.com',
    password: process.env.TESTER_PASSWORD || 'test-password-123'
  },
  e2e: {
    userId: 'test-user-e2e',
    email: 'e2e@test.com',
    password: 'e2e-test-password'
  },
  generic: {
    userId: 'test-user-id',
    email: 'test@test.com',
    password: 'test-password'
  }
};

// Headers that grant tester access
const TESTER_HEADERS = {
  'X-E2E-Test-Mode': 'true',
  ...(process.env.TEST_API_KEY && { 'X-Test-API-Key': process.env.TEST_API_KEY })
};

/**
 * Get tester account credentials
 * @param {string} type - Type of tester account ('primary', 'e2e', 'generic')
 * @returns {Object} Tester account credentials
 */
function getTesterAccount(type = 'primary') {
  return TESTER_ACCOUNTS[type] || TESTER_ACCOUNTS.primary;
}

/**
 * Get headers for tester access
 * @returns {Object} Headers that grant unlimited STR access
 */
function getTesterHeaders() {
  return { ...TESTER_HEADERS };
}

/**
 * Setup page with tester access
 * @param {Page} page - Playwright page object
 */
async function setupTesterAccess(page) {
  // Add tester headers to all requests
  await page.setExtraHTTPHeaders(TESTER_HEADERS);
  
  // Optionally set localStorage flags
  await page.addInitScript(() => {
    localStorage.setItem('testMode', 'true');
    localStorage.setItem('testerAccess', 'true');
    localStorage.setItem('testUserId', 'yBilXCUnWAdqUuJfy2YwXnRz4Xy2');
  });
}

/**
 * Login with tester account
 * @param {Page} page - Playwright page object
 * @param {string} accountType - Type of tester account to use
 */
async function loginAsTester(page, accountType = 'primary') {
  const account = getTesterAccount(accountType);
  
  // Navigate to login page
  await page.goto('/login');
  
  // Fill in credentials
  await page.fill('#email', account.email);
  await page.fill('#password', account.password);
  
  // Submit login
  await page.click('#login-button');
  
  // Wait for redirect
  await page.waitForURL('**/roi-finder.html', { timeout: 10000 });
  
  console.log(`✅ Logged in as tester: ${account.email}`);
}

/**
 * Verify tester access is working
 * @param {Page} page - Playwright page object
 * @returns {boolean} True if tester access is active
 */
async function verifyTesterAccess(page) {
  // Check if we can run multiple STR analyses
  const testAddresses = [
    '123 Test St, Toronto, ON',
    '456 Demo Ave, Toronto, ON',
    '789 Sample Rd, Toronto, ON'
  ];
  
  for (const address of testAddresses) {
    // Try to analyze property
    const response = await page.evaluate(async (addr) => {
      const res = await fetch('/api/analyze-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-E2E-Test-Mode': 'true'
        },
        body: JSON.stringify({
          propertyAddress: addr,
          includeStrAnalysis: true,
          analysisType: 'both'
        })
      });
      return res.json();
    }, address);
    
    // Check if STR analysis was included
    if (!response.strAnalysis && !response.short_term_rental) {
      console.error(`❌ STR analysis missing for: ${address}`);
      return false;
    }
  }
  
  console.log('✅ Tester access verified - unlimited STR analysis working');
  return true;
}

/**
 * Create test property data with STR analysis
 */
function createTestPropertyWithSTR() {
  return {
    address: '123 King Street West, Unit 1205, Toronto, ON M5H 1A1',
    price: 850000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 900,
    propertyTaxes: 5400,
    condoFees: 650,
    propertyType: 'condo',
    includeStrAnalysis: true,
    analysisType: 'both'
  };
}

module.exports = {
  TESTER_ACCOUNTS,
  TESTER_HEADERS,
  getTesterAccount,
  getTesterHeaders,
  setupTesterAccess,
  loginAsTester,
  verifyTesterAccess,
  createTestPropertyWithSTR
};