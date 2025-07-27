/**
 * Consolidated Financial Summary Component
 * Combines the best features from all versions:
 * - Clean metric display from base version
 * - Interactive calculator from Enhanced version
 * - Flexible data handling for different response formats
 */

import { Card } from '../ui/Card.js';
import { MetricBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { InteractiveFinancialCalculator } from './InteractiveFinancialCalculator.js';
import { RatingTooltip, InfoTooltip } from '../ui/Tooltip.js';
import { CompactRatingLegend } from '../ui/RatingLegend.js';

/**
 * Main FinancialSummary Component
 * @param {Object} props - Component properties
 * @param {number} props.strRevenue - Short-term rental revenue
 * @param {number} props.ltrRevenue - Long-term rental revenue
 * @param {number} props.monthlyExpenses - Total monthly expenses
 * @param {number} props.netCashFlow - Net cash flow
 * @param {number} props.capRate - Capitalization rate
 * @param {number} props.roi - Return on investment
 * @param {number} props.paybackPeriod - Payback period in years
 * @param {Object} props.analysis - Full analysis object (for enhanced mode)
 * @param {boolean} props.enhanced - Use enhanced mode with calculator
 * @param {string} props.className - Additional CSS classes
 * @returns {string} HTML string for the component
 */
export const FinancialSummary = ({ 
  strRevenue = 0,
  ltrRevenue = 0,
  monthlyExpenses = 0,
  netCashFlow = 0,
  capRate = 0,
  roi = 0,
  paybackPeriod = 0,
  analysis = {},
  enhanced = true,
  className = ''
}) => {
  // If analysis object is provided, extract values from it
  if (analysis && Object.keys(analysis).length > 0) {
    const extracted = extractFinancialData(analysis);
    strRevenue = strRevenue || extracted.strRevenue;
    ltrRevenue = ltrRevenue || extracted.ltrRevenue;
    monthlyExpenses = monthlyExpenses || extracted.monthlyExpenses;
    netCashFlow = netCashFlow || extracted.netCashFlow;
    capRate = capRate || extracted.capRate;
    roi = roi || extracted.roi;
    paybackPeriod = paybackPeriod || extracted.paybackPeriod;
  }

  const monthlyDifference = strRevenue - ltrRevenue;
  const revenueAdvantage = ltrRevenue > 0 ? Math.round((monthlyDifference / ltrRevenue) * 100) : 0;
  const annualDifference = monthlyDifference * 12;

  if (enhanced && analysis && Object.keys(analysis).length > 0) {
    return renderEnhancedSummary({
      strRevenue,
      ltrRevenue,
      monthlyExpenses,
      netCashFlow,
      capRate,
      roi,
      paybackPeriod,
      monthlyDifference,
      revenueAdvantage,
      annualDifference,
      analysis,
      className
    });
  }

  return renderStandardSummary({
    strRevenue,
    ltrRevenue,
    monthlyExpenses,
    netCashFlow,
    capRate,
    roi,
    paybackPeriod,
    monthlyDifference,
    revenueAdvantage,
    annualDifference,
    className
  });
};

/**
 * Render enhanced summary with calculator
 */
function renderEnhancedSummary(props) {
  const {
    strRevenue,
    ltrRevenue,
    monthlyExpenses,
    netCashFlow,
    capRate,
    roi,
    monthlyDifference,
    analysis
  } = props;

  // Store data globally for calculator access
  if (typeof window !== 'undefined') {
    window.analysisData = {
      strRevenue,
      ltrRevenue,
      monthlyExpenses,
      propertyPrice: extractPropertyPrice(analysis),
      downPayment: extractDownPayment(analysis),
      expenses: extractExpenses(analysis)
    };
  }

  return Card({
    className: 'enhanced-financial-summary',
    children: `
      <!-- Header with Advantage -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-900">Financial Summary</h3>
        <div class="text-right">
          <div class="text-sm text-gray-600">Monthly Advantage</div>
          <div class="text-2xl font-bold ${monthlyDifference >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${monthlyDifference >= 0 ? '+' : ''}$${Math.abs(monthlyDifference).toLocaleString()}
          </div>
        </div>
      </div>

      <!-- Revenue Comparison with Visual Bars -->
      <div class="bg-gray-50 rounded-xl p-6 mb-6">
        <h4 class="font-semibold text-gray-900 mb-4">Revenue Comparison</h4>
        ${renderRevenueComparisonBars(strRevenue, ltrRevenue)}
      </div>

      <!-- Key Metrics Grid with Ratings -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        ${renderMetricWithRating('Net Cash Flow', netCashFlow, 'cashflow')}
        ${renderMetricWithRating('Cap Rate', capRate, 'caprate', '%')}
        ${renderMetricWithRating('ROI', roi, 'roi', '%')}
        ${renderMetricWithRating('Monthly Expenses', monthlyExpenses, 'expenses')}
      </div>

      <!-- Rating Legend -->
      ${CompactRatingLegend()}

      <!-- Interactive Calculator -->
      <div class="border-t pt-6 mt-6">
        <h4 class="font-semibold text-gray-900 mb-4">Financial Calculator</h4>
        ${InteractiveFinancialCalculator({ analysis })}
      </div>
    `
  });
}

/**
 * Render standard summary
 */
function renderStandardSummary(props) {
  const {
    strRevenue,
    ltrRevenue,
    monthlyExpenses,
    netCashFlow,
    capRate,
    roi,
    paybackPeriod,
    monthlyDifference,
    revenueAdvantage,
    annualDifference
  } = props;

  return Card({
    children: `
      <!-- Revenue Comparison Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-900">Financial Summary</h3>
        <div class="text-right">
          <div class="text-sm text-gray-600">Monthly Advantage</div>
          <div class="text-2xl font-bold ${monthlyDifference >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${monthlyDifference >= 0 ? '+' : ''}$${Math.abs(monthlyDifference).toLocaleString()}
          </div>
        </div>
      </div>

      <!-- Revenue Comparison Chart -->
      <div class="bg-gray-50 rounded-xl p-6 mb-6">
        <h4 class="font-semibold text-gray-900 mb-4">Revenue Comparison</h4>
        <div class="space-y-3">
          <!-- STR Revenue Bar -->
          <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-green-500 rounded"></div>
              <span class="font-medium text-gray-700">Short-Term Rental</span>
            </div>
            <span class="font-bold text-green-600">$${strRevenue.toLocaleString()}</span>
          </div>
          
          <!-- LTR Revenue Bar -->
          <div class="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 bg-gray-400 rounded"></div>
              <span class="font-medium text-gray-700">Long-Term Rental</span>
            </div>
            <span class="font-bold text-gray-600">$${ltrRevenue.toLocaleString()}</span>
          </div>
        </div>
        
        ${revenueAdvantage ? `
          <div class="mt-4 pt-4 border-t">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Revenue Advantage</span>
              <span class="font-semibold text-green-600">${revenueAdvantage}% higher</span>
            </div>
            <div class="flex justify-between text-sm mt-2">
              <span class="text-gray-600">Annual Difference</span>
              <span class="font-semibold text-green-600">+$${annualDifference.toLocaleString()}</span>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        ${MetricBadge({ label: 'Net Cash Flow', value: `$${netCashFlow.toLocaleString()}`, variant: netCashFlow > 0 ? 'success' : 'danger' })}
        ${MetricBadge({ label: 'Monthly Expenses', value: `$${monthlyExpenses.toLocaleString()}`, variant: 'neutral' })}
        ${MetricBadge({ label: 'Cap Rate', value: `${capRate}%`, variant: capRate > 6 ? 'success' : 'warning' })}
        ${MetricBadge({ label: 'ROI', value: `${roi}%`, variant: roi > 10 ? 'success' : 'warning' })}
        ${paybackPeriod ? MetricBadge({ label: 'Payback Period', value: `${paybackPeriod} years`, variant: paybackPeriod < 10 ? 'success' : 'warning' }) : ''}
      </div>
    `
  });
}

/**
 * Render revenue comparison bars with visual representation
 */
function renderRevenueComparisonBars(strRevenue, ltrRevenue) {
  const maxRevenue = Math.max(strRevenue, ltrRevenue);
  const strWidth = maxRevenue > 0 ? (strRevenue / maxRevenue) * 100 : 0;
  const ltrWidth = maxRevenue > 0 ? (ltrRevenue / maxRevenue) * 100 : 0;

  return `
    <div class="space-y-4">
      <!-- STR Bar -->
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span class="font-medium">Short-Term Rental</span>
          <span class="font-bold text-green-600">$${strRevenue.toLocaleString()}</span>
        </div>
        <div class="h-8 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
               style="width: ${strWidth}%"></div>
        </div>
      </div>
      
      <!-- LTR Bar -->
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span class="font-medium">Long-Term Rental</span>
          <span class="font-bold text-gray-600">$${ltrRevenue.toLocaleString()}</span>
        </div>
        <div class="h-8 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-gray-400 to-gray-600 rounded-full transition-all duration-500"
               style="width: ${ltrWidth}%"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render metric with rating indicator
 */
function renderMetricWithRating(label, value, type, suffix = '') {
  const rating = getRating(value, type);
  const formattedValue = type === 'cashflow' || type === 'expenses' 
    ? `$${value.toLocaleString()}`
    : `${value}${suffix}`;

  return `
    <div class="bg-gray-50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm text-gray-600">${label}</span>
        ${RatingTooltip({ rating, type })}
      </div>
      <div class="text-lg font-bold text-gray-900">${formattedValue}</div>
    </div>
  `;
}

/**
 * Get rating based on value and type
 */
function getRating(value, type) {
  const thresholds = {
    cashflow: { excellent: 2000, good: 1000, fair: 0, poor: -1000 },
    caprate: { excellent: 8, good: 6, fair: 4, poor: 2 },
    roi: { excellent: 15, good: 10, fair: 5, poor: 0 },
    expenses: { excellent: 2000, good: 3000, fair: 4000, poor: 5000 }
  };

  const t = thresholds[type];
  if (!t) return 'fair';

  if (type === 'expenses') {
    // Lower is better for expenses
    if (value <= t.excellent) return 'excellent';
    if (value <= t.good) return 'good';
    if (value <= t.fair) return 'fair';
    return 'poor';
  } else {
    // Higher is better for other metrics
    if (value >= t.excellent) return 'excellent';
    if (value >= t.good) return 'good';
    if (value >= t.fair) return 'fair';
    return 'poor';
  }
}

/**
 * Extract financial data from various response formats
 */
function extractFinancialData(analysis) {
  return {
    strRevenue: analysis.strAnalysis?.monthlyRevenue || 
                analysis.short_term_rental?.monthly_revenue || 
                analysis.str_analysis?.monthly_revenue || 0,
    
    ltrRevenue: analysis.longTermRental?.monthlyRent || 
                analysis.long_term_rental?.monthly_rent || 
                analysis.ltr_analysis?.monthly_rent || 0,
    
    monthlyExpenses: analysis.costs?.totalMonthly || 
                     analysis.costs?.total_monthly_expenses || 
                     analysis.expenses?.total_monthly || 0,
    
    netCashFlow: analysis.financial_summary?.net_cash_flow || 
                 (analysis.strAnalysis?.monthlyRevenue - analysis.costs?.totalMonthly) || 0,
    
    capRate: analysis.financial_summary?.cap_rate || 
             analysis.investment_metrics?.cap_rate || 0,
    
    roi: analysis.financial_summary?.roi || 
         analysis.investment_metrics?.roi || 0,
    
    paybackPeriod: analysis.financial_summary?.payback_period || 
                   analysis.investment_metrics?.payback_period || 0
  };
}

/**
 * Extract property price from various locations
 */
function extractPropertyPrice(analysis) {
  return analysis.propertyDetails?.estimatedValue || 
         analysis.property_details?.estimated_value ||
         analysis.propertyData?.price || 
         analysis.property_data?.price ||
         analysis.property?.price || 
         analysis.purchase?.price ||
         0;
}

/**
 * Extract down payment
 */
function extractDownPayment(analysis) {
  const price = extractPropertyPrice(analysis);
  return analysis.purchase?.downPayment || 
         analysis.purchase?.down_payment || 
         (price * 0.2);
}

/**
 * Extract expenses object
 */
function extractExpenses(analysis) {
  return analysis.costs || analysis.expenses || {};
}