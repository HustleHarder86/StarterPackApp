// Background service worker for StarterPack extension
console.log('[StarterPack Extension] Background service worker starting...');

// Configuration
const API_ENDPOINTS = {
  development: 'http://localhost:3000/api/properties/ingest-simple',
  production: 'https://starterpackapp.com/api/properties/ingest-simple'
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
    console.log('[StarterPack] Image URL:', propertyData.mainImage);
    
    // Build property data object for the new unified entry point
    const cleanPropertyData = {
      source: 'realtor.ca',
      url: propertyData.url,
      extractedAt: propertyData.extractedAt,
      
      // Address (ensure it's in the right format)
      address: typeof propertyData.address === 'string' 
        ? propertyData.address 
        : (propertyData.address?.full || 
           `${propertyData.address?.street || ''}, ${propertyData.address?.city || ''}, ${propertyData.address?.province || ''} ${propertyData.address?.postalCode || ''}`.trim()),
      
      // Property details
      price: propertyData.price,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      sqft: propertyData.sqft,
      propertyType: propertyData.propertyType,
      yearBuilt: propertyData.yearBuilt,
      propertyTaxes: propertyData.propertyTaxes,
      condoFees: propertyData.condoFees,
      mlsNumber: propertyData.mlsNumber,
      mainImage: propertyData.mainImage
    };
    
    // Use the new property analysis entry point
    const baseUrl = isDevelopment 
      ? 'http://localhost:3002/property-analysis.html' 
      : 'https://starterpackapp.com/property-analysis.html';
      
    const encodedData = encodeURIComponent(JSON.stringify(cleanPropertyData));
    const analysisUrl = `${baseUrl}?fromExtension=true&propertyData=${encodedData}`;
    
    console.log('[StarterPack] Opening analysis URL:', analysisUrl.substring(0, 100) + '...');
    console.log('[StarterPack] Property data includes image?', !!cleanPropertyData.mainImage);
    console.log('[StarterPack] Full URL length:', analysisUrl.length);
    console.log('[StarterPack] Property data size:', JSON.stringify(cleanPropertyData).length);
    
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
      url: 'https://starterpackapp.com/extension-welcome.html'
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