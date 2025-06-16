// File: api/submit-lead.js
// Updated to save leads to Firebase instead of Airtable

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

    if (!name || !email) {
      return res.status(400).json({ error: 'Missing name or email' });
    }

    // Initialize Firebase Admin
    const admin = await import('firebase-admin');
    
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

    await db.collection('leads').doc(leadId).set(leadData);

    console.log('Lead saved to Firebase:', leadId);

    return res.status(200).json({ 
      success: true,
      message: 'Lead captured successfully',
      leadId 
    });

  } catch (error) {
    console.error('Submit lead error:', error);
    return res.status(500).json({ 
      error: 'Failed to save lead', 
      details: error.message 
    });
  }
}
