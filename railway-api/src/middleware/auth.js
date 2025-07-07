const { admin } = require('../services/firebase.service');
const { APIError } = require('./errorHandler');
const logger = require('../services/logger.service');

// Verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError('No token provided', 401);
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user info to request
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    req.user = decodedToken;
    
    logger.info('Authenticated user', { userId: req.userId, email: req.userEmail });
    
    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    
    if (error.code === 'auth/id-token-expired') {
      next(new APIError('Token expired', 401));
    } else if (error.code === 'auth/id-token-revoked') {
      next(new APIError('Token revoked', 401));
    } else {
      next(new APIError('Invalid token', 401));
    }
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      req.userId = decodedToken.uid;
      req.userEmail = decodedToken.email;
      req.user = decodedToken;
    }
    
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

// Check user subscription tier
const requireSubscription = (requiredTier = 'pro') => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        throw new APIError('Authentication required', 401);
      }
      
      // Get user data from Firestore
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(req.userId)
        .get();
      
      if (!userDoc.exists) {
        throw new APIError('User not found', 404);
      }
      
      const userData = userDoc.data();
      const userTier = userData.subscriptionTier || 'free';
      
      // Check tier hierarchy
      const tierHierarchy = ['free', 'pro', 'enterprise'];
      const userTierLevel = tierHierarchy.indexOf(userTier);
      const requiredTierLevel = tierHierarchy.indexOf(requiredTier);
      
      if (userTierLevel < requiredTierLevel) {
        throw new APIError(`${requiredTier} subscription required`, 403, {
          currentTier: userTier,
          requiredTier
        });
      }
      
      // Add user data to request
      req.userData = userData;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireSubscription
};