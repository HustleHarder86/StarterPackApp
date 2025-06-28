import admin from './firebase-admin.js';

/**
 * Authentication middleware for API endpoints
 * Verifies Firebase ID tokens and adds user info to request
 */
export async function authenticate(req, res, next) {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required' 
    });
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      customClaims: decodedToken.customClaims || {}
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.code);
    
    // Handle specific errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please sign in again' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Authentication failed' 
    });
  }
}

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      customClaims: decodedToken.customClaims || {}
    };
  } catch (error) {
    req.user = null;
  }
  
  next();
}

/**
 * Check if user has specific subscription tier
 */
export function requireSubscription(requiredTier) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }
    
    try {
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ 
          error: 'User not found',
          message: 'User profile not found' 
        });
      }
      
      const userData = userDoc.data();
      const userTier = userData.subscriptionTier || 'free';
      
      // Check if user has required tier or higher
      const tierHierarchy = ['free', 'pro', 'enterprise'];
      const userTierIndex = tierHierarchy.indexOf(userTier);
      const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
      
      if (userTierIndex < requiredTierIndex) {
        return res.status(403).json({ 
          error: 'Insufficient subscription',
          message: `This feature requires ${requiredTier} subscription or higher`,
          currentTier: userTier,
          requiredTier: requiredTier
        });
      }
      
      // Add user data to request
      req.userProfile = userData;
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Could not verify subscription' 
      });
    }
  };
}

export default { authenticate, optionalAuth, requireSubscription };