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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const decodedToken = await verifyToken(req);
    const userId = decodedToken.uid;

    const { analysisData, propertyData, saveOptions } = req.body;

    if (!analysisData || !propertyData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Create saved analysis document
    const savedAnalysis = {
      userId,
      propertyAddress: analysisData.property_address || propertyData.address,
      propertyData: {
        ...propertyData,
        price: propertyData.price || analysisData.property?.price,
        bedrooms: propertyData.bedrooms || analysisData.property?.bedrooms,
        bathrooms: propertyData.bathrooms || analysisData.property?.bathrooms,
        squareFeet: propertyData.sqft || analysisData.property?.squareFeet,
        propertyType: propertyData.propertyType || analysisData.property?.propertyType,
        image: propertyData.mainImage || analysisData.property?.image
      },
      analysisResults: {
        investmentScore: analysisData.investment_score || 0,
        recommendation: analysisData.recommendation || 'HOLD',
        monthlyRent: analysisData.long_term_rental?.monthly_rent || 0,
        cashFlow: analysisData.long_term_rental?.cash_flow || 0,
        capRate: analysisData.long_term_rental?.cap_rate || 0,
        roi: analysisData.long_term_rental?.roi || 0,
        strMonthlyRevenue: analysisData.strAnalysis?.monthlyRevenue || 0,
        strOccupancyRate: analysisData.strAnalysis?.occupancyRate || 0,
        betterStrategy: analysisData.comparison?.better_strategy || 'ltr',
        monthlyDifference: analysisData.comparison?.monthly_difference || 0
      },
      tags: saveOptions?.tags || [],
      notes: saveOptions?.notes || '',
      isFavorite: saveOptions?.isFavorite || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore
    const docRef = await db.collection('savedAnalyses').add(savedAnalysis);

    // Update user's analysis count
    await db.collection('users').doc(userId).update({
      savedAnalysesCount: admin.firestore.FieldValue.increment(1),
      lastActivity: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      analysisId: docRef.id,
      message: 'Analysis saved successfully'
    });

  } catch (error) {
    console.error('Error saving analysis:', error);
    return res.status(500).json({ 
      error: 'Failed to save analysis',
      details: error.message 
    });
  }
}