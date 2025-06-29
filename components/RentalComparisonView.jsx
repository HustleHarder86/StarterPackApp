// RentalComparisonView.jsx
// Component for comparing Long-Term Rental vs Short-Term Rental strategies

const RentalComparisonView = ({ analysis, propertyAddress }) => {
  const [activeTab, setActiveTab] = React.useState('overview');
  
  if (!analysis || !analysis.longTermRental) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No analysis data available</p>
      </div>
    );
  }

  const ltr = analysis.longTermRental;
  const str = analysis.strAnalysis;
  const comparison = analysis.comparison;
  const hasSTR = str && comparison;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Rental Strategy Analysis</h2>
        <p className="text-indigo-100">{propertyAddress}</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'ltr' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('ltr')}
          >
            Long-Term Rental
          </button>
          {hasSTR && (
            <button
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'str' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('str')}
            >
              Short-Term Rental
            </button>
          )}
          {hasSTR && (
            <button
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'comparison' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('comparison')}
            >
              Comparison
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Property Value</h4>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(analysis.propertyDetails?.estimatedValue || 0)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-1">LTR Monthly Income</h4>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(ltr.monthlyRent)}
                </p>
              </div>
              {hasSTR && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-900 mb-1">STR Monthly Income</h4>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(str.annualRevenue / 12)}
                  </p>
                </div>
              )}
            </div>

            {/* Best Strategy Recommendation */}
            {hasSTR && comparison && (
              <div className={`rounded-lg p-6 ${
                comparison.betterStrategy === 'str' 
                  ? 'bg-purple-50 border-2 border-purple-200'
                  : 'bg-green-50 border-2 border-green-200'
              }`}>
                <h3 className="text-lg font-bold mb-2">
                  Recommended Strategy: {comparison.betterStrategy === 'str' ? 'Short-Term Rental' : 'Long-Term Rental'}
                </h3>
                <p className="text-gray-700 mb-4">{comparison.recommendation}</p>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Additional Annual Profit:</span>
                    <p className="text-xl font-bold">
                      {comparison.betterStrategy === 'str' 
                        ? `+${formatCurrency(comparison.annualProfitDiff)}`
                        : formatCurrency(Math.abs(comparison.annualProfitDiff))
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Percentage Increase:</span>
                    <p className="text-xl font-bold">
                      {comparison.percentageIncrease}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Annual Profit Comparison Chart */}
            {hasSTR && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Annual Profit Comparison</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Long-Term Rental</span>
                      <span className="text-sm font-bold">{formatCurrency(ltr.annualProfit)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div 
                        className="bg-green-500 h-8 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(ltr.annualProfit / Math.max(ltr.annualProfit, str.annualProfit)) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {formatCurrency(ltr.annualProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Short-Term Rental</span>
                      <span className="text-sm font-bold">{formatCurrency(str.annualProfit)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div 
                        className="bg-purple-500 h-8 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(str.annualProfit / Math.max(ltr.annualProfit, str.annualProfit)) * 100}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {formatCurrency(str.annualProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Long-Term Rental Tab */}
        {activeTab === 'ltr' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Analysis */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Income Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rent</span>
                    <span className="font-medium">{formatCurrency(ltr.monthlyRent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rent Range</span>
                    <span className="font-medium">
                      {formatCurrency(ltr.rentRange?.low || ltr.monthlyRent * 0.9)} - 
                      {formatCurrency(ltr.rentRange?.high || ltr.monthlyRent * 1.1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vacancy Rate</span>
                    <span className="font-medium">{ltr.vacancyRate || 5}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">Annual Revenue</span>
                    <span className="font-bold text-green-600">{formatCurrency(ltr.annualRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Financial Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Cash Flow</span>
                    <span className="font-medium">{formatCurrency(ltr.cashFlow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cap Rate</span>
                    <span className="font-medium">{formatPercent(ltr.capRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Expenses</span>
                    <span className="font-medium text-red-600">-{formatCurrency(ltr.annualExpenses)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">Annual Profit</span>
                    <span className="font-bold text-green-600">{formatCurrency(ltr.annualProfit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparable Rentals */}
            {ltr.comparables && ltr.comparables.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Comparable Rental Properties</h3>
                <div className="space-y-2">
                  {ltr.comparables.map((comp, index) => (
                    <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded">
                      {comp.description || comp}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Short-Term Rental Tab */}
        {activeTab === 'str' && hasSTR && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Analysis */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Income Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Nightly Rate</span>
                    <span className="font-medium">{formatCurrency(str.avgNightlyRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occupancy Rate</span>
                    <span className="font-medium">{str.occupancyRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booked Nights/Year</span>
                    <span className="font-medium">{Math.round(365 * (str.occupancyRate / 100))}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">Annual Revenue</span>
                    <span className="font-bold text-purple-600">{formatCurrency(str.annualRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Financial Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income (Avg)</span>
                    <span className="font-medium">{formatCurrency(str.annualRevenue / 12)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Management Overhead</span>
                    <span className="font-medium">20% higher than LTR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Expenses</span>
                    <span className="font-medium text-red-600">-{formatCurrency(str.annualExpenses)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">Annual Profit</span>
                    <span className="font-bold text-purple-600">{formatCurrency(str.annualProfit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STR Notice */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Note:</strong> Short-term rental analysis is based on comparable Airbnb properties in the area. 
                Actual results may vary based on property amenities, management quality, and local regulations.
              </p>
            </div>
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && hasSTR && comparison && (
          <div className="space-y-6">
            {/* Side-by-Side Comparison */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Long-Term Rental
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Short-Term Rental
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Monthly Income
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(ltr.monthlyRent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(str.annualRevenue / 12)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={comparison.monthlyIncomeDiff > 0 ? 'text-green-600' : 'text-red-600'}>
                        {comparison.monthlyIncomeDiff > 0 ? '+' : ''}{formatCurrency(comparison.monthlyIncomeDiff)}
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Annual Revenue
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(ltr.annualRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(str.annualRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={comparison.annualIncomeDiff > 0 ? 'text-green-600' : 'text-red-600'}>
                        {comparison.annualIncomeDiff > 0 ? '+' : ''}{formatCurrency(comparison.annualIncomeDiff)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Annual Expenses
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(ltr.annualExpenses)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(str.annualExpenses)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(str.annualExpenses - ltr.annualExpenses)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Annual Profit
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(ltr.annualProfit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(str.annualProfit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span className={comparison.annualProfitDiff > 0 ? 'text-green-600' : 'text-red-600'}>
                        {comparison.annualProfitDiff > 0 ? '+' : ''}{formatCurrency(comparison.annualProfitDiff)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Break-Even Analysis */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Break-Even Analysis</h3>
              <p className="text-gray-700 mb-4">
                Short-term rental needs <strong>{comparison.breakEvenOccupancy}% occupancy</strong> to match long-term rental income.
                Current projected occupancy is <strong>{str.occupancyRate}%</strong>.
              </p>
              <div className="w-full bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${comparison.breakEvenOccupancy}%` }}
                />
                <div 
                  className="absolute top-0 h-4 w-1 bg-red-600"
                  style={{ left: `${str.occupancyRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span>0%</span>
                <span className="text-blue-600">Break-even: {comparison.breakEvenOccupancy}%</span>
                <span className="text-red-600">Projected: {str.occupancyRate}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Risk Assessment</h3>
              <p className="text-gray-700">{comparison.riskAssessment}</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Long-Term Rental Pros:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>Stable, predictable income</li>
                    <li>Lower management overhead</li>
                    <li>Less regulatory risk</li>
                    <li>Minimal vacancy periods</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Short-Term Rental Pros:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>Higher income potential</li>
                    <li>Flexibility for personal use</li>
                    <li>Dynamic pricing opportunities</li>
                    <li>Tax deductions for furnishing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No STR Data Message */}
        {!hasSTR && activeTab !== 'ltr' && activeTab !== 'overview' && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Short-Term Rental Analysis Locked</h3>
            <p className="mt-1 text-sm text-gray-500">Upgrade to Pro to unlock STR analysis and comparison</p>
            <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Export to window for CDN usage
if (typeof window !== 'undefined') {
  window.RentalComparisonView = RentalComparisonView;
}