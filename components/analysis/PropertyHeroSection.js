(function() {
  window.PropertyHeroSection = function({ property, analysis }) {
  if (!property) return null;
  
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Only use real data - no fallback values
  const price = property.purchasePrice || property.price;
  if (!price) {
    return `
      <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <div class="px-8 py-6">
          <div class="bg-red-900/50 rounded-lg p-4">
            <p class="text-white font-semibold">⚠️ Property data incomplete</p>
            <p class="text-red-200 text-sm mt-2">Critical property information is missing. Please ensure the property analysis has completed successfully.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  // Calculate key metrics using real data only
  const capRate = analysis?.capRate || 
    (property.monthlyRevenue && property.annualExpenses && property.purchasePrice ? 
      ((property.monthlyRevenue * 12 - property.annualExpenses) / property.purchasePrice * 100).toFixed(1) : null);
  const cashFlow = analysis?.monthlyCashFlow || property.monthlyCashFlow || null;
  const roi = analysis?.totalROI || null;
  const payback = analysis?.paybackPeriod || null;
  const occupancy = analysis?.occupancyRate || null;
  const score = property.investmentScore || analysis?.investmentScore || null;
  
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
            <p class="text-indigo-100">${property.fullAddress || `${property.city || ''} ${property.province || ''} ${property.postalCode || ''}`.trim() || 'Location details unavailable'}</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold">${formatPrice(price)}</div>
            <div class="text-sm text-indigo-200">
              ${property.bedrooms ? `${property.bedrooms} bed` : ''} ${property.bedrooms && property.bathrooms ? '•' : ''} ${property.bathrooms ? `${property.bathrooms} bath` : ''} ${(property.bedrooms || property.bathrooms) && (property.squareFootage || property.sqft) ? '•' : ''} ${property.squareFootage || property.sqft ? `${(property.squareFootage || property.sqft).toLocaleString()} sqft` : ''}
              ${!property.bedrooms && !property.bathrooms && !property.squareFootage && !property.sqft ? 'Property details unavailable' : ''}
            </div>
          </div>
        </div>
        
        <!-- Quick Metrics Bar -->
        <div class="grid grid-cols-6 gap-4">
          <div class="text-center">
            <div class="text-xl font-bold">${capRate ? `${capRate}%` : '--'}</div>
            <div class="text-xs text-indigo-200">Cap Rate</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${cashFlow ? formatPrice(cashFlow) : '--'}</div>
            <div class="text-xs text-indigo-200">Cash Flow</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${roi ? `${roi}%` : '--'}</div>
            <div class="text-xs text-indigo-200">ROI</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${payback ? `${payback}y` : '--'}</div>
            <div class="text-xs text-indigo-200">Payback</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${occupancy ? `${occupancy}%` : '--'}</div>
            <div class="text-xs text-indigo-200">Occupancy</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold">${score || '--'}</div>
            <div class="text-xs text-indigo-200">Score</div>
          </div>
        </div>
      </div>
    </div>
  `;
  };
})();