// Background service worker for StarterPack extension
console.log('[StarterPack Extension] Background service worker starting...');

// Configuration
const API_ENDPOINTS = {
  development: 'http://localhost:3000/api/properties/ingest-simple',
  production: 'https://starter-pack-app.vercel.app/api/properties/ingest-simple'
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
    // For now, skip auth check and go directly to analysis
    console.log('[StarterPack] Processing property data:', propertyData);
    
    // Build analysis URL with property data
    const queryParams = new URLSearchParams();
    
    // Add address components
    if (propertyData.address) {
      if (propertyData.address.street) queryParams.set('street', propertyData.address.street);
      if (propertyData.address.city) queryParams.set('city', propertyData.address.city);
      if (propertyData.address.province) queryParams.set('state', propertyData.address.province);
      if (propertyData.address.country) queryParams.set('country', propertyData.address.country);
      if (propertyData.address.postalCode) queryParams.set('postal', propertyData.address.postalCode);
    }
    
    // Add property details
    if (propertyData.price) queryParams.set('price', propertyData.price);
    if (propertyData.mlsNumber) queryParams.set('mlsNumber', propertyData.mlsNumber);
    if (propertyData.bedrooms) queryParams.set('bedrooms', propertyData.bedrooms);
    if (propertyData.bathrooms) queryParams.set('bathrooms', propertyData.bathrooms);
    if (propertyData.sqft) queryParams.set('sqft', propertyData.sqft);
    if (propertyData.propertyType) queryParams.set('propertyType', propertyData.propertyType);
    if (propertyData.yearBuilt) queryParams.set('yearBuilt', propertyData.yearBuilt);
    if (propertyData.propertyTaxes) queryParams.set('taxes', propertyData.propertyTaxes);
    if (propertyData.condoFees) queryParams.set('condoFees', propertyData.condoFees);
    
    queryParams.set('fromExtension', 'true');
    queryParams.set('autoAnalyze', 'true');
    
    const analysisUrl = `https://starter-pack-app.vercel.app/roi-finder.html?${queryParams.toString()}`;
    
    console.log('[StarterPack] Opening analysis URL:', analysisUrl);
    
    // Open analysis in new tab
    chrome.tabs.create({ url: analysisUrl });
    
    return { success: true, analysisUrl };
    
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
      url: 'https://starter-pack-app.vercel.app/extension-welcome.html'
    }).catch(error => {
      console.error('[StarterPack Extension] Failed to open welcome page:', error);
      // Store flag to show welcome message in popup instead
      chrome.storage.local.set({ showWelcome: true });
    });
  } else if (details.reason === 'update') {
    console.log('[StarterPack Extension] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Merge auth updates into main message listener above
// (Removed duplicate listener - auth actions are now handled in the main listener)