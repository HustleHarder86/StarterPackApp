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
    <div class="gradient-hero">
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
          <div class="text-3xl font-bold">${formatPrice(property.purchasePrice || 850000)}</div>
          <div class="text-sm text-indigo-200">
            ${property.bedrooms || 3} bed • ${property.bathrooms || 2} bath • ${property.squareFootage || '2,000'} sqft
          </div>
        </div>
      </div>
      
      <!-- Quick Metrics Bar -->
      <div class="metrics-bar">
        <div class="metric-item">
          <div class="metric-value">${capRate}%</div>
          <div class="metric-label">Cap Rate</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${formatPrice(cashFlow)}</div>
          <div class="metric-label">Cash Flow</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${roi}%</div>
          <div class="metric-label">ROI</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${payback}y</div>
          <div class="metric-label">Payback</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${occupancy}%</div>
          <div class="metric-label">Occupancy</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">${score}</div>
          <div class="metric-label">Score</div>
        </div>
      </div>
    </div>
  `;
  };
})();