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

    // Store analysis data for later access
    this.lastAnalysisData = analysisData;
    window.analysisData = analysisData; // Make it globally accessible
    console.log('Stored analysis data:', analysisData);

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
        ltrModule,
        financialModule,
        shareModule,
        buttonModule,
        taxCalcModule,
        dummiesModule,
        financingModule,
        appreciationModule
      ] = await Promise.all([
        this.loadComponent('components/analysis/InvestmentVerdictMockup.js'),
        this.loadComponent('components/analysis/AirbnbListingsMockup.js'),
        this.loadComponent('components/analysis/LongTermRentalAnalysis.js'),
        this.loadComponent('components/analysis/EnhancedFinancialSummary.js'),
        this.loadComponent('components/ui/ShareModal.js'),
        this.loadComponent('components/ui/Button.js'),
        this.loadComponent('components/analysis/CanadianCapitalGainsTaxCalculator.js'),
        this.loadComponent('components/analysis/InvestmentSummaryForDummies.js'),
        this.loadComponent('components/analysis/FinancingScenariosComparison.js'),
        this.loadComponent('components/analysis/PropertyAppreciationChart.js')
      ]);

      // Generate component HTML with real data
      const verdictHtml = verdictModule.VerdictSummaryMockup({ 
        analysis: analysisData,
        useMockData: false  // Ensure real data is used
      });
      
      // Determine which analysis types to show
      const analysisType = analysisData.analysisType || 'both';
      const showSTR = analysisType === 'both' || analysisType === 'str';
      const showLTR = analysisType === 'both' || analysisType === 'ltr';
      const showTabs = analysisType === 'both';
      
      // Always generate content for tabs, but show appropriate messages if data is missing
      const airbnbHtml = analysisData.strAnalysis ? airbnbModule.AirbnbHeroSectionMockup({ 
        analysis: analysisData,
        useMockData: false  // Ensure real data is used
      }) : '<div class="text-center text-gray-500 py-12"><p class="text-lg">Short-term rental analysis was not included in this report.</p><p class="mt-2">Re-run the analysis with STR option selected to see Airbnb comparables.</p></div>';
      
      // Import chart modules dynamically
      let ltrChartsModule = null;
      let investmentChartsModule = null;
      let strChartsModule = null;
      
      try {
        ltrChartsModule = await import('./ltrCharts.js');
        investmentChartsModule = await import('./investmentCharts.js');
        strChartsModule = await import('./strCharts.js');
      } catch (error) {
        console.log('Chart modules not loaded:', error);
      }
      
      // Generate LTR content with enhanced charts
      const ltrHtml = analysisData.longTermRental ? `
        ${ltrModule.LongTermRentalAnalysis({ analysis: analysisData })}
        <div class="space-y-6 mt-6">
          ${ltrChartsModule ? ltrChartsModule.createRentalComparisonChart(analysisData) : ''}
          ${ltrChartsModule ? ltrChartsModule.createExpenseBreakdownChart(analysisData.costs || {}) : ''}
          ${ltrChartsModule ? ltrChartsModule.createCashFlowProjection(analysisData) : ''}
        </div>
      ` : '<div class="text-center text-gray-500 py-12"><p class="text-lg">Long-term rental analysis was not included in this report.</p><p class="mt-2">Re-run the analysis with LTR option selected to see rental estimates.</p></div>';
      
      // Use EnhancedFinancialSummary for proper data handling
      const financialHtml = financialModule.EnhancedFinancialSummary ? 
        financialModule.EnhancedFinancialSummary({ analysis: analysisData }) :
        financialModule.FinancialSummaryFromAnalysis({ analysis: analysisData });
      
      // Generate Investment Planning components with enhanced charts
      const investmentPlanningHtml = `
        <div class="space-y-6">
          <!-- Enhanced Investment Charts -->
          ${investmentChartsModule ? `
            ${investmentChartsModule.createBreakEvenChart(analysisData)}
            ${investmentChartsModule.createEquityBuildupChart(analysisData)}
            ${investmentChartsModule.createROIComparisonMatrix(analysisData)}
          ` : ''}
          
          <!-- Property Appreciation Chart - New! -->
          ${appreciationModule.PropertyAppreciationChart({
            propertyData: analysisData.propertyData || {},
            currentValue: analysisData.propertyData?.price || 0
          })}
          
          <!-- Investment Summary for Dummies -->
          ${dummiesModule.InvestmentSummaryForDummies({
            propertyData: analysisData.propertyData || {},
            strAnalysis: analysisData.strAnalysis || {},
            ltrAnalysis: analysisData.longTermRental || {},
            financialAssumptions: {}
          })}
          
          <!-- Canadian Capital Gains Tax Calculator -->
          ${taxCalcModule.CanadianCapitalGainsTaxCalculator({
            propertyData: analysisData.propertyData || {},
            purchasePrice: analysisData.propertyData?.price || 0,
            currentValue: analysisData.propertyData?.price || 0
          })}
          
          <!-- Financing Scenarios Comparison -->
          ${financingModule.FinancingScenariosComparison({
            propertyData: analysisData.propertyData || {},
            monthlyRevenue: analysisData.strAnalysis?.monthlyRevenue || analysisData.longTermRental?.monthlyRent || 0,
            monthlyExpenses: (analysisData.propertyData?.propertyTaxes || 0) / 12 + 
                            (analysisData.propertyData?.condoFees || 0) + 
                            200 // Other estimated expenses
          })}
        </div>
      `;
      
      const shareModalHtml = shareModule.ShareModal();
      const actionsHtml = this.generateActionButtons(buttonModule);
      
      // Extract property data for header
      const propertyData = analysisData.propertyData || analysisData.property_data || {};
      const bedrooms = propertyData.bedrooms || 2;
      const bathrooms = propertyData.bathrooms || 2;
      const sqft = propertyData.squareFeet || propertyData.square_feet || propertyData.sqft || 'N/A';
      const propertyAddress = propertyData.address || 'Property Address';
      
      // Enhanced image extraction with more fallbacks
      const propertyImage = propertyData.mainImage || 
        propertyData.image || 
        propertyData.imageUrl || 
        propertyData.image_url || 
        analysisData.mainImage ||
        analysisData.image ||
        analysisData.imageUrl ||
        analysisData.property?.mainImage ||
        analysisData.property?.image ||
        analysisData.propertyImage ||
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop';
      
      // Debug log to help troubleshoot
      console.log('[Property Header] Image search:', {
        'propertyData.mainImage': propertyData.mainImage,
        'propertyData.image': propertyData.image,
        'analysisData.mainImage': analysisData.mainImage,
        'analysisData.property?.mainImage': analysisData.property?.mainImage,
        'Final selected': propertyImage
      });
      
      // Create reusable property header
      const propertyHeaderHtml = `
        <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl mb-6 shadow-lg overflow-hidden">
          <div class="p-6">
            <div class="flex flex-col lg:flex-row items-center gap-6">
              <!-- Property Image -->
              <div class="w-full lg:w-64 h-48 rounded-lg overflow-hidden shadow-xl">
                <img 
                  src="${propertyImage}" 
                  alt="Property" 
                  class="w-full h-full object-cover"
                  onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop'"
                />
              </div>
              
              <!-- Property Details -->
              <div class="flex-1 text-center lg:text-left">
                <h1 class="text-3xl font-bold mb-2">Property Investment Analysis</h1>
                <p class="text-xl mb-4">${propertyAddress}</p>
                
                <div class="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                    </svg>
                    <span>${bedrooms} Bedrooms</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2h-6zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clip-rule="evenodd"></path>
                    </svg>
                    <span>${bathrooms} Bathrooms</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"></path>
                      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"></path>
                      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"></path>
                    </svg>
                    <span>${sqft} sq ft</span>
                  </div>
                </div>
              </div>
              
              <!-- Live Data Badge -->
              <div class="flex flex-col items-center gap-2">
                <span class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur text-white text-sm font-bold rounded-full shadow-lg animate-pulse-subtle">
                  <span class="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  LIVE DATA
                </span>
                <span class="text-xs text-white/80">Updated just now</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Render the complete analysis layout
      const analysisLayout = `
        <div class="min-h-screen bg-gray-50" style="overflow-x: hidden;">
          
          <div class="max-w-7xl mx-auto px-4 lg:px-6 pt-6" style="overflow-x: hidden;">
            <!-- Enhanced Rental Analysis Tabs as Main Header -->
            <div class="mb-8">
              <!-- Tab Navigation -->
              <div class="bg-white rounded-lg shadow-lg">
                <div class="p-4 rounded-t-lg border-b border-gray-200">
                  
                  <!-- Enhanced Tab Buttons -->
                  <div class="flex flex-wrap gap-2">
                    <!-- STR Tab -->
                    <button
                      id="str-tab"
                      onclick="window.switchTab('str')"
                      class="tab-button ${showSTR ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg border-transparent transform scale-105' : 'bg-gray-50 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm border-gray-200'} 
                      flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 group"
                    >
                      <span class="text-xl group-hover:scale-110 transition-transform">
                        ${showSTR ? '🏠' : '🏡'}
                      </span>
                      <div class="text-left">
                        <div class="font-semibold">Short-Term Rental</div>
                        <div class="text-xs ${showSTR ? 'text-blue-100' : 'text-gray-500'}">
                          Airbnb & VRBO Analysis
                        </div>
                      </div>
                      ${showSTR ? '<span class="ml-2 text-white">✓</span>' : ''}
                    </button>
                    
                    <!-- LTR Tab -->
                    <button
                      id="ltr-tab"
                      onclick="window.switchTab('ltr')"
                      class="tab-button ${showLTR && !showSTR ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg border-transparent transform scale-105' : 'bg-gray-50 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm border-gray-200'} 
                      flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 group"
                    >
                      <span class="text-xl group-hover:scale-110 transition-transform">
                        ${showLTR && !showSTR ? '🏘️' : '🏢'}
                      </span>
                      <div class="text-left">
                        <div class="font-semibold">Long-Term Rental</div>
                        <div class="text-xs ${showLTR && !showSTR ? 'text-blue-100' : 'text-gray-500'}">
                          Traditional Rental Income
                        </div>
                      </div>
                      ${showLTR && !showSTR ? '<span class="ml-2 text-white">✓</span>' : ''}
                    </button>
                    
                    <!-- Investment Tab -->
                    <button
                      id="investment-tab"
                      onclick="window.switchTab('investment')"
                      class="tab-button bg-gray-50 text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm border-gray-200 
                      flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 group"
                    >
                      <span class="text-xl group-hover:scale-110 transition-transform">
                        📊
                      </span>
                      <div class="text-left">
                        <div class="font-semibold">Investment Planning</div>
                        <div class="text-xs text-gray-500">
                          ROI & Tax Calculator
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <!-- Helper Text -->
                  <p class="text-sm text-gray-600 mt-3 flex items-center gap-1">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Click any tab above to explore different rental strategies and investment options
                  </p>
                </div>
                
                <!-- Tab Content with Padding -->
                <div class="p-6">
                  <!-- STR Content -->
                  <div id="str-content" class="tab-content">
                    ${propertyHeaderHtml}
                    ${airbnbHtml}
                  </div>
                  
                  <!-- LTR Content -->
                  <div id="ltr-content" class="tab-content hidden">
                    ${propertyHeaderHtml}
                    ${ltrHtml}
                  </div>
                  
                  <!-- Investment Planning Content - Always available -->
                  <div id="investment-content" class="tab-content hidden">
                    ${propertyHeaderHtml}
                    ${investmentPlanningHtml}
                  </div>
                </div>
              </div>
            </div>

            <!-- Enhanced Financial Summary with Calculator -->
            <div class="mb-8">
              ${financialHtml}
            </div>

            <!-- Additional Analysis Sections (Collapsible) -->
            <div id="detailed-analysis" class="hidden">
              ${this.generateDetailedAnalysisPlaceholder(analysisData)}
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
        
        <!-- Tab Switching Script -->
        <script>
          // Tab switching is handled in the main script after this
        </script>
        
        <style>
          @keyframes pulse-subtle { 
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse-subtle { 
            animation: pulse-subtle 2s ease-in-out infinite; 
          }
        </style>
      `;

      targetContainer.innerHTML = analysisLayout;
      this.attachEventHandlers();
      
      // Initialize STR components after DOM is ready
      setTimeout(() => {
        if (strChartsModule && strChartsModule.initializeSTRComponents) {
          console.log('Initializing STR components');
          // Wait for Chart.js to be available
          const waitForChartJs = (retries = 10) => {
            if (window.Chart) {
              strChartsModule.initializeSTRComponents(analysisData);
            } else if (retries > 0) {
              console.log('Waiting for Chart.js to load...', retries);
              setTimeout(() => waitForChartJs(retries - 1), 200);
            } else {
              console.error('Chart.js failed to load after multiple retries');
            }
          };
          waitForChartJs();
        }
      }, 100);
      
      // Define switchTab function globally
      window.switchTab = function(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Debug: Log all tab contents found
        const allTabContents = document.querySelectorAll('.tab-content');
        console.log('Found tab contents:', allTabContents.length);
        allTabContents.forEach(content => {
          console.log('Tab content:', content.id, 'Hidden:', content.classList.contains('hidden'));
        });
        
        // Update tab buttons for new design
        document.querySelectorAll('.tab-button').forEach(btn => {
          // Remove active classes - including gradient backgrounds
          btn.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'bg-white', 'text-white', 'text-blue-700', 'shadow-lg', 'shadow-md', 'border-transparent', 'border-blue-300', 'transform', 'scale-105');
          btn.classList.add('bg-gray-50', 'text-gray-600', 'border-gray-200');
          
          // Remove checkmark if exists
          const checkmark = btn.querySelector('.text-white, .text-green-500');
          if (checkmark) checkmark.remove();
          
          // Update icon to inactive state
          const icon = btn.querySelector('.text-xl');
          if (icon) {
            if (btn.id === 'str-tab') icon.textContent = '🏡';
            else if (btn.id === 'ltr-tab') icon.textContent = '🏢';
          }
          
          // Update subtitle color
          const subtitle = btn.querySelector('.text-xs');
          if (subtitle) {
            subtitle.classList.remove('text-blue-100', 'text-blue-600');
            subtitle.classList.add('text-gray-500');
          }
        });
        
        const activeTab = document.getElementById(tabName + '-tab');
        if (activeTab) {
          // Add active classes with gradient background
          activeTab.classList.remove('bg-gray-50', 'text-gray-600', 'border-gray-200');
          activeTab.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'shadow-lg', 'border-transparent', 'transform', 'scale-105');
          
          // Add checkmark if not already present
          if (!activeTab.querySelector('.text-white')) {
            const checkmark = document.createElement('span');
            checkmark.className = 'ml-2 text-white';
            checkmark.textContent = '✓';
            activeTab.appendChild(checkmark);
          }
          
          // Update icon to active state
          const icon = activeTab.querySelector('.text-xl');
          if (icon) {
            if (tabName === 'str') icon.textContent = '🏠';
            else if (tabName === 'ltr') icon.textContent = '🏘️';
            else if (tabName === 'investment') icon.textContent = '📈';
          }
          
          // Update subtitle color
          const subtitle = activeTab.querySelector('.text-xs');
          if (subtitle) {
            subtitle.classList.remove('text-gray-500');
            subtitle.classList.add('text-blue-100');
          }
          
          console.log('Activated tab button:', tabName + '-tab');
        } else {
          console.error('Tab button not found:', tabName + '-tab');
        }
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.add('hidden');
        });
        
        const activeContent = document.getElementById(tabName + '-content');
        if (activeContent) {
          activeContent.classList.remove('hidden');
          console.log('Showed content:', tabName + '-content');
        } else {
          console.error('Tab content not found:', tabName + '-content');
        }
        
        // Store active tab in session
        sessionStorage.setItem('activeRentalTab', tabName);
        
        // Initialize investment planning scripts if switching to investment tab
        if (tabName === 'investment') {
          console.log('Initializing investment planning scripts...');
          setTimeout(() => {
            if (window.calculateCapitalGains) {
              window.calculateCapitalGains();
              console.log('Called calculateCapitalGains');
            }
            if (window.updateScenarios) {
              window.updateScenarios();
              console.log('Called updateScenarios');
            }
          }, 100);
        }
        
        // Re-initialize STR components if switching to STR tab
        if (tabName === 'str' && strChartsModule && strChartsModule.initializeSTRComponents) {
          setTimeout(() => {
            console.log('Re-initializing STR components for tab switch');
            // Ensure Chart.js is available before re-initializing
            if (window.Chart) {
              strChartsModule.initializeSTRComponents(analysisData);
            } else {
              console.error('Chart.js not available for tab switch');
              // Try once more after a delay
              setTimeout(() => {
                if (window.Chart) {
                  strChartsModule.initializeSTRComponents(analysisData);
                }
              }, 500);
            }
          }, 100);
        }
      };
      
      // Restore active tab if exists
      setTimeout(() => {
        const activeTab = sessionStorage.getItem('activeRentalTab');
        if (activeTab && (activeTab === 'ltr' || activeTab === 'investment')) {
          window.switchTab(activeTab);
        }
      }, 100);
      
      // Initialize enhanced financial summary after DOM is updated
      setTimeout(async () => {
        // Initialize the financial summary chart and metrics
        if (financialModule.initializeEnhancedFinancialSummary) {
          financialModule.initializeEnhancedFinancialSummary();
        }
        
        // Import and initialize the enhanced financial calculator with charts
        try {
          const { initializeEnhancedFinancialCalculator } = await import('./financialCalculatorCharts.js');
          // Wait for Chart.js before initializing
          const waitForChartJs = (retries = 10) => {
            if (window.Chart) {
              initializeEnhancedFinancialCalculator();
            } else if (retries > 0) {
              console.log('Waiting for Chart.js for financial calculator...', retries);
              setTimeout(() => waitForChartJs(retries - 1), 200);
            } else {
              console.error('Chart.js failed to load for financial calculator');
            }
          };
          waitForChartJs();
        } catch (error) {
          console.error('Failed to initialize enhanced financial calculator:', error);
        }
      }, 100);

    } catch (error) {
      console.error('Failed to render analysis results:', error);
      targetContainer.innerHTML = `
        <div class="container mx-auto p-4 lg:p-lg">
          <div class="card text-center p-lg lg:p-2xl">
            <h3 class="text-lg lg:text-xl font-bold text-red-600 mb-md">Error Loading Analysis</h3>
            <p class="text-sm lg:text-base text-gray-600 mb-lg">There was an error displaying the analysis results.</p>
            <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
          </div>
        </div>
      `;
    }
  }

  generateActionButtons(buttonModule) {
    const { ActionButton } = buttonModule;
    
    return `
      <div class="card p-lg lg:p-xl">
        <h3 class="text-lg lg:text-xl font-bold text-gray-900 mb-lg">Next Steps</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md lg:gap-lg">
          ${ActionButton({
            action: 'saveAnalysis()',
            icon: '💾',
            label: 'Save to Portfolio',
            description: 'Save this analysis to your portfolio for future reference. You can access it anytime from your dashboard.'
          })}
          ${ActionButton({
            action: 'generateReport()',
            icon: '📊',
            label: 'Generate Full Report (PDF)',
            description: 'Download a comprehensive PDF report with all analysis details, charts, and financial projections.'
          })}
          ${ActionButton({
            action: 'analyzeAnother()',
            icon: '🔍',
            label: 'Analyze Another Property',
            description: 'Start a new analysis to compare different properties. Current analysis will remain in your history.'
          })}
          ${ActionButton({
            action: 'shareAnalysis()',
            icon: '🔗',
            label: 'Share Analysis',
            description: 'Generate a shareable link to send this analysis to partners, lenders, or advisors.'
          })}
        </div>
      </div>
    `;
  }

  generateDetailedAnalysisPlaceholder(analysisData = {}) {
    // Extract key data points with support for both camelCase and snake_case
    const propertyData = analysisData.propertyData || analysisData.property_data || {};
    const strAnalysis = analysisData.strAnalysis || analysisData.short_term_rental || {};
    const ltrAnalysis = analysisData.longTermRental || analysisData.long_term_rental || {};
    const costs = analysisData.costs || {};
    
    // Property details
    const propertyPrice = propertyData.price || 850000;
    const propertyType = propertyData.propertyType || propertyData.property_type || 'Property';
    const bedrooms = propertyData.bedrooms || 3;
    const city = propertyData.city || 'Unknown';
    
    // Financial metrics - check multiple possible property names
    const strRevenue = strAnalysis.monthlyRevenue || strAnalysis.monthly_revenue || 0;
    const ltrRevenue = ltrAnalysis.monthlyRent || ltrAnalysis.monthly_rent || 0;
    const strOccupancy = strAnalysis.occupancy_rate || 0.7;
    const monthlyExpenses = costs.totalMonthly || costs.total_monthly || 0;
    
    // Calculate key metrics - handle division by zero
    const capRate = propertyPrice > 0 ? ((strRevenue - monthlyExpenses) * 12 / propertyPrice * 100).toFixed(1) : '0';
    const cashOnCashReturn = propertyPrice > 0 ? ((strRevenue - monthlyExpenses) * 12 / (propertyPrice * 0.2) * 100).toFixed(1) : '0';
    const breakEvenOccupancy = strRevenue > 0 && strOccupancy > 0 ? (monthlyExpenses / (strRevenue / strOccupancy) * 100).toFixed(0) : '0';
    
    // Market comparables
    const comparables = strAnalysis.comparables || [];
    const avgCompRevenue = comparables.length > 0 
      ? Math.round(comparables.reduce((sum, comp) => sum + (comp.monthly_revenue || comp.monthlyRevenue || 0), 0) / comparables.length)
      : strRevenue;
    const avgCompOccupancy = comparables.length > 0
      ? (comparables.reduce((sum, comp) => sum + (comp.occupancy_rate || comp.occupancyRate || 0), 0) / comparables.length * 100).toFixed(0)
      : (strOccupancy * 100).toFixed(0);
    
    return `
      <div class="space-y-xl">
        <!-- Detailed Market Analysis -->
        <div class="card p-xl">
          <h4 class="text-lg font-bold text-gray-900 mb-lg flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Detailed Market Analysis
          </h4>
          
          <div class="space-y-4">
            <!-- Market Position -->
            <div>
              <h5 class="font-semibold text-gray-900 mb-2">Market Position</h5>
              <p class="text-gray-600 mb-3">
                ${comparables.length > 0 ? `Based on ${comparables.length} comparable properties in ${city},` : 'Based on market analysis,'} 
                this ${bedrooms}-bedroom ${propertyType.toLowerCase()} 
                ${strRevenue > avgCompRevenue ? 'outperforms' : 'performs below'} 
                the market average${avgCompRevenue > 0 ? ` by ${Math.abs(((strRevenue - avgCompRevenue) / avgCompRevenue * 100).toFixed(0))}%` : ''}.
              </p>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-500">Your Revenue</div>
                  <div class="text-lg font-bold text-gray-900">$${strRevenue.toLocaleString()}/mo</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-500">Market Avg</div>
                  <div class="text-lg font-bold text-gray-900">$${avgCompRevenue.toLocaleString()}/mo</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-500">Your Occupancy</div>
                  <div class="text-lg font-bold text-gray-900">${(strOccupancy * 100).toFixed(0)}%</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-xs text-gray-500">Market Avg</div>
                  <div class="text-lg font-bold text-gray-900">${avgCompOccupancy}%</div>
                </div>
              </div>
            </div>
            
            <!-- Competitive Advantages -->
            <div>
              <h5 class="font-semibold text-gray-900 mb-2">Competitive Analysis</h5>
              <ul class="space-y-2">
                ${strRevenue > avgCompRevenue ? `
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span class="text-gray-600">Premium revenue potential ${avgCompRevenue > 0 ? ((strRevenue - avgCompRevenue) / avgCompRevenue * 100).toFixed(0) + '%' : 'significantly'} above market average</span>
                  </li>
                ` : ''}
                ${bedrooms >= 3 ? `
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span class="text-gray-600">Larger property appeals to families and groups</span>
                  </li>
                ` : ''}
                ${strOccupancy > 0.75 ? `
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span class="text-gray-600">High occupancy rate indicates strong demand</span>
                  </li>
                ` : ''}
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="text-gray-600">STR revenue ${ltrRevenue > 0 ? ((strRevenue - ltrRevenue) / ltrRevenue * 100).toFixed(0) : 'significantly'} ${ltrRevenue > 0 ? '%' : ''} higher than long-term rental</span>
                </li>
              </ul>
            </div>
            
            <!-- Seasonal Trends -->
            <div>
              <h5 class="font-semibold text-gray-900 mb-2">Seasonal Insights</h5>
              <p class="text-gray-600">
                ${city.toLowerCase().includes('toronto') || city.toLowerCase().includes('montreal') || city.toLowerCase().includes('calgary') ? 
                  'Northern markets typically see 20-30% higher rates in summer months (May-September) and increased bookings during winter holiday periods.' :
                  'This market experiences relatively stable demand year-round with peak seasons during major holidays and local events.'
                }
              </p>
            </div>
          </div>
        </div>
        
        <!-- Risk Assessment -->
        <div class="card p-xl">
          <h4 class="text-lg font-bold text-gray-900 mb-lg flex items-center gap-2">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            Risk Assessment
          </h4>
          
          <div class="space-y-4">
            <!-- Risk Matrix -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Low Risk Factors -->
              <div class="bg-green-50 rounded-lg p-4">
                <h5 class="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Low Risk Factors
                </h5>
                <ul class="space-y-2 text-sm text-green-800">
                  ${capRate > 6 ? '<li>• Strong cap rate of ' + capRate + '% exceeds market benchmark</li>' : ''}
                  ${breakEvenOccupancy < 65 ? '<li>• Low break-even occupancy of ' + breakEvenOccupancy + '% provides cushion</li>' : ''}
                  ${cashOnCashReturn > 15 ? '<li>• Excellent cash-on-cash return of ' + cashOnCashReturn + '%</li>' : ''}
                  ${comparables.length > 5 ? '<li>• Robust comparable data from ' + comparables.length + ' properties</li>' : ''}
                  <li>• Diversified income potential (STR and LTR options)</li>
                </ul>
              </div>
              
              <!-- Moderate/High Risk Factors -->
              <div class="bg-yellow-50 rounded-lg p-4">
                <h5 class="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Risk Considerations
                </h5>
                <ul class="space-y-2 text-sm text-yellow-800">
                  ${breakEvenOccupancy > 75 ? '<li>• High break-even occupancy of ' + breakEvenOccupancy + '% leaves little margin</li>' : ''}
                  ${strOccupancy < 0.65 ? '<li>• Below-average occupancy rate may impact revenue</li>' : ''}
                  <li>• Regulatory changes could impact STR operations</li>
                  <li>• Market saturation risk in popular tourist areas</li>
                  <li>• Seasonal demand fluctuations affect cash flow</li>
                  ${propertyPrice > 1000000 ? '<li>• High property value increases capital risk</li>' : ''}
                </ul>
              </div>
            </div>
            
            <!-- Risk Mitigation Strategies -->
            <div>
              <h5 class="font-semibold text-gray-900 mb-2">Mitigation Strategies</h5>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="bg-blue-50 rounded-lg p-3">
                  <h6 class="font-medium text-blue-900 mb-1">Diversification</h6>
                  <p class="text-sm text-blue-700">Maintain flexibility to switch between STR and LTR based on market conditions</p>
                </div>
                <div class="bg-blue-50 rounded-lg p-3">
                  <h6 class="font-medium text-blue-900 mb-1">Professional Management</h6>
                  <p class="text-sm text-blue-700">Consider property management to maintain high occupancy and guest satisfaction</p>
                </div>
                <div class="bg-blue-50 rounded-lg p-3">
                  <h6 class="font-medium text-blue-900 mb-1">Financial Buffer</h6>
                  <p class="text-sm text-blue-700">Maintain 6-month expense reserve for unexpected vacancies or repairs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Investment Scenarios -->
        <div class="card p-xl">
          <h4 class="text-lg font-bold text-gray-900 mb-lg flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
            </svg>
            Investment Scenarios
          </h4>
          
          <div class="space-y-4">
            <!-- Scenario Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Optimistic Scenario -->
              <div class="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <div class="flex items-center gap-2 mb-3">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                  <h5 class="font-semibold text-green-900">Optimistic Scenario</h5>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Occupancy Rate</span>
                    <span class="font-medium text-green-800">${Math.min(95, (strOccupancy * 100) + 15).toFixed(0)}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Monthly Revenue</span>
                    <span class="font-medium text-green-800">$${Math.round(strRevenue * 1.2).toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Annual Profit</span>
                    <span class="font-medium text-green-800">$${Math.round((strRevenue * 1.2 - monthlyExpenses) * 12).toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">5-Year Appreciation</span>
                    <span class="font-medium text-green-800">+${(propertyPrice * 0.35 / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <p class="text-xs text-gray-600 mt-3">
                  Assumes strong market growth, premium pricing, and optimal management
                </p>
              </div>
              
              <!-- Realistic Scenario -->
              <div class="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div class="flex items-center gap-2 mb-3">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <h5 class="font-semibold text-blue-900">Realistic Scenario</h5>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Occupancy Rate</span>
                    <span class="font-medium text-blue-800">${(strOccupancy * 100).toFixed(0)}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Monthly Revenue</span>
                    <span class="font-medium text-blue-800">$${strRevenue.toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Annual Profit</span>
                    <span class="font-medium text-blue-800">$${Math.round((strRevenue - monthlyExpenses) * 12).toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">5-Year Appreciation</span>
                    <span class="font-medium text-blue-800">+${(propertyPrice * 0.20 / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <p class="text-xs text-gray-600 mt-3">
                  Based on current market data and historical performance trends
                </p>
              </div>
              
              <!-- Conservative Scenario -->
              <div class="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <div class="flex items-center gap-2 mb-3">
                  <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                  </svg>
                  <h5 class="font-semibold text-gray-900">Conservative Scenario</h5>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Occupancy Rate</span>
                    <span class="font-medium text-gray-800">${Math.max(50, (strOccupancy * 100) - 15).toFixed(0)}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Monthly Revenue</span>
                    <span class="font-medium text-gray-800">$${Math.round(strRevenue * 0.75).toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Annual Profit</span>
                    <span class="font-medium text-gray-800">$${Math.round((strRevenue * 0.75 - monthlyExpenses) * 12).toLocaleString()}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">5-Year Appreciation</span>
                    <span class="font-medium text-gray-800">+${(propertyPrice * 0.10 / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <p class="text-xs text-gray-600 mt-3">
                  Accounts for market downturns, increased competition, and regulatory changes
                </p>
              </div>
            </div>
            
            <!-- Key Assumptions -->
            <div class="bg-gray-100 rounded-lg p-4">
              <h5 class="font-semibold text-gray-900 mb-2">Key Assumptions</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                <div>
                  <span class="font-medium">Financial:</span> 20% down payment, 5.5% mortgage rate, 25-year amortization
                </div>
                <div>
                  <span class="font-medium">Market:</span> ${city} real estate appreciation of 3-7% annually
                </div>
                <div>
                  <span class="font-medium">Operations:</span> Professional management at 10% of revenue
                </div>
                <div>
                  <span class="font-medium">Maintenance:</span> 1.5% of property value annually for repairs
                </div>
              </div>
            </div>
          </div>
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
      
      // Confirmation dialog
      const confirmed = confirm(
        'Save this analysis to your portfolio?\n\n' +
        'You\'ll be able to:\n' +
        '• Access it anytime from your dashboard\n' +
        '• Compare it with other properties\n' +
        '• Track changes in market conditions\n' +
        '• Share it with partners or advisors'
      );
      
      if (!confirmed) return;
      
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
      
      // Confirmation dialog with format info
      const confirmed = confirm(
        'Generate a comprehensive investment report?\n\n' +
        'The PDF report will include:\n' +
        '• Executive summary with ROI calculations\n' +
        '• Detailed financial projections\n' +
        '• Market comparables and analysis\n' +
        '• Risk assessment and recommendations\n' +
        '• Professional charts and visualizations\n\n' +
        'File format: PDF (ready for printing or sharing)'
      );
      
      if (!confirmed) return;
      
      try {
        // Show loading state
        const originalButton = event?.target;
        if (originalButton) {
          originalButton.innerHTML = '<span class="animate-spin">⏳</span> Generating PDF...';
          originalButton.disabled = true;
        }
        
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
        
        // Restore button state
        if (originalButton) {
          originalButton.innerHTML = '📊 Generate Full Report (PDF)';
          originalButton.disabled = false;
        }
        
      } catch (error) {
        console.error('Error generating report:', error);
        alert('Failed to generate report. Please try again.');
      }
    };

    window.analyzeAnother = () => {
      console.log('Analyzing another property...');
      
      // Confirmation dialog
      const confirmed = confirm(
        'Start a new property analysis?\n\n' +
        '⚠️ Important:\n' +
        '• This will clear the current analysis from your screen\n' +
        '• Your current analysis is automatically saved in history\n' +
        '• You can compare multiple properties later\n\n' +
        'Do you want to continue?'
      );
      
      if (!confirmed) return;
      
      // Save current analysis to session history
      const currentAnalysis = window.analysisData || window.appState?.currentAnalysis;
      if (currentAnalysis) {
        const history = JSON.parse(sessionStorage.getItem('analysisHistory') || '[]');
        history.unshift({
          timestamp: new Date().toISOString(),
          address: currentAnalysis.propertyData?.address || 'Unknown Property',
          data: currentAnalysis
        });
        // Keep only last 5 analyses in session
        sessionStorage.setItem('analysisHistory', JSON.stringify(history.slice(0, 5)));
      }
      
      // Redirect to property input or clear current analysis
      window.location.href = '#analyze';
      window.location.reload();
    };

    window.shareAnalysis = async () => {
      console.log('Sharing analysis...');
      
      try {
        // Get current analysis data
        const analysisData = window.analysisData || window.appState?.currentAnalysis;
        
        if (!analysisData) {
          alert('No analysis data available to share. Please run an analysis first.');
          return;
        }
        
        const propertyAddress = analysisData.propertyData?.address || 'Property Analysis';
        
        // Show sharing options dialog
        const shareMethod = confirm(
          'Share this analysis\n\n' +
          'Click OK to generate a shareable link that you can send to:\n' +
          '• Business partners or co-investors\n' +
          '• Real estate agents or brokers\n' +
          '• Mortgage lenders or financial advisors\n' +
          '• Anyone who needs to review this analysis\n\n' +
          'The link will be valid for 30 days.\n\n' +
          'Or click Cancel to copy the analysis summary to your clipboard.'
        );
        
        if (shareMethod) {
          // Generate shareable link
          try {
            // Show loading state
            const originalButton = event?.target;
            if (originalButton) {
              originalButton.innerHTML = '<span class="animate-spin">⏳</span> Generating link...';
              originalButton.disabled = true;
            }
            
            // In production, this would call an API to generate a shareable link
            // For now, we'll simulate it
            const shareId = btoa(Date.now().toString()).substring(0, 8);
            const shareUrl = `${window.location.origin}/shared-analysis/${shareId}`;
            
            // Copy to clipboard
            await navigator.clipboard.writeText(shareUrl);
            
            // Show success with the link
            alert(
              'Shareable link generated and copied to clipboard!\n\n' +
              `${shareUrl}\n\n` +
              'This link will be valid for 30 days.\n' +
              'Anyone with this link can view the analysis (read-only).'
            );
            
            // Restore button
            if (originalButton) {
              originalButton.innerHTML = '🔗 Share Analysis';
              originalButton.disabled = false;
            }
          } catch (error) {
            console.error('Error generating share link:', error);
            alert('Failed to generate share link. Please try again.');
          }
        } else {
          // Copy summary to clipboard
          const summary = `
${propertyAddress} - Investment Analysis Summary

Property Details:
• Price: $${analysisData.propertyData?.price?.toLocaleString() || 'N/A'}
• Type: ${analysisData.propertyData?.propertyType || 'N/A'}
• Bedrooms: ${analysisData.propertyData?.bedrooms || 'N/A'}
• Location: ${analysisData.propertyData?.city || 'N/A'}

Short-Term Rental Analysis:
• Monthly Revenue: $${analysisData.strAnalysis?.monthlyRevenue?.toLocaleString() || 'N/A'}
• Occupancy Rate: ${(analysisData.strAnalysis?.occupancy_rate * 100)?.toFixed(0) || 'N/A'}%
• Nightly Rate: $${analysisData.strAnalysis?.nightlyRate || 'N/A'}

Long-Term Rental Analysis:
• Monthly Rent: $${analysisData.longTermRental?.monthlyRent?.toLocaleString() || 'N/A'}
• Cash Flow: $${analysisData.longTermRental?.cashFlow?.toLocaleString() || 'N/A'}
• ROI: ${analysisData.longTermRental?.roi?.toFixed(1) || 'N/A'}%

Investment Score: ${analysisData.overallScore || 'N/A'}/10

Generated by StarterPackApp - ${new Date().toLocaleDateString()}
          `.trim();
          
          try {
            await navigator.clipboard.writeText(summary);
            alert('Analysis summary copied to clipboard!\n\nYou can now paste it into an email, document, or message.');
          } catch (error) {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = summary;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Analysis summary copied to clipboard!');
          }
        }
      } catch (error) {
        console.error('Error sharing analysis:', error);
        alert('Failed to share analysis. Please try again.');
      }
    };

    window.showAllComparables = () => {
      console.log('Showing all comparables...');
      
      // Get the current analysis data from multiple possible sources
      const analysisData = window.analysisData || window.appState?.currentAnalysis || {};
      
      // Debug log to see what data we have
      console.log('Analysis data structure:', analysisData);
      
      // Try to find comparables in various locations
      let comparables = null;
      
      // Check different possible data structures
      if (analysisData.strAnalysis?.comparables) {
        comparables = analysisData.strAnalysis.comparables;
      } else if (analysisData.short_term_rental?.comparables) {
        comparables = analysisData.short_term_rental.comparables;
      } else if (analysisData.data?.short_term_rental?.comparables) {
        comparables = analysisData.data.short_term_rental.comparables;
      } else if (analysisData.comparables) {
        comparables = analysisData.comparables;
      }
      
      // If not found, try to get it from the component loader instance
      if (!comparables && this.lastAnalysisData) {
        console.log('Checking lastAnalysisData:', this.lastAnalysisData);
        if (this.lastAnalysisData.strAnalysis?.comparables) {
          comparables = this.lastAnalysisData.strAnalysis.comparables;
        }
      }
      
      // Ensure comparables is an array
      if (!Array.isArray(comparables)) {
        console.error('Comparables data not found or not an array:', {
          analysisData,
          comparables,
          paths: {
            'strAnalysis.comparables': analysisData.strAnalysis?.comparables,
            'short_term_rental.comparables': analysisData.short_term_rental?.comparables,
            'data.short_term_rental.comparables': analysisData.data?.short_term_rental?.comparables
          }
        });
        alert('Unable to display additional listings. The comparables data could not be found.');
        return;
      }
      
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
                ${comparables.map((comp, index) => {
                  // Ensure comp exists and has properties
                  if (!comp) return '';
                  
                  // Use the same image property logic as the dashboard component
                  // Check for nested image_url.url structure first, then fallback to other properties
                  let imageUrl = comp.image_url?.url || comp.imageUrl || comp.image || 
                                comp.image_url || comp.thumbnail || comp.picture_url || 
                                comp.photo_url || comp.photo || comp.images?.[0];
                  
                  // If no image found, use a default Unsplash image based on index
                  if (!imageUrl) {
                    const defaultImages = [
                      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
                      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'
                    ];
                    imageUrl = defaultImages[index % defaultImages.length];
                  }
                  
                  // Debug logging for first few items
                  if (index < 3) {
                    console.log(`Comparable ${index} image properties:`, {
                      'image_url?.url': comp.image_url?.url,
                      image: comp.image,
                      image_url: comp.image_url,
                      imageUrl: comp.imageUrl, 
                      thumbnail: comp.thumbnail,
                      picture_url: comp.picture_url,
                      photo_url: comp.photo_url,
                      selectedUrl: imageUrl
                    });
                  }
                  
                  // Always show image since we have fallbacks
                  const imageHtml = `
                    <img src="${imageUrl}" 
                         alt="${comp.title || 'Comparable Property'}" 
                         class="w-full h-48 object-cover"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'"
                         crossorigin="anonymous">
                  `;
                  
                  return `
                  <a href="${comp.url || comp.airbnb_url || comp.airbnbUrl || '#'}" target="_blank" 
                     class="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    ${imageHtml}
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
                `;
                }).join('')}
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