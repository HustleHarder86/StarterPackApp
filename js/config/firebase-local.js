// Local Firebase configuration for development/testing
// This file provides fallback configuration when /api/config is not available

const LOCAL_FIREBASE_CONFIG = {
  firebase: {
    // Development/testing configuration
    // These are placeholder values for local testing
    apiKey: "AIzaSyDEVELOPMENT-KEY-NOT-FOR-PRODUCTION",
    authDomain: "starterpackapp-dev.firebaseapp.com",
    projectId: "starterpackapp-dev",
    storageBucket: "starterpackapp-dev.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef0123456789abcdef"
  },
  stripe: {
    publishableKey: "pk_test_DEVELOPMENT_KEY"
  },
  app: {
    environment: "development",
    apiUrl: "/api"
  }
};

// Export for use in development
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LOCAL_FIREBASE_CONFIG;
}