/**
 * Investment Verdict Component - Compact Modern Design
 * Investment score card with gradient background and clean metrics
 */

(function() {
  window.InvestmentVerdictCompactModern = function({ 
  recommendation = 'recommended',
  confidence = 'High',
  strategy = 'Short-Term Rental',
  monthlyRevenue = 0,
  monthlyDifference = 0,
  roi = 0,
  score = 9.1,
  insights = [],
  locationScore = 9.5,
  financialsScore = 8.8,
  growthScore = 9.2
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const scoreCategory = score >= 8 ? 'Excellent Opportunity' : 
                       score >= 6 ? 'Good Investment' : 
                       score >= 4 ? 'Fair Potential' : 'Poor Investment';

  return `
    <div class="col-span-4 space-y-6">
      <!-- Investment Score Card -->
      <div class="investment-score-card">
        <h3 class="text-lg font-semibold mb-4">Investment Score</h3>
        <div class="text-center mb-4">
          <div class="score-large">${score.toFixed(1)}</div>
          <div class="score-subtitle">${scoreCategory}</div>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-indigo-200">Location</span>
            <span>${locationScore}/10</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-indigo-200">Financials</span>
            <span>${financialsScore}/10</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-indigo-200">Growth</span>
            <span>${growthScore}/10</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">Actions</h3>
        <div class="space-y-3">
          <button class="w-full btn-gradient">
            Generate Report
          </button>
          <button class="w-full btn-outline">
            Schedule Viewing
          </button>
          <button class="w-full btn-outline">
            Save to Portfolio
          </button>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold mb-4">Risk Assessment</h3>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Market Risk</span>
              <span class="text-green-600 font-medium">Low</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill progress-green" style="width: 25%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Vacancy Risk</span>
              <span class="text-yellow-600 font-medium">Medium</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill bg-yellow-500" style="width: 45%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Liquidity Risk</span>
              <span class="text-green-600 font-medium">Low</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill progress-green" style="width: 30%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Insights -->
      ${insights.length > 0 ? `
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Key Insights</h3>
          <ul class="space-y-2">
            ${insights.slice(0, 3).map(insight => `
              <li class="flex items-start">
                <svg class="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm text-gray-600">${insight}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
  };
})();