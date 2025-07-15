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
      allowedOrigins: config.cors.origin
    });
    
    // Check if origin is in allowed list
    if (config.cors.origin.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS rejected origin', {
        origin,
        allowed: config.cors.origin
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  optionsSuccessStatus: config.cors.optionsSuccessStatus,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining']
};

module.exports = cors(corsOptions);