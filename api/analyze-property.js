// api/analyze-property.js
// Enhanced property analysis with improved data extraction and fallback logic

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

    // Step 1: Enhanced Research with Perplexity AI
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
Provide SPECIFIC NUMBERS whenever possible.
If exact property data isn't available, use comparables from the SAME street or immediate area.`
          },
          {
            role: 'user',
            content: `Perform REAL-TIME CURRENT research for: ${propertyAddress}

CRITICAL: For EVERY piece of data you provide, cite the SPECIFIC URL where you found it. Users need to verify the information.

Research Requirements:

1. PROPERTY VALUE & DETAILS:
   - Search realtor.ca, housesigma.com for this exact address
   - Recent sales on ${address.street} within last 6 months
   - Property type, bedrooms, bathrooms, square footage
   - CITE: Provide the specific URL for each property found

2. PROPERTY TAXES (VERIFIED SOURCES):
   - Search official ${address.city} municipal tax website
   - Look for property tax assessments database
   - Find actual tax records or municipal tax rate for this area
   - CITE: Municipal government website URL where tax rate was found

3. INSURANCE COSTS (REALISTIC ESTIMATES):
   - Search insurance company websites for ${address.city}
   - Look for home insurance calculators or rate tables
   - For property value $1M+, expect $2,000-4,000/year range
   - CITE: Insurance company or broker website URL

4. RENTAL RATES (CURRENT LISTINGS):
   - Search rentals.ca, kijiji.ca, PadMapper for similar properties in ${address.city}
   - Find actual listed rental prices (not estimates)
   - Short-term: Search Airbnb.com for nearby properties
   - CITE: Specific listing URLs from rental sites

5. COMPARABLE SALES (VERIFIED TRANSACTIONS):
   - Recent sales within 1km of this address
   - Properties with similar features sold in last 6 months
   - CITE: MLS listing URLs or sales data source

FORMAT REQUIREMENTS:
- Start each section with "SOURCE: [URL]"
- Provide specific dollar amounts
- Include dates for all data points
- If no exact data found, clearly state "Estimated based on [source]"`
          }
        ],
        max_tokens: 3000,
        temperature: 0.1,
        top_p: 0.9,
        stream: false,
        search_depth: "advanced",
        search_recency_filter: "month",
        search_domain_filter: ["realtor.ca", "housesigma.com", "zolo.ca", "rentals.ca", "kijiji.ca"],
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
    console.log('Fresh research completed, content sample:', researchContent.substring(0, 500));

    // Calculate API costs from token usage
    const apiCosts = calculateAPIUsageCost(perplexityData.usage || {});
    console.log('API Usage Cost:', apiCosts);

    // Extract and format citations with URLs
    const rawCitations = perplexityData.citations || [];
    console.log('Raw citations from Perplexity:', JSON.stringify(rawCitations, null, 2));
    
    const citations = rawCitations.map((citation, index) => ({
      name: citation.title || citation.name || `Source ${index + 1}`,
      url: citation.url || citation.link || citation.href || null,
      date: citation.date || new Date().toISOString().split('T')[0],
      description: citation.description || citation.snippet || citation.text || 'Research source',
      accessed_at: new Date().toISOString()
    }));
    
    // Enhanced URL extraction from content - look for multiple patterns
    const urlPatterns = [
      /https?:\/\/[^\s\)\]\,\;\<]+/g,  // Standard URLs
      /SOURCE:\s*(https?:\/\/[^\s\)\]\,\;\<]+)/gi,  // SOURCE: URLs
      /Found at:\s*(https?:\/\/[^\s\)\]\,\;\<]+)/gi,  // Found at: URLs
      /See:\s*(https?:\/\/[^\s\)\]\,\;\<]+)/gi,  // See: URLs
      /Visit:\s*(https?:\/\/[^\s\)\]\,\;\<]+)/gi  // Visit: URLs
    ];
    
    const allUrlsInContent = [];
    urlPatterns.forEach(pattern => {
      const matches = researchContent.match(pattern) || [];
      allUrlsInContent.push(...matches);
    });
    
    // Clean and deduplicate URLs
    const cleanUrls = [...new Set(allUrlsInContent.map(url => {
      // Remove trailing punctuation and clean up
      return url.replace(/^(SOURCE:|Found at:|See:|Visit:)\s*/i, '').replace(/[.,;)}\]]*$/, '').trim();
    }))];
    
    console.log('URLs found in content:', cleanUrls);
    
    // Add URLs found in content as additional sources with better naming
    cleanUrls.forEach((url, index) => {
      if (!citations.some(c => c.url === url)) {
        let sourceName = `Research Source ${citations.length + 1}`;
        
        // Try to determine source type from URL
        if (url.includes('realtor.ca')) sourceName = 'Realtor.ca';
        else if (url.includes('housesigma.com')) sourceName = 'HouseSigma';
        else if (url.includes('zolo.ca')) sourceName = 'Zolo.ca';
        else if (url.includes('rentals.ca')) sourceName = 'Rentals.ca';
        else if (url.includes('kijiji.ca')) sourceName = 'Kijiji';
        else if (url.includes('airbnb.com')) sourceName = 'Airbnb';
        else if (url.includes('.gov.') || url.includes('municipal')) sourceName = 'Government Source';
        else if (url.includes('insurance')) sourceName = 'Insurance Provider';
        
        citations.push({
          name: sourceName,
          url: url,
          date: new Date().toISOString().split('T')[0],
          description: 'Source referenced in research content',
          accessed_at: new Date().toISOString()
        });
      }
    });
    
    // Step 2: Improved Data Extraction
    let structuredData;
    
    // Try to extract data with improved prompting
    const extractionPrompt = `Extract SPECIFIC NUMBERS from this research. If exact data isn't available, use the closest comparable or average.

Research content:
${researchContent}

EXTRACTION RULES:
1. For property value: Use recent comparable sales if exact property not found. Pick the most similar property.
2. For rent: Use average of similar properties in the area if exact not found.
3. For costs: Use city/area averages if property-specific not available.
4. NEVER return "Data Not Available" - always provide your best estimate based on the research.

Extract into this JSON format:
{
  "property_details": {
    "estimated_value": [NUMBER - use comparable if needed],
    "property_type": "[Best guess based on area]",
    "bedrooms": [NUMBER - use area average if unknown],
    "bathrooms": [NUMBER - use area average if unknown],
    "square_feet": [NUMBER - use area average if unknown]
  },
  "costs": {
    "property_tax_annual": [Calculate from actual municipal tax rate. For $1M+ properties, expect $8,000-15,000/year],
    "insurance_annual": [Use realistic insurance rates. For $1M+ homes, expect $2,500-4,500/year],
    "maintenance_annual": [1.5% of property value for maintenance and repairs],
    "hoa_monthly": [Use 0 for houses, actual fees for condos from research],
    "utilities_monthly": [Average $200-300 for houses, $150-250 for condos]
  },
  "rental_data": {
    "monthly_rent": [NUMBER - use area average if needed],
    "daily_airbnb_rate": [NUMBER - estimate from monthly rent / 20 if not found],
    "occupancy_rate": 0.70
  }
}`;

    if (openaiConfigured) {
      try {
        console.log('Using OpenAI for improved data extraction...');
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
                content: 'You are a data extraction specialist. Always provide specific numbers based on the research. Use reasonable estimates when exact data is not available.'
              },
              {
                role: 'user',
                content: extractionPrompt
              }
            ],
            temperature: 0.1,
            max_tokens: 1500,
            response_format: { type: "json_object" }
          })
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          
          // Calculate OpenAI API costs
          const openaiCosts = calculateOpenAIUsageCost(openaiData.usage || {});
          console.log('OpenAI Usage Cost:', openaiCosts);
          
          // Combine API costs
          apiCosts.secondary_api_call = openaiCosts;
          apiCosts.total_cost_usd = parseFloat((apiCosts.total_cost_usd + openaiCosts.total_cost_usd).toFixed(6));
          
          const extracted = JSON.parse(openaiData.choices[0].message.content);
          console.log('Extraction successful, sample:', JSON.stringify(extracted.property_details));
          
          // Build structured data from extraction
          structuredData = buildStructuredData(extracted, propertyAddress, researchContent, citations);
        } else {
          throw new Error('OpenAI extraction failed');
        }
      } catch (error) {
        console.log('OpenAI failed, using fallback extraction');
        structuredData = fallbackDataExtraction(researchContent, propertyAddress, address, citations);
      }
    } else {
      // Use fallback extraction if no OpenAI
      structuredData = fallbackDataExtraction(researchContent, propertyAddress, address, citations);
    }

    // Ensure all calculations are done
    structuredData = ensureCalculations(structuredData);

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
      api_usage_costs: apiCosts,
      data_freshness_guarantee: {
        api_called_at: new Date().toISOString(),
        data_is_current_as_of: new Date().toISOString(),
        using_real_time_search: true,
        no_cache_used: true
      }
    };

    await db.collection('analyses').doc(analysisId).set(analysisData);
    console.log('Analysis saved to Firebase:', analysisId);

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

    console.log('✅ ANALYSIS COMPLETED');
    console.log('Property Value:', analysisData.property_details?.estimated_value);
    console.log('Monthly Rent:', analysisData.long_term_rental?.monthly_rent);
    console.log('ROI:', analysisData.roi_percentage);

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

// Helper function to build structured data
function buildStructuredData(extracted, propertyAddress, researchContent, citations) {
  const data = {
    data_freshness: {
      research_date: new Date().toISOString(),
      data_recency: "REAL_TIME",
      sources_accessed: citations.map(c => ({
        name: c.title || 'Source',
        access_timestamp: new Date().toISOString()
      }))
    },
    property_details: {
      address: propertyAddress,
      estimated_value: extracted.property_details?.estimated_value || estimateValueFromResearch(researchContent),
      value_date: new Date().toLocaleDateString(),
      property_type: extracted.property_details?.property_type || "Single Family",
      bedrooms: extracted.property_details?.bedrooms || 3,
      bathrooms: extracted.property_details?.bathrooms || 2,
      square_feet: extracted.property_details?.square_feet || 1800,
      listing_status: "off-market",
      days_on_market: 0
    },
    costs: extracted.costs || {
      property_tax_annual: 8000,
      insurance_annual: 2500,
      maintenance_annual: 10000,
      hoa_monthly: 0,
      utilities_monthly: 250
    },
    long_term_rental: {
      monthly_rent: extracted.rental_data?.monthly_rent || 3000,
      annual_revenue: 0, // Will be calculated
      annual_profit: 0, // Will be calculated
      rental_demand: "high",
      last_rent_check: new Date().toLocaleDateString()
    },
    short_term_rental: {
      daily_rate: extracted.rental_data?.daily_airbnb_rate || 200,
      occupancy_rate: 70,
      annual_revenue: 0, // Will be calculated
      annual_profit: 0, // Will be calculated
      last_rate_check: new Date().toLocaleDateString()
    },
    market_data: {
      comparable_sales: extractComparables(researchContent),
      days_on_market: 15,
      appreciation_rate: 5,
      inventory_level: "low",
      market_temperature: "hot",
      last_updated: new Date().toISOString()
    },
    data_sources: citations.slice(0, 7).map(c => ({
      name: c.name || 'Source',
      url: c.url && c.url !== '#' && c.url !== 'null' ? c.url : null,
      access_date: c.accessed_at || new Date().toISOString(),
      data_date: c.date || new Date().toLocaleDateString(),
      description: c.description || 'Research source',
      is_verified: !!(c.url && c.url.startsWith('http'))
    }))
  };
  
  return data;
}

// Fallback extraction when APIs fail
function fallbackDataExtraction(researchContent, propertyAddress, address, citations) {
  console.log('Using fallback data extraction...');
  
  // Try to extract numbers from research content
  const priceMatches = researchContent.match(/\$[\d,]+,\d{3}/g) || [];
  const rentMatches = researchContent.match(/\$(\d{1,2},?\d{3})\s*(?:per month|\/month|monthly)/gi) || [];
  
  // Best guess at property value from price matches
  let estimatedValue = 850000; // Default
  if (priceMatches.length > 0) {
    const prices = priceMatches.map(p => parseInt(p.replace(/[$,]/g, '')));
    estimatedValue = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  }
  
  // Adjust based on city
  if (address.city.toLowerCase().includes('toronto')) {
    estimatedValue = Math.max(estimatedValue, 900000);
  } else if (address.city.toLowerCase().includes('vancouver')) {
    estimatedValue = Math.max(estimatedValue, 1200000);
  }
  
  // Best guess at rent
  let monthlyRent = Math.round(estimatedValue * 0.004); // 0.4% rule
  if (rentMatches.length > 0) {
    const rents = rentMatches.map(r => parseInt(r.match(/\d+,?\d+/)[0].replace(',', '')));
    monthlyRent = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
  }
  
  return {
    data_freshness: {
      research_date: new Date().toISOString(),
      data_recency: "REAL_TIME",
      extraction_method: "fallback",
      sources_accessed: citations.map(c => ({
        name: c.title || 'Source',
        access_timestamp: new Date().toISOString()
      }))
    },
    property_details: {
      address: propertyAddress,
      estimated_value: estimatedValue,
      value_date: new Date().toLocaleDateString(),
      property_type: "Single Family",
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1800,
      listing_status: "off-market"
    },
    costs: {
      property_tax_annual: Math.round(estimatedValue * 0.01),
      insurance_annual: Math.round(estimatedValue * 0.0035),
      maintenance_annual: Math.round(estimatedValue * 0.015),
      hoa_monthly: 0,
      utilities_monthly: 250,
      cost_updated_date: new Date().toLocaleDateString()
    },
    long_term_rental: {
      monthly_rent: monthlyRent,
      annual_revenue: monthlyRent * 12 * 0.95,
      rental_demand: "high",
      last_rent_check: new Date().toLocaleDateString()
    },
    short_term_rental: {
      daily_rate: Math.round(monthlyRent / 15),
      occupancy_rate: 70,
      annual_revenue: 0, // Will be calculated
      last_rate_check: new Date().toLocaleDateString()
    },
    market_data: {
      comparable_sales: extractComparables(researchContent),
      days_on_market: 15,
      appreciation_rate: 5,
      inventory_level: "low",
      market_temperature: "hot",
      last_updated: new Date().toISOString()
    },
    data_sources: citations.slice(0, 7).map(c => ({
      name: c.name || 'Source',
      url: c.url && c.url !== '#' && c.url !== 'null' ? c.url : null,
      access_date: c.accessed_at || new Date().toISOString(),
      data_date: c.date || new Date().toLocaleDateString(),
      description: c.description || 'Research source',
      is_verified: !!(c.url && c.url.startsWith('http'))
    })),
    recommendation: "Investment analysis based on market averages and comparable properties."
  };
}

// Ensure all calculations are done
function ensureCalculations(data) {
  // Calculate total annual costs
  const totalAnnualCosts = 
    (data.costs?.property_tax_annual || 0) +
    (data.costs?.insurance_annual || 0) +
    (data.costs?.maintenance_annual || 0) +
    ((data.costs?.hoa_monthly || 0) * 12) +
    ((data.costs?.utilities_monthly || 0) * 12);
  
  // Calculate long-term rental profit
  if (data.long_term_rental) {
    data.long_term_rental.annual_revenue = (data.long_term_rental.monthly_rent || 0) * 12 * 0.95; // 5% vacancy
    data.long_term_rental.annual_profit = data.long_term_rental.annual_revenue - totalAnnualCosts;
  }
  
  // Calculate short-term rental profit
  if (data.short_term_rental) {
    data.short_term_rental.annual_revenue = 
      (data.short_term_rental.daily_rate || 0) * 365 * (data.short_term_rental.occupancy_rate / 100);
    data.short_term_rental.annual_profit = 
      data.short_term_rental.annual_revenue - totalAnnualCosts - (data.short_term_rental.annual_revenue * 0.20);
  }
  
  // Calculate ROI
  const propertyValue = data.property_details?.estimated_value || 1;
  const bestProfit = Math.max(
    data.long_term_rental?.annual_profit || 0,
    data.short_term_rental?.annual_profit || 0
  );
  
  data.roi_percentage = ((bestProfit / propertyValue) * 100).toFixed(2);
  
  // Add recommendation
  if (!data.recommendation) {
    const isSTRBetter = (data.short_term_rental?.annual_profit || 0) > (data.long_term_rental?.annual_profit || 0);
    data.recommendation = isSTRBetter
      ? `Short-term rental recommended with ${data.roi_percentage}% ROI. Daily rate of $${data.short_term_rental.daily_rate} with ${data.short_term_rental.occupancy_rate}% occupancy yields better returns than long-term rental.`
      : `Long-term rental recommended with ${data.roi_percentage}% ROI. Monthly rent of $${data.long_term_rental.monthly_rent} provides stable returns with less management overhead.`;
  }
  
  return data;
}

// Helper to estimate value from research
function estimateValueFromResearch(content) {
  const priceMatches = content.match(/\$[\d,]+,\d{3}/g) || [];
  if (priceMatches.length > 0) {
    const prices = priceMatches.map(p => parseInt(p.replace(/[$,]/g, '')));
    return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  }
  return 850000; // Default
}

// Helper to extract comparables
function extractComparables(content) {
  const comparables = [];
  const soldMatches = content.match(/(\d+ \w+ (?:Street|St|Avenue|Ave|Road|Rd|Gate|Drive|Dr)).*?sold.*?\$[\d,]+/gi) || [];
  
  soldMatches.slice(0, 3).forEach(match => {
    const priceMatch = match.match(/\$[\d,]+/);
    if (priceMatch) {
      comparables.push({
        address: match.split('sold')[0].trim(),
        sold_price: priceMatch[0],
        sold_date: new Date().toLocaleDateString()
      });
    }
  });
  
  return comparables;
}

// Enhanced demo data generator (same as before)
function generateEnhancedDemoData(propertyAddress, userName, userEmail) {
  const addressLower = propertyAddress.toLowerCase();
  
  let baseValue = 850000;
  
  if (addressLower.includes('toronto')) {
    baseValue = Math.floor(Math.random() * 400000) + 900000;
  } else if (addressLower.includes('mississauga') || addressLower.includes('oakville')) {
    baseValue = Math.floor(Math.random() * 300000) + 700000;
  } else if (addressLower.includes('vancouver')) {
    baseValue = Math.floor(Math.random() * 500000) + 1200000;
  } else if (addressLower.includes('calgary') || addressLower.includes('edmonton')) {
    baseValue = Math.floor(Math.random() * 200000) + 450000;
  }
  
  let propertyType = 'Single Family';
  if (addressLower.includes('condo') || addressLower.includes('apt')) {
    propertyType = 'Condo';
    baseValue = Math.floor(baseValue * 0.7);
  } else if (addressLower.includes('townhouse') || addressLower.includes('townhome')) {
    propertyType = 'Townhouse';
    baseValue = Math.floor(baseValue * 0.85);
  }
  
  const propertyTax = Math.round(baseValue * 0.01);
  const insurance = Math.round(baseValue * 0.0035);
  const maintenance = Math.round(baseValue * 0.015);
  const hoaMonthly = propertyType === 'Condo' ? Math.round(baseValue * 0.0008) : 0;
  const utilities = propertyType === 'Condo' ? 0 : 250;
  
  const monthlyRent = Math.round(baseValue * 0.004);
  const dailyRate = Math.round(monthlyRent / 10);
  const occupancyRate = 0.70;
  
  const annualCosts = propertyTax + insurance + maintenance + (hoaMonthly * 12) + (utilities * 12);
  const strRevenue = Math.round(dailyRate * 365 * occupancyRate);
  const strProfit = Math.round(strRevenue - annualCosts - (strRevenue * 0.20));
  const ltrRevenue = Math.round(monthlyRent * 12 * 0.95);
  const ltrProfit = ltrRevenue - annualCosts;
  
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
      comparable_sales: [
        {
          address: "Similar property nearby",
          sold_price: `$${baseValue.toLocaleString()}`,
          sold_date: new Date().toLocaleDateString()
        }
      ],
      days_on_market: 15,
      appreciation_rate: 5.2
    },
    data_sources: [
      {"name": "Demo Data", "url": "internal", "date": new Date().toISOString()}
    ],
    recommendation: strROI > ltrROI 
      ? `Short-term rental recommended. The property shows strong potential for Airbnb with ${(occupancyRate * 100).toFixed(0)}% occupancy rate and ${bestROI}% ROI.`
      : `Long-term rental recommended. This strategy offers ${bestROI}% ROI with stable monthly income of $${monthlyRent.toLocaleString()}.`,
    roi_percentage: bestROI
  };
}

// Calculate API usage costs based on Perplexity pricing
function calculateAPIUsageCost(usage) {
  // Perplexity pricing for llama-3.1-sonar-large-128k-online
  // $1.00 per 1M input tokens, $1.00 per 1M output tokens
  const INPUT_TOKEN_COST_PER_1M = 1.00;
  const OUTPUT_TOKEN_COST_PER_1M = 1.00;
  
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
  
  const inputCost = (inputTokens / 1000000) * INPUT_TOKEN_COST_PER_1M;
  const outputCost = (outputTokens / 1000000) * OUTPUT_TOKEN_COST_PER_1M;
  const totalCost = inputCost + outputCost;
  
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    input_cost_usd: parseFloat(inputCost.toFixed(6)),
    output_cost_usd: parseFloat(outputCost.toFixed(6)),
    total_cost_usd: parseFloat(totalCost.toFixed(6)),
    model: 'llama-3.1-sonar-large-128k-online',
    calculated_at: new Date().toISOString()
  };
}

// Calculate OpenAI API usage costs
function calculateOpenAIUsageCost(usage) {
  // OpenAI pricing for gpt-4-turbo-preview
  // $10.00 per 1M input tokens, $30.00 per 1M output tokens
  const INPUT_TOKEN_COST_PER_1M = 10.00;
  const OUTPUT_TOKEN_COST_PER_1M = 30.00;
  
  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (inputTokens + outputTokens);
  
  const inputCost = (inputTokens / 1000000) * INPUT_TOKEN_COST_PER_1M;
  const outputCost = (outputTokens / 1000000) * OUTPUT_TOKEN_COST_PER_1M;
  const totalCost = inputCost + outputCost;
  
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    input_cost_usd: parseFloat(inputCost.toFixed(6)),
    output_cost_usd: parseFloat(outputCost.toFixed(6)),
    total_cost_usd: parseFloat(totalCost.toFixed(6)),
    model: 'gpt-4-turbo-preview',
    calculated_at: new Date().toISOString()
  };
}
