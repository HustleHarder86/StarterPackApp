const cors = require('cors');
const config = require('../config');
const logger = require('../services/logger.service');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Log the origin and allowed origins for debugging
    logger.debug('CORS check', {
      requestOrigin: origin,
      allowedOrigins: config.cors.origin,
      method: this.method
    });
    
    // Check if origin is in allowed list
    if (config.cors.origin.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In production, also allow www variants
      const wwwVariant = origin.replace('https://', 'https://www.');
      const nonWwwVariant = origin.replace('https://www.', 'https://');
      
      if (config.cors.origin.indexOf(wwwVariant) !== -1 || config.cors.origin.indexOf(nonWwwVariant) !== -1) {
        logger.info('CORS allowed www variant', { origin });
        callback(null, true);
      } else {
        logger.warn('CORS rejected origin', {
          origin,
          allowed: config.cors.origin
        });
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: config.cors.credentials,
  optionsSuccessStatus: config.cors.optionsSuccessStatus,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Accept'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400 // Cache preflight response for 24 hours
};

module.exports = cors(corsOptions);