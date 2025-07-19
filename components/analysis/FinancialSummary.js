/**
 * Financial Summary Component
 * Key financial metrics and revenue comparison
 */

import { Card } from '../ui/Card.js';
import { MetricBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';

export const FinancialSummary = ({ 
  strRevenue = 0,
  ltrRevenue = 0,
  monthlyExpenses = 0,
  netCashFlow = 0,
  capRate = 0,
  roi = 0,
  paybackPeriod = 0,
  className = ''
}) => {
  const monthlyDifference = strRevenue - ltrRevenue;
  const revenueAdvantage = ltrRevenue > 0 ? Math.round((monthlyDifference / ltrRevenue) * 100) : 0;
  const annualDifference = monthlyDifference * 12;

  return Card({
    children: `
      <!-- Revenue Comparison Header -->
      <div class="flex items-center justify-between mb-xl">
        <h3 class="text-xl font-bold text-gray-900">Financial Summary</h3>
        <div class="text-right">
          <div class="text-sm text-gray-600">Monthly Advantage</div>
          <div class="text-2xl font-bold text-green-600">+$${monthlyDifference.toLocaleString()}</div>
        </div>
      </div>

      <!-- Revenue Comparison Chart -->
      <div class="bg-gray-50 rounded-xl p-lg mb-xl">
        <h4 class="font-semibold text-gray-900 mb-lg">Revenue Comparison</h4>
        <div class="space-y-md">
          <!-- STR Revenue Bar -->
          <div class="flex items-center justify-between p-md bg-green-50 rounded-lg">
            <div class="flex items-center gap-md">
              <div class="w-4 h-4 bg-green-500 rounded"></div>
              <span class="font-medium text-gray-700">Short-Term Rental</span>
            </div>
            <span class="font-bold text-green-600">$${strRevenue.toLocaleString()}</span>
          </div>
          
          <!-- LTR Revenue Bar -->
          <div class="flex items-center justify-between p-md bg-gray-100 rounded-lg">
            <div class="flex items-center gap-md">
              <div class="w-4 h-4 bg-gray-400 rounded"></div>
              <span class="font-medium text-gray-700">Long-Term Rental</span>
            </div>
            <span class="font-bold text-gray-600">$${ltrRevenue.toLocaleString()}</span>
          </div>
          
          <!-- Difference -->
          <div class="border-t border-gray-200 pt-md">
            <div class="flex items-center justify-between">
              <span class="font-bold text-gray-900">Monthly Difference</span>
              <span class="font-bold text-green-600 text-lg">+$${monthlyDifference.toLocaleString()}</span>
            </div>
            <div class="text-right text-sm text-green-600 mt-xs">
              ${revenueAdvantage > 0 ? `+${revenueAdvantage}% more revenue` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-lg mb-xl">
        <div class="bg-white border border-gray-200 rounded-lg p-lg text-center">
          ${MetricBadge({ 
            label: 'Cap Rate', 
            value: `${capRate}%`,
            trend: capRate >= 8 ? 'up' : capRate <= 4 ? 'down' : null
          })}
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-lg text-center">
          ${MetricBadge({ 
            label: 'Annual ROI', 
            value: `${roi}%`,
            trend: roi >= 12 ? 'up' : roi <= 6 ? 'down' : null
          })}
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-lg text-center">
          ${MetricBadge({ 
            label: 'Net Cash Flow', 
            value: `$${netCashFlow.toLocaleString()}`,
            trend: netCashFlow > 0 ? 'up' : 'down'
          })}
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-lg text-center">
          ${MetricBadge({ 
            label: 'Payback Period', 
            value: `${paybackPeriod}y`,
            trend: paybackPeriod <= 8 ? 'up' : 'down'
          })}
        </div>
      </div>

      <!-- Annual Projection -->
      <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-lg">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-semibold text-gray-900 mb-sm">Annual Revenue Advantage</h4>
            <p class="text-sm text-gray-600">Additional income with STR strategy</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold text-green-600">+$${annualDifference.toLocaleString()}</div>
            <div class="text-sm text-gray-600">per year</div>
          </div>
        </div>
      </div>
    `,
    className,
    elevated: true
  });
};

export const QuickFinancialSummary = ({ 
  strRevenue = 0,
  ltrRevenue = 0,
  netCashFlow = 0,
  roi = 0 
}) => {
  const monthlyDifference = strRevenue - ltrRevenue;
  
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
      <div class="bg-white rounded-xl p-lg shadow-md text-center">
        <div class="text-2xl font-bold text-green-600 mb-xs">$${strRevenue.toLocaleString()}</div>
        <div class="text-sm text-gray-600">STR Revenue</div>
      </div>
      <div class="bg-white rounded-xl p-lg shadow-md text-center">
        <div class="text-2xl font-bold text-blue-600 mb-xs">+$${monthlyDifference.toLocaleString()}</div>
        <div class="text-sm text-gray-600">Monthly Advantage</div>
      </div>
      <div class="bg-white rounded-xl p-lg shadow-md text-center">
        <div class="text-2xl font-bold text-purple-600 mb-xs">$${netCashFlow.toLocaleString()}</div>
        <div class="text-sm text-gray-600">Net Cash Flow</div>
      </div>
      <div class="bg-white rounded-xl p-lg shadow-md text-center">
        <div class="text-2xl font-bold text-orange-600 mb-xs">${roi}%</div>
        <div class="text-sm text-gray-600">Annual ROI</div>
      </div>
    </div>
  `;
};

export const FinancialBreakdown = ({ 
  revenue = {},
  expenses = {},
  className = ''
}) => {
  const totalRevenue = revenue.monthly || 0;
  const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + (expense || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  return Card({
    children: `
      <h4 class="font-bold text-gray-900 mb-lg">Detailed Financial Breakdown</h4>
      
      <!-- Revenue Section -->
      <div class="mb-lg">
        <h5 class="font-semibold text-green-700 mb-md">Monthly Revenue</h5>
        <div class="space-y-sm">
          <div class="flex justify-between items-center py-sm border-b border-gray-100">
            <span class="text-gray-600">Gross Rental Income</span>
            <span class="font-bold text-green-600">$${totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Expenses Section -->
      <div class="mb-lg">
        <h5 class="font-semibold text-red-700 mb-md">Monthly Expenses</h5>
        <div class="space-y-sm">
          ${Object.entries(expenses).map(([category, amount]) => `
            <div class="flex justify-between items-center py-sm border-b border-gray-100">
              <span class="text-gray-600">${formatExpenseCategory(category)}</span>
              <span class="font-bold text-red-600">-$${(amount || 0).toLocaleString()}</span>
            </div>
          `).join('')}
          <div class="flex justify-between items-center py-sm border-b border-gray-200 font-semibold">
            <span class="text-gray-900">Total Expenses</span>
            <span class="font-bold text-red-600">-$${totalExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Net Income -->
      <div class="bg-gray-50 rounded-lg p-lg">
        <div class="flex justify-between items-center">
          <span class="font-bold text-gray-900 text-lg">Net Monthly Income</span>
          <span class="font-bold text-${netIncome >= 0 ? 'green' : 'red'}-600 text-xl">
            ${netIncome >= 0 ? '+' : ''}$${netIncome.toLocaleString()}
          </span>
        </div>
      </div>
    `,
    className
  });
};

export const RevenueComparisonChart = ({ 
  strData = {},
  ltrData = {},
  className = ''
}) => {
  return Card({
    children: `
      <div class="flex items-center justify-between mb-lg">
        <h4 class="font-bold text-gray-900">Revenue Comparison</h4>
        ${Button({
          children: 'View Details',
          variant: 'outline',
          size: 'sm',
          onclick: 'showDetailedFinancials()'
        })}
      </div>
      
      <!-- Chart placeholder - would integrate with Chart.js -->
      <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-lg">
        <canvas id="revenueComparisonChart" width="400" height="200"></canvas>
      </div>
      
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 gap-lg">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">${strData.monthly || 0}</div>
          <div class="text-sm text-gray-600">STR Monthly</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">${ltrData.monthly || 0}</div>
          <div class="text-sm text-gray-600">LTR Monthly</div>
        </div>
      </div>
    `,
    className
  });
};

const formatExpenseCategory = (category) => {
  const categoryMap = {
    property_tax_annual: 'Property Tax (Annual)',
    insurance_annual: 'Insurance (Annual)',
    maintenance_annual: 'Maintenance & Repairs',
    hoa_monthly: 'HOA/Condo Fees',
    utilities_monthly: 'Utilities',
    management_fee: 'Property Management',
    vacancy_allowance: 'Vacancy Allowance',
    cleaning_fee: 'Cleaning & Turnover',
    supplies: 'Supplies & Amenities'
  };
  
  return categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const FinancialSummaryFromAnalysis = ({ analysis }) => {
  if (!analysis) return '';
  
  const strRevenue = analysis.strAnalysis?.monthlyRevenue || 0;
  const ltrRevenue = analysis.longTermRental?.monthlyRent || 0;
  const expenses = analysis.costs || {};
  const monthlyExpenses = Object.values(expenses).reduce((sum, exp) => sum + (exp || 0), 0);
  
  return FinancialSummary({
    strRevenue,
    ltrRevenue,
    monthlyExpenses,
    netCashFlow: strRevenue - monthlyExpenses,
    capRate: analysis.longTermRental?.capRate || 0,
    roi: analysis.longTermRental?.roi || 0,
    paybackPeriod: analysis.paybackPeriod || 0
  });
};