import { applyCorsHeaders } from '../../utils/cors-config.js';

import { apiLimits } from '../utils/rate-limiter.js';
export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);
  // CORS headers
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    apiLimits.read(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables (safely, without exposing full keys)
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    perplexityApiKey: {
      exists: !!perplexityKey,
      startsWithPplx: perplexityKey ? perplexityKey.startsWith('pplx-') : false,
      length: perplexityKey ? perplexityKey.length : 0,
      preview: perplexityKey ? `${perplexityKey.substring(0, 10)}...` : 'NOT SET'
    },
    openaiApiKey: {
      exists: !!openaiKey,
      startsWithSk: openaiKey ? openaiKey.startsWith('sk-') : false,
      length: openaiKey ? openaiKey.length : 0,
      preview: openaiKey ? `${openaiKey.substring(0, 7)}...` : 'NOT SET'
    },
    otherEnvVars: {
      firebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      firebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      firebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
    }
  };

  return res.status(200).json(debugInfo);
}