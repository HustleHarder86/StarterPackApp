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
          ${generateExpenseRow('Monthly Mortgage', 'mortgage', expenseValues.mortgage, dataSources.mortgage, actualPropertyData, actualCosts)}
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
          ${generateExpenseRow('Property Tax', 'propertyTax', expenseValues.propertyTax, dataSources.propertyTax, actualPropertyData, actualCosts)}
          ${generateExpenseRow('Insurance', 'insurance', expenseValues.insurance, dataSources.insurance, actualPropertyData, actualCosts)}
          ${generateExpenseRow('HOA/Condo Fees', 'hoaFees', expenseValues.hoaFees, dataSources.hoaFees, actualPropertyData, actualCosts)}
          ${generateExpenseRow('Property Management (10%)', 'propertyMgmt', expenseValues.propertyMgmt, dataSources.propertyMgmt, actualPropertyData, actualCosts)}
          ${generateExpenseRow('Utilities', 'utilities', expenseValues.utilities, dataSources.utilities, actualPropertyData, actualCosts)}
          ${generateExpenseRow('Cleaning & Turnover', 'cleaning', expenseValues.cleaning, dataSources.cleaning, actualPropertyData, actualCosts)}
          ${generateExpenseRow('Maintenance & Repairs', 'maintenance', expenseValues.maintenance, dataSources.maintenance, actualPropertyData, actualCosts)}
          ${generateExpenseRow('Supplies & Amenities', 'supplies', expenseValues.supplies, dataSources.supplies, actualPropertyData, actualCosts)}
          ${generateExpenseRow('Platform Fees (3%)', 'platformFees', expenseValues.platformFees, dataSources.platformFees, actualPropertyData, actualCosts)}
          ${generateExpenseRow('Other Expenses', 'otherExpenses', expenseValues.otherExpenses, dataSources.otherExpenses, actualPropertyData, actualCosts)}
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

function generateExpenseRow(label, id, value, source, propertyData = {}, costs = {}) {
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

  // Get detailed calculation explanation based on expense type
  const getCalculationDetails = () => {
    const propertyValue = propertyData?.price || 850000;
    const monthlyRevenue = window.analysisData?.strRevenue || 5400;
    
    switch(id) {
      case 'mortgage':
        const loanAmount = propertyValue - (propertyValue * 0.2);
        return `<strong>Mortgage calculation:</strong><br>
                Property price: $${propertyValue.toLocaleString()}<br>
                Down payment: $${(propertyValue * 0.2).toLocaleString()} (20%)<br>
                Loan amount: $${loanAmount.toLocaleString()}<br>
                Interest rate: 6.5% annually<br>
                Term: 30 years (360 months)<br>
                <br>
                Uses standard amortization formula<br>
                Monthly payment: $${value}`;
                
      case 'propertyTax':
        if (source === 'actual') {
          return `<strong>From Realtor.ca listing:</strong><br>
                  Annual tax: $${(propertyData?.propertyTaxes || costs?.property_tax_annual || 0).toLocaleString()}<br>
                  Monthly: Annual ÷ 12 = $${value}`;
        } else if (source === 'market') {
          const rate = costs?.property_tax_rate || 0.01;
          return `<strong>Based on local tax rates:</strong><br>
                  Property value: $${propertyValue.toLocaleString()}<br>
                  Tax rate: ${(rate * 100).toFixed(2)}%<br>
                  Annual: $${propertyValue} × ${(rate * 100).toFixed(2)}% = $${(propertyValue * rate).toLocaleString()}<br>
                  Monthly: $${Math.round(propertyValue * rate / 12)}`;
        } else {
          return `<strong>Estimated calculation:</strong><br>
                  Default rate: 1% of property value<br>
                  $${propertyValue.toLocaleString()} × 1% ÷ 12 months`;
        }
        
      case 'insurance':
        const propertyType = propertyData?.propertyType || 'House';
        const insuranceRate = propertyType.toLowerCase().includes('condo') ? 0.0025 : 0.0035;
        const annualInsurance = Math.round(propertyValue * insuranceRate);
        const monthlyInsurance = Math.round(annualInsurance / 12);
        return `<strong>${source === 'market' ? 'Market average' : 'Estimated'} calculation:</strong><br>
                Property type: ${propertyType}<br>
                Property value: $${propertyValue.toLocaleString()}<br>
                Insurance rate: ${(insuranceRate * 100).toFixed(2)}% annually<br>
                ${propertyType.toLowerCase().includes('condo') ? '(Lower rate for condos - building structure covered by strata)<br>' : '(Higher rate for houses - full coverage needed)<br>'}
                Annual premium: $${annualInsurance.toLocaleString()}<br>
                Monthly cost: $${annualInsurance} ÷ 12 = $${value}`;
                
      case 'hoaFees':
        if (source === 'actual') {
          return `<strong>From Realtor.ca listing:</strong><br>
                  Monthly condo/HOA fees: $${propertyData?.condoFees || 0}<br>
                  ${propertyData?.condoFees === 0 ? '(No fees for this property)' : ''}`;
        } else if (propertyData?.propertyType === 'House') {
          return `<strong>Property type: House</strong><br>
                  Most houses don't have HOA fees<br>
                  Set to $0`;
        } else {
          return `<strong>Estimated for ${propertyData?.propertyType || 'Condo'}:</strong><br>
                  Based on typical fees for similar properties<br>
                  Factors: building age, amenities, location`;
        }
        
      case 'propertyMgmt':
        return `<strong>Industry standard calculation:</strong><br>
                Monthly revenue: $${monthlyRevenue.toLocaleString()}<br>
                Management fee: 10% of revenue<br>
                $${monthlyRevenue} × 10% = $${value}`;
                
      case 'utilities':
        if (source === 'market') {
          const baseUtilities = Math.round(value / 1.4);
          return `<strong>Market average for STR:</strong><br>
                  Includes: electricity, gas, water, internet<br>
                  STR utilities are ~40% higher than long-term rentals<br>
                  Base LTR cost: $${baseUtilities}/month<br>
                  STR cost: $${baseUtilities} × 1.4 = $${value}/month`;
        } else {
          const sqft = propertyData?.sqft || 'Unknown';
          const perSqft = sqft && sqft !== 'Unknown' ? (value / sqft).toFixed(2) : 'N/A';
          return `<strong>Estimated based on property size:</strong><br>
                  Property size: ${sqft} sq ft<br>
                  Utility cost: $${value}/month<br>
                  ${perSqft !== 'N/A' ? `Cost per sq ft: $${perSqft}<br>` : ''}
                  Includes higher usage for STR guests`;
        }
        
      case 'cleaning':
        const bedrooms = propertyData?.bedrooms || 3;
        const cleaningFee = bedrooms <= 2 ? 75 : bedrooms <= 3 ? 100 : 125;
        // Calculate turnovers based on actual cleaning expense and fee
        const turnovers = Math.round(value / cleaningFee);
        const occupancyRate = 0.70; // 70% occupancy
        const occupiedDays = Math.round(30 * occupancyRate); // ~21 days
        const avgStayLength = turnovers > 0 ? Math.round(occupiedDays / turnovers) : 6;
        
        return `<strong>Airbnb cleaning costs:</strong><br>
                Property: ${bedrooms} bedrooms<br>
                Cleaning fee per turnover: $${cleaningFee}<br>
                Monthly expense: $${value}<br>
                Est. turnovers/month: ${turnovers}<br>
                (Based on ${Math.round(occupancyRate * 100)}% occupancy, ~${avgStayLength} days avg stay)`;
                
      case 'maintenance':
        const maintenanceRate = source === 'market' ? 0.015 : 0.01;
        return `<strong>${source === 'market' ? 'Market rate' : 'Estimated'} for STR:</strong><br>
                ${(maintenanceRate * 100).toFixed(1)}% of property value annually<br>
                Higher wear from frequent guests<br>
                Annual: $${Math.round(propertyValue * maintenanceRate).toLocaleString()}<br>
                Monthly: $${value}`;
                
      case 'supplies':
        return `<strong>STR supplies calculation:</strong><br>
                Monthly revenue: $${monthlyRevenue.toLocaleString()}<br>
                Supplies rate: 4% of revenue<br>
                Includes: toiletries, linens, consumables<br>
                $${monthlyRevenue} × 4% = $${value}`;
                
      case 'platformFees':
        return `<strong>Airbnb host service fee:</strong><br>
                Monthly revenue: $${monthlyRevenue.toLocaleString()}<br>
                Platform fee: 3% of bookings<br>
                $${monthlyRevenue} × 3% = $${value}`;
                
      case 'otherExpenses':
        return `<strong>Miscellaneous STR expenses:</strong><br>
                • Guest communication tools<br>
                • Extra insurance coverage<br>
                • Minor repairs & replacements<br>
                Estimated: $${value}/month`;
                
      default:
        return 'Calculation details not available';
    }
  };

  return `
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600 flex items-center">
        ${label}
        <span class="text-xs text-${sourceColors[source]}-600 ml-1" title="Data source">• ${sourceLabels[source]}</span>
        <div class="tooltip inline-block ml-1">
          <span class="help-icon text-gray-400 hover:text-gray-600 cursor-help">?</span>
          <span class="tooltiptext">
            ${getCalculationDetails()}
          </span>
        </div>
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
  width: 320px;
  background-color: #1f2937;
  color: #fff;
  text-align: left;
  border-radius: 8px;
  padding: 12px 16px;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 50%;
  margin-left: -160px;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
  line-height: 1.6;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.tooltip .tooltiptext strong {
  color: #fbbf24;
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
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