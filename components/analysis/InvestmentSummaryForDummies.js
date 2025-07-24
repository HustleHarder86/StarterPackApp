/**
 * Investment Summary for Dummies
 * Simple one-page summary showing ROI in plain language
 */

export const InvestmentSummaryForDummies = ({ 
  propertyData = {},
  strAnalysis = {},
  ltrAnalysis = {},
  financialAssumptions = {}
}) => {
  // Calculate key metrics
  const purchasePrice = propertyData.price || 0;
  const downPayment = purchasePrice * 0.20; // 20% down
  const monthlySTR = strAnalysis.monthlyRevenue || 0;
  const monthlyLTR = ltrAnalysis.monthlyRent || 0;
  const monthlyRevenue = Math.max(monthlySTR, monthlyLTR);
  const isSTR = monthlySTR > monthlyLTR;
  
  // Monthly expenses
  const propertyTax = (propertyData.propertyTaxes || 0) / 12;
  const condoFees = propertyData.condoFees || 0;
  const insurance = 150; // Estimate
  const utilities = isSTR ? 200 : 0; // STR pays utilities
  const maintenance = monthlyRevenue * 0.05;
  const management = monthlyRevenue * (isSTR ? 0.10 : 0.08);
  const vacancy = monthlyRevenue * (isSTR ? 0 : 0.05); // 5% vacancy for LTR
  
  // Mortgage calculation (simplified)
  const loanAmount = purchasePrice - downPayment;
  const monthlyRate = 0.055 / 12; // 5.5% annual
  const numPayments = 25 * 12; // 25 years
  const monthlyMortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  const totalExpenses = propertyTax + condoFees + insurance + utilities + maintenance + management + vacancy + monthlyMortgage;
  const monthlyCashFlow = monthlyRevenue - totalExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  
  // 5-year projection
  const appreciation = 0.04; // 4% annual
  const futureValue5 = purchasePrice * Math.pow(1 + appreciation, 5);
  const equity5 = futureValue5 - (loanAmount * 0.85); // Rough mortgage balance after 5 years
  const totalCashFlow5 = annualCashFlow * 5;
  const totalReturn5 = equity5 - downPayment + totalCashFlow5;
  const roi5 = (totalReturn5 / downPayment) * 100;
  
  // 10-year projection
  const futureValue10 = purchasePrice * Math.pow(1 + appreciation, 10);
  const equity10 = futureValue10 - (loanAmount * 0.65); // Rough mortgage balance after 10 years
  const totalCashFlow10 = annualCashFlow * 10;
  const totalReturn10 = equity10 - downPayment + totalCashFlow10;
  const roi10 = (totalReturn10 / downPayment) * 100;

  // Break-even calculation
  const breakEvenMonths = monthlyCashFlow > 0 ? 0 : Math.abs(downPayment / monthlyCashFlow);
  const breakEvenYears = breakEvenMonths / 12;

  return `
    <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">🎯 Your Investment in Simple Terms</h2>
          <p class="text-gray-600">No complex jargon - just the facts about your money</p>
        </div>

        <!-- The Big Picture -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            <span class="text-2xl">💰</span> The Bottom Line
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <div class="text-sm text-gray-600 mb-1">You Invest</div>
              <div class="text-2xl font-bold text-green-600">$${downPayment.toLocaleString()}</div>
              <div class="text-xs text-gray-500">Down Payment</div>
            </div>
            
            <div class="text-center p-4 bg-blue-50 rounded-lg">
              <div class="text-sm text-gray-600 mb-1">Monthly Cash Flow</div>
              <div class="text-2xl font-bold ${monthlyCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}">
                ${monthlyCashFlow >= 0 ? '+' : ''}$${Math.round(monthlyCashFlow).toLocaleString()}
              </div>
              <div class="text-xs text-gray-500">After All Expenses</div>
            </div>
            
            <div class="text-center p-4 bg-purple-50 rounded-lg">
              <div class="text-sm text-gray-600 mb-1">Rental Strategy</div>
              <div class="text-2xl font-bold text-purple-600">${isSTR ? 'Airbnb' : 'Long-Term'}</div>
              <div class="text-xs text-gray-500">Best Option</div>
            </div>
          </div>

          <!-- Simple Explanation -->
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-gray-700">
              <span class="font-semibold">Here's what this means:</span> You put down 
              <span class="font-semibold text-green-600">$${downPayment.toLocaleString()}</span> today. 
              ${monthlyCashFlow >= 0 
                ? `Every month, after paying the mortgage and all expenses, you'll have 
                   <span class="font-semibold text-blue-600">$${Math.round(monthlyCashFlow).toLocaleString()}</span> 
                   extra in your pocket.`
                : `Each month, you'll need to add 
                   <span class="font-semibold text-red-600">$${Math.abs(Math.round(monthlyCashFlow)).toLocaleString()}</span> 
                   to cover all expenses, but you're building equity!`
              }
            </p>
          </div>
        </div>

        <!-- Timeline Visualization -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            <span class="text-2xl">📈</span> Your Money Over Time
          </h3>
          
          <div class="space-y-6">
            <!-- Today -->
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-20 text-right">
                <div class="font-bold text-gray-700">Today</div>
              </div>
              <div class="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
              <div class="flex-grow">
                <div class="bg-blue-50 rounded-lg p-3">
                  <div class="font-semibold">You invest: $${downPayment.toLocaleString()}</div>
                  <div class="text-sm text-gray-600">20% down payment on $${purchasePrice.toLocaleString()} property</div>
                </div>
              </div>
            </div>

            <!-- 5 Years -->
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-20 text-right">
                <div class="font-bold text-gray-700">5 Years</div>
              </div>
              <div class="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full mt-1"></div>
              <div class="flex-grow">
                <div class="bg-green-50 rounded-lg p-3">
                  <div class="font-semibold">Your total return: $${Math.round(totalReturn5).toLocaleString()}</div>
                  <div class="text-sm text-gray-600">
                    That's a <span class="font-semibold text-green-600">${roi5.toFixed(0)}% return</span> on your investment!
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    (Property value: $${Math.round(futureValue5).toLocaleString()} + 
                    Cash flow: $${Math.round(totalCashFlow5).toLocaleString()})
                  </div>
                </div>
              </div>
            </div>

            <!-- 10 Years -->
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-20 text-right">
                <div class="font-bold text-gray-700">10 Years</div>
              </div>
              <div class="flex-shrink-0 w-4 h-4 bg-purple-500 rounded-full mt-1"></div>
              <div class="flex-grow">
                <div class="bg-purple-50 rounded-lg p-3">
                  <div class="font-semibold">Your total return: $${Math.round(totalReturn10).toLocaleString()}</div>
                  <div class="text-sm text-gray-600">
                    That's a <span class="font-semibold text-purple-600">${roi10.toFixed(0)}% return</span> on your investment!
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    (Property value: $${Math.round(futureValue10).toLocaleString()} + 
                    Cash flow: $${Math.round(totalCashFlow10).toLocaleString()})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly Breakdown -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            <span class="text-2xl">🧮</span> Where Your Money Goes Each Month
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-semibold text-green-600 mb-3">Money Coming In</h4>
              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b">
                  <span>${isSTR ? 'Airbnb Income' : 'Rent'}</span>
                  <span class="font-semibold">$${monthlyRevenue.toLocaleString()}</span>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t flex justify-between">
                <span class="font-semibold">Total Income</span>
                <span class="font-bold text-green-600">$${monthlyRevenue.toLocaleString()}</span>
              </div>
            </div>
            
            <div>
              <h4 class="font-semibold text-red-600 mb-3">Money Going Out</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Mortgage Payment</span>
                  <span>$${Math.round(monthlyMortgage).toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Property Tax</span>
                  <span>$${Math.round(propertyTax).toLocaleString()}</span>
                </div>
                ${condoFees > 0 ? `
                <div class="flex justify-between">
                  <span>Condo Fees</span>
                  <span>$${Math.round(condoFees).toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="flex justify-between">
                  <span>Insurance</span>
                  <span>$${Math.round(insurance).toLocaleString()}</span>
                </div>
                ${utilities > 0 ? `
                <div class="flex justify-between">
                  <span>Utilities</span>
                  <span>$${Math.round(utilities).toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="flex justify-between">
                  <span>Property Management</span>
                  <span>$${Math.round(management).toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Maintenance</span>
                  <span>$${Math.round(maintenance).toLocaleString()}</span>
                </div>
                ${vacancy > 0 ? `
                <div class="flex justify-between">
                  <span>Vacancy Allowance</span>
                  <span>$${Math.round(vacancy).toLocaleString()}</span>
                </div>
                ` : ''}
              </div>
              <div class="mt-3 pt-3 border-t flex justify-between">
                <span class="font-semibold">Total Expenses</span>
                <span class="font-bold text-red-600">$${Math.round(totalExpenses).toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div class="mt-6 p-4 ${monthlyCashFlow >= 0 ? 'bg-green-50' : 'bg-yellow-50'} rounded-lg text-center">
            <div class="text-lg font-semibold ${monthlyCashFlow >= 0 ? 'text-green-700' : 'text-yellow-700'}">
              Monthly Profit: ${monthlyCashFlow >= 0 ? '+' : ''}$${Math.round(monthlyCashFlow).toLocaleString()}
            </div>
            <div class="text-sm ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-yellow-600'}">
              ${monthlyCashFlow >= 0 
                ? "You're making money every month!" 
                : "You're building equity while covering some costs"}
            </div>
          </div>
        </div>

        <!-- Risk vs Reward -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            <span class="text-2xl">⚖️</span> Is This a Good Investment?
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-green-50 rounded-lg p-4">
              <h4 class="font-semibold text-green-700 mb-2">✅ The Good</h4>
              <ul class="space-y-1 text-sm text-green-600">
                <li>• ${roi5 > 50 ? 'Excellent' : roi5 > 25 ? 'Good' : 'Decent'} 5-year return of ${roi5.toFixed(0)}%</li>
                <li>• ${monthlyCashFlow > 0 ? 'Positive cash flow from day one' : 'Building equity every month'}</li>
                <li>• Property appreciation adds to your wealth</li>
                <li>• ${isSTR ? 'High income potential with Airbnb' : 'Stable long-term rental income'}</li>
              </ul>
            </div>
            
            <div class="bg-yellow-50 rounded-lg p-4">
              <h4 class="font-semibold text-yellow-700 mb-2">⚠️ Things to Consider</h4>
              <ul class="space-y-1 text-sm text-yellow-600">
                <li>• Need $${downPayment.toLocaleString()} upfront</li>
                <li>• ${isSTR ? 'More work managing Airbnb guests' : 'Finding good tenants is crucial'}</li>
                <li>• Property values can go down too</li>
                <li>• Unexpected repairs can happen</li>
              </ul>
            </div>
          </div>
          
          <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <div class="flex items-start gap-3">
              <span class="text-2xl">💡</span>
              <div>
                <div class="font-semibold text-blue-900 mb-1">Our Recommendation</div>
                <p class="text-sm text-blue-700">
                  ${roi5 > 50 
                    ? "This is a strong investment opportunity! The returns significantly outweigh the risks."
                    : roi5 > 25
                    ? "This is a solid investment that should meet your financial goals."
                    : monthlyCashFlow > 0
                    ? "This property offers steady returns with manageable risk."
                    : "While cash flow is negative initially, you're building long-term wealth through equity."
                  }
                  ${breakEvenYears > 0 && breakEvenYears < 10 
                    ? ` You'll break even in about ${breakEvenYears.toFixed(1)} years.` 
                    : ''
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};