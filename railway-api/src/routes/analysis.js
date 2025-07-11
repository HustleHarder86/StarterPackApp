const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { APIError } = require('../middleware/errorHandler');
const { addJobWithProgress, getJobStatus } = require('../services/queue.service');
const logger = require('../services/logger.service');

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
    
    // Add job to queue
    const job = await addJobWithProgress('analysis', 'analyze-property', {
      propertyAddress,
      propertyData,
      userId: req.userId,
      userEmail: req.userEmail,
      userName: req.user?.name,
      requestType
    });
    
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