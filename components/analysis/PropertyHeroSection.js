export default function PropertyHeroSection({ property }) {
  if (!property) return null;
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  return `
    <div class="property-hero-gradient text-white">
      <div class="px-4 py-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold">${property.address || '123 Main Street'}</h1>
          <div class="flex items-center gap-2">
            <span class="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-sm font-medium">
              Investment Analysis
            </span>
          </div>
        </div>
        
        <div class="mb-6">
          <p class="text-purple-100 text-lg mb-1">${property.city || 'Toronto'}, ${property.province || 'ON'}</p>
          <p class="text-3xl font-bold">${formatPrice(property.purchasePrice || 850000)}</p>
        </div>
        
        <!-- Key Stats Pills -->
        <div class="grid grid-cols-3 gap-3">
          <div class="stats-pill rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-gray-900">
              ${property.strAdvantage || '+47%'}
            </div>
            <div class="text-xs text-gray-600">vs LTR</div>
          </div>
          <div class="stats-pill rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-gray-900">
              ${formatPrice(property.monthlyRevenue || 5400)}
            </div>
            <div class="text-xs text-gray-600">Monthly</div>
          </div>
          <div class="stats-pill rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-gray-900">
              ${property.investmentScore || '8.7'}/10
            </div>
            <div class="text-xs text-gray-600">Score</div>
          </div>
        </div>
      </div>
    </div>
  `;
}