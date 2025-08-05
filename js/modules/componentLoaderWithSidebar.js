/**
 * Component Loader Module with Sidebar Navigation
 * Updated to use modern sidebar layout instead of tabs
 */

class ComponentLoader {
  constructor() {
    this.loadedComponents = new Map();
    this.componentCache = new Map();
    this.activeSection = 'overview';
    this.sidebarCollapsed = false;
  }

  /**
   * Load a component from file path
   */
  async loadComponent(componentPath) {
    if (this.componentCache.has(componentPath)) {
      return this.componentCache.get(componentPath);
    }

    try {
      const module = await import(`../../${componentPath}`);
      this.componentCache.set(componentPath, module);
      return module;
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error);
      return null;
    }
  }

  /**
   * Render analysis results with sidebar navigation
   */
  async renderAnalysisResults(analysisData, targetContainer) {
    if (!targetContainer) {
      console.error('Target container not found');
      return;
    }

    // Store analysis data
    this.lastAnalysisData = analysisData;
    window.analysisData = analysisData;

    // Load sidebar navigation
    const sidebarModule = await this.loadComponent('components/navigation/SidebarNavigation.js');
    
    // Prepare sections based on available data
    const sections = this.prepareSections(analysisData);
    
    // Create main layout with sidebar
    targetContainer.innerHTML = `
      <div class="flex h-screen bg-gray-50">
        <!-- Sidebar Container -->
        <div id="sidebar-container"></div>
        
        <!-- Main Content Area -->
        <div class="flex-1 overflow-hidden">
          <div class="h-full overflow-y-auto">
            <!-- Content Header -->
            <div class="bg-white border-b border-gray-100 px-6 py-4">
              <div class="flex items-center justify-between">
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">Property Analysis</h1>
                  <p class="text-sm text-gray-600 mt-1">${analysisData.property_address || analysisData.propertyAddress}</p>
                </div>
                <div class="flex items-center gap-4">
                  ${this.renderHeaderActions()}
                </div>
              </div>
            </div>
            
            <!-- Dynamic Content -->
            <div id="analysis-content" class="p-6">
              <!-- Content will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Render sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarModule && sidebarModule.SidebarNavigation) {
      sidebarContainer.innerHTML = sidebarModule.SidebarNavigation({
        sections,
        activeSection: this.activeSection,
        onSectionChange: 'window.componentLoader.switchSection',
        isCollapsed: this.sidebarCollapsed
      });
    }

    // Setup sidebar toggle
    window.toggleSidebar = () => {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      sidebarContainer.innerHTML = sidebarModule.SidebarNavigation({
        sections,
        activeSection: this.activeSection,
        onSectionChange: 'window.componentLoader.switchSection',
        isCollapsed: this.sidebarCollapsed
      });
    };

    // Setup section switching
    window.componentLoader.switchSection = (sectionId) => {
      this.activeSection = sectionId;
      this.renderSection(sectionId);
      
      // Update sidebar active state
      sidebarContainer.innerHTML = sidebarModule.SidebarNavigation({
        sections,
        activeSection: this.activeSection,
        onSectionChange: 'window.componentLoader.switchSection',
        isCollapsed: this.sidebarCollapsed
      });
    };

    // Render initial section
    this.renderSection(this.activeSection);
  }

  /**
   * Prepare sections based on available data
   */
  prepareSections(analysisData) {
    const sections = [];
    
    // Always show overview
    sections.push({
      id: 'overview',
      label: 'Overview',
      shortLabel: 'Overview',
      category: 'Summary',
      icon: '📊',
      description: 'Key metrics and summary'
    });

    // Financial analysis
    if (analysisData.metrics || analysisData.cash_flow) {
      sections.push({
        id: 'financials',
        label: 'Financial Analysis',
        shortLabel: 'Financials',
        category: 'Analysis',
        icon: '💰',
        description: 'ROI, cash flow, and returns'
      });
    }

    // Long-term rental
    if (analysisData.long_term_rental || analysisData.longTermRental) {
      sections.push({
        id: 'long-term',
        label: 'Long-Term Rental',
        shortLabel: 'LTR',
        category: 'Rental Strategy',
        icon: '🏠',
        description: 'Traditional rental analysis'
      });
    }

    // Short-term rental
    const strData = analysisData.short_term_rental || analysisData.strAnalysis;
    if (strData) {
      sections.push({
        id: 'short-term',
        label: 'Short-Term Rental',
        shortLabel: 'STR',
        category: 'Rental Strategy',
        icon: '🏨',
        description: 'Airbnb and vacation rental',
        badge: strData.comparables?.length > 0 
          ? { text: `${strData.comparables.length} listings`, type: 'success' }
          : null
      });
    }

    // Comparison
    if ((analysisData.long_term_rental || analysisData.longTermRental) && strData) {
      sections.push({
        id: 'comparison',
        label: 'LTR vs STR',
        shortLabel: 'Compare',
        category: 'Rental Strategy',
        icon: '📈',
        description: 'Strategy comparison'
      });
    }

    // Expenses
    if (analysisData.expenses || analysisData.costs) {
      sections.push({
        id: 'expenses',
        label: 'Expense Breakdown',
        shortLabel: 'Expenses',
        category: 'Details',
        icon: '💸',
        description: 'Detailed cost analysis'
      });
    }

    // Regulations
    if (analysisData.regulations) {
      sections.push({
        id: 'regulations',
        label: 'STR Regulations',
        shortLabel: 'Rules',
        category: 'Compliance',
        icon: '⚖️',
        description: 'Local STR requirements'
      });
    }

    // Insights & Recommendations
    if (analysisData.insights || analysisData.recommendations) {
      sections.push({
        id: 'insights',
        label: 'Insights & Tips',
        shortLabel: 'Insights',
        category: 'Recommendations',
        icon: '💡',
        description: 'AI-powered insights'
      });
    }

    return sections;
  }

  /**
   * Render a specific section
   */
  async renderSection(sectionId) {
    const contentContainer = document.getElementById('analysis-content');
    if (!contentContainer) return;

    // Show loading
    contentContainer.innerHTML = `
      <div class="animate-pulse space-y-4">
        <div class="h-32 bg-gray-200 rounded-xl"></div>
        <div class="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    `;

    try {
      let content = '';
      
      switch(sectionId) {
        case 'overview':
          content = await this.renderOverviewSection();
          break;
        case 'financials':
          content = await this.renderFinancialsSection();
          break;
        case 'long-term':
          content = await this.renderLTRSection();
          break;
        case 'short-term':
          content = await this.renderSTRSection();
          break;
        case 'comparison':
          content = await this.renderComparisonSection();
          break;
        case 'expenses':
          content = await this.renderExpensesSection();
          break;
        case 'regulations':
          content = await this.renderRegulationsSection();
          break;
        case 'insights':
          content = await this.renderInsightsSection();
          break;
        default:
          content = '<div class="text-center text-gray-500 py-8">Section not found</div>';
      }
      
      contentContainer.innerHTML = content;
      
    } catch (error) {
      console.error('Error rendering section:', error);
      contentContainer.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading section: ${error.message}
        </div>
      `;
    }
  }

  /**
   * Render overview section
   */
  async renderOverviewSection() {
    const analysisData = this.lastAnalysisData;
    const verdictModule = await this.loadComponent('components/verdict/VerdictCard.js');
    const metricsModule = await this.loadComponent('components/metrics/KeyMetrics.js');
    
    return `
      <div class="space-y-6">
        ${verdictModule ? verdictModule.VerdictCard({
          verdict: this.determineVerdict(analysisData),
          confidence: analysisData.metadata?.confidence || 'high',
          primaryReason: this.getPrimaryReason(analysisData),
          metrics: this.extractKeyMetrics(analysisData)
        }) : ''}
        
        ${metricsModule ? metricsModule.KeyMetrics({
          metrics: this.extractKeyMetrics(analysisData)
        }) : ''}
      </div>
    `;
  }

  /**
   * Render STR section
   */
  async renderSTRSection() {
    const analysisData = this.lastAnalysisData;
    const strData = analysisData.short_term_rental || analysisData.strAnalysis;
    
    if (!strData) {
      return '<div class="text-center text-gray-500 py-8">No STR analysis available</div>';
    }

    const [airbnbModule, strCashFlowModule, revenueCalcModule] = await Promise.all([
      this.loadComponent('components/analysis/AirbnbListings.js'),
      this.loadComponent('components/analysis/STRCashFlowCard.js'),
      this.loadComponent('components/analysis/STRRevenueCalculator.js')
    ]);

    return `
      <div class="space-y-6">
        ${airbnbModule ? airbnbModule.AirbnbHeroSection({ analysis: analysisData }) : ''}
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${strCashFlowModule ? strCashFlowModule.STRCashFlowCard({
            monthlyRevenue: strData.monthly_revenue || strData.monthlyRevenue,
            totalExpenses: strData.total_monthly_expenses || strData.totalMonthlyExpenses,
            mortgagePayment: strData.mortgage_payment || strData.mortgagePayment,
            operatingExpenses: strData.expenses?.monthly?.total || 0
          }) : ''}
          
          ${revenueCalcModule ? revenueCalcModule.STRRevenueCalculator({
            defaultNightlyRate: strData.daily_rate || strData.avg_nightly_rate || 150,
            defaultOccupancy: (strData.occupancy_rate || 0.75) * 100,
            comparables: strData.comparables || []
          }) : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render LTR section
   */
  async renderLTRSection() {
    const analysisData = this.lastAnalysisData;
    const ltrData = analysisData.long_term_rental || analysisData.longTermRental;
    
    if (!ltrData) {
      return '<div class="text-center text-gray-500 py-8">No LTR analysis available</div>';
    }

    const ltrModule = await this.loadComponent('components/analysis/LongTermRental.js');
    
    return `
      <div class="space-y-6">
        ${ltrModule ? ltrModule.LongTermRental({ 
          rental: ltrData,
          expenses: analysisData.monthly_expenses || analysisData.monthlyExpenses
        }) : ''}
      </div>
    `;
  }

  /**
   * Helper methods
   */
  renderHeaderActions() {
    return `
      <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
        <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 14.938 18 14.482 18 14c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684M9 9a3 3 0 11-6 0 3 3 0 016 0zm12 5a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Share
      </button>
      
      <button class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
        <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        Generate Report
      </button>
    `;
  }

  determineVerdict(analysisData) {
    const cashFlow = analysisData.cash_flow?.monthly || analysisData.cashFlow?.monthly || 0;
    const capRate = parseFloat(analysisData.metrics?.cap_rate || analysisData.metrics?.capRate || 0);
    
    if (cashFlow > 1000 && capRate > 6) return 'strong-buy';
    if (cashFlow > 500 || capRate > 5) return 'buy';
    if (cashFlow > 0 || capRate > 4) return 'hold';
    return 'pass';
  }

  getPrimaryReason(analysisData) {
    const cashFlow = analysisData.cash_flow?.monthly || analysisData.cashFlow?.monthly || 0;
    if (cashFlow > 1000) return 'Excellent positive cash flow';
    if (cashFlow > 0) return 'Positive cash flow potential';
    return 'Negative cash flow expected';
  }

  extractKeyMetrics(analysisData) {
    return {
      monthlyRent: analysisData.long_term_rental?.monthly_rent || analysisData.longTermRental?.monthlyRent || 0,
      monthlyExpenses: analysisData.monthly_expenses?.total || analysisData.monthlyExpenses?.total || 0,
      monthlyCashFlow: analysisData.cash_flow?.monthly || analysisData.cashFlow?.monthly || 0,
      capRate: analysisData.metrics?.cap_rate || analysisData.metrics?.capRate || 0,
      totalROI: analysisData.metrics?.total_roi || analysisData.metrics?.totalROI || 0,
      purchasePrice: analysisData.purchase?.price || analysisData.propertyDetails?.estimatedValue || 0
    };
  }

  /**
   * Other section renderers...
   */
  async renderFinancialsSection() {
    const financialModule = await this.loadComponent('components/financials/FinancialMetrics.js');
    return financialModule ? financialModule.FinancialMetrics({ 
      financial: this.lastAnalysisData 
    }) : '<div>Financial analysis not available</div>';
  }

  async renderComparisonSection() {
    const comparisonModule = await this.loadComponent('components/comparison/RentalComparison.js');
    return comparisonModule ? comparisonModule.RentalComparison({ 
      analysis: this.lastAnalysisData 
    }) : '<div>Comparison not available</div>';
  }

  async renderExpensesSection() {
    const expenseModule = await this.loadComponent('components/expenses/ExpenseBreakdown.js');
    return expenseModule ? expenseModule.ExpenseBreakdown({ 
      expenses: this.lastAnalysisData.expenses || this.lastAnalysisData.costs,
      monthlyExpenses: this.lastAnalysisData.monthly_expenses || this.lastAnalysisData.monthlyExpenses
    }) : '<div>Expense breakdown not available</div>';
  }

  async renderRegulationsSection() {
    const regulationsModule = await this.loadComponent('components/compliance/STRRegulations.js');
    return regulationsModule ? regulationsModule.STRRegulations({ 
      regulations: this.lastAnalysisData.regulations 
    }) : '<div>Regulations information not available</div>';
  }

  async renderInsightsSection() {
    const insights = this.lastAnalysisData.insights || [];
    const recommendations = this.lastAnalysisData.recommendations || [];
    
    return `
      <div class="space-y-6">
        ${insights.length > 0 ? `
          <div class="bg-white rounded-xl p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div class="space-y-3">
              ${insights.map(insight => `
                <div class="flex items-start gap-3 p-3 rounded-lg ${
                  insight.type === 'positive' ? 'bg-green-50' :
                  insight.type === 'negative' ? 'bg-red-50' :
                  'bg-blue-50'
                }">
                  <span class="text-xl">${
                    insight.type === 'positive' ? '✅' :
                    insight.type === 'negative' ? '⚠️' :
                    '💡'
                  }</span>
                  <p class="text-sm ${
                    insight.type === 'positive' ? 'text-green-800' :
                    insight.type === 'negative' ? 'text-red-800' :
                    'text-blue-800'
                  }">${insight.message}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${recommendations.length > 0 ? `
          <div class="bg-white rounded-xl p-6 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
            <div class="space-y-3">
              ${recommendations.map(rec => `
                <div class="flex items-start gap-3">
                  <span class="text-xl">💡</span>
                  <p class="text-sm text-gray-700">${rec}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

// Export as default
export default ComponentLoader;