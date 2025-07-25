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
  // Calculate initial values for sliders
  const downPaymentPercent = Math.round((downPayment / propertyPrice) * 100);
  const defaultInterestRate = 6.5; // Default interest rate
  // Ensure we have propertyData from any available source
  const actualPropertyData = propertyData || window.analysisData?.propertyData || window.extractedPropertyData || {};
  const actualCosts = costs || window.analysisData?.costs || {};
  // Calculate mortgage payment
  const loanAmount = propertyPrice - downPayment;
  const monthlyInterestRate = 0.065 / 12; // 6.5% annual rate / 12 months
  const loanTermMonths = 30 * 12; // 30 years
  const mortgagePayment = costs?.mortgage_payment || Math.round(
    loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) / 
    (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1)
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
    propertyMgmt: expenses.propertyMgmt || Math.round(monthlyRevenue * 0.10), // 10% of STR revenue
    utilities: actualCosts?.utilities_monthly || expenses.utilities || 200,
    cleaning: expenses.cleaning || 400,
    maintenance: (() => {
      if (actualCosts?.maintenance_annual) {
        return Math.round(actualCosts.maintenance_annual / 12);
      }
      return expenses.maintenance || 300;
    })(),
    supplies: expenses.supplies || Math.round(monthlyRevenue * 0.04), // 4% of revenue
    platformFees: expenses.platformFees || Math.round(monthlyRevenue * 0.03), // 3% of revenue
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
        <button onclick="resetCalculator()" class="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Reset to Defaults
        </button>
      </div>
      
      <!-- Assumptions Panel -->
      <div class="mb-xl p-lg bg-blue-50 rounded-lg border border-blue-200">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="flex-1">
            <h4 class="text-md font-semibold text-blue-900 mb-3">Key Assumptions</h4>
            <p class="text-sm text-blue-800 mb-4">Adjust these values to match your specific financing scenario.</p>
            
            <!-- Editable Assumptions Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <!-- Interest Rate -->
              <div>
                <label class="block text-sm font-medium text-blue-900 mb-1">
                  Mortgage Interest Rate
                </label>
                <div class="flex items-center">
                  <input type="number" 
                         id="interestRateInput" 
                         value="${defaultInterestRate}"
                         min="1" 
                         max="15" 
                         step="0.1"
                         class="w-20 px-2 py-1 border border-blue-300 rounded text-right font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         onchange="updateInterestRate(this.value)">
                  <span class="ml-1 text-blue-900 font-medium">%</span>
                </div>
              </div>
              
              <!-- Down Payment -->
              <div>
                <label class="block text-sm font-medium text-blue-900 mb-1">
                  Down Payment
                </label>
                <div class="flex items-center">
                  <input type="number" 
                         id="downPaymentPercentInput" 
                         value="${downPaymentPercent}"
                         min="5" 
                         max="50" 
                         step="5"
                         class="w-20 px-2 py-1 border border-blue-300 rounded text-right font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         onchange="updateDownPayment(this.value)">
                  <span class="ml-1 text-blue-900 font-medium">%</span>
                  <span class="ml-2 text-sm text-blue-800">($<span id="downPaymentAmount">${downPayment.toLocaleString()}</span>)</span>
                </div>
              </div>
              
              <!-- Amortization Period -->
              <div>
                <label class="block text-sm font-medium text-blue-900 mb-1">
                  Amortization Period
                </label>
                <div class="flex items-center">
                  <input type="number" 
                         id="amortizationPeriod" 
                         value="30"
                         min="0" 
                         max="100" 
                         step="1"
                         class="w-20 px-2 py-1 border border-blue-300 rounded text-right font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         onchange="updateAmortization(this.value)">
                  <span class="ml-1 text-blue-900 font-medium">years</span>
                </div>
              </div>
              
              <!-- Property Management -->
              <div>
                <label class="block text-sm font-medium text-blue-900 mb-1">
                  Property Management Fee
                </label>
                <div class="flex items-center">
                  <input type="number" 
                         id="managementFeeInput" 
                         value="10"
                         min="0" 
                         max="25" 
                         step="1"
                         class="w-20 px-2 py-1 border border-blue-300 rounded text-right font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         onchange="updateManagementFee(this.value)">
                  <span class="ml-1 text-blue-900 font-medium">%</span>
                  <span class="ml-2 text-sm text-blue-800">of revenue</span>
                </div>
              </div>
            </div>
            
            <!-- Additional Assumptions Info -->
            <div class="border-t border-blue-200 pt-3 mt-3">
              <p class="text-xs text-blue-800 font-medium mb-2">Other Fixed Assumptions:</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700">
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span>STR occupancy: 70% average</span>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span>Airbnb platform fee: 3%</span>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span>Insurance: 25% higher for STR</span>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span>Utilities: 40% higher for STR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <span class="text-xs text-gray-500" id="mortgageAssumptions">
            Based on assumptions above
          </span>
        </div>
        <div class="pl-lg">
          ${generateExpenseRow('Monthly Mortgage', 'mortgage', expenseValues.mortgage, dataSources.mortgage, actualPropertyData, actualCosts)}
        </div>
      </div>

      <!-- Operating Expenses Section -->
      <div class="mb-lg">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-md gap-2">
          <span class="font-medium text-gray-700">Operating Expenses</span>
          <span class="text-xs text-gray-500">
            ${(propertyData?.propertyTaxes || propertyData?.condoFees) ? 
              '<span class="text-green-600 font-semibold">✓ Using actual listing data</span> <span class="hidden sm:inline">• </span>' : 
              ''}
            <span class="hidden sm:inline">Realtor.ca listing • Airbnb market data • AI estimates</span>
            <span class="sm:hidden">Multiple data sources</span>
          </span>
        </div>
        <div class="space-y-3 sm:pl-lg">
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
      
      <!-- Calculation Methodology (Collapsible) -->
      <div class="mt-lg">
        <button onclick="toggleMethodology()" class="w-full text-left px-lg py-md bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group">
          <span class="font-medium text-gray-700 group-hover:text-gray-900">📊 Detailed Calculation Methodology</span>
          <svg id="methodologyChevron" class="w-5 h-5 text-gray-500 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div id="methodologyContent" class="hidden mt-md p-lg bg-gray-50 rounded-lg space-y-md">
          <div>
            <h5 class="font-semibold text-gray-900 mb-2">How We Calculate Each Metric:</h5>
            <div class="space-y-3 text-sm text-gray-700">
              <div>
                <strong class="text-gray-900">Cap Rate (Capitalization Rate):</strong>
                <p class="mt-1">Measures the property's return if purchased with cash. Formula: (Annual Net Operating Income ÷ Property Price) × 100. We exclude mortgage payments from this calculation as it represents the property's intrinsic earning power.</p>
              </div>
              <div>
                <strong class="text-gray-900">Cash-on-Cash Return:</strong>
                <p class="mt-1">Your actual return on invested cash. Formula: (Annual Cash Flow After Financing ÷ Initial Cash Investment) × 100. This includes mortgage payments and shows your true ROI.</p>
              </div>
              <div>
                <strong class="text-gray-900">Break-Even Occupancy:</strong>
                <p class="mt-1">The minimum occupancy rate needed to cover all expenses. Formula: (Total Monthly Expenses ÷ Maximum Potential Revenue) × 100. Lower is better - it means you need fewer bookings to be profitable.</p>
              </div>
              <div>
                <strong class="text-gray-900">Property Tax Calculation:</strong>
                <p class="mt-1">We prioritize actual data from property listings. If unavailable, we use local market rates (typically 0.8-1.2% of property value annually). You can override with actual values from your tax assessment.</p>
              </div>
              <div>
                <strong class="text-gray-900">STR-Specific Expenses:</strong>
                <p class="mt-1">Short-term rentals have unique costs: higher insurance (25% premium), frequent cleaning (based on 70% occupancy and 6-day average stays), supplies (4% of revenue), and platform fees (3% for Airbnb).</p>
              </div>
            </div>
          </div>
        </div>
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
        <p class="text-xs text-gray-600 mt-1">📌 Use the sliders above for quick adjustments to interest rate and down payment</p>
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
        const actualRevenue = window.analysisData?.strRevenue || monthlyRevenue;
        return `<strong>Industry standard calculation:</strong><br>
                Monthly STR revenue: $${actualRevenue.toLocaleString()}<br>
                Management fee: 10% of revenue<br>
                $${actualRevenue} × 10% = $${value}<br>
                <br>
                <em>Professional property management for STR typically charges 10-20% of gross revenue</em>`;
                
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
    <div class="flex items-center justify-between expense-row">
      <span class="text-sm text-gray-600 flex items-center flex-wrap">
        <span>${label}</span>
        <span class="text-xs text-${sourceColors[source]}-600 ml-1 whitespace-nowrap" title="Data source">• ${sourceLabels[source]}</span>
        <div class="tooltip inline-block ml-1">
          <span class="help-icon text-gray-400 hover:text-gray-600 cursor-help">?</span>
          <span class="tooltiptext">
            ${getCalculationDetails()}
          </span>
        </div>
      </span>
      <div class="flex items-center flex-shrink-0">
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

/* Responsive tooltip adjustments */
@media (max-width: 768px) {
  .tooltip .tooltiptext {
    width: 240px;
    margin-left: -120px;
    font-size: 11px;
    padding: 10px 12px;
  }
  
  .tooltip .tooltiptext strong {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .tooltip .tooltiptext {
    width: 200px;
    margin-left: -100px;
    bottom: auto;
    top: 125%;
  }
  
  .tooltip .tooltiptext::after {
    bottom: auto;
    top: -10px;
    border-color: transparent transparent #1f2937 transparent;
  }
}

/* Responsive calculator layout */
@media (max-width: 1024px) {
  .expense-row {
    font-size: 0.875rem;
  }
  
  .expense-row input {
    width: 70px;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .expense-row {
    padding: 0.5rem 0;
  }
  
  .expense-row .text-sm {
    font-size: 0.75rem;
  }
  
  .expense-row input {
    width: 60px;
    padding: 0.25rem 0.5rem;
  }
  
  /* Stack expense label and input on very small screens */
  @media (max-width: 480px) {
    .expense-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .expense-row > div:last-child {
      align-self: flex-end;
    }
  }
}

/* Responsive methodology content */
#methodologyContent {
  overflow-x: hidden;
}

@media (max-width: 768px) {
  #methodologyContent {
    padding: 0.75rem;
  }
  
  #methodologyContent .text-sm {
    font-size: 0.75rem;
  }
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

/* Utility classes */
.rotate-180 {
  transform: rotate(180deg);
}
</style>
`;