// Test endpoint for STR analysis development
// This endpoint bypasses authentication for testing purposes

export default async function handler(req, res) {
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

  // Allow both GET and POST for testing
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test data
    const testProperty = {
      address: '796 Childs Drive, Milton, ON',
      city: 'Milton',
      province: 'Ontario',
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'Single Family',
      sqft: 1500
    };

    console.log('STR Test Endpoint Called');
    console.log('Test property:', testProperty);

    // TODO: Test Airbnb Scraper integration here
    
    // Mock response for testing
    const mockSTRData = {
      location: `${testProperty.city}, ${testProperty.province}`,
      avgNightlyRate: 175,
      occupancyRate: 0.72,
      monthlyRevenue: 3780,
      annualRevenue: 45360,
      comparables: [
        {
          title: "Cozy 3BR Home in Milton",
          url: "https://www.airbnb.ca/rooms/12345",
          price: 165,
          rating: 4.8,
          reviews: 23,
          bedrooms: 3,
          distance: "0.5 km"
        },
        {
          title: "Modern Family House",
          url: "https://www.airbnb.ca/rooms/67890",
          price: 185,
          rating: 4.9,
          reviews: 45,
          bedrooms: 3,
          distance: "1.2 km"
        }
      ],
      searchParams: {
        location: `${testProperty.city}, ${testProperty.province}`,
        bedrooms: testProperty.bedrooms,
        propertyType: testProperty.propertyType
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'STR test endpoint working',
      testProperty,
      strData: mockSTRData,
      environment: {
        hasApifyToken: !!process.env.APIFY_API_TOKEN,
        hasActorId: !!process.env.AIRBNB_SCRAPER_ACTOR_ID
      }
    });

  } catch (error) {
    console.error('STR Test Error:', error);
    return res.status(500).json({ 
      error: 'Test endpoint error',
      details: error.message 
    });
  }
}