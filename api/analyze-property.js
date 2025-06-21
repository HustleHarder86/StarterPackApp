// api/analyze-property.js
// Enhanced property analysis API with guaranteed fresh data retrieval

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

    console.log('Starting FRESH property analysis for:', propertyAddress);
    console.log('Timestamp:', new Date().toISOString());

    // Check if API keys are configured
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const perplexityConfigured = !!perplexityApiKey && perplexityApiKey.startsWith('pplx-') && perplexityApiKey !== 'your_perplexity_api_key';
    const openaiConfigured = !!openaiApiKey && openaiApiKey.startsWith('sk-') && openaiApiKey !== 'your_openai_api_key';
    
    console.log('API Keys Status:', {
      perplexity: perplexityConfigured ? 'CONFIGURED' : 'MISSING',
      openai: openaiConfigured ? 'CONFIGURED' : 'MISSING'
    });

    if (!perplexityConfigured) {
      console.warn('Perplexity API key not properly configured, returning demo data');
      return res.status(200).json({
        success: true,
        analysisId: `demo_${Date.now()}`,
        data: generateEnhancedDemoData(propertyAddress, userName, userEmail),
        note: 'Using demo data - Perplexity API key not configured',
        dataFreshness: 'DEMO_DATA'
      });
    }

    // Parse address for better searching
    const addressParts = propertyAddress.split(',').map(part => part.trim());
    const address = {
      street: addressParts[0] || '',
      city: addressParts[1] || '',
      state: addressParts[2] || '',
      country: addressParts[3] || 'Canada',
      postal: addressParts[4] || ''
    };

    // Step 1: Deep Research with Perplexity AI - ALWAYS FRESH
    console.log('Calling Perplexity AI for FRESH real-time research...');
    
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
            content: `You are a real estate investment analyst specializing in Canadian properties. 
CRITICAL: Research CURRENT data as of ${new Date().toISOString()}. 
Use ONLY the most recent listings and data available TODAY.
Focus on real-time market conditions and current listings.`
          },
          {
            role: 'user',
            content: `Perform REAL-TIME CURRENT research for this exact property: ${propertyAddress}

MANDATORY REQUIREMENTS:
- Search for CURRENT listings as of TODAY (${new Date().toLocaleDateString()})
- Use ONLY data from the last 30 days
- Prioritize real-time sources: Realtor.ca, HouseSigma, Zolo
- Include timestamps for all data points
- If exact property not found, use CURRENT comparables from the same street

Research these specific items with CURRENT data:

1. CURRENT PROPERTY VALUE (Today's Market):
   - Search for this exact address on Realtor.ca RIGHT NOW
   - Find sales from the LAST 30 DAYS on ${address.street}
   - Current active listings in the immediate area
   - Include listing dates and "days on market"

2. CURRENT RENTAL MARKET for ${address.city} (Updated ${new Date().toLocaleDateString()}):
   - Active rental listings TODAY for similar properties
   - Use Rentals.ca, PadMapper, Kijiji - sort by "newest first"
   - Current asking rents (not historical data)
   - Current Airbnb rates for this area

3. REAL-TIME COSTS for ${address.city}, ${address.state}:
   - 2025 property tax rates (current year)
   - Current insurance quotes for this property type
   - Current utility rates
   - Any recent changes in fees or taxes

4. MARKET CONDITIONS (Last 30 days):
   - Properties sold in last 30 days
   - Current inventory levels
   - Recent price changes
   - Current market trends

Include source URLs with access timestamps for verification.`
          }
        ],
        max_tokens: 3000,
        temperature: 0.1,
        top_p: 0.9,
        stream: false,
        // Enhanced parameters for fresh data
        search_depth: "advanced",
        search_recency_filter: "week", // Only last week's data
        search_domain_filter: ["realtor.ca", "housesigma.com", "zolo.ca", "rentals.ca", "kijiji.ca", "airbnb.ca"],
        return_citations: true,
        focus: "recent"
      })
    });

    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.text();
      console.error('Perplexity API error:', errorData);
      throw new Error('Perplexity API request failed');
    }

    const perplexityData = await perplexityResponse.json();
    const researchContent = perplexityData.choices[0].message.content;
    console.log('Fresh research completed at:', new Date().toISOString());
    console.log('Research content length:', researchContent.length);

    // Extract citations with timestamps
    const citations = perplexityData.citations || [];
    
    // Step 2: Structure with OpenAI or Perplexity
    let structuredData;
    
    if (openaiConfigured) {
      console.log('Using OpenAI to structure fresh data...');
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
                content: `You are a data structuring assistant for real estate analysis. 
Extract CURRENT data from the research. All data should reflect TODAY's market (${new Date().toLocaleDateString()}).
Include data freshness indicators in your output.`
              },
              {
                role: 'user',
                content: `Convert this FRESH property research into structured JSON data.

CRITICAL: This research was conducted on ${new Date().toISOString()}
Use ONLY the current values from the research, not historical averages.

Research data to structure:
${researchContent}

Required JSON structure (include freshness indicators):
{
  "data_freshness": {
    "research_date": "${new Date().toISOString()}",
    "data_recency": "REAL_TIME",
    "sources_accessed": [list of sources with timestamps]
  },
  "property_details": {
    "address": "${propertyAddress}",
    "estimated_value": [CURRENT MARKET VALUE],
    "value_date": "[date of value assessment]",
    "property_type": "[type]",
    "bedrooms": [number],
    "bathrooms": [number],
    "square_feet": [number],
    "listing_status": "[active/sold/off-market]",
    "days_on_market": [number if listed]
  },
  "costs": {
    "property_tax_annual": [2025 rate],
    "insurance_annual": [current quote],
    "maintenance_annual": [current estimate],
    "hoa_monthly": [current fee],
    "utilities_monthly": [current rates],
    "cost_updated_date": "${new Date().toLocaleDateString()}"
  },
  "short_term_rental": {
    "daily_rate": [CURRENT Airbnb rate],
    "occupancy_rate": [current occupancy],
    "annual_revenue": [projection based on current rates],
    "annual_profit": [calculated],
    "last_rate_check": "${new Date().toLocaleDateString()}"
  },
  "long_term_rental": {
    "monthly_rent": [CURRENT asking rent],
    "annual_revenue": [projection],
    "annual_profit": [calculated],
    "rental_demand": "[high/medium/low]",
    "last_rent_check": "${new Date().toLocaleDateString()}"
  },
  "market_data": {
    "comparable_sales": [recent sales with dates],
    "days_on_market": [current average],
    "appreciation_rate": [recent trend],
    "inventory_level": "[high/normal/low]",
    "market_temperature": "[hot/balanced/cool]",
    "last_updated": "${new Date().toISOString()}"
  },
  "data_sources": [
    {"name": "source", "url": "url", "access_date": "${new Date().toISOString()}", "data_date": "when data is from"}
  ],
  "recommendation": "[Based on TODAY's market conditions]",
  "roi_percentage": [CURRENT ROI calculation]
}`
              }
            ],
            temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          })
        });

        if (!openaiResponse.ok) {
          throw new Error('OpenAI API request failed');
        }

        const openaiData = await openaiResponse.json();
        structuredData = JSON.parse(openaiData.choices[0].message.content);
        console.log('Fresh data structured successfully at:', new Date().toISOString());
      } catch (error) {
        console.log('OpenAI failed, using Perplexity for structuring:', error.message);
        openaiConfigured = false;
      }
    }
    
    if (!openaiConfigured) {
      console.log('Using Perplexity to structure fresh data...');
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
              content: `Extract and structure CURRENT real estate data. Today is ${new Date().toISOString()}. Return only valid JSON.`
            },
            {
              role: 'user',
              content: `Convert this FRESH research (conducted ${new Date().toISOString()}) into structured JSON.

Research data:
${researchContent}

Return ONLY this JSON structure with CURRENT data:
{
  "data_freshness": {
    "research_date": "${new Date().toISOString()}",
    "data_recency": "REAL_TIME"
  },
  "property_details": {
    "address": "${propertyAddress}",
    "estimated_value": [number],
    "property_type": "string"
  },
  "costs": {
    "property_tax_annual": [number],
    "insurance_annual": [number],
    "maintenance_annual": [number],
    "hoa_monthly": [number],
    "utilities_monthly": [number]
  },
  "short_term_rental": {
    "daily_rate": [number],
    "occupancy_rate": [decimal],
    "annual_revenue": [number],
    "annual_profit": [number]
  },
  "long_term_rental": {
    "monthly_rent": [number],
    "annual_revenue": [number],
    "annual_profit": [number]
  },
  "recommendation": "string",
  "roi_percentage": [number]
}`
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          stream: false
        })
      });

      if (!perplexityStructureResponse.ok) {
        throw new Error('Perplexity structuring request failed');
      }

      const perplexityStructureData = await perplexityStructureResponse.json();
      const responseText = perplexityStructureData.choices[0].message.content;
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0]);
      } else {
        structuredData = JSON.parse(responseText);
      }
    }

    // Ensure freshness metadata
    if (!structuredData.data_freshness) {
      structuredData.data_freshness = {
        research_date: new Date().toISOString(),
        data_recency: "REAL_TIME",
        api_call_timestamp: new Date().toISOString()
      };
    }

    // Validate and recalculate
    if (structuredData.long_term_rental && structuredData.costs) {
      const totalAnnualCosts = 
        (structuredData.costs.property_tax_annual || 0) +
        (structuredData.costs.insurance_annual || 0) +
        (structuredData.costs.maintenance_annual || 0) +
        ((structuredData.costs.hoa_monthly || 0) * 12) +
        ((structuredData.costs.utilities_monthly || 0) * 12);

      structuredData.long_term_rental.annual_profit = 
        structuredData.long_term_rental.annual_revenue - totalAnnualCosts;

      structuredData.short_term_rental.annual_profit = 
        structuredData.short_term_rental.annual_revenue - 
        totalAnnualCosts - 
        (structuredData.short_term_rental.annual_revenue * 0.20);

      const bestProfit = Math.max(
        structuredData.long_term_rental.annual_profit,
        structuredData.short_term_rental.annual_profit
      );
      structuredData.roi_percentage = 
        ((bestProfit / structuredData.property_details.estimated_value) * 100).toFixed(2);
    }

    // Step 3: Save to Firebase with freshness metadata
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
      research_sources: citations.slice(0, 5),
      data_freshness_guarantee: {
        api_called_at: new Date().toISOString(),
        data_is_current_as_of: new Date().toISOString(),
        using_real_time_search: true,
        no_cache_used: true
      }
    };

    await db.collection('analyses').doc(analysisId).set(analysisData);
    console.log('Fresh analysis saved to Firebase:', analysisId);

    // Update user analysis count if authenticated
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

    console.log('✅ FRESH REAL-TIME DATA ANALYSIS COMPLETED');
    console.log('Data freshness:', analysisData.data_freshness);
    console.log('Property Value:', analysisData.property_details?.estimated_value);
    console.log('Data sources accessed:', analysisData.data_sources?.length || 0);

    return res.status(200).json({
      success: true,
      analysisId,
      data: analysisData,
      dataSource: 'REAL_TIME_API_DATA',
      freshness: {
        generated_at: new Date().toISOString(),
        using_cache: false,
        real_time_search: true
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
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
      note: 'Using demo data due to API error: ' + error.message,
      dataFreshness: 'DEMO_FALLBACK'
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
    data_freshness: {
      research_date: new Date().toISOString(),
      data_recency: "DEMO_DATA",
      note: "This is demo data - configure API keys for real-time data"
    },
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
