/**
 * Property Appreciation Chart with Transparency Features
 * Visual bar graph showing expected property value over 10 years
 * Uses comprehensive Canadian real estate appreciation data
 * Includes question mark tooltips for data transparency
 */

export const PropertyAppreciationChart = ({ 
  propertyData = {},
  currentValue = 0,
  customRate = null 
}) => {
  const purchasePrice = currentValue || propertyData.price || 0;
  const propertyType = propertyData.propertyType || propertyData.type || 'Unknown';
  
  // Load comprehensive appreciation data
  const [appreciationData, setAppreciationData] = window.React.useState(null);
  const [loading, setLoading] = window.React.useState(true);
  
  window.React.useEffect(() => {
    fetch('/data/canadian-real-estate-appreciation-comprehensive-2025.json')
      .then(res => res.json())
      .then(data => {
        setAppreciationData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load appreciation data:', err);
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return `<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div class="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>`;
  }
  
  // Detect market from address
  const address = propertyData.address || '';
  let market = null;
  let cityData = null;
  let appreciationRate = 0.04; // Default 4% if no data found
  let dataSource = 'default';
  let dataQuality = 'none';
  
  if (appreciationData && appreciationData.cityData) {
    // First try exact city match
    for (const [cityName, data] of Object.entries(appreciationData.cityData)) {
      if (address.includes(cityName)) {
        market = cityName;
        cityData = data;
        dataQuality = data.dataQuality || 'aggregate';
        break;
      }
    }
    
    // Special cases for alternate spellings
    if (!market) {
      if (address.includes('Montréal')) {
        market = 'Montreal';
        cityData = appreciationData.cityData.Montreal;
      } else if (address.includes('St. John\'s') || address.includes('St Johns')) {
        market = 'St. John\'s';
        cityData = appreciationData.cityData['St. John\'s'];
      }
    }
  }
  
  // Determine property type category
  const propertyTypeLower = propertyType.toLowerCase();
  let propertyCategory = 'unknown';
  
  if (propertyTypeLower.includes('detached') || propertyTypeLower.includes('single family') || propertyTypeLower.includes('house')) {
    propertyCategory = 'detached';
  } else if (propertyTypeLower.includes('semi')) {
    propertyCategory = 'semiDetached';
  } else if (propertyTypeLower.includes('town') || propertyTypeLower.includes('row')) {
    propertyCategory = 'townhouse';
  } else if (propertyTypeLower.includes('condo') || propertyTypeLower.includes('apartment')) {
    propertyCategory = 'condo';
  } else if (propertyTypeLower.includes('plex')) {
    propertyCategory = 'plex';
  }
  
  // Get appreciation rate based on data quality and availability
  if (cityData) {
    if (dataQuality === 'complete' || dataQuality === 'partial') {
      // Try to get property-type specific data
      if (cityData.propertyTypes && cityData.propertyTypes[propertyCategory]) {
        const typeData = cityData.propertyTypes[propertyCategory];
        if (typeData['10YearAnnualizedReturn']) {
          appreciationRate = typeData['10YearAnnualizedReturn'] / 100;
          dataSource = `10-year annualized return for ${propertyCategory}`;
        } else if (typeData['10YearAppreciation']) {
          // Convert total appreciation to annual rate
          appreciationRate = Math.pow(1 + typeData['10YearAppreciation'] / 100, 1/10) - 1;
          dataSource = `10-year total appreciation for ${propertyCategory}`;
        } else if (typeData['1YearAppreciation']) {
          appreciationRate = typeData['1YearAppreciation'] / 100;
          dataSource = `1-year appreciation for ${propertyCategory} (recent trend)`;
        }
      } else if (cityData.benchmarkPrices && cityData.benchmarkPrices[propertyCategory]) {
        // Vancouver style benchmark data
        const typeData = cityData.benchmarkPrices[propertyCategory];
        if (typeData['10YearAnnualizedReturn']) {
          appreciationRate = typeData['10YearAnnualizedReturn'] / 100;
          dataSource = `10-year benchmark return for ${propertyCategory}`;
        } else if (typeData['10YearAppreciation']) {
          appreciationRate = Math.pow(1 + typeData['10YearAppreciation'] / 100, 1/10) - 1;
          dataSource = `10-year benchmark appreciation for ${propertyCategory}`;
        }
      }
    }
    
    // Fall back to aggregate data if no property-type specific data
    if (dataSource === 'default' && cityData['10YearAverage']) {
      appreciationRate = cityData['10YearAverage'] / 100;
      dataSource = '10-year city average (all property types)';
    } else if (dataSource === 'default' && cityData.yearOverYear) {
      appreciationRate = cityData.yearOverYear / 100;
      dataSource = 'Recent year-over-year change';
    } else if (dataSource === 'default' && cityData.historicalAverage1990to2024) {
      appreciationRate = cityData.historicalAverage1990to2024 / 100;
      dataSource = 'Long-term historical average (1990-2024)';
    }
  }
  
  // If still no data, use national average
  if (dataSource === 'default' && appreciationData && appreciationData.nationalAverages) {
    appreciationRate = appreciationData.nationalAverages['15YearCAGR'] / 100;
    dataSource = 'National 15-year average';
    market = 'Canadian Average';
  }
  
  // Use custom rate if provided (overrides everything)
  if (customRate !== null) {
    appreciationRate = customRate;
    dataSource = 'Custom rate';
  }
  
  // Calculate values for each year
  const years = [];
  for (let i = 0; i <= 10; i++) {
    const value = purchasePrice * Math.pow(1 + appreciationRate, i);
    const appreciation = value - purchasePrice;
    years.push({
      year: i,
      value: Math.round(value),
      appreciation: Math.round(appreciation),
      percentGain: ((value / purchasePrice - 1) * 100).toFixed(1)
    });
  }
  
  // Find max value for scaling
  const maxValue = Math.max(...years.map(y => y.value));
  
  // Generate tooltip content
  const generateTooltipContent = () => {
    if (dataSource === 'Custom rate') {
      return `<p>You've set a custom appreciation rate using the slider below.</p>`;
    } else if (cityData) {
      let content = `
        <p><strong>City:</strong> ${market}</p>
        <p><strong>Property Type:</strong> ${propertyType}</p>
        <p><strong>Data Quality:</strong> ${dataQuality}</p>
        <p><strong>Calculation Method:</strong> ${dataSource}</p>
      `;
      
      if (cityData.propertyTypes && cityData.propertyTypes[propertyCategory]) {
        const typeData = cityData.propertyTypes[propertyCategory];
        content += `
          <div class="mt-2 pt-2 border-t border-gray-700">
            <p class="font-semibold">Available data for this property type:</p>
        `;
        if (typeData['10YearAppreciation']) {
          content += `<p>• 10-year total appreciation: ${typeData['10YearAppreciation']}%</p>`;
        }
        if (typeData['10YearAnnualizedReturn']) {
          content += `<p>• 10-year annualized: ${typeData['10YearAnnualizedReturn']}%</p>`;
        }
        if (typeData['1YearAppreciation']) {
          content += `<p>• Recent 1-year change: ${typeData['1YearAppreciation']}%</p>`;
        }
        content += `</div>`;
      } else if (cityData.benchmarkPrices && cityData.benchmarkPrices[propertyCategory]) {
        const typeData = cityData.benchmarkPrices[propertyCategory];
        content += `
          <div class="mt-2 pt-2 border-t border-gray-700">
            <p class="font-semibold">Benchmark data for this property type:</p>
        `;
        if (typeData['10YearAppreciation']) {
          content += `<p>• 10-year total appreciation: ${typeData['10YearAppreciation']}%</p>`;
        }
        if (typeData['10YearAnnualizedReturn']) {
          content += `<p>• 10-year annualized: ${typeData['10YearAnnualizedReturn']}%</p>`;
        }
        content += `</div>`;
      } else {
        content += `<p class="text-yellow-300 mt-2">No property-type specific data available. Using ${dataSource}.</p>`;
      }
      
      return content;
    } else {
      return `
        <p><strong>City:</strong> Not found in database</p>
        <p><strong>Using:</strong> Canadian national average</p>
        <p><strong>Rate:</strong> 6.11% (15-year CAGR from CREA)</p>
        <p class="mt-2 text-yellow-300">This is the average appreciation rate across all Canadian real estate over the past 15 years.</p>
      `;
    }
  };
  
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div class="mb-6">
        <h3 class="text-xl font-bold mb-2 flex items-center gap-2">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Property Value Appreciation Forecast
        </h3>
        
        <!-- Market Info with Transparency -->
        <div class="space-y-3">
          <div class="flex items-center gap-4 text-sm">
            <span class="text-gray-600">Market: <span class="font-semibold">${market || 'Unknown'}</span></span>
            <span class="text-gray-600">•</span>
            <span class="text-gray-600">Property Type: <span class="font-semibold">${propertyType}</span></span>
            <span class="text-gray-600">•</span>
            <span class="text-gray-600">Appreciation Rate: 
              <span class="font-semibold text-blue-600">${(appreciationRate * 100).toFixed(1)}% annually</span>
              <button class="inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 group relative" 
                      onclick="event.preventDefault(); this.querySelector('.tooltip').classList.toggle('hidden');">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="tooltip hidden absolute z-10 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-lg bottom-6 left-1/2 transform -translate-x-1/2">
                  <div class="font-semibold mb-2">How this rate was calculated:</div>
                  <div class="space-y-2">
                    ${generateTooltipContent()}
                  </div>
                  <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div class="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </button>
            </span>
          </div>
          
          <!-- Data Source Info Box -->
          <div class="text-xs text-gray-500 bg-gray-50 rounded p-2">
            <div class="flex items-start gap-1">
              <svg class="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <div class="font-medium">Data Source: ${dataSource}</div>
                ${dataQuality !== 'none' ? `<div>Data quality: ${dataQuality}</div>` : ''}
                ${cityData && cityData.source ? `<div>Original source: ${cityData.source}</div>` : ''}
                ${cityData && cityData.lastUpdated ? `<div>Last updated: ${cityData.lastUpdated}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Container -->
      <div class="relative">
        <!-- Y-axis labels -->
        <div class="absolute left-0 top-0 bottom-8 w-20 flex flex-col justify-between text-xs text-gray-600 text-right pr-2">
          <div>$${(maxValue / 1000).toFixed(0)}K</div>
          <div>$${(maxValue * 0.75 / 1000).toFixed(0)}K</div>
          <div>$${(maxValue * 0.5 / 1000).toFixed(0)}K</div>
          <div>$${(maxValue * 0.25 / 1000).toFixed(0)}K</div>
          <div>$${(purchasePrice / 1000).toFixed(0)}K</div>
        </div>

        <!-- Chart Area -->
        <div class="ml-24 mr-4">
          <!-- Grid lines -->
          <div class="absolute inset-0 bottom-8">
            <div class="h-full flex flex-col justify-between">
              <div class="border-b border-gray-200"></div>
              <div class="border-b border-gray-200"></div>
              <div class="border-b border-gray-200"></div>
              <div class="border-b border-gray-200"></div>
              <div class="border-b border-gray-300"></div>
            </div>
          </div>

          <!-- Bars -->
          <div class="relative flex items-end justify-between h-64 gap-2">
            ${years.map((year, index) => {
              const heightPercent = (year.value / maxValue) * 100;
              const isCurrentYear = index === 0;
              const isMilestone = index === 5 || index === 10;
              
              return `
                <div class="flex-1 relative group">
                  <!-- Bar -->
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t ${
                    isCurrentYear ? 'from-gray-500 to-gray-400' :
                    isMilestone ? 'from-green-600 to-green-400' :
                    'from-blue-600 to-blue-400'
                  } rounded-t-md transition-all duration-300 hover:opacity-80"
                       style="height: ${heightPercent}%">
                    
                    <!-- Tooltip on hover -->
                    <div class="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div class="font-semibold">$${year.value.toLocaleString()}</div>
                      <div class="text-gray-300">+${year.percentGain}%</div>
                      <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div class="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Year label -->
                  <div class="absolute -bottom-6 left-0 right-0 text-center text-xs text-gray-600">
                    ${index === 0 ? 'Now' : index === 10 ? '10yr' : index === 5 ? '5yr' : index}
                  </div>
                  
                  <!-- Value label for milestones -->
                  ${isMilestone || isCurrentYear ? `
                    <div class="absolute -top-8 left-0 right-0 text-center text-xs font-semibold ${
                      isCurrentYear ? 'text-gray-600' : 'text-green-600'
                    }">
                      $${(year.value / 1000).toFixed(0)}K
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="mt-12 grid grid-cols-3 gap-4">
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <div class="text-2xl font-bold text-gray-900">
            $${((years[5].value - purchasePrice) / 1000).toFixed(0)}K
          </div>
          <div class="text-sm text-gray-600">5-Year Gain</div>
          <div class="text-xs text-gray-500">+${years[5].percentGain}%</div>
        </div>
        
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">
            $${((years[10].value - purchasePrice) / 1000).toFixed(0)}K
          </div>
          <div class="text-sm text-gray-600">10-Year Gain</div>
          <div class="text-xs text-gray-500">+${years[10].percentGain}%</div>
        </div>
        
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">
            $${(years[10].value / 1000).toFixed(0)}K
          </div>
          <div class="text-sm text-gray-600">2035 Value</div>
          <div class="text-xs text-gray-500">Total</div>
        </div>
      </div>

      <!-- Adjustable Rate Slider with Tooltip -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700 flex items-center gap-1">
            Adjust Appreciation Rate
            <button class="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 group relative"
                    onclick="event.preventDefault(); this.querySelector('.tooltip').classList.toggle('hidden');">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="tooltip hidden absolute z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg bottom-6 left-1/2 transform -translate-x-1/2">
                <p>Use this slider to test different appreciation scenarios:</p>
                <ul class="mt-2 space-y-1">
                  <li>• <strong>1-3%:</strong> Conservative (slow growth)</li>
                  <li>• <strong>4-6%:</strong> Moderate (historical average)</li>
                  <li>• <strong>7-10%:</strong> Optimistic (boom market)</li>
                </ul>
                <p class="mt-2 text-yellow-300">Adjusting this will override the calculated rate.</p>
                <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div class="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </button>
          </label>
          <span id="rate-display" class="text-sm font-semibold text-blue-600">${(appreciationRate * 100).toFixed(1)}%</span>
        </div>
        <input type="range" id="appreciation-slider" 
               min="1" max="10" step="0.5" 
               value="${appreciationRate * 100}"
               class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
               onchange="window.updateAppreciationChart(this.value / 100)">
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>Conservative (1%)</span>
          <span>Moderate (4-5%)</span>
          <span>Optimistic (10%)</span>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p class="text-xs text-yellow-800">
          <strong>Note:</strong> These projections are based on ${dataSource === 'Custom rate' ? 'your custom rate' : 'historical market data'}. 
          Actual appreciation rates vary based on location, market conditions, property type, and economic factors. 
          Past performance does not guarantee future results.
        </p>
      </div>
    </div>

    <script>
      window.updateAppreciationChart = function(newRate) {
        // Update the rate display
        document.getElementById('rate-display').textContent = (newRate * 100).toFixed(1) + '%';
        
        // This would trigger a re-render in a real app
        // For now, it just updates the display
        console.log('New appreciation rate:', newRate);
      };
    </script>
  `;
};