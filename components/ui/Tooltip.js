/**
 * Tooltip Component
 * Provides hover tooltips for explaining rating thresholds and other information
 */

export const Tooltip = ({ 
  children, 
  content,
  position = 'top',
  className = ''
}) => {
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
  
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
  };
  
  return `
    <div class="relative inline-block ${className}">
      <div 
        class="cursor-help"
        onmouseenter="document.getElementById('${tooltipId}').classList.remove('hidden')"
        onmouseleave="document.getElementById('${tooltipId}').classList.add('hidden')"
      >
        ${children}
      </div>
      
      <div 
        id="${tooltipId}" 
        class="hidden absolute ${positionClasses[position]} z-50 pointer-events-none"
      >
        <div class="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap max-w-xs">
          ${content}
          <div class="absolute ${arrowClasses[position]} w-0 h-0 border-4 border-transparent"></div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Rating Tooltip Component
 * Specialized tooltip for explaining metric ratings
 */
export const RatingTooltip = ({ 
  metric,
  value,
  rating,
  children 
}) => {
  const getTooltipContent = () => {
    const thresholds = {
      capRate: {
        title: 'Cap Rate',
        description: 'Net Operating Income / Property Value',
        ranges: [
          { rating: 'Excellent', threshold: '≥ 10%', meaning: 'Outstanding return on investment' },
          { rating: 'Good', threshold: '8-10%', meaning: 'Above average returns' },
          { rating: 'Fair', threshold: '6-8%', meaning: 'Acceptable returns' },
          { rating: 'Poor', threshold: '< 6%', meaning: 'Below market expectations' }
        ]
      },
      roi: {
        title: 'Annual ROI',
        description: 'Cash-on-Cash Return (Annual Income / Down Payment)',
        ranges: [
          { rating: 'Excellent', threshold: '≥ 12%', meaning: 'Exceptional cash returns' },
          { rating: 'Good', threshold: '8-12%', meaning: 'Strong cash flow potential' },
          { rating: 'Fair', threshold: '5-8%', meaning: 'Moderate returns' },
          { rating: 'Poor', threshold: '< 5%', meaning: 'Low cash returns' }
        ]
      },
      cashFlow: {
        title: 'Monthly Cash Flow',
        description: 'Revenue minus all expenses',
        ranges: [
          { rating: 'Strong', threshold: '≥ $2,000', meaning: 'Excellent positive cash flow' },
          { rating: 'Good', threshold: '$500-$2,000', meaning: 'Healthy profit margin' },
          { rating: 'Fair', threshold: '$0-$500', meaning: 'Breaking even or small profit' },
          { rating: 'Negative', threshold: '< $0', meaning: 'Property loses money monthly' }
        ]
      },
      breakEven: {
        title: 'Break-Even Occupancy',
        description: 'Minimum occupancy needed to cover expenses',
        ranges: [
          { rating: 'Excellent', threshold: '≤ 60%', meaning: 'Very resilient to vacancy' },
          { rating: 'Good', threshold: '60-70%', meaning: 'Good buffer for vacancies' },
          { rating: 'Fair', threshold: '70-80%', meaning: 'Moderate vacancy risk' },
          { rating: 'Risky', threshold: '> 80%', meaning: 'High risk if occupancy drops' }
        ]
      }
    };
    
    const metricInfo = thresholds[metric];
    if (!metricInfo) return 'Metric information not available';
    
    const currentRange = metricInfo.ranges.find(r => r.rating === rating) || metricInfo.ranges[3];
    
    return `
      <div class="space-y-2">
        <div class="font-semibold border-b border-gray-700 pb-1 mb-2">
          ${metricInfo.title}: ${value}
        </div>
        <div class="text-gray-300 mb-2">${metricInfo.description}</div>
        <div class="space-y-1">
          ${metricInfo.ranges.map(range => `
            <div class="flex items-start gap-2 ${range.rating === rating ? 'text-white font-semibold' : 'text-gray-400'}">
              <span class="flex-shrink-0">${range.rating === rating ? '→' : ' '}</span>
              <div>
                <span class="${range.rating === rating ? 'text-yellow-300' : ''}">${range.rating}:</span> ${range.threshold}
                ${range.rating === rating ? `<div class="text-xs mt-0.5">${range.meaning}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };
  
  return Tooltip({
    children,
    content: getTooltipContent(),
    position: 'top',
    className: 'inline-block'
  });
};

/**
 * Info Icon with Tooltip
 */
export const InfoTooltip = ({ content, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  return Tooltip({
    children: `
      <svg class="${sizeClasses[size]} text-gray-400 hover:text-gray-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
      </svg>
    `,
    content,
    position: 'top'
  });
};