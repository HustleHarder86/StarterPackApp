/**
 * Component Loader Module
 * Dynamically loads and renders components
 */

class ComponentLoader {
  constructor() {
    this.loadedComponents = new Map();
    this.componentCache = new Map();
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
   * Render component to DOM element
   */
  async renderComponent(componentPath, componentName, props = {}, targetElement) {
    try {
      const module = await this.loadComponent(componentPath);
      if (!module || !module[componentName]) {
        throw new Error(`Component ${componentName} not found in ${componentPath}`);
      }

      const componentFunction = module[componentName];
      const html = componentFunction(props);
      
      if (targetElement) {
        targetElement.innerHTML = html;
      }
      
      return html;
    } catch (error) {
      console.error(`Failed to render component: ${componentName}`, error);
      return `<div class="error-component">Error loading ${componentName}</div>`;
    }
  }

  /**
   * Load multiple components in parallel
   */
  async loadComponents(componentConfigs) {
    const loadPromises = componentConfigs.map(config => 
      this.loadComponent(config.path)
    );
    
    return Promise.all(loadPromises);
  }

  /**
   * Render analysis results using modular components
   */
  async renderAnalysisResults(analysisData, targetContainer) {
    if (!targetContainer) {
      console.error('Target container not found');
      return;
    }

    // Show loading state first
    targetContainer.innerHTML = `
      <div class="container mx-auto p-lg">
        <div class="animate-pulse space-y-lg">
          <div class="h-32 bg-gray-200 rounded-xl"></div>
          <div class="h-64 bg-gray-200 rounded-xl"></div>
          <div class="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    `;

    try {
      // Load all required components
      const [
        verdictModule,
        airbnbModule,
        financialModule,
        shareModule,
        buttonModule
      ] = await Promise.all([
        this.loadComponent('components/analysis/InvestmentVerdict.js'),
        this.loadComponent('components/analysis/AirbnbListings.js'),
        this.loadComponent('components/analysis/EnhancedFinancialSummary.js'),
        this.loadComponent('components/ui/ShareModal.js'),
        this.loadComponent('components/ui/Button.js')
      ]);

      // Generate component HTML
      const verdictHtml = verdictModule.VerdictSummary({ analysis: analysisData });
      const airbnbHtml = airbnbModule.AirbnbHeroSection({ analysis: analysisData });
      const financialHtml = financialModule.FinancialSummaryFromAnalysis({ analysis: analysisData });
      const shareModalHtml = shareModule.ShareModal();
      const actionsHtml = this.generateActionButtons(buttonModule);

      // Render the complete analysis layout
      const analysisLayout = `
        <div class="container mx-auto px-lg py-xl">
          
          <!-- Investment Verdict - Top Priority -->
          <div class="mb-2xl">
            ${verdictHtml}
          </div>

          <!-- Airbnb Listings - HERO SECTION -->
          <div class="mb-2xl">
            ${airbnbHtml}
          </div>

          <!-- Enhanced Financial Summary with Calculator -->
          <div class="mb-2xl">
            ${financialHtml}
          </div>

          <!-- Additional Analysis Sections (Collapsible) -->
          <div id="detailed-analysis" class="hidden">
            ${this.generateDetailedAnalysisPlaceholder()}
          </div>

          <div class="text-center">
            <button 
              onclick="toggleDetailedAnalysis()"
              class="btn btn-secondary"
            >
              <span id="toggle-text">Show Detailed Analysis</span>
              <svg class="w-5 h-5 transition-transform" id="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>

        </div>

        <!-- Share Modal -->
        ${shareModalHtml}

        <!-- Share Modal Script -->
        ${shareModule.shareModalScript}
      `;

      targetContainer.innerHTML = analysisLayout;
      this.attachEventHandlers();
      
      // Initialize enhanced financial summary after DOM is updated
      setTimeout(async () => {
        // Initialize the financial summary chart and metrics
        if (financialModule.initializeEnhancedFinancialSummary) {
          financialModule.initializeEnhancedFinancialSummary();
        }
        
        // Import and initialize the financial calculator
        try {
          const { initializeFinancialCalculator } = await import('./financialCalculatorInit.js');
          initializeFinancialCalculator();
        } catch (error) {
          console.error('Failed to initialize financial calculator:', error);
        }
      }, 100);

    } catch (error) {
      console.error('Failed to render analysis results:', error);
      targetContainer.innerHTML = `
        <div class="container mx-auto p-lg">
          <div class="card text-center p-2xl">
            <h3 class="text-xl font-bold text-red-600 mb-md">Error Loading Analysis</h3>
            <p class="text-gray-600 mb-lg">There was an error displaying the analysis results.</p>
            <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
          </div>
        </div>
      `;
    }
  }

  generateActionButtons(buttonModule) {
    const { ActionButton } = buttonModule;
    
    return `
      <div class="card p-xl">
        <h3 class="text-xl font-bold text-gray-900 mb-lg">Next Steps</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
          ${ActionButton({
            action: 'saveAnalysis()',
            icon: '💾',
            label: 'Save to Portfolio',
            description: 'Keep this analysis for future reference'
          })}
          ${ActionButton({
            action: 'generateReport()',
            icon: '📊',
            label: 'Generate Report',
            description: 'Create a professional PDF report'
          })}
          ${ActionButton({
            action: 'analyzeAnother()',
            icon: '🔍',
            label: 'Analyze Another',
            description: 'Compare with other properties'
          })}
        </div>
      </div>
    `;
  }

  generateDetailedAnalysisPlaceholder() {
    return `
      <div class="space-y-xl">
        <div class="card p-xl">
          <h4 class="text-lg font-bold text-gray-900 mb-lg">Detailed Market Analysis</h4>
          <p class="text-gray-600">Additional market insights and trends will be displayed here.</p>
        </div>
        
        <div class="card p-xl">
          <h4 class="text-lg font-bold text-gray-900 mb-lg">Risk Assessment</h4>
          <p class="text-gray-600">Comprehensive risk analysis and mitigation strategies.</p>
        </div>
        
        <div class="card p-xl">
          <h4 class="text-lg font-bold text-gray-900 mb-lg">Investment Scenarios</h4>
          <p class="text-gray-600">Best case, worst case, and most likely scenarios.</p>
        </div>
      </div>
    `;
  }

  attachEventHandlers() {
    // Toggle detailed analysis
    window.toggleDetailedAnalysis = () => {
      const detailedSection = document.getElementById('detailed-analysis');
      const toggleText = document.getElementById('toggle-text');
      const toggleIcon = document.getElementById('toggle-icon');
      
      if (detailedSection.classList.contains('hidden')) {
        detailedSection.classList.remove('hidden');
        detailedSection.classList.add('animate-slide-in');
        toggleText.textContent = 'Hide Detailed Analysis';
        toggleIcon.style.transform = 'rotate(180deg)';
      } else {
        detailedSection.classList.add('hidden');
        toggleText.textContent = 'Show Detailed Analysis';
        toggleIcon.style.transform = 'rotate(0deg)';
      }
    };

    // Global action handlers
    window.saveAnalysis = () => {
      console.log('Saving analysis...');
      // Implementation will connect to existing save functionality
    };

    window.generateReport = () => {
      console.log('Generating report...');
      // Implementation will connect to existing report generation
    };

    window.analyzeAnother = () => {
      console.log('Analyzing another property...');
      // Implementation will connect to existing property analysis flow
    };

    window.showAllComparables = () => {
      console.log('Showing all comparables...');
      // Implementation for expanded comparables view
    };

    window.retryAirbnbSearch = () => {
      console.log('Retrying Airbnb search...');
      // Implementation for retrying failed searches
    };
  }

  /**
   * Render mobile-optimized layout
   */
  async renderMobileAnalysis(analysisData, targetContainer) {
    if (!targetContainer) return;

    try {
      const [airbnbModule, financialModule, buttonModule] = await Promise.all([
        this.loadComponent('components/analysis/AirbnbListings.js'),
        this.loadComponent('components/analysis/FinancialSummary.js'),
        this.loadComponent('components/ui/Button.js')
      ]);

      const mobileLayout = `
        <div class="px-lg py-xl pb-24">
          <!-- Mobile Verdict Card -->
          <div class="card p-lg mb-lg border-l-4 border-green-500">
            <div class="flex items-center gap-md mb-md">
              <span class="badge badge-success">✓ RECOMMENDED</span>
              <span class="badge badge-info">High Confidence</span>
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-sm">Short-Term Rental Strategy</h2>
            <div class="bg-green-50 rounded-lg p-lg">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm text-gray-600">Monthly Revenue</div>
                  <div class="text-2xl font-bold text-green-600">$${analysisData.strAnalysis?.monthlyRevenue?.toLocaleString() || '0'}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-gray-600">Score</div>
                  <div class="text-xl font-bold text-blue-600">${analysisData.overallScore || 0}/10</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile Airbnb Listings -->
          ${airbnbModule.AirbnbListingsMobile({ 
            comparables: analysisData.strAnalysis?.comparables || [],
            marketData: {}
          })}

          <!-- Mobile Financial Summary -->
          ${financialModule.QuickFinancialSummary({
            strRevenue: analysisData.strAnalysis?.monthlyRevenue || 0,
            ltrRevenue: analysisData.longTermRental?.monthlyRent || 0,
            netCashFlow: analysisData.longTermRental?.cashFlow || 0,
            roi: analysisData.longTermRental?.roi || 0
          })}

        </div>

        <!-- Mobile Action Buttons -->
        ${buttonModule.MobileActionButtons()}
      `;

      targetContainer.innerHTML = mobileLayout;
      this.attachEventHandlers();

    } catch (error) {
      console.error('Failed to render mobile analysis:', error);
    }
  }
}

// Create global instance
window.componentLoader = new ComponentLoader();

export default ComponentLoader;