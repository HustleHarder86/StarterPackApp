// Background service worker for StarterPack extension
console.log('[StarterPack Extension] Background service worker starting...');

// Configuration
const API_ENDPOINTS = {
  development: 'http://localhost:3000/api/properties/ingest',
  production: 'https://starterpackapp.vercel.app/api/properties/ingest'
};

// Get current environment - check if extension ID matches production
const PRODUCTION_EXTENSION_ID = 'your-production-extension-id-here';
const isDevelopment = chrome.runtime.id !== PRODUCTION_EXTENSION_ID;
const API_URL = isDevelopment ? API_ENDPOINTS.development : API_ENDPOINTS.production;

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeProperty') {
    handlePropertyAnalysis(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
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

// Handle property analysis
async function handlePropertyAnalysis(propertyData) {
  try {
    // Get user auth token from storage
    const { authToken } = await chrome.storage.local.get('authToken');
    
    if (!authToken) {
      // Open popup to prompt login
      chrome.action.openPopup();
      throw new Error('Please login to StarterPack first');
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
  console.log('[StarterPack Extension] Installation event:', details.reason);
  if (details.reason === 'install') {
    // Open welcome page on install
    console.log('[StarterPack Extension] Opening welcome page...');
    chrome.tabs.create({
      url: 'https://starterpackapp.vercel.app/extension-welcome.html'
    });
  }
});

// Merge auth updates into main message listener above
// (Removed duplicate listener - auth actions are now handled in the main listener)