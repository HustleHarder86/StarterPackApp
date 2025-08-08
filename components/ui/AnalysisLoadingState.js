/**
 * Advanced Analysis Loading State Component
 * Provides real-time progress tracking, cancel functionality, and timeout handling
 */

export class AnalysisLoadingState {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      timeout: 60000, // 60 seconds default timeout
      onCancel: () => {},
      onTimeout: () => {},
      onRetry: () => {},
      ...options
    };
    
    this.startTime = Date.now();
    this.progress = 0;
    this.currentStep = 0;
    this.cancelled = false;
    this.timedOut = false;
    this.timeoutTimer = null;
    this.progressInterval = null;
    
    this.steps = [
      { id: 'init', name: 'Initializing analysis', icon: '🚀', duration: 2000 },
      { id: 'property', name: 'Fetching property details', icon: '🏠', duration: 3000 },
      { id: 'market', name: 'Analyzing local market data', icon: '📊', duration: 5000 },
      { id: 'comparables', name: 'Finding comparable properties', icon: '🔍', duration: 4000 },
      { id: 'airbnb', name: 'Retrieving Airbnb data', icon: '🏨', duration: 8000 },
      { id: 'occupancy', name: 'Calculating occupancy rates', icon: '📈', duration: 4000 },
      { id: 'financial', name: 'Running financial projections', icon: '💰', duration: 5000 },
      { id: 'insights', name: 'Generating investment insights', icon: '💡', duration: 3000 },
      { id: 'finalizing', name: 'Finalizing report', icon: '✨', duration: 2000 }
    ];
    
    this.totalDuration = this.steps.reduce((sum, step) => sum + step.duration, 0);
  }
  
  render() {
    this.container.innerHTML = this.getHTML();
    this.attachEventListeners();
    this.startProgress();
    this.startTimeout();
  }
  
  getHTML() {
    const elapsedTime = this.getElapsedTime();
    const estimatedRemaining = this.getEstimatedRemaining();
    
    return `
      <div class="flex items-center justify-center p-3" style="height: calc(100vh - 40px); max-height: 860px;">
        <div class="max-w-2xl w-full">
          <!-- Main Loading Card -->
          <div class="glass-card backdrop-blur-lg bg-white/90 rounded-2xl shadow-2xl overflow-hidden">
            <!-- Header with Progress - Compact -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
              <div class="flex items-center justify-between mb-2">
                <h1 class="text-lg font-bold">Analyzing Your Property</h1>
                <div class="text-right">
                  <div class="text-2xl font-bold">${Math.round(this.progress)}%</div>
                  <div class="text-xs opacity-80">Complete</div>
                </div>
              </div>
              
              <!-- Overall Progress Bar -->
              <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                <div class="h-full bg-white rounded-full transition-all duration-500 ease-out" 
                     style="width: ${this.progress}%"></div>
              </div>
              
            </div>
            
            <!-- Steps Progress - Ultra Compact -->
            <div class="p-3">
              <div class="space-y-1 mb-3">
                ${this.steps.map((step, index) => this.getStepHTML(step, index)).join('')}
              </div>
              
              <!-- Info Box - Ultra Compact -->
              <div class="glass-card backdrop-blur-sm bg-white/50 rounded-lg p-2 mb-2">
                <div class="flex items-start gap-2">
                  <svg class="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                  <div class="flex-1">
                    <p class="text-xs text-blue-700" id="analysis-info">
                      <strong class="text-blue-900">What's happening?</strong> We're analyzing over 50 data points to provide accurate investment insights.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Action Buttons - Compact -->
              <div class="flex gap-2 justify-center">
                <button id="cancel-analysis-btn" 
                        class="px-4 py-2 glass backdrop-blur-sm bg-white/50 hover:bg-white/70 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200">
                  Cancel Analysis
                </button>
                <button id="retry-analysis-btn" 
                        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 hidden">
                  Retry Analysis
                </button>
              </div>
            </div>
          </div>
          
          <!-- Help Text - Compact -->
          <div class="text-center mt-3">
            <p class="text-gray-600 text-xs">
              Having issues? 
              <a href="#" onclick="showAnalysisHelp()" class="text-indigo-600 hover:text-indigo-700 font-medium">
                Get help
              </a>
            </p>
          </div>
        </div>
      </div>
    `;
  }
  
  getStepHTML(step, index) {
    const isActive = index === this.currentStep;
    const isCompleted = index < this.currentStep;
    const isPending = index > this.currentStep;
    
    let statusClass = '';
    let iconBgClass = '';
    let progressWidth = '0%';
    
    if (isCompleted) {
      statusClass = 'text-green-600';
      iconBgClass = 'bg-green-100';
      progressWidth = '100%';
    } else if (isActive) {
      statusClass = 'text-indigo-600';
      iconBgClass = 'bg-indigo-100';
      const stepProgress = this.getStepProgress(index);
      progressWidth = `${stepProgress}%`;
    } else {
      statusClass = 'text-gray-400';
      iconBgClass = 'bg-white/30 backdrop-blur-sm';
    }
    
    return `
      <div class="flex items-center gap-2 ${isPending ? 'opacity-50' : ''}">
        <div class="flex-shrink-0 w-6 h-6 ${iconBgClass} rounded-full flex items-center justify-center text-xs transition-all duration-300">
          ${isCompleted ? '✓' : step.icon}
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-center">
            <span class="text-xs ${statusClass} transition-colors duration-300">${step.name}</span>
            ${isActive ? `<span class="text-xs text-gray-500">${Math.round(this.getStepProgress(index))}%</span>` : ''}
          </div>
          <div class="h-1 bg-white/30 backdrop-blur-sm rounded-full overflow-hidden mt-0.5">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                 style="width: ${progressWidth}"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  getStepProgress(stepIndex) {
    if (stepIndex !== this.currentStep) return 0;
    
    const stepStartTime = this.steps.slice(0, stepIndex).reduce((sum, s) => sum + s.duration, 0);
    const stepDuration = this.steps[stepIndex].duration;
    const elapsed = Date.now() - this.startTime - stepStartTime;
    
    return Math.min(100, (elapsed / stepDuration) * 100);
  }
  
  getElapsedTime() {
    const elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }
  
  getEstimatedRemaining() {
    const elapsed = Date.now() - this.startTime;
    const estimatedTotal = this.totalDuration * (100 / Math.max(1, this.progress));
    const remaining = Math.max(0, estimatedTotal - elapsed);
    const seconds = Math.floor(remaining / 1000);
    
    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60);
      return `~${minutes}m`;
    }
    return seconds > 0 ? `~${seconds}s` : 'Almost done!';
  }
  
  startProgress() {
    this.progressInterval = setInterval(() => {
      if (this.cancelled || this.timedOut) {
        this.stopProgress();
        return;
      }
      
      const elapsed = Date.now() - this.startTime;
      this.progress = Math.min(95, (elapsed / this.totalDuration) * 100);
      
      // Update current step
      let accumulatedTime = 0;
      for (let i = 0; i < this.steps.length; i++) {
        accumulatedTime += this.steps[i].duration;
        if (elapsed < accumulatedTime) {
          if (this.currentStep !== i) {
            this.currentStep = i;
            this.updateStepDisplay();
          }
          break;
        }
      }
      
      // Update progress display
      this.updateProgressDisplay();
    }, 100);
  }
  
  stopProgress() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
  
  startTimeout() {
    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.options.timeout);
  }
  
  stopTimeout() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }
  
  updateProgressDisplay() {
    const progressBar = this.container.querySelector('.bg-white.rounded-full');
    const progressText = this.container.querySelector('.text-3xl.font-bold');
    
    if (progressBar) progressBar.style.width = `${this.progress}%`;
    if (progressText) progressText.textContent = `${Math.round(this.progress)}%`;
  }
  
  updateStepDisplay() {
    const stepsContainer = this.container.querySelector('.space-y-1');
    if (stepsContainer) {
      stepsContainer.innerHTML = this.steps.map((step, index) => this.getStepHTML(step, index)).join('');
    }
    
    // Update info text based on current step
    const infoText = this.container.querySelector('#analysis-info');
    if (infoText) {
      const infoMessages = [
        "Initializing our analysis engine and preparing to fetch property data...",
        "Retrieving detailed property information and verifying the listing data...",
        "Analyzing local market trends, recent sales, and neighborhood dynamics...",
        "Searching for similar properties to establish accurate market comparisons...",
        "Connecting to Airbnb to find short-term rental data in your area...",
        "Calculating seasonal occupancy patterns and revenue projections...",
        "Running comprehensive financial models including ROI and cash flow analysis...",
        "Synthesizing all data points to generate actionable investment insights...",
        "Finalizing your personalized investment report with recommendations..."
      ];
      
      infoText.textContent = infoMessages[this.currentStep] || infoMessages[0];
    }
  }
  
  attachEventListeners() {
    const cancelBtn = this.container.querySelector('#cancel-analysis-btn');
    const retryBtn = this.container.querySelector('#retry-analysis-btn');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.handleCancel());
    }
    
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.handleRetry());
    }
  }
  
  handleCancel() {
    this.cancelled = true;
    this.stopProgress();
    this.stopTimeout();
    
    if (confirm('Are you sure you want to cancel the analysis?')) {
      this.options.onCancel();
    } else {
      this.cancelled = false;
      this.startProgress();
      this.startTimeout();
    }
  }
  
  handleTimeout() {
    this.timedOut = true;
    this.stopProgress();
    
    // Show timeout message
    const infoBox = this.container.querySelector('.bg-gradient-to-br.from-blue-50');
    if (infoBox) {
      infoBox.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-red-900 mb-1">Analysis Timeout</h3>
            <p class="text-sm text-red-700">
              The analysis is taking longer than expected. This might be due to high server load.
              Please try again or contact support if the issue persists.
            </p>
          </div>
        </div>
      `;
    }
    
    // Show retry button, hide cancel button
    const cancelBtn = this.container.querySelector('#cancel-analysis-btn');
    const retryBtn = this.container.querySelector('#retry-analysis-btn');
    
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (retryBtn) retryBtn.classList.remove('hidden');
    
    this.options.onTimeout();
  }
  
  handleRetry() {
    this.options.onRetry();
  }
  
  updateProgress(progress) {
    this.progress = Math.min(100, Math.max(0, progress));
    this.updateProgressDisplay();
  }
  
  complete() {
    this.stopProgress();
    this.stopTimeout();
    this.progress = 100;
    this.currentStep = this.steps.length - 1;
    this.updateProgressDisplay();
    this.updateStepDisplay();
  }
  
  destroy() {
    this.stopProgress();
    this.stopTimeout();
  }
}

// Helper function for global access
window.showAnalysisHelp = () => {
  alert('Need help? Contact support@starterpackapp.com or check our FAQ section.');
};