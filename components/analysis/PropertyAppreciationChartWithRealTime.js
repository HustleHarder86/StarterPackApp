/**
 * Property Appreciation Chart with Real-Time Data
 * Fetches actual appreciation rates from market data
 */

import { PropertyAppreciationChart } from './PropertyAppreciationChart.js';

export const PropertyAppreciationChartWithRealTime = ({ 
  propertyData = {},
  currentValue = 0,
  customRate = null 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch real-time appreciation data on mount
  useEffect(() => {
    fetchRealTimeAppreciation();
  }, [propertyData.address]);
  
  const fetchRealTimeAppreciation = async () => {
    if (!propertyData.address) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/railway-api/api/appreciation/real-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          address: propertyData.address,
          propertyType: propertyData.propertyType,
          city: extractCity(propertyData.address),
          province: extractProvince(propertyData.address)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch appreciation data');
      }
      
      const result = await response.json();
      setRealTimeData(result.data);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Error fetching real-time appreciation:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };
  
  // Extract city from address
  const extractCity = (address) => {
    const parts = address.split(',');
    return parts[1]?.trim() || '';
  };
  
  // Extract province from address
  const extractProvince = (address) => {
    const parts = address.split(',');
    const lastPart = parts[parts.length - 1]?.trim() || '';
    
    // Extract province code
    const provinceMatch = lastPart.match(/\b(ON|BC|AB|QC|MB|SK|NS|NB|NL|PE|NT|YT|NU)\b/);
    return provinceMatch ? provinceMatch[1] : '';
  };
  
  // Determine which rate to use
  const getAppreciationRate = () => {
    if (customRate !== null) return customRate;
    if (realTimeData?.currentYearOverYear) return realTimeData.currentYearOverYear / 100;
    return null; // Will fall back to hardcoded rates in base component
  };
  
  return `
    <div class="relative">
      ${isLoading ? `
        <!-- Loading State -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div class="h-64 bg-gray-200 rounded mb-4"></div>
            <div class="grid grid-cols-3 gap-4">
              <div class="h-20 bg-gray-200 rounded"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div class="text-center text-gray-500 text-sm mt-4">
            Fetching real-time market data...
          </div>
        </div>
      ` : `
        <!-- Main Chart -->
        ${PropertyAppreciationChart({
          propertyData,
          currentValue,
          customRate: getAppreciationRate()
        })}
        
        ${realTimeData ? `
          <!-- Real-Time Data Overlay -->
          <div class="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs font-semibold text-gray-700">Live Market Data</span>
            </div>
            
            <div class="space-y-1 text-xs">
              ${realTimeData.currentYearOverYear !== null ? `
                <div>
                  <span class="text-gray-600">Current Rate:</span>
                  <span class="font-semibold ${realTimeData.currentYearOverYear >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${realTimeData.currentYearOverYear >= 0 ? '+' : ''}${realTimeData.currentYearOverYear?.toFixed(1)}%
                  </span>
                </div>
              ` : ''}
              
              ${realTimeData.fiveYearAverage ? `
                <div>
                  <span class="text-gray-600">5-Year Avg:</span>
                  <span class="font-semibold">${realTimeData.fiveYearAverage.toFixed(1)}%</span>
                </div>
              ` : ''}
              
              ${realTimeData.trend ? `
                <div>
                  <span class="text-gray-600">Trend:</span>
                  <span class="font-semibold capitalize">${realTimeData.trend}</span>
                </div>
              ` : ''}
              
              <div class="pt-1 mt-1 border-t border-gray-200">
                <span class="text-gray-500">Source: ${realTimeData.dataSource}</span>
              </div>
              
              <div class="text-gray-400">
                Confidence: ${realTimeData.confidence}
              </div>
            </div>
          </div>
        ` : ''}
        
        ${error ? `
          <!-- Error Message -->
          <div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">
              <strong>Note:</strong> Could not fetch real-time data. Using historical averages.
            </p>
          </div>
        ` : ''}
      `}
      
      <!-- Toggle Between Data Sources -->
      ${realTimeData && !isLoading ? `
        <div class="mt-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Data Source</span>
            <div class="flex gap-2">
              <button onclick="window.useRealTimeRate()" 
                      class="px-3 py-1 text-xs ${!customRate ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'} rounded">
                Real-Time (${realTimeData.currentYearOverYear?.toFixed(1)}%)
              </button>
              <button onclick="window.useHistoricalRate()" 
                      class="px-3 py-1 text-xs ${customRate === 'historical' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'} rounded">
                Historical Average
              </button>
            </div>
          </div>
          <p class="text-xs text-gray-600">
            Real-time data reflects current market conditions. Historical averages are based on 20-year trends.
          </p>
        </div>
      ` : ''}
    </div>
    
    <script>
      // Make functions available globally
      window.useRealTimeRate = function() {
        // This would trigger a re-render with real-time rate
        console.log('Using real-time rate');
      };
      
      window.useHistoricalRate = function() {
        // This would trigger a re-render with historical rate
        console.log('Using historical rate');
      };
    </script>
  `;
};