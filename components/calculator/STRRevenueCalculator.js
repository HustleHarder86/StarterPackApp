/**
 * STR Revenue Calculator Component
 * Interactive sliders for calculating STR revenue potential
 */

export const STRRevenueCalculator = ({ 
  initialNightlyRate = 170,
  initialOccupancy = 85,
  ltrMonthlyRent = 3000,
  onUpdate = () => {}
}) => {
  const calculateRevenue = (rate, occupancy) => {
    const daysPerMonth = 30;
    const occupiedDays = Math.round((occupancy / 100) * daysPerMonth);
    const monthlyRevenue = rate * occupiedDays;
    const annualRevenue = monthlyRevenue * 12;
    const ltrAnnual = ltrMonthlyRent * 12;
    const additionalRevenue = annualRevenue - ltrAnnual;
    const percentIncrease = ltrAnnual > 0 ? Math.round((additionalRevenue / ltrAnnual) * 100) : 0;
    
    return {
      monthlyRevenue,
      annualRevenue,
      additionalRevenue,
      percentIncrease,
      occupiedDays
    };
  };

  const initialCalc = calculateRevenue(initialNightlyRate, initialOccupancy);

  return `
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-lg border border-purple-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-gray-900">STR Revenue Calculator</h3>
        <span class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
          <span class="inline-block animate-pulse">●</span>
          INTERACTIVE
        </span>
      </div>
      
      <!-- Nightly Rate Slider -->
      <div class="mb-6">
        <div class="flex justify-between mb-2">
          <label class="text-sm font-medium text-gray-700">Average Nightly Rate</label>
          <span id="str-nightly-rate-display" class="text-xl font-bold text-purple-600">$${initialNightlyRate}</span>
        </div>
        <input 
          type="range" 
          id="str-nightly-rate-slider"
          min="100" 
          max="300" 
          value="${initialNightlyRate}" 
          class="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider-purple"
          data-value="${initialNightlyRate}"
        >
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>$100</span>
          <span>$200</span>
          <span>$300</span>
        </div>
      </div>

      <!-- Occupancy Rate Slider -->
      <div class="mb-6">
        <div class="flex justify-between mb-2">
          <label class="text-sm font-medium text-gray-700">Occupancy Rate</label>
          <span id="str-occupancy-display" class="text-xl font-bold text-pink-600">${initialOccupancy}%</span>
        </div>
        <input 
          type="range" 
          id="str-occupancy-slider"
          min="50" 
          max="100" 
          value="${initialOccupancy}" 
          class="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer slider-pink"
          data-value="${initialOccupancy}"
        >
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      <!-- Revenue Results -->
      <div class="bg-white rounded-lg p-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Occupied Days/Month</span>
          <span id="str-occupied-days" class="text-lg font-bold text-gray-700">${initialCalc.occupiedDays} days</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Monthly Revenue</span>
          <span id="str-monthly-revenue" class="text-xl font-bold text-gray-900">$${initialCalc.monthlyRevenue.toLocaleString()}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Annual Revenue</span>
          <span id="str-annual-revenue" class="text-2xl font-bold text-green-600">$${initialCalc.annualRevenue.toLocaleString()}</span>
        </div>
        <div class="flex justify-between items-center pt-3 border-t">
          <span class="text-sm text-gray-600">vs Long-Term Rental</span>
          <span id="str-additional-revenue" class="text-lg font-bold ${initialCalc.additionalRevenue >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${initialCalc.additionalRevenue >= 0 ? '+' : ''}$${Math.abs(initialCalc.additionalRevenue).toLocaleString()} 
            (${initialCalc.additionalRevenue >= 0 ? '+' : ''}${initialCalc.percentIncrease}%)
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-4 flex gap-2">
        <button 
          id="str-update-financial-calc"
          class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          Update Financial Calculator
        </button>
        <button 
          id="str-reset-calculator"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>

      <!-- Market Insight -->
      <div class="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="text-sm text-purple-700">
            <p class="font-medium mb-1">Market Insight</p>
            <p class="text-xs">Based on comparable properties in your area, $${initialNightlyRate}/night with ${initialOccupancy}% occupancy is achievable with proper management and marketing.</p>
          </div>
        </div>
      </div>
    </div>

    <style>
      /* Custom slider styles */
      .slider-purple::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #9333ea 0%, #a855f7 100%);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .slider-pink::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .slider-purple::-moz-range-thumb,
      .slider-pink::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .slider-purple::-moz-range-thumb {
        background: linear-gradient(135deg, #9333ea 0%, #a855f7 100%);
      }
      
      .slider-pink::-moz-range-thumb {
        background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
      }
    </style>

    <script>
      // Initialize STR Revenue Calculator interactions
      (function() {
        const nightlyRateSlider = document.getElementById('str-nightly-rate-slider');
        const occupancySlider = document.getElementById('str-occupancy-slider');
        const nightlyRateDisplay = document.getElementById('str-nightly-rate-display');
        const occupancyDisplay = document.getElementById('str-occupancy-display');
        const monthlyRevenueEl = document.getElementById('str-monthly-revenue');
        const annualRevenueEl = document.getElementById('str-annual-revenue');
        const additionalRevenueEl = document.getElementById('str-additional-revenue');
        const occupiedDaysEl = document.getElementById('str-occupied-days');
        const updateBtn = document.getElementById('str-update-financial-calc');
        const resetBtn = document.getElementById('str-reset-calculator');
        
        const ltrMonthlyRent = ${ltrMonthlyRent};
        const initialNightlyRate = ${initialNightlyRate};
        const initialOccupancy = ${initialOccupancy};
        
        function updateCalculations() {
          const nightlyRate = parseInt(nightlyRateSlider.value);
          const occupancy = parseInt(occupancySlider.value);
          
          // Update displays
          nightlyRateDisplay.textContent = '$' + nightlyRate;
          occupancyDisplay.textContent = occupancy + '%';
          
          // Calculate revenue
          const daysPerMonth = 30;
          const occupiedDays = Math.round((occupancy / 100) * daysPerMonth);
          const monthlyRevenue = nightlyRate * occupiedDays;
          const annualRevenue = monthlyRevenue * 12;
          const ltrAnnual = ltrMonthlyRent * 12;
          const additionalRevenue = annualRevenue - ltrAnnual;
          const percentIncrease = ltrAnnual > 0 ? Math.round((additionalRevenue / ltrAnnual) * 100) : 0;
          
          // Update displays
          occupiedDaysEl.textContent = occupiedDays + ' days';
          monthlyRevenueEl.textContent = '$' + monthlyRevenue.toLocaleString();
          annualRevenueEl.textContent = '$' + annualRevenue.toLocaleString();
          
          // Update additional revenue with color coding
          if (additionalRevenue >= 0) {
            additionalRevenueEl.className = 'text-lg font-bold text-green-600';
            additionalRevenueEl.textContent = '+$' + additionalRevenue.toLocaleString() + ' (+' + percentIncrease + '%)';
          } else {
            additionalRevenueEl.className = 'text-lg font-bold text-red-600';
            additionalRevenueEl.textContent = '-$' + Math.abs(additionalRevenue).toLocaleString() + ' (' + percentIncrease + '%)';
          }
          
          // Store values for financial calculator update
          nightlyRateSlider.setAttribute('data-value', nightlyRate);
          occupancySlider.setAttribute('data-value', occupancy);
        }
        
        // Add event listeners
        if (nightlyRateSlider && occupancySlider) {
          nightlyRateSlider.addEventListener('input', updateCalculations);
          occupancySlider.addEventListener('input', updateCalculations);
          
          // Update Financial Calculator button
          if (updateBtn) {
            updateBtn.addEventListener('click', function() {
              const nightlyRate = parseInt(nightlyRateSlider.value);
              const occupancy = parseInt(occupancySlider.value);
              const monthlyRevenue = Math.round(nightlyRate * (occupancy / 100) * 30);
              
              // Update the financial calculator's monthly revenue input
              const revenueInput = document.getElementById('monthlyRevenue');
              if (revenueInput) {
                revenueInput.value = monthlyRevenue;
                revenueInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
              
              // Show success feedback
              updateBtn.textContent = '✓ Updated';
              updateBtn.classList.add('bg-green-600');
              setTimeout(() => {
                updateBtn.textContent = 'Update Financial Calculator';
                updateBtn.classList.remove('bg-green-600');
              }, 2000);
            });
          }
          
          // Reset button
          if (resetBtn) {
            resetBtn.addEventListener('click', function() {
              nightlyRateSlider.value = initialNightlyRate;
              occupancySlider.value = initialOccupancy;
              updateCalculations();
            });
          }
        }
      })();
    </script>
  `;
};

// Export for global use
window.STRRevenueCalculator = STRRevenueCalculator;