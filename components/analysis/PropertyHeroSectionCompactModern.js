(function() {
  window.PropertyHeroSectionCompactModern = function({ property, analysis }) {
    if (!property && !analysis?.data) return null;
    
    // Extract data from analysis response
    const data = analysis?.data || {};
    const propertyDetails = data.property_details || data.propertyDetails || property || {};
    const propertyData = data.property_data || data.propertyData || {};
    const metrics = data.metrics || {};
    const strAnalysis = data.short_term_rental || data.str_analysis || {};
    const ltrAnalysis = data.long_term_rental || data.rental || {};
    
    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    };
    
    const formatNumber = (num) => {
      return new Intl.NumberFormat('en-CA').format(num);
    };
    
    // Extract property info
    const address = propertyData.address || propertyDetails.address || 'Property Analysis';
    const city = propertyData.city || propertyDetails.city || 'City';
    const province = propertyData.province || propertyDetails.province || 'Province';
    const postalCode = propertyData.postalCode || propertyData.postal_code || '';
    const price = propertyData.price || propertyDetails.estimated_value || propertyDetails.price || 0;
    const bedrooms = propertyData.bedrooms || propertyDetails.bedrooms || 0;
    const bathrooms = propertyData.bathrooms || propertyDetails.bathrooms || 0;
    const sqft = propertyData.sqft || propertyDetails.sqft || propertyDetails.square_footage || 0;
    
    // Calculate key metrics from actual data
    const monthlyRevenue = strAnalysis.monthly_revenue || strAnalysis.monthlyRevenue || 
                          ltrAnalysis.monthly_rent || ltrAnalysis.monthlyRent || 0;
    const annualRevenue = monthlyRevenue * 12;
    const monthlyExpenses = data.monthly_expenses?.total || data.expenses?.monthly?.total || 0;
    const annualExpenses = monthlyExpenses * 12;
    const netOperatingIncome = annualRevenue - annualExpenses;
    const cashFlow = monthlyRevenue - monthlyExpenses;
    
    // Calculate actual metrics
    const capRate = price > 0 ? ((netOperatingIncome / price) * 100).toFixed(1) : '0.0';
    const roi = metrics.total_roi || metrics.roi_percentage || 
               (price > 0 ? ((annualRevenue - annualExpenses) / price * 100).toFixed(1) : '0.0');
    const paybackPeriod = cashFlow > 0 ? (price / (cashFlow * 12)).toFixed(1) : '0.0';
    const occupancy = strAnalysis.occupancy_rate ? (strAnalysis.occupancy_rate * 100).toFixed(0) : 
                     ltrAnalysis.occupancy_rate ? (ltrAnalysis.occupancy_rate * 100).toFixed(0) : '94';
    const score = data.investment_score || metrics.investment_score || '8.5';
    
    // Determine property type label
    const propertyType = propertyData.propertyType || propertyDetails.property_type || 'Property';
    const propertyLabel = price > 1000000 ? 'Premium Location' : 'Investment Property';
    
    return `
      <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <div class="px-8 py-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="flex items-center space-x-3 mb-2">
                <h1 class="text-2xl font-bold">${address}</h1>
                <span class="px-3 py-1 bg-white/20 backdrop-blur text-sm rounded-full">
                  ${propertyLabel}
                </span>
              </div>
              <p class="text-indigo-100">${city}, ${province} ${postalCode}</p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold">${formatPrice(price)}</div>
              <div class="text-sm text-indigo-200">
                ${bedrooms} bed • ${bathrooms} bath • ${formatNumber(sqft)} sqft
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
              <div class="text-xl font-bold">${paybackPeriod}y</div>
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