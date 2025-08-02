/**
 * Analysis Progress Tracker
 * Provides real-time progress updates during property analysis
 * GLOBAL VERSION - No ES6 modules
 */

class AnalysisProgressTracker {
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
    // Send current state immediately
    callback(this.getCurrentState());
  }
  
  /**
   * Update progress to a new step
   */
  updateProgress(stepKey) {
    if (this.progressSteps[stepKey]) {
      this.currentStep = stepKey;
      this.notifyListeners();
    }
  }
  
  /**
   * Get current progress state
   */
  getCurrentState() {
    const step = this.progressSteps[this.currentStep] || this.progressSteps['init'];
    return {
      progress: step.progress,
      message: step.message,
      currentStep: this.currentStep
    };
  }
  
  /**
   * Notify all listeners of progress change
   */
  notifyListeners() {
    const state = this.getCurrentState();
    this.listeners.forEach(callback => callback(state));
  }
  
  /**
   * Reset progress to initial state
   */
  reset() {
    this.currentStep = 'init';
    this.notifyListeners();
  }
}

// Export to global scope
window.AnalysisProgressTracker = AnalysisProgressTracker;

// Create a singleton instance for the app
window.progressTracker = new AnalysisProgressTracker();