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
  onUpdate = () => {},
  className = ''
}) => {
  // Default expense values
  const defaultExpenses = {
    propertyTax: 708,
    insurance: 250,
    hoaFees: 450,
    propertyMgmt: 540,
    utilities: 200,
    cleaning: 400,
    maintenance: 300,
    supplies: 150,
    platformFees: 162,
    otherExpenses: 140
  };

  // Merge provided expenses with defaults
  const expenseValues = { ...defaultExpenses, ...expenses };

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

      <!-- Operating Expenses Section -->
      <div class="mb-lg">
        <div class="flex items-center justify-between mb-md">
          <span class="font-medium text-gray-700">Operating Expenses</span>
          <span class="text-xs text-gray-500">Sources: Realtor.ca listing • Airbnb market data • AI estimates</span>
        </div>
        <div class="space-y-3 pl-lg">
          ${generateExpenseRow('Property Tax', 'propertyTax', expenseValues.propertyTax, 'actual')}
          ${generateExpenseRow('Insurance', 'insurance', expenseValues.insurance, 'estimated')}
          ${generateExpenseRow('HOA/Condo Fees', 'hoaFees', expenseValues.hoaFees, 'actual')}
          ${generateExpenseRow('Property Management (10%)', 'propertyMgmt', expenseValues.propertyMgmt, 'calculated')}
          ${generateExpenseRow('Utilities', 'utilities', expenseValues.utilities, 'estimated')}
          ${generateExpenseRow('Cleaning & Turnover', 'cleaning', expenseValues.cleaning, 'market')}
          ${generateExpenseRow('Maintenance & Repairs', 'maintenance', expenseValues.maintenance, 'estimated')}
          ${generateExpenseRow('Supplies & Amenities', 'supplies', expenseValues.supplies, 'market')}
          ${generateExpenseRow('Platform Fees (3%)', 'platformFees', expenseValues.platformFees, 'airbnb')}
          ${generateExpenseRow('Other Expenses', 'otherExpenses', expenseValues.otherExpenses, 'estimated')}
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

// Export the calculation logic as a separate function
export const financialCalculatorScript = `
<script>
// Default values for reset functionality
const defaultFinancialValues = {
  monthlyRevenue: 5400,
  propertyTax: 708,
  insurance: 250,
  hoaFees: 450,
  propertyMgmt: 540,
  utilities: 200,
  cleaning: 400,
  maintenance: 300,
  supplies: 150,
  platformFees: 162,
  otherExpenses: 140
};

// Update calculations function
function updateFinancialCalculations() {
  // Get all input values
  const monthlyRevenue = parseFloat(document.getElementById('monthlyRevenue').value) || 0;
  const propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
  const insurance = parseFloat(document.getElementById('insurance').value) || 0;
  const hoaFees = parseFloat(document.getElementById('hoaFees').value) || 0;
  const propertyMgmt = parseFloat(document.getElementById('propertyMgmt').value) || 0;
  const utilities = parseFloat(document.getElementById('utilities').value) || 0;
  const cleaning = parseFloat(document.getElementById('cleaning').value) || 0;
  const maintenance = parseFloat(document.getElementById('maintenance').value) || 0;
  const supplies = parseFloat(document.getElementById('supplies').value) || 0;
  const platformFees = parseFloat(document.getElementById('platformFees').value) || 0;
  const otherExpenses = parseFloat(document.getElementById('otherExpenses').value) || 0;

  // Calculate total expenses
  const totalExpenses = propertyTax + insurance + hoaFees + propertyMgmt + 
                       utilities + cleaning + maintenance + supplies + 
                       platformFees + otherExpenses;

  // Calculate net cash flow
  const netCashFlow = monthlyRevenue - totalExpenses;
  const annualIncome = netCashFlow * 12;

  // Calculate cash-on-cash return (assuming 20% down payment on $850,000)
  const downPayment = 850000 * 0.20; // $170,000
  const cashReturn = (annualIncome / downPayment) * 100;

  // Update display values
  document.getElementById('totalExpenses').textContent = '-$' + totalExpenses.toLocaleString();
  document.getElementById('netCashFlow').textContent = (netCashFlow >= 0 ? '+$' : '-$') + Math.abs(netCashFlow).toLocaleString();
  document.getElementById('annualIncome').textContent = '$' + annualIncome.toLocaleString();
  document.getElementById('cashReturn').textContent = cashReturn.toFixed(1) + '%';

  // Update Property Management fee based on revenue (10%)
  if (document.activeElement.id !== 'propertyMgmt') {
    const calculatedMgmt = Math.round(monthlyRevenue * 0.10);
    document.getElementById('propertyMgmt').value = calculatedMgmt;
  }

  // Update Platform fees based on revenue (3%)
  if (document.activeElement.id !== 'platformFees') {
    const calculatedPlatform = Math.round(monthlyRevenue * 0.03);
    document.getElementById('platformFees').value = calculatedPlatform;
  }

  // Update key metrics if they exist
  if (typeof updateMetricIndicators === 'function') {
    updateMetricIndicators();
  }
}

// Reset calculator to default values
function resetCalculator() {
  // Reset all input fields to default values
  Object.entries(defaultFinancialValues).forEach(([field, value]) => {
    const element = document.getElementById(field);
    if (element) {
      element.value = value;
    }
  });

  // Update calculations with default values
  updateFinancialCalculations();
}

// Initialize calculations when component loads
setTimeout(() => {
  updateFinancialCalculations();
}, 100);
</script>
`;

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