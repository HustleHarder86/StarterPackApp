import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { applyCorsHeaders } from '../../utils/cors-config.js';

import { apiLimits } from '../utils/rate-limiter.js';
// Initialize Firebase Admin if not already initialized
let db;
try {
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  db = getFirestore(app);
} catch (error) {
  // App already initialized
  db = getFirestore();
}

export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);

  // Handle OPTIONS request
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

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Note: Firebase Admin SDK doesn't directly support email/password authentication
    // This endpoint is designed to work with a client-side Firebase auth flow
    // The extension should use Firebase Auth client SDK to get the ID token

    // For now, we'll return an error directing to use client-side auth
    return res.status(400).json({ 
      error: 'Please use the web app to login first',
      message: 'Browser extension authentication requires logging in through the main application',
      loginUrl: 'https://investorprops.vercel.app/roi-finder.html'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}