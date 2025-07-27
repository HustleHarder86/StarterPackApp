#!/usr/bin/env node

// Script to create mock UI states for visual analysis
// This creates HTML files that simulate different states of the application

const fs = require('fs');
const path = require('path');

const mockStatesDir = path.join(__dirname, 'mock-states');
if (!fs.existsSync(mockStatesDir)) {
  fs.mkdirSync(mockStatesDir, { recursive: true });
}

// Mock HTML for initial form state
const initialFormHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ROI Finder - Property Analysis</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .gradient-bg {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body class="bg-gray-50">
  <!-- Header -->
  <header class="gradient-bg text-white py-4">
    <div class="container mx-auto px-4">
      <h1 class="text-2xl font-bold">StarterPack ROI Finder</h1>
      <p class="text-sm opacity-90">Professional Real Estate Investment Analysis</p>
    </div>
  </header>

  <!-- Main Content -->
  <main class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Form Card -->
      <div class="card mb-8">
        <h2 class="text-2xl font-bold mb-6">Analyze Property Investment</h2>
        
        <form id="analysis-form">
          <!-- Property Address -->
          <div class="mb-6">
            <label for="property-address" class="block text-sm font-medium text-gray-700 mb-2">
              Property Address
            </label>
            <input 
              type="text" 
              id="property-address" 
              placeholder="Enter property address (e.g., 123 Main St, Toronto, ON)"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          <!-- Analysis Mode Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Analysis Type
            </label>
            <div class="grid grid-cols-2 gap-4">
              <label class="relative">
                <input type="radio" name="analysis-mode" value="ltr" id="analysis-mode-ltr" checked class="peer sr-only">
                <div class="p-4 border-2 rounded-lg cursor-pointer transition peer-checked:border-blue-500 peer-checked:bg-blue-50">
                  <div class="font-semibold">Long-Term Rental (LTR)</div>
                  <div class="text-sm text-gray-600">Traditional monthly rental analysis</div>
                </div>
              </label>
              
              <label class="relative">
                <input type="radio" name="analysis-mode" value="str" id="analysis-mode-str" class="peer sr-only">
                <div class="p-4 border-2 rounded-lg cursor-pointer transition peer-checked:border-green-500 peer-checked:bg-green-50">
                  <div class="font-semibold">Short-Term Rental (STR)</div>
                  <div class="text-sm text-gray-600">Airbnb potential analysis</div>
                  <div class="text-xs text-green-600 mt-1">Pro Feature</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            id="analyze-property-btn"
            class="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            Analyze Property
          </button>
        </form>
      </div>

      <!-- Info Cards -->
      <div class="grid md:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="font-semibold text-lg mb-2">🏠 Property Data</h3>
          <p class="text-gray-600 text-sm">
            Install our browser extension to automatically extract property data from Realtor.ca listings
          </p>
        </div>
        
        <div class="card">
          <h3 class="font-semibold text-lg mb-2">📊 AI-Powered Analysis</h3>
          <p class="text-gray-600 text-sm">
            Get market insights and rental estimates powered by Perplexity AI
          </p>
        </div>
      </div>
    </div>
  </main>
</body>
</html>
`;

// Mock HTML for loading state
const loadingStateHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analyzing Property...</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  </style>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
        <svg class="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-semibold mb-2">Analyzing Property</h2>
      <p class="text-gray-600 mb-1">Fetching market data from AI...</p>
      <p class="text-sm text-gray-500">This may take up to 60 seconds</p>
      
      <div class="mt-8 max-w-md mx-auto">
        <div class="bg-white rounded-lg p-4 shadow">
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span class="text-sm">Property data extracted</span>
          </div>
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <span class="text-sm">Researching market rates...</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span class="text-sm text-gray-400">Calculating financial metrics</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Mock HTML for results state
const resultsStateHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Analysis Results</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold">Property Analysis Results</h1>
        <button class="text-blue-600 hover:underline">← Back to Form</button>
      </div>
    </div>
  </header>

  <!-- Results -->
  <main class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <!-- Property Overview -->
      <div class="bg-white rounded-lg shadow mb-6 p-6">
        <h2 class="text-2xl font-bold mb-4">123 Main St, Toronto, ON M5V 3A8</h2>
        
        <div class="grid md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded">
            <div class="text-3xl font-bold text-green-600">$850,000</div>
            <div class="text-sm text-gray-600">Purchase Price</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded">
            <div class="text-3xl font-bold">6</div>
            <div class="text-sm text-gray-600">Bedrooms (4 + 2)</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded">
            <div class="text-3xl font-bold">3.5</div>
            <div class="text-sm text-gray-600">Bathrooms</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded">
            <div class="text-3xl font-bold">2,100</div>
            <div class="text-sm text-gray-600">Sq Ft</div>
          </div>
        </div>
      </div>

      <!-- Financial Metrics -->
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <!-- Cash Flow Analysis -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold mb-4">Monthly Cash Flow</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b">
              <span>Rental Income</span>
              <span class="font-semibold text-green-600">+$3,800</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span>Mortgage Payment</span>
              <span class="text-red-600">-$2,850</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span>Property Tax</span>
              <span class="text-red-600">-$458</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span>Insurance</span>
              <span class="text-red-600">-$125</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span>HOA/Maintenance</span>
              <span class="text-red-600">-$200</span>
            </div>
            <div class="flex justify-between py-3 text-lg font-bold">
              <span>Net Cash Flow</span>
              <span class="text-green-600">+$167</span>
            </div>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold mb-4">Investment Metrics</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-4 bg-blue-50 rounded">
              <div class="text-2xl font-bold text-blue-600">5.2%</div>
              <div class="text-sm text-gray-600">Cap Rate</div>
            </div>
            <div class="text-center p-4 bg-green-50 rounded">
              <div class="text-2xl font-bold text-green-600">8.1%</div>
              <div class="text-sm text-gray-600">Cash on Cash</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded">
              <div class="text-2xl font-bold text-purple-600">12.3%</div>
              <div class="text-sm text-gray-600">Total ROI</div>
            </div>
            <div class="text-center p-4 bg-orange-50 rounded">
              <div class="text-2xl font-bold text-orange-600">$5,490</div>
              <div class="text-sm text-gray-600">Annual Tax</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold mb-4">Monthly Expense Breakdown</h3>
          <canvas id="expense-chart" width="400" height="300"></canvas>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold mb-4">5-Year Cash Flow Projection</h3>
          <canvas id="cashflow-chart" width="400" height="300"></canvas>
        </div>
      </div>

      <!-- AI Recommendations -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-semibold mb-4">AI-Powered Recommendations</h3>
        
        <div class="space-y-3">
          <div class="flex items-start">
            <span class="text-green-500 mr-2">✓</span>
            <p><strong>Positive Cash Flow:</strong> This property generates immediate positive cash flow of $167/month, making it a stable investment.</p>
          </div>
          <div class="flex items-start">
            <span class="text-yellow-500 mr-2">⚠</span>
            <p><strong>Consider STR Potential:</strong> Similar properties in this area earn $250-350/night on Airbnb. Consider short-term rental for higher returns.</p>
          </div>
          <div class="flex items-start">
            <span class="text-blue-500 mr-2">ℹ</span>
            <p><strong>Tax Optimization:</strong> The $5,490 annual property tax is accurately reflected from the listing data, ensuring precise calculations.</p>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    // Mock chart data
    const expenseCtx = document.getElementById('expense-chart').getContext('2d');
    new Chart(expenseCtx, {
      type: 'doughnut',
      data: {
        labels: ['Mortgage', 'Property Tax', 'Insurance', 'HOA/Maint', 'Other'],
        datasets: [{
          data: [2850, 458, 125, 200, 100],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']
        }]
      }
    });

    const cashflowCtx = document.getElementById('cashflow-chart').getContext('2d');
    new Chart(cashflowCtx, {
      type: 'line',
      data: {
        labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
        datasets: [{
          label: 'Cumulative Cash Flow',
          data: [2004, 4108, 6312, 8616, 11020],
          borderColor: '#10B981',
          tension: 0.1
        }]
      }
    });
  </script>
</body>
</html>
`;

// Save mock HTML files
fs.writeFileSync(path.join(mockStatesDir, 'initial-form.html'), initialFormHTML);
fs.writeFileSync(path.join(mockStatesDir, 'loading-state.html'), loadingStateHTML);
fs.writeFileSync(path.join(mockStatesDir, 'results-state.html'), resultsStateHTML);

console.log('✅ Mock UI states created in:', mockStatesDir);
console.log('\nCreated files:');
console.log('- initial-form.html');
console.log('- loading-state.html');
console.log('- results-state.html');
console.log('\nYou can open these in a browser to see what the UI should look like!');