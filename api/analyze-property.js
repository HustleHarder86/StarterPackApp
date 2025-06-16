// api/analyze-property.js
// Main API endpoint for property analysis using Perplexity + OpenAI

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, propertyAddress, userEmail, userName, requestType } = req.body;

    if (!propertyAddress) {
      return res.status(400).json({ error: 'Property address is required' });
    }

    // Step 1: Call Perplexity AI for property research
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: `Conduct deep research on this Canadian real estate investment property: ${propertyAddress}

Research and provide detailed information on:

PROPERTY DETAILS:
- Current market value and recent comparable sales
- Property type and characteristics
- Year built, size, lot details

CARRYING COSTS:
- Annual property taxes (exact municipal rates)
- Home insurance costs for this area/property type
- Typical maintenance costs (as percentage of property value)
- HOA/condo fees if applicable
- Utility costs if landlord-paid

SHORT-TERM RENTAL ANALYSIS:
- Current Airbnb daily rates for similar properties in area
- Seasonal occupancy rates and demand patterns
- Local STR regulations and restrictions
- Competition analysis

LONG-TERM RENTAL ANALYSIS:
- Current rental rates for comparable properties
- Rental market demand and vacancy rates
- Tenant demographics and rental regulations

MARKET CONDITIONS:
- Recent price trends and market outlook
- Neighborhood characteristics affecting rental demand
- Economic factors affecting property values
- Investment potential and risks

Provide comprehensive, factual data with specific numbers where possible. Focus on current market conditions and realistic projections.`
          }
        ],
        max_tokens: 3500,
        temperature: 0.2,
        top_p: 0.9,
        stream: false
      })
    });

    if (!perplexityResponse.ok) {
      throw new Error('Perplexity API request failed');
    }

    const perplexityData = await perplexityResponse.json();
    const researchContent = perplexityData.choices[0].message.content;

    // Step 2: Structure data with OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a data structuring assistant. Convert real estate analysis into exact JSON format.'
          },
          {
            role: 'user',
            content: `Convert this real estate analysis into the exact JSON structure below. Use the research data to populate accurate values:

{
  "property_details": {
    "address": "${propertyAddress}",
    "estimated_value": [market value as number],
    "property_type": "[Single Family/Duplex/Condo/Townhouse]"
  },
  "costs": {
    "property_tax_annual": [annual amount],
    "insurance_annual": [annual amount], 
    "maintenance_annual": [annual amount],
    "hoa_monthly": [monthly amount, 0 if none],
    "utilities_monthly": [monthly amount, 0 if tenant pays]
  },
  "short_term_rental": {
    "daily_rate": [average daily rate],
    "occupancy_rate": [rate as decimal like 0.75],
    "annual_revenue": [calculated gross revenue],
    "annual_profit": [revenue minus all costs]
  },
  "long_term_rental": {
    "monthly_rent": [average monthly rent],
    "annual_revenue": [rent × 12],
    "annual_profit": [revenue minus all costs]
  },
  "recommendation": "[2-3 sentence investment recommendation]",
  "roi_percentage": [best ROI as decimal like 0.08]
}

Research data:
${researchContent}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openaiData = await openaiResponse.json();
    const structuredData = JSON.parse(openaiData.choices[0].message.content);

    // Step 3: Save to Firebase
    const adminModule = await import('firebase-admin');
    const admin = adminModule.default;
    
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }

    const db = admin.firestore();
    const analysisId = `analysis_${userId || 'demo'}_${Date.now()}`;
    
    const analysisData = {
      ...structuredData,
      userId: userId || null,
      userName: userName || null,
      userEmail: userEmail || null,
      propertyAddress,
      requestType: requestType || 'demo',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed',
      lead_id: analysisId,
      lead_name: userName || 'Demo User',
      lead_email: userEmail || 'demo@example.com',
      analysis_timestamp: new Date().toISOString()
    };

    await db.collection('analyses').doc(analysisId).set(analysisData);

    // If authenticated user, update their analysis count
    if (userId && requestType === 'authenticated') {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        monthlyAnalysisCount: admin.firestore.FieldValue.increment(1)
      });
    }

    // Return the analysis data
    return res.status(200).json({
      success: true,
      analysisId,
      data: analysisData
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: error.message 
    });
  }
}
