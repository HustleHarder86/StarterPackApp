/**
 * Financing Scenarios Comparison
 * Compare different down payment amounts, interest rates, and amortization periods
 */

export const FinancingScenariosComparison = ({ 
  propertyData = {},
  monthlyRevenue = 0,
  monthlyExpenses = 0 
}) => {
  const purchasePrice = propertyData.price || 0;
  
  // Default scenarios
  const defaultScenarios = [
    { id: 1, name: "Conservative", downPaymentPct: 20, rate: 5.5, amortization: 25 },
    { id: 2, name: "Balanced", downPaymentPct: 15, rate: 5.75, amortization: 25 },
    { id: 3, name: "Aggressive", downPaymentPct: 10, rate: 6.0, amortization: 30 }
  ];

  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
        Financing Scenarios Comparison
      </h3>

      <!-- Property Context -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div class="text-gray-600">Property Price</div>
            <div class="font-semibold">${purchasePrice ? `$${purchasePrice.toLocaleString()}` : 'N/A'}</div>
          </div>
          <div>
            <div class="text-gray-600">Monthly Revenue</div>
            <div class="font-semibold">${monthlyRevenue ? `$${monthlyRevenue.toLocaleString()}` : 'N/A'}</div>
          </div>
          <div>
            <div class="text-gray-600">Operating Expenses</div>
            <div class="font-semibold">${monthlyExpenses ? `$${monthlyExpenses.toLocaleString()}` : 'N/A'}</div>
          </div>
          <div>
            <div class="text-gray-600">Before Mortgage</div>
            <div class="font-semibold ${monthlyRevenue - monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}">
              $${(monthlyRevenue - monthlyExpenses).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <!-- Scenario Builder -->
      <div class="mb-6">
        <h4 class="font-semibold mb-3">Build Your Scenarios</h4>
        <div class="space-y-4" id="scenario-inputs">
          ${defaultScenarios.map((scenario, index) => `
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg scenario-row" data-scenario="${scenario.id}">
              <div>
                <label class="text-sm text-gray-600">Scenario Name</label>
                <input type="text" value="${scenario.name}" 
                       class="scenario-name w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                       onchange="window.updateScenarios()">
              </div>
              <div>
                <label class="text-sm text-gray-600">Down Payment %</label>
                <input type="number" value="${scenario.downPaymentPct}" min="5" max="50" step="5"
                       class="down-payment-pct w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                       onchange="window.updateScenarios()">
              </div>
              <div>
                <label class="text-sm text-gray-600">Interest Rate %</label>
                <input type="number" value="${scenario.rate}" min="3" max="10" step="0.25"
                       class="interest-rate w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                       onchange="window.updateScenarios()">
              </div>
              <div>
                <label class="text-sm text-gray-600">Amortization (years)</label>
                <select class="amortization w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        onchange="window.updateScenarios()">
                  <option value="15" ${scenario.amortization === 15 ? 'selected' : ''}>15</option>
                  <option value="20" ${scenario.amortization === 20 ? 'selected' : ''}>20</option>
                  <option value="25" ${scenario.amortization === 25 ? 'selected' : ''}>25</option>
                  <option value="30" ${scenario.amortization === 30 ? 'selected' : ''}>30</option>
                </select>
              </div>
              <div class="flex items-end">
                ${index === 0 ? `
                  <button onclick="window.addScenario()" 
                          class="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                    + Add
                  </button>
                ` : `
                  <button onclick="window.removeScenario(${scenario.id})" 
                          class="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                    Remove
                  </button>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Comparison Results -->
      <div id="comparison-results" class="space-y-6">
        <!-- Results will be populated by JavaScript -->
      </div>

      <!-- Key Insights -->
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-900 mb-2">📊 Understanding the Numbers</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Cash to Close:</strong> Down payment + closing costs (≈2% of purchase price)
          </div>
          <div>
            <strong>Cash Flow:</strong> Monthly revenue - expenses - mortgage payment
          </div>
          <div>
            <strong>Cash-on-Cash Return:</strong> Annual cash flow ÷ initial investment
          </div>
          <div>
            <strong>Total Interest:</strong> Amount paid to the bank over the loan term
          </div>
        </div>
      </div>
    </div>

    <script>
      let scenarioCount = 3;
      
      window.calculateMortgage = function(principal, rate, years) {
        const monthlyRate = rate / 100 / 12;
        const numPayments = years * 12;
        if (monthlyRate === 0) return principal / numPayments;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
      };

      window.updateScenarios = function() {
        const purchasePrice = ${purchasePrice};
        const monthlyRevenue = ${monthlyRevenue};
        const monthlyExpenses = ${monthlyExpenses};
        const closingCosts = purchasePrice * 0.02; // 2% closing costs
        
        const scenarios = [];
        document.querySelectorAll('.scenario-row').forEach(row => {
          const scenario = {
            id: row.dataset.scenario,
            name: row.querySelector('.scenario-name').value,
            downPaymentPct: parseFloat(row.querySelector('.down-payment-pct').value),
            rate: parseFloat(row.querySelector('.interest-rate').value),
            amortization: parseInt(row.querySelector('.amortization').value)
          };
          
          // Calculate metrics
          scenario.downPayment = purchasePrice * (scenario.downPaymentPct / 100);
          scenario.loanAmount = purchasePrice - scenario.downPayment;
          scenario.cashToClose = scenario.downPayment + closingCosts;
          scenario.monthlyPayment = window.calculateMortgage(scenario.loanAmount, scenario.rate, scenario.amortization);
          scenario.monthlyCashFlow = monthlyRevenue - monthlyExpenses - scenario.monthlyPayment;
          scenario.annualCashFlow = scenario.monthlyCashFlow * 12;
          scenario.cashOnCashReturn = (scenario.annualCashFlow / scenario.cashToClose) * 100;
          scenario.totalInterest = (scenario.monthlyPayment * scenario.amortization * 12) - scenario.loanAmount;
          
          scenarios.push(scenario);
        });
        
        // Update comparison display
        const resultsHTML = \`
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-\${scenarios.length} gap-4">
            \${scenarios.map(s => \`
              <div class="border rounded-lg p-4 \${s.cashOnCashReturn === Math.max(...scenarios.map(sc => sc.cashOnCashReturn)) ? 'border-green-500 bg-green-50' : 'border-gray-200'}">
                <h5 class="font-semibold text-lg mb-3">\${s.name}</h5>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Down Payment</span>
                    <span class="font-medium">\${s.downPaymentPct}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Interest Rate</span>
                    <span class="font-medium">\${s.rate}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Term</span>
                    <span class="font-medium">\${s.amortization} years</span>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t space-y-2">
                  <div class="text-center">
                    <div class="text-2xl font-bold \${s.cashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}">
                      \${s.cashOnCashReturn.toFixed(1)}%
                    </div>
                    <div class="text-xs text-gray-600">Cash-on-Cash Return</div>
                  </div>
                </div>
              </div>
            \`).join('')}
          </div>
          
          <!-- Detailed Comparison Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">Metric</th>
                  \${scenarios.map(s => \`<th class="text-right py-2">\${s.name}</th>\`).join('')}
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2">Cash to Close</td>
                  \${scenarios.map(s => \`<td class="text-right py-2 font-medium">$\${s.cashToClose.toLocaleString()}</td>\`).join('')}
                </tr>
                <tr class="border-b">
                  <td class="py-2">Loan Amount</td>
                  \${scenarios.map(s => \`<td class="text-right py-2">$\${s.loanAmount.toLocaleString()}</td>\`).join('')}
                </tr>
                <tr class="border-b">
                  <td class="py-2">Monthly Mortgage</td>
                  \${scenarios.map(s => \`<td class="text-right py-2">$\${Math.round(s.monthlyPayment).toLocaleString()}</td>\`).join('')}
                </tr>
                <tr class="border-b bg-gray-50">
                  <td class="py-2 font-semibold">Monthly Cash Flow</td>
                  \${scenarios.map(s => \`
                    <td class="text-right py-2 font-semibold \${s.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
                      \${s.monthlyCashFlow >= 0 ? '+' : ''}$\${Math.round(s.monthlyCashFlow).toLocaleString()}
                    </td>
                  \`).join('')}
                </tr>
                <tr class="border-b">
                  <td class="py-2">Annual Cash Flow</td>
                  \${scenarios.map(s => \`
                    <td class="text-right py-2 \${s.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
                      \${s.annualCashFlow >= 0 ? '+' : ''}$\${Math.round(s.annualCashFlow).toLocaleString()}
                    </td>
                  \`).join('')}
                </tr>
                <tr class="border-b">
                  <td class="py-2">Total Interest Paid</td>
                  \${scenarios.map(s => \`<td class="text-right py-2 text-red-600">$\${Math.round(s.totalInterest).toLocaleString()}</td>\`).join('')}
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Visual Comparison -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <h5 class="font-semibold mb-3">Monthly Cash Flow Comparison</h5>
              <div class="space-y-2">
                \${scenarios.map(s => \`
                  <div class="flex items-center gap-2">
                    <span class="w-24 text-sm">\${s.name}:</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div class="absolute inset-y-0 left-0 \${s.monthlyCashFlow >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-full"
                           style="width: \${Math.abs(s.monthlyCashFlow) / Math.max(...scenarios.map(sc => Math.abs(sc.monthlyCashFlow))) * 100}%">
                      </div>
                      <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                        $\${Math.round(s.monthlyCashFlow).toLocaleString()}
                      </span>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <h5 class="font-semibold mb-3">Initial Investment Comparison</h5>
              <div class="space-y-2">
                \${scenarios.map(s => \`
                  <div class="flex items-center gap-2">
                    <span class="w-24 text-sm">\${s.name}:</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div class="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                           style="width: \${s.cashToClose / Math.max(...scenarios.map(sc => sc.cashToClose)) * 100}%">
                      </div>
                      <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                        $\${s.cashToClose.toLocaleString()}
                      </span>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </div>
          </div>
          
          <!-- Best Option Summary -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 class="font-semibold text-green-900 mb-2">🏆 Recommended Option</h5>
            \${(() => {
              const bestCashFlow = scenarios.reduce((best, s) => s.monthlyCashFlow > best.monthlyCashFlow ? s : best);
              const bestReturn = scenarios.reduce((best, s) => s.cashOnCashReturn > best.cashOnCashReturn ? s : best);
              const lowestCash = scenarios.reduce((best, s) => s.cashToClose < best.cashToClose ? s : best);
              
              if (bestReturn.id === bestCashFlow.id) {
                return \`
                  <p class="text-green-800">
                    <strong>\${bestReturn.name}</strong> offers the best overall performance with the highest 
                    cash-on-cash return (\${bestReturn.cashOnCashReturn.toFixed(1)}%) and monthly cash flow 
                    ($\${Math.round(bestReturn.monthlyCashFlow).toLocaleString()}).
                  </p>
                \`;
              } else {
                return \`
                  <p class="text-green-800">
                    It depends on your priorities:
                    <br>• <strong>Best Returns:</strong> \${bestReturn.name} (\${bestReturn.cashOnCashReturn.toFixed(1)}% cash-on-cash)
                    <br>• <strong>Best Cash Flow:</strong> \${bestCashFlow.name} ($\${Math.round(bestCashFlow.monthlyCashFlow).toLocaleString()}/month)
                    <br>• <strong>Lowest Investment:</strong> \${lowestCash.name} ($\${lowestCash.cashToClose.toLocaleString()})
                  </p>
                \`;
              }
            })()}
          </div>
        \`;
        
        document.getElementById('comparison-results').innerHTML = resultsHTML;
      };

      window.addScenario = function() {
        scenarioCount++;
        const newScenario = \`
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg scenario-row" data-scenario="\${scenarioCount}">
            <div>
              <label class="text-sm text-gray-600">Scenario Name</label>
              <input type="text" value="Custom \${scenarioCount - 3}" 
                     class="scenario-name w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                     onchange="window.updateScenarios()">
            </div>
            <div>
              <label class="text-sm text-gray-600">Down Payment %</label>
              <input type="number" value="20" min="5" max="50" step="5"
                     class="down-payment-pct w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                     onchange="window.updateScenarios()">
            </div>
            <div>
              <label class="text-sm text-gray-600">Interest Rate %</label>
              <input type="number" value="5.5" min="3" max="10" step="0.25"
                     class="interest-rate w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                     onchange="window.updateScenarios()">
            </div>
            <div>
              <label class="text-sm text-gray-600">Amortization (years)</label>
              <select class="amortization w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      onchange="window.updateScenarios()">
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="25" selected>25</option>
                <option value="30">30</option>
              </select>
            </div>
            <div class="flex items-end">
              <button onclick="window.removeScenario(\${scenarioCount})" 
                      class="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                Remove
              </button>
            </div>
          </div>
        \`;
        document.getElementById('scenario-inputs').insertAdjacentHTML('beforeend', newScenario);
        window.updateScenarios();
      };

      window.removeScenario = function(id) {
        document.querySelector(\`[data-scenario="\${id}"]\`).remove();
        window.updateScenarios();
      };

      // Initialize on load
      window.updateScenarios();
    </script>
  `;
};