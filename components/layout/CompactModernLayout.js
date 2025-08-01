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
      <div class="flex h-screen bg-gray-100">
        <!-- Mobile Menu Toggle -->
        <button class="cm-mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle Menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        
        <!-- Sidebar Overlay for Mobile -->
        <div class="cm-sidebar-overlay" id="sidebarOverlay"></div>
        
        <!-- Compact Sidebar - 224px -->
        <div class="cm-sidebar" id="sidebar">
          <div class="p-4 h-full flex flex-col">
            <div class="flex items-center space-x-2 mb-8">
              <div class="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded"></div>
              <span class="text-white font-bold text-lg">InvestPro</span>
            </div>
            
            <nav class="space-y-1 flex-1">
              ${navigationItems.map(item => `
                <a href="#" class="cm-sidebar-link ${item.id === currentPage ? 'active' : ''}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"/>
                  </svg>
                  ${item.label}
                </a>
              `).join('')}
            </nav>
            
            ${propertyInfo}
            
            <div class="mt-4">
              <button class="w-full cm-btn-gradient">
                New Analysis
              </button>
            </div>
          </div>
        </div>
        
        <!-- Main Content Area -->
        <div class="cm-main-content">
          ${children || ''}
        </div>
      </div>
    `;
  };
})();