// api/config.js
// Public configuration endpoint for client-side access
// This safely exposes only non-sensitive configuration values

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only expose client-safe configuration
  // Using hardcoded values that match portfolio.html for consistency
  const publicConfig = {
    firebase: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBvVaw35Gzl98MOrclJaCCC0jcHzJLqkwc",
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "rental-roi-calculator-ddce2.firebaseapp.com",
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "rental-roi-calculator-ddce2",
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "rental-roi-calculator-ddce2.appspot.com",
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1034879055851",
      appId: process.env.VITE_FIREBASE_APP_ID || "1:1034879055851:web:2dd56a7e05a3154dcbac88"
    },
    stripe: {
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY
    },
    app: {
      environment: process.env.NODE_ENV || 'development',
      apiUrl: process.env.VITE_API_URL || '/api'
    }
  };

  // Set cache headers (cache for 5 minutes in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  } else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }

  return res.status(200).json(publicConfig);
}

// For static HTML files, use this pattern:
/*
<script>
  // Load configuration from API
  async function loadConfig() {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      
      // Initialize Firebase
      firebase.initializeApp(config.firebase);
      
      // Initialize Stripe
      const stripe = Stripe(config.stripe.publishableKey);
      
      return config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      throw error;
    }
  }
  
  // Use in your app
  loadConfig().then(config => {
    // Your app initialization code here
  });
</script>
*/
