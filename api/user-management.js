import { applyCorsHeaders } from '../../utils/cors-config.js';

import { apiLimits } from '../utils/rate-limiter.js';
// api/user-management.js
// User management API endpoint

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
    if (req.method === 'POST') {
      const { action, userId, data } = req.body;

      switch (action) {
        case 'check_analysis_limit':
          // Check if user can perform analysis
          const userDoc = await db.collection('users').doc(userId).get();
          if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
          }

          const userData = userDoc.data();
          const now = new Date();

          // Check trial expiration
          if (userData.subscriptionStatus === 'trial') {
            const trialEnd = userData.trialEndsAt.toDate();
            if (now > trialEnd) {
              return res.status(200).json({
                allowed: false,
                reason: 'trial_expired',
                message: 'Your free trial has expired. Please upgrade to continue.'
              });
            }
          }

          // Check subscription status
          if (userData.subscriptionStatus === 'cancelled' || userData.subscriptionStatus === 'past_due') {
            return res.status(200).json({
              allowed: false,
              reason: 'subscription_issue',
              message: 'Please update your subscription to continue.'
            });
          }

          // Check monthly limit
          if (userData.monthlyAnalysisLimit !== -1 && 
              userData.monthlyAnalysisCount >= userData.monthlyAnalysisLimit) {
            return res.status(200).json({
              allowed: false,
              reason: 'limit_reached',
              message: `You've reached your monthly limit of ${userData.monthlyAnalysisLimit} analyses.`
            });
          }

          return res.status(200).json({ allowed: true });

        case 'update_subscription':
          // Update user subscription
          const { tier, stripeCustomerId, stripeSubscriptionId } = data;
          
          await db.collection('users').doc(userId).update({
            subscriptionStatus: 'active',
            subscriptionTier: tier,
            stripeCustomerId,
            monthlyAnalysisLimit: {
              'starter': 100,
              'pro': 250,
              'enterprise': -1
            }[tier] || 100
          });

          await db.collection('subscriptions').doc(userId).set({
            stripeSubscriptionId,
            status: 'active',
            tier,
            currentPeriodStart: admin.firestore.FieldValue.serverTimestamp()
          });

          return res.status(200).json({ success: true });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } else if (req.method === 'GET') {
      // Get user profile
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        id: userDoc.id,
        ...userDoc.data()
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
