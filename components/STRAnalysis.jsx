// STRAnalysis.jsx - Component for displaying Short-Term Rental analysis results
const STRAnalysis = ({ strData, property, loading, error }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analyzing short-term rental potential...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-700">STR Analysis Error</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }
  
  if (!strData) {
    return null;
  }
  
  const {
    avgNightlyRate,
    occupancyRate,
    monthlyRevenue,
    annualRevenue,
    comparables = [],
    confidence = 'medium',
    seasonalData = {},
    expenses = {},
    regulations = {},
    compliance = {}
  } = strData;
  
  // Calculate net income
  const monthlyExpenses = expenses.monthly || 0;
  const monthlyNetIncome = monthlyRevenue - monthlyExpenses;
  const annualNetIncome = annualRevenue - (monthlyExpenses * 12);
  
  // Confidence badge colors
  const confidenceColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800'
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Short-Term Rental Analysis</h2>
            <p className="text-purple-100">Based on {comparables.length} comparable Airbnb properties</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceColors[confidence]}`}>
            {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
          </span>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Average Nightly Rate</p>
          <p className="text-2xl font-bold text-gray-900">${avgNightlyRate}</p>
          <p className="text-xs text-gray-500 mt-1">Per night</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
          <p className="text-2xl font-bold text-gray-900">{(occupancyRate * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-500 mt-1">{(occupancyRate * 365).toFixed(0)} nights/year</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
          <p className="text-2xl font-bold text-green-600">${monthlyRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Gross revenue</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Annual Revenue</p>
          <p className="text-2xl font-bold text-green-600">${annualRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Gross revenue</p>
        </div>
      </div>
      
      {/* Revenue Breakdown */}
      <div className="px-6 pb-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Revenue Projection</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Gross Monthly Revenue</span>
              <span className="font-medium">${monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Operating Expenses</span>
              <span className="font-medium text-red-600">-${monthlyExpenses.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Net Monthly Income</span>
              <span className="font-bold text-green-600">${monthlyNetIncome.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Annual Net Income:</span>
              <span className="ml-2 text-lg font-bold text-green-600">${annualNetIncome.toLocaleString()}</span>
            </p>
          </div>
        </div>
        
        {/* Seasonality Preview */}
        {Object.keys(seasonalData).length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              <span>{showDetails ? 'Hide' : 'Show'} Seasonal Details</span>
              <svg
                className={`ml-2 w-5 h-5 transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDetails && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Seasonal Variations</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(seasonalData).map(([season, data]) => (
                    <div key={season} className="text-center">
                      <p className="text-sm font-medium text-gray-600 capitalize">{season}</p>
                      <p className="text-lg font-bold text-gray-900">${data.avgRate}/night</p>
                      <p className="text-sm text-gray-500">{(data.occupancy * 100).toFixed(0)}% occupied</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* STR Regulations Section */}
        {regulations.city && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              STR Regulations - {regulations.city}, {regulations.province}
            </h3>
            
            <div className="mb-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                regulations.allowed === false ? 'bg-red-100 text-red-800' :
                compliance.riskLevel === 'high' ? 'bg-yellow-100 text-yellow-800' :
                compliance.riskLevel === 'medium' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {regulations.allowed === false ? '❌ Not Allowed' :
                 compliance.riskLevel === 'high' ? '⚠️ High Risk' :
                 compliance.riskLevel === 'medium' ? '⚠️ Moderate Risk' :
                 '✅ Generally Allowed'}
              </div>
            </div>
            
            <p className="text-gray-700 mb-3">{regulations.summary}</p>
            
            {regulations.restrictions && regulations.restrictions.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-gray-800 mb-2">Key Requirements:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {regulations.restrictions.map((restriction, index) => (
                    <li key={index}>{restriction}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {compliance.warnings && compliance.warnings.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-red-700 mb-2">⚠️ Important Warnings:</h4>
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {compliance.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {compliance.recommendations && compliance.recommendations.length > 0 && (
              <div className="mb-3">
                <h4 className="font-medium text-blue-700 mb-2">💡 Recommendations:</h4>
                <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                  {compliance.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
              <span>Source: {regulations.source === 'cached' ? 'Municipal Database' : 
                           regulations.source === 'ai_research' ? 'AI Research' : 'General Guidelines'}</span>
              {regulations.licenseUrl && (
                <a href={regulations.licenseUrl} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-700 font-medium">
                  View Official Rules →
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* Comparable Properties Count */}
        <div className="mt-4 text-sm text-gray-600">
          <p>
            This analysis is based on <span className="font-semibold">{comparables.length}</span> similar 
            properties within a {property.bedrooms}-bedroom radius in {property.address?.city || 'the area'}.
          </p>
        </div>
      </div>
    </div>
  );
};

// Export for use in other components
window.STRAnalysis = STRAnalysis;