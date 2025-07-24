/**
 * Rating Legend Component
 * Displays all rating thresholds and their meanings
 */

import { Card } from './Card.js';

export const RatingLegend = ({ 
  showMetrics = ['capRate', 'roi', 'cashFlow', 'breakEven'],
  collapsed = true 
}) => {
  const legendId = `legend-${Math.random().toString(36).substr(2, 9)}`;
  
  const metrics = {
    capRate: {
      title: 'Cap Rate',
      description: 'Annual return on property value (NOI ÷ Property Value)',
      icon: '📊',
      ranges: [
        { rating: 'Excellent', threshold: '≥ 10%', color: 'purple', meaning: 'Top-tier investment opportunity' },
        { rating: 'Good', threshold: '8-10%', color: 'green', meaning: 'Solid returns above market average' },
        { rating: 'Fair', threshold: '6-8%', color: 'yellow', meaning: 'Average market returns' },
        { rating: 'Poor', threshold: '< 6%', color: 'red', meaning: 'Below typical investment standards' }
      ]
    },
    roi: {
      title: 'Annual ROI (Cash-on-Cash)',
      description: 'Return on your cash investment (Annual Income ÷ Down Payment)',
      icon: '💰',
      ranges: [
        { rating: 'Excellent', threshold: '≥ 12%', color: 'purple', meaning: 'Outstanding cash returns' },
        { rating: 'Good', threshold: '8-12%', color: 'green', meaning: 'Strong performance vs alternatives' },
        { rating: 'Fair', threshold: '5-8%', color: 'yellow', meaning: 'Comparable to stock market' },
        { rating: 'Poor', threshold: '< 5%', color: 'red', meaning: 'Better options likely available' }
      ]
    },
    cashFlow: {
      title: 'Monthly Cash Flow',
      description: 'Net profit after all expenses',
      icon: '💵',
      ranges: [
        { rating: 'Strong', threshold: '≥ $2,000', color: 'green', meaning: 'Excellent passive income' },
        { rating: 'Good', threshold: '$500-$2,000', color: 'green', meaning: 'Healthy profit margin' },
        { rating: 'Fair', threshold: '$0-$500', color: 'yellow', meaning: 'Minimal profit buffer' },
        { rating: 'Negative', threshold: '< $0', color: 'red', meaning: 'Property loses money' }
      ]
    },
    breakEven: {
      title: 'Break-Even Occupancy',
      description: 'Minimum occupancy to cover all costs',
      icon: '🏠',
      ranges: [
        { rating: 'Excellent', threshold: '≤ 60%', color: 'purple', meaning: 'Very low risk profile' },
        { rating: 'Good', threshold: '60-70%', color: 'green', meaning: 'Comfortable safety margin' },
        { rating: 'Fair', threshold: '70-80%', color: 'yellow', meaning: 'Average market risk' },
        { rating: 'Risky', threshold: '> 80%', color: 'red', meaning: 'Vulnerable to vacancy' }
      ]
    }
  };
  
  return Card({
    children: `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a1 1 0 100 2H6a4 4 0 01-4-4V5a4 4 0 014-4h5a4 4 0 014 4v10a4 4 0 01-4 4h-1a1 1 0 110-2h1a2 2 0 002-2V5a2 2 0 00-2-2h-1a1 1 0 110-2h1z" clip-rule="evenodd"/>
            </svg>
            Investment Metrics Guide
          </h3>
          <button 
            onclick="
              const content = document.getElementById('${legendId}');
              const icon = this.querySelector('svg');
              if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.style.transform = 'rotate(180deg)';
              } else {
                content.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
              }
            "
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5 transition-transform ${collapsed ? '' : 'rotate-180'}" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <div id="${legendId}" class="${collapsed ? 'hidden' : ''} space-y-6">
          <p class="text-sm text-gray-600">
            Understanding these key metrics helps you make informed investment decisions. 
            Each metric evaluates different aspects of the property's financial performance.
          </p>
          
          ${showMetrics.map(metricKey => {
            const metric = metrics[metricKey];
            if (!metric) return '';
            
            return `
              <div class="border-l-2 border-gray-200 pl-4 space-y-2">
                <div class="flex items-start gap-2">
                  <span class="text-2xl">${metric.icon}</span>
                  <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${metric.title}</h4>
                    <p class="text-xs text-gray-600 mt-0.5">${metric.description}</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  ${metric.ranges.map(range => `
                    <div class="flex items-start gap-2 text-sm">
                      <div class="flex items-center gap-1.5 min-w-[100px]">
                        <div class="w-3 h-3 bg-${range.color}-500 rounded-full flex-shrink-0"></div>
                        <span class="font-medium text-gray-900">${range.rating}:</span>
                      </div>
                      <div class="flex-1 text-gray-600">
                        <span class="font-medium">${range.threshold}</span>
                        <div class="text-xs mt-0.5">${range.meaning}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div class="flex gap-2">
              <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <div class="text-sm text-blue-800">
                <strong>Pro Tip:</strong> Focus on properties with at least two "Good" or better ratings. 
                Excellent cap rate combined with strong cash flow typically indicates a winning investment.
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    className: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
  });
};

/**
 * Compact Rating Legend for inline use
 */
export const CompactRatingLegend = ({ metric }) => {
  const legends = {
    capRate: [
      { color: 'purple', label: 'Excellent ≥10%' },
      { color: 'green', label: 'Good 8-10%' },
      { color: 'yellow', label: 'Fair 6-8%' },
      { color: 'red', label: 'Poor <6%' }
    ],
    roi: [
      { color: 'purple', label: 'Excellent ≥12%' },
      { color: 'green', label: 'Good 8-12%' },
      { color: 'yellow', label: 'Fair 5-8%' },
      { color: 'red', label: 'Poor <5%' }
    ],
    cashFlow: [
      { color: 'green', label: 'Strong ≥$2k' },
      { color: 'green', label: 'Good $500-2k' },
      { color: 'yellow', label: 'Fair $0-500' },
      { color: 'red', label: 'Negative <$0' }
    ],
    breakEven: [
      { color: 'purple', label: 'Excellent ≤60%' },
      { color: 'green', label: 'Good 60-70%' },
      { color: 'yellow', label: 'Fair 70-80%' },
      { color: 'red', label: 'Risky >80%' }
    ]
  };
  
  const legend = legends[metric];
  if (!legend) return '';
  
  return `
    <div class="flex flex-wrap gap-2 text-xs">
      ${legend.map(item => `
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 bg-${item.color}-500 rounded-full"></div>
          <span class="text-gray-600">${item.label}</span>
        </div>
      `).join('')}
    </div>
  `;
};