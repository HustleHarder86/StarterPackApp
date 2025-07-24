/**
 * Enhanced Financial Calculator Module with Tooltips
 * Extends the base calculator with tooltip support for ratings
 */

import { RatingTooltip } from '../../components/ui/Tooltip.js';

// Function to update a single indicator with tooltip
export function updateIndicatorWithTooltip(indicatorId, metric, value, rating) {
  const indicator = document.getElementById(indicatorId);
  if (!indicator) return;
  
  // Get the parent container to replace the whole element
  const parent = indicator.parentElement;
  if (!parent) return;
  
  // Create the new indicator with tooltip
  const tooltipIndicator = RatingTooltip({
    metric,
    value,
    rating: rating.label,
    children: `
      <span class="inline-flex items-center gap-1 px-2 py-1 bg-${rating.color}-100 text-${rating.color}-700 rounded-full text-xs font-medium cursor-help">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          ${getIndicatorIcon(rating.color)}
        </svg>
        ${rating.label}
      </span>
    `
  });
  
  // Create a new div with the same ID
  const newIndicator = document.createElement('div');
  newIndicator.id = indicatorId;
  newIndicator.className = 'inline-block';
  newIndicator.innerHTML = tooltipIndicator;
  
  // Replace the old indicator
  parent.replaceChild(newIndicator, indicator);
}

// Function to get indicator icon (imported from base module)
function getIndicatorIcon(color) {
  const icons = {
    purple: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>',
    green: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>',
    yellow: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 112 0v4a1 1 0 11-2 0V7zm0 8a1 1 0 112 0 1 1 0 01-2 0z" clip-rule="evenodd"/>',
    red: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
  };
  return icons[color] || icons.green;
}

// Enhanced metric indicators update function
export function updateMetricIndicatorsWithTooltips() {
  // Import the base module functions
  if (typeof window.getMetricRating !== 'function') {
    console.error('Base financial calculator module not loaded');
    return;
  }
  
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
  updateIndicatorWithTooltip('capRateIndicator', 'capRate', capRateValue, window.getMetricRating('capRate', capRate));
  updateIndicatorWithTooltip('roiIndicator', 'roi', roiValue, window.getMetricRating('roi', roi));
  updateIndicatorWithTooltip('cashFlowIndicator', 'cashFlow', cashFlowValue, window.getMetricRating('cashFlow', cashFlow));
  updateIndicatorWithTooltip('breakEvenIndicator', 'breakEven', breakEvenValue, window.getMetricRating('breakEven', breakEven));
}

// Initialize enhanced calculator
export function initializeEnhancedCalculator() {
  // First initialize the base calculator
  if (typeof window.initializeFinancialCalculator === 'function') {
    window.initializeFinancialCalculator();
  }
  
  // Then enhance with tooltips
  setTimeout(() => {
    updateMetricIndicatorsWithTooltips();
  }, 100);
  
  // Override the base updateMetricIndicators function
  window.updateMetricIndicators = updateMetricIndicatorsWithTooltips;
}