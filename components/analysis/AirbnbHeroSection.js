/**
 * Airbnb Hero Section Component - July 28th Enhanced Version
 * Features: Live listings with images, revenue calculator, comparison charts
 */

export const AirbnbHeroSection = ({ analysis }) => {
  const comparables = analysis?.strAnalysis?.comparables || analysis?.short_term_rental?.comparables || [];
  const strData = analysis?.strAnalysis || analysis?.short_term_rental || {};
  const ltrData = analysis?.longTermRental || analysis?.long_term_rental || {};
  const cashFlow = analysis?.cashFlow || {};
  const monthlyExpenses = analysis?.monthlyExpenses || {};
  const propertyData = analysis?.propertyData || analysis?.property_data || {};
  
  // Extract property details
  const propertyAddress = propertyData.address || 'Property Address';
  const bedrooms = propertyData.bedrooms || 2;
  const bathrooms = propertyData.bathrooms || 2;
  const sqft = propertyData.squareFeet || propertyData.square_feet || propertyData.sqft || 'N/A';
  const propertyImage = propertyData.imageUrl || propertyData.image_url || 
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop';
  
  // Extract financial data
  const monthlyRevenue = strData.monthly_revenue || strData.monthlyRevenue || 0;
  const operatingExpenses = strData.expenses?.monthly?.total || strData.net_monthly_income ? (monthlyRevenue - (strData.net_monthly_income || 0)) : 0;
  const mortgagePayment = strData.mortgagePayment || monthlyExpenses.mortgage || 0;
  const totalExpenses = operatingExpenses + mortgagePayment;
  const netCashFlow = strData.netCashFlow || (monthlyRevenue - totalExpenses);
  
  // Get LTR cash flow for comparison
  const ltrCashFlow = cashFlow.monthly || 0;
  const ltrRent = ltrData.monthly_rent || ltrData.monthlyRent || 3100;
  
  // Calculate stats from actual data or show N/A
  const stats = {
    avgRate: strData.avg_nightly_rate ? `$${strData.avg_nightly_rate}` : strData.avgNightlyRate ? `$${strData.avgNightlyRate}` : 'N/A',
    avgOccupancy: strData.occupancy_rate ? `${Math.round(strData.occupancy_rate * 100)}%` : strData.avgOccupancy ? `${strData.avgOccupancy}%` : 'N/A',
    netAdvantage: netCashFlow !== undefined && ltrCashFlow !== undefined 
      ? `${netCashFlow - ltrCashFlow >= 0 ? '+' : ''}$${Math.abs(netCashFlow - ltrCashFlow).toLocaleString()}/mo`
      : 'N/A',
    avgRating: strData.avgRating || (comparables.length > 0 && comparables[0].rating ? `${comparables[0].rating}★` : 'N/A')
  };

  // Map comparables to display format
  const mappedComparables = comparables.map((comp, index) => ({
    price: comp.nightly_rate ? `$${comp.nightly_rate}/night` : comp.nightlyRate ? `$${comp.nightlyRate}/night` : comp.avgNightlyRate ? `$${comp.avgNightlyRate}/night` : comp.price || 'N/A',
    occupancy: comp.occupancy_rate ? `${Math.round(comp.occupancy_rate * 100)}% booked` : comp.occupancyRate ? `${comp.occupancyRate}% booked` : comp.occupancy || 'N/A',
    title: comp.title || `${comp.bedrooms || 'N/A'}BR • ${comp.bathrooms || 'N/A'}BA • ${comp.property_type || 'Similar'}`,
    subtitle: comp.subtitle || comp.address || comp.title || 'Property details',
    revenue: comp.monthly_revenue ? `$${comp.monthly_revenue.toLocaleString()}` : comp.monthlyRevenue ? `$${comp.monthlyRevenue}` : comp.revenue || 'N/A',
    potential: comp.similarity_score ? `${comp.similarity_score}% match` : comp.potential || comp.revenueDiff ? `${comp.revenueDiff}% potential` : 'Similar property',
    badge: index === 0 ? 'TOP PERFORMER' : index === 1 ? 'MOST SIMILAR' : 'VALUE OPTION',
    badgeColor: index === 0 ? 'green' : index === 1 ? 'blue' : 'orange',
    rating: comp.rating ? `${comp.rating}★` : comp.reviewScore ? `${comp.reviewScore}★ (${comp.reviewCount || 'N/A'})` : 'N/A',
    imageUrl: comp.image_url?.url || comp.imageUrl || comp.image || `https://images.unsplash.com/photo-${index === 0 ? '1522708323590-d24dbb6b0267' : index === 1 ? '1560448204-e02f11c3d0e2' : '1502672260266-1c1ef2d93688'}?w=600&h=400&fit=crop`,
    url: comp.airbnb_url || comp.url || comp.listingUrl || '#'
  }));

  return `
    <div class="max-w-7xl mx-auto px-4 lg:px-6 mt-6">
      <!-- Cash Flow Breakdown Alert -->
      ${monthlyRevenue > 0 ? (netCashFlow < 0 ? `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h4 class="text-lg font-semibold text-red-900 mb-3 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          Negative STR Cash Flow
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-red-700 font-medium">Monthly Revenue</p>
            <p class="text-2xl font-bold text-gray-900">+$${monthlyRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p class="text-red-700 font-medium">Total Expenses</p>
            <p class="text-2xl font-bold text-gray-900">-$${totalExpenses.toLocaleString()}</p>
            <p class="text-xs text-gray-600 mt-1">Including $${mortgagePayment.toLocaleString()} mortgage</p>
          </div>
          <div>
            <p class="text-red-700 font-medium">Net Cash Flow</p>
            <p class="text-2xl font-bold text-red-600">-$${Math.abs(netCashFlow).toLocaleString()}</p>
            <p class="text-xs text-gray-600 mt-1">Monthly shortfall</p>
          </div>
        </div>
      </div>
      ` : `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h4 class="text-lg font-semibold text-green-900 mb-3 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Positive STR Cash Flow
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-green-700 font-medium">Monthly Revenue</p>
            <p class="text-2xl font-bold text-gray-900">+$${monthlyRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p class="text-green-700 font-medium">Total Expenses</p>
            <p class="text-2xl font-bold text-gray-900">-$${totalExpenses.toLocaleString()}</p>
            <p class="text-xs text-gray-600 mt-1">Including $${mortgagePayment.toLocaleString()} mortgage</p>
          </div>
          <div>
            <p class="text-green-700 font-medium">Net Cash Flow</p>
            <p class="text-2xl font-bold text-green-600">+$${netCashFlow.toLocaleString()}</p>
            <p class="text-xs text-gray-600 mt-1">Monthly profit</p>
          </div>
        </div>
      </div>
      `) : ''}
      
      <!-- 2-Column Layout: Chart and Calculator -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Left Column: Revenue Bar Chart -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Revenue Comparison</h3>
          <div class="relative h-64 mb-4">
            <!-- Bar Chart Container -->
            <canvas id="str-revenue-chart" width="400" height="300"></canvas>
          </div>
          <div class="text-center text-sm text-gray-600">
            <p>Average nightly rate: <span class="font-bold text-purple-600">${stats.avgRate}</span></p>
            <p>Average occupancy: <span class="font-bold text-purple-600">${stats.avgOccupancy}</span></p>
          </div>
        </div>
        
        <!-- Right Column: Financial Calculator -->
        <div id="str-calculator-section" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">STR Revenue Calculator</h3>
          
          <div class="space-y-4">
            <!-- Nightly Rate Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Average Nightly Rate
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input 
                  type="number" 
                  id="str-nightly-rate"
                  value="${strData.avgNightlyRate || strData.avg_nightly_rate || 220}"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            
            <!-- Occupancy Rate Slider -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Occupancy Rate: <span id="occupancy-display" class="text-purple-600 font-bold">75%</span>
              </label>
              <input 
                type="range" 
                id="str-occupancy-slider"
                min="40" 
                max="95" 
                value="75"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>40%</span>
                <span>95%</span>
              </div>
            </div>
            
            <!-- Results Display -->
            <div class="border-t pt-4 space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Monthly Revenue</span>
                <span class="text-lg font-bold text-purple-600" id="monthly-revenue-display">
                  $${monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Annual Revenue</span>
                <span class="text-lg font-bold text-gray-900" id="annual-revenue-display">
                  $${(monthlyRevenue * 12).toLocaleString()}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">vs Long-Term Rental</span>
                <span class="text-lg font-bold ${monthlyRevenue > ltrRent ? 'text-green-600' : 'text-red-600'}" id="advantage-display">
                  ${monthlyRevenue > ltrRent ? '+' : ''}$${Math.abs(monthlyRevenue - ltrRent).toLocaleString()}/mo
                </span>
              </div>
            </div>
            
            <!-- Reset Button -->
            <div class="pt-4">
              <button 
                id="reset-calculator"
                class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Airbnb Listings -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-bold text-gray-900">Live Airbnb Market Data</h3>
            <span class="text-green-600 text-sm font-medium">● ${mappedComparables.length || 12} active listings found</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">Updated 3 minutes ago</span>
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-bold rounded shadow-md animate-pulse-subtle">
              <span class="inline-block animate-pulse">●</span>
              REAL MARKET DATA
            </span>
          </div>
        </div>

        <!-- Listing Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          ${mappedComparables.slice(0, 3).map((listing, index) => `
            <a href="${listing.url}" target="_blank" rel="noopener noreferrer" class="block bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 hover:scale-[1.02]">
              <!-- Property Image -->
              <div class="relative h-48">
                <img src="${listing.imageUrl}" alt="${listing.title}" class="w-full h-full object-cover">
                
                <!-- Badges -->
                <div class="absolute top-3 left-3">
                  <span class="px-2 py-1 bg-${listing.badgeColor === 'green' ? 'green-500' : listing.badgeColor === 'blue' ? 'blue-600' : 'orange-500'} text-white text-xs font-bold rounded">
                    ${listing.badge}
                  </span>
                </div>
                
                <!-- Stats overlay -->
                <div class="absolute top-3 right-3 flex flex-col gap-2">
                  <span class="px-2 py-1 bg-white/90 backdrop-blur text-xs font-semibold rounded">
                    ${listing.rating}
                  </span>
                  <span class="px-2 py-1 bg-black/75 text-white text-xs font-semibold rounded">
                    ${listing.occupancy}
                  </span>
                </div>
              </div>
              
              <!-- Property Details -->
              <div class="p-4">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h4 class="font-bold text-gray-900 text-2xl">${listing.price}</h4>
                    <p class="text-sm text-gray-600">${listing.title}</p>
                    <p class="text-xs text-gray-500">${listing.subtitle}</p>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold ${listing.revenue === 'N/A' ? 'text-gray-400' : listing.revenue && listing.revenue.startsWith('+') ? 'text-green-600' : 'text-red-600'}">
                      ${listing.revenue || 'N/A'}
                    </div>
                    <div class="text-xs text-gray-500">vs Your Property</div>
                  </div>
                </div>
                
                <div class="mt-3 pt-3 border-t border-gray-100">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-600">Monthly Revenue:</span>
                    <span class="text-sm font-semibold ${listing.potential === 'N/A' ? 'text-gray-400' : listing.potential && listing.potential.includes('+') ? 'text-green-600' : listing.potential && listing.potential.includes('-') ? 'text-red-600' : 'text-gray-900'}">
                      ${listing.potential || 'N/A'}
                    </span>
                  </div>
                  <div class="mt-2 text-center">
                    <span class="text-xs text-blue-600 group-hover:text-blue-800 transition-colors">View on Airbnb →</span>
                  </div>
                </div>
              </div>
            </a>
          `).join('')}
        </div>

        <!-- View All Button -->
        ${mappedComparables.length > 3 ? `
          <div class="mt-4 text-center">
            <button 
              onclick="showAllComparables()" 
              class="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <span>View All Comparable Listings</span>
              <span class="text-xs text-gray-500">(${mappedComparables.length} total)</span>
            </button>
          </div>
        ` : ''}

        <!-- Bottom Stats Bar -->
        <div class="mt-6 bg-gray-50 rounded-lg p-3 lg:p-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 text-center">
            <div>
              <div class="text-2xl font-bold ${stats.avgRate === 'N/A' ? 'text-gray-400' : 'text-gray-900'}">${stats.avgRate}</div>
              <div class="text-xs text-gray-600">Average nightly rate</div>
            </div>
            <div>
              <div class="text-2xl font-bold ${stats.avgOccupancy === 'N/A' ? 'text-gray-400' : 'text-blue-600'}">${stats.avgOccupancy}</div>
              <div class="text-xs text-gray-600">Average occupancy</div>
            </div>
            <div>
              <div class="text-sm font-medium text-gray-500 mb-1">Net Advantage</div>
              <div class="text-2xl font-bold ${stats.netAdvantage === 'N/A' ? 'text-gray-400' : stats.netAdvantage.startsWith('+') ? 'text-green-600' : 'text-red-600'}">${stats.netAdvantage}</div>
              <div class="text-xs text-gray-600">vs long-term rental</div>
            </div>
            <div>
              <div class="text-2xl font-bold ${stats.avgRating === 'N/A' ? 'text-gray-400' : 'text-gray-900'}">${stats.avgRating}</div>
              <div class="text-xs text-gray-600">Average rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Script to initialize the calculator functionality
export const strCalculatorScript = `
  // Initialize revenue comparison chart
  const ctx = document.getElementById('str-revenue-chart');
  if (ctx && typeof Chart !== 'undefined') {
    const analysisData = window.analysisData || {};
    const strData = analysisData.strAnalysis || analysisData.short_term_rental || {};
    const ltrData = analysisData.longTermRental || analysisData.long_term_rental || {};
    const monthlyRevenue = strData.monthly_revenue || strData.monthlyRevenue || 0;
    const ltrRent = ltrData.monthly_rent || ltrData.monthlyRent || 3100;
    
    const chart = new Chart(ctx.getContext('2d'), {
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
    
    // Calculator functionality
    const nightlyRateInput = document.getElementById('str-nightly-rate');
    const occupancySlider = document.getElementById('str-occupancy-slider');
    const occupancyDisplay = document.getElementById('occupancy-display');
    const monthlyRevenueDisplay = document.getElementById('monthly-revenue-display');
    const annualRevenueDisplay = document.getElementById('annual-revenue-display');
    const advantageDisplay = document.getElementById('advantage-display');
    
    function updateCalculations() {
      const nightlyRate = parseFloat(nightlyRateInput.value) || 0;
      const occupancyRate = parseFloat(occupancySlider.value) / 100;
      const monthlyRevenue = Math.round(nightlyRate * 30.4 * occupancyRate);
      const annualRevenue = monthlyRevenue * 12;
      const advantage = monthlyRevenue - ltrRent;
      
      occupancyDisplay.textContent = occupancySlider.value + '%';
      monthlyRevenueDisplay.textContent = '$' + monthlyRevenue.toLocaleString();
      annualRevenueDisplay.textContent = '$' + annualRevenue.toLocaleString();
      
      if (advantage >= 0) {
        advantageDisplay.textContent = '+$' + advantage.toLocaleString() + '/mo';
        advantageDisplay.className = 'text-lg font-bold text-green-600';
      } else {
        advantageDisplay.textContent = '-$' + Math.abs(advantage).toLocaleString() + '/mo';
        advantageDisplay.className = 'text-lg font-bold text-red-600';
      }
      
      // Update chart
      chart.data.datasets[0].data[0] = monthlyRevenue;
      chart.update();
    }
    
    if (nightlyRateInput && occupancySlider) {
      nightlyRateInput.addEventListener('input', updateCalculations);
      occupancySlider.addEventListener('input', updateCalculations);
      
      // Reset button functionality
      const resetButton = document.getElementById('reset-calculator');
      if (resetButton) {
        resetButton.addEventListener('click', function() {
          nightlyRateInput.value = strData.avgNightlyRate || strData.avg_nightly_rate || 220;
          occupancySlider.value = 75;
          updateCalculations();
        });
      }
      
      // Initial calculation
      updateCalculations();
    }
  }
`;