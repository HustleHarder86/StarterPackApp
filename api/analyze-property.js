// api/analyze-property.js
// Proxy to Railway API for heavy property analysis processing

const { applyCorsHeaders } = require('../utils/cors-config.js');

module.exports = async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Vercel Proxy] Forwarding property analysis request to Railway API');
    
    // Get Railway API URL from environment
    const railwayUrl = process.env.RAILWAY_API_URL || 'https://real-estate-app-production-ba5c.up.railway.app';
    const endpoint = `${railwayUrl}/api/analysis/property`;
    
    console.log('[Vercel Proxy] Railway endpoint:', endpoint);
    
    // Forward the request to Railway
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth headers
        'Authorization': req.headers.authorization || '',
        // Add internal API key if configured
        ...(process.env.RAILWAY_API_KEY && {
          'X-API-Key': process.env.RAILWAY_API_KEY
        })
      },
      body: JSON.stringify(req.body)
    });

    // Get the response data
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Vercel Proxy] Railway API error:', response.status, data);
      return res.status(response.status).json(data);
    }
    
    console.log('[Vercel Proxy] Successfully received analysis from Railway');
    
    // Return the Railway response
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('[Vercel Proxy] Error forwarding to Railway:', error);
    return res.status(500).json({ 
      error: 'Failed to process property analysis',
      details: error.message 
    });
  }
};