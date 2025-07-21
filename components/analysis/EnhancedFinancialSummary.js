/**
 * Enhanced Financial Summary Component
 * Includes revenue comparison, interactive calculator, and key metrics with indicators
 */

import { Card } from '../ui/Card.js';
import { MetricBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { InteractiveFinancialCalculator, financialCalculatorScript, financialCalculatorStyles } from './InteractiveFinancialCalculator.js';

export const EnhancedFinancialSummary = ({ 
  analysis = {},
  className = ''
}) => {
  // Extract values from analysis data
  const strRevenue = analysis.strAnalysis?.monthlyRevenue || 5400;
  const ltrRevenue = analysis.longTermRental?.monthlyRent || 3200;
  const monthlyExpenses = analysis.costs?.totalMonthly || 3300;
  const netCashFlow = strRevenue - monthlyExpenses;
  const propertyPrice = analysis.property?.price || 850000;
  const downPayment = propertyPrice * 0.2;
  
  // Calculate metrics
  const annualNetIncome = netCashFlow * 12;
  const capRate = (annualNetIncome / propertyPrice) * 100;
  const cashOnCashReturn = (annualNetIncome / downPayment) * 100;
  const breakEvenOccupancy = (monthlyExpenses / strRevenue) * 100;
  
  const monthlyDifference = strRevenue - ltrRevenue;
  const annualDifference = monthlyDifference * 12;

  // Extract expense data from analysis
  const expenses = {
    propertyTax: Math.round((analysis.costs?.property_tax_annual || 8496) / 12),
    insurance: Math.round((analysis.costs?.insurance_annual || 3000) / 12),
    hoaFees: analysis.costs?.hoa_monthly || 450,
    propertyMgmt: Math.round(strRevenue * 0.10),
    utilities: analysis.costs?.utilities_monthly || 200,
    cleaning: 400, // From Airbnb market data
    maintenance: Math.round((analysis.costs?.maintenance_annual || 3600) / 12),
    supplies: Math.round(strRevenue * 0.05),
    platformFees: Math.round(strRevenue * 0.03),
    otherExpenses: 140
  };

  return `
    <div class="space-y-2xl">
      <!-- Annual Revenue Comparison -->
      ${Card({
        children: `
          <h3 class="text-xl font-bold text-gray-900 mb-lg">Annual Revenue Comparison</h3>
          <div class="revenue-chart-container mb-lg">
            <canvas id="revenueChart"></canvas>
          </div>
          <div class="text-center text-sm text-gray-600">
            Projected annual advantage: <span class="font-bold text-green-600">+$${annualDifference.toLocaleString()}</span> with short-term rental
          </div>
        `,
        className: 'mb-xl'
      })}

      <!-- Interactive Financial Calculator -->
      <div class="mb-xl">
        ${InteractiveFinancialCalculator({
          monthlyRevenue: strRevenue,
          expenses: expenses,
          propertyPrice: propertyPrice,
          downPayment: downPayment
        })}
      </div>

      <!-- Key Metrics with Indicators -->
      ${Card({
        children: `
          <h3 class="text-xl font-bold text-gray-900 mb-xl">Key Metrics</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-lg">
            ${generateMetricWithIndicator('Cap Rate', capRate.toFixed(1) + '%', 'capRate', capRate)}
            ${generateMetricWithIndicator('Annual ROI', cashOnCashReturn.toFixed(1) + '%', 'roi', cashOnCashReturn)}
            ${generateMetricWithIndicator('Monthly Cash Flow', '$' + netCashFlow.toLocaleString(), 'cashFlow', netCashFlow)}
            ${generateMetricWithIndicator('Break-even Occupancy', breakEvenOccupancy.toFixed(0) + '%', 'breakEven', breakEvenOccupancy)}
          </div>
        `,
        className: 'mb-xl'
      })}

      <!-- Action Buttons with Share -->
      ${Card({
        children: `
          <div class="flex flex-col sm:flex-row gap-lg justify-center">
            <button onclick="saveAnalysis()" class="btn btn-primary">
              💾 Save This Analysis
            </button>
            <button onclick="generateReport()" class="btn btn-secondary">
              📊 Generate Full Report
            </button>
            <button onclick="shareAnalysis()" class="btn btn-secondary">
              🔗 Share Analysis
            </button>
            <button onclick="analyzeAnother()" class="btn btn-secondary">
              🔍 Analyze Another Property
            </button>
          </div>
        `
      })}
    </div>

    <!-- Revenue Chart Script -->
    <script>
      // Initialize revenue comparison chart
      const ctx = document.getElementById('revenueChart')?.getContext('2d');
      if (ctx) {
        const revenueChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Short-Term Rental', 'Long-Term Rental'],
            datasets: [{
              data: [${strRevenue * 12}, ${ltrRevenue * 12}],
              backgroundColor: ['#10b981', '#6b7280'],
              borderRadius: 8,
              borderSkipped: false,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  display: true,
                  color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                  callback: function(value) {
                    return '$' + value.toLocaleString();
                  }
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    </script>

    <!-- Financial Calculator Script -->
    ${financialCalculatorScript}

    <!-- Metric Indicators Script -->
    <script>
      // Function to update metric indicators
      function updateMetricIndicators() {
        // Get current values
        const capRate = parseFloat(document.getElementById('capRateValue')?.textContent || '0');
        const roi = parseFloat(document.getElementById('roiValue')?.textContent || '0');
        const cashFlow = parseFloat(document.getElementById('cashFlowValue')?.textContent.replace(/[^0-9.-]/g, '') || '0');
        const breakEven = parseFloat(document.getElementById('breakEvenValue')?.textContent || '0');

        // Update each indicator
        updateIndicator('capRateIndicator', getMetricRating('capRate', capRate));
        updateIndicator('roiIndicator', getMetricRating('roi', roi));
        updateIndicator('cashFlowIndicator', getMetricRating('cashFlow', cashFlow));
        updateIndicator('breakEvenIndicator', getMetricRating('breakEven', breakEven));
      }

      // Function to get metric rating
      function getMetricRating(metric, value) {
        const ratings = {
          capRate: {
            excellent: { min: 10, label: 'Excellent', color: 'purple' },
            good: { min: 8, label: 'Good', color: 'green' },
            fair: { min: 6, label: 'Fair', color: 'yellow' },
            poor: { min: 0, label: 'Poor', color: 'red' }
          },
          roi: {
            excellent: { min: 12, label: 'Excellent', color: 'purple' },
            good: { min: 8, label: 'Good', color: 'green' },
            fair: { min: 5, label: 'Fair', color: 'yellow' },
            poor: { min: 0, label: 'Poor', color: 'red' }
          },
          cashFlow: {
            excellent: { min: 2000, label: 'Strong', color: 'green' },
            good: { min: 500, label: 'Good', color: 'green' },
            fair: { min: 0, label: 'Fair', color: 'yellow' },
            poor: { min: -Infinity, label: 'Negative', color: 'red' }
          },
          breakEven: {
            excellent: { max: 60, label: 'Excellent', color: 'purple' },
            good: { max: 70, label: 'Good', color: 'green' },
            fair: { max: 80, label: 'Fair', color: 'yellow' },
            poor: { max: 100, label: 'Risky', color: 'red' }
          }
        };

        const metricRatings = ratings[metric];
        let rating = metricRatings.poor;

        if (metric === 'breakEven') {
          // For break-even, lower is better
          if (value <= metricRatings.excellent.max) rating = metricRatings.excellent;
          else if (value <= metricRatings.good.max) rating = metricRatings.good;
          else if (value <= metricRatings.fair.max) rating = metricRatings.fair;
        } else {
          // For other metrics, higher is better
          if (value >= metricRatings.excellent.min) rating = metricRatings.excellent;
          else if (value >= metricRatings.good.min) rating = metricRatings.good;
          else if (value >= metricRatings.fair.min) rating = metricRatings.fair;
        }

        return rating;
      }

      // Function to update a single indicator
      function updateIndicator(indicatorId, rating) {
        const indicator = document.getElementById(indicatorId);
        if (!indicator) return;

        // Update colors and text
        indicator.className = \`inline-flex items-center gap-1 px-2 py-1 bg-\${rating.color}-100 text-\${rating.color}-700 rounded-full text-xs font-medium mt-2\`;
        indicator.innerHTML = \`
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            \${getIndicatorIcon(rating.color)}
          </svg>
          \${rating.label}
        \`;
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

      // Initialize indicators
      setTimeout(() => {
        updateMetricIndicators();
      }, 200);
    </script>

    <!-- Styles -->
    ${financialCalculatorStyles}

    <style>
      .revenue-chart-container {
        height: 250px;
        position: relative;
      }
    </style>
  `;
};

function generateMetricWithIndicator(label, value, metricType, numericValue) {
  const tooltips = {
    capRate: 'The property\'s annual return if purchased with cash.<br><br>Formula: (Annual Net Income ÷ Property Price) × 100<br><br>Higher cap rates indicate better cash flow relative to price. 8%+ is generally considered good.',
    roi: 'Your total annual return including equity buildup.<br><br>Includes: Cash flow + mortgage principal paydown + appreciation<br><br>12%+ ROI is excellent for real estate investments.',
    cashFlow: 'Net profit after all monthly expenses and mortgage.<br><br>Formula: Monthly Revenue - All Expenses - Mortgage Payment<br><br>Positive cash flow means immediate monthly profit.',
    breakEven: 'Minimum occupancy needed to cover all expenses.<br><br>Formula: (Total Expenses ÷ Maximum Revenue) × 100<br><br>Lower is better - 68% means you profit even with 32% vacancy.'
  };

  return `
    <div class="text-center">
      <div id="${metricType}Value" class="text-2xl font-bold text-blue-600">${value}</div>
      <div class="text-sm text-gray-600 flex items-center justify-center">
        ${label}
        <div class="tooltip">
          <span class="help-icon">?</span>
          <span class="tooltiptext">
            ${tooltips[metricType]}
          </span>
        </div>
      </div>
      <div id="${metricType}Indicator" class="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        Loading...
      </div>
    </div>
  `;
}

// Export helper function to convert analysis data
export const FinancialSummaryFromAnalysis = ({ analysis }) => {
  return EnhancedFinancialSummary({ analysis });
};