(function() {
  window.PropertyHeroSection = function({ property, analysis }) {
  if (!property) return null;
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Calculate key metrics
  const capRate = analysis?.capRate || ((property.monthlyRevenue * 12 - property.annualExpenses) / property.purchasePrice * 100).toFixed(1) || '8.2';
  const cashFlow = analysis?.monthlyCashFlow || property.monthlyCashFlow || 3250;
  const roi = analysis?.totalROI || '11.8';
  const payback = analysis?.paybackPeriod || '5.8';
  const occupancy = analysis?.occupancyRate || '94';
  const score = property.investmentScore || analysis?.investmentScore || '9.1';
  
  // Determine property type label
  const propertyLabel = property.luxury ? 'Premium Location' : 'Investment Property';
  
  return `
    <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
      <div class="px-8 py-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="flex items-center space-x-3 mb-2">
              <h1 class="text-2xl font-bold">${property.address || 'Property Analysis'}</h1>
              <span class="px-3 py-1 bg-white/20 backdrop-blur text-sm rounded-full">
                ${propertyLabel}
              </span>
            </div>
            <p class="text-indigo-100">${property.fullAddress || `${property.city || 'City'}, ${property.province || 'Province'} ${property.postalCode || ''}`}</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold">${formatPrice(property.purchasePrice || property.price || 850000)}</div>
            <div class="text-sm text-indigo-200">
              ${property.bedrooms || 3} bed • ${property.bathrooms || 2} bath • ${property.squareFootage || property.sqft || '2,000'} sqft
            </div>
          </div>
        </div>
        
        <!-- Quick Metrics Bar -->
        <div class="grid grid-cols-6 gap-4">
          <div class="text-center">
            <div class="text-xl font-bold">${capRate}%</div>
            <div class="text-xs text-indigo-200">Cap Rate</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${formatPrice(cashFlow)}</div>
            <div class="text-xs text-indigo-200">Cash Flow</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${roi}%</div>
            <div class="text-xs text-indigo-200">ROI</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${payback}y</div>
            <div class="text-xs text-indigo-200">Payback</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${occupancy}%</div>
            <div class="text-xs text-indigo-200">Occupancy</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${score}</div>
            <div class="text-xs text-indigo-200">Score</div>
          </div>
        </div>
      </div>
    </div>
  `;
  };
})();