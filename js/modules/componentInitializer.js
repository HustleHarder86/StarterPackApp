/**
 * Component Initializer
 * Provides consistent component loading and initialization
 */

export class ComponentInitializer {
  constructor() {
    this.loadedComponents = new Set();
    this.componentCache = new Map();
  }

  /**
   * Initialize all components with proper error handling
   */
  async initializeComponents() {
    const componentsToLoad = [
      'CompactModernLayout',
      'PropertyHeroSectionCompactModern',
      'FinancialSummaryCompactModern',
      'InvestmentVerdictCompactModern',
      'MarketComparisonCompactModern',
      'PropertyConfirmationModal',
      'AnalysisProgress'
    ];

    const loadPromises = componentsToLoad.map(component => 
      this.loadComponent(component).catch(err => {
        console.warn(`Failed to load ${component}:`, err);
        return null;
      })
    );

    await Promise.all(loadPromises);
    console.log('Component initialization complete');
  }

  /**
   * Load a single component
   */
  async loadComponent(componentName) {
    if (this.loadedComponents.has(componentName)) {
      return this.componentCache.get(componentName);
    }

    try {
      // Check if component is already globally available
      if (window[componentName]) {
        this.loadedComponents.add(componentName);
        this.componentCache.set(componentName, window[componentName]);
        return window[componentName];
      }

      // Component not found
      console.warn(`Component ${componentName} not found`);
      return null;
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error);
      return null;
    }
  }

  /**
   * Render a component with data
   */
  renderComponent(componentName, props, targetElement) {
    const component = this.componentCache.get(componentName) || window[componentName];
    
    if (!component) {
      console.error(`Component ${componentName} not loaded`);
      return false;
    }

    if (!targetElement) {
      console.error(`Target element not found for ${componentName}`);
      return false;
    }

    try {
      // All current components return HTML strings
      const html = component(props);
      if (html) {
        targetElement.innerHTML = html;
        return true;
      }
    } catch (error) {
      console.error(`Error rendering ${componentName}:`, error);
      targetElement.innerHTML = `<div class="error-state">Error loading ${componentName}</div>`;
    }

    return false;
  }

  /**
   * Batch render multiple components
   */
  async renderComponents(componentMap) {
    const renderPromises = [];

    for (const [selector, config] of Object.entries(componentMap)) {
      const element = document.querySelector(selector);
      if (element && config.component) {
        renderPromises.push(
          this.renderComponent(config.component, config.props || {}, element)
        );
      }
    }

    await Promise.all(renderPromises);
  }

  /**
   * Clear rendered components
   */
  clearComponents(selectors) {
    selectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.innerHTML = '';
      }
    });
  }

  /**
   * Check if all required components are loaded
   */
  areComponentsReady(componentNames) {
    return componentNames.every(name => 
      this.loadedComponents.has(name) || window[name]
    );
  }
}

// Create global instance
window.componentInitializer = new ComponentInitializer();