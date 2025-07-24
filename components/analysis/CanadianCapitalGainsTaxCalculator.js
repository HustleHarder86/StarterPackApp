/**
 * Canadian Capital Gains Tax Calculator
 * Calculates after-tax profits when selling investment property in Canada
 */

export const CanadianCapitalGainsTaxCalculator = ({ 
  propertyData = {}, 
  purchasePrice = 0,
  currentValue = 0 
}) => {
  // Provincial tax rates for 2024
  const provincialTaxRates = {
    'ON': { name: 'Ontario', rates: [
      { min: 0, max: 51446, rate: 0.0505 },
      { min: 51446, max: 102894, rate: 0.0915 },
      { min: 102894, max: 150000, rate: 0.1116 },
      { min: 150000, max: 220000, rate: 0.1216 },
      { min: 220000, max: Infinity, rate: 0.1316 }
    ]},
    'BC': { name: 'British Columbia', rates: [
      { min: 0, max: 47937, rate: 0.0506 },
      { min: 47937, max: 95875, rate: 0.077 },
      { min: 95875, max: 110076, rate: 0.105 },
      { min: 110076, max: 133664, rate: 0.1229 },
      { min: 133664, max: 181232, rate: 0.147 },
      { min: 181232, max: 252752, rate: 0.168 },
      { min: 252752, max: Infinity, rate: 0.205 }
    ]},
    'AB': { name: 'Alberta', rates: [
      { min: 0, max: 148269, rate: 0.10 },
      { min: 148269, max: 177922, rate: 0.12 },
      { min: 177922, max: 237230, rate: 0.13 },
      { min: 237230, max: 355845, rate: 0.14 },
      { min: 355845, max: Infinity, rate: 0.15 }
    ]},
    'QC': { name: 'Quebec', rates: [
      { min: 0, max: 51780, rate: 0.14 },
      { min: 51780, max: 103545, rate: 0.19 },
      { min: 103545, max: 126000, rate: 0.24 },
      { min: 126000, max: Infinity, rate: 0.2575 }
    ]}
  };

  // Federal tax rates for 2024
  const federalTaxRates = [
    { min: 0, max: 55867, rate: 0.15 },
    { min: 55867, max: 111733, rate: 0.205 },
    { min: 111733, max: 173205, rate: 0.26 },
    { min: 173205, max: 246752, rate: 0.29 },
    { min: 246752, max: Infinity, rate: 0.33 }
  ];

  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
        Canadian Capital Gains Tax Calculator
      </h3>

      <!-- Input Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input type="number" id="purchase-price" value="${purchasePrice}" 
                   class="pl-8 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   onchange="window.calculateCapitalGains()">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Expected Sale Price</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input type="number" id="sale-price" value="${currentValue || purchasePrice * 1.3}" 
                   class="pl-8 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   onchange="window.calculateCapitalGains()">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Province</label>
          <select id="province" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                  onchange="window.calculateCapitalGains()">
            <option value="ON">Ontario</option>
            <option value="BC">British Columbia</option>
            <option value="AB">Alberta</option>
            <option value="QC">Quebec</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Annual Income (for tax bracket)</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input type="number" id="annual-income" value="80000" 
                   class="pl-8 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   onchange="window.calculateCapitalGains()">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Selling Costs (%)</label>
          <input type="number" id="selling-costs" value="7" min="0" max="20" step="0.5"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 onchange="window.calculateCapitalGains()">
          <span class="text-xs text-gray-500 mt-1">Realtor fees, legal, etc.</span>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Years Held</label>
          <input type="number" id="years-held" value="5" min="1" max="30" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 onchange="window.calculateCapitalGains()">
        </div>
      </div>

      <!-- Results Section -->
      <div id="tax-results" class="space-y-4">
        <!-- Results will be populated by JavaScript -->
      </div>

      <!-- Information Box -->
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-900 mb-2">📘 How Capital Gains Tax Works in Canada</h4>
        <ul class="text-sm text-blue-800 space-y-1">
          <li>• 50% of your capital gain is taxable (inclusion rate)</li>
          <li>• The taxable portion is added to your annual income</li>
          <li>• You pay tax at your marginal rate on this amount</li>
          <li>• Principal residence is exempt from capital gains tax</li>
        </ul>
      </div>
    </div>

    <script>
      window.calculateCapitalGains = function() {
        const purchasePrice = parseFloat(document.getElementById('purchase-price').value) || 0;
        const salePrice = parseFloat(document.getElementById('sale-price').value) || 0;
        const province = document.getElementById('province').value;
        const annualIncome = parseFloat(document.getElementById('annual-income').value) || 0;
        const sellingCostsPct = parseFloat(document.getElementById('selling-costs').value) || 7;
        const yearsHeld = parseFloat(document.getElementById('years-held').value) || 5;

        // Calculate gross profit
        const sellingCosts = salePrice * (sellingCostsPct / 100);
        const netSalePrice = salePrice - sellingCosts;
        const capitalGain = netSalePrice - purchasePrice;
        
        // Capital gains inclusion rate (50% in Canada)
        const taxableGain = capitalGain * 0.5;
        
        // Calculate marginal tax rate
        const provincialRates = ${JSON.stringify(provincialTaxRates)};
        const federalRates = ${JSON.stringify(federalTaxRates)};
        
        // Calculate tax on the additional income
        function calculateTax(income, rates) {
          let tax = 0;
          for (const bracket of rates) {
            if (income > bracket.min) {
              const taxableInBracket = Math.min(income - bracket.min, bracket.max - bracket.min);
              tax += taxableInBracket * bracket.rate;
            }
          }
          return tax;
        }

        // Calculate federal and provincial tax
        const baseIncome = annualIncome;
        const incomeWithGain = annualIncome + taxableGain;
        
        const baseFederalTax = calculateTax(baseIncome, federalRates);
        const totalFederalTax = calculateTax(incomeWithGain, federalRates);
        const federalTaxOnGain = totalFederalTax - baseFederalTax;
        
        const provincialRate = provincialRates[province];
        const baseProvincialTax = calculateTax(baseIncome, provincialRate.rates);
        const totalProvincialTax = calculateTax(incomeWithGain, provincialRate.rates);
        const provincialTaxOnGain = totalProvincialTax - baseProvincialTax;
        
        const totalTax = federalTaxOnGain + provincialTaxOnGain;
        const afterTaxProfit = capitalGain - totalTax;
        
        // Calculate annualized return
        const totalReturn = afterTaxProfit / purchasePrice;
        const annualizedReturn = (Math.pow(1 + totalReturn, 1 / yearsHeld) - 1) * 100;

        // Display results
        const resultsHTML = \`
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3">Transaction Summary</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Sale Price:</span>
                  <span class="font-medium">$\${salePrice.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Selling Costs (\${sellingCostsPct}%):</span>
                  <span class="text-red-600">-$\${sellingCosts.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Net Sale Price:</span>
                  <span>$\${netSalePrice.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Purchase Price:</span>
                  <span>-$\${purchasePrice.toLocaleString()}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                  <span class="font-semibold">Capital Gain:</span>
                  <span class="font-semibold \${capitalGain >= 0 ? 'text-green-600' : 'text-red-600'}">
                    $\${capitalGain.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-gray-700 mb-3">Tax Calculation</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Taxable Capital Gain (50%):</span>
                  <span class="font-medium">$\${taxableGain.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Federal Tax:</span>
                  <span class="text-red-600">-$\${Math.round(federalTaxOnGain).toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Provincial Tax (\${provincialRate.name}):</span>
                  <span class="text-red-600">-$\${Math.round(provincialTaxOnGain).toLocaleString()}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                  <span class="font-semibold">Total Tax:</span>
                  <span class="font-semibold text-red-600">-$\${Math.round(totalTax).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 p-4 bg-green-50 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-green-600">$\${afterTaxProfit.toLocaleString()}</div>
                <div class="text-sm text-gray-600">After-Tax Profit</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">\${annualizedReturn.toFixed(1)}%</div>
                <div class="text-sm text-gray-600">Annual Return (After Tax)</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">\${(afterTaxProfit/purchasePrice*100).toFixed(1)}%</div>
                <div class="text-sm text-gray-600">Total ROI (After Tax)</div>
              </div>
            </div>
          </div>
        \`;

        document.getElementById('tax-results').innerHTML = resultsHTML;
      };

      // Calculate on load
      window.calculateCapitalGains();
    </script>
  `;
};