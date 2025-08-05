/**
 * STR Cash Flow Card Component
 * Shows positive cash flow summary for Short-Term Rentals
 */

export const STRCashFlowCard = ({ 
  monthlyRevenue = 0, 
  totalExpenses = 0,
  mortgagePayment = 0,
  operatingExpenses = 0 
}) => {
  const netCashFlow = monthlyRevenue - totalExpenses;
  const isPositive = netCashFlow > 0;
  
  return `
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Positive STR Cash Flow
        </h3>
        ${isPositive ? `
          <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Cash Flow Positive
          </span>
        ` : `
          <span class="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            Negative Cash Flow
          </span>
        `}
      </div>
      
      <div class="space-y-3">
        <!-- Monthly Revenue -->
        <div class="flex justify-between items-center py-2">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span class="text-gray-700 font-medium">Monthly Revenue</span>
          </div>
          <span class="text-xl font-bold text-green-600">+$${monthlyRevenue.toLocaleString()}</span>
        </div>
        
        <!-- Total Expenses -->
        <div class="border-t pt-3">
          <div class="flex justify-between items-center py-2">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <span class="text-gray-700 font-medium">Total Expenses</span>
            </div>
            <span class="text-xl font-bold text-red-600">-$${totalExpenses.toLocaleString()}</span>
          </div>
          
          <!-- Expense Breakdown -->
          <div class="ml-4 mt-2 space-y-1 text-sm">
            <div class="flex justify-between text-gray-600">
              <span class="ml-4">Mortgage Payment</span>
              <span>$${mortgagePayment.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span class="ml-4">Operating Expenses</span>
              <span>$${operatingExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <!-- Net Cash Flow -->
        <div class="border-t pt-3">
          <div class="flex justify-between items-center">
            <span class="text-lg font-bold text-gray-900">Net Cash Flow</span>
            <span class="text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}">
              ${isPositive ? '+' : ''}$${Math.abs(netCashFlow).toLocaleString()}
            </span>
          </div>
          <p class="text-sm text-gray-600 mt-1">
            ${isPositive 
              ? 'Monthly profit after all expenses' 
              : 'Monthly shortfall - consider adjusting rates or reducing expenses'
            }
          </p>
        </div>
      </div>
      
      <!-- Visual Indicator -->
      <div class="mt-4 relative">
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            class="h-full ${isPositive ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'}" 
            style="width: ${Math.min(100, Math.abs(netCashFlow / monthlyRevenue * 100))}%"
          ></div>
        </div>
        <p class="text-xs text-gray-500 mt-1 text-center">
          ${isPositive 
            ? `${((netCashFlow / monthlyRevenue) * 100).toFixed(0)}% profit margin` 
            : `${Math.abs((netCashFlow / monthlyRevenue) * 100).toFixed(0)}% loss`
          }
        </p>
      </div>
    </div>
  `;
};

// Export for global use
window.STRCashFlowCard = STRCashFlowCard;