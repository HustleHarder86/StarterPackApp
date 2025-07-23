/**
 * Long-Term Rental Financial Calculator Component
 * Interactive calculator without STR-specific expenses
 */

import { Card } from '../ui/Card.js';

export const LongTermRentalCalculator = ({
  monthlyRevenue = 3100,
  expenses = {},
  propertyPrice = 850000,
  downPayment = 170000,
  propertyData = {},
  costs = {},
  className = ''
}) => {
  // Ensure we have propertyData from any available source
  const actualPropertyData = propertyData || window.analysisData?.propertyData || {};
  const actualCosts = costs || window.analysisData?.costs || {};
  
  // Calculate mortgage payment
  const loanAmount = propertyPrice - downPayment;
  const interestRate = 0.065 / 12; // 6.5% annual rate / 12 months
  const loanTermMonths = 30 * 12; // 30 years
  const mortgagePayment = costs?.mortgage_payment || Math.round(
    loanAmount * (interestRate * Math.pow(1 + interestRate, loanTermMonths)) / 
    (Math.pow(1 + interestRate, loanTermMonths) - 1)
  );
  
  // Calculate expense values for LTR (no STR-specific expenses)
  const expenseValues = {
    mortgage: mortgagePayment,
    propertyTax: (() => {
      if (actualPropertyData?.propertyTaxes || actualPropertyData?.property_taxes) {
        const annualTax = actualPropertyData.propertyTaxes || actualPropertyData.property_taxes;
        return Math.round(annualTax / 12);
      } else if (actualCosts?.property_tax_annual) {
        return Math.round(actualCosts.property_tax_annual / 12);
      } else {
        return expenses.propertyTax || 458;
      }
    })(),
    insurance: expenses.insurance || 200, // Lower for LTR
    hoaFees: (() => {
      if ('condoFees' in actualPropertyData) return actualPropertyData.condoFees;
      if ('condo_fees' in actualPropertyData) return actualPropertyData.condo_fees;
      if ('hoa_monthly' in actualCosts) return actualCosts.hoa_monthly;
      return expenses.hoaFees || 0;
    })(),
    propertyMgmt: expenses.propertyMgmt || Math.round(monthlyRevenue * 0.08), // 8% for LTR
    maintenance: (() => {
      if (actualCosts?.maintenance_annual) {
        return Math.round(actualCosts.maintenance_annual / 12);
      }
      return expenses.maintenance || 250; // Lower for LTR
    })(),
    vacancy: Math.round(monthlyRevenue * 0.05), // 5% vacancy allowance
    otherExpenses: expenses.otherExpenses || 100
  };
  
  // Determine data sources
  const dataSources = {
    mortgage: 'calculated',
    propertyTax: (() => {
      if (actualCosts?.calculation_method === 'actual_data') return 'actual';
      if (actualPropertyData?.propertyTaxes || actualPropertyData?.property_taxes) return 'actual';
      if (actualCosts?.property_tax_annual) return 'market';
      return 'estimated';
    })(),
    insurance: actualCosts?.insurance_annual ? 'market' : 'estimated',
    hoaFees: (() => {
      if ('condoFees' in actualPropertyData || 'condo_fees' in actualPropertyData) return 'actual';
      if (actualCosts?.calculation_method === 'actual_data' && actualCosts?.hoa_monthly !== undefined) return 'actual';
      if ('hoa_monthly' in actualCosts) return 'market';
      return 'estimated';
    })(),
    propertyMgmt: 'calculated',
    maintenance: actualCosts?.maintenance_annual ? 'market' : 'estimated',
    vacancy: 'calculated',
    otherExpenses: 'estimated'
  };

  return Card({
    children: `
      <div class="flex items-center justify-between mb-lg">
        <h3 class="text-xl font-bold text-gray-900">Long-Term Rental Calculator</h3>
        <button onclick="resetLTRCalculator()" class="text-sm text-blue-600 hover:text-blue-800">Reset to defaults</button>
      </div>
      
      <!-- Revenue Section -->
      <div class="mb-xl">
        <div class="flex items-center justify-between mb-md">
          <span class="font-medium text-gray-700">Monthly Rent</span>
          <div class="flex items-center">
            <span class="text-gray-500 mr-1">$</span>
            <input type="number" id="ltrMonthlyRevenue" value="${monthlyRevenue}" 
                   class="w-24 px-2 py-1 border border-gray-300 rounded text-right font-bold text-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                   onchange="updateLTRCalculations()">
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
          ${generateLTRExpenseRow('Monthly Mortgage', 'ltrMortgage', expenseValues.mortgage, dataSources.mortgage, actualPropertyData, actualCosts)}
        </div>
      </div>

      <!-- Operating Expenses Section -->
      <div class="mb-lg">
        <div class="flex items-center justify-between mb-md">
          <span class="font-medium text-gray-700">Operating Expenses</span>
          <span class="text-xs text-gray-500">
            ${(propertyData?.propertyTaxes || propertyData?.condoFees) ? 
              '<span class="text-green-600 font-semibold">✓ Using actual listing data</span>' : 
              'Market estimates'
            }
          </span>
        </div>
        <div class="space-y-3 pl-lg">
          ${generateLTRExpenseRow('Property Tax', 'ltrPropertyTax', expenseValues.propertyTax, dataSources.propertyTax, actualPropertyData, actualCosts)}
          ${generateLTRExpenseRow('Insurance', 'ltrInsurance', expenseValues.insurance, dataSources.insurance, actualPropertyData, actualCosts)}
          ${generateLTRExpenseRow('HOA/Condo Fees', 'ltrHoaFees', expenseValues.hoaFees, dataSources.hoaFees, actualPropertyData, actualCosts)}
          ${generateLTRExpenseRow('Property Management (8%)', 'ltrPropertyMgmt', expenseValues.propertyMgmt, dataSources.propertyMgmt, actualPropertyData, actualCosts)}
          ${generateLTRExpenseRow('Maintenance & Repairs', 'ltrMaintenance', expenseValues.maintenance, dataSources.maintenance, actualPropertyData, actualCosts)}
          ${generateLTRExpenseRow('Vacancy Allowance (5%)', 'ltrVacancy', expenseValues.vacancy, dataSources.vacancy, actualPropertyData, actualCosts)}
          ${generateLTRExpenseRow('Other Expenses', 'ltrOtherExpenses', expenseValues.otherExpenses, dataSources.otherExpenses, actualPropertyData, actualCosts)}
        </div>
        
        <!-- Total Expenses -->
        <div class="flex items-center justify-between mt-md pt-md border-t border-gray-200">
          <span class="font-medium text-gray-700">Total Expenses</span>
          <span id="ltrTotalExpenses" class="font-bold text-red-600">-$3,300</span>
        </div>
      </div>

      <!-- Summary Section -->
      <div class="space-y-md mt-xl pt-lg border-t-2 border-gray-200">
        ${generateLTRSummaryRow('Monthly Net Cash Flow', 'ltrNetCashFlow', '+$2,100', 'green', 
          'Monthly rent minus all expenses.<br><br>Formula: Monthly Rent - Total Expenses<br><br>Positive cash flow means immediate monthly profit.')}
        ${generateLTRSummaryRow('Annual Net Income', 'ltrAnnualIncome', '$25,200', 'green',
          'Your total profit for the year.<br><br>Formula: Monthly Net Cash Flow × 12<br><br>This is your annual return from the rental property.')}
        ${generateLTRSummaryRow('Cash-on-Cash Return', 'ltrCashReturn', '14.8%', 'blue',
          'Return on your cash investment.<br><br>Formula: (Annual Net Income ÷ Down Payment) × 100<br><br>Measures the efficiency of your invested capital.')}
      </div>
      
      <!-- Data Sources Legend -->
      <div class="mt-lg p-md bg-gray-50 rounded-lg">
        <p class="text-xs text-gray-700 font-medium mb-2">Data Sources:</p>
        <div class="flex flex-wrap gap-3 text-xs">
          <span class="flex items-center gap-1">
            <span class="text-green-600">• actual</span>
            <span class="text-gray-600">From property listing</span>
          </span>
          <span class="flex items-center gap-1">
            <span class="text-blue-600">• market avg</span>
            <span class="text-gray-600">Local market data</span>
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

function generateLTRExpenseRow(label, id, value, source, propertyData = {}, costs = {}) {
  const sourceColors = {
    actual: 'green',
    market: 'blue',
    calculated: 'purple',
    estimated: 'orange'
  };
  
  const sourceLabels = {
    actual: 'actual',
    market: 'market avg',
    calculated: 'calculated',
    estimated: 'estimated'
  };

  // Get calculation details for LTR expenses
  const getCalculationDetails = () => {
    const propertyValue = propertyData?.price || 850000;
    const monthlyRent = window.analysisData?.ltrMonthlyRent || 3100;
    
    switch(id) {
      case 'ltrMortgage':
        const loanAmount = propertyValue - (propertyValue * 0.2);
        return `<strong>Mortgage calculation:</strong><br>
                Property price: $${propertyValue.toLocaleString()}<br>
                Down payment: $${(propertyValue * 0.2).toLocaleString()} (20%)<br>
                Loan amount: $${loanAmount.toLocaleString()}<br>
                Interest rate: 6.5% annually<br>
                Term: 30 years<br>
                Monthly payment: $${value}`;
                
      case 'ltrPropertyTax':
        if (source === 'actual') {
          return `<strong>From Realtor.ca listing:</strong><br>
                  Annual tax: $${(propertyData?.propertyTaxes || costs?.property_tax_annual || 0).toLocaleString()}<br>
                  Monthly: Annual ÷ 12 = $${value}`;
        } else {
          return `<strong>Estimated calculation:</strong><br>
                  Based on local tax rates<br>
                  Property value × tax rate ÷ 12`;
        }
        
      case 'ltrInsurance':
        return `<strong>Landlord insurance:</strong><br>
                Lower than owner-occupied<br>
                Covers structure and liability<br>
                Tenant has own contents insurance<br>
                Typical cost: $${value}/month`;
                
      case 'ltrPropertyMgmt':
        return `<strong>Property management:</strong><br>
                Monthly rent: $${monthlyRent.toLocaleString()}<br>
                Management fee: 8% (LTR rate)<br>
                $${monthlyRent} × 8% = $${value}<br>
                <em>Optional if self-managing</em>`;
                
      case 'ltrMaintenance':
        return `<strong>Maintenance allowance:</strong><br>
                1% of property value annually<br>
                Lower than STR (less wear)<br>
                Annual: $${Math.round(propertyValue * 0.01).toLocaleString()}<br>
                Monthly: $${value}`;
                
      case 'ltrVacancy':
        return `<strong>Vacancy allowance:</strong><br>
                Covers periods between tenants<br>
                Industry standard: 5% of rent<br>
                $${monthlyRent} × 5% = $${value}<br>
                Saves for turnover periods`;
                
      case 'ltrOtherExpenses':
        return `<strong>Miscellaneous expenses:</strong><br>
                • Legal/accounting fees<br>
                • Advertising for tenants<br>
                • Background checks<br>
                Estimated: $${value}/month`;
                
      default:
        return 'Calculation details not available';
    }
  };

  return `
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600 flex items-center">
        ${label}
        <span class="text-xs text-${sourceColors[source]}-600 ml-1">• ${sourceLabels[source]}</span>
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
               onchange="updateLTRCalculations()">
      </div>
    </div>
  `;
}

function generateLTRSummaryRow(label, id, value, color, tooltip) {
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

// Export calculator script for LTR
export const ltrCalculatorScript = `
<script>
// Ensure window.analysisData exists
if (!window.analysisData) {
  window.analysisData = {};
}

// LTR Calculator functions
function updateLTRCalculations() {
  // Get all input values
  const monthlyRevenue = parseFloat(document.getElementById('ltrMonthlyRevenue')?.value) || 0;
  const mortgage = parseFloat(document.getElementById('ltrMortgage')?.value) || 0;
  const propertyTax = parseFloat(document.getElementById('ltrPropertyTax')?.value) || 0;
  const insurance = parseFloat(document.getElementById('ltrInsurance')?.value) || 0;
  const hoaFees = parseFloat(document.getElementById('ltrHoaFees')?.value) || 0;
  const propertyMgmt = parseFloat(document.getElementById('ltrPropertyMgmt')?.value) || 0;
  const maintenance = parseFloat(document.getElementById('ltrMaintenance')?.value) || 0;
  const vacancy = parseFloat(document.getElementById('ltrVacancy')?.value) || 0;
  const otherExpenses = parseFloat(document.getElementById('ltrOtherExpenses')?.value) || 0;

  // Calculate total expenses
  const totalExpenses = mortgage + propertyTax + insurance + hoaFees + propertyMgmt + 
                       maintenance + vacancy + otherExpenses;

  // Calculate net cash flow
  const netCashFlow = monthlyRevenue - totalExpenses;
  const annualIncome = netCashFlow * 12;

  // Calculate cash-on-cash return
  const downPayment = window.analysisData?.downPayment || 170000;
  const cashReturn = (annualIncome / downPayment) * 100;

  // Update display values
  document.getElementById('ltrTotalExpenses').textContent = '-$' + totalExpenses.toLocaleString();
  document.getElementById('ltrNetCashFlow').textContent = (netCashFlow >= 0 ? '+$' : '-$') + Math.abs(netCashFlow).toLocaleString();
  document.getElementById('ltrAnnualIncome').textContent = '$' + annualIncome.toLocaleString();
  document.getElementById('ltrCashReturn').textContent = cashReturn.toFixed(1) + '%';

  // Update Property Management fee based on revenue (8% for LTR)
  if (document.activeElement?.id !== 'ltrPropertyMgmt') {
    const calculatedMgmt = Math.round(monthlyRevenue * 0.08);
    document.getElementById('ltrPropertyMgmt').value = calculatedMgmt;
  }

  // Update Vacancy allowance based on revenue (5%)
  if (document.activeElement?.id !== 'ltrVacancy') {
    const calculatedVacancy = Math.round(monthlyRevenue * 0.05);
    document.getElementById('ltrVacancy').value = calculatedVacancy;
  }
}

function resetLTRCalculator() {
  // Reset to default LTR values
  document.getElementById('ltrMonthlyRevenue').value = 3100;
  document.getElementById('ltrMortgage').value = 4200;
  document.getElementById('ltrPropertyTax').value = 458;
  document.getElementById('ltrInsurance').value = 200;
  document.getElementById('ltrHoaFees').value = 0;
  document.getElementById('ltrPropertyMgmt').value = 248;
  document.getElementById('ltrMaintenance').value = 250;
  document.getElementById('ltrVacancy').value = 155;
  document.getElementById('ltrOtherExpenses').value = 100;
  
  updateLTRCalculations();
}

// Initialize on load
setTimeout(() => {
  updateLTRCalculations();
}, 100);
</script>
`;