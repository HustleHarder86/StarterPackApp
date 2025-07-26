// api/submit-analysis.js
// Handle demo analysis submissions from ROI Finder

const { applyCorsHeaders } = require('../utils/cors-config.js');
const { optionalAuth } = require('../utils/auth-middleware-cjs.js');

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
    // Optional authentication - allows both authenticated and unauthenticated submissions
    await optionalAuth(req, res, () => {});
    
    const { name, email, address } = req.body;

    if (!name || !email || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Initialize Firebase Admin
    const adminModule = await import('firebase-admin');
    const admin = adminModule.default;
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }

    const db = admin.firestore();

    // Save lead information with user context if available
    const leadId = `lead_${Date.now()}`;
    const leadData = {
      name,
      email,
      propertyAddress: address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'demo_analysis',
      source: 'roi_finder'
    };
    
    // Add user ID if authenticated
    if (req.user) {
      leadData.userId = req.user.uid;
      leadData.userEmail = req.user.email;
    }
    
    await db.collection('leads').doc(leadId).set(leadData);

    // For demo purposes, we'll return success immediately
    // The actual analysis will be triggered from the frontend
    return res.status(200).json({ 
      success: true,
      message: 'Analysis request received',
      leadId
    });

  } catch (error) {
    console.error('Submit analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request', 
      details: error.message 
    });
  }
}
