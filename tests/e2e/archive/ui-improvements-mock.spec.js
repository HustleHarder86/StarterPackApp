const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;

test.describe('UI Improvements Screenshots (Mock)', () => {
  test.beforeEach(async ({ page }) => {
    // Create screenshots directory if it doesn't exist
    const screenshotDir = path.join(__dirname, 'screenshots', 'improved-ui');
    await fs.mkdir(screenshotDir, { recursive: true });
  });

  test('capture all UI improvements with mock content', async ({ page }) => {
    // Create a mock HTML page with all the improvements
    const mockHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ROI Finder - UI Improvements Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
        }
        .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-md">
        <div class="container mx-auto px-4 py-4">
            <h1 class="text-2xl font-bold text-blue-600">StarterPack ROI Finder</h1>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8" id="main-content">
        <!-- Property Analysis Form -->
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6" id="property-form">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Property Analysis</h2>
            
            <!-- Analysis Mode Selector - Mobile Responsive -->
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Analysis Mode</label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button class="px-4 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        Long-Term Rental
                    </button>
                    <button class="px-4 py-3 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                        Short-Term Rental
                    </button>
                    <button class="px-4 py-3 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                        Both (Compare)
                    </button>
                </div>
            </div>
            
            <!-- Form Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Property Address</label>
                    <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="123 Main St, Toronto, ON">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
                    <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="C$650,000">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Down Payment</label>
                    <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="C$130,000">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                    <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value="5.5%">
                </div>
            </div>
            
            <button class="mt-6 w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors" onclick="showLoading()">
                Analyze Property
            </button>
        </div>
    </main>

    <script>
        function showLoading() {
            document.getElementById('main-content').innerHTML = \`
                <!-- Enhanced Loading State -->
                <div class="max-w-2xl mx-auto text-center">
                    <div class="bg-white rounded-lg shadow-lg p-8">
                        <!-- Spinner -->
                        <div class="mb-6">
                            <div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                        
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">Analyzing Your Property</h2>
                        
                        <!-- Progress Steps -->
                        <div class="space-y-4 text-left max-w-md mx-auto">
                            <div class="flex items-center space-x-3">
                                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                </svg>
                                <span class="text-gray-700">Property data validated</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                </svg>
                                <span class="text-gray-700">Market analysis complete</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="w-5 h-5 border-2 border-blue-600 rounded-full animate-pulse"></div>
                                <span class="text-gray-700 font-medium">Calculating investment metrics...</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                <span class="text-gray-500">Generating recommendations</span>
                            </div>
                        </div>
                        
                        <p class="mt-6 text-sm text-gray-600">This usually takes 10-15 seconds</p>
                    </div>
                </div>
            \`;
            
            // After 3 seconds, show results
            setTimeout(showResults, 3000);
        }
        
        function showResults() {
            document.getElementById('main-content').innerHTML = \`
                <!-- Results Section -->
                <div class="max-w-6xl mx-auto">
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
                    
                    <!-- Results Content -->
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
                </div>
            \`;
        }
    </script>
</body>
</html>
    `;
    
    // Set the content
    await page.setContent(mockHTML);
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
    
    // 2. Click analyze button to show loading state
    await page.click('button:has-text("Analyze Property")');
    
    // Wait a moment for loading state to appear
    await page.waitForTimeout(500);
    
    // 3. Capture enhanced loading state with progress steps
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/03-loading-state.png'),
      fullPage: true
    });
    
    // Wait for results to appear
    await page.waitForTimeout(3000);
    
    // 4. Capture the results page with visual hierarchy and consistent formatting
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/04-results-visual-hierarchy.png'),
      fullPage: true
    });
    
    // 5. Test mobile view of results
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/05-results-mobile.png'),
      fullPage: true
    });
    
    // 6. Back to desktop and simulate STR tab click
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Click on STR tab
    await page.click('button:has-text("Short-Term Rental")');
    
    // Update the tab content to show STR data
    await page.evaluate(() => {
      // Update active tab styling
      const tabs = document.querySelectorAll('nav button');
      tabs[0].classList.remove('border-blue-500', 'text-blue-600');
      tabs[0].classList.add('border-transparent', 'text-gray-500');
      tabs[1].classList.remove('border-transparent', 'text-gray-500');
      tabs[1].classList.add('border-blue-500', 'text-blue-600');
      
      // Update content
      document.querySelector('.p-6').innerHTML = `
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
    });
    
    // 7. Capture STR results
    await page.screenshot({
      path: path.join(__dirname, 'screenshots/improved-ui/06-str-results.png'),
      fullPage: true
    });
    
    console.log('Screenshots captured successfully in tests/e2e/screenshots/improved-ui/');
  });
});