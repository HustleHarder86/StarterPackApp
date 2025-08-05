/**
 * Sidebar Navigation Component
 * Hybrid compact modern design with light theme
 */

export const SidebarNavigation = ({ 
  sections = [], 
  activeSection = '',
  onSectionChange,
  className = '',
  isMobile = false,
  isCollapsed = false 
}) => {
  const baseClasses = isMobile 
    ? 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 shadow-lg'
    : `sticky top-0 h-screen bg-gradient-to-b from-gray-50 to-white border-r border-gray-100 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`;

  // Group sections by category
  const groupedSections = sections.reduce((acc, section) => {
    const category = section.category || 'Analysis';
    if (!acc[category]) acc[category] = [];
    acc[category].push(section);
    return acc;
  }, {});

  if (isMobile) {
    // Mobile bottom navigation - compact modern style
    return `
      <nav class="${baseClasses} ${className}">
        <div class="flex justify-around items-center py-2">
          ${sections.slice(0, 5).map(section => `
            <button 
              class="relative flex flex-col items-center p-2 text-xs transition-all duration-200 ${
                activeSection === section.id 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-900'
              }"
              onclick="${onSectionChange}('${section.id}')"
            >
              <div class="relative">
                <div class="w-12 h-12 flex items-center justify-center rounded-xl ${
                  activeSection === section.id 
                    ? 'bg-blue-50' 
                    : 'hover:bg-gray-50'
                } transition-all duration-200">
                  <span class="text-xl">${section.icon || getDefaultIcon(section.id)}</span>
                </div>
                ${activeSection === section.id ? `
                  <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                ` : ''}
              </div>
              <span class="mt-1 font-medium">${section.shortLabel || section.label}</span>
            </button>
          `).join('')}
        </div>
      </nav>
    `;
  }

  // Desktop sidebar - hybrid compact modern design
  return `
    <nav class="${baseClasses} ${className}">
      <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h2 class="${isCollapsed ? 'hidden' : 'text-lg font-semibold text-gray-900'}">Analysis</h2>
            <button 
              onclick="window.toggleSidebar && window.toggleSidebar()"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isCollapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'}"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Navigation Items -->
        <div class="flex-1 overflow-y-auto py-4">
          ${Object.entries(groupedSections).map(([category, categorySections]) => `
            <div class="mb-4">
              ${!isCollapsed ? `
                <div class="px-4 mb-2">
                  <h3 class="text-xs font-medium text-gray-400 uppercase tracking-wider">${category}</h3>
                </div>
              ` : ''}
              <div class="px-2 space-y-1">
                ${categorySections.map(section => `
                  <button 
                    class="w-full group relative flex items-center ${isCollapsed ? 'justify-center' : ''} p-2 rounded-xl transition-all duration-200 ${
                      activeSection === section.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }"
                    onclick="${onSectionChange}('${section.id}')"
                    ${isCollapsed ? `title="${section.label}"` : ''}
                  >
                    <!-- Icon -->
                    <div class="relative flex-shrink-0">
                      <div class="w-10 h-10 flex items-center justify-center rounded-lg ${
                        activeSection === section.id 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      } transition-colors duration-200">
                        <span class="text-lg">${section.icon || getDefaultIcon(section.id)}</span>
                      </div>
                      ${activeSection === section.id ? `
                        <div class="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                      ` : ''}
                    </div>
                    
                    ${!isCollapsed ? `
                      <!-- Label and Description -->
                      <div class="ml-3 flex-1 text-left">
                        <div class="font-medium text-sm">${section.label}</div>
                        ${section.description ? `
                          <div class="text-xs text-gray-500 mt-0.5">${section.description}</div>
                        ` : ''}
                      </div>
                      
                      <!-- Badge -->
                      ${section.badge ? `
                        <span class="ml-auto px-2 py-0.5 text-xs font-medium rounded-md ${
                          section.badge.type === 'success' ? 'bg-green-100 text-green-700' :
                          section.badge.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                          section.badge.type === 'info' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }">
                          ${section.badge.text}
                        </span>
                      ` : ''}
                    ` : ''}
                    
                    <!-- Tooltip for collapsed state -->
                    ${isCollapsed ? `
                      <div class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                        ${section.label}
                        ${section.badge ? ` - ${section.badge.text}` : ''}
                      </div>
                    ` : ''}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Quick Actions -->
        <div class="p-4 border-t border-gray-100">
          ${!isCollapsed ? `
            <div class="space-y-1">
              <button class="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200" onclick="window.print()">
                <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                <span class="font-medium">Print</span>
              </button>
              <button class="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200" onclick="window.appState.downloadPDF && window.appState.downloadPDF()">
                <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="font-medium">Download PDF</span>
              </button>
            </div>
          ` : `
            <div class="flex flex-col items-center space-y-2">
              <button class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200" onclick="window.print()" title="Print">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
              </button>
              <button class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200" onclick="window.appState.downloadPDF && window.appState.downloadPDF()" title="Download PDF">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </button>
            </div>
          `}
        </div>
      </div>
    </nav>
  `;
};

// Helper function to get default icons based on section ID
function getDefaultIcon(sectionId) {
  const icons = {
    overview: '📊',
    financials: '💰',
    'long-term': '🏠',
    'short-term': '🏨',
    comparison: '📈',
    expenses: '💸',
    market: '🏘️',
    insights: '💡',
    regulations: '⚖️',
    recommendations: '✨'
  };
  
  return icons[sectionId] || '📄';
}

// Export analysis sections configuration
export const analysisSections = [
  {
    id: 'overview',
    label: 'Overview',
    shortLabel: 'Overview',
    category: 'Summary',
    icon: '📊',
    description: 'Key metrics and summary'
  },
  {
    id: 'financials',
    label: 'Financial Analysis',
    shortLabel: 'Financials',
    category: 'Analysis',
    icon: '💰',
    description: 'ROI, cash flow, and returns'
  },
  {
    id: 'long-term',
    label: 'Long-Term Rental',
    shortLabel: 'LTR',
    category: 'Rental Strategy',
    icon: '🏠',
    description: 'Traditional rental analysis'
  },
  {
    id: 'short-term',
    label: 'Short-Term Rental',
    shortLabel: 'STR',
    category: 'Rental Strategy',
    icon: '🏨',
    description: 'Airbnb and vacation rental',
    badge: { text: 'Live Data', type: 'success' }
  },
  {
    id: 'comparison',
    label: 'LTR vs STR',
    shortLabel: 'Compare',
    category: 'Rental Strategy',
    icon: '📈',
    description: 'Strategy comparison'
  },
  {
    id: 'expenses',
    label: 'Expense Breakdown',
    shortLabel: 'Expenses',
    category: 'Details',
    icon: '💸',
    description: 'Detailed cost analysis'
  },
  {
    id: 'market',
    label: 'Market Analysis',
    shortLabel: 'Market',
    category: 'Details',
    icon: '🏘️',
    description: 'Local market insights'
  },
  {
    id: 'regulations',
    label: 'STR Regulations',
    shortLabel: 'Rules',
    category: 'Compliance',
    icon: '⚖️',
    description: 'Local STR requirements'
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    shortLabel: 'Tips',
    category: 'Insights',
    icon: '✨',
    description: 'Personalized advice'
  }
];

// Export for global use
window.SidebarNavigation = SidebarNavigation;
window.analysisSections = analysisSections;