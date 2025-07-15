const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../services/logger.service');
const { analyzePropertyLogic } = require('../services/property-analysis.service');

// Property analysis endpoint - Direct processing (no queues)
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
    
    // Process the analysis directly
    try {
      logger.info('Starting property analysis', { propertyAddress });
      
      // Run the analysis logic directly
      const result = await analyzePropertyLogic({
        propertyAddress,
        propertyData,
        userId: req.userId,
        userEmail: req.userEmail,
        userName: req.user?.name,
        requestType,
        onProgress: (progress, message) => {
          // Log progress for debugging
          logger.debug('Analysis progress', { progress, message });
        }
      });
      
      logger.info('Property analysis completed', { propertyAddress });
      
      // Return the result directly
      res.json({
        success: true,
        data: result,
        message: 'Analysis completed'
      });
      
    } catch (analysisError) {
      logger.error('Property analysis failed', { 
        error: analysisError.message,
        propertyAddress 
      });
      
      throw new APIError(
        analysisError.message || 'Failed to analyze property',
        analysisError.status || 500
      );
    }
    
  } catch (error) {
    next(error);
  }
});

// Mount STR analysis routes (direct processing)
const strRoutes = require('./analysis/str-direct');
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