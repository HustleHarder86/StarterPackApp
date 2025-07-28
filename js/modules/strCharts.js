/**
 * STR Charts Module
 * Handles all chart initialization and updates for Short-Term Rental analysis
 */

// Store chart instances globally to avoid re-initialization issues
let strRevenueChart = null;

/**
 * Initialize the STR revenue comparison chart
 * @param {Object} data - The analysis data containing STR and LTR information
 */
export function initializeSTRChart(data = {}) {
  console.log('Initializing STR chart with data:', data);
  
  const ctx = document.getElementById('str-revenue-chart');
  if (!ctx) {
    console.error('STR revenue chart canvas not found');
    return;
  }

  // Check if Chart.js is loaded
  if (!window.Chart) {
    console.error('Chart.js not loaded yet, retrying in 500ms');
    setTimeout(() => initializeSTRChart(data), 500);
    return;
  }

  // Extract data with fallbacks
  const strData = data.strAnalysis || data.short_term_rental || {};
  const ltrData = data.longTermRental || data.long_term_rental || {};
  
  const monthlyRevenue = strData.monthlyRevenue || strData.monthly_revenue || 0;
  const ltrRent = ltrData.monthlyRent || ltrData.monthly_rent || 3100;

  // Destroy existing chart if it exists
  if (strRevenueChart) {
    strRevenueChart.destroy();
  }

  // Create new chart
  strRevenueChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Short-Term Rental', 'Long-Term Rental'],
      datasets: [{
        label: 'Monthly Revenue',
        data: [monthlyRevenue, ltrRent],
        backgroundColor: ['#9333ea', '#6b7280'],
        borderRadius: 8
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
              return '$' + context.parsed.y.toLocaleString() + '/mo';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  });

  return strRevenueChart;
}

/**
 * Update the STR calculator and sync with main financial calculator
 * @param {Object} analysisData - The complete analysis data
 */
export function updateSTRCalculator(analysisData = {}) {
  console.log('Setting up STR calculator with data:', analysisData);
  
  const nightlyRateInput = document.getElementById('str-nightly-rate');
  const occupancySlider = document.getElementById('str-occupancy-slider');
  const occupancyDisplay = document.getElementById('occupancy-display');
  const monthlyRevenueDisplay = document.getElementById('monthly-revenue-display');
  const annualRevenueDisplay = document.getElementById('annual-revenue-display');
  const advantageDisplay = document.getElementById('advantage-display');
  const resetButton = document.getElementById('reset-calculator');
  
  // Check if all elements exist
  if (!nightlyRateInput || !occupancySlider) {
    console.error('STR calculator elements not found');
    return;
  }

  // Extract data with fallbacks
  const strData = analysisData.strAnalysis || analysisData.short_term_rental || {};
  const ltrData = analysisData.longTermRental || analysisData.long_term_rental || {};
  
  const defaultNightlyRate = strData.avgNightlyRate || strData.avg_nightly_rate || 220;
  const defaultOccupancy = strData.occupancy_rate ? Math.round(strData.occupancy_rate * 100) : 75;
  const ltrRent = ltrData.monthlyRent || ltrData.monthly_rent || 3100;
  
  // Set initial occupancy value
  if (occupancySlider) {
    occupancySlider.value = defaultOccupancy;
  }

  function updateCalculations() {
    const nightlyRate = parseFloat(nightlyRateInput.value) || 0;
    const occupancyRate = parseFloat(occupancySlider.value) / 100;
    const monthlyRevenue = Math.round(nightlyRate * 30.4 * occupancyRate);
    const annualRevenue = monthlyRevenue * 12;
    const advantage = monthlyRevenue - ltrRent;
    
    // Update slider fill color
    const sliderValue = ((occupancySlider.value - occupancySlider.min) / (occupancySlider.max - occupancySlider.min)) * 100;
    occupancySlider.style.setProperty('--value', sliderValue + '%');
    
    // Update displays
    if (occupancyDisplay) occupancyDisplay.textContent = occupancySlider.value + '%';
    if (monthlyRevenueDisplay) monthlyRevenueDisplay.textContent = '$' + monthlyRevenue.toLocaleString();
    if (annualRevenueDisplay) annualRevenueDisplay.textContent = '$' + annualRevenue.toLocaleString();
    
    if (advantageDisplay) {
      if (advantage >= 0) {
        advantageDisplay.textContent = '+$' + advantage.toLocaleString() + '/mo';
        advantageDisplay.className = 'text-lg font-bold text-green-600';
      } else {
        advantageDisplay.textContent = '-$' + Math.abs(advantage).toLocaleString() + '/mo';
        advantageDisplay.className = 'text-lg font-bold text-red-600';
      }
    }
    
    // Update chart if it exists
    if (strRevenueChart && strRevenueChart.data) {
      strRevenueChart.data.datasets[0].data[0] = monthlyRevenue;
      strRevenueChart.update();
    }
    
    // Update the main financial calculator
    const mainRevenueInput = document.getElementById('monthlyRevenue');
    if (mainRevenueInput) {
      mainRevenueInput.value = monthlyRevenue;
      
      // Also update STR-specific expenses based on new revenue
      const propertyMgmtInput = document.getElementById('propertyMgmt');
      const suppliesInput = document.getElementById('supplies');
      const platformFeesInput = document.getElementById('platformFees');
      
      if (propertyMgmtInput) propertyMgmtInput.value = Math.round(monthlyRevenue * 0.10); // 10% management
      if (suppliesInput) suppliesInput.value = Math.round(monthlyRevenue * 0.04); // 4% supplies
      if (platformFeesInput) platformFeesInput.value = Math.round(monthlyRevenue * 0.03); // 3% platform fees
      
      // Trigger the main calculator update
      if (window.updateFinancialCalculations) {
        window.updateFinancialCalculations();
      }
    }
  }

  // Add event listeners
  nightlyRateInput.addEventListener('input', updateCalculations);
  occupancySlider.addEventListener('input', updateCalculations);
  
  // Reset button functionality
  if (resetButton) {
    resetButton.addEventListener('click', function() {
      // Reset to default values
      nightlyRateInput.value = defaultNightlyRate;
      occupancySlider.value = defaultOccupancy;
      
      // Update the calculations with default values
      updateCalculations();
    });
  }
  
  // Initial calculation
  updateCalculations();
}

/**
 * Setup floating button functionality
 */
export function setupFloatingButton() {
  const floatingButton = document.getElementById('floating-button-container');
  const calculatorSection = document.getElementById('str-calculator-section');
  
  if (!floatingButton || !calculatorSection) {
    console.log('Floating button or calculator section not found');
    return;
  }
  
  // Show/hide floating button based on scroll position
  window.addEventListener('scroll', function() {
    const rect = calculatorSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (!isVisible && window.scrollY > 200) {
      floatingButton.style.opacity = '1';
    } else {
      floatingButton.style.opacity = '0';
    }
  });
  
  // Scroll to calculator function - make it globally available
  window.scrollToCalculator = function() {
    const calcSection = document.getElementById('str-calculator-section');
    if (calcSection) {
      calcSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Flash the calculator to draw attention
      calcSection.style.transition = 'all 0.3s ease';
      calcSection.style.transform = 'scale(1.02)';
      calcSection.style.boxShadow = '0 20px 25px -5px rgba(147, 51, 234, 0.1), 0 10px 10px -5px rgba(147, 51, 234, 0.04)';
      
      setTimeout(() => {
        calcSection.style.transform = 'scale(1)';
        calcSection.style.boxShadow = '';
      }, 300);
    }
  };
}

/**
 * Initialize all STR components
 * @param {Object} analysisData - The complete analysis data
 */
export function initializeSTRComponents(analysisData) {
  console.log('Initializing all STR components');
  
  // Initialize chart
  initializeSTRChart(analysisData);
  
  // Setup calculator
  updateSTRCalculator(analysisData);
  
  // Setup floating button
  setupFloatingButton();
}

// Export default initialization function
export default initializeSTRComponents;