/**
 * Investment Verdict Component - Exact Mockup Match
 * Matches the clean professional design from the mockup
 */

export const InvestmentVerdictMockup = ({ 
  propertyPrice = 850000,
  bedrooms = 2,
  bathrooms = 2,
  sqft = 1320,
  monthlyIncome = 5400,
  isRecommended = true,
  analysis = {}
}) => {
  // Extract property address from analysis data
  const propertyAddress = analysis?.property_address || analysis?.propertyAddress || 
                         analysis?.property_details?.address || 
                         analysis?.propertyDetails?.address || 
                         '123 Main Street, Toronto, ON';
  
  return `
    <div class="relative">
      <!-- Purple gradient header -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-5">
        <div class="max-w-7xl mx-auto">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-2xl font-bold mb-1">Property Investment Analysis</h1>
              <div class="text-purple-100 text-sm">${propertyAddress}</div>
            </div>
            <div class="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1 rounded text-xs font-bold shadow-lg animate-pulse-glow">
              <span class="inline-block animate-bounce-slow">⚡</span>
              <span class="animate-fade-in-out">LIVE DATA</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Property details bar -->
      <div class="bg-gray-100 px-6 py-3">
        <div class="max-w-7xl mx-auto">
          <div class="flex items-center gap-4 text-sm text-gray-700">
            <span class="font-semibold text-gray-900">${propertyPrice ? `$${propertyPrice.toLocaleString()}` : 'Price N/A'}</span>
            <span>•</span>
            <span>${bedrooms || 'N/A'} Bedrooms</span>
            <span>•</span>
            <span>${bathrooms || 'N/A'} Bathrooms</span>
            <span>•</span>
            <span>${sqft ? `${sqft.toLocaleString()} sq ft` : 'Size N/A'}</span>
            <div class="ml-auto">
              <button class="text-green-600 hover:text-green-700 text-sm font-medium">
                Analysis Complete
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main recommendation card -->
      <div class="max-w-7xl mx-auto px-6 mt-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- Strategy badge and title -->
              <div class="flex items-center gap-3 mb-3">
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded">
                  ✓ RECOMMENDED STRATEGY
                </span>
                <span class="text-xs text-gray-500">Based on 12 comparables</span>
              </div>
              
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Short-Term Rental (Airbnb)</h2>
              <p class="text-gray-600 text-sm mb-4">Maximize your investment potential with STR strategy</p>
              
              <!-- Key insights -->
              <div class="grid grid-cols-3 gap-4">
                <div class="flex items-start gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <div>
                    <div class="text-sm font-semibold text-gray-900">Revenue Potential</div>
                    <div class="text-xs text-gray-600">Market data shows consistent $5,400+ monthly revenue with 83% average occupancy</div>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <div>
                    <div class="text-sm font-semibold text-gray-900">Market Demand</div>
                    <div class="text-xs text-gray-600">High tourist and business travel demand with year-round booking patterns</div>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <div class="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                  <div>
                    <div class="text-sm font-semibold text-gray-900">Risk Assessment</div>
                    <div class="text-xs text-gray-600">Low risk with stable pricing and established market presence</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Monthly income box -->
            <div class="ml-8 text-right">
              <div class="text-xs text-gray-500 mb-1">Estimated Monthly Income</div>
              <div class="text-3xl font-bold ${monthlyIncome ? 'text-green-600' : 'text-gray-400'}">${monthlyIncome ? `$${monthlyIncome.toLocaleString()}` : 'N/A'}</div>
              <div class="text-sm text-gray-600 mt-1">Short-Term Rental</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const VerdictSummaryMockup = ({ analysis }) => {
  // Handle different data structures from API response
  const propertyPrice = analysis?.property?.price || 
                       analysis?.property_details?.estimated_value || 
                       analysis?.propertyDetails?.estimatedValue || 
                       analysis?.purchase?.price || null;
                       
  const bedrooms = analysis?.property?.bedrooms || 
                   analysis?.property_details?.bedrooms || 
                   analysis?.propertyDetails?.bedrooms || null;
                   
  const bathrooms = analysis?.property?.bathrooms || 
                    analysis?.property_details?.bathrooms || 
                    analysis?.propertyDetails?.bathrooms || null;
                    
  const sqft = analysis?.property?.sqft || 
               analysis?.property_details?.square_feet || 
               analysis?.property_details?.sqft ||
               analysis?.propertyDetails?.squareFeet || null;
               
  const monthlyIncome = analysis?.strAnalysis?.monthlyRevenue || 
                        analysis?.short_term_rental?.monthly_revenue ||
                        analysis?.str?.monthlyRevenue || null;
                        
  // Determine recommendation based on comparison
  const isRecommended = analysis?.comparison?.recommended_strategy === 'STR' || 
                       analysis?.overallScore >= 7 || 
                       (monthlyIncome > 0);
  
  return InvestmentVerdictMockup({
    propertyPrice,
    bedrooms,
    bathrooms,
    sqft,
    monthlyIncome,
    isRecommended,
    analysis
  });
};