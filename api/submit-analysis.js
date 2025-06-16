// api/submit-analysis.js
// Handle demo analysis submissions from ROI Finder

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Save lead information
    const leadId = `lead_${Date.now()}`;
    await db.collection('leads').doc(leadId).set({
      name,
      email,
      propertyAddress: address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'demo_analysis',
      source: 'roi_finder'
    });

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
