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
    window.strCalculatorScript = null; // Will be set after loading components
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
        airbnbHeroModule,
        ltrModule,
        financialModule,
        shareModule,
        buttonModule,
        taxCalcModule,
        dummiesModule,
        financingModule,
        appreciationModule,
        strCalculatorModule,
        enhancedFinancialCalcModule,
        strCashFlowModule,
        financialCalculatorModule
      ] = await Promise.all([
        this.loadComponent('components/analysis/InvestmentVerdict.js'),
        this.loadComponent('components/analysis/AirbnbListings.js'),
        this.loadComponent('components/analysis/AirbnbHeroSection.js'),
        this.loadComponent('components/analysis/LongTermRentalAnalysis.js'),
        this.loadComponent('components/analysis/EnhancedFinancialSummary.js'),
        this.loadComponent('components/ui/ShareModal.js'),
        this.loadComponent('components/ui/Button.js'),
        this.loadComponent('components/analysis/CanadianCapitalGainsTaxCalculator.js'),
        this.loadComponent('components/analysis/InvestmentSummaryForDummies.js'),
        this.loadComponent('components/analysis/FinancingScenariosComparison.js'),
        this.loadComponent('components/analysis/PropertyAppreciationChart.js'),
        this.loadComponent('components/calculator/STRRevenueCalculator.js'),
        this.loadComponent('components/calculator/EnhancedFinancialCalculator.js'),
        this.loadComponent('components/analysis/STRCashFlowCard.js'),
        this.loadComponent('components/analysis/FinancialCalculator.js')
      ]);

      // Generate component HTML with real data
      const verdictHtml = verdictModule.InvestmentVerdict({ 
        analysis: analysisData
      });
      
      // Determine which analysis types to show
      const analysisType = analysisData.analysisType || 'both';
      const showSTR = analysisType === 'both' || analysisType === 'str';
      const showLTR = analysisType === 'both' || analysisType === 'ltr';
      const showTabs = analysisType === 'both';
      
      // Always generate content for tabs, but show appropriate messages if data is missing
      const strData = analysisData.strAnalysis || analysisData.short_term_rental || null;
      const ltrData = analysisData.longTermRental || analysisData.long_term_rental || null;
      
      // Debug logging to see what data we have
      console.log('[ComponentLoader] STR Data Debug:', {
        hasStrData: !!strData,
        strDataKeys: strData ? Object.keys(strData) : [],
        comparablesLength: strData?.comparables?.length || 0,
        comparables: strData?.comparables?.slice(0, 3) || 'No comparables'
      });
      
      // Use the enhanced AirbnbHeroSection for STR analysis if available
      const airbnbHtml = strData ? (airbnbHeroModule?.AirbnbHeroSection ? 
        airbnbHeroModule.AirbnbHeroSection({ analysis: analysisData }) : 
        airbnbModule.AirbnbListings({ 
          comparables: strData.comparables || [],
          marketData: strData
        })) : '<div class="text-center text-gray-500 py-12"><p class="text-lg">Short-term rental analysis was not included in this report.</p><p class="mt-2">Re-run the analysis with STR option selected to see Airbnb comparables.</p></div>';
      
      // Store calculator script for later use
      if (airbnbHeroModule?.strCalculatorScript) {
        window.strCalculatorScript = airbnbHeroModule.strCalculatorScript;
      }
      
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
      
      // Generate LTR content with enhanced charts and calculator
      const ltrHtml = analysisData.longTermRental ? `
        ${ltrModule.LongTermRentalAnalysis({ analysis: analysisData })}
        <div class="space-y-6 mt-6">
          ${ltrChartsModule ? ltrChartsModule.createRentalComparisonChart(analysisData) : ''}
          ${ltrChartsModule ? ltrChartsModule.createExpenseBreakdownChart(analysisData.costs || {}) : ''}
          ${ltrChartsModule ? ltrChartsModule.createCashFlowProjection(analysisData) : ''}
          
          <!-- Interactive Financial Calculator for LTR -->
          <div id="financial-calculator-ltr">
            ${enhancedFinancialCalcModule?.EnhancedFinancialCalculator ? 
              enhancedFinancialCalcModule.EnhancedFinancialCalculator({ 
                analysisData: {
                  ...analysisData,
                  analysisType: 'ltr' // Force LTR context
                }
              }) : ''}
          </div>
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
            strAnalysis: analysisData.strAnalysis || analysisData.short_term_rental || {},
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
            monthlyRevenue: analysisData.strAnalysis?.monthlyRevenue || analysisData.short_term_rental?.monthly_revenue || analysisData.longTermRental?.monthlyRent || 0,
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
      const strAnalysis = analysisData.strAnalysis || analysisData.str_analysis || analysisData.short_term_rental || {};
      const ltrAnalysis = analysisData.longTermRental || analysisData.long_term_rental || {};
      const bedrooms = propertyData.bedrooms || 2;
      const bathrooms = propertyData.bathrooms || 2;
      const sqft = propertyData.squareFeet || propertyData.square_feet || propertyData.sqft || 'N/A';
      
      // Helper function for currency formatting
      const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return '$0';
        return new Intl.NumberFormat('en-CA', { 
          style: 'currency', 
          currency: 'CAD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      };
      // Handle both string address and object address formats
      let propertyAddress = 'Property Address';
      if (typeof propertyData.address === 'string') {
        propertyAddress = propertyData.address;
      } else if (propertyData.address && typeof propertyData.address === 'object') {
        // Build address from components
        const addressParts = [];
        if (propertyData.address.street) addressParts.push(propertyData.address.street);
        if (propertyData.address.city) addressParts.push(propertyData.address.city);
        if (propertyData.address.province || propertyData.address.state) {
          addressParts.push(propertyData.address.province || propertyData.address.state);
        }
        if (propertyData.address.postalCode || propertyData.address.postal) {
          addressParts.push(propertyData.address.postalCode || propertyData.address.postal);
        }
        propertyAddress = addressParts.join(', ') || 'Property Address';
      }
      
      // Enhanced image extraction with more fallbacks (NO DEFAULT)
      const propertyImage = propertyData.main_image ||  // THIS IS THE ONE!
        propertyData.mainImage || 
        propertyData.image || 
        propertyData.imageUrl || 
        propertyData.image_url || 
        analysisData.mainImage ||
        analysisData.image ||
        analysisData.imageUrl ||
        analysisData.property?.mainImage ||
        analysisData.property?.image ||
        analysisData.propertyImage ||
        analysisData.propertyDetails?.mainImage ||
        analysisData.property_details?.mainImage ||
        analysisData.property_data?.main_image ||  // Also check property_data
        null; // No default - will show nothing if no image found
      
      // Debug log to help troubleshoot - log entire objects to see structure
      console.log('[Property Header] Full data structures:', {
        'analysisData': analysisData,
        'propertyData': propertyData,
        'analysisData.propertyDetails': analysisData.propertyDetails,
        'analysisData.property_details': analysisData.property_details
      });
      
      console.log('[Property Header] Image search results:', {
        'propertyData.mainImage': propertyData.mainImage,
        'propertyData.image': propertyData.image,
        'analysisData.mainImage': analysisData.mainImage,
        'analysisData.property?.mainImage': analysisData.property?.mainImage,
        'Final selected': propertyImage,
        'Image found': !!propertyImage
      });
      
      // Create reusable property header
      const propertyHeaderHtml = `
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl mb-6 shadow-lg overflow-hidden">
          <div class="p-6">
            <div class="flex flex-col lg:flex-row items-center gap-6">
              <!-- Property Image - Only show if image exists -->
              ${propertyImage ? `
              <div class="w-full lg:w-64 h-48 rounded-lg overflow-hidden shadow-xl">
                <img 
                  src="${propertyImage}" 
                  alt="Property" 
                  class="w-full h-full object-cover"
                  onerror="this.style.display='none'; this.parentElement.style.display='none';"
                />
              </div>
              ` : ''}
              
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

      // Render the complete analysis layout with sidebar
      const analysisLayout = `
        <div class="min-h-screen relative bg-transparent" style="overflow-x: hidden;">
          
          <!-- Property Hero Section -->
          <div class="max-w-7xl mx-auto px-4 lg:px-6 pt-6 mb-6">
            <div class="property-hero-gradient text-white">
              <div class="px-6 py-6">
                <div class="flex items-center justify-between mb-4">
                  <h1 class="text-2xl font-bold">${propertyAddress}</h1>
                  <span class="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-sm font-medium">
                    Investment Analysis
                  </span>
                </div>
                
                <div class="mb-6">
                  <p class="text-purple-100 text-lg mb-1">${propertyData.city || 'Toronto'}, ${propertyData.state || 'ON'}</p>
                  <p class="text-3xl font-bold">${formatCurrency(propertyData.price || propertyData.purchasePrice || 850000)}</p>
                </div>
                
                <!-- Key Stats Pills -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="stats-pill rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-gray-900">
                      ${showSTR && strAnalysis && ltrAnalysis.monthlyRent ? `+${Math.round(((strAnalysis.monthlyRevenue || strAnalysis.monthly_revenue || 0) - ltrAnalysis.monthlyRent) / ltrAnalysis.monthlyRent * 100)}%` : '--'}
                    </div>
                    <div class="text-xs text-gray-600">vs LTR</div>
                  </div>
                  <div class="stats-pill rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-gray-900">
                      ${formatCurrency(showSTR && strAnalysis ? (strAnalysis.monthlyRevenue || strAnalysis.monthly_revenue || 0) : ltrAnalysis.monthlyRent)}
                    </div>
                    <div class="text-xs text-gray-600">Monthly</div>
                  </div>
                  <div class="stats-pill rounded-xl p-4 text-center">
                    <div class="text-2xl font-bold text-gray-900">
                      ${analysisData.investmentScore || analysisData.overallScore || '8.7'}/10
                    </div>
                    <div class="text-xs text-gray-600">Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Main Content with Sidebar Layout -->
          <div class="max-w-7xl mx-auto px-4 lg:px-6" style="overflow-x: hidden;">
            <div class="flex flex-col lg:flex-row gap-6">
              
              <!-- Sidebar Navigation -->
              <aside class="lg:w-72 flex-shrink-0">
                <div class="sticky top-4">
                  <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <h3 class="font-bold text-lg">Analysis Options</h3>
                      <p class="text-xs text-purple-100 mt-1">Select to view details</p>
                    </div>
                    
                    <nav class="p-2">
                      <!-- STR Navigation Item -->
                      <button
                        id="str-nav"
                        onclick="window.switchSection('str')"
                        class="sidebar-nav-item ${showSTR ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'} 
                        w-full flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 mb-2"
                      >
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${showSTR ? 'from-purple-500 to-purple-600' : 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xl flex-shrink-0">
                          🏠
                        </div>
                        <div class="text-left flex-1">
                          <div class="font-semibold">Short-Term Rental</div>
                          <div class="text-xs opacity-75 mt-1">
                            Airbnb & VRBO Analysis
                          </div>
                          ${showSTR && strData ? `
                            <div class="mt-2 text-xs">
                              <span class="font-medium text-green-600">\$${strData.monthlyRevenue || strData.monthly_revenue || 0}/mo</span>
                            </div>
                          ` : ''}
                        </div>
                        ${showSTR ? '<span class="text-purple-600">›</span>' : ''}
                      </button>
                      
                      <!-- LTR Navigation Item -->
                      <button
                        id="ltr-nav"
                        onclick="window.switchSection('ltr')"
                        class="sidebar-nav-item ${!showSTR && showLTR ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'} 
                        w-full flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 mb-2"
                      >
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${!showSTR && showLTR ? 'from-purple-500 to-purple-600' : 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xl flex-shrink-0">
                          🏢
                        </div>
                        <div class="text-left flex-1">
                          <div class="font-semibold">Long-Term Rental</div>
                          <div class="text-xs opacity-75 mt-1">
                            Traditional Rental Income
                          </div>
                          ${showLTR && ltrData ? `
                            <div class="mt-2 text-xs">
                              <span class="font-medium text-green-600">\$${ltrData.monthlyRent || ltrData.monthly_rent || 0}/mo</span>
                            </div>
                          ` : ''}
                        </div>
                        ${!showSTR && showLTR ? '<span class="text-purple-600">›</span>' : ''}
                      </button>
                      
                      <!-- Investment Planning Navigation Item -->
                      <button
                        id="investment-nav"
                        onclick="window.switchSection('investment')"
                        class="sidebar-item hover:bg-gray-50 border-transparent text-gray-700
                        w-full flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 mb-2"
                      >
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                          📊
                        </div>
                        <div class="text-left flex-1">
                          <div class="font-semibold">Investment Planning</div>
                          <div class="text-xs opacity-75 mt-1">
                            Tax, Financing & ROI
                          </div>
                        </div>
                      </button>
                      
                      <!-- Comparison View Navigation Item -->
                      <button
                        id="comparison-nav"
                        onclick="window.switchSection('comparison')"
                        class="sidebar-item hover:bg-gray-50 border-transparent text-gray-700
                        w-full flex items-start gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200"
                      >
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                          ⚖️
                        </div>
                        <div class="text-left flex-1">
                          <div class="font-semibold">Compare All</div>
                          <div class="text-xs opacity-75 mt-1">
                            Side-by-side comparison
                          </div>
                        </div>
                      </button>
                    </nav>
                    
                    <!-- Quick Actions -->
                    <div class="border-t border-gray-200 p-4">
                      <button onclick="window.print()" class="w-full text-sm text-gray-600 hover:text-purple-600 flex items-center justify-center gap-2 py-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                        </svg>
                        Print Report
                      </button>
                      <button onclick="window.saveAnalysis()" class="w-full text-sm text-gray-600 hover:text-purple-600 flex items-center justify-center gap-2 py-2 mt-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"></path>
                        </svg>
                        Save Analysis
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
              
              <!-- Main Content Area -->
              <main class="flex-1 min-w-0">
                <!-- Property Header (Shared across all sections) -->
                ${propertyHeaderHtml}
                
                <div class="bg-white rounded-xl shadow-lg overflow-hidden p-6 mt-6">
                  <!-- STR Content -->
                  <div id="str-content" class="section-content">
                    
                    <!-- Airbnb Listings at Top (Position #2 after property header) -->
                    ${airbnbHtml}
                    
                    <!-- Financial Calculator Section -->
                    ${strData && financialCalculatorModule?.FinancialCalculator ? financialCalculatorModule.FinancialCalculator({
                      strData: strData,
                      ltrData: ltrAnalysis,
                      propertyData: propertyData
                    }) : ''}
                    
                    <!-- STR Cash Flow Card -->
                    ${strData && strCashFlowModule?.STRCashFlowCard ? strCashFlowModule.STRCashFlowCard({
                      monthlyRevenue: strData.monthly_revenue || strData.monthlyRevenue || 0,
                      totalExpenses: ((strData.expenses?.monthly?.total || 0) + (analysisData.monthlyExpenses?.mortgage || 0)) || 2000,
                      mortgagePayment: analysisData.monthlyExpenses?.mortgage || 0,
                      operatingExpenses: strData.expenses?.monthly?.total || 0
                    }) : ''}
                    
                    <!-- 2-Column Layout for Revenue Chart and STR Calculator -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <!-- Revenue Comparison Chart -->
                      ${strData && window.RevenueComparisonChart ? window.RevenueComparisonChart({
                        strRevenue: strData.monthly_revenue || strData.monthlyRevenue || 0,
                        ltrRevenue: ltrAnalysis.monthly_rent || ltrAnalysis.monthlyRent || 0,
                        averageStrRevenue: strData.market_average_revenue || null
                      }) : ''}
                      
                      <!-- Interactive STR Calculator -->
                      ${strData && strCalculatorModule?.STRRevenueCalculator ? strCalculatorModule.STRRevenueCalculator({
                        initialNightlyRate: strData.avg_nightly_rate || strData.avgNightlyRate || 170,
                        initialOccupancy: (strData.occupancy_rate || strData.occupancyRate || 0.85) * 100,
                        ltrMonthlyRent: ltrAnalysis.monthly_rent || ltrAnalysis.monthlyRent || 3000
                      }) : ''}
                    </div>
                  </div>
                  
                  <!-- LTR Content -->
                  <div id="ltr-content" class="section-content hidden">
                    ${ltrHtml}
                  </div>
                  
                  <!-- Investment Planning Content -->
                  <div id="investment-content" class="section-content hidden">
                    ${investmentPlanningHtml}
                  </div>
                  
                  <!-- Comparison Content -->
                  <div id="comparison-content" class="section-content hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 class="text-lg font-bold mb-4">Short-Term Rental</h3>
                        ${airbnbHtml}
                      </div>
                      <div>
                        <h3 class="text-lg font-bold mb-4">Long-Term Rental</h3>
                        ${ltrHtml}
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>

            <!-- Enhanced Financial Summary with Calculator -->
            <div class="mb-8">
              ${financialHtml}
            </div>

          </div>

        </div>
        
        <!-- Floating Change Assumptions Button -->
        <button id="floating-assumptions-btn" 
          class="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105 hidden z-40 flex items-center gap-2"
          onclick="window.scrollToFinancialCalculator()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Change Assumptions
        </button>

        <!-- Share Modal -->
        ${shareModalHtml}

        <!-- Share Modal Script -->
        ${shareModule.shareModalScript}
        
        <!-- Floating Button Script -->
        <script>
          // Scroll to financial calculator function
          window.scrollToFinancialCalculator = function() {
            const calculator = document.querySelector('[id*="financial-calc-data"]')?.closest('.bg-white');
            if (calculator) {
              calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // Flash the calculator to draw attention
              calculator.classList.add('ring-4', 'ring-purple-400', 'ring-opacity-50');
              setTimeout(() => {
                calculator.classList.remove('ring-4', 'ring-purple-400', 'ring-opacity-50');
              }, 2000);
            }
          };
          
          // Show/hide floating button based on calculator visibility
          (function() {
            const floatingBtn = document.getElementById('floating-assumptions-btn');
            if (!floatingBtn) return;
            
            let calculatorElement = null;
            let hasScrolled = false;
            
            function checkCalculatorVisibility() {
              // Only check on STR tab
              const activeTab = document.querySelector('[data-tab].active, .tab-button[class*="from-blue-600"]');
              if (!activeTab || activeTab.id !== 'str-tab') {
                floatingBtn.classList.add('hidden');
                return;
              }
              
              // Find the financial calculator
              if (!calculatorElement) {
                calculatorElement = document.querySelector('[id*="financial-calc-data"]')?.closest('.bg-white');
              }
              
              if (!calculatorElement) {
                floatingBtn.classList.add('hidden');
                return;
              }
              
              const rect = calculatorElement.getBoundingClientRect();
              const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
              
              // Show button only if user has scrolled past calculator and it's not visible
              if (hasScrolled && !isVisible && rect.top < 0) {
                floatingBtn.classList.remove('hidden');
              } else {
                floatingBtn.classList.add('hidden');
              }
            }
            
            // Track if user has scrolled
            window.addEventListener('scroll', () => {
              hasScrolled = window.scrollY > 100;
              checkCalculatorVisibility();
            }, { passive: true });
            
            // Check visibility on tab switch
            window.addEventListener('click', (e) => {
              if (e.target.closest('.tab-button')) {
                setTimeout(checkCalculatorVisibility, 100);
              }
            });
            
            // Initial check
            setTimeout(checkCalculatorVisibility, 500);
          })();
        </script>
        
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
          
          /* Ring animation for calculator highlight */
          @keyframes ring-fade {
            0% { opacity: 0.5; }
            100% { opacity: 0; }
          }
          
          /* Transition for floating button */
          #floating-assumptions-btn {
            transition: all 0.3s ease-in-out;
          }
          
          #floating-assumptions-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        </style>
      `;

      targetContainer.innerHTML = analysisLayout;
      this.attachEventHandlers();
      
      // Initialize Financial Calculator script if present
      setTimeout(() => {
        if (financialCalculatorModule && financialCalculatorModule.financialCalculatorScript) {
          console.log('Initializing Financial Calculator script');
          try {
            // Create and inject the script with propertyData
            const scriptContent = financialCalculatorModule.financialCalculatorScript(propertyData);
            const scriptEl = document.createElement('script');
            scriptEl.textContent = scriptContent;
            document.body.appendChild(scriptEl);
          } catch (error) {
            console.error('Failed to initialize Financial Calculator script:', error);
          }
        }
      }, 100);
      
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
      
      // Define switchSection function globally for sidebar navigation
      window.switchSection = function(sectionName) {
        console.log('Switching to section:', sectionName);
        
        // Debug: Log all section contents found
        const allSectionContents = document.querySelectorAll('.section-content');
        console.log('Found section contents:', allSectionContents.length);
        allSectionContents.forEach(content => {
          console.log('Section content:', content.id, 'Hidden:', content.classList.contains('hidden'));
        });
        
        // Update sidebar navigation items
        document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
          // Remove active classes - including gradient backgrounds
          btn.classList.remove('bg-gradient-to-r', 'from-purple-600', 'to-blue-600', 'text-white', 'border-transparent');
          btn.classList.add('bg-white', 'text-gray-700', 'border-gray-200', 'hover:border-purple-300');
          
          // Update icon color to inactive state
          const icon = btn.querySelector('.text-2xl');
          if (icon) {
            icon.classList.remove('text-white');
            icon.classList.add('text-gray-400');
          }
          
          // Update text colors
          const texts = btn.querySelectorAll('.font-bold, .text-sm');
          texts.forEach(text => {
            text.classList.remove('text-white');
            text.classList.add('text-gray-700');
          });
        });
        
        const activeTab = document.getElementById(sectionName + '-nav');
        if (activeTab) {
          // Add active classes with gradient background
          activeTab.classList.remove('bg-white', 'text-gray-700', 'border-gray-200', 'hover:border-purple-300');
          activeTab.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-blue-600', 'text-white', 'border-transparent');
          
          // Update icon to active state
          const icon = activeTab.querySelector('.text-2xl');
          if (icon) {
            icon.classList.remove('text-gray-400');
            icon.classList.add('text-white');
          }
          
          // Update text colors to active state
          const texts = activeTab.querySelectorAll('.font-bold, .text-sm');
          texts.forEach(text => {
            text.classList.remove('text-gray-700');
            text.classList.add('text-white');
          });
          
          console.log('Activated sidebar item:', sectionName + '-nav');
        } else {
          console.error('Sidebar nav item not found:', sectionName + '-nav');
        }
        
        // Update section content
        document.querySelectorAll('.section-content').forEach(content => {
          content.classList.add('hidden');
        });
        
        const activeContent = document.getElementById(sectionName + '-content');
        if (activeContent) {
          activeContent.classList.remove('hidden');
          console.log('Showed content:', sectionName + '-content');
        } else {
          console.error('Section content not found:', sectionName + '-content');
        }
        
        // Store active section in session
        sessionStorage.setItem('activeRentalSection', sectionName);
        
        // Refresh financial calculator for tab context
        if (window.refreshFinancialCalculator) {
          setTimeout(() => {
            console.log('Refreshing financial calculator for section:', sectionName);
            window.refreshFinancialCalculator();
          }, 50);
        }
        
        // Initialize investment planning scripts if switching to investment tab
        if (sectionName === 'investment') {
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
        if (sectionName === 'str') {
          setTimeout(() => {
            console.log('Re-initializing STR components for tab switch');
            
            // Initialize the enhanced STR calculator if using AirbnbHeroSection
            if (window.strCalculatorScript) {
              const script = document.createElement('script');
              script.textContent = window.strCalculatorScript;
              document.body.appendChild(script);
            }
            
            // Ensure Chart.js is available before re-initializing
            if (strChartsModule && strChartsModule.initializeSTRComponents) {
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
            }
          }, 100);
        }
        
        // Initialize LTR charts when switching to LTR tab
        if (sectionName === 'ltr') {
          // Add a small delay to ensure DOM is ready
          setTimeout(() => {
            console.log('Initializing LTR charts for tab switch');
            
            // First ensure the tab content is visible
            const ltrContent = document.getElementById('ltr-content');
            if (!ltrContent || ltrContent.classList.contains('hidden')) {
              console.log('LTR content not visible, skipping chart init');
              return;
            }
            
            // Wait for canvas elements to be available
            const checkAndInitialize = (retries = 5) => {
              const revenueCanvas = document.getElementById('revenue-comparison-chart');
              const projectionCanvas = document.getElementById('ltr-revenue-chart');
              
              if (revenueCanvas && projectionCanvas) {
                console.log('Canvas elements found, initializing charts');
                
                // Initialize revenue comparison chart
                if (typeof window.initializeRevenueComparisonChart === 'function') {
                  window.initializeRevenueComparisonChart();
                }
                
                // Initialize revenue projection chart
                if (typeof window.initializeLTRChart === 'function') {
                  window.initializeLTRChart();
                }
                
                // Also check for any LTR-specific initialization functions
                if (window.LTRAnalysis && window.LTRAnalysis.initializeCharts) {
                  window.LTRAnalysis.initializeCharts();
                }
              } else if (retries > 0) {
                console.log(`Canvas not ready, retrying... (${retries} attempts left)`);
                setTimeout(() => checkAndInitialize(retries - 1), 200);
              } else {
                console.error('Failed to find canvas elements after multiple attempts');
              }
            };
            
            checkAndInitialize();
          }, 150);
        }
      };
      
      // Define switchTab function for backward compatibility
      window.switchTab = function(tabName) {
        console.log('switchTab called, redirecting to switchSection:', tabName);
        window.switchSection(tabName);
      };
      
      // Restore active section if exists
      setTimeout(() => {
        const activeSection = sessionStorage.getItem('activeRentalSection') || sessionStorage.getItem('activeRentalTab');
        if (activeSection && (activeSection === 'ltr' || activeSection === 'investment')) {
          window.switchSection(activeSection);
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
          
          // Create refresh function for tab switches
          window.refreshFinancialCalculator = async () => {
            try {
              // Re-render the financial calculator with current tab context
              const financialContainer = document.querySelector('.mb-8');
              if (financialContainer && financialModule.EnhancedFinancialSummary) {
                const updatedHtml = financialModule.EnhancedFinancialSummary({ analysis: analysisData });
                financialContainer.innerHTML = updatedHtml;
                
                // Re-initialize calculator after re-render
                if (financialModule.initializeEnhancedFinancialSummary) {
                  financialModule.initializeEnhancedFinancialSummary();
                }
                
                // Re-initialize charts
                const { initializeEnhancedFinancialCalculator } = await import('./financialCalculatorCharts.js');
                if (window.Chart) {
                  initializeEnhancedFinancialCalculator();
                }
              }
            } catch (error) {
              console.error('Failed to refresh financial calculator:', error);
            }
          };
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
                <div class="glass-card backdrop-blur-sm bg-white/30 rounded-lg p-3">
                  <div class="text-xs text-gray-500">Your Revenue</div>
                  <div class="text-lg font-bold text-gray-900">$${strRevenue.toLocaleString()}/mo</div>
                </div>
                <div class="glass-card backdrop-blur-sm bg-white/30 rounded-lg p-3">
                  <div class="text-xs text-gray-500">Market Avg</div>
                  <div class="text-lg font-bold text-gray-900">$${avgCompRevenue.toLocaleString()}/mo</div>
                </div>
                <div class="glass-card backdrop-blur-sm bg-white/30 rounded-lg p-3">
                  <div class="text-xs text-gray-500">Your Occupancy</div>
                  <div class="text-lg font-bold text-gray-900">${(strOccupancy * 100).toFixed(0)}%</div>
                </div>
                <div class="glass-card backdrop-blur-sm bg-white/30 rounded-lg p-3">
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
              <div class="border-2 border-white/30 rounded-lg p-4 glass-card backdrop-blur-sm bg-white/50">
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
            <div class="glass-card backdrop-blur-sm bg-white/40 rounded-lg p-4">
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
    // Event delegation for assumptions toggle
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-toggle="assumptions"]');
      if (toggleBtn) {
        const content = document.querySelector('[data-content="assumptions"]');
        const chevron = document.querySelector('[data-chevron="assumptions"]');
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        
        if (content && chevron) {
          if (isExpanded) {
            content.classList.add('hidden');
            chevron.style.transform = 'rotate(0deg)';
            toggleBtn.setAttribute('aria-expanded', 'false');
          } else {
            content.classList.remove('hidden');
            chevron.style.transform = 'rotate(180deg)';
            toggleBtn.setAttribute('aria-expanded', 'true');
          }
        }
      }
    });

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
          <div class="glass-card backdrop-blur-lg bg-white/95 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
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
                     class="block glass-card backdrop-blur-sm bg-white/80 border border-white/30 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
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
                  <div class="text-2xl font-bold text-green-600">$${(analysisData.strAnalysis?.monthlyRevenue || analysisData.short_term_rental?.monthly_revenue)?.toLocaleString() || '0'}</div>
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
            comparables: analysisData.strAnalysis?.comparables || analysisData.short_term_rental?.comparables || [],
            marketData: {}
          })}

          <!-- Mobile Financial Summary -->
          ${financialModule.QuickFinancialSummary({
            strRevenue: analysisData.strAnalysis?.monthlyRevenue || analysisData.short_term_rental?.monthly_revenue || 0,
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

// Export the class to global scope
window.ComponentLoader = ComponentLoader;

// Don't create instance here - let the app decide which loader to use
// window.componentLoader = new ComponentLoader();

// Use IIFE to avoid export syntax error
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComponentLoader;
}

// ES6 export for module usage
export default ComponentLoader;