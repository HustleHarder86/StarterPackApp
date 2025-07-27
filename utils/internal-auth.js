/**
 * Internal authentication for service-to-service communication
 * Used between Vercel and Railway deployments
 */

import crypto from 'crypto';

/**
 * Generate internal API key for service authentication
 */
export function generateInternalApiKey() {
  return `internal_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Verify internal API key
 */
export function verifyInternalApiKey(apiKey) {
  const expectedKey = process.env.INTERNAL_API_KEY;
  
  if (!expectedKey) {
    console.error('INTERNAL_API_KEY not configured');
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  if (!apiKey || apiKey.length !== expectedKey.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(apiKey),
    Buffer.from(expectedKey)
  );
}

/**
 * Middleware to protect internal endpoints
 */
export function requireInternalAuth(req, res, next) {
  const apiKey = req.headers['x-internal-api-key'] || req.headers['x-api-key'];
  
  if (!verifyInternalApiKey(apiKey)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing internal API key'
    });
  }
  
  if (next) {
    next();
  }
}

/**
 * Add internal auth headers to outgoing requests
 */
export function addInternalAuthHeaders(headers = {}) {
  const internalApiKey = process.env.INTERNAL_API_KEY;
  
  if (!internalApiKey) {
    console.warn('INTERNAL_API_KEY not configured - requests may fail');
  }
  
  return {
    ...headers,
    'X-Internal-API-Key': internalApiKey || '',
    'X-Request-ID': crypto.randomUUID(),
    'X-Service': process.env.SERVICE_NAME || 'vercel'
  };
}

/**
 * Wrapper for fetch with internal auth
 */
export async function fetchWithInternalAuth(url, options = {}) {
  const enhancedOptions = {
    ...options,
    headers: addInternalAuthHeaders(options.headers)
  };
  
  return fetch(url, enhancedOptions);
}

/**
 * Express/Connect middleware factory
 */
export function internalAuthMiddleware(options = {}) {
  const { 
    skipPaths = ['/health', '/status'],
    customHeader = 'x-internal-api-key'
  } = options;
  
  return (req, res, next) => {
    // Skip auth for certain paths
    if (skipPaths.includes(req.path)) {
      return next();
    }
    
    const apiKey = req.headers[customHeader] || req.headers['x-api-key'];
    
    if (!verifyInternalApiKey(apiKey)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'This endpoint requires internal authentication'
      });
    }
    
    // Add service info to request
    req.internalService = {
      authenticated: true,
      serviceName: req.headers['x-service'] || 'unknown',
      requestId: req.headers['x-request-id'] || crypto.randomUUID()
    };
    
    next();
  };
}

export default {
  generateInternalApiKey,
  verifyInternalApiKey,
  requireInternalAuth,
  addInternalAuthHeaders,
  fetchWithInternalAuth,
  internalAuthMiddleware
};