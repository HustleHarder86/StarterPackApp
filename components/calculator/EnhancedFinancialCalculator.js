/**
 * Enhanced Financial Calculator Component
 * Modern 2-column layout with interactive annual revenue chart
 */

export const EnhancedFinancialCalculator = ({ analysisData = {} }) => {
  // Extract property and financial data
  const propertyData = analysisData.propertyData || {};
  const costs = analysisData.costs || {};
  const ltrData = analysisData.longTermRental || analysisData.long_term_rental || {};
  const strData = analysisData.strAnalysis || analysisData.short_term_rental || {};
  
  // Determine which revenue to use based on analysis type
  const analysisType = analysisData.analysisType || 'both';
  const monthlyRevenue = analysisType === 'ltr' 
    ? (ltrData.monthlyRent || ltrData.monthly_rent || 3100)
    : (strData.monthlyRevenue || strData.monthly_revenue || 5400);
  
  // Extract expense values with proper fallbacks
  const monthlyMortgage = costs.mortgage || costs.mortgagePayment || 4200;
  const propertyTax = Math.round((propertyData.propertyTaxes || propertyData.property_taxes || 8500) / 12);
  const insurance = costs.insurance || 250;
  const hoaFees = propertyData.condoFees || propertyData.condo_fees || 450;
  const utilities = costs.utilities || 200;
  const maintenance = costs.maintenance || 300;
  
  // STR-specific expenses (only if STR analysis)
  const propertyMgmt = analysisType === 'str' ? Math.round(monthlyRevenue * 0.10) : 0;
  const cleaning = analysisType === 'str' ? 400 : 0;
  const supplies = analysisType === 'str' ? Math.round(monthlyRevenue * 0.04) : 0;
  const platformFees = analysisType === 'str' ? Math.round(monthlyRevenue * 0.03) : 0;
  const otherExpenses = costs.other || 150;
  
  // Calculate totals
  const totalExpenses = monthlyMortgage + propertyTax + insurance + hoaFees + 
                       propertyMgmt + utilities + cleaning + maintenance + 
                       supplies + platformFees + otherExpenses;
  const netCashFlow = monthlyRevenue - totalExpenses;
  const annualRevenue = monthlyRevenue * 12;
  const annualExpenses = totalExpenses * 12;
  const annualCashFlow = netCashFlow * 12;
  
  // Calculate metrics
  const downPayment = propertyData.downPayment || Math.round((propertyData.price || 850000) * 0.20);
  const cashOnCashReturn = downPayment > 0 ? ((annualCashFlow / downPayment) * 100).toFixed(1) : 0;
  const capRate = propertyData.price > 0 ? (((annualRevenue - annualExpenses + (monthlyMortgage * 12)) / propertyData.price) * 100).toFixed(1) : 0;

  return `
    <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:p-8 mt-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Financial Calculator</h2>
        <button 
          id="reset-financial-calc"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
      
      <!-- Key Metrics Bar -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <p class="text-sm text-green-700 font-medium">Monthly Cash Flow</p>
          <p class="text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}">
            ${netCashFlow >= 0 ? '+' : ''}$${Math.abs(netCashFlow).toLocaleString()}
          </p>
        </div>
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p class="text-sm text-blue-700 font-medium">Annual ROI</p>
          <p class="text-2xl font-bold text-blue-700">${cashOnCashReturn}%</p>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <p class="text-sm text-purple-700 font-medium">Cap Rate</p>
          <p class="text-2xl font-bold text-purple-700">${capRate}%</p>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
          <p class="text-sm text-amber-700 font-medium">Break-even</p>
          <p class="text-2xl font-bold text-amber-700">${netCashFlow >= 0 ? 'Positive' : 'Negative'}</p>
        </div>
      </div>
      
      <!-- 2-Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Annual Revenue Chart -->
        <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Annual Cash Flow Analysis</h3>
          <div class="relative h-64 mb-4 bg-white rounded-lg p-4">
            <canvas id="annual-revenue-chart" class="w-full h-full"></canvas>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Annual Revenue:</span>
              <span class="font-bold text-green-600">$${annualRevenue.toLocaleString()}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Annual Expenses:</span>
              <span class="font-bold text-red-600">$${annualExpenses.toLocaleString()}</span>
            </div>
            <div class="flex justify-between pt-2 border-t border-gray-300">
              <span class="text-gray-700 font-medium">Net Annual Cash Flow:</span>
              <span class="font-bold text-lg ${annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${annualCashFlow >= 0 ? '+' : ''}$${Math.abs(annualCashFlow).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Right Column: Financial Inputs -->
        <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Adjust Financial Assumptions</h3>
          
          <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <!-- Revenue Section -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <h4 class="font-semibold text-gray-700 mb-3">Revenue</h4>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Monthly ${analysisType === 'str' ? 'STR' : 'Rental'} Revenue
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                  <input 
                    type="number" 
                    id="monthlyRevenue"
                    value="${monthlyRevenue}"
                    class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
            
            <!-- Fixed Costs Section -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <h4 class="font-semibold text-gray-700 mb-3">Fixed Costs</h4>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Mortgage Payment
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                    <input 
                      type="number" 
                      id="mortgage"
                      value="${monthlyMortgage}"
                      class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Property Tax
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                      <input 
                        type="number" 
                        id="propertyTax"
                        value="${propertyTax}"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Insurance
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                      <input 
                        type="number" 
                        id="insurance"
                        value="${insurance}"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    HOA/Condo Fees
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                    <input 
                      type="number" 
                      id="hoaFees"
                      value="${hoaFees}"
                      class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Operating Expenses Section -->
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <h4 class="font-semibold text-gray-700 mb-3">Operating Expenses</h4>
              <div class="space-y-3">
                ${analysisType === 'str' ? `
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Property Mgmt (10%)
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                      <input 
                        type="number" 
                        id="propertyMgmt"
                        value="${propertyMgmt}"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Cleaning
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                      <input 
                        type="number" 
                        id="cleaning"
                        value="${cleaning}"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                ` : ''}
                
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Utilities
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                      <input 
                        type="number" 
                        id="utilities"
                        value="${utilities}"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Maintenance
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                      <input 
                        type="number" 
                        id="maintenance"
                        value="${maintenance}"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                ${analysisType === 'str' ? `
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Supplies (4%)
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                      <input 
                        type="number" 
                        id="supplies"
                        value="${supplies}"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Platform Fees (3%)
                    </label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                      <input 
                        type="number" 
                        id="platformFees"
                        value="${platformFees}"
                        class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                ` : ''}
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Other Expenses
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">$</span>
                    <input 
                      type="number" 
                      id="otherExpenses"
                      value="${otherExpenses}"
                      class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Data attributes for chart initialization -->
      <div 
        id="financial-calc-data" 
        data-annual-revenue="${annualRevenue}"
        data-annual-expenses="${annualExpenses}"
        data-analysis-type="${analysisType}"
        style="display: none;"
      ></div>
    </div>
    
    <!-- Custom styles for scrollbar and layout fixes -->
    <style>
      /* Custom scrollbar for financial inputs */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 3px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
      
      /* Ensure proper grid layout on all screens */
      @media (min-width: 1024px) {
        .grid.lg\\:grid-cols-2 {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }
      
      /* Fix canvas container */
      #annual-revenue-chart {
        max-width: 100%;
        height: 100%;
      }
    </style>
  `;
};