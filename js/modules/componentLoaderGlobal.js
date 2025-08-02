/**
 * Component Loader Module - Global Version
 * Loads and renders components without ES6 modules
 */

(function() {
  class ComponentLoaderGlobal {
    constructor() {
      this.loadedComponents = new Map();
      this.componentCache = new Map();
    }

    /**
     * Register a component globally
     */
    registerComponent(name, componentFunction) {
      this.componentCache.set(name, componentFunction);
    }

    /**
     * Get a registered component
     */
    getComponent(componentName) {
      return this.componentCache.get(componentName);
    }

    /**
     * Render component to DOM element
     */
    renderComponent(componentName, props = {}, targetElement) {
      try {
        const componentFunction = this.getComponent(componentName);
        if (!componentFunction) {
          throw new Error(`Component ${componentName} not found. Make sure it's registered.`);
        }

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
     * Render multiple components
     */
    renderComponents(components, container) {
      components.forEach(({ name, props, targetId }) => {
        const target = container.querySelector(targetId);
        if (target) {
          this.renderComponent(name, props, target);
        }
      });
    }
  }

  // Make it globally available
  window.ComponentLoaderGlobal = ComponentLoaderGlobal;
  window.componentLoaderGlobal = new ComponentLoaderGlobal();
})();