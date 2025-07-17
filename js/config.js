// Note: API_CONFIG is now defined in /utils/api-config.js
// This file contains other configuration settings

// Helper function for authenticated requests
function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Firebase configuration (loaded from environment)
const firebaseConfig = window.ENV?.firebase || {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Feature flags
const features = {
  strAnalysis: true,
  pdfReports: true,
  subscriptions: true,
  extensionIntegration: true
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { authHeaders, firebaseConfig, features };
}