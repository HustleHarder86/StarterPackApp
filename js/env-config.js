// Environment configuration injected at runtime
// This file sets up window.ENV with proper values for production

(function() {
  // Determine if we're in production based on hostname
  const isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.includes('localhost');
  
  // Set up window.ENV with configuration
  window.ENV = {
    // Environment flag
    production: isProduction,
    
    // Firebase configuration (will be replaced by server-side injection in production)
    firebase: {
      apiKey: window.FIREBASE_CONFIG?.apiKey || "AIzaSyBxDoyshPw1eHNu-WIWzWVdM9c2xOxW1TQ",
      authDomain: window.FIREBASE_CONFIG?.authDomain || "starterpackapp-8f26b.firebaseapp.com",
      projectId: window.FIREBASE_CONFIG?.projectId || "starterpackapp-8f26b",
      storageBucket: window.FIREBASE_CONFIG?.storageBucket || "starterpackapp-8f26b.appspot.com",
      messagingSenderId: window.FIREBASE_CONFIG?.messagingSenderId || "488947300523",
      appId: window.FIREBASE_CONFIG?.appId || "1:488947300523:web:2e0c858fac86fa8e2db3f2"
    },
    
    // API URLs
    railwayUrl: window.RAILWAY_URL || 'https://real-estate-app-production-ba5c.up.railway.app',
    vercelUrl: window.VERCEL_URL || (isProduction ? 'https://starter-pack-app.vercel.app' : ''),
    
    // Feature flags
    useRailway: true,  // Always use Railway for heavy processing
    debugMode: !isProduction,
    
    // Stripe configuration (optional)
    stripe: {
      publishableKey: window.STRIPE_KEY || null
    }
  };
  
  // Helper function to get API base URL
  window.getAPIBaseUrl = function() {
    if (window.ENV.production) {
      return '/api';  // Use relative path in production (Vercel handles routing)
    }
    return 'http://localhost:3000/api';
  };
  
  // Helper function to get Railway API URL
  window.getRailwayAPIUrl = function() {
    return window.ENV.railwayUrl;
  };
  
  // Log configuration in development
  if (!window.ENV.production) {
    console.log('Environment configuration loaded:', {
      production: window.ENV.production,
      railwayUrl: window.ENV.railwayUrl,
      firebase: window.ENV.firebase ? 'configured' : 'missing'
    });
  }
})();