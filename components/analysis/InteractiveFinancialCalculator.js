/**
 * Interactive Financial Calculator Component
 * Allows users to edit expense values and see real-time calculations
 */

import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';

export const InteractiveFinancialCalculator = ({
  monthlyRevenue = 5400,
  expenses = {},
  propertyPrice = 850000,
  downPayment = 170000,
  propertyData = {},
  costs = {},
  onUpdate = () => {},
  className = ''
}) => {
  // Ensure we have propertyData from any available source
  const actualPropertyData = propertyData || window.analysisData?.propertyData || window.extractedPropertyData || {};
  const actualCosts = costs || window.analysisData?.costs || {};
  // Calculate mortgage payment
  const loanAmount = propertyPrice - downPayment;
  const interestRate = 0.065 / 12; // 6.5% annual rate / 12 months
  const loanTermMonths = 30 * 12; // 30 years
  const mortgagePayment = costs?.mortgage_payment || Math.round(
    loanAmount * (interestRate * Math.pow(1 + interestRate, loanTermMonths)) / 
    (Math.pow(1 + interestRate, loanTermMonths) - 1)
  );
  
  // Calculate expense values with priority for actual data
  const expenseValues = {
    mortgage: mortgagePayment,
    propertyTax: (() => {
      // Priority: 1) Actual property taxes from listing, 2) Costs from API, 3) Calculated default
      if (actualPropertyData?.propertyTaxes || actualPropertyData?.property_taxes) {
        const annualTax = actualPropertyData.propertyTaxes || actualPropertyData.property_taxes;
        return Math.round(annualTax / 12); // Convert annual to monthly
      } else if (actualCosts?.property_tax_annual) {
        return Math.round(actualCosts.property_tax_annual / 12);
      } else {
        return expenses.propertyTax || 708; // Fall back to provided or default
      }
    })(),
    insurance: expenses.insurance || 250,
    hoaFees: (() => {
      // Check if condoFees exists (including 0 value)
      if ('condoFees' in actualPropertyData) return actualPropertyData.condoFees;
      if ('condo_fees' in actualPropertyData) return actualPropertyData.condo_fees;
      if ('hoa_monthly' in actualCosts) return actualCosts.hoa_monthly;
      return expenses.hoaFees || 0; // Default to 0, not 450
    })(),
    propertyMgmt: expenses.propertyMgmt || 540,
    utilities: actualCosts?.utilities_monthly || expenses.utilities || 200,
    cleaning: expenses.cleaning || 400,
    maintenance: (() => {
      if (actualCosts?.maintenance_annual) {
        return Math.round(actualCosts.maintenance_annual / 12);
      }
      return expenses.maintenance || 300;
    })(),
    supplies: expenses.supplies || 150,
    platformFees: expenses.platformFees || 162,
    otherExpenses: expenses.otherExpenses || 140
  };
  
  // Determine data sources based on what's available
  const dataSources = {
    mortgage: 'calculated',
    propertyTax: (() => {
      // Check calculation_method from API first
      if (actualCosts?.calculation_method === 'actual_data') return 'actual';
      // Then check for actual property data
      if (actualPropertyData?.propertyTaxes || actualPropertyData?.property_taxes) return 'actual';
      // Then check if we have API-calculated costs
      if (actualCosts?.property_tax_annual) return 'market';
      // Default to estimated
      return 'estimated';
    })(),
    insurance: actualCosts?.insurance_annual ? 'market' : 'estimated',
    hoaFees: (() => {
      // Check if we have actual condo fees from property data
      if ('condoFees' in actualPropertyData || 'condo_fees' in actualPropertyData) return 'actual';
      // Check if calculation method indicates actual data was used
      if (actualCosts?.calculation_method === 'actual_data' && actualCosts?.hoa_monthly !== undefined) return 'actual';
      // Check if we have market data
      if ('hoa_monthly' in actualCosts) return 'market';
      // Default to estimated
      return 'estimated';
    })(),
    propertyMgmt: 'calculated',
    utilities: actualCosts?.utilities_monthly ? 'market' : 'estimated',
    cleaning: 'airbnb',
    maintenance: actualCosts?.maintenance_annual ? 'market' : 'estimated',
    supplies: 'calculated',
    platformFees: 'airbnb',
    otherExpenses: 'estimated'
  };
  
  // Log for debugging
  console.log('=== InteractiveFinancialCalculator Debug ===');
  console.log('propertyData received:', propertyData);
  console.log('actualPropertyData found:', actualPropertyData);
  console.log('  - propertyTaxes:', actualPropertyData?.propertyTaxes || actualPropertyData?.property_taxes);
  console.log('  - condoFees:', actualPropertyData?.condoFees || actualPropertyData?.condo_fees);
  console.log('  - propertyType:', actualPropertyData?.propertyType || actualPropertyData?.property_type);
  console.log('costs received:', costs);
  console.log('actualCosts found:', actualCosts);
  console.log('  - property_tax_annual:', actualCosts?.property_tax_annual);
  console.log('  - hoa_monthly:', actualCosts?.hoa_monthly);
  console.log('Calculated expense values:');
  console.log('  - propertyTax:', expenseValues.propertyTax, '(source:', dataSources.propertyTax, ')');
  console.log('  - hoaFees:', expenseValues.hoaFees, '(source:', dataSources.hoaFees, ')');
  console.log('==========================================');

  return Card({
    children: `
      <div class="flex items-center justify-between mb-lg">
        <h3 class="text-xl font-bold text-gray-900">Financial Calculator</h3>
        <button onclick="resetCalculator()" class="text-sm text-blue-600 hover:text-blue-800">Reset to defaults</button>
      </div>
      
      <!-- Revenue Section -->
      <div class="mb-xl">
        <div class="flex items-center justify-between mb-md">
          <span class="font-medium text-gray-700">Monthly Revenue</span>
          <div class="flex items-center">
            <span class="text-gray-500 mr-1">$</span>
            <input type="number" id="monthlyRevenue" value="${monthlyRevenue}" 
                   class="w-24 px-2 py-1 border border-gray-300 rounded text-right font-bold text-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   onchange="updateFinancialCalculations()">
          </div>
        </div>
      </div>

      <!-- Mortgage Payment Section -->
      <div class="mb-lg">
        <div class="flex items-center justify-between mb-md">
          <span class="font-medium text-gray-700">Mortgage Payment</span>
          <span class="text-xs text-gray-500">
            20% down • 6.5% interest • 30 years
          </span>
        </div>
        <div class="pl-lg">
          ${generateExpenseRow('Monthly Mortgage', 'mortgage', expenseValues.mortgage, dataSources.mortgage)}
        </div>
      </div>

      <!-- Operating Expenses Section -->
      <div class="mb-lg">
        <div class="flex items-center justify-between mb-md">
          <span class="font-medium text-gray-700">Operating Expenses</span>
          <span class="text-xs text-gray-500">
            ${(propertyData?.propertyTaxes || propertyData?.condoFees) ? 
              '<span class="text-green-600 font-semibold">✓ Using actual listing data</span> • ' : 
              ''}
            Realtor.ca listing • Airbnb market data • AI estimates
          </span>
        </div>
        <div class="space-y-3 pl-lg">
          ${generateExpenseRow('Property Tax', 'propertyTax', expenseValues.propertyTax, dataSources.propertyTax)}
          ${generateExpenseRow('Insurance', 'insurance', expenseValues.insurance, dataSources.insurance)}
          ${generateExpenseRow('HOA/Condo Fees', 'hoaFees', expenseValues.hoaFees, dataSources.hoaFees)}
          ${generateExpenseRow('Property Management (10%)', 'propertyMgmt', expenseValues.propertyMgmt, dataSources.propertyMgmt)}
          ${generateExpenseRow('Utilities', 'utilities', expenseValues.utilities, dataSources.utilities)}
          ${generateExpenseRow('Cleaning & Turnover', 'cleaning', expenseValues.cleaning, dataSources.cleaning)}
          ${generateExpenseRow('Maintenance & Repairs', 'maintenance', expenseValues.maintenance, dataSources.maintenance)}
          ${generateExpenseRow('Supplies & Amenities', 'supplies', expenseValues.supplies, dataSources.supplies)}
          ${generateExpenseRow('Platform Fees (3%)', 'platformFees', expenseValues.platformFees, dataSources.platformFees)}
          ${generateExpenseRow('Other Expenses', 'otherExpenses', expenseValues.otherExpenses, dataSources.otherExpenses)}
        </div>
        
        <!-- Total Expenses -->
        <div class="flex items-center justify-between mt-md pt-md border-t border-gray-200">
          <span class="font-medium text-gray-700">Total Expenses</span>
          <span id="totalExpenses" class="font-bold text-red-600">-$3,300</span>
        </div>
      </div>

      <!-- Summary Section -->
      <div class="space-y-md mt-xl pt-lg border-t-2 border-gray-200">
        ${generateSummaryRow('Monthly Net Cash Flow', 'netCashFlow', '+$2,100', 'green', 
          'The amount of money left over each month after all expenses are paid.<br><br>Formula: Monthly Revenue - Monthly Expenses<br><br>A positive cash flow means the property generates profit each month.')}
        ${generateSummaryRow('Annual Net Income', 'annualIncome', '$25,200', 'green',
          'Your total profit for the year after all expenses.<br><br>Formula: Monthly Net Cash Flow × 12<br><br>This is the actual money you\'ll receive annually from the property.')}
        ${generateSummaryRow('Cash-on-Cash Return', 'cashReturn', '14.8%', 'blue',
          'The annual return on your actual cash investment.<br><br>Formula: (Annual Net Income ÷ Cash Invested) × 100<br><br>Example: If you put $170k down and earn $25k/year, that\'s a 14.8% return on your cash.')}
      </div>
      
      <!-- Data Sources Legend -->
      <div class="mt-lg p-md bg-gray-50 rounded-lg space-y-2">
        <p class="text-xs text-gray-700 font-medium">Data Sources:</p>
        <div class="flex flex-wrap gap-3 text-xs">
          <span class="flex items-center gap-1">
            <span class="text-green-600">• actual</span>
            <span class="text-gray-600">From property listing</span>
          </span>
          <span class="flex items-center gap-1">
            <span class="text-blue-600">• market avg</span>
            <span class="text-gray-600">Airbnb data</span>
          </span>
          <span class="flex items-center gap-1">
            <span class="text-orange-600">• estimated</span>
            <span class="text-gray-600">AI calculation</span>
          </span>
        </div>
        
        ${(propertyData?.propertyTaxes || propertyData?.condoFees) ? `
          <div class="mt-3 p-3 bg-green-50 rounded-lg">
            <p class="text-xs text-green-800">
              <strong>✓ Using actual data from Realtor.ca listing:</strong><br>
              ${propertyData.propertyTaxes ? `• Property taxes: $${propertyData.propertyTaxes.toLocaleString()}/year` : ''}
              ${propertyData.propertyTaxes && propertyData.condoFees ? '<br>' : ''}
              ${propertyData.condoFees ? `• Condo fees: $${propertyData.condoFees.toLocaleString()}/month` : ''}
            </p>
          </div>
        ` : ''}
        
        <p class="text-xs text-gray-600 italic mt-2">💡 All values are editable - adjust to match your specific situation</p>
      </div>
    `,
    className: `${className}`,
    elevated: true
  });
};

function generateExpenseRow(label, id, value, source) {
  const sourceColors = {
    actual: 'green',
    market: 'blue',
    airbnb: 'blue',
    calculated: 'purple',
    estimated: 'orange'
  };
  
  const sourceLabels = {
    actual: 'actual',
    market: 'market avg',
    airbnb: 'Airbnb',
    calculated: 'calculated',
    estimated: 'estimated'
  };

  return `
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600">
        ${label}
        <span class="text-xs text-${sourceColors[source]}-600 ml-1" title="Data source">• ${sourceLabels[source]}</span>
      </span>
      <div class="flex items-center">
        <span class="text-gray-400 text-sm mr-1">$</span>
        <input type="number" id="${id}" value="${value}" 
               class="w-20 px-2 py-1 border border-gray-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
               onchange="updateFinancialCalculations()">
      </div>
    </div>
  `;
}

function generateSummaryRow(label, id, value, color, tooltip) {
  return `
    <div class="flex justify-between items-center">
      <span class="font-semibold text-gray-900 flex items-center">
        ${label}
        <div class="tooltip inline-block ml-1">
          <span class="help-icon">?</span>
          <span class="tooltiptext">
            ${tooltip}
          </span>
        </div>
      </span>
      <span id="${id}" class="font-bold text-${color}-600 text-lg">${value}</span>
    </div>
  `;
}

// Export empty script since we're handling initialization separately
export const financialCalculatorScript = '';

// Export helper function to inject calculator styles
export const financialCalculatorStyles = `
<style>
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 280px;
  background-color: #1f2937;
  color: #fff;
  text-align: left;
  border-radius: 8px;
  padding: 12px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -140px;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
  line-height: 1.5;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.tooltip .tooltiptext::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #1f2937 transparent transparent transparent;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background-color: #e5e7eb;
  color: #6b7280;
  border-radius: 50%;
  font-size: 11px;
  cursor: help;
  margin-left: 4px;
}

.help-icon:hover {
  background-color: #d1d5db;
  color: #4b5563;
}
</style>
`;