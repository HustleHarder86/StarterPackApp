/**
 * Internal authentication middleware for Railway API
 * Validates requests from Vercel deployment
 */

import crypto from 'crypto';

/**
 * Verify internal API key with timing-safe comparison
 */
function verifyInternalApiKey(apiKey) {
  const expectedKey = process.env.INTERNAL_API_KEY;
  
  if (!expectedKey) {
    console.error('[Internal Auth] INTERNAL_API_KEY not configured');
    return false;
  }
  
  if (!apiKey || apiKey.length !== expectedKey.length) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(expectedKey)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Internal authentication middleware
 */
export function requireInternalAuth(req, res, next) {
  // Skip auth for health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  const apiKey = req.headers['x-internal-api-key'] || req.headers['x-api-key'];
  const service = req.headers['x-service'];
  const requestId = req.headers['x-request-id'];
  
  // Log request info
  console.log(`[Internal Auth] Request from service: ${service || 'unknown'}, ID: ${requestId || 'none'}`);
  
  if (!verifyInternalApiKey(apiKey)) {
    console.warn(`[Internal Auth] Failed authentication from ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing internal API key',
      requestId
    });
  }
  
  // Add internal service info to request
  req.internalService = {
    authenticated: true,
    serviceName: service || 'unknown',
    requestId: requestId || crypto.randomUUID()
  };
  
  console.log(`[Internal Auth] Authenticated request from ${service}`);
  next();
}

/**
 * Optional auth middleware (logs but doesn't block)
 */
export function optionalInternalAuth(req, res, next) {
  const apiKey = req.headers['x-internal-api-key'] || req.headers['x-api-key'];
  
  if (apiKey && verifyInternalApiKey(apiKey)) {
    req.internalService = {
      authenticated: true,
      serviceName: req.headers['x-service'] || 'unknown',
      requestId: req.headers['x-request-id'] || crypto.randomUUID()
    };
  } else {
    req.internalService = {
      authenticated: false,
      serviceName: 'external',
      requestId: crypto.randomUUID()
    };
  }
  
  next();
}

export default {
  requireInternalAuth,
  optionalInternalAuth,
  verifyInternalApiKey
};