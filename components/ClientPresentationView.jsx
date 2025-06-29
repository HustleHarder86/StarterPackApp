// ClientPresentationView.jsx
// Professional client-facing presentation mode for realtors

const ClientPresentationView = ({ 
  analysis, 
  propertyAddress, 
  realtorInfo,
  clientName,
  presentationMode = true 
}) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [showComparison, setShowComparison] = React.useState(false);
  
  // Investment rating calculation
  const getInvestmentRating = () => {
    const roi = parseFloat(analysis.roi_percentage || 0);
    const capRate = analysis.longTermRental?.capRate || 0;
    
    if (roi >= 8 || capRate >= 8) return { grade: 'A+', color: '#10b981', label: 'Excellent Investment' };
    if (roi >= 6 || capRate >= 6) return { grade: 'A', color: '#22c55e', label: 'Great Investment' };
    if (roi >= 4 || capRate >= 4) return { grade: 'B', color: '#3b82f6', label: 'Good Investment' };
    if (roi >= 2 || capRate >= 2) return { grade: 'C', color: '#f59e0b', label: 'Fair Investment' };
    return { grade: 'D', color: '#ef4444', label: 'Below Average' };
  };
  
  const rating = getInvestmentRating();
  
  // Format currency for client presentation
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Slides for presentation mode
  const slides = [
    'overview',
    'financials',
    'rental-strategy',
    'market-insights',
    'next-steps'
  ];
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Realtor Branding */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {realtorInfo?.logo && (
                <img src={realtorInfo.logo} alt={realtorInfo.name} className="h-12 w-auto" />
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Investment Property Analysis</h1>
                {clientName && (
                  <p className="text-sm text-gray-600">Prepared for {clientName}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{realtorInfo?.name}</p>
              <p className="text-sm text-gray-600">{realtorInfo?.phone}</p>
              <p className="text-sm text-gray-600">{realtorInfo?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {presentationMode ? (
          // Slide-based presentation
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Slide Navigation */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{propertyAddress}</h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={prevSlide}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm">
                    {currentSlide + 1} / {slides.length}
                  </span>
                  <button 
                    onClick={nextSlide}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8" style={{ minHeight: '500px' }}>
              {/* Slide Content */}
              {slides[currentSlide] === 'overview' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Investment Overview</h3>
                    <div className="inline-flex items-center gap-4 bg-gray-50 rounded-xl p-6">
                      <div 
                        className="w-32 h-32 rounded-full flex items-center justify-center text-white text-5xl font-bold"
                        style={{ backgroundColor: rating.color }}
                      >
                        {rating.grade}
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-gray-900">{rating.label}</p>
                        <p className="text-lg text-gray-600">InvestorProps Investment Rating</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">
                        {formatMoney(analysis.property_details?.estimated_value || 0)}
                      </p>
                      <p className="text-gray-600 mt-1">Property Value</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {analysis.roi_percentage}%
                      </p>
                      <p className="text-gray-600 mt-1">Annual ROI</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {formatMoney(analysis.longTermRental?.cashFlow || 0)}
                      </p>
                      <p className="text-gray-600 mt-1">Monthly Cash Flow</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-6">
                    <p className="text-lg text-center text-blue-900">
                      This property offers <strong>{analysis.roi_percentage}% annual return</strong> with 
                      a monthly cash flow of <strong>{formatMoney(analysis.longTermRental?.cashFlow || 0)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {slides[currentSlide] === 'financials' && (
                <div className="space-y-8">
                  <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">Financial Breakdown</h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-gray-900">Monthly Income</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                          <span className="font-medium">Rental Income</span>
                          <span className="text-xl font-bold text-green-600">
                            {formatMoney(analysis.longTermRental?.monthlyRent || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xl font-semibold text-gray-900">Monthly Expenses</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Mortgage Payment</span>
                          <span className="font-semibold">
                            {formatMoney(analysis.costs?.mortgage_monthly || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Property Tax</span>
                          <span className="font-semibold">
                            {formatMoney((analysis.costs?.property_tax_annual || 0) / 12)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>Insurance</span>
                          <span className="font-semibold">
                            {formatMoney((analysis.costs?.insurance_annual || 0) / 12)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span>HOA/Maintenance</span>
                          <span className="font-semibold">
                            {formatMoney(analysis.costs?.hoa_monthly || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold">Net Monthly Cash Flow</span>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatMoney(analysis.longTermRental?.cashFlow || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {slides[currentSlide] === 'rental-strategy' && (
                <div className="space-y-8">
                  <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">Rental Strategy Comparison</h3>
                  
                  {analysis.strAnalysis ? (
                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-green-50 rounded-xl p-6">
                        <h4 className="text-xl font-semibold text-green-900 mb-4">Long-Term Rental</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Monthly Income</span>
                            <span className="font-bold">{formatMoney(analysis.longTermRental?.monthlyRent || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annual Profit</span>
                            <span className="font-bold">{formatMoney(analysis.longTermRental?.annualProfit || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cap Rate</span>
                            <span className="font-bold">{analysis.longTermRental?.capRate || 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-xl p-6">
                        <h4 className="text-xl font-semibold text-purple-900 mb-4">Short-Term Rental</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Avg Nightly Rate</span>
                            <span className="font-bold">{formatMoney(analysis.strAnalysis?.avgNightlyRate || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annual Profit</span>
                            <span className="font-bold">{formatMoney(analysis.strAnalysis?.annualProfit || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Occupancy Rate</span>
                            <span className="font-bold">{analysis.strAnalysis?.occupancyRate || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-xl p-8">
                      <h4 className="text-xl font-semibold text-green-900 mb-4 text-center">Long-Term Rental Strategy</h4>
                      <p className="text-center text-green-800">
                        This property is projected to generate <strong>{formatMoney(analysis.longTermRental?.monthlyRent || 0)}</strong> per month
                        in rental income with stable, long-term tenants.
                      </p>
                    </div>
                  )}

                  {analysis.comparison && (
                    <div className="bg-yellow-50 rounded-lg p-6 text-center">
                      <p className="text-lg font-semibold text-yellow-900">
                        Recommendation: {analysis.comparison.betterStrategy === 'str' ? 'Short-Term Rental' : 'Long-Term Rental'}
                      </p>
                      <p className="text-yellow-800 mt-2">{analysis.comparison.recommendation}</p>
                    </div>
                  )}
                </div>
              )}

              {slides[currentSlide] === 'market-insights' && (
                <div className="space-y-8">
                  <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">Market Insights</h3>
                  
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-gray-900">Property Details</h4>
                      <div className="space-y-2">
                        {analysis.property_details?.bedrooms && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bedrooms</span>
                            <span className="font-medium">{analysis.property_details.bedrooms}</span>
                          </div>
                        )}
                        {analysis.property_details?.bathrooms && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bathrooms</span>
                            <span className="font-medium">{analysis.property_details.bathrooms}</span>
                          </div>
                        )}
                        {analysis.property_details?.square_feet && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Square Feet</span>
                            <span className="font-medium">{analysis.property_details.square_feet.toLocaleString()}</span>
                          </div>
                        )}
                        {analysis.property_details?.year_built && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Year Built</span>
                            <span className="font-medium">{analysis.property_details.year_built}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-gray-900">Investment Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price per Sq Ft</span>
                          <span className="font-medium">
                            {formatMoney((analysis.property_details?.estimated_value || 0) / (analysis.property_details?.square_feet || 1))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gross Rent Multiplier</span>
                          <span className="font-medium">
                            {((analysis.property_details?.estimated_value || 0) / ((analysis.longTermRental?.monthlyRent || 1) * 12)).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">1% Rule</span>
                          <span className="font-medium">
                            {((analysis.longTermRental?.monthlyRent || 0) / (analysis.property_details?.estimated_value || 1) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {analysis.longTermRental?.comparables && analysis.longTermRental.comparables.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparable Rentals</h4>
                      <div className="space-y-2">
                        {analysis.longTermRental.comparables.slice(0, 3).map((comp, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                            {comp}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {slides[currentSlide] === 'next-steps' && (
                <div className="space-y-8">
                  <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">Next Steps</h3>
                  
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h4 className="text-xl font-semibold text-blue-900 mb-4">Your Investment Opportunity</h4>
                      <p className="text-blue-800">
                        This property represents a <strong>{rating.label.toLowerCase()}</strong> with 
                        a projected <strong>{analysis.roi_percentage}% annual ROI</strong> and 
                        <strong>{formatMoney(analysis.longTermRental?.cashFlow || 0)} monthly cash flow</strong>.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Recommended Actions:</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                          <div>
                            <p className="font-medium">Schedule a Property Viewing</p>
                            <p className="text-sm text-gray-600">Let's visit this property together to assess its condition and potential.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                          <div>
                            <p className="font-medium">Review Financing Options</p>
                            <p className="text-sm text-gray-600">I can connect you with trusted mortgage brokers for the best rates.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                          <div>
                            <p className="font-medium">Prepare Your Offer</p>
                            <p className="text-sm text-gray-600">Based on this analysis, we can craft a competitive offer strategy.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-100 rounded-xl p-6 text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Move Forward?</h4>
                      <p className="text-gray-600 mb-4">I'm here to guide you through every step of the investment process.</p>
                      <div className="space-y-2">
                        <p className="font-semibold text-xl">{realtorInfo?.name}</p>
                        <p className="text-blue-600">{realtorInfo?.phone}</p>
                        <p className="text-blue-600">{realtorInfo?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 pb-6">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlide ? 'w-8 bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          // Standard view mode
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Investment Analysis: {propertyAddress}
            </h2>
            {/* Standard analysis view content */}
            <p className="text-gray-600">Standard analysis view...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
          <button 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 3.944A9 9 0 015.416 5.416m12.168 12.168A9.001 9.001 0 0118.584 5.416m0 0A9 9 0 105.416 18.584" />
            </svg>
            Share with Client
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
};

// Export to window for CDN usage
if (typeof window !== 'undefined') {
  window.ClientPresentationView = ClientPresentationView;
}