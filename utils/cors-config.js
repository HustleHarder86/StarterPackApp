/**
 * CORS configuration helper for API endpoints
 */

// Allowed origins based on environment
const getAllowedOrigins = () => {
  const origins = [
    'https://starterpackapp.vercel.app',
    'https://starterpackapp.com',
    'https://www.starterpackapp.com'
  ];
  
  // Add development origins
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    );
  }
  
  // Add preview deployments
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  return origins;
};

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin && origin.includes('vercel.app')) {
    // Allow all Vercel preview deployments
    console.log(`CORS: Allowing Vercel preview deployment: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, allow any origin but log it
    console.warn(`CORS: Allowing unregistered origin in development: ${origin}`);
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    // In production, use the primary domain as fallback
    res.setHeader('Access-Control-Allow-Origin', 'https://starterpackapp.vercel.app');
  }
  
  // Set other CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * CORS middleware
 */
export function corsMiddleware(req, res, next) {
  applyCorsHeaders(req, res);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (next) {
    next();
  }
}

/**
 * Create a CORS-enabled handler wrapper
 */
export function withCors(handler) {
  return async (req, res) => {
    applyCorsHeaders(req, res);
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Call the actual handler
    return handler(req, res);
  };
}

/**
 * Validate request origin
 */
export function isOriginAllowed(origin) {
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS configuration object (for libraries that accept config)
 */
export function getCorsConfig() {
  return {
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedOrigins();
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (origin && origin.includes('vercel.app')) {
        console.log(`CORS: Allowing Vercel preview deployment: ${origin}`);
        callback(null, true);
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn(`CORS: Allowing unregistered origin in development: ${origin}`);
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
      'Accept-Version',
      'Content-Length',
      'Content-MD5',
      'Content-Type',
      'Date',
      'X-Api-Version',
      'Authorization'
    ],
    maxAge: 86400
  };
}

export default {
  applyCorsHeaders,
  corsMiddleware,
  withCors,
  isOriginAllowed,
  getCorsConfig
};