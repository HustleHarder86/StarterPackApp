const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase.service');
const logger = require('../services/logger.service');

// Detailed health check
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
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

module.exports = router;