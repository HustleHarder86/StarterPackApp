/**
 * Component Loader Integration Tests
 * Tests for the ComponentLoader class and its methods
 */

import ComponentLoader from '../../js/modules/componentLoader.js';

describe('ComponentLoader Integration Tests', () => {
  let componentLoader;
  let mockContainer;

  beforeEach(() => {
    componentLoader = new ComponentLoader();
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  describe('Component Loading', () => {
    test('loads component successfully', async () => {
      // Mock the import function
      const mockModule = {
        Card: ({ children }) => `<div class="card">${children}</div>`
      };
      
      // Mock dynamic import
      jest.spyOn(componentLoader, 'loadComponent').mockResolvedValue(mockModule);
      
      const result = await componentLoader.loadComponent('components/ui/Card.js');
      
      expect(result).toBe(mockModule);
      expect(componentLoader.loadComponent).toHaveBeenCalledWith('components/ui/Card.js');
    });

    test('caches loaded components', async () => {
      const mockModule = { Card: () => '<div>test</div>' };
      jest.spyOn(componentLoader, 'loadComponent').mockResolvedValue(mockModule);
      
      // Load component twice
      await componentLoader.loadComponent('components/ui/Card.js');
      await componentLoader.loadComponent('components/ui/Card.js');
      
      expect(componentLoader.componentCache.has('components/ui/Card.js')).toBe(true);
    });

    test('handles component loading errors gracefully', async () => {
      jest.spyOn(componentLoader, 'loadComponent').mockRejectedValue(new Error('Module not found'));
      
      const result = await componentLoader.loadComponent('nonexistent/component.js');
      
      expect(result).toBeNull();
    });
  });

  describe('Component Rendering', () => {
    test('renders component to DOM element', async () => {
      const mockModule = {
        Card: ({ children }) => `<div class="card">${children}</div>`
      };
      
      jest.spyOn(componentLoader, 'loadComponent').mockResolvedValue(mockModule);
      
      await componentLoader.renderComponent(
        'components/ui/Card.js',
        'Card',
        { children: 'Test content' },
        mockContainer
      );
      
      expect(mockContainer.innerHTML).toContain('<div class="card">Test content</div>');
    });

    test('handles render errors gracefully', async () => {
      jest.spyOn(componentLoader, 'loadComponent').mockRejectedValue(new Error('Load failed'));
      
      await componentLoader.renderComponent(
        'components/ui/Card.js',
        'Card',
        {},
        mockContainer
      );
      
      expect(mockContainer.innerHTML).toContain('Error loading Card');
    });
  });

  describe('Analysis Results Rendering', () => {
    const mockAnalysisData = {
      strAnalysis: {
        monthlyRevenue: 5400,
        comparables: [
          {
            nightly_rate: 185,
            bedrooms: 2,
            area: 'Downtown',
            rating: 4.7,
            monthly_revenue: 5200,
            occupancy_rate: 85,
            performance: 'match'
          }
        ]
      },
      longTermRental: {
        monthlyRent: 3200,
        roi: 12.4,
        capRate: 8.2
      },
      overallScore: 8.7,
      recommendations: [
        { title: 'High Demand', description: 'Strong market demand' }
      ]
    };

    test('renders complete analysis results', async () => {
      // Mock all required modules
      const mockModules = {
        'components/analysis/InvestmentVerdict.js': {
          VerdictSummary: () => '<div class="verdict">Recommended</div>'
        },
        'components/analysis/AirbnbListings.js': {
          AirbnbHeroSection: () => '<div class="airbnb-hero">Live Data</div>'
        },
        'components/analysis/FinancialSummary.js': {
          FinancialSummaryFromAnalysis: () => '<div class="financial">$5,400</div>'
        },
        'components/ui/Button.js': {
          ActionButton: () => '<button class="action-btn">Save</button>'
        }
      };

      jest.spyOn(componentLoader, 'loadComponent').mockImplementation(
        (path) => Promise.resolve(mockModules[path])
      );

      await componentLoader.renderAnalysisResults(mockAnalysisData, mockContainer);

      expect(mockContainer.innerHTML).toContain('verdict');
      expect(mockContainer.innerHTML).toContain('airbnb-hero');
      expect(mockContainer.innerHTML).toContain('financial');
      expect(mockContainer.innerHTML).toContain('Show Detailed Analysis');
    });

    test('shows loading state initially', async () => {
      // Delay the promise to test loading state
      const delayedPromise = new Promise(resolve => {
        setTimeout(() => resolve({
          VerdictSummary: () => '<div>Loaded</div>'
        }), 100);
      });

      jest.spyOn(componentLoader, 'loadComponent').mockReturnValue(delayedPromise);

      const renderPromise = componentLoader.renderAnalysisResults(mockAnalysisData, mockContainer);

      // Check loading state immediately
      expect(mockContainer.innerHTML).toContain('animate-pulse');
      expect(mockContainer.innerHTML).toContain('bg-gray-200');

      await renderPromise;
    });

    test('handles rendering errors with error message', async () => {
      jest.spyOn(componentLoader, 'loadComponent').mockRejectedValue(new Error('Module failed'));

      await componentLoader.renderAnalysisResults(mockAnalysisData, mockContainer);

      expect(mockContainer.innerHTML).toContain('Error Loading Analysis');
      expect(mockContainer.innerHTML).toContain('Reload Page');
    });
  });

  describe('Mobile Analysis Rendering', () => {
    test('renders mobile-optimized layout', async () => {
      const mockModules = {
        'components/analysis/AirbnbListings.js': {
          AirbnbListingsMobile: () => '<div class="mobile-airbnb">Mobile Listings</div>'
        },
        'components/analysis/FinancialSummary.js': {
          QuickFinancialSummary: () => '<div class="quick-financial">Quick Summary</div>'
        },
        'components/ui/Button.js': {
          MobileActionButtons: () => '<div class="mobile-actions">Mobile Actions</div>'
        }
      };

      jest.spyOn(componentLoader, 'loadComponent').mockImplementation(
        (path) => Promise.resolve(mockModules[path])
      );

      await componentLoader.renderMobileAnalysis(mockAnalysisData, mockContainer);

      expect(mockContainer.innerHTML).toContain('mobile-airbnb');
      expect(mockContainer.innerHTML).toContain('quick-financial');
      expect(mockContainer.innerHTML).toContain('mobile-actions');
      expect(mockContainer.innerHTML).toContain('pb-24'); // Mobile padding
    });

    test('handles mobile rendering errors', async () => {
      jest.spyOn(componentLoader, 'loadComponent').mockRejectedValue(new Error('Mobile load failed'));

      await componentLoader.renderMobileAnalysis(mockAnalysisData, mockContainer);

      // Should not crash, but log error
      expect(console.error).toHaveBeenCalledWith('Failed to render mobile analysis:', expect.any(Error));
    });
  });

  describe('Event Handlers', () => {
    test('attaches global event handlers', () => {
      componentLoader.attachEventHandlers();

      expect(typeof window.toggleDetailedAnalysis).toBe('function');
      expect(typeof window.saveAnalysis).toBe('function');
      expect(typeof window.generateReport).toBe('function');
      expect(typeof window.analyzeAnother).toBe('function');
    });

    test('toggle detailed analysis works', () => {
      // Create mock DOM elements
      const detailedSection = document.createElement('div');
      detailedSection.id = 'detailed-analysis';
      detailedSection.classList.add('hidden');
      
      const toggleText = document.createElement('span');
      toggleText.id = 'toggle-text';
      toggleText.textContent = 'Show Detailed Analysis';
      
      const toggleIcon = document.createElement('svg');
      toggleIcon.id = 'toggle-icon';
      
      document.body.appendChild(detailedSection);
      document.body.appendChild(toggleText);
      document.body.appendChild(toggleIcon);

      componentLoader.attachEventHandlers();

      // Test toggle functionality
      window.toggleDetailedAnalysis();
      
      expect(detailedSection.classList.contains('hidden')).toBe(false);
      expect(toggleText.textContent).toBe('Hide Detailed Analysis');
      expect(toggleIcon.style.transform).toBe('rotate(180deg)');

      // Toggle back
      window.toggleDetailedAnalysis();
      
      expect(detailedSection.classList.contains('hidden')).toBe(true);
      expect(toggleText.textContent).toBe('Show Detailed Analysis');
      expect(toggleIcon.style.transform).toBe('rotate(0deg)');

      // Cleanup
      document.body.removeChild(detailedSection);
      document.body.removeChild(toggleText);
      document.body.removeChild(toggleIcon);
    });
  });

  describe('Action Button Generation', () => {
    test('generates action buttons correctly', () => {
      const mockButtonModule = {
        ActionButton: ({ action, icon, label, description }) => 
          `<button onclick="${action}" class="action-btn">
            ${icon} ${label} - ${description}
          </button>`
      };

      const html = componentLoader.generateActionButtons(mockButtonModule);

      expect(html).toContain('saveAnalysis()');
      expect(html).toContain('generateReport()');
      expect(html).toContain('analyzeAnother()');
      expect(html).toContain('💾 Save to Portfolio');
      expect(html).toContain('📊 Generate Report');
      expect(html).toContain('🔍 Analyze Another');
    });
  });

  describe('Detailed Analysis Placeholder', () => {
    test('generates detailed analysis placeholder', () => {
      const html = componentLoader.generateDetailedAnalysisPlaceholder();

      expect(html).toContain('Detailed Market Analysis');
      expect(html).toContain('Risk Assessment');
      expect(html).toContain('Investment Scenarios');
      expect(html).toContain('space-y-xl');
    });
  });

  describe('Error Handling', () => {
    test('handles missing target container', async () => {
      await componentLoader.renderAnalysisResults(mockAnalysisData, null);

      expect(console.error).toHaveBeenCalledWith('Target container not found');
    });

    test('handles invalid analysis data', async () => {
      const mockModule = {
        VerdictSummary: () => '<div>Test</div>'
      };

      jest.spyOn(componentLoader, 'loadComponent').mockResolvedValue(mockModule);

      await componentLoader.renderAnalysisResults(null, mockContainer);

      // Should not crash
      expect(mockContainer.innerHTML).toContain('container');
    });
  });
});

// Mock console.error for testing
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});