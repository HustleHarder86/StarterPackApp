// API Client for StarterPackApp
// Handles communication with both Vercel and Railway APIs

class StarterPackAPI {
  constructor() {
    this.listeners = new Map();
    this.activeJobs = new Map();
  }
  
  // Subscribe to progress updates
  onProgress(callback) {
    const id = Date.now() + Math.random();
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }
  
  // Emit progress to all listeners
  emitProgress(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Progress listener error:', error);
      }
    });
  }
  
  // Get Firebase auth token
  async getAuthToken() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn('Firebase not initialized');
      return null;
    }
    
    const user = firebase.auth().currentUser;
    return user ? await user.getIdToken() : null;
  }
  
  // Generic API call handler
  async apiCall(url, options = {}) {
    const token = await this.getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  // Railway API call with job queuing support
  async callRailwayAPI(endpoint, data = {}, options = {}) {
    if (!shouldUseRailway()) {
      // Fallback to Vercel API
      return this.callVercelAPI(endpoint, data, options);
    }
    
    const url = buildUrl('railway', endpoint);
    
    try {
      const response = await this.apiCall(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
      });
      
      // If immediate result, return it
      if (response.result || !response.jobId) {
        return response.result || response;
      }
      
      // Otherwise poll for job completion
      this.activeJobs.set(response.jobId, { endpoint, startTime: Date.now() });
      return this.pollJob(response.jobId, options.onProgress);
      
    } catch (error) {
      console.error('Railway API error:', error);
      throw error;
    }
  }
  
  // Poll job status until completion
  async pollJob(jobId, onProgress, maxAttempts = 120) {
    const pollInterval = 1000; // 1 second
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const url = buildUrl('railway', 'jobStatus', { jobId });
        const status = await this.apiCall(url, { method: 'GET' });
        
        // Update progress
        const progress = {
          jobId,
          state: status.state,
          progress: status.progress || 0,
          message: status.message || this.getProgressMessage(status.progress)
        };
        
        if (onProgress) {
          onProgress(progress);
        }
        
        this.emitProgress(progress);
        
        // Check completion
        if (status.state === 'completed') {
          this.activeJobs.delete(jobId);
          return status.result;
        }
        
        if (status.state === 'failed') {
          this.activeJobs.delete(jobId);
          throw new Error(status.error || 'Job failed');
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
        
      } catch (error) {
        this.activeJobs.delete(jobId);
        throw error;
      }
    }
    
    this.activeJobs.delete(jobId);
    throw new Error('Job timeout - analysis took too long');
  }
  
  // Get human-readable progress message
  getProgressMessage(progress) {
    const messages = {
      0: 'Starting analysis...',
      10: 'Validating property data...',
      20: 'Fetching market data from AI...',
      30: 'Analyzing rental rates...',
      40: 'Searching for comparables...',
      50: 'Calculating financial metrics...',
      60: 'Evaluating investment potential...',
      70: 'Generating recommendations...',
      80: 'Preparing insights...',
      90: 'Finalizing analysis...',
      100: 'Analysis complete!'
    };
    
    // Find closest message
    const progressKeys = Object.keys(messages).map(Number).sort((a, b) => a - b);
    const closest = progressKeys.reduce((prev, curr) => 
      Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev
    );
    
    return messages[closest];
  }
  
  // Vercel API calls (for light operations)
  async callVercelAPI(endpoint, data = {}, options = {}) {
    const url = buildUrl('vercel', endpoint);
    return this.apiCall(url, {
      method: options.method || 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }
  
  // Property Analysis (Heavy - Railway)
  async analyzeProperty(data) {
    // Forward all data to Railway API
    return this.callRailwayAPI('analyzeProperty', data, {
      onProgress: (progress) => {
        console.log('Analysis progress:', progress);
      }
    });
  }
  
  // STR Analysis (Heavy - Railway)
  async analyzeSTR(propertyData, location) {
    return this.callRailwayAPI('strAnalysis', { propertyData, location }, {
      onProgress: (progress) => {
        console.log('STR analysis progress:', progress);
      }
    });
  }
  
  // Get Comparables (Heavy - Railway)
  async getComparables(location, filters = {}) {
    return this.callRailwayAPI('comparables', { location, filters });
  }
  
  // Generate Report (Heavy - Railway)
  async generateReport(analysisId, format = 'pdf') {
    return this.callRailwayAPI('generateReport', { analysisId, format });
  }
  
  // User Management (Light - Vercel)
  async updateUser(updates) {
    return this.callVercelAPI('userManagement', updates);
  }
  
  // List Properties (Light - Vercel)
  async listProperties() {
    return this.callVercelAPI('properties', {}, { method: 'GET' });
  }
  
  // Ingest Property from Extension (Light - Vercel)
  async ingestProperty(propertyData) {
    return this.callVercelAPI('propertyIngest', { property: propertyData });
  }
  
  // Create Stripe Checkout (Light - Vercel)
  async createCheckout(priceId) {
    return this.callVercelAPI('createCheckout', { priceId });
  }
  
  // Cancel subscription
  async cancelSubscription() {
    return this.callVercelAPI('cancelSubscription', {});
  }
  
  // Cancel all active jobs
  cancelActiveJobs() {
    this.activeJobs.clear();
  }
}

// Create singleton instance
const apiClient = new StarterPackAPI();

// Export for use in other files
window.apiClient = apiClient;