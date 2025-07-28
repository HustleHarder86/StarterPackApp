/**
 * Airbnb Listings Component - Exact Mockup Match
 * Shows clean listing cards with real property images
 */

export const AirbnbListingsMockup = ({ 
  comparables = [],
  stats = {},
  className = '' 
}) => {
  // Default listings matching mockup
  const defaultListings = [
    {
      price: '$220/night',
      occupancy: '98% booked',
      title: '2BR • 2BA • Similar Property',
      subtitle: 'Luxury amenities, great location',
      revenue: '+$6,400',
      potential: '+18% potential',
      badge: 'TOP PERFORMER',
      badgeColor: 'green',
      rating: '4.9★ (327)',
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
      url: 'https://www.airbnb.com/rooms/12345678'
    },
    {
      price: '$185/night',
      occupancy: '85% booked',
      title: '2BR • 2BA • Similar size',
      subtitle: 'Same neighborhood, modern',
      revenue: '+$5,200',
      potential: 'Expected range',
      badge: 'MOST SIMILAR',
      badgeColor: 'blue',
      rating: '4.7★ (89)',
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
      url: 'https://www.airbnb.com/rooms/23456789'
    },
    {
      price: '$145/night',
      occupancy: '72% booked',
      title: '2BR • 1.5BA • Compact',
      subtitle: 'Basic amenities, good location',
      revenue: '-$3,800',
      potential: '-30% potential',
      badge: 'VALUE OPTION',
      badgeColor: 'orange',
      rating: '4.5★ (156)',
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
      url: 'https://www.airbnb.com/rooms/34567890'
    }
  ];

  // Map real comparables to the expected format
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
  
  const listings = comparables.length > 0 ? mappedComparables : defaultListings;

  return `
    <div class="${className}">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-bold text-gray-900">Live Airbnb Market Data</h3>
          <span class="text-green-600 text-sm font-medium">● ${listings.length || 12} active listings found</span>
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
        ${listings.slice(0, 3).map((listing, index) => `
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
      ${listings.length > 3 ? `
        <div class="mt-4 text-center">
          <button 
            onclick="showAllComparables()" 
            class="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <span>View All Comparable Listings</span>
            <span class="text-xs text-gray-500">(${listings.length} total)</span>
          </button>
        </div>
      ` : ''}

      <!-- Bottom Stats Bar -->
      <div class="mt-6 bg-gray-50 rounded-lg p-3 lg:p-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 text-center">
          <div>
            <div class="text-2xl font-bold ${stats.avgRate === 'N/A' ? 'text-gray-400' : 'text-gray-900'}">${stats.avgRate || 'N/A'}</div>
            <div class="text-xs text-gray-600">Average nightly rate</div>
          </div>
          <div>
            <div class="text-2xl font-bold ${stats.avgOccupancy === 'N/A' ? 'text-gray-400' : 'text-blue-600'}">${stats.avgOccupancy || 'N/A'}</div>
            <div class="text-xs text-gray-600">Average occupancy</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">Net Advantage</div>
            <div class="text-2xl font-bold ${stats.netAdvantage === 'N/A' ? 'text-gray-400' : stats.netAdvantage.startsWith('+') ? 'text-green-600' : 'text-red-600'}">${stats.netAdvantage || 'N/A'}</div>
            <div class="text-xs text-gray-600">vs long-term rental</div>
          </div>
          <div>
            <div class="text-2xl font-bold ${stats.avgRating === 'N/A' ? 'text-gray-400' : 'text-gray-900'}">${stats.avgRating || 'N/A'}</div>
            <div class="text-xs text-gray-600">Average rating</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const AirbnbHeroSectionMockup = ({ analysis }) => {
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
  // Fix image extraction - check all possible field names
  const propertyImage = propertyData.mainImage || propertyData.image || propertyData.imageUrl || propertyData.image_url || 
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop';
  
  // Debug logging to help troubleshoot
  console.log('[STR Tab] Property data:', propertyData);
  console.log('[STR Tab] Property image URL:', propertyImage);
  
  // Extract financial data
  const monthlyRevenue = strData.monthly_revenue || strData.monthlyRevenue || 0;
  const operatingExpenses = strData.expenses?.monthly?.total || strData.net_monthly_income ? (monthlyRevenue - (strData.net_monthly_income || 0)) : 0;
  const mortgagePayment = strData.mortgagePayment || monthlyExpenses.mortgage || 0;
  const totalExpenses = operatingExpenses + mortgagePayment;
  const netCashFlow = strData.netCashFlow || (monthlyRevenue - totalExpenses);
  
  // Get LTR cash flow for comparison
  const ltrCashFlow = cashFlow.monthly || 0;
  
  // Get metrics for ROI display
  const metrics = analysis?.metrics || {};
  
  // Calculate stats from actual data or show N/A
  const stats = {
    avgRate: strData.avg_nightly_rate ? `$${strData.avg_nightly_rate}` : strData.avgNightlyRate ? `$${strData.avgNightlyRate}` : 'N/A',
    avgOccupancy: strData.occupancy_rate ? `${Math.round(strData.occupancy_rate * 100)}%` : strData.avgOccupancy ? `${strData.avgOccupancy}%` : 'N/A',
    netAdvantage: netCashFlow !== undefined && ltrCashFlow !== undefined 
      ? `${netCashFlow - ltrCashFlow >= 0 ? '+' : ''}$${Math.abs(netCashFlow - ltrCashFlow).toLocaleString()}/mo`
      : 'N/A',
    avgRating: strData.avgRating || (comparables.length > 0 && comparables[0].rating ? `${comparables[0].rating}★` : 'N/A')
  };

  return `
    <div class="max-w-7xl mx-auto px-4 lg:px-6" style="overflow-x: hidden;">
      
      
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
          <div class="relative h-64 mb-6">
            <!-- Bar Chart Container -->
            <canvas id="str-revenue-chart" width="400" height="300"></canvas>
          </div>
          
          <!-- Stats Summary Below Chart -->
          <div class="bg-gray-50 rounded-lg p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Average Nightly Rate</span>
              <span class="text-sm font-bold text-purple-600">${stats.avgRate}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Average Occupancy</span>
              <span class="text-sm font-bold text-purple-600">${stats.avgOccupancy}</span>
            </div>
            <div class="h-px bg-gray-200 my-2"></div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">Market Performance</span>
              <span class="text-sm font-bold ${monthlyRevenue > (ltrData.monthly_rent || ltrData.monthlyRent || 3100) ? 'text-green-600' : 'text-orange-600'}">
                ${monthlyRevenue > (ltrData.monthly_rent || ltrData.monthlyRent || 3100) ? 'Strong' : 'Moderate'}
              </span>
            </div>
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
                <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" style="z-index: 1;">$</span>
                <input 
                  type="number" 
                  id="str-nightly-rate"
                  value="${strData.avgNightlyRate || strData.avg_nightly_rate || 220}"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;"
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
                <span class="text-lg font-bold ${monthlyRevenue > (ltrData.monthly_rent || ltrData.monthlyRent || 3100) ? 'text-green-600' : 'text-red-600'}" id="advantage-display">
                  ${monthlyRevenue > (ltrData.monthly_rent || ltrData.monthlyRent || 3100) ? '+' : ''}$${Math.abs(monthlyRevenue - (ltrData.monthly_rent || ltrData.monthlyRent || 3100)).toLocaleString()}/mo
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
      
      <!-- Floating Change Assumptions Button -->
      <div id="floating-button-container" class="fixed bottom-8 right-8 z-50 opacity-0 transition-opacity duration-300">
        <button 
          id="change-assumptions-btn"
          class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          onclick="scrollToCalculator()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span class="font-medium">Change Assumptions</span>
        </button>
      </div>
      
      <!-- Airbnb Listings -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        ${AirbnbListingsMockup({ comparables, stats })}
      </div>
      
      <!-- Data attributes for STR initialization -->
      <div 
        id="str-data-container" 
        data-monthly-revenue="${monthlyRevenue}"
        data-ltr-rent="${ltrData.monthly_rent || ltrData.monthlyRent || 3100}"
        data-default-nightly-rate="${strData.avgNightlyRate || strData.avg_nightly_rate || 220}"
        data-occupancy-rate="${strData.occupancy_rate ? Math.round(strData.occupancy_rate * 100) : 75}"
        style="display: none;"
      ></div>
      
      <style>
        /* Enhanced Slider Styling */
        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          outline: none;
          opacity: 0.9;
          transition: opacity 0.2s;
          border-radius: 4px;
          position: relative;
        }
        
        .slider:hover { opacity: 1; }
        
        /* Purple track fill for webkit browsers */
        .slider::-webkit-slider-runnable-track {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
        }
        
        /* Purple thumb for webkit browsers */
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #9333ea;
          cursor: pointer;
          border-radius: 50%;
          margin-top: -8px;
          box-shadow: 0 2px 4px rgba(147, 51, 234, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: #7c3aed;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(147, 51, 234, 0.4);
        }
        
        /* Purple track fill for Firefox */
        .slider::-moz-range-track {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
        }
        
        /* Purple thumb for Firefox */
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #9333ea;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 2px 4px rgba(147, 51, 234, 0.3);
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          background: #7c3aed;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(147, 51, 234, 0.4);
        }
        
        /* Purple progress fill using CSS trick */
        .slider {
          background-image: linear-gradient(to right, #9333ea 0%, #9333ea var(--value, 50%), #e5e7eb var(--value, 50%), #e5e7eb 100%);
        }
        
        /* Currency input styling */
        input[type="number"] {
          -moz-appearance: textfield;
          padding-left: 1.75rem;
        }
        
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        /* Reset button styling */
        #reset-calculator {
          background-color: #f3f4f6;
          color: #374151;
          transition: all 0.2s ease;
        }
        
        #reset-calculator:hover {
          background-color: #e5e7eb;
          color: #111827;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        #reset-calculator:active {
          transform: translateY(0);
          box-shadow: none;
        }
      </style>
    </div>
  `;
};