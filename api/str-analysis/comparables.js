const admin = require('firebase-admin');
const { requireAuth } = require('../../utils/auth.js');
const { airbnbScraper } = require('../../utils/airbnb-scraper.js');
const { filterComparables } = require('../../utils/str-calculations.js');

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
        error: 'STR comparables require Pro subscription',
        upgradeRequired: true
      });
    }

    // Extract parameters from request
    const { 
      location, 
      bedrooms, 
      bathrooms, 
      propertyType,
      limit = 10,
      offset = 0
    } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    console.log('Fetching STR comparables for:', { location, bedrooms, bathrooms, propertyType });

    try {
      // Query Airbnb Scraper API
      const searchParams = {
        location,
        bedrooms,
        bathrooms,
        propertyType,
        limit: Math.min(limit, 20), // Cap at 20 to control costs
        offset
      };

      const searchResults = await airbnbScraper.searchComparables(searchParams);
      
      console.log(`Found ${searchResults.listings.length} listings`);

      // Apply similarity filtering if property details provided
      let comparables = searchResults.listings;
      if (bedrooms || propertyType) {
        comparables = filterComparables(searchResults.listings, {
          bedrooms,
          bathrooms,
          propertyType
        });
        console.log(`Filtered to ${comparables.length} relevant comparables`);
      }

      // Format comparables for response
      const formattedComparables = comparables.map(comp => ({
        id: comp.id,
        title: comp.title || `${comp.bedrooms || 0}BR ${comp.property_type || 'Property'}`,
        description: comp.description,
        nightlyRate: comp.price || comp.nightly_price,
        bedrooms: comp.bedrooms,
        bathrooms: comp.bathrooms,
        propertyType: comp.property_type || comp.propertyType,
        amenities: comp.amenities || [],
        location: {
          lat: comp.lat,
          lng: comp.lng,
          neighborhood: comp.neighborhood,
          distance: comp.distance
        },
        occupancyRate: comp.occupancy_rate || comp.occupancy || 0.70,
        similarityScore: comp.similarityScore || 0.7,
        rating: comp.rating,
        reviewCount: comp.reviewsCount || comp.review_count || 0,
        imageUrl: comp.image_url || comp.thumbnail,
        images: comp.images || [],
        airbnbUrl: comp.url,
        monthlyRevenue: Math.round((comp.price || comp.nightly_price || 0) * 30.4 * (comp.occupancy_rate || 0.70)),
        lastUpdated: comp.last_updated || new Date().toISOString()
      }));

      // Calculate summary statistics
      const avgNightlyRate = formattedComparables.length > 0
        ? Math.round(formattedComparables.reduce((sum, c) => sum + c.nightlyRate, 0) / formattedComparables.length)
        : 0;

      const avgOccupancy = formattedComparables.length > 0
        ? Math.round(formattedComparables.reduce((sum, c) => sum + c.occupancyRate, 0) / formattedComparables.length * 100) / 100
        : 0;

      return res.status(200).json({
        success: true,
        data: {
          comparables: formattedComparables,
          total: formattedComparables.length,
          summary: {
            avgNightlyRate,
            avgOccupancy,
            avgMonthlyRevenue: Math.round(avgNightlyRate * 30.4 * avgOccupancy),
            priceRange: {
              min: Math.min(...formattedComparables.map(c => c.nightlyRate)),
              max: Math.max(...formattedComparables.map(c => c.nightlyRate))
            }
          },
          metadata: searchResults.metadata || {},
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching comparables:', error);
      
      // Return empty results with error message
      return res.status(200).json({
        success: false,
        data: {
          comparables: [],
          total: 0,
          summary: null,
          error: 'Failed to fetch comparable properties',
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Comparables API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch comparables',
      details: error.message 
    });
  }
};