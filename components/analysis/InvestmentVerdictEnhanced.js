/**
 * Enhanced Investment Verdict Component
 * Matches the mockup design with gradient background
 */

export const InvestmentVerdictEnhanced = ({ 
  recommendation = 'recommended',
  strategy = 'Short-Term Rental (Airbnb)',
  monthlyRevenue = 10725,
  roi = 0,
  score = 0,
  confidence = 'High',
  infinity = true
}) => {
  const isRecommended = recommendation === 'recommended';
  
  return `
    <div class="relative overflow-hidden">
      <!-- Purple gradient header -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-6">
        <div class="max-w-7xl mx-auto">
          <h1 class="text-3xl font-bold mb-2">Property Investment Analysis</h1>
          <div class="text-purple-100">123 Main Street, Toronto, ON M5V 3A8</div>
        </div>
      </div>
      
      <!-- Main verdict card -->
      <div class="max-w-7xl mx-auto px-6 -mt-4">
        <div class="bg-white rounded-xl shadow-lg p-6 relative">
          <!-- Recommendation badges -->
          <div class="flex items-center gap-2 mb-4">
            <span class="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              ✗ NOT RECOMMENDED
            </span>
            <span class="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
              LOW CONFIDENCE
            </span>
          </div>
          
          <!-- Title and stats -->
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 mb-1">${strategy}</h2>
              <p class="text-gray-600">Poor investment potential identified</p>
            </div>
            <div class="text-right">
              <div class="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-lg">
                <div class="text-sm font-medium mb-1">Projected Revenue</div>
                <div class="text-3xl font-bold">$${monthlyRevenue.toLocaleString()}/mo</div>
                <div class="text-xs mt-1">+$5,733 over LTR</div>
              </div>
            </div>
          </div>
          
          <!-- Score indicators -->
          <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">${score}/10 ✓</div>
              <div class="text-sm text-gray-600">Investment Score</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">${roi}% ✓</div>
              <div class="text-sm text-gray-600">Annual ROI</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">${infinity ? '+Infinity%' : '+114%'} ✓</div>
              <div class="text-sm text-gray-600">Revenue Advantage</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const VerdictSummaryEnhanced = ({ analysis }) => {
  if (!analysis) return '';
  
  const monthlyRevenue = analysis.strAnalysis?.monthlyRevenue || 10725;
  const ltrRevenue = analysis.longTermRental?.monthlyRent || 4992;
  const advantage = ltrRevenue > 0 ? Math.round(((monthlyRevenue - ltrRevenue) / ltrRevenue) * 100) : 0;
  
  return InvestmentVerdictEnhanced({
    recommendation: analysis.overallScore >= 7 ? 'recommended' : analysis.overallScore >= 5 ? 'caution' : 'not-recommended',
    confidence: analysis.overallScore >= 8 ? 'High' : analysis.overallScore >= 6 ? 'Medium' : 'Low',
    strategy: 'Short-Term Rental (Airbnb)',
    monthlyRevenue,
    roi: analysis.longTermRental?.roi || 0,
    score: analysis.overallScore || 0,
    infinity: advantage > 100
  });
};