/**
 * Cleanup helper for managing resources and preventing memory leaks
 */

/**
 * Cleanup manager for tracking and disposing resources
 */
export class CleanupManager {
  constructor() {
    this.cleanupFunctions = [];
    this.eventListeners = [];
    this.intervals = [];
    this.timeouts = [];
    this.subscriptions = [];
  }

  /**
   * Add a cleanup function to be called on dispose
   */
  addCleanup(fn) {
    if (typeof fn === 'function') {
      this.cleanupFunctions.push(fn);
    }
  }

  /**
   * Track an event listener for cleanup
   */
  addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    this.eventListeners.push({ element, event, handler, options });
  }

  /**
   * Track an interval for cleanup
   */
  setInterval(fn, delay) {
    const id = setInterval(fn, delay);
    this.intervals.push(id);
    return id;
  }

  /**
   * Track a timeout for cleanup
   */
  setTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    this.timeouts.push(id);
    return id;
  }

  /**
   * Track a Firebase subscription for cleanup
   */
  addSubscription(unsubscribe) {
    if (typeof unsubscribe === 'function') {
      this.subscriptions.push(unsubscribe);
    }
  }

  /**
   * Clean up all tracked resources
   */
  cleanup() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners = [];

    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];

    // Clear timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts = [];

    // Unsubscribe from subscriptions
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    this.subscriptions = [];

    // Run cleanup functions
    this.cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error in cleanup function:', error);
      }
    });
    this.cleanupFunctions = [];
  }
}

/**
 * Chart cleanup helper
 */
export function cleanupChart(chart) {
  if (chart && typeof chart.destroy === 'function') {
    chart.destroy();
  }
  return null;
}

/**
 * Clear sensitive data from memory
 */
export function clearSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return;

  const sensitiveKeys = [
    'password', 'token', 'apiKey', 'secret', 
    'creditCard', 'ssn', 'bankAccount'
  ];

  Object.keys(obj).forEach(key => {
    if (sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    )) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      clearSensitiveData(obj[key]);
    }
  });
}

/**
 * Debounce helper to prevent excessive function calls
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle helper to limit function calls
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe local storage operations
 */
export const safeStorage = {
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },
  
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },
  
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }
};

export default {
  CleanupManager,
  cleanupChart,
  clearSensitiveData,
  debounce,
  throttle,
  safeStorage
};