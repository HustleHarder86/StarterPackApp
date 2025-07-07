# MCP Task: Frontend Updates for Railway Integration

## Objective
Update frontend code to use Railway API for heavy processing while keeping light operations on Vercel.

## Files to Update

### 1. Create API Configuration

**File: `utils/api-config.js`**
```javascript
const API_CONFIG = {
  // Railway API for heavy processing
  railway: {
    baseUrl: window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : 'https://starterpack-api.railway.app',
    endpoints: {
      analyzeProperty: '/analysis/property',
      strAnalysis: '/analysis/str',
      comparables: '/analysis/comparables',
      generateReport: '/reports/generate',
      jobStatus: '/jobs/:jobId/status'
    }
  },
  
  // Vercel API for light operations
  vercel: {
    baseUrl: '/api',
    endpoints: {
      userManagement: '/user-management',
      stripeWebhook: '/stripe-webhook',
      createCheckout: '/stripe-create-checkout',
      auth: '/auth-check'
    }
  }
};

// Helper function to build URLs
function buildUrl(service, endpoint, params = {}) {
  const config = API_CONFIG[service];
  let url = config.baseUrl + config.endpoints[endpoint];
  
  // Replace parameters in URL
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
}
```

### 2. Create API Client with Progress Tracking

**File: `utils/api-client.js`**
```javascript
class StarterPackAPI {
  constructor() {
    this.listeners = new Map();
  }
  
  // Subscribe to progress updates
  onProgress(callback) {
    const id = Date.now();
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }
  
  // Emit progress to all listeners
  emitProgress(data) {
    this.listeners.forEach(callback => callback(data));
  }
  
  // Get auth token
  async getAuthToken() {
    const user = firebase.auth().currentUser;
    return user ? await user.getIdToken() : null;
  }
  
  // Generic Railway API call with job queuing
  async callRailwayAPI(endpoint, data, options = {}) {
    const token = await this.getAuthToken();
    
    // Submit job
    const response = await fetch(buildUrl('railway', endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    const { jobId, result } = await response.json();
    
    // If immediate result, return it
    if (result) return result;
    
    // Otherwise poll for job completion
    return this.pollJob(jobId, options.onProgress);
  }
  
  // Poll job status
  async pollJob(jobId, onProgress) {
    const maxAttempts = 120; // 2 minutes max
    const pollInterval = 1000; // 1 second
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(
        buildUrl('railway', 'jobStatus', { jobId })
      );
      
      const status = await response.json();
      
      // Update progress
      if (onProgress) {
        onProgress(status);
      }
      
      this.emitProgress({
        jobId,
        progress: status.progress,
        state: status.state,
        message: this.getProgressMessage(status)
      });
      
      // Check completion
      if (status.state === 'completed') {
        return status.result;
      }
      
      if (status.state === 'failed') {
        throw new Error(status.error || 'Job failed');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Job timeout - analysis took too long');
  }
  
  // Get human-readable progress message
  getProgressMessage(status) {
    const messages = {
      0: 'Starting analysis...',
      10: 'Validating property data...',
      20: 'Fetching market data...',
      40: 'Analyzing rental rates...',
      60: 'Calculating financials...',
      80: 'Generating insights...',
      90: 'Finalizing report...',
      100: 'Analysis complete!'
    };
    
    return messages[status.progress] || `Processing... ${status.progress}%`;
  }
  
  // Specific API methods
  async analyzeProperty(propertyData) {
    return this.callRailwayAPI('analyzeProperty', { propertyData });
  }
  
  async analyzeSTR(propertyData, location) {
    return this.callRailwayAPI('strAnalysis', { propertyData, location });
  }
  
  async getComparables(location, filters) {
    return this.callRailwayAPI('comparables', { location, filters });
  }
  
  async generateReport(analysisId, format = 'pdf') {
    return this.callRailwayAPI('generateReport', { analysisId, format });
  }
  
  // Vercel API calls (unchanged)
  async updateUser(updates) {
    const response = await fetch(buildUrl('vercel', 'userManagement'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify(updates)
    });
    
    return response.json();
  }
}

// Export singleton instance
const apiClient = new StarterPackAPI();
```

### 3. Update roi-finder.html

**Changes needed:**

1. **Add Progress Modal**
```html
<!-- Add to HTML -->
<div id="analysisProgressModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
  <div class="bg-white rounded-lg p-8 max-w-md w-full">
    <h3 class="text-xl font-bold mb-4">Analyzing Property</h3>
    <div class="mb-4">
      <div class="bg-gray-200 rounded-full h-4 overflow-hidden">
        <div id="progressBar" class="bg-primary h-full transition-all duration-500" style="width: 0%"></div>
      </div>
    </div>
    <p id="progressMessage" class="text-gray-600 text-center">Starting analysis...</p>
    <p class="text-sm text-gray-500 text-center mt-4">This may take 30-60 seconds</p>
  </div>
</div>
```

2. **Update JavaScript to use new API client**
```javascript
// Replace direct fetch with API client
async function analyzeProperty() {
  const modal = document.getElementById('analysisProgressModal');
  const progressBar = document.getElementById('progressBar');
  const progressMessage = document.getElementById('progressMessage');
  
  try {
    // Show progress modal
    modal.classList.remove('hidden');
    
    // Set up progress listener
    const unsubscribe = apiClient.onProgress(({ progress, message }) => {
      progressBar.style.width = `${progress}%`;
      progressMessage.textContent = message;
    });
    
    // Call Railway API
    const analysis = await apiClient.analyzeProperty(propertyData);
    
    // Clean up
    unsubscribe();
    modal.classList.add('hidden');
    
    // Display results
    displayAnalysisResults(analysis);
    
  } catch (error) {
    modal.classList.add('hidden');
    showError(error.message);
  }
}
```

### 4. Update Extension Popup

**File: `extension/popup.js`**

Update to use Railway API:
```javascript
// When user clicks analyze
async function sendToAnalysis(propertyData) {
  try {
    // Store in extension storage for progress tracking
    await chrome.storage.local.set({ 
      pendingAnalysis: {
        propertyData,
        timestamp: Date.now()
      }
    });
    
    // Open app with job tracking
    const appUrl = new URL('https://starterpackapp.vercel.app/roi-finder.html');
    appUrl.searchParams.set('autoAnalyze', 'true');
    appUrl.searchParams.set('source', 'extension');
    
    chrome.tabs.create({ url: appUrl.toString() });
    
  } catch (error) {
    console.error('Failed to start analysis:', error);
  }
}
```

### 5. Add Environment Detection

**Update all HTML files to include:**
```html
<script>
  // Environment configuration
  window.ENV = {
    isProduction: window.location.hostname === 'starterpackapp.vercel.app',
    railwayUrl: window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : 'https://starterpack-api.railway.app',
    enableProgressTracking: true
  };
</script>
```

### 6. Update Error Handling

**Create `utils/error-handler.js`:**
```javascript
class ErrorHandler {
  static handle(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    // Check for specific error types
    if (error.message.includes('timeout')) {
      this.showTimeoutError();
    } else if (error.message.includes('rate limit')) {
      this.showRateLimitError();
    } else if (error.status === 401) {
      this.showAuthError();
    } else {
      this.showGenericError(error.message);
    }
    
    // Log to analytics
    analytics.track('error', {
      context,
      message: error.message,
      stack: error.stack
    });
  }
  
  static showTimeoutError() {
    showNotification({
      type: 'error',
      title: 'Analysis Timeout',
      message: 'The analysis is taking longer than expected. Please try again or contact support.',
      actions: [
        { label: 'Try Again', onClick: () => location.reload() },
        { label: 'Contact Support', onClick: () => openSupport() }
      ]
    });
  }
  
  static showRateLimitError() {
    showNotification({
      type: 'warning',
      title: 'Rate Limit Reached',
      message: 'You have reached your analysis limit. Upgrade to Pro for unlimited analyses.',
      actions: [
        { label: 'Upgrade Now', onClick: () => openPricing() }
      ]
    });
  }
}
```

## Testing Plan

### 1. Local Testing
```bash
# Run Railway API locally
cd railway-api && npm run dev

# Update frontend to use localhost
# Test all workflows
```

### 2. Staging Testing
- Deploy Railway API to staging
- Update staging frontend to use Railway
- Test with real data
- Verify progress tracking
- Check error handling

### 3. Production Rollout
- Use feature flags for gradual rollout
- Monitor error rates
- Track performance metrics
- Be ready to rollback

## Rollback Strategy

1. **Environment Variable Switch**
```javascript
const USE_RAILWAY = window.ENV.useRailway ?? true;

if (USE_RAILWAY) {
  return apiClient.analyzeProperty(data);
} else {
  return legacyAnalyzeProperty(data);
}
```

2. **Quick Disable**
- Set `USE_RAILWAY=false` in Vercel
- Redeploy (instant)
- All traffic returns to Vercel functions

## Success Metrics

- [ ] All API calls successfully migrated
- [ ] Progress tracking working smoothly
- [ ] Error handling improved
- [ ] No increase in error rates
- [ ] User satisfaction maintained