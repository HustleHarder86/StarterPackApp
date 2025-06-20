// api/analyze-property.js
// Enhanced property analysis API with deep research and cost controls

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

    console.log('Starting property analysis for:', propertyAddress);

    // Check if API keys are configured
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    console.log('API Key validation:', {
      perplexity: {
        exists: !!perplexityApiKey,
        isValid: !!perplexityApiKey && perplexityApiKey.startsWith('pplx-'),
        length: perplexityApiKey ? perplexityApiKey.length : 0,
        isPlaceholder: perplexityApiKey === 'your_perplexity_api_key'
      },
      openai: {
        exists: !!openaiApiKey,
        isValid: !!openaiApiKey && openaiApiKey.startsWith('sk-'),
        length: openaiApiKey ? openaiApiKey.length : 0,
        isPlaceholder: openaiApiKey === 'your_openai_api_key'
      }
    });

    // Only require Perplexity API for now, since that's what's working
    if (!perplexityApiKey || perplexityApiKey === 'your_perplexity_api_key') {
      console.warn('Perplexity API key not properly configured, returning demo data');
      return res.status(200).json({
        success: true,
        analysisId: `demo_${Date.now()}`,
        data: generateEnhancedDemoData(propertyAddress, userName, userEmail),
        note: 'Using demo data - Perplexity API key not configured'
      });
    }

    console.log('✅ API keys validated successfully, proceeding with real API calls');

    // Parse address for better searching
    const addressParts = propertyAddress.split(',').map(part => part.trim());
    const address = {
      street: addressParts[0] || '',
      city: addressParts[1] || '',
      state: addressParts[2] || '',
      country: addressParts[3] || 'Canada',
      postal: addressParts[4] || ''
    };

    // Step 1: Deep Research with Perplexity AI
    console.log('Calling Perplexity AI for deep research...');
    
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate investment analyst specializing in Canadian properties. Research deeply using authoritative sources like Realtor.ca, HouseSigma, Zolo, local MLS data, and government property tax databases. Focus on accuracy and use only 3-5 high-quality sources to control costs.'
          },
          {
            role: 'user',
            content: `Perform DEEP RESEARCH for this exact property: ${propertyAddress}

CRITICAL INSTRUCTIONS:
- Use ONLY 3-5 authoritative sources (prioritize: Realtor.ca, HouseSigma, Zolo, municipal websites)
- Find ACTUAL data, not estimates
- If exact property data isn't available, use very similar properties on the SAME street
- Include source URLs for verification

Research these specific items:

1. PROPERTY VALUE (Most Important):
   - Search for this exact address on Realtor.ca and HouseSigma
   - Find recent sales (last 6 months) of similar properties on ${address.street}
   - Look for current listings in the immediate area
   - Check municipal property tax assessment

2. RENTAL MARKET for ${address.city}:
   - Current rental listings for similar properties in this neighborhood
   - Use Rentals.ca, PadMapper, or Kijiji for ${address.city}
   - Find actual rental prices, not estimates
   - Include both long-term and short-term (Airbnb) rates if available

3. EXACT COSTS for ${address.city}, ${address.state}:
   - Property tax rate (mill rate) - check city website
   - Typical home insurance costs for this property type
   - Condo/HOA fees if applicable (check listings)
   - Average utilities if landlord-paid

4. NEIGHBORHOOD DATA:
   - Recent price appreciation (last 3-5 years)
   - Average days on market
   - Proximity to transit, schools, employment

Format your response with clear sections and include source citations [Source: URL] for each data point.`
          }
        ],
        max_tokens: 2500,
        temperature: 0.1,
        top_p: 0.9,
        stream: false,
        // Cost control parameters
        search_domain_filter: ["realtor.ca", "housesigma.com", "zolo.ca", "rentals.ca", "kijiji.ca", ".gov", ".ca"],
        search_recency_filter: "month",
        return_citations: true,
        search_depth: "advanced"
      })
    });

    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.text();
      console.error('Perplexity API error:', errorData);
      throw new Error('Perplexity API request failed');
    }

    const perplexityData = await perplexityResponse.json();
    const researchContent = perplexityData.choices[0].message.content;
    console.log('Perplexity research completed, length:', researchContent.length);

    // Extract citations if available
    const citations = perplexityData.citations || [];
    
    // Step 2: Structure with OpenAI (or fallback to Perplexity if OpenAI not available)
    console.log('Structuring research data...');
    
    let structuredData;
    
    if (openaiApiKey && openaiApiKey !== 'your_openai_api_key' && openaiApiKey.startsWith('sk-')) {
      console.log('Using OpenAI for data structuring...');
      try {
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
                content: 'You are a data structuring assistant for real estate analysis. Extract actual data from research and create accurate JSON. If the research contains specific values, use those exact values. Never make up data.'
              },
              {
                role: 'user',
                content: `Convert this property research into structured JSON data.

IMPORTANT RULES:
1. Use ACTUAL VALUES from the research, not generic estimates
2. If research mentions a specific price/rent, use that exact number
3. For costs, use actual percentages mentioned or these defaults:
   - Property tax: Use actual mill rate if provided, otherwise ~1.2% for Ontario
   - Insurance: ~0.35% of property value annually
   - Maintenance: 1-1.5% of property value annually
4. Calculate all derived values accurately

Research data to structure:
${researchContent}

Required JSON structure:
{
  "property_details": {
    "address": "${propertyAddress}",
    "estimated_value": [USE ACTUAL VALUE FROM RESEARCH],
    "property_type": "[Single Family/Condo/Townhouse/Semi-Detached]",
    "bedrooms": [number if mentioned],
    "bathrooms": [number if mentioned],
    "square_feet": [number if mentioned]
  },
  "costs": {
    "property_tax_annual": [CALCULATE FROM ACTUAL TAX RATE],
    "insurance_annual": [REALISTIC FOR PROPERTY TYPE],
    "maintenance_annual": [1-1.5% OF VALUE],
    "hoa_monthly": [ACTUAL IF MENTIONED, 0 if not applicable],
    "utilities_monthly": [ACTUAL IF MENTIONED, otherwise 200-300]
  },
  "short_term_rental": {
    "daily_rate": [FROM AIRBNB RESEARCH],
    "occupancy_rate": [DECIMAL, typically 0.65-0.75],
    "annual_revenue": [CALCULATE: daily_rate * 365 * occupancy_rate],
    "annual_profit": [revenue - all costs - 20% management]
  },
  "long_term_rental": {
    "monthly_rent": [ACTUAL FROM RESEARCH],
    "annual_revenue": [monthly_rent * 12 * 0.95 (5% vacancy)],
    "annual_profit": [revenue - all costs]
  },
  "market_data": {
    "comparable_sales": [array of recent sales if mentioned],
    "days_on_market": [average if mentioned],
    "appreciation_rate": [annual % if mentioned]
  },
  "data_sources": [
    {"name": "source name", "url": "source url", "date": "access date"}
  ],
  "recommendation": "[Detailed recommendation based on calculations]",
  "roi_percentage": [CALCULATE ACTUAL ROI]
}`
              }
            ],
            temperature: 0.1,
            max_tokens: 1500,
            response_format: { type: "json_object" }
          })
        });

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.text();
          console.error('OpenAI API error:', errorData);
          throw new Error('OpenAI API request failed');
        }

        const openaiData = await openaiResponse.json();
        structuredData = JSON.parse(openaiData.choices[0].message.content);
        console.log('Data structured successfully with OpenAI');
      } catch (error) {
        console.warn('OpenAI structuring failed, falling back to Perplexity...', error.message);
        // Fall through to Perplexity fallback
      }
    }
    
    // Fallback: Use Perplexity for structuring if OpenAI failed or not available
    if (!structuredData) {
      console.log('Using Perplexity for data structuring...');
      const perplexityStructureResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a data structuring assistant. Convert research text into valid JSON format. Use actual values from research, never make up data. Respond with ONLY valid JSON, no explanations.'
            },
            {
              role: 'user',
              content: `Convert this property research into structured JSON. Use actual values mentioned in the research:

${researchContent}

Return valid JSON with this structure (replace [...] with actual values from research):
{"property_details":{"address":"${propertyAddress}","estimated_value":0,"property_type":"","bedrooms":0,"bathrooms":0,"square_feet":0},"costs":{"property_tax_annual":0,"insurance_annual":0,"maintenance_annual":0,"hoa_monthly":0,"utilities_monthly":0},"short_term_rental":{"daily_rate":0,"occupancy_rate":0.7,"annual_revenue":0,"annual_profit":0},"long_term_rental":{"monthly_rent":0,"annual_revenue":0,"annual_profit":0},"market_data":{"comparable_sales":[],"days_on_market":0,"appreciation_rate":0},"data_sources":[],"recommendation":"","roi_percentage":0}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!perplexityStructureResponse.ok) {
        throw new Error('Data structuring failed - both OpenAI and Perplexity unavailable');
      }

      const perplexityStructureData = await perplexityStructureResponse.json();
      const structureContent = perplexityStructureData.choices[0].message.content;
      
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = structureContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0]);
        console.log('Data structured successfully with Perplexity');
      } else {
        throw new Error('Failed to extract valid JSON from structuring response');
      }
    }

    // Validate and ensure calculations are correct
    if (structuredData.long_term_rental && structuredData.costs) {
      const totalAnnualCosts = 
        structuredData.costs.property_tax_annual +
        structuredData.costs.insurance_annual +
        structuredData.costs.maintenance_annual +
        (structuredData.costs.hoa_monthly * 12) +
        (structuredData.costs.utilities_monthly * 12);

      // Recalculate profits to ensure accuracy
      structuredData.long_term_rental.annual_profit = 
        structuredData.long_term_rental.annual_revenue - totalAnnualCosts;

      structuredData.short_term_rental.annual_profit = 
        structuredData.short_term_rental.annual_revenue - 
        totalAnnualCosts - 
        (structuredData.short_term_rental.annual_revenue * 0.20); // 20% management

      // Calculate accurate ROI
      const bestProfit = Math.max(
        structuredData.long_term_rental.annual_profit,
        structuredData.short_term_rental.annual_profit
      );
      structuredData.roi_percentage = 
        ((bestProfit / structuredData.property_details.estimated_value) * 100).toFixed(2);
    }

    // Step 3: Save to Firebase
    const adminModule = await import('firebase-admin');
    const admin = adminModule.default;
    
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
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
      lead_name: userName || 'User',
      lead_email: userEmail || 'user@example.com',
      analysis_timestamp: new Date().toISOString(),
      property_address: propertyAddress,
      research_sources: citations.slice(0, 5) // Save top 5 sources
    };

    await db.collection('analyses').doc(analysisId).set(analysisData);
    console.log('Analysis saved to Firebase:', analysisId);

    // If authenticated user, update their analysis count
    if (userId && requestType === 'authenticated') {
      try {
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          monthlyAnalysisCount: admin.firestore.FieldValue.increment(1),
          lastAnalysisDate: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Failed to update analysis count:', error);
      }
    }

    console.log('✅ Analysis completed successfully with REAL API data');
    console.log('Property analyzed:', propertyAddress);
    console.log('Estimated value from research:', structuredData.property_details?.estimated_value);
    console.log('Data sources used:', structuredData.data_sources?.length || 0);

    return res.status(200).json({
      success: true,
      analysisId,
      data: analysisData,
      note: 'Analysis completed using real market data from Perplexity AI'
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    console.log('🔄 Falling back to demo data due to API error');
    
    // Return enhanced demo data as fallback
    const demoData = generateEnhancedDemoData(
      req.body.propertyAddress || '123 Demo Street, City, State, Country',
      req.body.userName || 'User',
      req.body.userEmail || 'user@example.com'
    );
    
    return res.status(200).json({
      success: true,
      analysisId: `demo_${Date.now()}`,
      data: demoData,
      note: '⚠️ Using demo data due to API error: ' + error.message
    });
  }
}

// Generate realistic demo data for Canadian properties
function generateEnhancedDemoData(propertyAddress, userName, userEmail) {
  // Parse address to customize demo data
  const addressLower = propertyAddress.toLowerCase();
  
  // More realistic Canadian property values
  let baseValue = 850000; // Default for Ontario urban areas
  
  if (addressLower.includes('toronto')) {
    baseValue = Math.floor(Math.random() * 400000) + 900000; // $900k-$1.3M
  } else if (addressLower.includes('mississauga') || addressLower.includes('oakville')) {
    baseValue = Math.floor(Math.random() * 300000) + 700000; // $700k-$1M
  } else if (addressLower.includes('vancouver')) {
    baseValue = Math.floor(Math.random() * 500000) + 1200000; // $1.2M-$1.7M
  } else if (addressLower.includes('calgary') || addressLower.includes('edmonton')) {
    baseValue = Math.floor(Math.random() * 200000) + 450000; // $450k-$650k
  }
  
  // Determine property type
  let propertyType = 'Single Family';
  if (addressLower.includes('condo') || addressLower.includes('apt')) {
    propertyType = 'Condo';
    baseValue = Math.floor(baseValue * 0.7); // Condos typically cheaper
  } else if (addressLower.includes('townhouse') || addressLower.includes('townhome')) {
    propertyType = 'Townhouse';
    baseValue = Math.floor(baseValue * 0.85);
  }
  
  // Calculate realistic costs for Canadian properties
  const propertyTax = Math.round(baseValue * 0.01); // ~1% in Ontario
  const insurance = Math.round(baseValue * 0.0035); // 0.35% insurance
  const maintenance = Math.round(baseValue * 0.015); // 1.5% maintenance
  const hoaMonthly = propertyType === 'Condo' ? Math.round(baseValue * 0.0008) : 0; // ~$500-800 for condos
  const utilities = propertyType === 'Condo' ? 0 : 250; // Condos often include utilities
  
  // Calculate rental potential - Canadian rates
  const monthlyRent = Math.round(baseValue * 0.004); // 0.4% rent-to-value ratio
  const dailyRate = Math.round(monthlyRent / 10); // Airbnb typically 3x nightly
  const occupancyRate = 0.70; // 70% occupancy for STR
  
  // Calculate revenues and profits
  const annualCosts = propertyTax + insurance + maintenance + (hoaMonthly * 12) + (utilities * 12);
  const strRevenue = Math.round(dailyRate * 365 * occupancyRate);
  const strProfit = Math.round(strRevenue - annualCosts - (strRevenue * 0.20)); // 20% management
  const ltrRevenue = Math.round(monthlyRent * 12 * 0.95); // 5% vacancy
  const ltrProfit = ltrRevenue - annualCosts;
  
  // Calculate ROI
  const strROI = ((strProfit / baseValue) * 100).toFixed(2);
  const ltrROI = ((ltrProfit / baseValue) * 100).toFixed(2);
  const bestROI = Math.max(parseFloat(strROI), parseFloat(ltrROI));
  
  return {
    lead_id: `demo_${Date.now()}`,
    lead_name: userName,
    lead_email: userEmail,
    property_address: propertyAddress,
    analysis_timestamp: new Date().toISOString(),
    property_details: {
      address: propertyAddress,
      estimated_value: baseValue,
      property_type: propertyType,
      bedrooms: propertyType === 'Condo' ? 2 : 3,
      bathrooms: propertyType === 'Condo' ? 2 : 3,
      square_feet: propertyType === 'Condo' ? 850 : 1800
    },
    costs: {
      property_tax_annual: propertyTax,
      hoa_monthly: hoaMonthly,
      utilities_monthly: utilities,
      insurance_annual: insurance,
      maintenance_annual: maintenance
    },
    short_term_rental: {
      daily_rate: dailyRate,
      occupancy_rate: occupancyRate * 100,
      annual_revenue: strRevenue,
      annual_profit: strProfit
    },
    long_term_rental: {
      monthly_rent: monthlyRent,
      annual_revenue: ltrRevenue,
      annual_profit: ltrProfit
    },
    market_data: {
      comparable_sales: [],
      days_on_market: 15,
      appreciation_rate: 5.2
    },
    data_sources: [
      {"name": "Demo Data", "url": "internal", "date": new Date().toISOString()}
    ],
    recommendation: strROI > ltrROI 
      ? `Short-term rental recommended. The property shows strong potential for Airbnb with ${(occupancyRate * 100).toFixed(0)}% occupancy rate and ${bestROI}% ROI, significantly higher than long-term rental at ${ltrROI}% ROI. Consider local STR regulations.`
      : `Long-term rental recommended. This strategy offers ${bestROI}% ROI with stable monthly income of $${monthlyRent.toLocaleString()}, outperforming short-term rental which yields ${strROI}% ROI. Lower management overhead and more predictable returns.`,
    roi_percentage: bestROI
  };
}
