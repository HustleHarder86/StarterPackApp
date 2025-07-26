/**
 * Enhanced Tab Navigation Component
 * More prominent and user-friendly tab design
 */

export const EnhancedTabNavigation = ({ activeTab = 'str', showSTR = true, showLTR = true }) => {
  return `
    <div class="bg-white rounded-lg shadow-lg mb-6">
      <!-- Tab Header with Background -->
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-t-lg border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">
          📊 Rental Analysis Options
        </h2>
        
        <!-- Tab Navigation -->
        <div class="flex flex-wrap gap-2">
          <!-- STR Tab -->
          <button
            id="str-tab"
            onclick="window.switchTab('str')"
            class="tab-button ${activeTab === 'str' 
              ? 'bg-white text-blue-700 shadow-md border-blue-300 transform scale-105' 
              : 'bg-gray-50 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm border-gray-200'
            } 
            flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 group"
          >
            <span class="text-xl group-hover:scale-110 transition-transform">
              ${activeTab === 'str' ? '🏠' : '🏡'}
            </span>
            <div class="text-left">
              <div class="font-semibold">Short-Term Rental</div>
              <div class="text-xs ${activeTab === 'str' ? 'text-blue-600' : 'text-gray-500'}">
                Airbnb & VRBO Analysis
              </div>
            </div>
            ${activeTab === 'str' ? '<span class="ml-2 text-green-500">✓</span>' : ''}
          </button>
          
          <!-- LTR Tab -->
          <button
            id="ltr-tab"
            onclick="window.switchTab('ltr')"
            class="tab-button ${activeTab === 'ltr' 
              ? 'bg-white text-blue-700 shadow-md border-blue-300 transform scale-105' 
              : 'bg-gray-50 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm border-gray-200'
            } 
            flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 group"
          >
            <span class="text-xl group-hover:scale-110 transition-transform">
              ${activeTab === 'ltr' ? '🏘️' : '🏢'}
            </span>
            <div class="text-left">
              <div class="font-semibold">Long-Term Rental</div>
              <div class="text-xs ${activeTab === 'ltr' ? 'text-blue-600' : 'text-gray-500'}">
                Traditional Rental Income
              </div>
            </div>
            ${activeTab === 'ltr' ? '<span class="ml-2 text-green-500">✓</span>' : ''}
          </button>
          
          <!-- Investment Tab -->
          <button
            id="investment-tab"
            onclick="window.switchTab('investment')"
            class="tab-button ${activeTab === 'investment' 
              ? 'bg-white text-blue-700 shadow-md border-blue-300 transform scale-105' 
              : 'bg-gray-50 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm border-gray-200'
            } 
            flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 group"
          >
            <span class="text-xl group-hover:scale-110 transition-transform">
              ${activeTab === 'investment' ? '📈' : '📊'}
            </span>
            <div class="text-left">
              <div class="font-semibold">Investment Planning</div>
              <div class="text-xs ${activeTab === 'investment' ? 'text-blue-600' : 'text-gray-500'}">
                ROI & Tax Calculator
              </div>
            </div>
            ${activeTab === 'investment' ? '<span class="ml-2 text-green-500">✓</span>' : ''}
          </button>
        </div>
        
        <!-- Helper Text -->
        <p class="text-sm text-gray-600 mt-3 flex items-center gap-1">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Click any tab above to explore different rental strategies
        </p>
      </div>
    </div>
  `;
};

/**
 * Alternative: Pill-style Tab Navigation
 * Modern, compact design with clear visual hierarchy
 */
export const PillTabNavigation = ({ activeTab = 'str' }) => {
  return `
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-1 rounded-xl shadow-lg mb-6">
      <div class="bg-white rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-800">Rental Analysis</h2>
          <span class="text-sm text-gray-500">Select view below ↓</span>
        </div>
        
        <div class="bg-gray-100 p-1 rounded-lg">
          <div class="grid grid-cols-3 gap-1">
            <!-- STR Pill -->
            <button
              id="str-tab"
              onclick="window.switchTab('str')"
              class="tab-button ${activeTab === 'str' 
                ? 'bg-white text-blue-700 shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
              } 
              px-4 py-3 rounded-md font-medium transition-all duration-200 text-center"
            >
              <div class="text-lg mb-1">🏠</div>
              <div class="text-sm font-semibold">Short-Term</div>
              <div class="text-xs text-gray-500">Airbnb</div>
            </button>
            
            <!-- LTR Pill -->
            <button
              id="ltr-tab"
              onclick="window.switchTab('ltr')"
              class="tab-button ${activeTab === 'ltr' 
                ? 'bg-white text-blue-700 shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
              } 
              px-4 py-3 rounded-md font-medium transition-all duration-200 text-center"
            >
              <div class="text-lg mb-1">🏢</div>
              <div class="text-sm font-semibold">Long-Term</div>
              <div class="text-xs text-gray-500">Traditional</div>
            </button>
            
            <!-- Investment Pill -->
            <button
              id="investment-tab"
              onclick="window.switchTab('investment')"
              class="tab-button ${activeTab === 'investment' 
                ? 'bg-white text-blue-700 shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
              } 
              px-4 py-3 rounded-md font-medium transition-all duration-200 text-center"
            >
              <div class="text-lg mb-1">📊</div>
              <div class="text-sm font-semibold">Investment</div>
              <div class="text-xs text-gray-500">Planning</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};