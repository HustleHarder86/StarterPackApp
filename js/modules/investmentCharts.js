// Investment Charts Module
// Enhanced visualizations for investment analysis

export function createBreakEvenChart(analysisData) {
  const purchasePrice = analysisData.property?.price || 0;
  const downPayment = purchasePrice * 0.2;
  const monthlyProfit = analysisData.financialSummary?.netMonthlyCashFlow || 0;
  const appreciationRate = 0.03; // 3% annual appreciation
  
  // Calculate break-even timeline
  const years = [];
  let totalInvested = downPayment;
  let totalReturn = 0;
  let breakEvenYear = null;
  
  for (let year = 1; year <= 10; year++) {
    const annualCashFlow = monthlyProfit * 12;
    const propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);
    const appreciation = propertyValue - purchasePrice;
    
    totalReturn += annualCashFlow;
    const totalValue = totalReturn + appreciation;
    
    if (totalValue >= totalInvested && !breakEvenYear) {
      breakEvenYear = year;
    }
    
    years.push({
      year,
      invested: totalInvested,
      cashFlow: totalReturn,
      appreciation,
      totalValue,
      breakEven: totalValue >= totalInvested
    });
  }
  
  const maxValue = Math.max(...years.map(y => Math.max(y.invested, y.totalValue)));
  
  return `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="text-2xl">🎯</span>
        Break-Even Analysis
      </h3>
      
      <div class="relative h-64 mb-4">
        <!-- Grid -->
        <div class="absolute inset-0 grid grid-cols-10 gap-0">
          ${years.map(() => '<div class="border-l border-gray-100"></div>').join('')}
        </div>
        
        <!-- Chart Area -->
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
          <!-- Investment Line (Flat) -->
          <line x1="0" y1="${180 - (totalInvested / maxValue) * 160}" 
                x2="400" y2="${180 - (totalInvested / maxValue) * 160}"
                stroke="#EF4444" stroke-width="2" stroke-dasharray="5,5" />
          
          <!-- Total Return Curve -->
          <path d="M ${years.map((year, index) => {
            const x = (index / 9) * 380 + 10;
            const y = 180 - (year.totalValue / maxValue) * 160;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}"
                fill="none" stroke="#10B981" stroke-width="3" />
          
          <!-- Break-Even Point -->
          ${breakEvenYear ? `
            <circle cx="${((breakEvenYear - 1) / 9) * 380 + 10}" 
                    cy="${180 - (years[breakEvenYear - 1].totalValue / maxValue) * 160}"
                    r="6" fill="#10B981" stroke="white" stroke-width="2" />
          ` : ''}
          
          <!-- Data Points -->
          ${years.map((year, index) => `
            <circle cx="${(index / 9) * 380 + 10}" 
                    cy="${180 - (year.totalValue / maxValue) * 160}"
                    r="4" fill="${year.breakEven ? '#10B981' : '#3B82F6'}" 
                    class="cursor-pointer hover:r-6" />
          `).join('')}
        </svg>
        
        <!-- Labels -->
        <div class="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          ${years.filter((_, i) => i % 2 === 0).map(year => `
            <span>Year ${year.year}</span>
          `).join('')}
        </div>
        
        <!-- Y-Axis Labels -->
        <div class="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-10">
          <span>$${Math.round(maxValue / 1000)}k</span>
          <span>$${Math.round(maxValue / 2000)}k</span>
          <span>$0</span>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="flex items-center justify-center gap-6 mb-4">
        <div class="flex items-center gap-2">
          <div class="w-4 h-0.5 bg-red-500 border-dashed"></div>
          <span class="text-sm text-gray-600">Initial Investment</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-1 bg-green-500"></div>
          <span class="text-sm text-gray-600">Total Returns</span>
        </div>
      </div>
      
      <!-- Break-Even Summary -->
      ${breakEvenYear ? `
        <div class="p-4 bg-green-50 rounded-lg">
          <p class="text-sm text-green-800">
            <strong>Break-even in Year ${breakEvenYear}!</strong> Your investment will be fully recovered through a combination of 
            rental income and property appreciation. After this point, all returns are pure profit.
          </p>
        </div>
      ` : `
        <div class="p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            Based on current projections, your break-even point extends beyond 10 years. 
            Consider strategies to increase rental income or reduce expenses.
          </p>
        </div>
      `}
    </div>
  `;
}

export function createEquityBuildupChart(analysisData) {
  const purchasePrice = analysisData.property?.price || 0;
  const downPayment = purchasePrice * 0.2;
  const loanAmount = purchasePrice - downPayment;
  const monthlyPayment = analysisData.costs?.mortgagePayment || 0;
  const appreciationRate = 0.03;
  
  // Calculate equity buildup over 10 years
  const years = [];
  let remainingLoan = loanAmount;
  
  for (let year = 0; year <= 10; year++) {
    const propertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);
    const principalPaid = year === 0 ? downPayment : (loanAmount - remainingLoan) + downPayment;
    const appreciation = propertyValue - purchasePrice;
    const totalEquity = principalPaid + appreciation;
    
    years.push({
      year,
      propertyValue,
      loanBalance: remainingLoan,
      principalPaid,
      appreciation,
      totalEquity,
      equityPercentage: (totalEquity / propertyValue) * 100
    });
    
    // Simple loan amortization (approximate)
    if (year < 10) {
      const annualPrincipal = (monthlyPayment * 12) * 0.3; // Rough estimate
      remainingLoan = Math.max(0, remainingLoan - annualPrincipal);
    }
  }
  
  return `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="text-2xl">🏦</span>
        Equity Buildup Over Time
      </h3>
      
      <div class="relative h-64 mb-4">
        <!-- Stacked Area Chart -->
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
          <!-- Property Value Area -->
          <path d="M 0 180 ${years.map((year, index) => {
            const x = (index / 10) * 400;
            const y = 180 - (year.propertyValue / years[10].propertyValue) * 160;
            return `L ${x} ${y}`;
          }).join(' ')} L 400 180 Z"
                fill="url(#propertyGradient)" opacity="0.2" />
          
          <!-- Total Equity Area -->
          <path d="M 0 180 ${years.map((year, index) => {
            const x = (index / 10) * 400;
            const y = 180 - (year.totalEquity / years[10].propertyValue) * 160;
            return `L ${x} ${y}`;
          }).join(' ')} L 400 180 Z"
                fill="url(#equityGradient)" opacity="0.8" />
          
          <!-- Principal Paid Area -->
          <path d="M 0 180 ${years.map((year, index) => {
            const x = (index / 10) * 400;
            const y = 180 - (year.principalPaid / years[10].propertyValue) * 160;
            return `L ${x} ${y}`;
          }).join(' ')} L 400 180 Z"
                fill="url(#principalGradient)" />
          
          <!-- Gradients -->
          <defs>
            <linearGradient id="propertyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:#3B82F6;stop-opacity:0.2" />
            </linearGradient>
            <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:#10B981;stop-opacity:0.2" />
            </linearGradient>
            <linearGradient id="principalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:0.8" />
              <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:0.2" />
            </linearGradient>
          </defs>
        </svg>
        
        <!-- X-Axis Labels -->
        <div class="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          ${years.filter((_, i) => i % 2 === 0).map(year => `
            <span>Year ${year.year}</span>
          `).join('')}
        </div>
      </div>
      
      <!-- Legend -->
      <div class="flex flex-wrap items-center justify-center gap-4 mb-4">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-purple-500 rounded"></div>
          <span class="text-sm text-gray-600">Principal Paid</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-green-500 rounded"></div>
          <span class="text-sm text-gray-600">Total Equity</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-blue-500 opacity-30 rounded"></div>
          <span class="text-sm text-gray-600">Property Value</span>
        </div>
      </div>
      
      <!-- Equity Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-3 bg-purple-50 rounded-lg">
          <div class="text-xs text-purple-600 font-medium">Initial Equity</div>
          <div class="text-lg font-bold text-purple-700">$${Math.round(downPayment / 1000)}k</div>
          <div class="text-xs text-purple-500">${Math.round((downPayment / purchasePrice) * 100)}%</div>
        </div>
        <div class="text-center p-3 bg-green-50 rounded-lg">
          <div class="text-xs text-green-600 font-medium">10-Year Equity</div>
          <div class="text-lg font-bold text-green-700">$${Math.round(years[10].totalEquity / 1000)}k</div>
          <div class="text-xs text-green-500">${Math.round(years[10].equityPercentage)}%</div>
        </div>
        <div class="text-center p-3 bg-blue-50 rounded-lg">
          <div class="text-xs text-blue-600 font-medium">Equity Growth</div>
          <div class="text-lg font-bold text-blue-700">${Math.round((years[10].totalEquity / downPayment - 1) * 100)}%</div>
          <div class="text-xs text-blue-500">${Math.round((years[10].totalEquity - downPayment) / 1000)}k gain</div>
        </div>
      </div>
    </div>
  `;
}

export function createROIComparisonMatrix(analysisData) {
  const purchasePrice = analysisData.property?.price || 0;
  const strROI = analysisData.strAnalysis?.annualROI || 0;
  const ltrROI = analysisData.longTermRental?.annualROI || 0;
  const currentROI = Math.max(strROI, ltrROI);
  
  // Compare with other investment options
  const investments = [
    { name: 'This Property', roi: currentROI, risk: 'Medium', liquidity: 'Low', icon: '🏠' },
    { name: 'Stock Market', roi: 10, risk: 'High', liquidity: 'High', icon: '📈' },
    { name: 'Bonds', roi: 4, risk: 'Low', liquidity: 'Medium', icon: '📜' },
    { name: 'Savings Account', roi: 2, risk: 'Very Low', liquidity: 'Very High', icon: '🏦' },
    { name: 'REITs', roi: 8, risk: 'Medium', liquidity: 'High', icon: '🏢' }
  ];
  
  const maxROI = Math.max(...investments.map(i => i.roi));
  
  return `
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span class="text-2xl">⚖️</span>
        Investment Comparison Matrix
      </h3>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-2 px-3 text-sm font-medium text-gray-700">Investment</th>
              <th class="text-center py-2 px-3 text-sm font-medium text-gray-700">Annual ROI</th>
              <th class="text-center py-2 px-3 text-sm font-medium text-gray-700">Risk Level</th>
              <th class="text-center py-2 px-3 text-sm font-medium text-gray-700">Liquidity</th>
            </tr>
          </thead>
          <tbody>
            ${investments.map((inv, index) => `
              <tr class="${index === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors">
                <td class="py-3 px-3">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">${inv.icon}</span>
                    <span class="${index === 0 ? 'font-semibold text-blue-700' : 'text-gray-700'}">${inv.name}</span>
                  </div>
                </td>
                <td class="py-3 px-3">
                  <div class="flex items-center justify-center gap-2">
                    <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div class="h-full rounded-full bg-gradient-to-r ${
                        inv.roi > 8 ? 'from-green-500 to-green-400' : 
                        inv.roi > 5 ? 'from-blue-500 to-blue-400' : 
                        'from-gray-400 to-gray-300'
                      }" style="width: ${(inv.roi / maxROI) * 100}%"></div>
                    </div>
                    <span class="${index === 0 ? 'font-semibold text-blue-700' : 'text-gray-700'}">${inv.roi}%</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-center">
                  <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    inv.risk === 'Very Low' ? 'bg-green-100 text-green-700' :
                    inv.risk === 'Low' ? 'bg-green-100 text-green-700' :
                    inv.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }">${inv.risk}</span>
                </td>
                <td class="py-3 px-3 text-center">
                  <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    inv.liquidity === 'Very High' ? 'bg-blue-100 text-blue-700' :
                    inv.liquidity === 'High' ? 'bg-blue-100 text-blue-700' :
                    inv.liquidity === 'Medium' ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }">${inv.liquidity}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800">
          <strong>Your property's ${currentROI.toFixed(1)}% ROI</strong> ${
            currentROI > 8 ? 'outperforms most traditional investments' :
            currentROI > 5 ? 'is competitive with balanced portfolios' :
            'provides stable returns with tangible asset ownership'
          }. Real estate offers unique benefits including leverage, tax advantages, and inflation hedging.
        </p>
      </div>
    </div>
  `;
}