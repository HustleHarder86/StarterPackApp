/**
 * Financial Calculator Initialization Module
 * Handles all interactive functionality for the financial calculator
 */

// Default values for reset functionality
export const defaultFinancialValues = {
  monthlyRevenue: 5400,
  mortgage: 4200,
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

  // Calculate total expenses (including mortgage)
  const totalExpenses = mortgage + propertyTax + insurance + hoaFees + propertyMgmt + 
                       utilities + cleaning + maintenance + supplies + 
                       platformFees + otherExpenses;

  // Calculate net cash flow
  const netCashFlow = monthlyRevenue - totalExpenses;
  const annualIncome = netCashFlow * 12;

  // Calculate cash-on-cash return (using stored property data)
  const downPayment = window.analysisData?.downPayment || 170000;
  const cashReturn = (annualIncome / downPayment) * 100;

  // Update display values
  const totalExpensesEl = document.getElementById('totalExpenses');
  const netCashFlowEl = document.getElementById('netCashFlow');
  const annualIncomeEl = document.getElementById('annualIncome');
  const cashReturnEl = document.getElementById('cashReturn');

  if (totalExpensesEl) totalExpensesEl.textContent = '-$' + totalExpenses.toLocaleString();
  if (netCashFlowEl) netCashFlowEl.textContent = (netCashFlow >= 0 ? '+$' : '-$') + Math.abs(netCashFlow).toLocaleString();
  if (annualIncomeEl) annualIncomeEl.textContent = '$' + annualIncome.toLocaleString();
  if (cashReturnEl) cashReturnEl.textContent = cashReturn.toFixed(1) + '%';

  // Property Management fee is user-editable only

  // Update Platform fees based on revenue (3%)
  if (document.activeElement?.id !== 'platformFees') {
    const calculatedPlatform = Math.round(monthlyRevenue * 0.03);
    const platformFeesEl = document.getElementById('platformFees');
    if (platformFeesEl) platformFeesEl.value = calculatedPlatform;
  }

  // Update key metrics values and indicators
  updateKeyMetrics(monthlyRevenue, totalExpenses, netCashFlow, annualIncome);
  
  // Update key metrics indicators if they exist
  if (typeof updateMetricIndicators === 'function') {
    updateMetricIndicators();
  }
}

// Reset calculator to default values
export function resetCalculator() {
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

// Function to get metric rating
export function getMetricRating(metric, value) {
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

// Function to get indicator icon
export function getIndicatorIcon(color) {
  const icons = {
    purple: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>',
    green: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>',
    yellow: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 112 0v4a1 1 0 11-2 0V7zm0 8a1 1 0 112 0 1 1 0 01-2 0z" clip-rule="evenodd"/>',
    red: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
  };
  return icons[color] || icons.green;
}

// Function to update a single indicator
export function updateIndicator(indicatorId, rating) {
  const indicator = document.getElementById(indicatorId);
  if (!indicator) return;

  // Update colors and text
  indicator.className = `inline-flex items-center gap-1 px-2 py-1 bg-${rating.color}-100 text-${rating.color}-700 rounded-full text-xs font-medium mt-2`;
  indicator.innerHTML = `
    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      ${getIndicatorIcon(rating.color)}
    </svg>
    ${rating.label}
  `;
}

// Function to update metric indicators
export function updateMetricIndicators() {
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

// Initialize function
export function initializeFinancialCalculator() {
  updateFinancialCalculations();
  updateMetricIndicators();
}

// Function to update key metrics based on current calculator values
export function updateKeyMetrics(monthlyRevenue, totalExpenses, netCashFlow, annualIncome) {
  // Get property data
  const propertyPrice = window.analysisData?.propertyPrice || 850000;
  const downPayment = window.analysisData?.downPayment || 170000;
  
  // Calculate operating expenses (excluding mortgage for cap rate)
  const mortgage = parseFloat(document.getElementById('mortgage')?.value) || 0;
  const operatingExpenses = totalExpenses - mortgage;
  const annualOperatingIncome = (monthlyRevenue - operatingExpenses) * 12;
  
  // Calculate metrics
  const capRate = (annualOperatingIncome / propertyPrice) * 100;
  const roi = (annualIncome / downPayment) * 100; // Cash-on-cash return
  const breakEvenOccupancy = monthlyRevenue > 0 ? (totalExpenses / monthlyRevenue) * 100 : 100;
  
  // Update metric values in DOM
  const capRateEl = document.getElementById('capRateValue');
  const roiEl = document.getElementById('roiValue');
  const cashFlowEl = document.getElementById('cashFlowValue');
  const breakEvenEl = document.getElementById('breakEvenValue');
  
  if (capRateEl) capRateEl.textContent = capRate.toFixed(1) + '%';
  if (roiEl) roiEl.textContent = roi.toFixed(1) + '%';
  if (cashFlowEl) cashFlowEl.textContent = (netCashFlow >= 0 ? '+$' : '-$') + Math.abs(netCashFlow).toLocaleString();
  if (breakEvenEl) breakEvenEl.textContent = breakEvenOccupancy.toFixed(0) + '%';
  
  // Update indicators
  updateIndicator('capRateIndicator', getMetricRating('capRate', capRate));
  updateIndicator('roiIndicator', getMetricRating('roi', roi));
  updateIndicator('cashFlowIndicator', getMetricRating('cashFlow', netCashFlow));
  updateIndicator('breakEvenIndicator', getMetricRating('breakEven', breakEvenOccupancy));
}

// Function to update interest rate
export function updateInterestRate(rate) {
  // Update display
  const rateDisplay = document.getElementById('interestRateDisplay');
  const mortgageInterestText = document.getElementById('mortgageInterestText');
  if (rateDisplay) rateDisplay.textContent = rate;
  if (mortgageInterestText) mortgageInterestText.textContent = rate + '%';
  
  // Recalculate mortgage payment
  calculateMortgagePayment();
}

// Function to update amortization period
export function updateAmortization(years) {
  // Validate input
  const amortizationYears = Math.max(0, Math.min(100, parseFloat(years) || 30));
  
  // Update input value if needed
  const amortizationInput = document.getElementById('amortizationPeriod');
  if (amortizationInput && amortizationInput.value !== amortizationYears.toString()) {
    amortizationInput.value = amortizationYears;
  }
  
  // Recalculate mortgage payment
  calculateMortgagePayment();
}

// Function to update management fee - DEPRECATED
// Management fee is now directly editable as a dollar amount
// The 10% calculation still happens automatically when revenue changes
// but users can override it by editing the dollar amount directly

// Helper function to calculate mortgage payment
export function calculateMortgagePayment() {
  const propertyPrice = window.analysisData?.propertyPrice || 850000;
  const downPaymentPercent = parseFloat(document.getElementById('downPaymentPercentInput')?.value) || 
                            parseFloat(document.getElementById('downPaymentSlider')?.value) || 20;
  const downPayment = propertyPrice * (downPaymentPercent / 100);
  const loanAmount = propertyPrice - downPayment;
  
  const interestRate = parseFloat(document.getElementById('interestRateInput')?.value) || 
                       parseFloat(document.getElementById('interestRateSlider')?.value) || 6.5;
  const monthlyRate = interestRate / 100 / 12;
  
  const amortizationYears = parseFloat(document.getElementById('amortizationPeriod')?.value) || 30;
  const loanTermMonths = amortizationYears * 12;
  
  let mortgagePayment = 0;
  if (loanTermMonths > 0 && monthlyRate > 0) {
    mortgagePayment = Math.round(
      loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
      (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
    );
  } else if (loanTermMonths > 0) {
    // Handle 0% interest rate
    mortgagePayment = Math.round(loanAmount / loanTermMonths);
  }
  
  // Update mortgage input
  const mortgageInput = document.getElementById('mortgage');
  if (mortgageInput) {
    mortgageInput.value = mortgagePayment;
    updateFinancialCalculations();
  }
}

// Function to update down payment
export function updateDownPayment(percent) {
  const propertyPrice = window.analysisData?.propertyPrice || 850000;
  const downPayment = Math.round(propertyPrice * (percent / 100));
  
  // Update displays
  const percentDisplay = document.getElementById('downPaymentDisplay');
  const amountDisplay = document.getElementById('downPaymentAmount');
  const mortgageDownPaymentText = document.getElementById('mortgageDownPaymentText');
  
  if (percentDisplay) percentDisplay.textContent = percent;
  if (amountDisplay) amountDisplay.textContent = downPayment.toLocaleString();
  if (mortgageDownPaymentText) mortgageDownPaymentText.textContent = percent + '%';
  
  // Update global data
  if (window.analysisData) {
    window.analysisData.downPayment = downPayment;
  }
  
  // Recalculate mortgage with new down payment
  calculateMortgagePayment();
}

// Enhanced reset function
export function resetCalculatorEnhanced() {
  // Reset sliders
  const interestSlider = document.getElementById('interestRateSlider');
  const downPaymentSlider = document.getElementById('downPaymentSlider');
  
  if (interestSlider) {
    interestSlider.value = 6.5;
    updateInterestRate(6.5);
  }
  
  if (downPaymentSlider) {
    downPaymentSlider.value = 20;
    updateDownPayment(20);
  }
  
  // Call original reset
  resetCalculator();
}

// Function to toggle methodology section
export function toggleMethodology() {
  const content = document.getElementById('methodologyContent');
  const chevron = document.getElementById('methodologyChevron');
  
  if (content && chevron) {
    const isHidden = content.classList.contains('hidden');
    
    if (isHidden) {
      content.classList.remove('hidden');
      chevron.classList.add('rotate-180');
    } else {
      content.classList.add('hidden');
      chevron.classList.remove('rotate-180');
    }
  }
}

// Make functions globally available
window.updateFinancialCalculations = updateFinancialCalculations;
window.resetCalculator = resetCalculatorEnhanced;
window.updateMetricIndicators = updateMetricIndicators;
window.updateKeyMetrics = updateKeyMetrics;
window.updateInterestRate = updateInterestRate;
window.updateDownPayment = updateDownPayment;
window.updateAmortization = updateAmortization;
// window.updateManagementFee = updateManagementFee; // Deprecated - direct dollar edit only
window.calculateMortgagePayment = calculateMortgagePayment;
window.toggleMethodology = toggleMethodology;