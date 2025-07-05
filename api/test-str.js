/**
 * Test endpoint for STR analysis - Development only
 * Remove this file before production deployment
 */

const { airbnbScraper } = require('../utils/airbnb-scraper.js');
const { calculateSTRMetrics, filterComparables } = require('../utils/str-calculations.js');

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

  // Only allow GET for this test endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if Apify token is configured
  if (!process.env.APIFY_API_TOKEN) {
    return res.status(500).json({ 
      error: 'APIFY_API_TOKEN not configured',
      message: 'Please set APIFY_API_TOKEN in your environment variables'
    });
  }

  try {
    // Test property (Milton, Ontario)
    const testProperty = {
      address: {
        street: '123 Test St',
        city: 'Toronto',
        province: 'Ontario'
      },
      bedrooms: 2,
      bathrooms: 2,
      propertyType: 'Condo',
      sqft: 1200,
      price: 650000
    };

    console.log('Testing STR analysis with property:', testProperty);

    // Search for comparables
    const searchResults = await airbnbScraper.searchComparables(testProperty);
    
    // Filter comparables
    const filteredComparables = filterComparables(searchResults.listings, testProperty);
    
    // Calculate metrics
    const strMetrics = calculateSTRMetrics(filteredComparables, testProperty);

    return res.status(200).json({
      success: true,
      testProperty,
      searchResults: {
        totalFound: searchResults.listings.length,
        filteredCount: filteredComparables.length,
        metadata: searchResults.metadata
      },
      metrics: strMetrics,
      sampleComparables: filteredComparables.slice(0, 3).map(comp => ({
        title: comp.title,
        price: comp.price,
        bedrooms: comp.bedrooms,
        propertyType: comp.property_type,
        url: comp.url
      }))
    });

  } catch (error) {
    console.error('Test STR Error:', error);
    return res.status(500).json({ 
      error: 'Failed to perform test STR analysis',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};