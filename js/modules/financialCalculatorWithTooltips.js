/**
 * Financial Calculator with Integrated Tooltips
 * Enhanced version that includes tooltip support for all metric ratings
 */

// Import the base calculator functions
import { 
  defaultFinancialValues,
  updateFinancialCalculations,
  resetCalculator,
  getMetricRating,
  updateKeyMetrics,
  updateInterestRate,
  updateDownPayment,
  resetCalculatorEnhanced,
  toggleMethodology
} from './financialCalculatorInit.js';

// Function to create a tooltip-enabled indicator
function createTooltipIndicator(metric, value, rating) {
  const tooltipId = `tooltip-${metric}-${Math.random().toString(36).substr(2, 9)}`;
  
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
    
    const currentRange = metricInfo.ranges.find(r => r.rating === rating.label) || metricInfo.ranges[3];
    
    return `
      <div class="space-y-2">
        <div class="font-semibold border-b border-gray-700 pb-1 mb-2">
          ${metricInfo.title}: ${value}
        </div>
        <div class="text-gray-300 mb-2">${metricInfo.description}</div>
        <div class="space-y-1">
          ${metricInfo.ranges.map(range => `
            <div class="flex items-start gap-2 ${range.rating === rating.label ? 'text-white font-semibold' : 'text-gray-400'}">
              <span class="flex-shrink-0">${range.rating === rating.label ? '→' : ' '}</span>
              <div>
                <span class="${range.rating === rating.label ? 'text-yellow-300' : ''}">${range.rating}:</span> ${range.threshold}
                ${range.rating === rating.label ? `<div class="text-xs mt-0.5">${range.meaning}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };
  
  return `
    <div class="relative inline-block">
      <div 
        class="cursor-help"
        onmouseenter="document.getElementById('${tooltipId}').classList.remove('hidden')"
        onmouseleave="document.getElementById('${tooltipId}').classList.add('hidden')"
      >
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-${rating.color}-100 text-${rating.color}-700 rounded-full text-xs font-medium">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            ${getIndicatorIcon(rating.color)}
          </svg>
          ${rating.label}
        </span>
      </div>
      
      <div 
        id="${tooltipId}" 
        class="hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
      >
        <div class="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs">
          ${getTooltipContent()}
          <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  `;
}

// Function to get indicator icon
function getIndicatorIcon(color) {
  const icons = {
    purple: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>',
    green: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>',
    yellow: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 112 0v4a1 1 0 11-2 0V7zm0 8a1 1 0 112 0 1 1 0 01-2 0z" clip-rule="evenodd"/>',
    red: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
  };
  return icons[color] || icons.green;
}

// Function to update indicator with tooltip
export function updateIndicatorWithTooltip(indicatorId, metric, value, rating) {
  const indicator = document.getElementById(indicatorId);
  if (!indicator) return;
  
  // Replace the indicator content with tooltip-enabled version
  indicator.innerHTML = createTooltipIndicator(metric, value, rating);
}

// Enhanced metric indicators update function
export function updateMetricIndicatorsWithTooltips() {
  // Get current values
  const capRateValue = document.getElementById('capRateValue')?.textContent || '0%';
  const roiValue = document.getElementById('roiValue')?.textContent || '0%';
  const cashFlowValue = document.getElementById('cashFlowValue')?.textContent || '$0';
  const breakEvenValue = document.getElementById('breakEvenValue')?.textContent || '0%';
  
  // Parse numeric values
  const capRate = parseFloat(capRateValue);
  const roi = parseFloat(roiValue);
  const cashFlow = parseFloat(cashFlowValue.replace(/[^0-9.-]/g, ''));
  const breakEven = parseFloat(breakEvenValue);
  
  // Update each indicator with tooltips
  updateIndicatorWithTooltip('capRateIndicator', 'capRate', capRateValue, getMetricRating('capRate', capRate));
  updateIndicatorWithTooltip('roiIndicator', 'roi', roiValue, getMetricRating('roi', roi));
  updateIndicatorWithTooltip('cashFlowIndicator', 'cashFlow', cashFlowValue, getMetricRating('cashFlow', cashFlow));
  updateIndicatorWithTooltip('breakEvenIndicator', 'breakEven', breakEvenValue, getMetricRating('breakEven', breakEven));
}

// Enhanced initialization function
export function initializeFinancialCalculatorWithTooltips() {
  // Initialize base calculator
  updateFinancialCalculations();
  
  // Update indicators with tooltips
  updateMetricIndicatorsWithTooltips();
  
  // Make functions available globally
  window.updateMetricIndicatorsWithTooltips = updateMetricIndicatorsWithTooltips;
  window.getMetricRating = getMetricRating;
  
  // Override the base update function
  window.updateMetricIndicators = updateMetricIndicatorsWithTooltips;
}

// Export all base functions
export {
  defaultFinancialValues,
  updateFinancialCalculations,
  resetCalculator,
  getMetricRating,
  updateKeyMetrics,
  updateInterestRate,
  updateDownPayment,
  resetCalculatorEnhanced,
  toggleMethodology
};