const admin = require('firebase-admin');
const { requireAuth } = require('../../utils/auth.js');
const { airbnbScraper } = require('../../utils/airbnb-scraper.js');
const { calculateSTRMetrics, filterComparables } = require('../../utils/str-calculations.js');

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
      
      // Calculate STR metrics from comparables
      strMetrics = calculateSTRMetrics(filteredComparables, propertyData);
      
      // Add management costs (typically 20% for STR)
      const managementFeeRate = 0.20;
      const netMonthlyRevenue = strMetrics.monthlyRevenue * (1 - managementFeeRate);
      const netAnnualRevenue = strMetrics.annualRevenue * (1 - managementFeeRate);
      
      // Build comprehensive response
      const strAnalysis = {
        avgNightlyRate: strMetrics.avgNightlyRate,
        medianNightlyRate: strMetrics.medianNightlyRate,
        occupancyRate: strMetrics.occupancyRate,
        monthlyRevenue: strMetrics.monthlyRevenue,
        annualRevenue: strMetrics.annualRevenue,
        netMonthlyRevenue: Math.round(netMonthlyRevenue),
        netAnnualRevenue: Math.round(netAnnualRevenue),
        managementFeeRate,
        priceRange: strMetrics.priceRange,
        comparables: filteredComparables.slice(0, 5).map(comp => ({
          id: comp.id,
          title: comp.title,
          price: comp.price,
          bedrooms: comp.bedrooms,
          propertyType: comp.property_type,
          url: comp.url,
          rating: comp.rating,
          reviewsCount: comp.reviewsCount
        })),
        comparableCount: filteredComparables.length,
        confidence: strMetrics.confidence,
        dataSource: 'airbnb_scraper',
        metadata: searchResults.metadata,
        timestamp: new Date().toISOString()
      };
      
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
      
      const strAnalysis = {
        ...fallbackMetrics,
        netMonthlyRevenue: Math.round(fallbackMetrics.monthlyRevenue * 0.8),
        netAnnualRevenue: Math.round(fallbackMetrics.annualRevenue * 0.8),
        managementFeeRate: 0.20,
        comparables: [],
        comparableCount: 0,
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