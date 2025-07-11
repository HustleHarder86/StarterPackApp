// ComparablesList.jsx - Component for displaying comparable Airbnb properties
const ComparablesList = ({ comparables = [], loading, error, propertyAddress }) => {
  const [selectedComparable, setSelectedComparable] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('grid'); // 'grid' or 'list'
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Finding comparable properties...</span>
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
          <h3 className="text-lg font-semibold text-red-700">Error Loading Comparables</h3>
        </div>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    );
  }
  
  if (!comparables || comparables.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-700">No Comparables Found</h3>
        </div>
        <p className="mt-2 text-yellow-600">
          No similar short-term rental properties found in the area. This may affect the accuracy of the STR analysis.
        </p>
      </div>
    );
  }
  
  // Calculate similarity score color
  const getSimilarityColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  // Calculate distance display
  const formatDistance = (distance) => {
    if (!distance) return 'Nearby';
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m away`;
    return `${distance.toFixed(1)}km away`;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">Comparable Properties</h2>
            <p className="text-purple-100">
              {comparables.length} similar Airbnb properties near {propertyAddress?.city || 'this location'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Comparables Display */}
      <div className="p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparables.map((comp, index) => (
              <div
                key={comp.id || index}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedComparable(comp)}
              >
                {/* Property Image */}
                {comp.imageUrl && (
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={comp.imageUrl}
                      alt={comp.title || 'Comparable property'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSimilarityColor(comp.similarityScore || 0.7)}`}>
                        {((comp.similarityScore || 0.7) * 100).toFixed(0)}% match
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Property Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {comp.title || `${comp.bedrooms}BR ${comp.propertyType || 'Property'}`}
                  </h3>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{formatDistance(comp.distance)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>{comp.bedrooms} bed • {comp.bathrooms} bath</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">${comp.nightlyRate}</p>
                      <p className="text-xs text-gray-500">per night</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-purple-600">{(comp.occupancyRate * 100).toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">occupancy</p>
                    </div>
                  </div>
                  
                  {comp.rating && (
                    <div className="mt-2 flex items-center">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-sm text-gray-600">{comp.rating} ({comp.reviewCount || 0} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {comparables.map((comp, index) => (
              <div
                key={comp.id || index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedComparable(comp)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {comp.imageUrl && (
                      <img
                        src={comp.imageUrl}
                        alt={comp.title || 'Comparable property'}
                        className="w-20 h-20 object-cover rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {comp.title || `${comp.bedrooms}BR ${comp.propertyType || 'Property'}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {comp.bedrooms} bed • {comp.bathrooms} bath • {formatDistance(comp.distance)}
                      </p>
                      {comp.rating && (
                        <div className="flex items-center mt-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-sm text-gray-600">{comp.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${comp.nightlyRate}</p>
                    <p className="text-sm text-gray-500">per night</p>
                    <p className="text-sm font-medium text-purple-600 mt-1">
                      {(comp.occupancyRate * 100).toFixed(0)}% occupancy
                    </p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getSimilarityColor(comp.similarityScore || 0.7)}`}>
                      {((comp.similarityScore || 0.7) * 100).toFixed(0)}% match
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Average Nightly Rate</p>
            <p className="text-lg font-semibold text-gray-900">
              ${(comparables.reduce((sum, c) => sum + c.nightlyRate, 0) / comparables.length).toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Occupancy</p>
            <p className="text-lg font-semibold text-gray-900">
              {(comparables.reduce((sum, c) => sum + c.occupancyRate, 0) / comparables.length * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monthly Revenue Range</p>
            <p className="text-lg font-semibold text-gray-900">
              ${Math.min(...comparables.map(c => c.monthlyRevenue || c.nightlyRate * 30 * c.occupancyRate)).toLocaleString()} - 
              ${Math.max(...comparables.map(c => c.monthlyRevenue || c.nightlyRate * 30 * c.occupancyRate)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      {selectedComparable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedComparable(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Property Details</h3>
                <button
                  onClick={() => setSelectedComparable(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {selectedComparable.imageUrl && (
                <img
                  src={selectedComparable.imageUrl}
                  alt={selectedComparable.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedComparable.title}</h4>
                  <p className="text-gray-600">{selectedComparable.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Property Type</p>
                    <p className="font-medium">{selectedComparable.propertyType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Size</p>
                    <p className="font-medium">{selectedComparable.bedrooms} bed, {selectedComparable.bathrooms} bath</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nightly Rate</p>
                    <p className="font-medium">${selectedComparable.nightlyRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Occupancy Rate</p>
                    <p className="font-medium">{(selectedComparable.occupancyRate * 100).toFixed(0)}%</p>
                  </div>
                </div>
                
                {selectedComparable.amenities && selectedComparable.amenities.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedComparable.amenities.map((amenity, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded text-sm">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedComparable.airbnbUrl && (
                  <a
                    href={selectedComparable.airbnbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View on Airbnb
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export for use in other components
window.ComparablesList = ComparablesList;