// Server-side environment injection endpoint
// This endpoint provides environment configuration to the frontend

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/javascript');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Create JavaScript that sets window configuration
  const envScript = `
// Injected environment configuration
window.FIREBASE_CONFIG = {
  apiKey: "${process.env.VITE_FIREBASE_API_KEY || ''}",
  authDomain: "${process.env.VITE_FIREBASE_AUTH_DOMAIN || ''}",
  projectId: "${process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || ''}",
  storageBucket: "${process.env.VITE_FIREBASE_STORAGE_BUCKET || ''}",
  messagingSenderId: "${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}",
  appId: "${process.env.VITE_FIREBASE_APP_ID || ''}"
};

window.RAILWAY_URL = "${process.env.RAILWAY_API_URL || 'https://real-estate-app-production-ba5c.up.railway.app'}";
window.VERCEL_URL = "${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''}";
window.STRIPE_KEY = "${process.env.VITE_STRIPE_PUBLISHABLE_KEY || ''}";

// Log in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('Environment configuration injected from server');
}
`;
  
  res.status(200).send(envScript);
};