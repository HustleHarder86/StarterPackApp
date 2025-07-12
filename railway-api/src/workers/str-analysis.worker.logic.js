const logger = require('../services/logger.service');
const { db } = require('../services/firebase.service');
const admin = require('firebase-admin');
const { setCached } = require('../services/cache.service');
const { airbnbScraper } = require('../services/airbnb-scraper.service');
const { analyzeSTRPotential } = require('../utils/calculators/str');
const { STRRegulationChecker } = require('../utils/str-regulations');
const { filterComparables } = require('../utils/str-calculations');

/**
 * Core STR analysis processing logic
 * Can be used by both BullMQ worker and fallback service
 */
async function processSTRAnalysis(job) {
  const { propertyId, propertyData, userId, userTier, strTrialUsed } = job.data;
  
  try {
    logger.info('Processing STR analysis', { 
      jobId: job.id,
      propertyId,
      city: propertyData.address?.city 
    });
    
    // Update job progress
    await job.updateProgress({
      stage: 'searching',
      message: 'Searching for comparable Airbnb listings...',
      percentage: 10
    });
    
    // Search for comparables
    let searchResults;
    let strAnalysis;
    
    try {
      // Log the search parameters
      logger.info('Searching Airbnb with params', {
        city: propertyData.address?.city,
        bedrooms: propertyData.bedrooms,
        propertyType: propertyData.propertyType
      });
      
      // Query Airbnb Scraper API
      searchResults = await airbnbScraper.searchComparables(propertyData);
      
      logger.info(`Found ${searchResults.listings.length} comparable listings`);
      
      // Filter comparables
      const filteredComparables = filterComparables(searchResults.listings, propertyData);
      logger.info(`Filtered to ${filteredComparables.length} relevant comparables`);
      
      if (filteredComparables.length === 0) {
        throw new Error('No comparable properties found in the area');
      }
      
      // Update progress
      await job.updateProgress({
        stage: 'analyzing',
        message: 'Analyzing STR potential and regulations...',
        percentage: 50
      });
      
      // Get LTR rent estimate
      const ltrRent = propertyData.estimatedRent || propertyData.monthlyRent || 0;
      
      // Check STR regulations
      logger.info('Checking STR regulations...');
      const regulationChecker = new STRRegulationChecker(process.env.PERPLEXITY_API_KEY);
      const regulations = await regulationChecker.checkRegulations(
        propertyData.address?.city || 'Toronto',
        propertyData.address?.province || 'Ontario'
      );
      
      const complianceAdvice = regulationChecker.generateComplianceAdvice(regulations);
      
      // Perform comprehensive STR analysis
      strAnalysis = analyzeSTRPotential(
        propertyData,
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
      
      // Build complete analysis result
      const result = {
        // Core metrics
        avgNightlyRate: strAnalysis.avgNightlyRate,
        occupancyRate: strAnalysis.occupancyRate,
        monthlyRevenue: strAnalysis.monthlyRevenue,
        annualRevenue: strAnalysis.annualRevenue,
        
        // Financial analysis
        expenses: strAnalysis.expenses,
        netMonthlyIncome: strAnalysis.netMonthlyIncome,
        netAnnualIncome: strAnalysis.netAnnualIncome,
        
        // Investment metrics
        capRate: strAnalysis.capRate,
        cashOnCashReturn: strAnalysis.cashOnCashReturn,
        paybackPeriod: strAnalysis.paybackPeriod,
        
        // Market data
        comparables: formattedComparables,
        comparableCount: filteredComparables.length,
        confidence: strAnalysis.confidence,
        priceRange: strAnalysis.priceRange,
        
        // Seasonal projections
        seasonalData: strAnalysis.seasonalData,
        
        // Revenue scenarios
        scenarios: strAnalysis.scenarios,
        
        // LTR vs STR comparison
        comparison: strAnalysis.comparison,
        
        // Recommendations
        recommendations: strAnalysis.recommendations,
        
        // Regulations and Compliance
        regulations: {
          city: regulations.city,
          province: regulations.province,
          allowed: regulations.allowed,
          requiresLicense: regulations.requiresLicense,
          primaryResidenceOnly: regulations.primaryResidenceOnly,
          maxDays: regulations.maxDays,
          summary: regulations.summary,
          restrictions: regulations.restrictions,
          licenseUrl: regulations.licenseUrl || regulations.officialWebsite,
          source: regulations.source,
          confidence: regulations.confidence,
          lastUpdated: regulations.lastUpdated
        },
        compliance: {
          riskLevel: complianceAdvice.riskLevel,
          recommendations: complianceAdvice.recommendations,
          warnings: complianceAdvice.warnings,
          compliant: complianceAdvice.compliant
        },
        
        // Metadata
        dataSource: 'airbnb_scraper',
        metadata: searchResults.metadata,
        timestamp: new Date().toISOString()
      };
      
      // Update progress
      await job.updateProgress({
        stage: 'saving',
        message: 'Saving analysis results...',
        percentage: 90
      });
      
      // Cache the result
      const cacheKey = `str:${propertyId}:${JSON.stringify(propertyData.address)}`;
      await setCached(cacheKey, result, 86400); // 24 hours
      
      // Store in Firestore
      await db.collection('str_analyses').add({
        userId,
        propertyId,
        ...result,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user trial usage if free tier
      if (userTier === 'free') {
        await db.collection('users').doc(userId).update({
          strTrialUsed: strTrialUsed + 1,
          lastSTRAnalysis: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      logger.info('STR analysis completed successfully', { 
        jobId: job.id,
        propertyId,
        avgNightlyRate: result.avgNightlyRate,
        comparableCount: result.comparableCount
      });
      
      return result;
      
    } catch (scraperError) {
      logger.error('STR analysis processing error', { 
        error: scraperError.message,
        jobId: job.id,
        stack: scraperError.stack
      });
      
      // Return fallback analysis
      const fallbackAnalysis = createFallbackAnalysis(propertyData);
      
      // Still update trial usage
      if (userTier === 'free') {
        await db.collection('users').doc(userId).update({
          strTrialUsed: strTrialUsed + 1,
          lastSTRAnalysis: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return fallbackAnalysis;
    }
    
  } catch (error) {
    logger.error('STR analysis worker error', { 
      error: error.message,
      stack: error.stack,
      jobId: job.id 
    });
    throw error;
  }
}

// Create fallback analysis when API fails
function createFallbackAnalysis(propertyData) {
  const avgNightlyRate = Math.round(propertyData.price * 0.001);
  const occupancyRate = 0.70;
  const monthlyRevenue = Math.round(avgNightlyRate * 30.4 * occupancyRate);
  const annualRevenue = monthlyRevenue * 12;
  const totalExpenses = annualRevenue * 0.45;
  
  return {
    avgNightlyRate,
    occupancyRate,
    monthlyRevenue,
    annualRevenue,
    expenses: {
      monthly: { total: Math.round(totalExpenses / 12) },
      annual: { total: Math.round(totalExpenses) },
      percentageOfRevenue: 45
    },
    netMonthlyIncome: Math.round(monthlyRevenue * 0.55),
    netAnnualIncome: Math.round(annualRevenue * 0.55),
    comparables: [],
    comparableCount: 0,
    confidence: 'low',
    dataSource: 'estimated',
    error: 'Failed to fetch Airbnb data, using estimates',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  processSTRAnalysis,
  createFallbackAnalysis
};