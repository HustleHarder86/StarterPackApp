const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const { APIError } = require('../../middleware/errorHandler');
const logger = require('../../services/logger.service');
const { db } = require('../../services/firebase.service');
const admin = require('firebase-admin');
const { airbnbScraper } = require('../../services/airbnb-scraper.service');
const { analyzeSTRPotential } = require('../../utils/calculators/str');
const { STRRegulationChecker } = require('../../utils/str-regulations');
const { filterComparables } = require('../../utils/str-calculations');
const { cache } = require('../../services/simple-cache.service');
const { parseBedroomBathroomValue } = require('../../utils/property-calculations');

// Main STR analysis endpoint - Direct processing, no queues
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
    const cached = cache.get(cacheKey);
    
    if (cached) {
      logger.info('Returning cached STR analysis', { propertyId });
      return res.json({
        success: true,
        data: cached,
        cached: true,
        trialsRemaining: userData.subscriptionTier === 'free' ? 
          Math.max(0, 5 - (userData.strTrialUsed || 0)) : 'unlimited'
      });
    }
    
    // Perform the analysis directly
    try {
      logger.info('Starting STR analysis', { propertyId });
      
      // Parse bedroom and bathroom values that might be in "X + Y" format
      const parsedPropertyData = {
        ...propertyData,
        bedrooms: parseBedroomBathroomValue(propertyData.bedrooms),
        bathrooms: parseBedroomBathroomValue(propertyData.bathrooms)
      };
      
      // Search for comparables
      logger.info('Searching Airbnb with params', {
        city: parsedPropertyData.address?.city,
        bedrooms: parsedPropertyData.bedrooms,
        bathrooms: parsedPropertyData.bathrooms,
        propertyType: parsedPropertyData.propertyType
      });
      
      const searchResults = await airbnbScraper.searchComparables(parsedPropertyData);
      logger.info(`Found ${searchResults.listings.length} comparable listings`);
      
      // Filter comparables
      const filteredComparables = filterComparables(searchResults.listings, parsedPropertyData);
      logger.info(`Filtered to ${filteredComparables.length} relevant comparables`);
      
      if (filteredComparables.length === 0) {
        throw new APIError('No comparable properties found in the area', 404);
      }
      
      // Get LTR rent estimate
      const ltrRent = parsedPropertyData.estimatedRent || parsedPropertyData.monthlyRent || 0;
      
      // Check STR regulations
      logger.info('Checking STR regulations...');
      const regulationChecker = new STRRegulationChecker(process.env.PERPLEXITY_API_KEY);
      const regulations = await regulationChecker.checkRegulations(
        parsedPropertyData.address?.city || 'Toronto',
        parsedPropertyData.address?.province || 'Ontario'
      );
      
      const complianceAdvice = regulationChecker.generateComplianceAdvice(regulations);
      
      // Perform comprehensive STR analysis
      const strAnalysis = analyzeSTRPotential(
        parsedPropertyData,
        filteredComparables,
        { ltrRent }
      );
      
      // Format comparables
      const formattedComparables = strAnalysis.comparables.map(comp => ({
        id: comp.id,
        title: comp.title,
        nightlyRate: comp.price || comp.nightly_price,
        bedrooms: comp.bedrooms,
        bathrooms: comp.bathrooms,
        propertyType: comp.property_type || comp.propertyType,
        distance: comp.distance,
        occupancyRate: comp.occupancy_rate || comp.occupancy || 0.70,
        similarityScore: comp.similarityScore,
        rating: comp.rating,
        reviewCount: comp.reviewsCount || comp.review_count,
        imageUrl: comp.image_url || comp.thumbnail,
        airbnbUrl: comp.url,
        monthlyRevenue: Math.round((comp.price || comp.nightly_price) * 30.4 * (comp.occupancy_rate || 0.70))
      }));
      
      // Prepare final result
      const result = {
        propertyId,
        address: parsedPropertyData.address,
        strAnalysis: {
          ...strAnalysis,
          comparables: formattedComparables
        },
        regulations: {
          summary: regulations.summary,
          restricted: regulations.restricted,
          requirements: regulations.requirements || [],
          complianceScore: regulations.complianceScore,
          complianceAdvice
        },
        comparison: {
          ltrMonthlyRent: ltrRent,
          strMonthlyRevenue: strAnalysis.monthlyRevenue,
          monthlyDifference: strAnalysis.monthlyRevenue - ltrRent,
          recommendedStrategy: strAnalysis.monthlyRevenue > ltrRent * 1.3 ? 'STR' : 'LTR'
        },
        searchCriteria: searchResults.searchCriteria,
        totalComparablesFound: searchResults.listings.length,
        createdAt: new Date().toISOString()
      };
      
      // Update user's trial count if free tier
      if (userData.subscriptionTier === 'free') {
        await db.collection('users').doc(req.userId).update({
          strTrialUsed: admin.firestore.FieldValue.increment(1),
          lastStrAnalysis: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Cache the result for 24 hours
      cache.set(cacheKey, result, 24 * 3600);
      
      // Save to database
      await db.collection('strAnalyses').add({
        ...result,
        userId: req.userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      logger.info('STR analysis completed successfully', { propertyId });
      
      res.json({
        success: true,
        data: result,
        cached: false,
        trialsRemaining: userData.subscriptionTier === 'free' ? 
          Math.max(0, 4 - (userData.strTrialUsed || 0)) : 'unlimited'
      });
      
    } catch (analysisError) {
      logger.error('STR analysis failed', { 
        error: analysisError.message,
        propertyId
      });
      
      throw new APIError(
        analysisError.message || 'Failed to analyze STR potential',
        analysisError.status || 500
      );
    }
    
  } catch (error) {
    logger.error('STR analysis error', { 
      error: error.message,
      stack: error.stack,
      userId: req.userId 
    });
    next(error);
  }
});

// Get STR comparables endpoint (simplified)
router.post('/comparables', verifyToken, async (req, res, next) => {
  try {
    const { location, filters } = req.body;
    
    if (!location) {
      throw new APIError('Location is required', 400);
    }
    
    logger.info('Fetching STR comparables', { location, filters });
    
    // Search for comparables directly
    const searchResults = await airbnbScraper.searchLocation(location, filters);
    
    res.json({
      success: true,
      comparables: searchResults.listings,
      total: searchResults.total,
      searchCriteria: searchResults.searchCriteria
    });
    
  } catch (error) {
    logger.error('Comparables search error', { error: error.message });
    next(error);
  }
});

module.exports = router;