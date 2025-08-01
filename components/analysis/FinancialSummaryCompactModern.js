/**
 * Financial Summary Component - Compact Modern Design
 * Financial overview with progress bars and gradient accents
 */

(function() {
  window.FinancialSummaryCompactModern = function({ 
  monthlyRevenue = 6800,
  totalExpenses = 3550,
  netCashFlow = 3250,
  mortgage = 2100,
  propertyTax = 680,
  insurance = 180,
  management = 340,
  maintenance = 250,
  cashOnCashReturn = 12.1,
  debtServiceCoverage = 1.75,
  grossRentMultiplier = 10.2
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const revenuePercentage = 100;
  const expensesPercentage = (totalExpenses / monthlyRevenue * 100).toFixed(0);
  const cashFlowPercentage = (netCashFlow / monthlyRevenue * 100).toFixed(0);

  return `
    <div class="col-span-8 space-y-6">
      <!-- Financial Overview Card -->
      <div class="bg-white rounded-xl shadow-sm gradient-border p-6">
        <h3 class="text-lg font-semibold mb-4">Financial Overview</h3>
        
        <div class="grid grid-cols-2 gap-6">
          <!-- Cash Flow Analysis -->
          <div>
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-gray-600">Monthly Revenue</span>
                <span class="font-semibold">${formatCurrency(monthlyRevenue)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill progress-green" style="width: ${revenuePercentage}%"></div>
              </div>
            </div>
            
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-gray-600">Operating Expenses</span>
                <span class="font-semibold">${formatCurrency(totalExpenses)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill progress-red" style="width: ${expensesPercentage}%"></div>
              </div>
            </div>
            
            <div>
              <div class="flex justify-between text-sm mb-2">
                <span class="font-semibold text-gray-900">Net Cash Flow</span>
                <span class="font-bold text-green-600">${formatCurrency(netCashFlow)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill progress-indigo" style="width: ${cashFlowPercentage}%"></div>
              </div>
            </div>
          </div>
          
          <!-- Key Metrics -->
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
            <h4 class="font-semibold mb-3">Key Metrics</h4>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Cash-on-Cash Return</span>
                <span class="text-sm font-bold text-indigo-600">${cashOnCashReturn}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Debt Service Coverage</span>
                <span class="text-sm font-bold text-green-600">${debtServiceCoverage}x</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Gross Rent Multiplier</span>
                <span class="text-sm font-bold text-purple-600">${grossRentMultiplier}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Breakdown -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">Monthly Expense Breakdown</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Mortgage Payment</span>
              <span class="text-sm font-semibold text-red-600">${formatCurrency(mortgage)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Property Tax</span>
              <span class="text-sm font-semibold text-red-600">${formatCurrency(propertyTax)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Insurance</span>
              <span class="text-sm font-semibold text-red-600">${formatCurrency(insurance)}</span>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Property Management</span>
              <span class="text-sm font-semibold text-red-600">${formatCurrency(management)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Maintenance Reserve</span>
              <span class="text-sm font-semibold text-red-600">${formatCurrency(maintenance)}</span>
            </div>
            <div class="flex justify-between items-center border-t pt-3">
              <span class="text-sm font-semibold">Total Expenses</span>
              <span class="text-sm font-bold text-red-600">${formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>
        
        <!-- Visual Expense Distribution -->
        <div class="mt-6">
          <div class="flex space-x-1 h-8 rounded-lg overflow-hidden">
            <div class="bg-blue-600 hover:bg-blue-700 transition-colors" style="width: ${(mortgage/totalExpenses*100).toFixed(0)}%" title="Mortgage: ${formatCurrency(mortgage)}"></div>
            <div class="bg-green-600 hover:bg-green-700 transition-colors" style="width: ${(propertyTax/totalExpenses*100).toFixed(0)}%" title="Tax: ${formatCurrency(propertyTax)}"></div>
            <div class="bg-purple-600 hover:bg-purple-700 transition-colors" style="width: ${(insurance/totalExpenses*100).toFixed(0)}%" title="Insurance: ${formatCurrency(insurance)}"></div>
            <div class="bg-orange-600 hover:bg-orange-700 transition-colors" style="width: ${(management/totalExpenses*100).toFixed(0)}%" title="Management: ${formatCurrency(management)}"></div>
            <div class="bg-yellow-600 hover:bg-yellow-700 transition-colors" style="width: ${(maintenance/totalExpenses*100).toFixed(0)}%" title="Maintenance: ${formatCurrency(maintenance)}"></div>
          </div>
          <div class="flex justify-between mt-2">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-blue-600 rounded mr-1"></div>
              <span class="text-xs text-gray-600">Mortgage</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-600 rounded mr-1"></div>
              <span class="text-xs text-gray-600">Tax</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-purple-600 rounded mr-1"></div>
              <span class="text-xs text-gray-600">Insurance</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-orange-600 rounded mr-1"></div>
              <span class="text-xs text-gray-600">Mgmt</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-yellow-600 rounded mr-1"></div>
              <span class="text-xs text-gray-600">Maint</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  };
})();