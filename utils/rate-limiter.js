import admin from './firebase-admin.js';

// In-memory store for rate limiting (consider using Redis in production)
const rateLimitStore = new Map();

/**
 * Clean up expired entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.keyGenerator - Function to generate rate limit key
 * @param {boolean} options.skipSuccessfulRequests - Skip counting successful requests
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    message = 'Too many requests, please try again later',
    standardHeaders = true,
    legacyHeaders = false
  } = options;

  return async (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create rate limit data
    let data = rateLimitStore.get(key);
    if (!data || data.resetTime < now) {
      data = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, data);
    }
    
    // Set rate limit headers
    if (standardHeaders) {
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', Math.max(0, max - data.count));
      res.setHeader('RateLimit-Reset', new Date(data.resetTime).toISOString());
    }
    
    if (legacyHeaders) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - data.count));
      res.setHeader('X-RateLimit-Reset', new Date(data.resetTime).toISOString());
    }
    
    // Check if limit exceeded
    if (data.count >= max) {
      res.setHeader('Retry-After', Math.ceil((data.resetTime - now) / 1000));
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((data.resetTime - now) / 1000)
      });
    }
    
    // Increment counter
    data.count++;
    
    // Skip counting successful requests if configured
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(...args) {
        if (res.statusCode < 400) {
          data.count--;
        }
        return originalSend.apply(res, args);
      };
    }
    
    next();
  };
}

/**
 * User-based rate limiting using Firebase Auth
 */
export function userRateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    skipFailedRequests = false,
    keyGenerator = (req) => req.user?.uid || req.ip || 'anonymous'
  } = options;

  return rateLimit({
    ...options,
    windowMs,
    max,
    keyGenerator,
    skipFailedRequests
  });
}

/**
 * Tier-based rate limiting with different limits per subscription
 */
export function tieredRateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    tiers = {
      free: 10,
      pro: 100,
      enterprise: 1000
    }
  } = options;

  return async (req, res, next) => {
    // Get user tier from request (set by auth middleware)
    const userTier = req.userProfile?.subscriptionTier || 'free';
    const limit = tiers[userTier] || tiers.free;

    // Apply rate limit with tier-specific limit
    const limiter = rateLimit({
      ...options,
      windowMs,
      max: limit,
      keyGenerator: (req) => req.user?.uid || req.ip || 'anonymous',
      message: `Rate limit exceeded for ${userTier} tier (${limit} requests per ${windowMs / 60000} minutes)`
    });

    return limiter(req, res, next);
  };
}

/**
 * API endpoint specific rate limiting
 */
export const apiLimits = {
  // Strict limit for analysis endpoints (expensive AI calls)
  analysis: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 analyses per hour
    message: 'Analysis rate limit exceeded. Please try again later.',
    skipFailedRequests: true
  }),
  
  // Moderate limit for property operations
  properties: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many property operations. Please slow down.'
  }),
  
  // Relaxed limit for read operations
  read: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: 'Too many requests. Please try again later.'
  }),
  
  // Strict limit for report generation
  reports: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 reports per hour
    message: 'Report generation limit exceeded.'
  }),
  
  // Very strict limit for auth operations
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts.',
    skipSuccessfulRequests: true
  })
};

export default { rateLimit, userRateLimit, tieredRateLimit, apiLimits };