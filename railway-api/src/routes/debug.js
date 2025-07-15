const express = require('express');
const router = express.Router();

// Debug endpoint to check Redis configuration
router.get('/redis-config', (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    
    // Check for Redis variables
    redisEnvVars: {},
    allEnvVarNames: Object.keys(process.env).sort(),
    
    // Railway specific
    railwayVars: {}
  };
  
  // Check all possible Redis env var names
  const redisVarNames = [
    'REDIS_URL',
    'REDIS_PRIVATE_URL',
    'REDIS_PUBLIC_URL',
    'RAILWAY_REDIS_URL',
    'RAILWAY_PRIVATE_REDIS_URL',
    'REDISCLOUD_URL',
    'REDISTOGO_URL',
    'DATABASE_URL'
  ];
  
  redisVarNames.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Sanitize the URL to hide password
      try {
        const url = new URL(value);
        debugInfo.redisEnvVars[varName] = {
          exists: true,
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          hasAuth: !!url.password,
          preview: value.substring(0, 30) + '...'
        };
      } catch (e) {
        debugInfo.redisEnvVars[varName] = {
          exists: true,
          invalid: true,
          preview: value.substring(0, 30) + '...'
        };
      }
    } else {
      debugInfo.redisEnvVars[varName] = { exists: false };
    }
  });
  
  // Get all Railway-specific variables
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('RAILWAY_')) {
      debugInfo.railwayVars[key] = process.env[key]?.substring(0, 50) + '...';
    }
  });
  
  // Check what our config is using
  try {
    const { redisUrl } = require('../config/redis');
    debugInfo.configuredRedisUrl = {
      url: redisUrl?.substring(0, 30) + '...',
      isLocalhost: redisUrl?.includes('localhost') || redisUrl?.includes('127.0.0.1')
    };
  } catch (e) {
    debugInfo.configuredRedisUrl = { error: e.message };
  }
  
  res.json(debugInfo);
});

// Health check that also shows Redis status
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: {
      configured: false,
      connected: false
    }
  };
  
  // Redis removed - using simple cache now
  health.redis = {
    configured: false,
    connected: false,
    message: 'Redis removed - using in-memory cache'
  };
  
  res.json(health);
});

// CORS configuration check
router.get('/cors-config', (req, res) => {
  const config = require('../config');
  
  res.json({
    corsOrigins: config.cors.origin,
    envVar: process.env.ALLOWED_ORIGINS || 'Not set',
    requestOrigin: req.headers.origin || 'No origin header',
    nodeEnv: process.env.NODE_ENV
  });
});

module.exports = router;