// Simplified property ingest endpoint for browser extension
// This version works without Firebase Admin SDK verification
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Basic token validation (check format)
    if (!token || token.split('.').length !== 3) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Decode token to get user info (without full verification for now)
    let userId, userEmail;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.user_id || payload.sub;
      userEmail = payload.email;
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get property data from request
    const { propertyData, source, timestamp } = req.body;
    
    if (!propertyData) {
      return res.status(400).json({ error: 'No property data provided' });
    }

    // Log the ingestion
    console.log('Property ingested:', {
      userId,
      userEmail,
      mlsNumber: propertyData.mlsNumber,
      address: propertyData.address,
      price: propertyData.price,
      source,
      timestamp
    });

    // Build query string for ROI finder
    const queryParams = new URLSearchParams();
    
    // Add address components
    if (propertyData.address) {
      if (propertyData.address.street) queryParams.set('street', propertyData.address.street);
      if (propertyData.address.city) queryParams.set('city', propertyData.address.city);
      if (propertyData.address.province) queryParams.set('state', propertyData.address.province);
      if (propertyData.address.country) queryParams.set('country', propertyData.address.country);
      if (propertyData.address.postalCode) queryParams.set('postal', propertyData.address.postalCode);
    }
    
    // Add property details
    if (propertyData.price) queryParams.set('price', propertyData.price);
    if (propertyData.mlsNumber) queryParams.set('mlsNumber', propertyData.mlsNumber);
    if (propertyData.bedrooms) queryParams.set('bedrooms', propertyData.bedrooms);
    if (propertyData.bathrooms) queryParams.set('bathrooms', propertyData.bathrooms);
    if (propertyData.sqft) queryParams.set('sqft', propertyData.sqft);
    if (propertyData.propertyType) queryParams.set('propertyType', propertyData.propertyType);
    if (propertyData.yearBuilt) queryParams.set('yearBuilt', propertyData.yearBuilt);
    if (propertyData.taxes) queryParams.set('taxes', propertyData.taxes);
    if (propertyData.condoFees) queryParams.set('condoFees', propertyData.condoFees);
    
    // Mark as from extension
    queryParams.set('fromExtension', 'true');
    queryParams.set('autoAnalyze', 'true');

    // Generate analysis URL
    const analysisUrl = `https://starter-pack-app.vercel.app/roi-finder.html?${queryParams.toString()}`;
    
    // Generate a temporary analysis ID
    const analysisId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return res.status(200).json({
      success: true,
      analysisId,
      analysisUrl,
      message: 'Property data received. Redirecting to analysis...',
      propertyData: {
        mlsNumber: propertyData.mlsNumber,
        address: propertyData.address,
        price: propertyData.price,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        sqft: propertyData.sqft
      }
    });

  } catch (error) {
    console.error('Ingest error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}