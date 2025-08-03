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
        <div class="cm-sidebar" id="sidebar">
          <div class="sidebar-logo">
            <div class="flex items-center gap-3">
              <div class="logo-icon">
                <div class="logo-icon-blur"></div>
                <div class="logo-icon-main">i</div>
              </div>
              <div>
                <div class="text-white font-bold text-lg">InvestPro</div>
                <div class="text-xs text-gray-400">Real Estate Analytics</div>
              </div>
            </div>
          </div>
          
          <!-- Navigation -->
          <nav class="sidebar-nav">
            ${navigationItems.map(item => `
              <a href="#" class="sidebar-link ${item.id === 'analytics' ? 'active' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"/>
                </svg>
                ${item.label}
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
          
          <!-- Bottom Action -->
          <div class="sidebar-bottom">
            <button class="btn-primary w-full flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Analysis
            </button>
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