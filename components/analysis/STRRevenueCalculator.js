/**
 * Interactive STR Revenue Calculator Component
 * Real-time revenue calculations with sliders
 */

export const STRRevenueCalculator = ({ 
  defaultNightlyRate = 150,
  minRate = 50,
  maxRate = 500,
  defaultOccupancy = 75,
  comparables = []
}) => {
  // Calculate min/max from comparables if available
  if (comparables && comparables.length > 0) {
    const rates = comparables.map(c => c.nightly_rate || c.nightlyRate || c.price || 0).filter(r => r > 0);
    if (rates.length > 0) {
      minRate = Math.floor(Math.min(...rates) * 0.8);
      maxRate = Math.ceil(Math.max(...rates) * 1.2);
      defaultNightlyRate = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
    }
  }
  
  const componentId = 'str-calculator-' + Math.random().toString(36).substr(2, 9);
  
  return `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 shadow-lg">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-900">STR Revenue Calculator</h3>
        <button 
          onclick="window.resetSTRCalculator('${componentId}')" 
          class="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Reset to Default
        </button>
      </div>
      
      <div class="space-y-6">
        <!-- Nightly Rate Slider -->
        <div>
          <div class="flex justify-between items-baseline mb-2">
            <label class="text-sm font-medium text-gray-700">Average Nightly Rate</label>
            <span class="text-2xl font-bold text-purple-600">
              $<span id="${componentId}-rate-value">${defaultNightlyRate}</span>
            </span>
          </div>
          <input 
            type="range" 
            id="${componentId}-rate-slider"
            min="${minRate}" 
            max="${maxRate}" 
            value="${defaultNightlyRate}"
            step="5"
            class="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider-purple"
            oninput="window.updateSTRCalculator('${componentId}')"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>$${minRate}</span>
            <span>Average: $${defaultNightlyRate}</span>
            <span>$${maxRate}</span>
          </div>
        </div>
        
        <!-- Occupancy Rate Slider -->
        <div>
          <div class="flex justify-between items-baseline mb-2">
            <label class="text-sm font-medium text-gray-700">Occupancy Rate</label>
            <span class="text-2xl font-bold text-blue-600">
              <span id="${componentId}-occupancy-value">${defaultOccupancy}</span>%
            </span>
          </div>
          <input 
            type="range" 
            id="${componentId}-occupancy-slider"
            min="40" 
            max="95" 
            value="${defaultOccupancy}"
            step="5"
            class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider-blue"
            oninput="window.updateSTRCalculator('${componentId}')"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>40%</span>
            <span>Average: ${defaultOccupancy}%</span>
            <span>95%</span>
          </div>
        </div>
        
        <!-- Booked Nights Display -->
        <div class="bg-white/70 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 mb-1">Estimated Booked Nights</p>
          <p class="text-3xl font-bold text-gray-900">
            <span id="${componentId}-nights-value">${Math.round(365 * defaultOccupancy / 100)}</span>
            <span class="text-lg text-gray-600 font-normal">/ 365 nights</span>
          </p>
        </div>
      </div>
      
      <!-- Revenue Calculations -->
      <div class="mt-6 space-y-3">
        <div class="bg-white rounded-lg p-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-700 font-medium">Monthly Revenue</span>
            <span class="text-2xl font-bold text-green-600">
              $<span id="${componentId}-monthly-revenue">${Math.round(defaultNightlyRate * 30.4 * defaultOccupancy / 100).toLocaleString()}</span>
            </span>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-700 font-medium">Annual Revenue</span>
            <span class="text-3xl font-bold text-green-700">
              $<span id="${componentId}-annual-revenue">${Math.round(defaultNightlyRate * 365 * defaultOccupancy / 100).toLocaleString()}</span>
            </span>
          </div>
        </div>
        
        <!-- Comparison to Long-Term -->
        <div class="border-t pt-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">vs Long-Term Rental</span>
            <span class="text-lg font-bold text-purple-600" id="${componentId}-comparison">
              Calculating...
            </span>
          </div>
        </div>
      </div>
      
      <!-- Market Position Indicator -->
      ${comparables.length > 0 ? `
      <div class="mt-4 p-3 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800 flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          Based on ${comparables.length} comparable properties in your area
        </p>
      </div>
      ` : ''}
    </div>
    
    <script>
      // Calculator update function
      window.updateSTRCalculator = function(componentId) {
        const rateSlider = document.getElementById(componentId + '-rate-slider');
        const occupancySlider = document.getElementById(componentId + '-occupancy-slider');
        const rateValue = document.getElementById(componentId + '-rate-value');
        const occupancyValue = document.getElementById(componentId + '-occupancy-value');
        const nightsValue = document.getElementById(componentId + '-nights-value');
        const monthlyRevenue = document.getElementById(componentId + '-monthly-revenue');
        const annualRevenue = document.getElementById(componentId + '-annual-revenue');
        
        if (!rateSlider || !occupancySlider) return;
        
        const rate = parseFloat(rateSlider.value);
        const occupancy = parseFloat(occupancySlider.value) / 100;
        
        // Update display values
        rateValue.textContent = rate;
        occupancyValue.textContent = Math.round(occupancy * 100);
        nightsValue.textContent = Math.round(365 * occupancy);
        
        // Calculate revenues
        const monthly = Math.round(rate * 30.4 * occupancy);
        const annual = Math.round(rate * 365 * occupancy);
        
        monthlyRevenue.textContent = monthly.toLocaleString();
        annualRevenue.textContent = annual.toLocaleString();
        
        // Update comparison if LTR data available
        const ltrRent = window.appState?.currentAnalysis?.long_term_rental?.monthly_rent || 
                       window.appState?.currentAnalysis?.longTermRental?.monthlyRent || 0;
        const comparison = document.getElementById(componentId + '-comparison');
        if (comparison && ltrRent > 0) {
          const diff = monthly - ltrRent;
          const percent = Math.round((diff / ltrRent) * 100);
          comparison.innerHTML = diff > 0 
            ? \`+$\${Math.abs(diff).toLocaleString()}/mo (+\${percent}%)\`
            : \`-$\${Math.abs(diff).toLocaleString()}/mo (\${percent}%)\`;
          comparison.className = diff > 0 
            ? 'text-lg font-bold text-green-600' 
            : 'text-lg font-bold text-red-600';
        }
      };
      
      // Reset function
      window.resetSTRCalculator = function(componentId) {
        const rateSlider = document.getElementById(componentId + '-rate-slider');
        const occupancySlider = document.getElementById(componentId + '-occupancy-slider');
        if (rateSlider) rateSlider.value = ${defaultNightlyRate};
        if (occupancySlider) occupancySlider.value = ${defaultOccupancy};
        window.updateSTRCalculator(componentId);
      };
      
      // Initialize
      setTimeout(() => window.updateSTRCalculator('${componentId}'), 100);
    </script>
    
    <style>
      /* Custom slider styles */
      .slider-purple::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: #7c3aed;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .slider-purple::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #7c3aed;
        cursor: pointer;
        border-radius: 50%;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .slider-blue::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: #2563eb;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .slider-blue::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #2563eb;
        cursor: pointer;
        border-radius: 50%;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
    </style>
  `;
};

// Export for global use
window.STRRevenueCalculator = STRRevenueCalculator;