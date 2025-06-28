// Background service worker for StarterPackApp extension

// Configuration
const API_ENDPOINTS = {
  development: 'http://localhost:3000/api/properties/ingest',
  production: 'https://starterpackapp.vercel.app/api/properties/ingest'
};

// Get current environment
const isDevelopment = chrome.runtime.getManifest().version.includes('dev');
const API_URL = isDevelopment ? API_ENDPOINTS.development : API_ENDPOINTS.production;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeProperty') {
    handlePropertyAnalysis(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Handle property analysis
async function handlePropertyAnalysis(propertyData) {
  try {
    // Get user auth token from storage
    const { authToken } = await chrome.storage.local.get('authToken');
    
    if (!authToken) {
      // Open popup to prompt login
      chrome.action.openPopup();
      throw new Error('Please login to StarterPackApp first');
    }

    // Send property data to API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        propertyData,
        source: 'browser_extension',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze property');
    }

    const result = await response.json();
    
    // Open analysis in new tab
    if (result.analysisId) {
      const appUrl = isDevelopment 
        ? `http://localhost:3000/roi-finder.html?analysisId=${result.analysisId}`
        : `https://starterpackapp.vercel.app/roi-finder.html?analysisId=${result.analysisId}`;
      
      chrome.tabs.create({ url: appUrl });
    }

    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page on install
    chrome.tabs.create({
      url: 'https://starterpackapp.vercel.app/extension-welcome.html'
    });
  }
});

// Listen for auth updates from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateAuth') {
    chrome.storage.local.set({ authToken: request.token }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'logout') {
    chrome.storage.local.remove('authToken', () => {
      sendResponse({ success: true });
    });
    return true;
  }
});