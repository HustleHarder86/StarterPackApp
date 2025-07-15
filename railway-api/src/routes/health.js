const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase.service');
const logger = require('../services/logger.service');
const { cache } = require('../services/simple-cache.service');

// Debug endpoint for environment variables
router.get('/env', (req, res) => {
  const envInfo = {
    nodeEnv: process.env.NODE_ENV,
    railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
    hasAirbnbKey: !!process.env.AIRBNB_SCRAPER_API_KEY,
    hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
    hasFirebaseConfig: !!process.env.FIREBASE_PROJECT_ID
  };
  
  res.json(envInfo);
});

// Simplified health check - no Redis
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };
  
  // Check Firebase connection
  try {
    await db.collection('health').doc('check').set({ 
      timestamp: new Date().toISOString() 
    });
    health.checks.firebase = 'connected';
  } catch (error) {
    health.checks.firebase = 'error';
    health.status = 'degraded';
    logger.error('Firebase health check failed:', error);
  }
  
  // Check cache stats
  health.checks.cache = cache.getStats();
  
  // Check memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
  };
  
  // Check if memory usage is too high
  if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
    health.status = 'degraded';
    health.warnings = health.warnings || [];
    health.warnings.push('High memory usage detected');
  }
  
  // Add API configuration status
  health.apis = {
    airbnb: process.env.AIRBNB_SCRAPER_API_KEY ? 'configured' : 'missing',
    perplexity: process.env.PERPLEXITY_API_KEY ? 'configured' : 'missing',
    firebase: process.env.FIREBASE_PROJECT_ID ? 'configured' : 'missing'
  };
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

module.exports = router;