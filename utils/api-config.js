// API Configuration for StarterPackApp
// Manages both Vercel (light operations) and Railway (heavy processing) endpoints

const API_CONFIG = {
  // Railway API for heavy processing
  railway: {
    baseUrl: window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : (window.ENV?.railwayUrl || 'https://real-estate-app-production-ba5c.up.railway.app'),
    endpoints: {
      analyzeProperty: '/api/analysis/property',
      strAnalysis: '/api/analysis/str',
      comparables: '/api/analysis/comparables',
      generateReport: '/api/reports/generate',
      downloadReport: '/api/reports/download/:reportId',
      jobStatus: '/api/jobs/:jobId/status'
    }
  },
  
  // Vercel API for light operations
  vercel: {
    baseUrl: '/api',
    endpoints: {
      userManagement: '/user-management',
      stripeWebhook: '/stripe-webhook',
      createCheckout: '/stripe-create-checkout',
      cancelSubscription: '/stripe-cancel-subscription',
      properties: '/properties/list',
      propertyIngest: '/properties/ingest'
    }
  }
};

// Helper function to build URLs with parameter replacement
function buildUrl(service, endpoint, params = {}) {
  const config = API_CONFIG[service];
  if (!config) {
    throw new Error(`Unknown API service: ${service}`);
  }
  
  let url = config.baseUrl + (config.endpoints[endpoint] || endpoint);
  
  // Replace URL parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, encodeURIComponent(params[key]));
  });
  
  return url;
}

// Check if Railway API should be used (feature flag)
function shouldUseRailway() {
  // Can be controlled via environment variable or localStorage for testing
  if (typeof window !== 'undefined' && window.localStorage) {
    const override = localStorage.getItem('useRailwayAPI');
    if (override !== null) {
      return override === 'true';
    }
  }
  
  // Always use Railway for production or when ENV flag is set
  // Railway handles: STR analysis, heavy processing, external APIs
  return window.location.hostname !== 'localhost' || window.ENV?.useRailway === true;
}

// Export for use in other files
window.API_CONFIG = API_CONFIG;
window.buildUrl = buildUrl;
window.shouldUseRailway = shouldUseRailway;