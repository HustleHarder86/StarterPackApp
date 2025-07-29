/**
 * Enhanced Financial Calculator Component
 * Modern 2-column layout with interactive annual revenue chart
 */

// Helper function to safely format currency
const safeFormatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return Math.round(num).toLocaleString();
};

export const EnhancedFinancialCalculator = ({ analysisData = {} }) => {
  // Extract property and financial data
  const propertyData = analysisData.propertyData || {};
  const costs = analysisData.costs || {};
  const monthlyExpenses = analysisData.monthly_expenses || analysisData.monthlyExpenses || {};
  const ltrData = analysisData.longTermRental || analysisData.long_term_rental || {};
  const strData = analysisData.strAnalysis || analysisData.short_term_rental || {};
  
  // Debug logging to trace mortgage value
  console.log('[Financial Calculator] Data sources:', {
    'monthlyExpenses': monthlyExpenses,
    'monthlyExpenses.mortgage': monthlyExpenses.mortgage,
    'costs': costs,
    'costs.mortgage': costs.mortgage,
    'analysisData': analysisData
  });
  
  // Determine which revenue to use based on analysis type
  const analysisType = analysisData.analysisType || 'both';
  const monthlyRevenue = analysisType === 'ltr' 
    ? (ltrData.monthlyRent || ltrData.monthly_rent || 3100)
    : (strData.monthlyRevenue || strData.monthly_revenue || 5400);
  
  // Extract expense values with proper fallbacks - check monthly_expenses first
  const monthlyMortgage = monthlyExpenses.mortgage || costs.mortgage || costs.mortgagePayment || 0;
  const propertyTax = monthlyExpenses.property_tax || Math.round((propertyData.propertyTaxes || propertyData.property_taxes || costs.property_tax_annual || 6350) / 12);
  const insurance = monthlyExpenses.insurance || costs.insurance || 132;
  const hoaFees = propertyData.condoFees || propertyData.condo_fees || monthlyExpenses.hoa || 536;
  const utilities = monthlyExpenses.utilities || costs.utilities || 150;
  const maintenance = monthlyExpenses.maintenance || costs.maintenance || 265;
  
  // Debug final values
  console.log('[Financial Calculator] Calculated values:', {
    'monthlyMortgage': monthlyMortgage,
    'propertyTax': propertyTax,
    'insurance': insurance,
    'hoaFees': hoaFees,
    'utilities': utilities,
    'maintenance': maintenance
  });
  
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
    
    <!-- Assumptions & Calculation Details (Collapsible) -->
    <div class="mt-6">
      <!-- Collapsible Header -->
      <button 
        data-toggle="assumptions"
        aria-expanded="false"
        aria-controls="assumptions-content"
        class="w-full bg-blue-50 rounded-lg p-4 border border-blue-200 hover:bg-blue-100 transition-colors duration-200 group"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold text-blue-900 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            View Financial Assumptions & Calculator Details
          </h3>
          <svg data-chevron="assumptions" class="w-5 h-5 text-blue-600 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>
      
      <!-- Collapsible Content -->
      <div data-content="assumptions" class="hidden transition-all duration-300 ease-in-out">
        <div class="bg-blue-50 rounded-b-lg px-4 pb-4 -mt-1 border border-t-0 border-blue-200">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
        <!-- Mortgage Assumptions -->
        <div class="space-y-2">
          <h4 class="font-semibold text-blue-900">Mortgage Payment</h4>
          <ul class="space-y-1.5 ml-4 text-sm">
            <li>• Down Payment: 20% of property price</li>
            <li>• Interest Rate: 5.5% (current market rate)</li>
            <li>• Amortization: 25 years</li>
            <li>• ${monthlyMortgage > 0 ? `Loan Amount: $${((propertyData.price || 850000) * 0.8).toLocaleString()}` : 'Currently set to $0 (cash purchase)'}</li>
          </ul>
        </div>
        
        <!-- Property Tax & Insurance -->
        <div class="space-y-2">
          <h4 class="font-semibold text-blue-900">Fixed Costs (Actual vs Calculated)</h4>
          <ul class="space-y-1.5 ml-4 text-sm">
            <li>• Property Tax: <span class="font-medium text-green-700">ACTUAL from Realtor.ca</span> ${propertyData.propertyTaxes ? `($${safeFormatCurrency(propertyData.propertyTaxes)}/year)` : ''}</li>
            <li>• HOA/Condo Fees: ${hoaFees > 0 ? `<span class="font-medium text-green-700">ACTUAL from Realtor.ca</span> ($${hoaFees}/month)` : '<span class="font-medium text-gray-600">Not applicable</span>'}</li>
            <li>• Insurance: <span class="font-medium text-amber-700">CALCULATED</span> (STR rate, 25% higher than standard)</li>
            <li>• Utilities: <span class="font-medium text-amber-700">CALCULATED</span> (Higher for STR usage)</li>
          </ul>
        </div>
        
        <!-- STR Operating Expenses -->
        <div class="space-y-2">
          <h4 class="font-semibold text-blue-900">STR Operating Expenses</h4>
          <ul class="space-y-1.5 ml-4 text-sm">
            <li>• Property Management: <span class="font-medium text-amber-700">CALCULATED</span> at 10% of revenue</li>
            <li>• Cleaning: <span class="font-medium text-amber-700">CALCULATED</span> based on turnovers & property size</li>
            <li>• Platform Fees: <span class="font-medium text-amber-700">CALCULATED</span> at 3% (Airbnb/VRBO)</li>
            <li>• Supplies: <span class="font-medium text-amber-700">CALCULATED</span> at 4% of revenue</li>
            <li>• Maintenance: <span class="font-medium text-amber-700">CALCULATED</span> at 1.5% of property value/year</li>
          </ul>
        </div>
        
        <!-- Customization Note -->
        <div class="space-y-2">
          <h4 class="font-semibold text-blue-900">Customize Your Analysis</h4>
          <ul class="space-y-1.5 ml-4 text-sm">
            <li>• All values above are adjustable</li>
            <li>• Changes recalculate automatically</li>
            <li>• For detailed mortgage options, see Investment tab</li>
            <li>• Reset button restores defaults</li>
          </ul>
        </div>
      </div>
      
          <div class="mt-3 pt-3 border-t border-blue-200">
            <p class="text-sm text-blue-700 italic">
              💡 Tip: These are standard assumptions. Adjust values based on your specific situation for more accurate projections.
            </p>
          </div>
          
          <!-- Friendly Disclaimer -->
          <div class="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-200">
            <h4 class="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Important Things to Know
            </h4>
            <div class="text-sm text-amber-800 space-y-1">
              <p>📋 <strong>Regulations:</strong> STR rules vary by city and change often. Always check your local bylaws and licensing requirements before starting.</p>
              <p>📊 <strong>Estimates:</strong> These projections are based on current market data but actual results will vary. Many factors affect your success!</p>
              <p>🎯 <strong>No Guarantees:</strong> Income depends on your property appeal, management quality, pricing strategy, and market conditions.</p>
              <p>👨‍💼 <strong>Get Advice:</strong> Consider consulting with local STR operators, property managers, and tax professionals for personalized guidance.</p>
              <p>📈 <strong>Market Risks:</strong> Competition, seasonality, economic changes, and platform policies can all impact your returns.</p>
            </div>
          </div>
        </div>
      </div>
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