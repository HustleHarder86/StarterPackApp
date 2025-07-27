import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { cacheable, cacheKeys } from '../../utils/cache-manager.js';
import { loggers } from '../../utils/logger.js';
import { Timer } from '../../utils/performance-monitor.js';

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
  const timer = new Timer('api.properties.list');
  const logger = loggers.api.child('properties-list');
  // Apply proper CORS headers
  applyCorsHeaders(req, res);
  // Set CORS headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
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
      logger.error('Token verification failed', { error });
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const userId = decodedToken.uid;
    logger.info('Fetching properties', { userId });

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

    // Create cache key including query params
    const cacheKey = `${cacheKeys.userProperties(userId)}:${sortBy}:${sortOrder}:${filter}:${limit}:${offset}`;
    
    // Try to get from cache
    const result = await cacheable(cacheKey, async () => {
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
        // Handle Firestore 'in' query limitation (max 10)
        const chunks = [];
        for (let i = 0; i < propertyIds.length; i += 10) {
          chunks.push(propertyIds.slice(i, i + 10));
        }
        
        const analysesPromises = chunks.map(chunk => 
          db.collection('analyses')
            .where('userId', '==', userId)
            .where('propertyId', 'in', chunk)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get()
        );
        
        const analysesSnapshots = await Promise.all(analysesPromises);
        
        analysesSnapshots.forEach(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data();
            recentAnalyses.push({
              id: doc.id,
              propertyId: data.propertyId,
              analysisType: data.analysisType,
              overallScore: data.overallScore,
              createdAt: data.createdAt
            });
          });
        });
        
        // Sort and limit after combining
        recentAnalyses = recentAnalyses
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
      }
      
      return {
        properties,
        recentAnalyses,
        totalCount
      };
    }, 300); // Cache for 5 minutes

    timer.end({ 
      success: true, 
      count: result.properties.length,
      cached: !!result._cached 
    });
    
    logger.info('Properties returned', {
      userId,
      count: result.properties.length,
      cached: !!result._cached
    });

    // Return response
    return res.status(200).json({
      success: true,
      properties: result.properties,
      recentAnalyses: result.recentAnalyses,
      pagination: {
        total: result.totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.properties.length < result.totalCount
      }
    });

  } catch (error) {
    timer.end({ success: false, error: error.name });
    logger.error('Failed to fetch properties', { 
      error,
      userId: req.headers.authorization ? 'present' : 'missing'
    });
    
    return res.status(500).json({ 
      error: 'Failed to fetch properties',
      details: error.message 
    });
  }
}