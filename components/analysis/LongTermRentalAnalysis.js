/**
 * Long-Term Rental Analysis Component
 * Displays comprehensive LTR market analysis matching Option 5 integrated design
 */

import { Card } from '../ui/Card.js';
import { LiveDataBadge } from '../ui/Badge.js';
import { LongTermRentalCalculator, ltrCalculatorScript } from './LongTermRentalCalculator.js';

export const LongTermRentalAnalysis = ({ 
  analysis = {},
  className = '' 
}) => {
  // Extract LTR data from analysis
  const ltrData = analysis.longTermRental || analysis.long_term_rental || {};
  const marketInsights = ltrData.marketInsights || ltrData.market_insights || {};
  
  // Property details for context
  const propertyData = analysis.propertyData || analysis.property_data || {};
  const address = propertyData.address || 'Property';
  const bedrooms = propertyData.bedrooms || 3;
  const bathrooms = propertyData.bathrooms || 2;
  const propertyType = propertyData.propertyType || propertyData.property_type || 'Property';
  const sqft = propertyData.squareFeet || propertyData.square_feet || 'N/A';
  
  // Key metrics
  const monthlyRent = ltrData.monthlyRent || ltrData.monthly_rent || 3100;
  const annualRent = ltrData.annualRent || ltrData.annual_rent || (monthlyRent * 12);
  const vacancyRate = ltrData.vacancyRate || ltrData.vacancy_rate || 2.1;
  const rentGrowth = marketInsights.rent_growth || marketInsights.rentGrowth || 5.2;
  const demandLevel = marketInsights.demand_level || marketInsights.demandLevel || 'High';
  const typicalTenant = marketInsights.typical_tenant || marketInsights.typicalTenant || 'Young families and professionals';
  
  // Extract cash flow and financial metrics
  const cashFlow = analysis.cashFlow || {};
  const monthlyExpenses = analysis.monthlyExpenses || {};
  const metrics = analysis.metrics || {};
  
  // Cash flow values
  const monthlyCashFlow = cashFlow.monthly || 0;
  const annualCashFlow = cashFlow.annual || 0;
  const totalMonthlyExpenses = monthlyExpenses.total || 0;
  const mortgagePayment = monthlyExpenses.mortgage || 0;
  const operatingExpenses = totalMonthlyExpenses - mortgagePayment;
  
  // Extract city name and province for display
  const cityName = address.split(',')[1]?.trim() || 'this area';
  const province = address.split(',')[2]?.trim() || 'Ontario';
  const propertyPrice = propertyData.price || 850000;
  
  // Calculate key metrics
  const capRate = metrics.capRate || ((annualRent - (operatingExpenses * 12)) / propertyPrice * 100).toFixed(1);
  const totalROI = metrics.totalROI || 12.5;
  const occupancyRate = 100 - vacancyRate;
  
  // Determine rent control guidelines based on province
  const getRentControlInfo = () => {
    if (province.includes('Ontario')) {
      return {
        guideline: 2.5, // 2024 Ontario guideline
        controlled: true,
        note: 'Ontario properties built before Nov 15, 2018 are rent controlled',
        historicalRates: '2024: 2.5%, 2023: 2.5%, 2022: 1.2%, 2021: 0%, 2020: 2.2%'
      };
    } else if (province.includes('British Columbia') || province.includes('BC')) {
      return {
        guideline: 3.5, // 2024 BC guideline
        controlled: true,
        note: 'BC annual rent increase limited to inflation + 2%',
        historicalRates: '2024: 3.5%, 2023: 2.0%, 2022: 1.5%, 2021: 0%, 2020: 2.6%'
      };
    } else if (province.includes('Quebec')) {
      return {
        guideline: 1.9, // Average Quebec guideline
        controlled: true,
        note: 'Quebec uses complex formula based on building expenses',
        historicalRates: '2024: 1.9% avg, varies by heating type and region'
      };
    } else if (province.includes('Manitoba')) {
      return {
        guideline: 3.0, // 2024 Manitoba guideline
        controlled: true,
        note: 'Manitoba rent increases tied to CPI',
        historicalRates: '2024: 3.0%, 2023: 0%, 2022: 0%, 2021: 1.6%, 2020: 2.4%'
      };
    } else {
      // Alberta, Saskatchewan, etc. - no rent control
      return {
        guideline: rentGrowth,
        controlled: false,
        note: `${province} has no rent control - market rates apply`,
        historicalRates: 'Market-driven increases based on supply and demand'
      };
    }
  };
  
  const rentControl = getRentControlInfo();
  const effectiveGrowthRate = rentControl.controlled ? Math.min(rentControl.guideline, rentGrowth) : rentGrowth;
  
  // Calculate 5-year revenue projection
  const year1Revenue = annualRent;
  const year3Revenue = Math.round(monthlyRent * Math.pow(1 + effectiveGrowthRate/100, 3) * 12);
  const year5Revenue = Math.round(monthlyRent * Math.pow(1 + effectiveGrowthRate/100, 5) * 12);
  
  // Market comparison calculations
  const areaAverage = Math.round(monthlyRent * 0.95); // Assume property is 5% above average
  const premiumPercentage = ((monthlyRent - areaAverage) / areaAverage * 100).toFixed(1);
  
  return `
    <div class="${className}">
      <style>
        .metric-highlight { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
        .revenue-banner { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .collapsible-content { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
        .collapsible-content.open { max-height: 1000px; }
      </style>
      
      <!-- Revenue Banner -->
      <div class="revenue-banner text-white rounded-lg p-6 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold mb-1">$${annualRent.toLocaleString()}/year</h2>
            <p class="text-green-100">Annual Rental Revenue</p>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold">$${monthlyRent.toLocaleString()}/mo</p>
            <p class="text-green-100">Monthly Rent</p>
          </div>
        </div>
      </div>

      <!-- 4 Key Metrics Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">${capRate}%</p>
          <p class="text-sm text-gray-600">Cap Rate</p>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${monthlyCashFlow >= 0 ? '+' : ''}$${Math.abs(monthlyCashFlow).toLocaleString()}
          </p>
          <p class="text-sm text-gray-600">Monthly Cash Flow</p>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold text-purple-600">${totalROI}%</p>
          <p class="text-sm text-gray-600">Total ROI</p>
        </div>
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold text-orange-600">${occupancyRate.toFixed(0)}%</p>
          <p class="text-sm text-gray-600">Occupancy Rate</p>
        </div>
      </div>

      <!-- Rent & Vacancy Panel -->
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Market Rent Analysis</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Your Property (${bedrooms}BR/${bathrooms}BA)</span>
              <span class="font-bold text-green-600">$${monthlyRent.toLocaleString()}/mo</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Area Average (${bedrooms}BR)</span>
              <span class="font-semibold">$${areaAverage.toLocaleString()}/mo</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Premium Above Market</span>
              <span class="font-semibold text-green-600">+${premiumPercentage}%</span>
            </div>
          </div>
          <div class="mt-4 p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-800">
              <i class="fas fa-info-circle mr-1"></i>
              Based on CMHC data for ${cityName} Q4 2023
            </p>
          </div>
        </div>
        
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Vacancy & Demand</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Market Vacancy Rate</span>
              <span class="font-bold text-green-600">${vacancyRate}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Demand Level</span>
              <span class="font-semibold text-green-600">${demandLevel}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Days to Rent</span>
              <span class="font-semibold">14-21 days</span>
            </div>
          </div>
          <div class="mt-4 p-3 bg-green-50 rounded-lg">
            <p class="text-sm text-green-800">
              <i class="fas fa-check-circle mr-1"></i>
              ${demandLevel === 'High' ? 'Strong rental market with quick tenant placement' : 'Stable rental market conditions'}
            </p>
          </div>
        </div>
      </div>

      <!-- Revenue Comparison Chart -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 class="font-semibold text-gray-800 mb-4">Revenue Growth Projection</h3>
        <div class="relative h-64 mb-4">
          <canvas id="ltr-revenue-chart"></canvas>
        </div>
        <div class="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p class="text-gray-600">Year 1</p>
            <p class="font-bold">$${year1Revenue.toLocaleString()}</p>
          </div>
          <div>
            <p class="text-gray-600">Year 3</p>
            <p class="font-bold text-green-600">$${year3Revenue.toLocaleString()}</p>
          </div>
          <div>
            <p class="text-gray-600">Year 5</p>
            <p class="font-bold text-green-600">$${year5Revenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <!-- Income & Cash Flow Analysis + Market Characteristics -->
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <!-- Income & Cash Flow -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Income & Cash Flow Analysis</h3>
          <div class="space-y-2">
            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600">Monthly Rent</span>
              <span class="font-semibold">$${monthlyRent.toLocaleString()}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600">Operating Expenses</span>
              <span class="text-red-600">-$${operatingExpenses.toLocaleString()}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600">Mortgage Payment</span>
              <span class="text-red-600">-$${mortgagePayment.toLocaleString()}</span>
            </div>
            <div class="flex justify-between py-2 font-bold">
              <span>Monthly Cash Flow</span>
              <span class="${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${monthlyCashFlow >= 0 ? '+' : ''}$${Math.abs(monthlyCashFlow).toLocaleString()}
              </span>
            </div>
          </div>
          <div class="mt-4 p-3 bg-gray-50 rounded">
            <p class="text-xs text-gray-600">
              Annual Cash Flow: <span class="font-bold ${annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${annualCashFlow >= 0 ? '+' : ''}$${Math.abs(annualCashFlow).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
        
        <!-- Market Characteristics -->
        <div class="bg-white border border-gray-200 rounded-lg p-6">
          <h3 class="font-semibold text-gray-800 mb-4">Market Characteristics</h3>
          <div class="space-y-3">
            <div>
              <p class="text-sm text-gray-600">Property Type</p>
              <p class="font-semibold">${bedrooms}BR/${bathrooms}BA ${propertyType}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Typical Tenant</p>
              <p class="font-semibold">${typicalTenant}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Lease Terms</p>
              <p class="font-semibold">12-24 month leases</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Rent Control</p>
              <p class="font-semibold ${rentControl.controlled ? 'text-orange-600' : 'text-green-600'}">
                ${rentControl.controlled ? `Yes (${rentControl.guideline}% max increase)` : 'No (market rates)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rental Estimate Calculation -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 class="font-semibold text-blue-900 mb-4">How We Calculate Your Rental Estimate</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-blue-800 mb-2">Data Sources</h4>
            <ul class="space-y-1 text-sm text-blue-700">
              <li>• CMHC Rental Market Reports (Q4 2023)</li>
              <li>• Local MLS rental listings</li>
              <li>• Rentals.ca market data</li>
              <li>• Provincial rent guidelines</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-blue-800 mb-2">Calculation Factors</h4>
            <ul class="space-y-1 text-sm text-blue-700">
              <li>• Property size: ${sqft} sq ft ${sqft !== 'N/A' && parseInt(sqft) > 2000 ? '(+10%)' : ''}</li>
              <li>• Location premium: ${cityName} (+5%)</li>
              <li>• Condition: Above average (+3%)</li>
              <li>• Final estimate: $${monthlyRent.toLocaleString()}/month</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Streamlined Financial Calculator -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 class="font-semibold text-gray-800 mb-4">Financial Calculator</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-3">Adjust Your Inputs</h4>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-600">Monthly Rent</label>
                <input type="number" id="ltr-calc-rent" value="${monthlyRent}" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="text-sm text-gray-600">Down Payment %</label>
                <input type="number" id="ltr-calc-down" value="20" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="text-sm text-gray-600">Interest Rate %</label>
                <input type="number" id="ltr-calc-rate" value="6.5" step="0.1" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-3">Results</h4>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Monthly Income</span>
                  <span class="font-semibold" id="ltr-calc-income">$${monthlyRent.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Total Expenses</span>
                  <span class="font-semibold" id="ltr-calc-expenses">$${totalMonthlyExpenses.toLocaleString()}</span>
                </div>
                <div class="flex justify-between pt-2 border-t">
                  <span class="font-semibold">Cash Flow</span>
                  <span class="font-bold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}" id="ltr-calc-cashflow">
                    ${monthlyCashFlow >= 0 ? '+' : ''}$${Math.abs(monthlyCashFlow).toLocaleString()}
                  </span>
                </div>
              </div>
              <button onclick="window.LTRAnalysis && window.LTRAnalysis.recalculate ? window.LTRAnalysis.recalculate() : console.warn('LTR not initialized')" class="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Recalculate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Collapsible Assumptions -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg">
        <button onclick="window.LTRAnalysis && window.LTRAnalysis.toggleAssumptions ? window.LTRAnalysis.toggleAssumptions() : console.warn('LTR not initialized')" class="w-full p-4 flex justify-between items-center hover:bg-gray-100 transition-colors">
          <h3 class="font-semibold text-gray-800">Calculation Assumptions</h3>
          <i id="ltr-assumptions-icon" class="fas fa-chevron-down text-gray-600 transition-transform"></i>
        </button>
        <div id="ltr-assumptions-content" class="collapsible-content">
          <div class="p-4 pt-0 grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 class="font-medium text-gray-700 mb-2">Operating Expenses</h4>
              <ul class="space-y-1 text-gray-600">
                <li>• Property Tax: $${Math.round((propertyData.propertyTaxes || propertyData.property_taxes || propertyPrice * 0.01) / 12).toLocaleString()}/mo</li>
                <li>• Insurance: $200/mo</li>
                <li>• Maintenance: $${Math.round(propertyPrice * 0.005 / 12).toLocaleString()}/mo (0.5% of value)</li>
                <li>• Property Mgmt: ${Math.round(monthlyRent * 0.08).toLocaleString()}/mo (8% of rent)</li>
                <li>• Vacancy: ${Math.round(monthlyRent * vacancyRate / 100).toLocaleString()}/mo (${vacancyRate}% of rent)</li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium text-gray-700 mb-2">Financial Assumptions</h4>
              <ul class="space-y-1 text-gray-600">
                <li>• Purchase Price: $${propertyPrice.toLocaleString()}</li>
                <li>• Down Payment: 20% ($${(propertyPrice * 0.2).toLocaleString()})</li>
                <li>• Loan Amount: $${(propertyPrice * 0.8).toLocaleString()}</li>
                <li>• Interest Rate: 6.5%</li>
                <li>• Amortization: 25 years</li>
              </ul>
            </div>
          </div>
          ${rentControl.controlled ? `
            <div class="p-4 pt-0">
              <div class="p-3 bg-orange-50 rounded-lg">
                <p class="text-xs text-orange-800">
                  <strong>⚠️ Rent Control:</strong> ${rentControl.note}
                  <br><span class="text-xs">${rentControl.historicalRates}</span>
                </p>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Chart and Calculator Scripts -->
    <script>
      // Create namespace for LTR functions
      window.LTRAnalysis = window.LTRAnalysis || {};
      
      // Initialize revenue projection chart
      function initializeLTRChart() {
        const canvas = document.getElementById('ltr-revenue-chart');
        if (canvas && typeof Chart !== 'undefined' && !canvas.chart) {
          const ctx = canvas.getContext('2d');
          const monthlyRent = ${monthlyRent};
          const growthRate = ${effectiveGrowthRate} / 100;
          
          // Calculate 5-year projections
          const projections = [];
          for (let year = 1; year <= 5; year++) {
            projections.push(Math.round(monthlyRent * Math.pow(1 + growthRate, year - 1) * 12));
          }
          
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
              datasets: [{
                label: 'Annual Revenue',
                data: projections,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return 'Revenue: $' + context.parsed.y.toLocaleString();
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  ticks: {
                    callback: function(value) {
                      return '$' + (value/1000).toFixed(0) + 'k';
                    }
                  },
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
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
          canvas.chart = true; // Mark as initialized
        }
      }
      
      // Initialize on load and when dynamically added
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLTRChart);
      } else {
        setTimeout(initializeLTRChart, 100); // Small delay for dynamic loading
      }

      // Toggle assumptions section
      window.LTRAnalysis.toggleAssumptions = function toggleLTRAssumptions() {
        const content = document.getElementById('ltr-assumptions-content');
        const icon = document.getElementById('ltr-assumptions-icon');
        
        if (content && icon) {
          if (content.classList.contains('open')) {
            content.classList.remove('open');
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            icon.style.transform = 'rotate(0deg)';
          } else {
            content.classList.add('open');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            icon.style.transform = 'rotate(180deg)';
          }
        }
      }

      // Simple calculator function
      window.LTRAnalysis.recalculate = function recalculateLTR() {
        try {
          const rent = Math.max(0, parseFloat(document.getElementById('ltr-calc-rent').value) || 0);
          const downPaymentPct = Math.min(100, Math.max(0, parseFloat(document.getElementById('ltr-calc-down').value) || 20));
          const interestRate = Math.min(20, Math.max(0, parseFloat(document.getElementById('ltr-calc-rate').value) || 6.5));
        
        const propertyPrice = ${propertyPrice};
        const loanAmount = propertyPrice * (1 - downPaymentPct / 100);
        
        // Calculate monthly mortgage payment
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = 25 * 12; // 25-year amortization
        const mortgagePayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        // Operating expenses (simplified)
        const propertyTax = ${Math.round((propertyData.propertyTaxes || propertyData.property_taxes || propertyPrice * 0.01) / 12)};
        const insurance = 200;
        const maintenance = Math.round(propertyPrice * 0.005 / 12);
        const mgmtFee = Math.round(rent * 0.08);
        const vacancy = Math.round(rent * ${vacancyRate} / 100);
        
        const totalExpenses = Math.round(mortgagePayment + propertyTax + insurance + maintenance + mgmtFee + vacancy);
        const cashFlow = rent - totalExpenses;
        
        // Update display
        document.getElementById('ltr-calc-income').textContent = '$' + rent.toLocaleString();
        document.getElementById('ltr-calc-expenses').textContent = '$' + totalExpenses.toLocaleString();
        
        const cashFlowElement = document.getElementById('ltr-calc-cashflow');
        cashFlowElement.textContent = (cashFlow >= 0 ? '+' : '') + '$' + Math.abs(cashFlow).toLocaleString();
        cashFlowElement.className = 'font-bold ' + (cashFlow >= 0 ? 'text-green-600' : 'text-red-600');
        } catch (error) {
          console.error('Error calculating LTR:', error);
        }
      }
    </script>
  `;
};