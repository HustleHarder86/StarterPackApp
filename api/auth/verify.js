import { applyCorsHeaders } from '../../utils/cors-config.js';

import { apiLimits } from '../utils/rate-limiter.js';
// Simple auth verification endpoint for the extension
export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);
  // Set CORS headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    apiLimits.auth(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // For now, just check if token exists and has proper format
    // In production, you'd verify with Firebase Admin
    if (token && token.length > 100) {
      // Basic JWT structure check
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          // Decode the payload (middle part)
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          return res.status(200).json({ 
            valid: true,
            user: {
              uid: payload.user_id || payload.sub,
              email: payload.email
            }
          });
        } catch (e) {
          return res.status(401).json({ error: 'Invalid token format' });
        }
      }
    }
    
    return res.status(401).json({ error: 'Invalid token' });
    
  } catch (error) {
    console.error('Auth verify error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}