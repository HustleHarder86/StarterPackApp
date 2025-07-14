const { Worker } = require('bullmq');
const logger = require('../services/logger.service');
const { redisUrl } = require('../config/redis');
const { db, admin } = require('../services/firebase.service');
const { setCached } = require('../services/cache.service');
const { airbnbScraper } = require('../services/airbnb-scraper.service');
const { analyzeSTRPotential } = require('../utils/calculators/str');
const { STRRegulationChecker } = require('../utils/str-regulations');
const { filterComparables } = require('../utils/str-calculations');

// Check if Redis URL is available before creating worker
if (!redisUrl) {
  logger.error('Cannot create STR analysis worker - Redis URL not configured');
  module.exports = {
    get worker() { return null; },
    isRunning: () => false
  };
  return;
}

logger.info('Creating STR analysis worker with Redis URL:', redisUrl.substring(0, 20) + '...');

const strAnalysisWorker = new Worker(
  'str-analysis',
  async (job) => {
    const { propertyId, propertyData, userId, userTier, strTrialUsed } = job.data;
    
    try {
      logger.info('Processing STR analysis job', { 
        jobId: job.id,
        propertyId,
        city: propertyData.address?.city 
      });
      
      // Update job progress
      await job.updateProgress({
        stage: 'searching',
        message: 'Searching for comparable Airbnb listings...'
      });
      
      // Search for comparables
      let searchResults;
      let strAnalysis;
      
      try {
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
          message: 'Analyzing STR potential and regulations...'
        });
        
        // Get LTR rent estimate
        const ltrRent = propertyData.estimatedRent || propertyData.monthlyRent || 0;
        
        // Check STR regulations
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
          propertyId 
        });
        
        return result;
        
      } catch (scraperError) {
        logger.error('STR analysis processing error', { 
          error: scraperError.message,
          jobId: job.id 
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
  },
  {
    connection: {
      url: redisUrl
    },
    concurrency: 2,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 }
  }
);

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

strAnalysisWorker.on('completed', (job) => {
  logger.info('STR analysis job completed', { jobId: job.id });
});

strAnalysisWorker.on('failed', (job, error) => {
  logger.error('STR analysis job failed', { 
    jobId: job.id,
    error: error.message 
  });
});

strAnalysisWorker.on('error', (err) => {
  logger.error('STR analysis worker error', { error: err.message });
});

module.exports = {
  get worker() { return strAnalysisWorker; },
  isRunning: () => strAnalysisWorker && strAnalysisWorker.isRunning()
};