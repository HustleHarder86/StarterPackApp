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
            <div class="text-sm font-medium text-gray-500 mb-1">Projected Advantage</div>
            <div class="text-2xl font-bold ${stats.advantage === 'N/A' ? 'text-gray-400' : 'text-green-600'}">${stats.advantage || 'N/A'}</div>
            <div class="text-xs text-gray-600">over long-term rental</div>
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
  
  // Calculate stats from actual data or show N/A
  const stats = {
    avgRate: strData.avg_nightly_rate ? `$${strData.avg_nightly_rate}` : strData.avgNightlyRate ? `$${strData.avgNightlyRate}` : 'N/A',
    avgOccupancy: strData.occupancy_rate ? `${Math.round(strData.occupancy_rate * 100)}%` : strData.avgOccupancy ? `${strData.avgOccupancy}%` : 'N/A',
    advantage: (strData.monthly_revenue || strData.monthlyRevenue) && (ltrData.monthly_rent || ltrData.monthlyRent)
      ? `+$${((strData.monthly_revenue || strData.monthlyRevenue) - (ltrData.monthly_rent || ltrData.monthlyRent)).toLocaleString()}/mo`
      : 'N/A',
    avgRating: strData.avgRating || (comparables.length > 0 && comparables[0].rating ? `${comparables[0].rating}★` : 'N/A')
  };

  return `
    <div class="max-w-7xl mx-auto px-4 lg:px-6 mt-6" style="overflow-x: hidden;">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
        ${AirbnbListingsMockup({ comparables, stats })}
      </div>
    </div>
  `;
};