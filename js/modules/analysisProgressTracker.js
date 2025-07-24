/**
 * Analysis Progress Tracker
 * Provides real-time progress updates during property analysis
 */

export class AnalysisProgressTracker {
  constructor() {
    this.progressSteps = {
      'init': { progress: 5, message: 'Starting analysis...' },
      'property_fetch': { progress: 10, message: 'Fetching property details...' },
      'address_validation': { progress: 15, message: 'Validating property address...' },
      'market_data': { progress: 25, message: 'Retrieving market data...' },
      'comparables_search': { progress: 35, message: 'Finding comparable properties...' },
      'rental_analysis': { progress: 45, message: 'Analyzing rental potential...' },
      'airbnb_data': { progress: 55, message: 'Fetching Airbnb data...' },
      'occupancy_calc': { progress: 65, message: 'Calculating occupancy rates...' },
      'financial_model': { progress: 75, message: 'Running financial projections...' },
      'roi_calculation': { progress: 85, message: 'Calculating ROI metrics...' },
      'report_generation': { progress: 95, message: 'Generating investment report...' },
      'complete': { progress: 100, message: 'Analysis complete!' }
    };
    
    this.currentStep = 'init';
    this.listeners = [];
  }
  
  /**
   * Subscribe to progress updates
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Update progress to a specific step
   */
  updateStep(stepId, customMessage = null) {
    if (this.progressSteps[stepId]) {
      this.currentStep = stepId;
      const step = this.progressSteps[stepId];
      
      this.notifyListeners({
        step: stepId,
        progress: step.progress,
        message: customMessage || step.message,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Update with custom progress value
   */
  updateProgress(progress, message) {
    this.notifyListeners({
      step: 'custom',
      progress: Math.min(100, Math.max(0, progress)),
      message: message,
      timestamp: Date.now()
    });
  }
  
  /**
   * Notify all listeners of progress update
   */
  notifyListeners(update) {
    this.listeners.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    });
  }
  
  /**
   * Reset progress
   */
  reset() {
    this.currentStep = 'init';
    this.notifyListeners({
      step: 'init',
      progress: 0,
      message: 'Ready to start analysis',
      timestamp: Date.now()
    });
  }
  
  /**
   * Simulate realistic progress for demo/testing
   */
  simulateProgress(duration = 35000) {
    const steps = Object.keys(this.progressSteps);
    const stepDuration = duration / steps.length;
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex >= steps.length) {
        clearInterval(interval);
        return;
      }
      
      this.updateStep(steps[currentIndex]);
      currentIndex++;
    }, stepDuration);
    
    return () => clearInterval(interval);
  }
}

// Create a singleton instance
export const progressTracker = new AnalysisProgressTracker();

// Expose to global scope for easy access
window.analysisProgressTracker = progressTracker;