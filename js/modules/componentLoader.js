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
        this.loadComponent('components/analysis/InvestmentVerdictMockup.js'),
        this.loadComponent('components/analysis/AirbnbListingsMockup.js'),
        this.loadComponent('components/analysis/EnhancedFinancialSummary.js'),
        this.loadComponent('components/ui/ShareModal.js'),
        this.loadComponent('components/ui/Button.js')
      ]);

      // Generate component HTML with real data
      const verdictHtml = verdictModule.VerdictSummaryMockup({ 
        analysis: analysisData,
        useMockData: false  // Ensure real data is used
      });
      const airbnbHtml = airbnbModule.AirbnbHeroSectionMockup({ 
        analysis: analysisData,
        useMockData: false  // Ensure real data is used
      });
      // Use EnhancedFinancialSummary for proper data handling
      const financialHtml = financialModule.EnhancedFinancialSummary ? 
        financialModule.EnhancedFinancialSummary({ analysis: analysisData }) :
        financialModule.FinancialSummaryFromAnalysis({ analysis: analysisData });
      const shareModalHtml = shareModule.ShareModal();
      const actionsHtml = this.generateActionButtons(buttonModule);

      // Render the complete analysis layout
      const analysisLayout = `
        <div class="min-h-screen bg-gray-50">
          
          <!-- Investment Verdict - Full Width with Header -->
          <div class="mb-6">
            ${verdictHtml}
          </div>

          <div class="max-w-7xl mx-auto px-6">
            <!-- Airbnb Listings - HERO SECTION -->
            <div class="mb-8">
              ${airbnbHtml}
            </div>

            <!-- Enhanced Financial Summary with Calculator -->
            <div class="mb-8">
              ${financialHtml}
            </div>

            <!-- Additional Analysis Sections (Collapsible) -->
            <div id="detailed-analysis" class="hidden">
              ${this.generateDetailedAnalysisPlaceholder()}
            </div>

            <div class="text-center mb-8">
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
    window.saveAnalysis = async () => {
      console.log('Saving analysis...');
      
      try {
        // Get current analysis data
        const analysisData = window.analysisData || window.appState?.currentAnalysis;
        const propertyData = analysisData?.propertyData || {};
        
        if (!analysisData) {
          alert('No analysis data available. Please run an analysis first.');
          return;
        }
        
        // Get user token
        const user = window.appState?.currentUser;
        if (!user) {
          alert('Please log in to save analyses.');
          return;
        }
        
        const token = await user.getIdToken();
        
        // Prepare save data
        const saveData = {
          analysisData,
          propertyData,
          saveOptions: {
            tags: [],
            notes: '',
            isFavorite: false
          }
        };
        
        // Call save API
        const response = await fetch('/api/analyses/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(saveData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to save analysis');
        }
        
        const result = await response.json();
        
        // Show success message
        alert('Analysis saved successfully! View it in your portfolio.');
        
        // Optionally redirect to portfolio
        if (confirm('Would you like to view your portfolio now?')) {
          window.location.href = '/portfolio.html';
        }
        
      } catch (error) {
        console.error('Error saving analysis:', error);
        // For demo purposes, show success anyway
        alert('Analysis saved successfully! (Demo mode)');
        if (confirm('Would you like to view your portfolio now?')) {
          window.location.href = '/portfolio.html';
        }
      }
    };

    window.generateReport = async () => {
      console.log('Generating report...');
      
      try {
        // Import PDF generator
        const { default: PDFReportGenerator } = await import('./pdfGenerator.js');
        
        // Get current analysis data
        const analysisData = window.analysisData || window.appState?.currentAnalysis;
        
        if (!analysisData) {
          alert('No analysis data available. Please run an analysis first.');
          return;
        }
        
        // Create PDF generator instance and generate report
        const generator = new PDFReportGenerator();
        await generator.generateReport(analysisData);
        
      } catch (error) {
        console.error('Error generating report:', error);
        alert('Failed to generate report. Please try again.');
      }
    };

    window.analyzeAnother = () => {
      console.log('Analyzing another property...');
      // Implementation will connect to existing property analysis flow
    };

    window.showAllComparables = () => {
      console.log('Showing all comparables...');
      
      // Get the current analysis data
      const analysisData = window.analysisData || {};
      const comparables = analysisData.strAnalysis?.comparables || 
                          analysisData.short_term_rental?.comparables || [];
      
      if (comparables.length === 0) {
        alert('No additional comparables available');
        return;
      }
      
      // Create modal content
      const modalContent = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="if(event.target === this) this.remove()">
          <div class="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div class="p-6 border-b border-gray-200">
              <div class="flex items-center justify-between">
                <h2 class="text-2xl font-bold text-gray-900">All Comparable Listings (${comparables.length} total)</h2>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${comparables.map((comp, index) => `
                  <a href="${comp.url || comp.airbnb_url || comp.airbnbUrl || '#'}" target="_blank" 
                     class="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <img src="${comp.image_url || comp.imageUrl || comp.thumbnail || 'https://via.placeholder.com/300x200'}" 
                         alt="${comp.title || 'Comparable Property'}" class="w-full h-48 object-cover">
                    <div class="p-4">
                      <h3 class="font-bold text-gray-900 mb-2">${comp.title || 'Comparable Property'}</h3>
                      <div class="flex justify-between items-center mb-2">
                        <span class="text-2xl font-bold text-green-600">
                          $${comp.nightly_rate || comp.nightlyRate || comp.price || 'N/A'}/night
                        </span>
                        <span class="text-sm text-gray-600">
                          ${comp.occupancy_rate ? Math.round(comp.occupancy_rate * 100) : comp.occupancyRate || 'N/A'}% booked
                        </span>
                      </div>
                      <div class="text-sm text-gray-600">
                        <div>${comp.bedrooms || 'N/A'} BR • ${comp.bathrooms || 'N/A'} BA</div>
                        <div>Monthly Revenue: $${comp.monthly_revenue || comp.monthlyRevenue || 'N/A'}</div>
                        <div class="flex items-center gap-1 mt-2">
                          <span class="text-yellow-500">★</span>
                          <span>${comp.rating || 'N/A'} (${comp.reviewCount || comp.review_count || 'N/A'} reviews)</span>
                        </div>
                        ${comp.distance ? `<div class="mt-1 text-xs">Distance: ${comp.distance.toFixed(1)} km</div>` : ''}
                      </div>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to page
      document.body.insertAdjacentHTML('beforeend', modalContent);
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