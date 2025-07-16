const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../services/logger.service');
const { analyzePropertyLogic } = require('../services/property-analysis.service');
const { toSnakeCase } = require('../utils/case-converter');

// Health check for analysis endpoints
router.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    endpoints: ['/property', '/str/analyze', '/str/comparables'],
    timestamp: new Date().toISOString()
  });
});

// Handle OPTIONS for /property endpoint explicitly
router.options('/property', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Property analysis endpoint - Direct processing (no queues)
router.post('/property', optionalAuth, async (req, res, next) => {
  try {
    const { propertyAddress, propertyData, requestType, includeStrAnalysis } = req.body;
    
    // Validate input
    if (!propertyAddress) {
      throw new APIError('Property address is required', 400);
    }
    
    logger.info('Property analysis request received', {
      propertyAddress,
      userId: req.userId,
      hasPropertyData: !!propertyData,
      includeStrAnalysis: !!includeStrAnalysis,
      propertyDataBedrooms: propertyData?.bedrooms,
      propertyDataBathrooms: propertyData?.bathrooms,
      propertyDataKeys: propertyData ? Object.keys(propertyData) : []
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
      
      // If STR analysis is requested, run it regardless of LTR success
      if (includeStrAnalysis) {
        logger.info('STR analysis requested, triggering STR analysis');
        
        // If LTR failed, create a basic result structure
        if (!result.success) {
          logger.warn('LTR analysis failed, but continuing with STR analysis');
          result = {
            success: false,
            error: result.error || 'LTR analysis failed',
            propertyDetails: propertyData || {},
            rental: {}
          };
        }
        
        try {
          // Import STR analysis dependencies
          const { db } = require('../services/firebase.service');
          const admin = require('firebase-admin');
          const { airbnbScraper } = require('../services/airbnb-scraper.service');
          const { strCalculator } = require('../services/str-calculator.service');
          const { rentalComparison } = require('../utils/rental-comparison');
          const { analyzeSTRPotential } = require('../utils/calculators/str');
          const { STRRegulationChecker } = require('../utils/str-regulations');
          const { filterComparables } = require('../utils/str-calculations');
          const { cache } = require('../services/simple-cache.service');
          
          // Check if user has access to STR analysis
          if (req.userId) {
            const userDoc = await db.collection('users').doc(req.userId).get();
            const userData = userDoc.data();
            
            const canUseSTR = userData.subscriptionTier === 'pro' || 
                              userData.subscriptionTier === 'enterprise' ||
                              (userData.strTrialUsed || 0) < 5;
            
            if (!canUseSTR) {
              logger.warn('User does not have STR access', { userId: req.userId });
              // Don't throw error, just return LTR analysis with snake_case conversion
              const snakeCaseResult = toSnakeCase(result);
              
              // Rename 'rental' to 'long_term_rental' to match frontend expectations
              if (snakeCaseResult.rental) {
                snakeCaseResult.long_term_rental = snakeCaseResult.rental;
                delete snakeCaseResult.rental;
              }
              
              return res.json({
                success: true,
                data: snakeCaseResult,
                message: 'Analysis completed (STR requires Pro subscription)',
                strAccessDenied: true
              });
            }
          }
          
          // Prepare property data for STR analysis
          // Fix city extraction - propertyData.city contains "Ontario M4A1V1", need to extract actual city
          let cityName = result.propertyDetails?.city || propertyData?.city || 'Toronto';
          
          // If city contains "Ontario" or postal code pattern, it's likely the wrong format
          if (cityName && (cityName.includes('Ontario') || /[A-Z]\d[A-Z]\s?\d[A-Z]\d/.test(cityName))) {
            // Try to extract city from the full address
            const addressParts = propertyAddress.split(',').map(s => s.trim());
            // Usually format is: "Street, City (Neighborhood), Province PostalCode"
            if (addressParts.length > 1) {
              // Extract city name, removing neighborhood in parentheses
              cityName = addressParts[0].split('(')[0].trim();
              // If first part looks like street (contains numbers), use second part
              if (/^\d+/.test(cityName) && addressParts[1]) {
                cityName = addressParts[1].split('(')[0].trim();
              }
            }
            // Default to Toronto if still unclear
            if (cityName.includes('Ontario') || /[A-Z]\d[A-Z]/.test(cityName)) {
              cityName = 'Toronto';
            }
          }
          
          // Debug logging to trace bedroom data issue
          logger.info('LTR Analysis result structure', {
            hasPropertyDetails: !!result.propertyDetails,
            hasRental: !!result.rental,
            propertyDetailsKeys: result.propertyDetails ? Object.keys(result.propertyDetails) : [],
            bedrooms: result.propertyDetails?.bedrooms,
            bathrooms: result.propertyDetails?.bathrooms,
            monthlyRent: result.rental?.monthlyRent
          });
          
          logger.debug('Property data sources for STR analysis', {
            resultPropertyDetails: result.propertyDetails,
            propertyDataFromRequest: propertyData,
            bedroomsFromResult: result.propertyDetails?.bedrooms,
            bedroomsFromPropertyData: propertyData?.bedrooms
          });
          
          const strPropertyData = {
            address: {
              street: result.propertyDetails?.address || propertyAddress,
              city: cityName,
              province: 'Ontario',
              country: 'Canada'
            },
            bedrooms: result.propertyDetails?.bedrooms || propertyData?.bedrooms || 3,
            bathrooms: result.propertyDetails?.bathrooms || propertyData?.bathrooms || 2,
            propertyType: result.propertyDetails?.propertyType || propertyData?.propertyType || 'Single Family',
            sqft: result.propertyDetails?.sqft || propertyData?.sqft,
            price: result.propertyDetails?.price || propertyData?.price || 0,
            monthlyRent: result.rental?.monthlyRent || 0,
            estimatedRent: result.rental?.monthlyRent || 0
          };
          
          logger.info('STR property data prepared', {
            bedrooms: strPropertyData.bedrooms,
            bathrooms: strPropertyData.bathrooms,
            propertyType: strPropertyData.propertyType
          });
          
          // Check cache first
          const cacheKey = `str:${propertyAddress}:${JSON.stringify(strPropertyData.address)}`;
          const cached = cache.get(cacheKey);
          
          if (cached) {
            logger.info('Using cached STR analysis');
            result.strAnalysis = cached.strAnalysis;
            result.regulations = cached.regulations;
            result.comparison = cached.comparison;
          } else {
            // Perform STR analysis
            logger.info('Performing STR analysis', { city: strPropertyData.address.city });
            
            // Search for comparables
            const searchResults = await airbnbScraper.searchComparables(strPropertyData);
            logger.info(`Found ${searchResults.listings.length} comparable listings`);
            
            // Filter comparables
            const filteredComparables = filterComparables(searchResults.listings, strPropertyData);
            logger.info(`Filtered to ${filteredComparables.length} relevant comparables`);
            
            if (filteredComparables.length > 0) {
              // Check STR regulations
              const regulationChecker = new STRRegulationChecker(process.env.PERPLEXITY_API_KEY);
              const regulations = await regulationChecker.checkRegulations(
                strPropertyData.address.city,
                strPropertyData.address.province
              );
              
              const complianceAdvice = regulationChecker.generateComplianceAdvice(regulations);
              
              // Perform STR analysis
              const strAnalysis = analyzeSTRPotential(
                strPropertyData,
                filteredComparables,
                { ltrRent: strPropertyData.monthlyRent }
              );
              
              // Format comparables
              const formattedComparables = strAnalysis.comparables.slice(0, 5).map(comp => ({
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
              
              // Add STR data to result
              result.strAnalysis = {
                ...strAnalysis,
                comparables: formattedComparables
              };
              
              result.regulations = {
                summary: regulations.summary,
                restricted: regulations.restricted,
                requirements: regulations.requirements || [],
                complianceScore: regulations.complianceScore,
                complianceAdvice
              };
              
              result.comparison = {
                ltrMonthlyRent: strPropertyData.monthlyRent,
                strMonthlyRevenue: strAnalysis.monthlyRevenue,
                monthlyDifference: strAnalysis.monthlyRevenue - strPropertyData.monthlyRent,
                recommendedStrategy: strAnalysis.monthlyRevenue > strPropertyData.monthlyRent * 1.3 ? 'STR' : 'LTR'
              };
              
              // Cache the STR results
              cache.set(cacheKey, {
                strAnalysis: result.strAnalysis,
                regulations: result.regulations,
                comparison: result.comparison
              }, 24 * 3600);
              
              // Update user's trial count if free tier
              if (req.userId) {
                const userDoc = await db.collection('users').doc(req.userId).get();
                const userData = userDoc.data();
                
                if (userData.subscriptionTier === 'free') {
                  await db.collection('users').doc(req.userId).update({
                    strTrialUsed: admin.firestore.FieldValue.increment(1),
                    lastStrAnalysis: admin.firestore.FieldValue.serverTimestamp()
                  });
                  
                  result.strTrialsRemaining = Math.max(0, 4 - (userData.strTrialUsed || 0));
                } else {
                  result.strTrialsRemaining = 'unlimited';
                }
              }
            } else {
              logger.warn('No STR comparables found');
              result.strAnalysis = {
                error: 'No comparable STR properties found in the area'
              };
            }
          }
          
          logger.info('STR analysis completed successfully');
          
        } catch (strError) {
          logger.error('STR analysis failed', {
            error: strError.message,
            stack: strError.stack
          });
          
          // Don't fail the entire request if STR fails
          result.strAnalysis = {
            error: strError.message || 'STR analysis failed',
            errorType: strError.message.includes('API credentials') ? 'missing_credentials' : 'analysis_error'
          };
          
          // Add helpful message for missing credentials
          if (strError.message.includes('API credentials')) {
            result.strAnalysis.helpMessage = 'STR analysis is not available yet. The Airbnb API key needs to be configured in Railway.';
            result.strAnalysis.configRequired = {
              variable: 'AIRBNB_SCRAPER_API_KEY',
              platform: 'Railway',
              description: 'Apify API key for Airbnb data'
            };
          }
        }
      }
      
      // Convert result to snake_case for frontend compatibility
      const snakeCaseResult = toSnakeCase(result);
      
      // Rename fields to match frontend expectations
      if (snakeCaseResult.rental) {
        snakeCaseResult.long_term_rental = snakeCaseResult.rental;
        delete snakeCaseResult.rental;
      }
      
      // Rename 'str_analysis' to 'short_term_rental' to match frontend
      if (snakeCaseResult.str_analysis) {
        snakeCaseResult.short_term_rental = snakeCaseResult.str_analysis;
        delete snakeCaseResult.str_analysis;
        
        // Map field names to match frontend expectations
        if (snakeCaseResult.short_term_rental.avg_nightly_rate !== undefined) {
          snakeCaseResult.short_term_rental.daily_rate = snakeCaseResult.short_term_rental.avg_nightly_rate;
        }
        // occupancy_rate should already be correct after snake_case conversion
        
        // Ensure annual_revenue and annual_profit exist for calculations
        if (snakeCaseResult.short_term_rental.annual_revenue === undefined && 
            snakeCaseResult.short_term_rental.annual_revenue !== undefined) {
          snakeCaseResult.short_term_rental.annual_revenue = snakeCaseResult.short_term_rental.annual_revenue;
        }
        if (snakeCaseResult.short_term_rental.net_annual_income !== undefined) {
          snakeCaseResult.short_term_rental.annual_profit = snakeCaseResult.short_term_rental.net_annual_income;
        }
      }
      
      // Map metrics fields to match frontend expectations
      if (snakeCaseResult.metrics && snakeCaseResult.metrics.total_roi !== undefined) {
        snakeCaseResult.roi_percentage = snakeCaseResult.metrics.total_roi;
      }
      
      // Map property_address from propertyAddress if it exists
      if (snakeCaseResult.property_address === undefined && result.propertyAddress) {
        snakeCaseResult.property_address = result.propertyAddress;
      }
      
      // Map analysis_timestamp from timestamp
      if (snakeCaseResult.analysis_timestamp === undefined && snakeCaseResult.timestamp) {
        snakeCaseResult.analysis_timestamp = snakeCaseResult.timestamp;
      }
      
      // Log the transformation for debugging
      logger.debug('API response after transformation', {
        hasRental: !!result.rental,
        hasLongTermRental: !!snakeCaseResult.long_term_rental,
        monthlyRent: snakeCaseResult.long_term_rental?.monthly_rent,
        hasStrAnalysis: !!result.strAnalysis,
        hasShortTermRental: !!snakeCaseResult.short_term_rental,
        dailyRate: snakeCaseResult.short_term_rental?.daily_rate,
        roiPercentage: snakeCaseResult.roi_percentage
      });
      
      // Return the combined result
      res.json({
        success: true,
        data: snakeCaseResult,
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