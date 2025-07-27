import { applyCorsHeaders } from '../../utils/cors-config.js';

import { apiLimits } from '../utils/rate-limiter.js';
// File: api/submit-lead.js
// Enhanced version with detailed logging

export default async function handler(req, res) {
  console.log('=== Submit Lead API Called ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
  // Apply proper CORS headers
  
  applyCorsHeaders(req, res);
  // Set CORS headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request, returning 200');
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

  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, address } = req.body;
    console.log('Extracted data:', { name, email, address });

    if (!name || !email) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing name or email' });
    }

    console.log('Environment variables check:');
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'EXISTS' : 'MISSING');
    console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'EXISTS' : 'MISSING');
    console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'EXISTS (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'MISSING');

    // Initialize Firebase Admin
    console.log('Importing Firebase Admin...');
    const adminModule = await import('firebase-admin');
    const admin = adminModule.default;
    console.log('Firebase Admin imported successfully');
    
    if (!admin.apps.length) {
      console.log('Initializing Firebase Admin...');
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
        console.log('Firebase Admin initialized successfully');
      } catch (initError) {
        console.error('Firebase Admin initialization error:', initError);
        throw initError;
      }
    } else {
      console.log('Firebase Admin already initialized');
    }

    console.log('Getting Firestore database...');
    const db = admin.firestore();
    console.log('Firestore database obtained');

    // Save lead information to Firebase
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const leadData = {
      name,
      email,
      propertyAddress: address || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new',
      source: 'homepage_form',
      leadType: 'free_trial_request'
    };

    console.log('Attempting to save lead with ID:', leadId);
    console.log('Lead data:', leadData);

    await db.collection('leads').doc(leadId).set(leadData);
    console.log('✅ Lead saved to Firebase successfully:', leadId);

    return res.status(200).json({ 
      success: true,
      message: 'Lead captured successfully',
      leadId 
    });

  } catch (error) {
    console.error('❌ Submit lead error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      error: 'Failed to save lead', 
      details: error.message,
      errorType: error.name
    });
  }
}
