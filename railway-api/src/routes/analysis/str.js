const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const { APIError } = require('../../middleware/errorHandler');
const logger = require('../../services/logger.service');
const { getCached, setCached } = require('../../services/cache.service');
const { airbnbScraper } = require('../../services/airbnb-scraper.service');
const { analyzeSTRPotential } = require('../../utils/calculators/str');
const { STRRegulationChecker } = require('../../utils/str-regulations');
const { db } = require('../../services/firebase.service');

// Try to load queue service
let queueService;
try {
  queueService = require('../../services/queue.service');
  logger.info('STR route: Redis queue service loaded successfully');
} catch (error) {
  logger.error('STR route: Failed to load queue service', { error: error.message });
  queueService = null;
}

// Main STR analysis endpoint
router.post('/analyze', verifyToken, async (req, res, next) => {
  try {
    const { propertyId, propertyData } = req.body;
    
    if (!propertyId || !propertyData) {
      throw new APIError('Property ID and data are required', 400);
    }
    
    logger.info('STR analysis request received', {
      propertyId,
      userId: req.userId,
      city: propertyData.address?.city
    });
    
    // Check user's STR access
    const userDoc = await db.collection('users').doc(req.userId).get();
    const userData = userDoc.data();
    
    const canUseSTR = userData.subscriptionTier === 'pro' || 
                      userData.subscriptionTier === 'enterprise' ||
                      (userData.strTrialUsed || 0) < 5;
    
    if (!canUseSTR) {
      throw new APIError('STR analysis requires Pro subscription', 403, {
        upgradeRequired: true,
        trialsRemaining: 0
      });
    }
    
    // Check cache first
    const cacheKey = `str:${propertyId}:${JSON.stringify(propertyData.address)}`;
    const cached = await getCached(cacheKey);
    
    if (cached && process.env.NODE_ENV === 'production') {
      logger.info('Returning cached STR analysis', { propertyId });
      return res.json({
        success: true,
        data: cached,
        cached: true,
        trialsRemaining: userData.subscriptionTier === 'free' ? 
          Math.max(0, 5 - (userData.strTrialUsed || 0)) : 'unlimited'
      });
    }
    
    // Check if queue service is available
    if (!queueService || !queueService.queues || !queueService.queues.str) {
      const debugInfo = {
        queueServiceExists: !!queueService,
        queuesExists: !!(queueService && queueService.queues),
        strQueueExists: !!(queueService && queueService.queues && queueService.queues.str),
        redisUrl: process.env.REDIS_URL ? 'Set' : 'Not set',
        railwayEnvironment: process.env.RAILWAY_ENVIRONMENT || 'Not set',
        nodeEnv: process.env.NODE_ENV || 'Not set'
      };
      
      logger.error('STR Analysis Error: Queue service not available', debugInfo);
      
      return res.status(503).json({
        success: false,
        error: 'STR analysis service temporarily unavailable',
        message: 'Redis connection not configured. Please check Railway deployment.',
        debugInfo,
        hint: 'Ensure REDIS_URL environment variable is set in Railway'
      });
    }
    
    // Add to job queue for processing
    let job;
    try {
      job = await queueService.addJobWithProgress('str', 'analyze-str', {
        propertyId,
        propertyData,
        userId: req.userId,
        userTier: userData.subscriptionTier,
        strTrialUsed: userData.strTrialUsed || 0
      });
      
      logger.info('STR analysis job created', { 
        jobId: job.id,
        propertyId
      });
    } catch (jobError) {
      logger.error('Failed to create STR job', { error: jobError.message });
      
      return res.status(500).json({
        success: false,
        error: 'Failed to start STR analysis',
        message: jobError.message,
        debugInfo: {
          errorType: jobError.constructor.name,
          errorMessage: jobError.message
        }
      });
    }
    
    res.json({
      success: true,
      jobId: job.id,
      message: 'STR analysis started',
      statusUrl: `/api/jobs/${job.id}/status`,
      trialsRemaining: userData.subscriptionTier === 'free' ? 
        Math.max(0, 5 - ((userData.strTrialUsed || 0) + 1)) : 'unlimited'
    });
    
  } catch (error) {
    logger.error('STR analysis error', { 
      error: error.message,
      stack: error.stack,
      userId: req.userId 
    });
    next(error);
  }
});

// Get STR comparables endpoint
router.post('/comparables', verifyToken, async (req, res, next) => {
  try {
    const { location, bedrooms, bathrooms, propertyType } = req.body;
    
    if (!location) {
      throw new APIError('Location is required', 400);
    }
    
    logger.info('STR comparables request', {
      location,
      bedrooms,
      userId: req.userId
    });
    
    // Check cache
    const cacheKey = `comparables:${location}:${bedrooms}:${propertyType}`;
    const cached = await getCached(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        comparables: cached,
        cached: true
      });
    }
    
    // Search for comparables directly (faster than job queue)
    try {
      const searchResults = await airbnbScraper.searchComparables({
        address: { city: location },
        bedrooms: bedrooms || 2,
        bathrooms: bathrooms || 1,
        propertyType: propertyType || 'House'
      });
      
      // Cache for 24 hours
      await setCached(cacheKey, searchResults.listings, 86400);
      
      res.json({
        success: true,
        comparables: searchResults.listings,
        metadata: searchResults.metadata
      });
      
    } catch (scraperError) {
      logger.error('Airbnb scraper error', { 
        error: scraperError.message,
        location 
      });
      
      // Return empty comparables on error
      res.json({
        success: true,
        comparables: [],
        error: 'Unable to fetch comparables at this time'
      });
    }
    
  } catch (error) {
    next(error);
  }
});

// Check STR regulations endpoint
router.post('/regulations', async (req, res, next) => {
  try {
    const { city, province } = req.body;
    
    if (!city) {
      throw new APIError('City is required', 400);
    }
    
    logger.info('STR regulations check', { city, province });
    
    // Check cache
    const cacheKey = `regulations:${city}:${province || 'Ontario'}`;
    const cached = await getCached(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        regulations: cached,
        cached: true
      });
    }
    
    // Check regulations
    const checker = new STRRegulationChecker(process.env.PERPLEXITY_API_KEY);
    const regulations = await checker.checkRegulations(city, province || 'Ontario');
    const compliance = checker.generateComplianceAdvice(regulations);
    
    const result = {
      ...regulations,
      compliance
    };
    
    // Cache for 7 days (regulations don't change often)
    await setCached(cacheKey, result, 604800);
    
    res.json({
      success: true,
      regulations: result
    });
    
  } catch (error) {
    logger.error('Regulation check error', { 
      error: error.message,
      city: req.body.city 
    });
    next(error);
  }
});

module.exports = router;