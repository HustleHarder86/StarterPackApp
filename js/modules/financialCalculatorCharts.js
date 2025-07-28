/**
 * Financial Calculator Charts Module
 * Handles the annual revenue bar chart and calculator interactions
 */

let annualRevenueChart = null;

/**
 * Helper function to calculate total monthly expenses
 */
function calculateTotalMonthlyExpenses() {
  const mortgage = parseFloat(document.getElementById('mortgage')?.value) || 0;
  const propertyTax = parseFloat(document.getElementById('propertyTax')?.value) || 0;
  const insurance = parseFloat(document.getElementById('insurance')?.value) || 0;
  const hoaFees = parseFloat(document.getElementById('hoaFees')?.value) || 0;
  const propertyMgmt = parseFloat(document.getElementById('propertyMgmt')?.value) || 0;
  const utilities = parseFloat(document.getElementById('utilities')?.value) || 0;
  const cleaning = parseFloat(document.getElementById('cleaning')?.value) || 0;
  const maintenance = parseFloat(document.getElementById('maintenance')?.value) || 0;
  const supplies = parseFloat(document.getElementById('supplies')?.value) || 0;
  const platformFees = parseFloat(document.getElementById('platformFees')?.value) || 0;
  const otherExpenses = parseFloat(document.getElementById('otherExpenses')?.value) || 0;
  
  return mortgage + propertyTax + insurance + hoaFees + propertyMgmt + 
         utilities + cleaning + maintenance + supplies + 
         platformFees + otherExpenses;
}

/**
 * Initialize the annual revenue comparison chart
 */
export function initializeAnnualRevenueChart() {
  const canvas = document.getElementById('annual-revenue-chart');
  if (!canvas) {
    console.error('Annual revenue chart canvas not found');
    return;
  }
  
  if (!window.Chart) {
    console.error('Chart.js not loaded yet, retrying in 500ms');
    setTimeout(() => initializeAnnualRevenueChart(), 500);
    return;
  }
  
  // Ensure canvas has proper dimensions
  const container = canvas.parentElement;
  if (container) {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }

  // Get data from attributes or calculate from current values
  const dataContainer = document.getElementById('financial-calc-data');
  let annualRevenue = 0;
  let annualExpenses = 0;
  
  if (dataContainer) {
    annualRevenue = parseFloat(dataContainer.dataset.annualRevenue) || 0;
    annualExpenses = parseFloat(dataContainer.dataset.annualExpenses) || 0;
  } else {
    // Calculate from current input values
    const monthlyRevenue = parseFloat(document.getElementById('monthlyRevenue')?.value) || 5400;
    const totalMonthlyExpenses = calculateTotalMonthlyExpenses() || 7576; // Default from typical values
    annualRevenue = monthlyRevenue * 12;
    annualExpenses = totalMonthlyExpenses * 12;
    
    // If still zero, use default values for initial display
    if (annualRevenue === 0) {
      annualRevenue = 64800; // Default $5400/mo * 12
      annualExpenses = 90912; // Default expenses
    }
  }
  
  const netCashFlow = annualRevenue - annualExpenses;

  // Destroy existing chart if it exists
  if (annualRevenueChart) {
    annualRevenueChart.destroy();
  }

  // Create new chart
  const ctx = canvas.getContext('2d');
  annualRevenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Revenue', 'Expenses', 'Net Cash Flow'],
      datasets: [{
        label: 'Annual Amount',
        data: [annualRevenue, annualExpenses, netCashFlow],
        backgroundColor: [
          '#10b981', // green for revenue
          '#ef4444', // red for expenses
          netCashFlow >= 0 ? '#3b82f6' : '#f59e0b' // blue for positive, amber for negative
        ],
        borderRadius: 8,
        borderWidth: 0
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
              const value = Math.abs(context.parsed.y);
              const prefix = context.dataIndex === 2 && context.parsed.y < 0 ? '-' : '';
              return prefix + '$' + value.toLocaleString() + '/year';
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            callback: function(value) {
              return '$' + Math.abs(value).toLocaleString();
            },
            font: {
              size: 12
            },
            padding: 8
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12,
              weight: 500
            }
          }
        }
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10
        }
      }
    }
  });

  return annualRevenueChart;
}

/**
 * Update financial calculations and refresh chart
 */
export function updateFinancialCalculations() {
  // Get all input values
  const monthlyRevenue = parseFloat(document.getElementById('monthlyRevenue')?.value) || 0;
  const mortgage = parseFloat(document.getElementById('mortgage')?.value) || 0;
  const propertyTax = parseFloat(document.getElementById('propertyTax')?.value) || 0;
  const insurance = parseFloat(document.getElementById('insurance')?.value) || 0;
  const hoaFees = parseFloat(document.getElementById('hoaFees')?.value) || 0;
  const propertyMgmt = parseFloat(document.getElementById('propertyMgmt')?.value) || 0;
  const utilities = parseFloat(document.getElementById('utilities')?.value) || 0;
  const cleaning = parseFloat(document.getElementById('cleaning')?.value) || 0;
  const maintenance = parseFloat(document.getElementById('maintenance')?.value) || 0;
  const supplies = parseFloat(document.getElementById('supplies')?.value) || 0;
  const platformFees = parseFloat(document.getElementById('platformFees')?.value) || 0;
  const otherExpenses = parseFloat(document.getElementById('otherExpenses')?.value) || 0;

  // Calculate totals
  const totalExpenses = mortgage + propertyTax + insurance + hoaFees + propertyMgmt + 
                       utilities + cleaning + maintenance + supplies + 
                       platformFees + otherExpenses;
  
  const netCashFlow = monthlyRevenue - totalExpenses;
  const annualRevenue = monthlyRevenue * 12;
  const annualExpenses = totalExpenses * 12;
  const annualCashFlow = netCashFlow * 12;

  // Update chart if it exists
  if (annualRevenueChart && annualRevenueChart.data) {
    annualRevenueChart.data.datasets[0].data = [annualRevenue, annualExpenses, annualCashFlow];
    annualRevenueChart.data.datasets[0].backgroundColor[2] = annualCashFlow >= 0 ? '#3b82f6' : '#f59e0b';
    annualRevenueChart.update();
  }

  // Update displays in the chart section
  const revenueDisplay = document.querySelector('.text-green-600');
  const expensesDisplay = document.querySelector('.text-red-600');
  const cashFlowDisplay = document.querySelector('.text-lg.font-bold');
  
  if (revenueDisplay) revenueDisplay.textContent = '$' + annualRevenue.toLocaleString();
  if (expensesDisplay) expensesDisplay.textContent = '$' + annualExpenses.toLocaleString();
  if (cashFlowDisplay) {
    cashFlowDisplay.textContent = (annualCashFlow >= 0 ? '+' : '') + '$' + Math.abs(annualCashFlow).toLocaleString();
    cashFlowDisplay.className = `font-bold text-lg ${annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`;
  }

  // Update key metrics
  updateKeyMetrics(monthlyRevenue, totalExpenses, netCashFlow, annualCashFlow);
  
  // Also update STR-specific percentages if in STR mode
  const dataContainer = document.getElementById('financial-calc-data');
  if (dataContainer && dataContainer.dataset.analysisType === 'str') {
    updateSTRPercentages(monthlyRevenue);
  }
}

/**
 * Update key metrics display
 */
function updateKeyMetrics(monthlyRevenue, totalExpenses, netCashFlow, annualCashFlow) {
  // Update monthly cash flow metric
  const cashFlowMetric = document.querySelector('.bg-gradient-to-br.from-green-50 .text-2xl');
  if (cashFlowMetric) {
    cashFlowMetric.textContent = (netCashFlow >= 0 ? '+' : '') + '$' + Math.abs(netCashFlow).toLocaleString();
    cashFlowMetric.className = `text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`;
  }

  // Update ROI metric (need to get down payment from somewhere)
  const dataContainer = document.getElementById('financial-calc-data');
  const propertyPrice = window.analysisData?.propertyData?.price || 850000;
  const downPayment = window.analysisData?.propertyData?.downPayment || (propertyPrice * 0.2);
  const cashReturn = downPayment > 0 ? ((annualCashFlow / downPayment) * 100).toFixed(1) : 0;
  const roiMetric = document.querySelector('.bg-gradient-to-br.from-blue-50 .text-2xl');
  if (roiMetric) {
    roiMetric.textContent = cashReturn + '%';
  }
  
  // Update Cap Rate metric
  const annualRevenue = monthlyRevenue * 12;
  const annualExpenses = totalExpenses * 12;
  const netOperatingIncome = annualRevenue - annualExpenses + (parseFloat(document.getElementById('mortgage')?.value || 0) * 12);
  const capRate = propertyPrice > 0 ? ((netOperatingIncome / propertyPrice) * 100).toFixed(1) : 0;
  const capRateMetric = document.querySelector('.bg-gradient-to-br.from-purple-50 .text-2xl');
  if (capRateMetric) {
    capRateMetric.textContent = capRate + '%';
  }

  // Update break-even metric
  const breakEvenMetric = document.querySelector('.bg-gradient-to-br.from-amber-50 .text-2xl');
  if (breakEvenMetric) {
    breakEvenMetric.textContent = netCashFlow >= 0 ? 'Positive' : 'Negative';
  }
}

/**
 * Update STR percentage-based expenses
 */
function updateSTRPercentages(monthlyRevenue) {
  const propertyMgmtInput = document.getElementById('propertyMgmt');
  const suppliesInput = document.getElementById('supplies');
  const platformFeesInput = document.getElementById('platformFees');
  
  if (propertyMgmtInput) propertyMgmtInput.value = Math.round(monthlyRevenue * 0.10);
  if (suppliesInput) suppliesInput.value = Math.round(monthlyRevenue * 0.04);
  if (platformFeesInput) platformFeesInput.value = Math.round(monthlyRevenue * 0.03);
}

/**
 * Reset calculator to defaults
 */
export function resetFinancialCalculator() {
  const defaults = {
    monthlyRevenue: 5400,
    mortgage: 4200,
    propertyTax: 708,
    insurance: 250,
    hoaFees: 450,
    propertyMgmt: 540,
    utilities: 200,
    cleaning: 400,
    maintenance: 300,
    supplies: 216,
    platformFees: 162,
    otherExpenses: 150
  };

  // Reset all inputs
  Object.entries(defaults).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });

  // Update calculations
  updateFinancialCalculations();
}

/**
 * Initialize the enhanced financial calculator
 */
export function initializeEnhancedFinancialCalculator() {
  console.log('Initializing enhanced financial calculator');
  
  // Wait for DOM
  setTimeout(() => {
    // Initialize chart
    initializeAnnualRevenueChart();
    
    // Add event listeners to all inputs
    const inputs = document.querySelectorAll('#monthlyRevenue, #mortgage, #propertyTax, #insurance, #hoaFees, #propertyMgmt, #utilities, #cleaning, #maintenance, #supplies, #platformFees, #otherExpenses');
    
    inputs.forEach(input => {
      if (input) {
        input.addEventListener('input', updateFinancialCalculations);
      }
    });
    
    // Add reset button listener
    const resetButton = document.getElementById('reset-financial-calc');
    if (resetButton) {
      resetButton.addEventListener('click', resetFinancialCalculator);
    }
    
    // Make updateFinancialCalculations available globally
    window.updateFinancialCalculations = updateFinancialCalculations;
  }, 100);
}