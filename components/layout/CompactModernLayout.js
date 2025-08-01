const CompactModernLayout = ({ children, currentPage = 'dashboard', propertyData = null }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    
    const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'M4 6h16M4 12h16M4 18h16' },
        { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { id: 'portfolio', label: 'Portfolio', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
        { id: 'reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];
    
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Menu Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : ''} lg:translate-x-0`}>
                <div className="p-4">
                    {/* Logo */}
                    <div className="flex items-center space-x-2 mb-8">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded"></div>
                        <span className="text-white font-bold text-lg">InvestPro</span>
                    </div>
                    
                    {/* Navigation */}
                    <nav className="space-y-1">
                        {navigationItems.map(item => (
                            <a
                                key={item.id}
                                href="#"
                                className={`sidebar-link ${currentPage === item.id ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Handle navigation
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                                {item.label}
                            </a>
                        ))}
                    </nav>
                    
                    {/* Active Analysis Widget */}
                    {propertyData && (
                        <div className="mt-8 p-3 bg-gray-800 rounded">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400">Active Analysis</span>
                                <span className="text-xs text-green-400">Live</span>
                            </div>
                            <div className="text-sm font-medium text-white">
                                {propertyData.address?.split(',')[0] || 'Property Analysis'}
                            </div>
                            <div className="text-xs text-gray-400">
                                {propertyData.city || 'Location'}, {propertyData.province || 'Province'}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* New Analysis Button */}
                <div className="absolute bottom-0 w-56 p-4">
                    <button 
                        className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm rounded font-medium hover:from-indigo-600 hover:to-purple-700 transition"
                        onClick={() => window.location.href = '/'}
                    >
                        New Analysis
                    </button>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="main-content flex-1">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded"></div>
                        <span className="font-bold text-lg">InvestPro</span>
                    </div>
                </div>
                
                {/* Content */}
                {children}
            </div>
        </div>
    );
};

// Export for use in other components
window.CompactModernLayout = CompactModernLayout;