// api/user-management-enhanced.js
// Enhanced user management with STR trial tracking

import { applyCorsHeaders } from '../utils/cors-config.js';

import { apiLimits } from '../utils/rate-limiter.js';
export default async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }


  // Apply rate limiting
  await new Promise((resolve, reject) => {
    apiLimits.properties(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  const adminModule = await import('firebase-admin');
  const admin = adminModule.default;
  
  // Initialize Firebase Admin if not already initialized
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

  try {
    // Handle authentication
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }

    if (req.method === 'POST') {
      const { action, data } = req.body;
      
      // Use userId from auth token if available, otherwise from request body
      const targetUserId = userId || req.body.userId;

      switch (action) {
        case 'check_analysis_limit':
          // Check if user can perform analysis
          const userDoc = await db.collection('users').doc(targetUserId).get();
          if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
          }

          const userData = userDoc.data();
          const now = new Date();

          // Check trial expiration
          if (userData.trialEndsAt && userData.trialEndsAt.toDate() < now) {
            return res.status(200).json({
              canAnalyze: false,
              reason: 'trial_expired',
              trialEnded: true
            });
          }

          // Check monthly limit
          const currentLimit = userData.monthlyAnalysisLimit || 3;
          const currentCount = userData.monthlyAnalysisCount || 0;

          return res.status(200).json({
            canAnalyze: currentCount < currentLimit,
            currentCount,
            limit: currentLimit,
            trialActive: userData.trialEndsAt ? userData.trialEndsAt.toDate() > now : false,
            subscriptionStatus: userData.subscriptionStatus || 'trial'
          });

        case 'check_str_access':
          // Check if user can access STR analysis
          const strUserDoc = await db.collection('users').doc(targetUserId).get();
          if (!strUserDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
          }

          const strUserData = strUserDoc.data();
          const isPro = strUserData.subscriptionTier === 'pro' || strUserData.subscriptionTier === 'enterprise';
          const strTrialUsed = strUserData.strTrialUsed || 0;
          const strTrialRemaining = Math.max(0, 5 - strTrialUsed);

          return res.status(200).json({
            canUseSTR: isPro || strTrialRemaining > 0,
            isPro,
            strTrialUsed,
            strTrialRemaining,
            subscriptionTier: strUserData.subscriptionTier || 'free'
          });

        case 'use_str_trial':
          // Increment STR trial usage
          if (!targetUserId) {
            return res.status(400).json({ error: 'User ID required' });
          }

          const strTrialDoc = await db.collection('users').doc(targetUserId).get();
          if (!strTrialDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
          }

          const strTrialData = strTrialDoc.data();
          const currentStrTrialUsed = strTrialData.strTrialUsed || 0;
          
          if (currentStrTrialUsed >= 5) {
            return res.status(400).json({ 
              error: 'STR trial limit exceeded',
              strTrialUsed: currentStrTrialUsed,
              strTrialRemaining: 0
            });
          }

          await db.collection('users').doc(targetUserId).update({
            strTrialUsed: admin.firestore.FieldValue.increment(1),
            lastSTRAnalysis: admin.firestore.FieldValue.serverTimestamp()
          });

          return res.status(200).json({ 
            success: true,
            strTrialUsed: currentStrTrialUsed + 1,
            strTrialRemaining: Math.max(0, 4 - currentStrTrialUsed)
          });

        case 'update_analysis_count':
          await db.collection('users').doc(targetUserId).update({
            monthlyAnalysisCount: admin.firestore.FieldValue.increment(1),
            lastAnalysisDate: admin.firestore.FieldValue.serverTimestamp()
          });

          return res.status(200).json({ success: true });

        case 'update_subscription':
          const { tier } = data;
          await db.collection('users').doc(targetUserId).update({
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            // Reset STR trial if upgrading to Pro
            ...(tier === 'pro' ? { strAnalysisEnabled: true } : {})
          });

          return res.status(200).json({ success: true });

        case 'get_user_stats':
          // Get comprehensive user statistics
          const statsDoc = await db.collection('users').doc(targetUserId).get();
          if (!statsDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
          }

          const statsData = statsDoc.data();
          
          // Get analysis count for this month
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const analysesSnapshot = await db.collection('analyses')
            .where('userId', '==', targetUserId)
            .where('createdAt', '>=', startOfMonth.toISOString())
            .get();

          const propertySnapshot = await db.collection('properties')
            .where('userId', '==', targetUserId)
            .get();

          return res.status(200).json({
            user: {
              id: statsDoc.id,
              ...statsData
            },
            stats: {
              monthlyAnalysisCount: analysesSnapshot.size,
              totalProperties: propertySnapshot.size,
              strTrialUsed: statsData.strTrialUsed || 0,
              strTrialRemaining: Math.max(0, 5 - (statsData.strTrialUsed || 0))
            }
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } else if (req.method === 'GET') {
      // Get user profile
      const queryUserId = req.query.userId || userId;
      
      if (!queryUserId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const userDoc = await db.collection('users').doc(queryUserId).get();
      
      if (!userDoc.exists) {
        // Create user document if it doesn't exist
        const newUserData = {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          monthlyAnalysisCount: 0,
          monthlyAnalysisLimit: 5,
          strTrialUsed: 0,
          strAnalysisEnabled: false
        };

        await db.collection('users').doc(queryUserId).set(newUserData);
        
        return res.status(200).json({
          user: {
            id: queryUserId,
            ...newUserData,
            createdAt: new Date().toISOString()
          }
        });
      }

      const userData = userDoc.data();
      
      return res.status(200).json({
        user: {
          id: userDoc.id,
          ...userData,
          strTrialRemaining: Math.max(0, 5 - (userData.strTrialUsed || 0))
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('User management error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}