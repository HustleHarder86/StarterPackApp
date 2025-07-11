const admin = require('firebase-admin');
const { requireAuth } = require('../../utils/auth.js');
const { airbnbScraper } = require('../../utils/airbnb-scraper.js');
const { calculateSTRMetrics, filterComparables } = require('../../utils/str-calculations.js');
const { analyzeSTRPotential } = require('../../utils/calculators/str.js');
const { STRRegulationChecker } = require('../../utils/str-regulations.js');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const user = await requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has STR access
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    const canUseSTR = userData.subscriptionTier === 'pro' || 
                      userData.subscriptionTier === 'enterprise' ||
                      (userData.strTrialUsed || 0) < 5;

    if (!canUseSTR) {
      return res.status(403).json({ 
        error: 'STR analysis requires Pro subscription',
        upgradeRequired: true,
        trialsRemaining: 0
      });
    }

    // Extract property data from request
    const { propertyId, propertyData } = req.body;

    if (!propertyId || !propertyData) {
      return res.status(400).json({ error: 'Property ID and data are required' });
    }

    console.log('STR Analysis requested for property:', propertyId);
    console.log('Property data:', JSON.stringify(propertyData, null, 2));

    // Search for comparable Airbnb listings
    console.log('Searching for Airbnb comparables...');
    
    let searchResults;
    let strMetrics;
    
    try {
      // Query Airbnb Scraper API
      searchResults = await airbnbScraper.searchComparables(propertyData);
      
      console.log(`Found ${searchResults.listings.length} comparable listings`);
      
      // Filter comparables by property characteristics
      const filteredComparables = filterComparables(searchResults.listings, propertyData);
      console.log(`Filtered to ${filteredComparables.length} relevant comparables`);
      
      // Check if we have enough data
      if (filteredComparables.length === 0) {
        throw new Error('No comparable properties found in the area');
      }
      
      // Get LTR rent estimate for comparison (from property data or previous analysis)
      const ltrRent = propertyData.estimatedRent || propertyData.monthlyRent || 0;
      
      // Check STR regulations for the city
      console.log('Checking STR regulations...');
      const regulationChecker = new STRRegulationChecker(process.env.PERPLEXITY_API_KEY);
      const regulations = await regulationChecker.checkRegulations(
        propertyData.address?.city || 'Toronto',
        propertyData.address?.province || 'Ontario'
      );
      
      // Generate compliance advice
      const complianceAdvice = regulationChecker.generateComplianceAdvice(regulations);
      
      // Use comprehensive STR analysis
      const strAnalysis = analyzeSTRPotential(
        propertyData,
        filteredComparables,
        { ltrRent }
      );
      
      // Format comparables for response
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
      
      // Build enhanced response with all analysis data
      const enhancedAnalysis = {
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
        
        // STR Regulations and Compliance
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
      
      strMetrics = enhancedAnalysis;
      
      // Store analysis in Firestore
      const analysisRef = await db.collection('str_analyses').add({
        userId: user.uid,
        propertyId,
        ...strAnalysis,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`STR analysis saved with ID: ${analysisRef.id}`);
      
    } catch (error) {
      console.error('Error during STR analysis:', error);
      
      // Provide fallback calculations if API fails
      const fallbackMetrics = {
        avgNightlyRate: Math.round(propertyData.price * 0.001), // Rough estimate: 0.1% of property value
        occupancyRate: 0.70, // Conservative 70% occupancy
        confidence: 'low',
        dataPoints: 0
      };
      
      fallbackMetrics.monthlyRevenue = Math.round(fallbackMetrics.avgNightlyRate * 30.4 * fallbackMetrics.occupancyRate);
      fallbackMetrics.annualRevenue = fallbackMetrics.monthlyRevenue * 12;
      
      // Simple expense calculation for fallback
      const totalExpenses = fallbackMetrics.annualRevenue * 0.45; // 45% expense ratio
      
      const strAnalysis = {
        // Core metrics
        avgNightlyRate: fallbackMetrics.avgNightlyRate,
        occupancyRate: fallbackMetrics.occupancyRate,
        monthlyRevenue: fallbackMetrics.monthlyRevenue,
        annualRevenue: fallbackMetrics.annualRevenue,
        
        // Financial analysis (simplified)
        expenses: {
          monthly: { total: Math.round(totalExpenses / 12) },
          annual: { total: Math.round(totalExpenses) },
          percentageOfRevenue: 45
        },
        netMonthlyIncome: Math.round(fallbackMetrics.monthlyRevenue * 0.55),
        netAnnualIncome: Math.round(fallbackMetrics.annualRevenue * 0.55),
        
        // Basic comparison (if LTR data available)
        comparison: propertyData.estimatedRent ? {
          ltr: {
            monthlyNet: Math.round(propertyData.estimatedRent * 0.75),
            annualNet: Math.round(propertyData.estimatedRent * 0.75 * 12)
          },
          str: {
            monthlyNet: Math.round(fallbackMetrics.monthlyRevenue * 0.55),
            annualNet: Math.round(fallbackMetrics.annualRevenue * 0.55)
          },
          recommendation: fallbackMetrics.monthlyRevenue * 0.55 > propertyData.estimatedRent * 0.75 ? 'STR' : 'LTR'
        } : null,
        
        // Empty/default values for missing data
        comparables: [],
        comparableCount: 0,
        confidence: 'low',
        scenarios: null,
        seasonalData: null,
        recommendations: [{
          type: 'warning',
          message: 'Analysis based on estimates due to data unavailability. Actual results may vary significantly.'
        }],
        
        // Metadata
        dataSource: 'estimated',
        error: 'Failed to fetch Airbnb data, using estimates',
        timestamp: new Date().toISOString()
      };
      
      strMetrics = strAnalysis;
    }

    // Track trial usage if free user
    if (userData.subscriptionTier === 'free') {
      await db.collection('users').doc(user.uid).update({
        strTrialUsed: (userData.strTrialUsed || 0) + 1,
        lastSTRAnalysis: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return res.status(200).json({
      success: true,
      data: strMetrics,
      trialsRemaining: userData.subscriptionTier === 'free' ? 
        Math.max(0, 5 - ((userData.strTrialUsed || 0) + 1)) : 
        'unlimited'
    });

  } catch (error) {
    console.error('STR Analysis Error:', error);
    return res.status(500).json({ 
      error: 'Failed to perform STR analysis',
      details: error.message 
    });
  }
}