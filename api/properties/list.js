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

  // Only allow GET
  if (req.method !== 'GET') {
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

    // Get query parameters
    const { 
      limit = 20, 
      offset = 0, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      filter = 'all' // all, analyzed, unanalyzed
    } = req.query;

    // Build query
    let query = db.collection('properties')
      .where('userId', '==', userId);

    // Apply filters
    if (filter === 'analyzed') {
      query = query.where('lastAnalyzed', '!=', null);
    } else if (filter === 'unanalyzed') {
      query = query.where('lastAnalyzed', '==', null);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    query = query.limit(parseInt(limit)).offset(parseInt(offset));

    // Execute query
    const snapshot = await query.get();
    
    // Format properties
    const properties = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      properties.push({
        id: doc.id,
        mlsNumber: data.mlsNumber,
        address: data.address,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft,
        propertyType: data.propertyType,
        createdAt: data.createdAt,
        lastAnalyzed: data.lastAnalyzed,
        analysisCount: data.analysisCount || 0,
        thumbnail: data.thumbnail || null
      });
    });

    // Get total count for pagination
    const countSnapshot = await db.collection('properties')
      .where('userId', '==', userId)
      .count()
      .get();
    
    const totalCount = countSnapshot.data().count;

    // Get user's recent analyses for these properties
    const propertyIds = properties.map(p => p.id);
    let recentAnalyses = [];
    
    if (propertyIds.length > 0) {
      const analysesSnapshot = await db.collection('analyses')
        .where('userId', '==', userId)
        .where('propertyId', 'in', propertyIds)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      analysesSnapshot.forEach(doc => {
        const data = doc.data();
        recentAnalyses.push({
          id: doc.id,
          propertyId: data.propertyId,
          analysisType: data.analysisType,
          overallScore: data.overallScore,
          createdAt: data.createdAt
        });
      });
    }

    // Return response
    return res.status(200).json({
      success: true,
      properties,
      recentAnalyses,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + properties.length < totalCount
      }
    });

  } catch (error) {
    console.error('Properties list error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch properties',
      details: error.message 
    });
  }
}