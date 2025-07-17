const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;

test.describe('UI Improvements Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Create screenshots directory if it doesn't exist
    const screenshotDir = path.join(__dirname, 'screenshots', 'improved-ui');
    await fs.mkdir(screenshotDir, { recursive: true });
  });

  test('capture all UI improvements', async ({ page }) => {
    // Navigate to roi-finder.html
    await page.goto('file://' + path.join(__dirname, '../../roi-finder.html'));
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // 1. Capture the enhanced property form with mobile-responsive analysis mode selector
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/01-property-form-desktop.png'),
      fullPage: true
    });
    
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/02-property-form-mobile.png'),
      fullPage: true
    });
    
    // Back to desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // 2. Fill in the form to trigger loading state
    await page.fill('#address', '123 Main St, Toronto, ON');
    await page.fill('#purchasePrice', '650000');
    await page.fill('#downPayment', '130000');
    await page.fill('#interestRate', '5.5');
    await page.fill('#amortizationPeriod', '25');
    await page.fill('#monthlyRent', '3200');
    
    // Click analyze button and capture loading state immediately
    const analyzeButton = page.locator('#analyze-btn');
    
    // Intercept the API call to prevent actual request and keep loading state
    await page.route('**/api/analyze-property', route => {
      // Don't complete the request, just hang to keep loading state
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }, 10000); // Long delay to capture loading state
    });
    
    await analyzeButton.click();
    
    // Wait for loading state to appear
    await page.waitForSelector('#loadingState', { state: 'visible' });
    
    // 3. Capture enhanced loading state with progress steps
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/03-loading-state.png'),
      fullPage: true
    });
    
    // 4. Now inject mock results to show improved property header and formatting
    await page.evaluate(() => {
      // Hide loading state
      const loadingState = document.getElementById('loadingState');
      if (loadingState) loadingState.style.display = 'none';
      
      // Show results section
      const resultsSection = document.getElementById('results');
      if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = `
          <!-- Property Header with Visual Hierarchy -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg border-b-4 border-blue-500">
            <div class="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">123 Main St, Toronto, ON</h2>
                <div class="flex items-center gap-4 text-gray-600">
                  <span class="text-lg">4 bed • 3 bath • 2,100 sq ft</span>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Great Investment
                  </span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-3xl font-bold text-gray-900">C$650,000</p>
                <p class="text-sm text-gray-600">Purchase Price</p>
              </div>
            </div>
          </div>
          
          <!-- Results Tabs -->
          <div class="bg-white rounded-b-lg shadow-lg">
            <!-- Tab Navigation -->
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex">
                <button class="py-2 px-4 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
                  Long-Term Rental
                </button>
                <button class="py-2 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Short-Term Rental
                </button>
                <button class="py-2 px-4 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Comparison
                </button>
              </nav>
            </div>
            
            <!-- Tab Content -->
            <div class="p-6">
              <!-- Financial Metrics with Consistent Currency Formatting -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                  <h3 class="text-sm font-medium text-green-800 mb-2">Monthly Cash Flow</h3>
                  <p class="text-3xl font-bold text-green-900">C$487</p>
                  <p class="text-sm text-green-700 mt-1">After all expenses</p>
                </div>
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                  <h3 class="text-sm font-medium text-blue-800 mb-2">Cap Rate</h3>
                  <p class="text-3xl font-bold text-blue-900">5.2%</p>
                  <p class="text-sm text-blue-700 mt-1">Net Operating Income</p>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                  <h3 class="text-sm font-medium text-purple-800 mb-2">Cash-on-Cash ROI</h3>
                  <p class="text-3xl font-bold text-purple-900">4.5%</p>
                  <p class="text-sm text-purple-700 mt-1">Annual return on cash</p>
                </div>
              </div>
              
              <!-- Monthly Breakdown -->
              <div class="bg-gray-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Rental Income</span>
                    <span class="font-semibold text-green-600">+C$3,200</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Mortgage Payment</span>
                    <span class="font-semibold text-red-600">-C$2,184</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Property Tax</span>
                    <span class="font-semibold text-red-600">-C$325</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Insurance</span>
                    <span class="font-semibold text-red-600">-C$125</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600">Maintenance</span>
                    <span class="font-semibold text-red-600">-C$79</span>
                  </div>
                  <div class="border-t pt-3 mt-3">
                    <div class="flex justify-between items-center">
                      <span class="font-semibold text-gray-900">Net Cash Flow</span>
                      <span class="text-xl font-bold text-green-600">C$487</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    });
    
    // 5. Capture the results page with visual hierarchy and consistent formatting
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/04-results-visual-hierarchy.png'),
      fullPage: true
    });
    
    // 6. Test mobile view of results
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/05-results-mobile.png'),
      fullPage: true
    });
    
    // 7. Back to desktop and show STR tab for comparison
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => {
      // Simulate clicking STR tab
      const tabs = document.querySelectorAll('nav button');
      if (tabs.length > 1) {
        // Remove active state from first tab
        tabs[0].classList.remove('border-blue-500', 'text-blue-600');
        tabs[0].classList.add('border-transparent', 'text-gray-500');
        
        // Add active state to second tab
        tabs[1].classList.remove('border-transparent', 'text-gray-500');
        tabs[1].classList.add('border-blue-500', 'text-blue-600');
      }
      
      // Update content for STR
      const tabContent = document.querySelector('.p-6');
      if (tabContent) {
        tabContent.innerHTML = `
          <!-- STR Financial Metrics with Consistent Currency Formatting -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
              <h3 class="text-sm font-medium text-green-800 mb-2">Avg Nightly Rate</h3>
              <p class="text-3xl font-bold text-green-900">C$225</p>
              <p class="text-sm text-green-700 mt-1">Based on comparables</p>
            </div>
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
              <h3 class="text-sm font-medium text-blue-800 mb-2">Occupancy Rate</h3>
              <p class="text-3xl font-bold text-blue-900">72%</p>
              <p class="text-sm text-blue-700 mt-1">Area average</p>
            </div>
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
              <h3 class="text-sm font-medium text-purple-800 mb-2">Monthly Revenue</h3>
              <p class="text-3xl font-bold text-purple-900">C$4,860</p>
              <p class="text-sm text-purple-700 mt-1">Before expenses</p>
            </div>
          </div>
          
          <!-- STR Breakdown -->
          <div class="bg-gray-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">STR Monthly Breakdown</h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">STR Revenue (72% occupancy)</span>
                <span class="font-semibold text-green-600">+C$4,860</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Mortgage Payment</span>
                <span class="font-semibold text-red-600">-C$2,184</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Property Tax</span>
                <span class="font-semibold text-red-600">-C$325</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Insurance (STR)</span>
                <span class="font-semibold text-red-600">-C$175</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Utilities & Internet</span>
                <span class="font-semibold text-red-600">-C$250</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Cleaning & Supplies</span>
                <span class="font-semibold text-red-600">-C$450</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Management (15%)</span>
                <span class="font-semibold text-red-600">-C$729</span>
              </div>
              <div class="border-t pt-3 mt-3">
                <div class="flex justify-between items-center">
                  <span class="font-semibold text-gray-900">Net Cash Flow</span>
                  <span class="text-xl font-bold text-green-600">C$747</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    });
    
    // 8. Capture STR results
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/06-str-results.png'),
      fullPage: true
    });
    
    console.log('Screenshots captured successfully in tests/e2e/screenshots/improved-ui/');
  });
});