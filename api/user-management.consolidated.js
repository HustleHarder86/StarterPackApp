/**
 * Consolidated User Management API Endpoint
 * Merges functionality from both versions:
 * - Base: Simple user management
 * - Enhanced: STR trial tracking and advanced features
 * 
 * Features controlled by action parameters
 */

import admin from 'firebase-admin';
import { applyCorsHeaders } from '../utils/cors-config.js';

// Initialize Firebase Admin (singleton pattern)
let adminInitialized = false;

function initializeAdmin() {
  if (!adminInitialized && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
    adminInitialized = true;
  }
  return admin;
}

/**
 * Main handler function
 */
export default async function handler(req, res) {
  // Apply CORS headers
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase Admin
    const adminInstance = initializeAdmin();
    const db = adminInstance.firestore();
    
    // Handle authentication if provided
    const userId = await authenticateUser(req, adminInstance);
    
    if (req.method === 'GET') {
      return handleGetRequest(req, res, db, userId);
    }
    
    if (req.method === 'POST') {
      return handlePostRequest(req, res, db, userId);
    }
    
  } catch (error) {
    console.error('[user-management] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Authenticate user from request
 */
async function authenticateUser(req, adminInstance) {
  const authHeader = req.headers.authorization;
  let userId = req.body?.userId || req.query?.userId;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminInstance.auth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Token verification failed:', error);
    }
  }
  
  return userId;
}

/**
 * Handle GET requests
 */
async function handleGetRequest(req, res, db, userId) {
  const { action } = req.query;
  
  switch (action) {
    case 'get_user_data':
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return getUserData(res, db, userId);
      
    case 'check_subscription':
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return checkSubscription(res, db, userId);
      
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

/**
 * Handle POST requests
 */
async function handlePostRequest(req, res, db, userId) {
  const { action, data } = req.body;
  
  // Use provided userId if not authenticated
  userId = userId || req.body.userId;
  
  switch (action) {
    case 'check_analysis_limit':
      return checkAnalysisLimit(res, db, userId);
      
    case 'increment_analysis_count':
      return incrementAnalysisCount(res, db, userId);
      
    case 'check_str_trial':
      return checkSTRTrial(res, db, userId);
      
    case 'use_str_trial':
      return useSTRTrial(res, db, userId);
      
    case 'update_subscription':
      return updateSubscription(res, db, userId, data);
      
    case 'create_user':
      return createUser(res, db, data);
      
    case 'update_user_profile':
      return updateUserProfile(res, db, userId, data);
      
    case 'log_activity':
      return logActivity(res, db, userId, data);
      
    case 'get_user_stats':
      return getUserStats(res, db, userId);
      
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

/**
 * Get user data
 */
async function getUserData(res, db, userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    return res.status(200).json({ 
      success: true, 
      data: userData 
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

/**
 * Check analysis limit
 */
async function checkAnalysisLimit(res, db, userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const now = new Date();

    // Check trial expiration
    if (userData.trialEndDate && new Date(userData.trialEndDate) < now) {
      return res.status(200).json({
        canAnalyze: false,
        reason: 'trial_expired',
        message: 'Your trial has expired. Please upgrade to continue.'
      });
    }

    // Check daily limit based on subscription tier
    const dailyLimit = getDailyLimit(userData.subscriptionTier);
    const analysisCount = userData.analysisCount || 0;
    const lastAnalysisDate = userData.lastAnalysisDate?.toDate();
    
    // Reset count if it's a new day
    const isNewDay = !lastAnalysisDate || 
      lastAnalysisDate.toDateString() !== now.toDateString();
    
    if (isNewDay) {
      await db.collection('users').doc(userId).update({
        analysisCount: 0,
        lastAnalysisDate: now
      });
      return res.status(200).json({
        canAnalyze: true,
        remainingAnalyses: dailyLimit
      });
    }

    // Check if limit reached
    if (analysisCount >= dailyLimit) {
      return res.status(200).json({
        canAnalyze: false,
        reason: 'daily_limit_reached',
        message: `Daily limit of ${dailyLimit} analyses reached. Resets at midnight.`
      });
    }

    return res.status(200).json({
      canAnalyze: true,
      remainingAnalyses: dailyLimit - analysisCount
    });

  } catch (error) {
    console.error('Error checking analysis limit:', error);
    throw error;
  }
}

/**
 * Check STR trial availability
 */
async function checkSTRTrial(res, db, userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const strTrialUsed = userData.strTrialUsed || 0;
    const maxTrials = 5;
    const subscriptionTier = userData.subscriptionTier || 'free';

    // Premium users have unlimited STR
    if (subscriptionTier === 'premium' || subscriptionTier === 'professional') {
      return res.status(200).json({
        canUseSTR: true,
        trialsRemaining: 'unlimited',
        isPremium: true
      });
    }

    // Free users have limited trials
    const canUseSTR = strTrialUsed < maxTrials;
    
    return res.status(200).json({
      canUseSTR,
      trialsUsed: strTrialUsed,
      trialsRemaining: maxTrials - strTrialUsed,
      maxTrials,
      isPremium: false
    });

  } catch (error) {
    console.error('Error checking STR trial:', error);
    throw error;
  }
}

/**
 * Use STR trial
 */
async function useSTRTrial(res, db, userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    
    // Use transaction for atomic update
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const strTrialUsed = userData.strTrialUsed || 0;
      
      // Check if premium user
      if (userData.subscriptionTier === 'premium' || userData.subscriptionTier === 'professional') {
        return; // No need to track for premium users
      }
      
      // Check if trials available
      if (strTrialUsed >= 5) {
        throw new Error('No STR trials remaining');
      }
      
      // Increment trial count
      transaction.update(userRef, {
        strTrialUsed: strTrialUsed + 1,
        lastSTRTrialDate: new Date()
      });
    });
    
    return res.status(200).json({
      success: true,
      message: 'STR trial used successfully'
    });
    
  } catch (error) {
    console.error('Error using STR trial:', error);
    return res.status(400).json({ 
      error: error.message 
    });
  }
}

/**
 * Update user subscription
 */
async function updateSubscription(res, db, userId, data) {
  try {
    const { tier, stripeCustomerId, stripeSubscriptionId, validUntil } = data;
    
    await db.collection('users').doc(userId).update({
      subscriptionTier: tier,
      stripeCustomerId: stripeCustomerId || null,
      stripeSubscriptionId: stripeSubscriptionId || null,
      subscriptionValidUntil: validUntil ? new Date(validUntil) : null,
      subscriptionUpdatedAt: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Subscription updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Create new user
 */
async function createUser(res, db, data) {
  try {
    const { uid, email, name, source } = data;
    
    if (!uid || !email) {
      return res.status(400).json({ 
        error: 'UID and email are required' 
      });
    }
    
    const userData = {
      email,
      name: name || '',
      subscriptionTier: 'free',
      strTrialUsed: 0,
      analysisCount: 0,
      createdAt: new Date(),
      source: source || 'web',
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
    };
    
    await db.collection('users').doc(uid).set(userData);
    
    return res.status(200).json({
      success: true,
      data: userData
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get daily limit based on subscription tier
 */
function getDailyLimit(tier) {
  const limits = {
    'free': 3,
    'basic': 10,
    'premium': 50,
    'professional': 100
  };
  
  return limits[tier] || limits['free'];
}

/**
 * Increment analysis count
 */
async function incrementAnalysisCount(res, db, userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const analysisCount = userData.analysisCount || 0;
      
      transaction.update(userRef, {
        analysisCount: analysisCount + 1,
        lastAnalysisDate: new Date()
      });
    });
    
    return res.status(200).json({
      success: true,
      message: 'Analysis count incremented'
    });
    
  } catch (error) {
    console.error('Error incrementing analysis count:', error);
    return res.status(400).json({ 
      error: error.message 
    });
  }
}

/**
 * Update user profile
 */
async function updateUserProfile(res, db, userId, data) {
  try {
    const allowedFields = ['name', 'phone', 'company', 'preferences'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    
    updateData.updatedAt = new Date();
    
    await db.collection('users').doc(userId).update(updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Log user activity
 */
async function logActivity(res, db, userId, data) {
  try {
    const { action, metadata } = data;
    
    await db.collection('user_activity').add({
      userId,
      action,
      metadata: metadata || {},
      timestamp: new Date()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Activity logged'
    });
    
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
async function getUserStats(res, db, userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Get analysis count for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const analysesSnapshot = await db.collection('analyses')
      .where('userId', '==', userId)
      .where('createdAt', '>=', startOfMonth)
      .get();
    
    const stats = {
      subscriptionTier: userData.subscriptionTier,
      strTrialsUsed: userData.strTrialUsed || 0,
      strTrialsRemaining: 5 - (userData.strTrialUsed || 0),
      monthlyAnalyses: analysesSnapshot.size,
      dailyAnalyses: userData.analysisCount || 0,
      dailyLimit: getDailyLimit(userData.subscriptionTier),
      memberSince: userData.createdAt
    };
    
    return res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}

/**
 * Check subscription status
 */
async function checkSubscription(res, db, userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const now = new Date();
    
    // Check if subscription is still valid
    const isValid = !userData.subscriptionValidUntil || 
                   new Date(userData.subscriptionValidUntil) > now;
    
    return res.status(200).json({
      success: true,
      data: {
        tier: userData.subscriptionTier,
        isValid,
        validUntil: userData.subscriptionValidUntil,
        features: getSubscriptionFeatures(userData.subscriptionTier)
      }
    });
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
}

/**
 * Get subscription features
 */
function getSubscriptionFeatures(tier) {
  const features = {
    'free': {
      dailyAnalyses: 3,
      strTrials: 5,
      reportGeneration: false,
      apiAccess: false,
      prioritySupport: false
    },
    'basic': {
      dailyAnalyses: 10,
      strTrials: 20,
      reportGeneration: true,
      apiAccess: false,
      prioritySupport: false
    },
    'premium': {
      dailyAnalyses: 50,
      strTrials: 'unlimited',
      reportGeneration: true,
      apiAccess: true,
      prioritySupport: true
    },
    'professional': {
      dailyAnalyses: 100,
      strTrials: 'unlimited',
      reportGeneration: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabel: true
    }
  };
  
  return features[tier] || features['free'];
}