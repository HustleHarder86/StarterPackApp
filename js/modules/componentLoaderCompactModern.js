/**
 * Component Loader Module - Compact Modern Design
 * Loads and renders components with new sidebar layout
 */

// ComponentLoader is already available globally

class ComponentLoaderCompactModern extends ComponentLoader {
  /**
   * Render analysis results using compact modern design
   */
  async renderAnalysisResults(analysisData, targetContainer) {
    if (!targetContainer) {
      console.error('Target container not found');
      return;
    }

    // Store analysis data
    this.lastAnalysisData = analysisData;
    window.analysisData = analysisData;

    try {
      // Extract property and analysis data from the API response
      const data = analysisData.data || analysisData;
      const propertyData = data.propertyData || data.property_data || {};
      const propertyDetails = data.property_details || data.propertyDetails || {};
      const strAnalysis = data.short_term_rental || data.str_analysis || data.strAnalysis || {};
      const ltrAnalysis = data.long_term_rental || data.rental || data.longTermRental || {};
      const costs = data.costs || {};
      const expenses = data.expenses || data.monthly_expenses || {};
      const metrics = data.metrics || {};
      
      // Render the layout with content
      const layoutHtml = `
        <div id="compact-modern-layout"></div>
      `;
      
      targetContainer.innerHTML = layoutHtml;
      
      // Initialize the React layout
      const layoutContainer = document.getElementById('compact-modern-layout');
      if (window.CompactModernLayout && window.ReactDOM) {
        const Layout = window.CompactModernLayout;
        
        // Create the main content
        const mainContent = `
          <!-- Property Hero Section -->
          <div id="property-hero-section"></div>
          
          <!-- Content Grid -->
          <div class="grid-container">
            <!-- Main Analysis Area (8 columns) -->
            <div id="financial-summary"></div>
            
            <!-- Right Sidebar Info (4 columns) -->
            <div id="investment-verdict"></div>
            
            <!-- Market Comparison (full width) -->
            <div class="col-span-12" id="market-comparison"></div>
            
            <!-- Additional Analysis Sections -->
            <div class="col-span-12 space-y-6" id="additional-analysis">
              <!-- LTR Analysis -->
              <div id="ltr-analysis"></div>
              
              <!-- Investment Planning -->
              <div id="investment-planning"></div>
            </div>
          </div>
        `;
        
        // Render the layout with static HTML fallback
        // React doesn't support HTML strings as children, so we use innerHTML
        const layoutHTML = Layout({
          currentPage: 'dashboard',
          propertyData: propertyData,
          children: mainContent
        });
        layoutContainer.innerHTML = layoutHTML;
        
        // Load and render individual components
        await this.renderCompactModernComponents(analysisData);
        
        // Initialize mobile menu for React rendering
        this.initializeMobileMenu();
      } else {
        // Fallback to non-React rendering
        await this.renderStaticCompactModern(analysisData, targetContainer);
      }
      
    } catch (error) {
      console.error('Failed to render analysis results:', error);
      targetContainer.innerHTML = `
        <div class="error-state p-8 text-center">
          <p class="text-red-600">Error loading analysis results</p>
          <p class="text-gray-600 mt-2">${error.message}</p>
        </div>
      `;
    }
  }
  
  /**
   * Render compact modern components
   */
  async renderCompactModernComponents(analysisData) {
    const propertyData = analysisData.propertyData || analysisData.property_data || {};
    const strAnalysis = analysisData.strAnalysis || analysisData.str_analysis || {};
    const ltrAnalysis = analysisData.longTermRental || analysisData.long_term_rental || {};
    const costs = analysisData.costs || {};
    const expenses = analysisData.expenses || analysisData.monthly_expenses || {};
    const metrics = analysisData.metrics || {};
    
    // Render Property Hero Section with Compact Modern design
    const HeroComponent = window.PropertyHeroSectionCompactModern || window.PropertyHeroSection;
    if (HeroComponent) {
      const heroContainer = document.getElementById('property-hero-section');
      if (heroContainer) {
        heroContainer.innerHTML = HeroComponent({ 
          property: propertyData, 
          analysis: analysisData 
        });
      }
    }
    
    // Render Financial Summary
    if (window.FinancialSummaryCompactModern) {
      const financialContainer = document.getElementById('financial-summary');
      if (financialContainer) {
        // Extract financial data from the actual API response
        const monthlyRevenue = strAnalysis.monthly_revenue || strAnalysis.monthlyRevenue || 
                              ltrAnalysis.monthly_rent || ltrAnalysis.monthlyRent || 0;
        
        // Use actual expense data from API
        const monthlyExpenses = expenses.total || expenses.monthly?.total || 0;
        const mortgagePayment = expenses.mortgage || expenses.monthly?.mortgage || 0;
        const propertyTax = expenses.property_tax || expenses.monthly?.property_tax || 0;
        const insurance = expenses.insurance || expenses.monthly?.insurance || 0;
        const management = expenses.management || expenses.monthly?.management || 0;
        const maintenance = expenses.maintenance || expenses.monthly?.maintenance || 0;
        
        financialContainer.innerHTML = window.FinancialSummaryCompactModern({
          monthlyRevenue,
          totalExpenses: monthlyExpenses,
          netCashFlow: monthlyRevenue - monthlyExpenses,
          mortgage: mortgagePayment,
          propertyTax: propertyTax,
          insurance: insurance,
          management: management,
          maintenance: maintenance,
          cashOnCashReturn: metrics.cash_on_cash_return || 12.1,
          debtServiceCoverage: metrics.debt_service_coverage || 1.75,
          grossRentMultiplier: metrics.gross_rent_multiplier || 10.2
        });
      }
    }
    
    // Render Investment Verdict
    if (window.InvestmentVerdictCompactModern) {
      const verdictContainer = document.getElementById('investment-verdict');
      if (verdictContainer) {
        verdictContainer.innerHTML = window.InvestmentVerdictCompactModern({
          recommendation: analysisData.recommendation || 'recommended',
          score: analysisData.investmentScore || 9.1,
          locationScore: 9.5,
          financialsScore: 8.8,
          growthScore: 9.2,
          insights: analysisData.insights || []
        });
      }
    }
    
    // Render Market Comparison
    if (window.MarketComparisonCompactModern) {
      const marketContainer = document.getElementById('market-comparison');
      if (marketContainer) {
        marketContainer.innerHTML = window.MarketComparisonCompactModern({
          comparables: strAnalysis.comparables || [],
          averageCapRate: 7.9,
          marketAverage: 1400000
        });
      }
    }
  }
  
  /**
   * Static rendering fallback
   */
  async renderStaticCompactModern(analysisData, targetContainer) {
    const propertyData = analysisData.propertyData || analysisData.property_data || {};
    
    targetContainer.innerHTML = `
      <!-- Mobile Menu Toggle -->
      <button class="cm-mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle Menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      
      <!-- Sidebar Overlay for Mobile -->
      <div class="cm-sidebar-overlay" id="sidebarOverlay"></div>
      
      <!-- Static Compact Modern Layout -->
      <div class="compact-modern-layout flex h-screen bg-gray-100">
        <!-- Sidebar -->
        <div class="cm-sidebar" id="sidebar">
          <div class="p-4">
            <div class="flex items-center space-x-2 mb-8">
              <div class="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded"></div>
              <span class="text-white font-bold text-lg">InvestPro</span>
            </div>
            
            <nav class="space-y-1">
              <a href="#" class="cm-sidebar-link active">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
                Dashboard
              </a>
            </nav>
            
            ${propertyData.address ? `
              <div class="mt-8 p-3 bg-gray-800 rounded">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-gray-400">Active Analysis</span>
                  <span class="text-xs text-green-400">Live</span>
                </div>
                <div class="text-sm font-medium text-white">${propertyData.address.split(',')[0]}</div>
                <div class="text-xs text-gray-400">${propertyData.city || 'City'}, ${propertyData.province || 'Province'}</div>
              </div>
            ` : ''}
          </div>
          
          <div class="absolute bottom-0 w-56 p-4">
            <button class="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm rounded font-medium">
              New Analysis
            </button>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="cm-main-content flex-1 overflow-y-auto">
          <div id="static-content">
            <!-- Content will be rendered here -->
          </div>
        </div>
      </div>
    `;
    
    // Render components into static content area
    const contentContainer = document.getElementById('static-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div id="property-hero-section"></div>
        <div class="grid-container">
          <div id="financial-summary"></div>
          <div id="investment-verdict"></div>
          <div class="col-span-12" id="market-comparison"></div>
        </div>
      `;
      
      await this.renderCompactModernComponents(analysisData);
    }
    
    // Initialize mobile menu toggle
    this.initializeMobileMenu();
  }
  
  /**
   * Initialize mobile menu toggle functionality
   */
  initializeMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!menuToggle || !sidebar || !overlay) return;
    
    function toggleSidebar() {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
      overlay.classList.toggle('hidden'); // Also toggle hidden class
      menuToggle.classList.toggle('sidebar-open');
    }
    
    // Toggle sidebar when menu button is clicked
    menuToggle.addEventListener('click', toggleSidebar);
    
    // Close sidebar when overlay is clicked
    overlay.addEventListener('click', toggleSidebar);
    
    // Close sidebar on window resize if open
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        overlay.classList.add('hidden'); // Ensure hidden is re-added
        menuToggle.classList.remove('sidebar-open');
      }
    });
  }
  
  /**
   * Calculate monthly expenses
   */
  calculateMonthlyExpenses(propertyData, costs) {
    const annualPropertyTax = propertyData.propertyTaxes || propertyData.property_taxes || 8160;
    const monthlyPropertyTax = annualPropertyTax / 12;
    
    const mortgage = costs.mortgagePayment || 2100;
    const insurance = costs.insurance || 180;
    const management = costs.propertyManagement || costs.property_management || 340;
    const maintenance = costs.maintenance || 250;
    
    return {
      mortgage,
      propertyTax: monthlyPropertyTax,
      insurance,
      management,
      maintenance,
      total: mortgage + monthlyPropertyTax + insurance + management + maintenance
    };
  }
}

// Export to global scope for browser usage
window.ComponentLoaderCompactModern = ComponentLoaderCompactModern;