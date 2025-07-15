// Simple production start script - No Redis, No Workers
const logger = require('./src/services/logger.service');

// Log environment for debugging
logger.info('Starting API server with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  AIRBNB_API_KEY: process.env.AIRBNB_SCRAPER_API_KEY ? 'Set' : 'Not set',
  PERPLEXITY_KEY: process.env.PERPLEXITY_API_KEY ? 'Set' : 'Not set'
});

// Just start the server directly
require('./src/server.js');