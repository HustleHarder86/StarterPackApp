/**
 * Market Comparison Component - Compact Modern Design
 * Displays comparable properties with glass morphism cards
 */

(function() {
  window.MarketComparisonCompactModern = function({ 
  comparables = [],
  averageCapRate = 7.9,
  marketAverage = 1400000
}) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Default comparables if none provided
  const defaultComparables = [
    {
      address: '234 Waterfront',
      price: 1300000,
      capRate: 7.8,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=120&fit=crop'
    },
    {
      address: '890 Lakeview',
      price: 1500000,
      capRate: 8.1,
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=120&fit=crop'
    },
    {
      address: '456 Shore Dr',
      price: 1400000,
      capRate: 7.9,
      image: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=200&h=120&fit=crop'
    }
  ];

  const displayComparables = comparables.length > 0 ? comparables : defaultComparables;

  return `
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Market Comparison</h3>
        <span class="text-sm text-gray-600">Avg Cap Rate: ${averageCapRate}%</span>
      </div>
      
      <div class="grid grid-cols-3 gap-4">
        ${displayComparables.slice(0, 3).map(comp => `
          <div class="metric-card rounded-lg p-4 hover:shadow-glow transition-all cursor-pointer">
            <img src="${comp.image}" 
                 alt="${comp.address}" 
                 class="w-full h-20 object-cover rounded mb-3"
                 loading="lazy">
            <div class="text-sm font-medium">${comp.address}</div>
            <div class="text-xs text-gray-600">${formatCurrency(comp.price)} • ${comp.capRate}% Cap</div>
          </div>
        `).join('')}
      </div>
      
      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600">Market Average</span>
          <span class="text-sm font-semibold">${formatCurrency(marketAverage)}</span>
        </div>
      </div>
    </div>
  `;
  };
})();