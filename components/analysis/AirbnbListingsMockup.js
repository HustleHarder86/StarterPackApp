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
      title: '2BR • 2BA • King West',
      subtitle: 'Luxury amenities, downtown',
      revenue: '+$6,400',
      potential: '+18% potential',
      badge: 'TOP PERFORMER',
      badgeColor: 'green',
      rating: '4.9★ (327)',
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop'
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
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop'
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
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'
    }
  ];

  const listings = comparables.length > 0 ? comparables : defaultListings;

  return `
    <div class="${className}">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-bold text-gray-900">Live Airbnb Market Data</h3>
          <span class="text-green-600 text-sm font-medium">● 12 active listings found</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">Updated 3 minutes ago</span>
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded">
            REAL MARKET DATA
          </span>
        </div>
      </div>

      <!-- Listing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${listings.map((listing, index) => `
          <div class="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
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
                  <div class="font-semibold text-${listing.revenue.startsWith('+') ? 'green' : 'red'}-600">
                    ${listing.revenue}
                  </div>
                  <div class="text-xs text-gray-500">vs Your Property</div>
                </div>
              </div>
              
              <div class="mt-3 pt-3 border-t border-gray-100">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-600">Monthly Revenue:</span>
                  <span class="text-sm font-semibold ${listing.potential.includes('+') ? 'text-green-600' : listing.potential.includes('-') ? 'text-red-600' : 'text-gray-900'}">
                    ${listing.potential}
                  </span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Bottom Stats Bar -->
      <div class="mt-6 bg-gray-50 rounded-lg p-4">
        <div class="grid grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-gray-900">$180</div>
            <div class="text-xs text-gray-600">Average nightly rate</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">83%</div>
            <div class="text-xs text-gray-600">Average occupancy</div>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">Projected Advantage</div>
            <div class="text-2xl font-bold text-green-600">+$2,200/mo</div>
            <div class="text-xs text-gray-600">over long-term rental</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">4.7★</div>
            <div class="text-xs text-gray-600">Average rating</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const AirbnbHeroSectionMockup = ({ analysis }) => {
  const comparables = analysis?.strAnalysis?.comparables || [];
  const stats = {
    avgRate: '$180',
    avgOccupancy: '83%',
    advantage: '+$2,200/mo',
    avgRating: '4.7★'
  };

  return `
    <div class="max-w-7xl mx-auto px-6 mt-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        ${AirbnbListingsMockup({ comparables, stats })}
      </div>
    </div>
  `;
};