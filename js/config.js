// API Configuration for StarterPackApp
const API_CONFIG = {
  // Railway API endpoints
  RAILWAY_API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' // Local Railway API
    : 'https://real-estate-app-production-ba5c.up.railway.app', // Production Railway API
  
  // API endpoints
  endpoints: {
    // Property Analysis (Railway)
    analyzeProperty: '/api/analysis/property',
    
    // STR Analysis (Railway)
    strAnalyze: '/api/analysis/str/analyze',
    strComparables: '/api/analysis/str/comparables',
    strRegulations: '/api/analysis/str/regulations',
    
    // Job Status (Railway)
    jobStatus: '/api/jobs/{jobId}/status',
    
    // Reports (Railway)
    generateReport: '/api/reports/generate',
    downloadReport: '/api/reports/download/{reportId}',
    
    // Legacy endpoints (Vercel - for backward compatibility)
    submitLead: '/api/submit-lead',
    submitContact: '/api/submit-contact'
  },
  
  // Helper function to build full URL
  getUrl: function(endpoint, params = {}) {
    let url = this.endpoints[endpoint];
    
    // Replace path parameters
    Object.keys(params).forEach(key => {
      url = url.replace(`{${key}}`, params[key]);
    });
    
    // Use Railway API for analysis endpoints
    if (endpoint.includes('analyze') || endpoint.includes('str') || 
        endpoint.includes('job') || endpoint.includes('report')) {
      return this.RAILWAY_API_URL + url;
    }
    
    // Use current origin for legacy Vercel endpoints
    return url;
  },
  
  // Helper function for authenticated requests
  authHeaders: function(token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}