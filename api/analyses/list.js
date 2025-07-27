import { initializeFirebaseAdmin } from '../_lib/firebase-admin.js';
import { verifyToken } from '../_lib/auth-middleware.js';

import { applyCorsHeaders } from '../../utils/cors-config.js';
import { apiLimits } from '../utils/rate-limiter.js';
const { db } = initializeFirebaseAdmin();

export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);
  

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;

    // Get query parameters
    const { 
      limit = 20, 
      offset = 0, 
      sortBy = 'createdAt', 
      order = 'desc',
      filter = 'all' // all, favorites, buy, hold, sell
    } = req.query;

    // Build query
    let query = db.collection('savedAnalyses').where('userId', '==', userId);

    // Apply filters
    if (filter === 'favorites') {
      query = query.where('isFavorite', '==', true);
    } else if (filter === 'buy') {
      query = query.where('analysisResults.recommendation', '==', 'BUY');
    } else if (filter === 'hold') {
      query = query.where('analysisResults.recommendation', '==', 'HOLD');
    } else if (filter === 'sell') {
      query = query.where('analysisResults.recommendation', '==', 'SELL');
    }

    // Apply sorting
    query = query.orderBy(sortBy, order);

    // Apply pagination
    query = query.limit(parseInt(limit)).offset(parseInt(offset));

    // Execute query
    const snapshot = await query.get();
    
    const analyses = [];
    snapshot.forEach(doc => {
      analyses.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get total count for pagination
    const countSnapshot = await db.collection('savedAnalyses')
      .where('userId', '==', userId)
      .get();
    const totalCount = countSnapshot.size;

    return res.status(200).json({
      success: true,
      analyses,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error listing analyses:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve analyses',
      details: error.message 
    });
  }
}