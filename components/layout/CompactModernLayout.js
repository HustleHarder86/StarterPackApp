(function() {
  window.CompactModernLayout = function({ children, currentPage = 'dashboard', propertyData = null }) {
    // Since we can't use React state in a simple function, we'll create a static layout
    const navigationItems = [
      { id: 'dashboard', label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h16' },
      { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { id: 'portfolio', label: 'Portfolio', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
      { id: 'reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];
    
    const propertyInfo = propertyData ? `
      <div class="mt-8 p-3 bg-gray-800 rounded">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-gray-400">Active Analysis</span>
          <span class="text-xs text-green-400">Live</span>
        </div>
        <div class="text-sm font-medium text-white">${propertyData.address || 'Property Analysis'}</div>
        <div class="text-xs text-gray-400">${propertyData.city || 'Location'}</div>
      </div>
    ` : '';
    
    return `
      <div class="flex h-screen bg-gray-50">
        <!-- Mobile Menu Toggle -->
        <button class="cm-mobile-menu-toggle fixed top-4 left-4 z-50 lg:hidden bg-white rounded-lg p-2 shadow-lg" id="mobileMenuToggle" aria-label="Toggle Menu">
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        
        <!-- Sidebar Overlay for Mobile -->
        <div class="cm-sidebar-overlay fixed inset-0 bg-black bg-opacity-50 z-40 hidden" id="sidebarOverlay"></div>
        
        <!-- Enhanced Compact Sidebar - 224px -->
        <div class="cm-sidebar w-56 bg-gray-900 text-gray-300 h-screen fixed left-0 top-0 overflow-y-auto z-40 shadow-2xl" id="sidebar" style="background-color: #111827;">
          <div class="p-4 h-full flex flex-col">
            <!-- Logo Section with Gradient -->
            <div class="flex items-center space-x-3 mb-8 pb-6 border-b border-gray-800">
              <div class="relative">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg blur opacity-75"></div>
                <div class="relative w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-xl">i</span>
                </div>
              </div>
              <div>
                <span class="text-white font-bold text-xl">InvestPro</span>
                <span class="text-xs text-gray-400 block">Real Estate Analytics</span>
              </div>
            </div>
            
            <!-- Navigation with enhanced styling -->
            <nav class="space-y-2 flex-1">
              ${navigationItems.map(item => `
                <a href="#" class="cm-sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  item.id === currentPage 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"/>
                  </svg>
                  <span class="font-medium">${item.label}</span>
                  ${item.id === currentPage ? '<div class="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>' : ''}
                </a>
              `).join('')}
            </nav>
            
            ${propertyInfo ? `
              <div class="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-gray-400">Active Analysis</span>
                  <span class="flex items-center gap-1 text-xs text-green-400">
                    <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    Live
                  </span>
                </div>
                <div class="text-sm font-semibold text-white">${propertyData.address || 'Property Analysis'}</div>
                <div class="text-xs text-gray-400 mt-1">${propertyData.city || 'Location'}</div>
              </div>
            ` : ''}
            
            <!-- New Analysis Button with Gradient -->
            <div class="mt-6 pt-6 border-t border-gray-800">
              <button class="w-full relative group overflow-hidden rounded-lg">
                <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:scale-105"></div>
                <div class="relative px-4 py-3 flex items-center justify-center gap-2">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span class="text-white font-semibold">New Analysis</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Main Content Area with proper margin -->
        <div class="cm-main-content flex-1 ml-0 lg:ml-56 transition-all duration-300">
          ${children || ''}
        </div>
      </div>
    `;
  };
})();