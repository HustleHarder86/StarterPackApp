// Health check endpoint for monitoring

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Check environment variables are set
  const envStatus = {
    firebase: !!(process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_PROJECT_ID),
    railway: !!process.env.RAILWAY_API_URL,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    airbnb: !!process.env.APIFY_API_TOKEN,
    stripe: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY
  };
  
  // Overall health status
  const isHealthy = envStatus.firebase && envStatus.railway && envStatus.perplexity && envStatus.airbnb;
  
  res.status(200).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    services: {
      vercel: 'healthy',
      firebase: envStatus.firebase ? 'configured' : 'missing',
      railway: envStatus.railway ? 'configured' : 'missing',
      perplexity: envStatus.perplexity ? 'configured' : 'missing',
      airbnb: envStatus.airbnb ? 'configured' : 'missing',
      stripe: envStatus.stripe ? 'configured' : 'optional'
    },
    version: '2.1.0'
  });
};