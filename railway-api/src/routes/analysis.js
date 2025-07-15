const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../services/logger.service');

// Try to load queue service
let queueService;
try {
  queueService = require('../services/queue.service');
  logger.info('Analysis route: Redis queue service loaded successfully');
} catch (error) {
  logger.error('Analysis route: Failed to load queue service', { error: error.message });
  queueService = null;
}

// Property analysis endpoint - now uses job queue
router.post('/property', optionalAuth, async (req, res, next) => {
  try {
    const { propertyAddress, propertyData, requestType } = req.body;
    
    // Validate input
    if (!propertyAddress) {
      throw new APIError('Property address is required', 400);
    }
    
    logger.info('Property analysis request received', {
      propertyAddress,
      userId: req.userId,
      hasPropertyData: !!propertyData
    });
    
    // Check if queue service is available
    if (!queueService || !queueService.queues || !queueService.queues.analysis) {
      const debugInfo = {
        queueServiceExists: !!queueService,
        queuesExists: !!(queueService && queueService.queues),
        analysisQueueExists: !!(queueService && queueService.queues && queueService.queues.analysis),
        redisUrl: process.env.REDIS_URL ? 'Set' : 'Not set',
        railwayEnvironment: process.env.RAILWAY_ENVIRONMENT || 'Not set',
        nodeEnv: process.env.NODE_ENV || 'Not set'
      };
      
      logger.error('Property Analysis Error: Queue service not available', debugInfo);
      
      return res.status(503).json({
        success: false,
        error: 'Property analysis service temporarily unavailable',
        message: 'Redis connection not configured. Please check Railway deployment.',
        debugInfo,
        hint: 'Ensure REDIS_URL environment variable is set in Railway'
      });
    }
    
    // Add job to queue
    let job;
    try {
      job = await queueService.addJobWithProgress('analysis', 'analyze-property', {
        propertyAddress,
        propertyData,
        userId: req.userId,
        userEmail: req.userEmail,
        userName: req.user?.name,
        requestType
      });
    } catch (jobError) {
      logger.error('Failed to create analysis job', { error: jobError.message });
      
      return res.status(500).json({
        success: false,
        error: 'Failed to start property analysis',
        message: jobError.message,
        debugInfo: {
          errorType: jobError.constructor.name,
          errorMessage: jobError.message
        }
      });
    }
    
    // Return job ID for status tracking
    res.json({
      success: true,
      jobId: job.id,
      message: 'Analysis started',
      statusUrl: `/api/jobs/${job.id}/status`
    });
    
  } catch (error) {
    next(error);
  }
});

// Mount STR analysis routes
const strRoutes = require('./analysis/str');
router.use('/str', strRoutes);

// Comparables search endpoint
router.post('/comparables', verifyToken, async (req, res, next) => {
  try {
    const { location, filters } = req.body;
    
    if (!location) {
      throw new APIError('Location is required', 400);
    }
    
    // For now, return mock data
    res.json({
      success: true,
      comparables: [],
      message: 'Comparables search not yet implemented'
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;