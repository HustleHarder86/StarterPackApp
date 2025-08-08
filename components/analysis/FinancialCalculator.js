/**
 * Financial Calculator Component for STR Analysis
 */

export const FinancialCalculator = ({ strData, ltrData, propertyData }) => {
  const purchasePrice = propertyData?.purchase_price || propertyData?.purchasePrice || propertyData?.price || 849900;
  const monthlyRevenue = strData?.monthly_revenue || strData?.monthlyRevenue || 11044;
  const ltrRent = ltrData?.monthly_rent || ltrData?.monthlyRent || 4000;
  
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-6">Financial Analysis Calculator</h3>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Cash Flow Chart -->
        <div>
          <h4 class="text-sm font-semibold text-gray-700 mb-4">Cash Flow Analysis</h4>
          <div class="relative bg-gray-50 rounded-lg p-4" style="height: 320px;">
            <svg viewBox="0 0 400 280" class="w-full h-full">
              <!-- Grid lines -->
              <line x1="50" y1="30" x2="50" y2="250" stroke="#e5e7eb" stroke-width="1"/>
              <line x1="50" y1="250" x2="350" y2="250" stroke="#e5e7eb" stroke-width="1"/>
              
              <!-- STR Bar -->
              <rect id="strBar" x="120" y="150" width="60" height="100" fill="#9333ea" rx="4"/>
              <text id="strBarValue" x="150" y="140" text-anchor="middle" fill="#9333ea" font-weight="bold">$8,500</text>
              <text x="150" y="270" text-anchor="middle" fill="#6b7280" font-size="12">STR</text>
              
              <!-- LTR Bar -->
              <rect id="ltrBar" x="220" y="200" width="60" height="50" fill="#6b7280" rx="4"/>
              <text id="ltrBarValue" x="250" y="190" text-anchor="middle" fill="#6b7280" font-weight="bold">$1,500</text>
              <text x="250" y="270" text-anchor="middle" fill="#6b7280" font-size="12">LTR</text>
              
              <!-- Y-axis labels -->
              <text x="40" y="35" text-anchor="end" fill="#6b7280" font-size="11">$10k</text>
              <text x="40" y="100" text-anchor="end" fill="#6b7280" font-size="11">$5k</text>
              <text x="40" y="165" text-anchor="end" fill="#6b7280" font-size="11">$0</text>
              <text x="40" y="230" text-anchor="end" fill="#6b7280" font-size="11">-$5k</text>
              
              <!-- Title -->
              <text x="200" y="20" text-anchor="middle" fill="#111827" font-weight="bold" font-size="14">Monthly Net Cash Flow</text>
            </svg>
          </div>
        </div>
        
        <!-- Right Column: Assumptions -->
        <div>
          <h4 class="text-sm font-semibold text-gray-700 mb-4">Financial Assumptions</h4>
          <div class="space-y-4">
            <!-- STR Nightly Rate -->
            <div>
              <label class="text-xs text-gray-600">STR Nightly Rate</label>
              <div class="flex items-center gap-2">
                <input type="range" id="strNightlyRate" min="100" max="600" value="363" class="flex-1"/>
                <span id="strNightlyRateValue" class="text-sm font-semibold w-16 text-right">$363</span>
              </div>
            </div>
            
            <!-- STR Occupancy -->
            <div>
              <label class="text-xs text-gray-600">STR Occupancy Rate</label>
              <div class="flex items-center gap-2">
                <input type="range" id="strOccupancy" min="40" max="95" value="75" class="flex-1"/>
                <span id="strOccupancyValue" class="text-sm font-semibold w-16 text-right">75%</span>
              </div>
            </div>
            
            <!-- Long-term Monthly Rent -->
            <div>
              <label class="text-xs text-gray-600">Long-term Monthly Rent</label>
              <div class="flex items-center gap-2">
                <input type="range" id="ltrRent" min="2000" max="8000" value="${ltrRent}" class="flex-1"/>
                <span id="ltrRentValue" class="text-sm font-semibold w-16 text-right">$${ltrRent.toLocaleString()}</span>
              </div>
            </div>
            
            <!-- Property Management Fee -->
            <div>
              <label class="text-xs text-gray-600">Property Management Fee</label>
              <div class="flex items-center gap-2">
                <input type="range" id="managementFee" min="0" max="30" value="25" class="flex-1"/>
                <span id="managementFeeValue" class="text-sm font-semibold w-16 text-right">25%</span>
              </div>
            </div>
            
            <!-- Down Payment -->
            <div>
              <label class="text-xs text-gray-600">Down Payment</label>
              <div class="flex items-center gap-2">
                <input type="range" id="downPayment" min="5" max="30" value="20" class="flex-1"/>
                <span id="downPaymentValue" class="text-sm font-semibold w-16 text-right">20%</span>
              </div>
            </div>
            
            <!-- Interest Rate -->
            <div>
              <label class="text-xs text-gray-600">Interest Rate</label>
              <div class="flex items-center gap-2">
                <input type="range" id="interestRate" min="3" max="8" value="6.5" step="0.1" class="flex-1"/>
                <span id="interestRateValue" class="text-sm font-semibold w-16 text-right">6.5%</span>
              </div>
            </div>
            
            <!-- Reset Button -->
            <button id="resetFinancialCalc" class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors mt-4">
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
      
      <!-- Summary Metrics -->
      <div class="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600" id="strMonthlyRevenue">$${monthlyRevenue.toLocaleString()}</div>
          <div class="text-xs text-gray-600">STR Revenue/mo</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900" id="ltrMonthlyRevenue">$${ltrRent.toLocaleString()}</div>
          <div class="text-xs text-gray-600">LTR Revenue/mo</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600" id="monthlyAdvantage">+$${(monthlyRevenue - ltrRent).toLocaleString()}</div>
          <div class="text-xs text-gray-600">STR Advantage</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600" id="annualCashFlow">$${((monthlyRevenue - ltrRent) * 12).toLocaleString()}</div>
          <div class="text-xs text-gray-600">Annual Cash Flow</div>
        </div>
      </div>
    </div>
  `;
};

export const financialCalculatorScript = `
  function updateFinancialCalculator() {
    const purchasePrice = ${propertyData?.purchase_price || propertyData?.purchasePrice || 849900};
    
    // Get slider values
    const strNightlyRate = parseFloat(document.getElementById('strNightlyRate').value);
    const strOccupancy = parseFloat(document.getElementById('strOccupancy').value) / 100;
    const ltrRent = parseFloat(document.getElementById('ltrRent').value);
    const managementFee = parseFloat(document.getElementById('managementFee').value) / 100;
    const downPayment = parseFloat(document.getElementById('downPayment').value) / 100;
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100;
    
    // Update display values
    document.getElementById('strNightlyRateValue').textContent = '$' + strNightlyRate;
    document.getElementById('strOccupancyValue').textContent = Math.round(strOccupancy * 100) + '%';
    document.getElementById('ltrRentValue').textContent = '$' + ltrRent.toLocaleString();
    document.getElementById('managementFeeValue').textContent = Math.round(managementFee * 100) + '%';
    document.getElementById('downPaymentValue').textContent = Math.round(downPayment * 100) + '%';
    document.getElementById('interestRateValue').textContent = (interestRate * 100).toFixed(1) + '%';
    
    // Calculate revenues
    const strMonthlyRevenue = strNightlyRate * 30.4 * strOccupancy;
    const strOperatingExpenses = strMonthlyRevenue * managementFee + 500; // $500 base expenses
    
    // Calculate mortgage
    const loanAmount = purchasePrice * (1 - downPayment);
    const monthlyRate = interestRate / 12;
    const numPayments = 30 * 12;
    const mortgagePayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    // Calculate net cash flows
    const strNetCashFlow = strMonthlyRevenue - strOperatingExpenses - mortgagePayment;
    const ltrNetCashFlow = ltrRent - mortgagePayment - 200; // $200 maintenance for LTR
    
    // Update bar chart
    const maxCashFlow = 10000;
    const strBarHeight = Math.max(10, Math.min(170, Math.abs(strNetCashFlow / maxCashFlow) * 170));
    const strBarY = strNetCashFlow >= 0 ? (250 - strBarHeight) : 250;
    
    const ltrBarHeight = Math.max(10, Math.min(170, Math.abs(ltrNetCashFlow / maxCashFlow) * 170));
    const ltrBarY = ltrNetCashFlow >= 0 ? (250 - ltrBarHeight) : 250;
    
    document.getElementById('strBar').setAttribute('height', strBarHeight);
    document.getElementById('strBar').setAttribute('y', strBarY);
    document.getElementById('strBar').setAttribute('fill', strNetCashFlow >= 0 ? '#9333ea' : '#ef4444');
    document.getElementById('strBarValue').textContent = '$' + Math.round(strNetCashFlow).toLocaleString();
    document.getElementById('strBarValue').setAttribute('y', strBarY - 10);
    
    document.getElementById('ltrBar').setAttribute('height', ltrBarHeight);
    document.getElementById('ltrBar').setAttribute('y', ltrBarY);
    document.getElementById('ltrBar').setAttribute('fill', ltrNetCashFlow >= 0 ? '#6b7280' : '#ef4444');
    document.getElementById('ltrBarValue').textContent = '$' + Math.round(ltrNetCashFlow).toLocaleString();
    document.getElementById('ltrBarValue').setAttribute('y', ltrBarY - 10);
    
    // Update summary metrics
    document.getElementById('strMonthlyRevenue').textContent = '$' + Math.round(strMonthlyRevenue).toLocaleString();
    document.getElementById('ltrMonthlyRevenue').textContent = '$' + Math.round(ltrRent).toLocaleString();
    
    const monthlyAdvantage = strNetCashFlow - ltrNetCashFlow;
    const advantageEl = document.getElementById('monthlyAdvantage');
    advantageEl.textContent = (monthlyAdvantage >= 0 ? '+' : '') + '$' + Math.round(Math.abs(monthlyAdvantage)).toLocaleString();
    advantageEl.className = monthlyAdvantage >= 0 ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-red-600';
    
    document.getElementById('annualCashFlow').textContent = '$' + Math.round(monthlyAdvantage * 12).toLocaleString();
  }
  
  // Add event listeners
  document.getElementById('strNightlyRate').addEventListener('input', updateFinancialCalculator);
  document.getElementById('strOccupancy').addEventListener('input', updateFinancialCalculator);
  document.getElementById('ltrRent').addEventListener('input', updateFinancialCalculator);
  document.getElementById('managementFee').addEventListener('input', updateFinancialCalculator);
  document.getElementById('downPayment').addEventListener('input', updateFinancialCalculator);
  document.getElementById('interestRate').addEventListener('input', updateFinancialCalculator);
  
  document.getElementById('resetFinancialCalc').addEventListener('click', function() {
    document.getElementById('strNightlyRate').value = 363;
    document.getElementById('strOccupancy').value = 75;
    document.getElementById('ltrRent').value = 4000;
    document.getElementById('managementFee').value = 25;
    document.getElementById('downPayment').value = 20;
    document.getElementById('interestRate').value = 6.5;
    updateFinancialCalculator();
  });
  
  // Initial update
  updateFinancialCalculator();
`;