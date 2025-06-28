import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase auth token
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const userId = decodedToken.uid;

    // Extract property data from request
    const { propertyData, source, timestamp } = req.body;

    if (!propertyData) {
      return res.status(400).json({ error: 'Property data is required' });
    }

    // Validate required fields
    const requiredFields = ['address', 'price'];
    for (const field of requiredFields) {
      if (!propertyData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Check if property already exists for this user
    const existingQuery = await db.collection('properties')
      .where('userId', '==', userId)
      .where('mlsNumber', '==', propertyData.mlsNumber || '')
      .limit(1)
      .get();

    let propertyId;
    let isUpdate = false;

    if (!existingQuery.empty) {
      // Update existing property
      propertyId = existingQuery.docs[0].id;
      isUpdate = true;
      
      await db.collection('properties').doc(propertyId).update({
        ...propertyData,
        lastUpdated: new Date().toISOString(),
        updateCount: (existingQuery.docs[0].data().updateCount || 0) + 1
      });
    } else {
      // Create new property document
      const propertyDoc = {
        userId,
        source: source || 'browser_extension',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        updateCount: 0,
        
        // Property identification
        mlsNumber: propertyData.mlsNumber || null,
        url: propertyData.url || null,
        
        // Address information
        address: propertyData.address || {},
        
        // Property details
        price: propertyData.price || 0,
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        sqft: propertyData.sqft || 0,
        propertyType: propertyData.propertyType || 'residential',
        yearBuilt: propertyData.yearBuilt || null,
        
        // Financial details
        propertyTaxes: propertyData.taxes || 0,
        condoFees: propertyData.condoFees || 0,
        
        // Additional data
        description: propertyData.description || '',
        rawData: propertyData,
        
        // Analysis flags
        analysisRequested: false,
        lastAnalyzed: null
      };

      const docRef = await db.collection('properties').add(propertyDoc);
      propertyId = docRef.id;
    }

    // Update user's property count
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      await userRef.update({
        propertyCount: (userData.propertyCount || 0) + (isUpdate ? 0 : 1),
        lastActivity: new Date().toISOString()
      });
    }

    // Log the ingestion event
    await db.collection('activityLogs').add({
      userId,
      action: isUpdate ? 'property_updated' : 'property_created',
      propertyId,
      source: source || 'browser_extension',
      timestamp: new Date().toISOString(),
      metadata: {
        mlsNumber: propertyData.mlsNumber,
        address: propertyData.address?.full || propertyData.address?.street || 'Unknown'
      }
    });

    // Return success response
    return res.status(200).json({
      success: true,
      propertyId,
      isUpdate,
      message: isUpdate ? 'Property updated successfully' : 'Property created successfully',
      nextStep: `/roi-finder.html?propertyId=${propertyId}`
    });

  } catch (error) {
    console.error('Property ingestion error:', error);
    return res.status(500).json({ 
      error: 'Failed to process property data',
      details: error.message 
    });
  }
}