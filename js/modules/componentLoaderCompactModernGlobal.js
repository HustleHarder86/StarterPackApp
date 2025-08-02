/**
 * Component Loader Module - Compact Modern Design Global Version
 * Loads and renders components with new sidebar layout without ES6 modules
 */

(function() {
  class ComponentLoaderCompactModernGlobal {
    constructor() {
      this.loader = window.componentLoaderGlobal || new window.ComponentLoaderGlobal();
    }

    /**
     * Render analysis results using compact modern design
     */
    renderAnalysisResults(analysisData, targetContainer) {
      if (!targetContainer) {
        console.error('Target container not found');
        return;
      }

      // Store analysis data
      this.lastAnalysisData = analysisData;
      window.analysisData = analysisData;

      try {
        // Extract property and analysis data
        const propertyData = analysisData.propertyData || analysisData.property_data || {};
        const strAnalysis = analysisData.strAnalysis || analysisData.str_analysis || {};
        const ltrAnalysis = analysisData.longTermRental || analysisData.long_term_rental || {};
        const costs = analysisData.costs || {};
        
        // Create the main content structure
        const mainContent = `
          <div class="container mx-auto p-4">
            <!-- Property Hero Section -->
            <div id="property-hero-section" class="mb-6"></div>
            
            <!-- Content Grid -->
            <div class="grid-container">
              <!-- Main Analysis Area -->
              <div id="financial-summary" class="mb-6"></div>
              <div id="investment-verdict" class="mb-6"></div>
              <div id="market-comparison" class="mb-6"></div>
              
              <!-- Calculator Section -->
              <div id="financial-calculator" class="mb-6"></div>
            </div>
          </div>
        `;

        // If CompactModernLayout is available, wrap the content
        if (window.CompactModernLayout) {
          const layoutHTML = window.CompactModernLayout({
            children: mainContent,
            currentPage: 'analytics',
            propertyData: propertyData
          });
          targetContainer.innerHTML = layoutHTML;
        } else {
          // Fallback: just render the content
          targetContainer.innerHTML = mainContent;
        }

        // Now render individual components
        const components = [
          {
            name: 'PropertyHeroSection',
            props: { property: propertyData },
            targetId: '#property-hero-section'
          },
          {
            name: 'FinancialSummaryCompactModern',
            props: { costs, ltr: ltrAnalysis, str: strAnalysis },
            targetId: '#financial-summary'
          },
          {
            name: 'InvestmentVerdictCompactModern',
            props: { analysis: analysisData },
            targetId: '#investment-verdict'
          },
          {
            name: 'MarketComparisonCompactModern',
            props: { ltr: ltrAnalysis, str: strAnalysis },
            targetId: '#market-comparison'
          }
        ];

        // Render each component if it exists
        components.forEach(({ name, props, targetId }) => {
          const target = targetContainer.querySelector(targetId);
          if (target && window[name]) {
            const html = window[name](props);
            target.innerHTML = html;
          }
        });

        // Set up mobile menu if layout was rendered
        this.setupMobileMenu();

        // Initialize any interactive components
        this.initializeComponents();

      } catch (error) {
        console.error('Error rendering analysis results:', error);
        targetContainer.innerHTML = `
          <div class="error-state p-8 text-center">
            <h2 class="text-2xl font-bold text-red-600 mb-4">Error Loading Results</h2>
            <p class="text-gray-600">${error.message}</p>
          </div>
        `;
      }
    }

    /**
     * Set up mobile menu functionality
     */
    setupMobileMenu() {
      const mobileMenuToggle = document.getElementById('mobileMenuToggle');
      const sidebar = document.getElementById('sidebar');
      const sidebarOverlay = document.getElementById('sidebarOverlay');
      
      if (mobileMenuToggle && sidebar && sidebarOverlay) {
        mobileMenuToggle.addEventListener('click', () => {
          sidebar.classList.toggle('cm-sidebar-open');
          sidebarOverlay.classList.toggle('cm-sidebar-overlay-open');
        });
        
        sidebarOverlay.addEventListener('click', () => {
          sidebar.classList.remove('cm-sidebar-open');
          sidebarOverlay.classList.remove('cm-sidebar-overlay-open');
        });
      }
    }

    /**
     * Initialize interactive components
     */
    initializeComponents() {
      // Initialize tooltips
      if (window.initializeTooltips) {
        window.initializeTooltips();
      }

      // Initialize charts
      if (window.initializeCharts) {
        window.initializeCharts();
      }

      // Initialize tabs
      const tabContainers = document.querySelectorAll('.tab-container');
      tabContainers.forEach(container => {
        const tabs = container.querySelectorAll('.tab-button');
        const panels = container.querySelectorAll('.tab-panel');
        
        tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.add('hidden'));
            
            tab.classList.add('active');
            if (panels[index]) {
              panels[index].classList.remove('hidden');
            }
          });
        });
      });
    }
  }

  // Make it globally available
  window.ComponentLoaderCompactModernGlobal = ComponentLoaderCompactModernGlobal;
  window.ComponentLoaderCompactModern = ComponentLoaderCompactModernGlobal;
})();