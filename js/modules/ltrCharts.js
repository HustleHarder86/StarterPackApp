// Long Term Rental Charts Module
// Enhanced visualizations for rental analysis

export function createRentalComparisonChart(analysisData) {
  const marketRent = analysisData.longTermRental?.monthlyRent || 0;
  const avgRent = marketRent * 0.95; // Slightly below for competitive pricing
  const highRent = marketRent * 1.1;
  const lowRent = marketRent * 0.85;
  
  return `
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="text-2xl">📊</span>
        Rental Market Comparison
      </h3>
      
      <div class="relative h-64">
        <div class="absolute inset-0 flex items-end justify-around pb-8">
          <!-- Low Rent Bar -->
          <div class="relative w-20 group">
            <div class="absolute bottom-0 w-full bg-gradient-to-t from-red-400 to-red-300 rounded-t-lg transition-all duration-300 hover:from-red-500 hover:to-red-400"
                 style="height: ${(lowRent / highRent) * 100}%">
              <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                $${lowRent.toLocaleString()}
              </div>
            </div>
            <div class="absolute -bottom-6 w-full text-center text-xs text-gray-600">Low</div>
          </div>
          
          <!-- Average Rent Bar -->
          <div class="relative w-20 group">
            <div class="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-blue-300 rounded-t-lg transition-all duration-300 hover:from-blue-500 hover:to-blue-400"
                 style="height: ${(avgRent / highRent) * 100}%">
              <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                $${avgRent.toLocaleString()}
              </div>
            </div>
            <div class="absolute -bottom-6 w-full text-center text-xs text-gray-600">Average</div>
          </div>
          
          <!-- Your Rent Bar (Highlighted) -->
          <div class="relative w-20 group">
            <div class="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-600 hover:to-green-500 shadow-lg"
                 style="height: ${(marketRent / highRent) * 100}%">
              <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                $${marketRent.toLocaleString()}
              </div>
              <div class="absolute top-2 left-1/2 transform -translate-x-1/2 text-white font-bold text-sm">
                YOU
              </div>
            </div>
            <div class="absolute -bottom-6 w-full text-center text-xs font-semibold text-green-600">Your Rate</div>
          </div>
          
          <!-- High Rent Bar -->
          <div class="relative w-20 group">
            <div class="absolute bottom-0 w-full bg-gradient-to-t from-purple-400 to-purple-300 rounded-t-lg transition-all duration-300 hover:from-purple-500 hover:to-purple-400"
                 style="height: 100%">
              <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                $${highRent.toLocaleString()}
              </div>
            </div>
            <div class="absolute -bottom-6 w-full text-center text-xs text-gray-600">High</div>
          </div>
        </div>
        
        <!-- Y-Axis Labels -->
        <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>$${Math.round(highRent).toLocaleString()}</span>
          <span>$${Math.round(highRent * 0.75).toLocaleString()}</span>
          <span>$${Math.round(highRent * 0.5).toLocaleString()}</span>
          <span>$${Math.round(highRent * 0.25).toLocaleString()}</span>
          <span>$0</span>
        </div>
      </div>
      
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          <strong>Market Position:</strong> Your rental rate of <span class="font-semibold">${marketRent.toLocaleString()}/month</span> 
          is competitive and ${marketRent > avgRent ? 'above' : 'at'} market average, 
          positioning you well for ${marketRent > avgRent ? 'premium tenants' : 'quick tenant acquisition'}.
        </p>
      </div>
    </div>
  `;
}

export function createExpenseBreakdownChart(costs) {
  const expenses = [
    { name: 'Mortgage', value: costs.mortgagePayment || 0, color: 'from-blue-500 to-blue-400' },
    { name: 'Property Tax', value: (costs.propertyTax || 0) / 12, color: 'from-green-500 to-green-400' },
    { name: 'Insurance', value: (costs.insurance || 0) / 12, color: 'from-purple-500 to-purple-400' },
    { name: 'Maintenance', value: costs.maintenance || 0, color: 'from-orange-500 to-orange-400' },
    { name: 'Property Mgmt', value: costs.propertyManagement || 0, color: 'from-pink-500 to-pink-400' },
    { name: 'HOA/Condo', value: costs.condoFees || 0, color: 'from-yellow-500 to-yellow-400' }
  ].filter(e => e.value > 0);
  
  const total = expenses.reduce((sum, e) => sum + e.value, 0);
  
  // Calculate angles for donut chart
  let currentAngle = -90; // Start at top
  const chartData = expenses.map(expense => {
    const percentage = (expense.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...expense, percentage, startAngle, endAngle: currentAngle };
  });
  
  return `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="text-2xl">💰</span>
        Monthly Expense Breakdown
      </h3>
      
      <div class="flex flex-col lg:flex-row items-center gap-6">
        <!-- Donut Chart -->
        <div class="relative w-48 h-48">
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            ${chartData.map((expense, index) => {
              const radius = 40;
              const innerRadius = 25;
              const startAngleRad = (expense.startAngle * Math.PI) / 180;
              const endAngleRad = (expense.endAngle * Math.PI) / 180;
              
              const x1 = 50 + radius * Math.cos(startAngleRad);
              const y1 = 50 + radius * Math.sin(startAngleRad);
              const x2 = 50 + radius * Math.cos(endAngleRad);
              const y2 = 50 + radius * Math.sin(endAngleRad);
              
              const x3 = 50 + innerRadius * Math.cos(startAngleRad);
              const y3 = 50 + innerRadius * Math.sin(startAngleRad);
              const x4 = 50 + innerRadius * Math.cos(endAngleRad);
              const y4 = 50 + innerRadius * Math.sin(endAngleRad);
              
              const largeArc = expense.percentage > 50 ? 1 : 0;
              
              return `
                <path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} 
                         L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x3} ${y3} Z"
                      fill="url(#gradient${index})"
                      class="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      data-expense="${expense.name}"
                      data-value="$${expense.value.toLocaleString()}"
                      data-percentage="${expense.percentage.toFixed(1)}%">
                </path>
              `;
            }).join('')}
            
            <!-- Gradients -->
            <defs>
              ${chartData.map((expense, index) => `
                <linearGradient id="gradient${index}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" class="${expense.color.split(' ')[0].replace('from-', 'stop-')}" />
                  <stop offset="100%" class="${expense.color.split(' ')[1].replace('to-', 'stop-')}" />
                </linearGradient>
              `).join('')}
            </defs>
          </svg>
          
          <!-- Center Total -->
          <div class="absolute inset-0 flex items-center justify-center transform rotate-90">
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-800">$${Math.round(total).toLocaleString()}</div>
              <div class="text-xs text-gray-500">per month</div>
            </div>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex-1 space-y-2">
          ${expenses.map((expense, index) => `
            <div class="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded bg-gradient-to-r ${expense.color}"></div>
                <span class="text-sm font-medium text-gray-700">${expense.name}</span>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold text-gray-800">$${Math.round(expense.value).toLocaleString()}</div>
                <div class="text-xs text-gray-500">${((expense.value / total) * 100).toFixed(1)}%</div>
              </div>
            </div>
          `).join('')}
          
          <div class="pt-2 mt-2 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-700">Total Expenses</span>
              <span class="text-lg font-bold text-gray-800">$${Math.round(total).toLocaleString()}/mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function createCashFlowProjection(analysisData) {
  const monthlyRent = analysisData.longTermRental?.monthlyRent || 0;
  const monthlyExpenses = analysisData.costs?.totalMonthlyCost || 0;
  const cashFlow = monthlyRent - monthlyExpenses;
  
  // Project 12 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const projections = months.map((month, index) => {
    // Factor in vacancy (assume 5% vacancy rate)
    const vacancyFactor = Math.random() > 0.05 ? 1 : 0;
    const revenue = monthlyRent * vacancyFactor;
    const netCashFlow = revenue - monthlyExpenses;
    const cumulative = (index === 0 ? 0 : projections[index - 1]?.cumulative || 0) + netCashFlow;
    
    return { month, revenue, expenses: monthlyExpenses, netCashFlow, cumulative };
  });
  
  const maxValue = Math.max(...projections.map(p => Math.max(p.revenue, Math.abs(p.cumulative))));
  
  return `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="text-2xl">📈</span>
        12-Month Cash Flow Projection
      </h3>
      
      <div class="overflow-x-auto">
        <div class="min-w-[600px] h-64 relative">
          <!-- Grid Lines -->
          <div class="absolute inset-0 flex flex-col justify-between">
            ${[0, 1, 2, 3, 4].map(i => `
              <div class="border-t border-gray-200"></div>
            `).join('')}
          </div>
          
          <!-- Bars -->
          <div class="absolute inset-0 flex items-end justify-around px-4 pb-8">
            ${projections.map((proj, index) => `
              <div class="relative flex flex-col items-center gap-1 group">
                <!-- Revenue Bar -->
                <div class="absolute bottom-0 w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-300 hover:from-green-600 hover:to-green-500"
                     style="height: ${(proj.revenue / maxValue) * 200}px">
                  <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Revenue: $${proj.revenue.toLocaleString()}
                  </div>
                </div>
                
                <!-- Expense Bar (Negative) -->
                <div class="absolute bottom-0 w-8 bg-gradient-to-b from-red-500 to-red-400 rounded-b -ml-10 transition-all duration-300 hover:from-red-600 hover:to-red-500"
                     style="height: ${(proj.expenses / maxValue) * 200}px; transform: translateY(100%)">
                </div>
                
                <!-- Month Label -->
                <div class="absolute -bottom-6 text-xs text-gray-600">${proj.month}</div>
              </div>
            `).join('')}
          </div>
          
          <!-- Cumulative Line -->
          <svg class="absolute inset-0 pointer-events-none" viewBox="0 0 600 256">
            <polyline
              fill="none"
              stroke="url(#cumulativeGradient)"
              stroke-width="3"
              points="${projections.map((proj, index) => {
                const x = (index / 11) * 580 + 10;
                const y = 128 - (proj.cumulative / maxValue) * 100;
                return `${x},${y}`;
              }).join(' ')}"
            />
            <defs>
              <linearGradient id="cumulativeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#3B82F6" />
                <stop offset="100%" style="stop-color:#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      <!-- Summary Stats -->
      <div class="grid grid-cols-3 gap-4 mt-6">
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-xs text-green-600 font-medium">Avg Monthly Revenue</div>
          <div class="text-lg font-bold text-green-700">$${Math.round(monthlyRent * 0.95).toLocaleString()}</div>
        </div>
        <div class="text-center p-3 bg-red-50 rounded-lg">
          <div class="text-xs text-red-600 font-medium">Monthly Expenses</div>
          <div class="text-lg font-bold text-red-700">$${Math.round(monthlyExpenses).toLocaleString()}</div>
        </div>
        <div class="text-center p-3 ${cashFlow > 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg">
          <div class="text-xs ${cashFlow > 0 ? 'text-blue-600' : 'text-orange-600'} font-medium">Net Cash Flow</div>
          <div class="text-lg font-bold ${cashFlow > 0 ? 'text-blue-700' : 'text-orange-700'}">
            ${cashFlow > 0 ? '+' : ''}$${Math.round(cashFlow).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  `;
}