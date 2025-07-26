// api/analyze-property-proxy.js
// Proxy endpoint that forwards heavy processing to Railway API

const { applyCorsHeaders } = require('../utils/cors-config.js');
const { authenticate } = require('../utils/auth-middleware-cjs.js');

// Railway API configuration
const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://real-estate-app-production-ba5c.up.railway.app';

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
    // Authenticate user
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('Proxying property analysis request to Railway API');
    console.log('Target URL:', `${RAILWAY_API_URL}/api/analysis/property`);
    
    // Forward the request to Railway
    const railwayResponse = await fetch(`${RAILWAY_API_URL}/api/analysis/property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        'X-User-Id': req.user?.uid || req.body.userId || 'anonymous',
        'X-User-Email': req.user?.email || req.body.userEmail || '',
        'X-Is-E2E-Test': req.isE2ETest ? 'true' : 'false'
      },
      body: JSON.stringify({
        ...req.body,
        userId: req.user?.uid || req.body.userId,
        userEmail: req.user?.email || req.body.userEmail,
        isE2ETest: req.isE2ETest
      })
    });

    // Check if Railway responded successfully
    if (!railwayResponse.ok) {
      const errorText = await railwayResponse.text();
      console.error('Railway API error:', railwayResponse.status, errorText);
      
      // Return appropriate error to client
      if (railwayResponse.status === 504) {
        return res.status(504).json({
          success: false,
          error: 'Analysis timed out',
          message: 'The property analysis is taking longer than expected. Please try again.'
        });
      }
      
      return res.status(railwayResponse.status).json({
        success: false,
        error: 'Analysis failed',
        message: errorText || 'An error occurred during property analysis'
      });
    }

    // Forward the successful response
    const analysisData = await railwayResponse.json();
    
    console.log('Successfully received analysis from Railway:', analysisData.analysisId);
    
    return res.status(200).json(analysisData);

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'The analysis service is temporarily unavailable. Please try again later.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Proxy failed',
      message: error.message || 'Failed to process property analysis'
    });
  }
};