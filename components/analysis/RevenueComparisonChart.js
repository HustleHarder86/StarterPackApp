/**
 * Revenue Comparison Chart Component
 * Visual bar chart comparing STR vs LTR revenue
 */

export const RevenueComparisonChart = ({ 
  strRevenue = 0, 
  ltrRevenue = 0,
  averageStrRevenue = null 
}) => {
  const maxRevenue = Math.max(strRevenue, ltrRevenue, averageStrRevenue || 0);
  const strPercentage = maxRevenue > 0 ? (strRevenue / maxRevenue) * 100 : 0;
  const ltrPercentage = maxRevenue > 0 ? (ltrRevenue / maxRevenue) * 100 : 0;
  const avgPercentage = averageStrRevenue && maxRevenue > 0 ? (averageStrRevenue / maxRevenue) * 100 : 0;
  
  const difference = strRevenue - ltrRevenue;
  const percentDifference = ltrRevenue > 0 ? ((difference / ltrRevenue) * 100).toFixed(0) : 0;
  
  return `
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h3 class="text-xl font-bold text-gray-900 mb-6">Revenue Comparison</h3>
      
      <div class="space-y-6">
        <!-- STR Revenue Bar -->
        <div>
          <div class="flex justify-between items-baseline mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">Short-Term Rental</span>
              ${strRevenue > ltrRevenue ? `
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  +${percentDifference}% higher
                </span>
              ` : ''}
            </div>
            <span class="text-lg font-bold text-purple-600">$${strRevenue.toLocaleString()}/mo</span>
          </div>
          <div class="relative">
            <div class="h-10 bg-gray-100 rounded-lg overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg transition-all duration-500 ease-out relative"
                style="width: ${strPercentage}%"
              >
                <div class="absolute inset-0 flex items-center justify-end pr-3">
                  <span class="text-white text-sm font-medium">${strPercentage > 20 ? '$' + strRevenue.toLocaleString() : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- LTR Revenue Bar -->
        <div>
          <div class="flex justify-between items-baseline mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">Long-Term Rental</span>
              ${ltrRevenue > strRevenue ? `
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  More stable
                </span>
              ` : ''}
            </div>
            <span class="text-lg font-bold text-gray-600">$${ltrRevenue.toLocaleString()}/mo</span>
          </div>
          <div class="relative">
            <div class="h-10 bg-gray-100 rounded-lg overflow-hidden">
              <div 
                class="h-full bg-gray-400 rounded-lg transition-all duration-500 ease-out relative"
                style="width: ${ltrPercentage}%"
              >
                <div class="absolute inset-0 flex items-center justify-end pr-3">
                  <span class="text-white text-sm font-medium">${ltrPercentage > 20 ? '$' + ltrRevenue.toLocaleString() : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Average STR Market Bar (if available) -->
        ${averageStrRevenue ? `
        <div>
          <div class="flex justify-between items-baseline mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">Market Average STR</span>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                Benchmark
              </span>
            </div>
            <span class="text-lg font-bold text-blue-600">$${averageStrRevenue.toLocaleString()}/mo</span>
          </div>
          <div class="relative">
            <div class="h-10 bg-gray-100 rounded-lg overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg transition-all duration-500 ease-out relative opacity-70"
                style="width: ${avgPercentage}%"
              >
                <div class="absolute inset-0 flex items-center justify-end pr-3">
                  <span class="text-white text-sm font-medium">${avgPercentage > 20 ? '$' + averageStrRevenue.toLocaleString() : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
      
      <!-- Summary Box -->
      <div class="mt-6 p-4 ${difference > 0 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-200'} rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Monthly Revenue Advantage</p>
            <p class="text-2xl font-bold ${difference > 0 ? 'text-purple-600' : 'text-gray-600'}">
              ${difference > 0 ? '+' : ''}$${Math.abs(difference).toLocaleString()}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Recommended Strategy</p>
            <p class="text-lg font-bold ${difference > 0 ? 'text-purple-600' : 'text-gray-600'}">
              ${difference > ltrRevenue * 0.3 ? 'Short-Term Rental' : difference > 0 ? 'Consider STR' : 'Long-Term Rental'}
            </p>
          </div>
        </div>
        
        ${averageStrRevenue && strRevenue > averageStrRevenue ? `
        <div class="mt-3 pt-3 border-t border-purple-200">
          <p class="text-sm text-purple-700 flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Your property performs ${((strRevenue / averageStrRevenue - 1) * 100).toFixed(0)}% above market average!
          </p>
        </div>
        ` : ''}
      </div>
      
      <!-- Annual Projection -->
      <div class="mt-4 text-center text-sm text-gray-600">
        <p>Annual Revenue Difference: <span class="font-bold text-lg ${difference > 0 ? 'text-purple-600' : 'text-gray-600'}">
          ${difference > 0 ? '+' : ''}$${Math.abs(difference * 12).toLocaleString()}</span> per year
        </p>
      </div>
    </div>
  `;
};

// Export for global use
window.RevenueComparisonChart = RevenueComparisonChart;