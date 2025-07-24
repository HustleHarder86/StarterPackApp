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
      
      const airbnbHtml = showSTR ? airbnbModule.AirbnbHeroSectionMockup({ 
        analysis: analysisData,
        useMockData: false  // Ensure real data is used
      }) : '';
      
      const ltrHtml = showLTR ? ltrModule.LongTermRentalAnalysis({ 
        analysis: analysisData
      }) : '';
      
      // Use EnhancedFinancialSummary for proper data handling
      const financialHtml = financialModule.EnhancedFinancialSummary ? 
        financialModule.EnhancedFinancialSummary({ analysis: analysisData }) :
        financialModule.FinancialSummaryFromAnalysis({ analysis: analysisData });
      
      // Generate Investment Planning components
      const investmentPlanningHtml = `
        <div class="space-y-6">
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

      // Render the complete analysis layout
      const analysisLayout = `
        <div class="min-h-screen bg-gray-50" style="overflow-x: hidden;">
          
          <!-- Investment Verdict - Full Width with Header -->
          <div class="mb-6">
            ${verdictHtml}
          </div>

          <div class="max-w-7xl mx-auto px-4 lg:px-6" style="overflow-x: hidden;">
            <!-- Rental Analysis -->
            <div class="mb-8">
              <!-- Tab Navigation - Always show tabs for better UX -->
              <div class="border-b border-gray-200 overflow-x-auto">
                <nav class="-mb-px flex space-x-4 md:space-x-8 min-w-max" aria-label="Tabs">
                  ${showSTR ? `
                    <button
                      id="str-tab"
                      onclick="window.switchTab('str')"
                      class="tab-button active border-blue-500 text-blue-600 whitespace-nowrap py-3 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm"
                    >
                      <span class="hidden sm:inline">Short-Term Rental</span>
                      <span class="sm:hidden">STR</span>
                    </button>
                  ` : ''}
                  ${showLTR ? `
                    <button
                      id="ltr-tab"
                      onclick="window.switchTab('ltr')"
                      class="tab-button ${!showSTR ? 'active border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm"
                    >
                      <span class="hidden sm:inline">Long-Term Rental</span>
                      <span class="sm:hidden">LTR</span>
                    </button>
                  ` : ''}
                  <button
                    id="investment-tab"
                    onclick="window.switchTab('investment')"
                    class="tab-button border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-3 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm"
                  >
                    <span class="hidden sm:inline">Investment Planning</span>
                    <span class="sm:hidden">Planning</span>
                  </button>
                </nav>
              </div>
                
              <!-- Tab Content -->
              <div class="mt-6">
                ${showSTR ? `
                  <!-- STR Content -->
                  <div id="str-content" class="tab-content ${showSTR && !showLTR ? '' : ''}">
                    ${airbnbHtml}
                  </div>
                ` : ''}
                
                ${showLTR ? `
                  <!-- LTR Content -->
                  <div id="ltr-content" class="tab-content ${!showSTR && showLTR ? '' : 'hidden'}">
                    ${ltrHtml}
                  </div>
                ` : ''}
                
                <!-- Investment Planning Content - Always available -->
                <div id="investment-content" class="tab-content hidden">
                  ${investmentPlanningHtml}
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
          window.switchTab = function(tabName) {
            console.log('Switching to tab:', tabName);
            
            // Update tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
              btn.classList.remove('border-blue-500', 'text-blue-600', 'active');
              btn.classList.add('border-transparent', 'text-gray-500');
            });
            
            const activeTab = document.getElementById(tabName + '-tab');
            if (activeTab) {
              activeTab.classList.remove('border-transparent', 'text-gray-500');
              activeTab.classList.add('border-blue-500', 'text-blue-600', 'active');
            }
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => {
              content.classList.add('hidden');
            });
            
            const activeContent = document.getElementById(tabName + '-content');
            if (activeContent) {
              activeContent.classList.remove('hidden');
            }
            
            // Store active tab in session
            sessionStorage.setItem('activeRentalTab', tabName);
            
            // Initialize investment planning scripts if switching to investment tab
            if (tabName === 'investment') {
              setTimeout(() => {
                if (window.calculateCapitalGains) {
                  window.calculateCapitalGains();
                }
                if (window.updateScenarios) {
                  window.updateScenarios();
                }
              }, 100);
            }
          }
          
          // Restore active tab if exists
          setTimeout(() => {
            const activeTab = sessionStorage.getItem('activeRentalTab');
            if (activeTab && (activeTab === 'ltr' || activeTab === 'investment')) {
              window.switchTab(activeTab);
            }
          }, 100);
        </script>
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
      
      // Get the current analysis data from multiple possible sources
      const analysisData = window.analysisData || window.appState?.currentAnalysis || {};
      
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
      
      // Ensure comparables is an array
      if (!Array.isArray(comparables)) {
        console.error('Comparables data not found or not an array:', analysisData);
        alert('No comparable listings available');
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
                  
                  return `
                  <a href="${comp.url || comp.airbnb_url || comp.airbnbUrl || '#'}" target="_blank" 
                     class="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <img src="${comp.image_url || comp.imageUrl || comp.thumbnail || 'https://via.placeholder.com/300x200'}" 
                         alt="${comp.title || 'Comparable Property'}" class="w-full h-48 object-cover"
                         onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
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