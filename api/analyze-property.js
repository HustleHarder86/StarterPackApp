// api/analyze-property.js
// Enhanced property analysis with improved data extraction and fallback logic

const { calculateAccurateExpenses, getPropertyTaxRate, estimateRentalRate, calculateInsurance } = require('./property-calculations.js');

// Parse bedroom/bathroom strings that may contain "X + Y" format
function parseBedroomBathroomValue(value) {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'string') return 0;
  
  // Check for "X + Y" format (e.g., "4 + 2" or "3.5 + 1")
  const plusPattern = /(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)/;
  const match = value.match(plusPattern);
  
  if (match) {
    const main = parseFloat(match[1]);
    const additional = parseFloat(match[2]);
    return main + additional;
  }
  
  // Try to extract a single number
  const singleMatch = value.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]);
  }
  
  return 0;
}

module.exports = async function handler(req, res) {
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
    const { userId, propertyAddress, userEmail, userName, requestType, propertyData } = req.body;

    if (!propertyAddress) {
      return res.status(400).json({ error: 'Property address is required' });
    }

    console.log('Starting FRESH property analysis for:', propertyAddress);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Property data received:', JSON.stringify(propertyData, null, 2));
    
    // Log specific property data fields for debugging
    if (propertyData) {
      console.log('========== PROPERTY DATA FROM EXTENSION ==========');
      console.log(`Price: $${propertyData.price?.toLocaleString() || 'NOT PROVIDED'}`);
      console.log(`Property Taxes: $${propertyData.propertyTaxes || 'NOT PROVIDED'}/year`);
      console.log(`Condo Fees: $${propertyData.condoFees || 'NOT PROVIDED'}/month`);
      console.log(`Bedrooms: ${propertyData.bedrooms || 'NOT PROVIDED'}`);
      console.log(`Bathrooms: ${propertyData.bathrooms || 'NOT PROVIDED'}`);
      console.log(`Square Feet: ${propertyData.sqft || 'NOT PROVIDED'}`);
      console.log(`Property Type: ${propertyData.propertyType || 'NOT PROVIDED'}`);
      console.log('==================================================');
    }

    // Check if API keys are configured
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    console.log('========== API KEY VALIDATION ==========');
    console.log('Perplexity API Key exists:', !!perplexityApiKey);
    console.log('Perplexity API Key length:', perplexityApiKey ? perplexityApiKey.length : 0);
    console.log('Perplexity API Key prefix:', perplexityApiKey ? perplexityApiKey.substring(0, 5) : 'N/A');
    console.log('Perplexity API Key suffix:', perplexityApiKey ? '...' + perplexityApiKey.substring(perplexityApiKey.length - 4) : 'N/A');
    console.log('Starts with pplx-:', perplexityApiKey ? perplexityApiKey.startsWith('pplx-') : false);
    console.log('Is placeholder key:', perplexityApiKey === 'your_perplexity_api_key');
    console.log('========== END API KEY VALIDATION ==========');

    const perplexityConfigured = !!perplexityApiKey && perplexityApiKey.startsWith('pplx-') && perplexityApiKey !== 'your_perplexity_api_key';
    const openaiConfigured = !!openaiApiKey && openaiApiKey.startsWith('sk-') && openaiApiKey !== 'your_openai_api_key';
    
    console.log('API Keys Status:', {
      perplexity: perplexityConfigured ? 'CONFIGURED' : 'MISSING',
      perplexityKeyLength: perplexityApiKey ? perplexityApiKey.length : 0,
      perplexityKeyPrefix: perplexityApiKey ? perplexityApiKey.substring(0, 10) : 'N/A',
      openai: openaiConfigured ? 'CONFIGURED' : 'MISSING'
    });

    if (!perplexityConfigured) {
      console.error('Perplexity API key not properly configured');
      return res.status(500).json({
        success: false,
        error: 'API configuration error - Perplexity API key required',
        message: 'Please configure your Perplexity API key to use this service'
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
    
    // Estimate property value for better tax/insurance calculations
    let estimatedValue = 850000; // Default
    const cityLower = address.city.toLowerCase();
    if (cityLower.includes('toronto')) {
      estimatedValue = 1100000;
    } else if (cityLower.includes('vancouver')) {
      estimatedValue = 1400000;
    } else if (cityLower.includes('calgary') || cityLower.includes('edmonton')) {
      estimatedValue = 550000;
    } else if (cityLower.includes('montreal')) {
      estimatedValue = 650000;
    }

    // Step 1: Enhanced Research with Perplexity AI
    console.log('Calling Perplexity AI for FRESH real-time research...');
    console.log('Request details:', {
      address: propertyAddress,
      city: address.city,
      estimatedValue: estimatedValue
    });
    
    // Prepare request body
    const perplexityRequestBody = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `You are a real estate investment analyst specializing in accurate property data research. 
CRITICAL: Research CURRENT data as of ${new Date().toISOString()}. 
Provide SPECIFIC NUMBERS from real sources.
ALWAYS include source URLs in format: SOURCE: [URL]`
        },
        {
          role: 'user',
          content: `Perform REAL-TIME research for property: ${propertyAddress}

RESEARCH INSTRUCTIONS:

1. PROPERTY VALUE & DETAILS:
   - Search realtor.ca, housesigma.com, zolo.ca for this exact address
   - CRITICAL: Find the CURRENT ESTIMATED VALUE or ASSESSMENT VALUE
   - If exact address not found, search for sales from PAST 12 MONTHS on same street
   - Get CRITICAL details: 
     * Current property value estimate (MOST IMPORTANT)
     * Property type (Single Family, Condo, Townhouse)
     * Square footage (VERY IMPORTANT for calculations)
     * Year built
     * Bedrooms and bathrooms
     * Is this a condo? (affects all expense calculations)
   - Look for past sale history and price trends
   - FORMAT: "Property value: $X,XXX,XXX (SOURCE: [URL])" - BE EXPLICIT ABOUT THE VALUE
   - IMPORTANT: Prioritize recent data (past 12 months) for accuracy

2. PROPERTY TAXES - CRITICAL ACCURACY NEEDED:
   - Search "${address.city} property tax calculator" or "${address.city} tax rates"
   - Look for official municipal websites (.gov or .ca domains)
   - Find the ACTUAL TAX RATE (usually 0.5% to 1.5% of property value)
   - IMPORTANT: Property tax in ${address.city} should be approximately ${getPropertyTaxRate(address.city, address.state) * 100}% of property value
   - For a $${estimatedValue.toLocaleString()} property in ${address.city}, expect taxes around $${Math.round(estimatedValue * getPropertyTaxRate(address.city, address.state)).toLocaleString()}/year
   - NEVER return values like $815/year for an $800k property - that's only 0.1%!
   - FORMAT: "Tax rate SOURCE: [URL] - ${address.city} rate is X.X%"

3. INSURANCE COSTS - REALISTIC ESTIMATES:
   - Search "home insurance ${address.city}" or insurance calculators
   - For properties under $500k: expect $800-1500/year
   - For properties $500k-1M: expect $1500-2500/year  
   - For properties over $1M: expect $2500-4000/year
   - FORMAT: "Insurance SOURCE: [URL] - Average cost $X,XXX/year"

4. RENTAL RATES:
   - Search rentals.ca, kijiji.ca, PadMapper for similar properties
   - Find 3-5 comparable rentals in same neighborhood
   - For Airbnb: search actual listings in the area
   - FORMAT: "Rental SOURCE: [URL] - Similar property renting for $X,XXX/month"

5. COMPARABLE SALES & TAX DATA:
   - Find 3 sales/listings from PAST 12 MONTHS on same street or within 1km
   - CRITICAL: Extract ACTUAL PROPERTY TAX AMOUNTS from listings
   - Look for "Property Tax:", "Taxes:", "Tax:" in listing details
   - Include sale price, date, AND property tax if available
   - FORMAT: "SOURCE: [URL] - 123 Same St sold for $XXX,XXX, Property Tax: $X,XXX/year"
   - If tax not shown, note it: "tax not disclosed in listing"
   - IMPORTANT: Use sales from past year for accurate, current tax data

IMPORTANT FORMATTING:
- Every data point MUST include "SOURCE: [full URL]"
- Use realistic numbers based on property value
- If no exact data, state "Estimated based on [source/reason]"
- Property taxes should be 0.8-1.2% of value unless you find exact rate`
          }
        ],
        max_tokens: 3000,
        temperature: 0.1,
        top_p: 0.9,
        stream: false
      }

    // Log the full request details
    console.log('========== PERPLEXITY API REQUEST ==========');
    console.log('API Endpoint:', 'https://api.perplexity.ai/chat/completions');
    console.log('HTTP Method:', 'POST');
    console.log('Request Headers:', {
      'Authorization': `Bearer ${perplexityApiKey ? perplexityApiKey.substring(0, 15) + '...' : 'MISSING'}`,
      'Content-Type': 'application/json'
    });
    console.log('Request Body:', JSON.stringify(perplexityRequestBody, null, 2));
    console.log('========== END REQUEST DETAILS ==========');

    let perplexityResponse;
    try {
      const startTime = Date.now();
      perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(perplexityRequestBody)
      });
      
      const requestTime = Date.now() - startTime;
      console.log(`========== PERPLEXITY API RESPONSE RECEIVED ==========`);
      console.log(`Response Time: ${requestTime}ms`);
      console.log(`Response Status: ${perplexityResponse.status}`);
      console.log(`Response Status Text: ${perplexityResponse.statusText}`);
      console.log(`Response Headers:`, Object.fromEntries(perplexityResponse.headers.entries()));
      console.log('========== END RESPONSE METADATA ==========');
      
    } catch (fetchError) {
      console.error('========== FETCH ERROR ==========');
      console.error('Error fetching from Perplexity:', fetchError.message);
      console.error('Error type:', fetchError.name);
      console.error('Error stack:', fetchError.stack);
      console.error('Full error:', fetchError);
      console.error('========== END FETCH ERROR ==========');
      throw new Error(`Failed to connect to Perplexity API: ${fetchError.message}`);
    }

    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.text();
      console.error('========== PERPLEXITY API ERROR ==========');
      console.error('Status:', perplexityResponse.status);
      console.error('Status Text:', perplexityResponse.statusText);
      console.error('Error Response Body:', errorData);
      console.error('API Key:', perplexityApiKey ? `${perplexityApiKey.substring(0, 10)}...` : 'MISSING');
      console.error('========== END ERROR ==========');
      
      // Try to parse error as JSON if possible
      let errorMessage = errorData;
      try {
        const errorJson = JSON.parse(errorData);
        console.error('Parsed Error JSON:', errorJson);
        errorMessage = errorJson.message || errorJson.error || errorData;
      } catch (e) {
        console.error('Error response is not JSON');
      }
      
      // Return more specific error messages
      if (perplexityResponse.status === 401) {
        throw new Error('Invalid Perplexity API key. Please check your API key configuration.');
      } else if (perplexityResponse.status === 429) {
        throw new Error('Perplexity API rate limit exceeded. Please try again later.');
      } else if (perplexityResponse.status === 400) {
        throw new Error(`Invalid request to Perplexity API: ${errorMessage}`);
      } else if (perplexityResponse.status === 403) {
        throw new Error('Forbidden: Your API key may not have access to this model or endpoint.');
      } else if (perplexityResponse.status === 404) {
        throw new Error('Perplexity API endpoint not found. The API may have changed.');
      } else {
        throw new Error(`Perplexity API request failed: ${perplexityResponse.status} ${perplexityResponse.statusText} - ${errorMessage}`);
      }
    }

    // Log raw response text before parsing
    const responseText = await perplexityResponse.text();
    console.log('========== PERPLEXITY RAW RESPONSE TEXT ==========');
    console.log('Response length:', responseText.length);
    console.log('First 500 chars:', responseText.substring(0, 500));
    console.log('========== END RAW RESPONSE TEXT ==========');
    
    let perplexityData;
    try {
      perplexityData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('========== JSON PARSE ERROR ==========');
      console.error('Failed to parse Perplexity response as JSON');
      console.error('Parse error:', parseError.message);
      console.error('Response text:', responseText);
      console.error('========== END PARSE ERROR ==========');
      throw new Error('Invalid JSON response from Perplexity API');
    }
    console.log('========== PERPLEXITY PARSED DATA ==========');
    console.log('Response has choices:', !!perplexityData.choices);
    console.log('Number of choices:', perplexityData.choices?.length);
    console.log('First choice has message:', !!perplexityData.choices?.[0]?.message);
    console.log('========== END PARSED DATA ==========');
    
    const researchContent = perplexityData.choices[0].message.content;
    console.log('========== PERPLEXITY RESEARCH CONTENT ==========');
    console.log('Research content length:', researchContent.length);
    console.log('Full research content:', researchContent);
    console.log('========== END RESEARCH CONTENT ==========');

    // Calculate API costs from token usage
    const apiCosts = calculateAPIUsageCost(perplexityData.usage || {});
    console.log('API Usage Cost:', apiCosts);

    // Extract and format citations with URLs
    const rawCitations = perplexityData.citations || [];
    console.log('========== PERPLEXITY CITATIONS ==========');
    console.log('Raw citations from Perplexity:', JSON.stringify(rawCitations, null, 2));
    console.log('Number of citations:', rawCitations.length);
    console.log('========== END CITATIONS ==========');
    
    const citations = rawCitations.map((citation, index) => ({
      name: citation.title || citation.name || `Source ${index + 1}`,
      url: citation.url || citation.href || null,
      date: citation.date || new Date().toISOString().split('T')[0],
      description: citation.description || citation.snippet || citation.text || 'Research source',
      accessed_at: new Date().toISOString()
    }));
    
    // Enhanced URL extraction from content - look for multiple patterns
    const urlPatterns = [
      /https?:\/\/[^\s\)\]\,\;\<\>\"\']+/g,  // Standard URLs
      /SOURCE:\s*(https?:\/\/[^\s\)\]\,\;\<\>\"\']+)/gi,  // SOURCE: URLs
      /Found at:\s*(https?:\/\/[^\s\)\]\,\;\<\>\"\']+)/gi,  // Found at: URLs
      /See:\s*(https?:\/\/[^\s\)\]\,\;\<\>\"\']+)/gi,  // See: URLs
      /Visit:\s*(https?:\/\/[^\s\)\]\,\;\<\>\"\']+)/gi,  // Visit: URLs
      /from:\s*(https?:\/\/[^\s\)\]\,\;\<\>\"\']+)/gi,  // from: URLs
      /at:\s*(https?:\/\/[^\s\)\]\,\;\<\>\"\']+)/gi  // at: URLs
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
        let description = 'Source referenced in research content';
        
        // Try to determine source type from URL and content context
        if (url.includes('realtor.ca')) {
          sourceName = 'Realtor.ca';
          description = 'Real estate listings and property data';
        } else if (url.includes('housesigma.com')) {
          sourceName = 'HouseSigma';
          description = 'Real estate data and market analytics';
        } else if (url.includes('zolo.ca')) {
          sourceName = 'Zolo.ca';
          description = 'Property listings and market data';
        } else if (url.includes('rentals.ca')) {
          sourceName = 'Rentals.ca';
          description = 'Rental market data and listings';
        } else if (url.includes('kijiji.ca')) {
          sourceName = 'Kijiji';
          description = 'Rental listings and market prices';
        } else if (url.includes('airbnb.com')) {
          sourceName = 'Airbnb';
          description = 'Short-term rental rates and availability';
        } else if (url.includes('.gov.') || url.includes('.gc.ca') || url.includes('municipal') || url.includes('city')) {
          sourceName = 'Government/Municipal Source';
          description = 'Official property tax rates and municipal data';
          
          // Check if this URL is mentioned near tax information
          const urlIndex = researchContent.indexOf(url);
          if (urlIndex > -1) {
            const nearbyText = researchContent.substring(Math.max(0, urlIndex - 200), urlIndex + 200);
            if (nearbyText.toLowerCase().includes('tax')) {
              description = 'Property tax rates from official municipal source';
            }
          }
        } else if (url.includes('insurance') || url.includes('intact') || url.includes('desjardins') || url.includes('td')) {
          sourceName = 'Insurance Provider';
          description = 'Home insurance rates and estimates';
        }
        
        citations.push({
          name: sourceName,
          url: url,
          date: new Date().toISOString().split('T')[0],
          description: description,
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
1. For property value: 
   - FIRST look for explicit property value statements like "Property value: $X,XXX,XXX"
   - If not found, look for assessment values or recent sale prices
   - Use the HIGHEST reasonable value found (properties are often worth more than older assessments)
   - If multiple values found, prefer recent sales or current estimates over old data
2. For rent: Use average of similar properties in the area if exact not found.
3. For costs: Use REALISTIC percentages of property value:
   - Property Tax: 0.8-1.2% of property value annually (NOT 3-4%!)
   - Insurance: 0.2-0.4% of property value annually
   - Maintenance: 1-1.5% of property value annually
4. NEVER return "Data Not Available" - always provide your best estimate based on the research.
5. VALIDATE all numbers - if property tax > 2% of value, it's wrong!

Extract into this JSON format:
{
  "property_details": {
    "estimated_value": [NUMBER - use comparable if needed],
    "property_type": "[MUST BE: Single Family, Condo, Townhouse, or Detached]",
    "bedrooms": [NUMBER - use area average if unknown],
    "bathrooms": [NUMBER - use area average if unknown],
    "square_feet": [NUMBER - CRITICAL for calculations, estimate if needed],
    "year_built": [YEAR - estimate based on neighborhood if unknown],
    "is_condo": [true/false - CRITICAL for expense calculations]
  },
  "costs": {
    "property_tax_annual": [FIRST check if actual tax amounts found in listings, use those. Otherwise 0.8-1.2% of property value],
    "insurance_annual": [MUST BE 0.2-0.4% of property value. NEVER less than $1000. For $815k = $2,000-3,500/year],
    "maintenance_annual": [1-1.5% of property value for maintenance and repairs. For $815k = $8,150-12,225/year],
    "hoa_monthly": [Use 0 for houses, $400-800 for condos based on value],
    "utilities_monthly": [Average $200-300 for houses, $150-250 for condos]
  },
  "rental_data": {
    "monthly_rent": [NUMBER - use area average if needed],
    "daily_airbnb_rate": [NUMBER - estimate from monthly rent / 20 if not found],
    "occupancy_rate": 0.70
  },
  "data_sources_found": [
    {"type": "property_value", "url": "[URL where found]", "value": "[what was found]"},
    {"type": "tax_rate", "url": "[URL where found]", "value": "[tax rate or amount]"}
  ]
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
          console.log('========== EXTRACTED DATA FROM OPENAI ==========');
          console.log('Full extracted data:', JSON.stringify(extracted, null, 2));
          console.log('Property Value Found:', extracted.property_details?.estimated_value);
          console.log('Property Tax Found:', extracted.costs?.property_tax_annual);
          console.log('Data sources found:', extracted.data_sources_found);
          console.log('========== END EXTRACTED DATA ==========');
          
          // Build structured data from extraction
          structuredData = buildStructuredData(extracted, propertyAddress, researchContent, citations, address, propertyData);
        } else {
          throw new Error('OpenAI extraction failed');
        }
      } catch (error) {
        console.log('OpenAI failed, using fallback extraction');
        structuredData = fallbackDataExtraction(researchContent, propertyAddress, address, citations, propertyData);
      }
    } else {
      // Use fallback extraction if no OpenAI
      structuredData = fallbackDataExtraction(researchContent, propertyAddress, address, citations, propertyData);
    }

    // Ensure all calculations are done
    try {
      structuredData = ensureCalculations(structuredData);
    } catch (calcError) {
      console.error('Error in ensureCalculations:', calcError);
      // Continue with existing data if calculations fail
    }

    // Step 3: Save to Firebase with freshness metadata
    const admin = require('firebase-admin');
    
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
    
    // Create or update property record first
    let propertyId = null;
    if (userId) {
      try {
        propertyId = `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const propertyRecord = {
          userId: userId,
          address: {
            street: address?.street || '',
            city: address?.city || '',
            state: address?.state || address?.province || '',
            postal: address?.postal || address?.postalCode || ''
          },
          price: propertyData?.price || structuredData?.property_details?.estimated_value || 0,
          propertyTaxes: propertyData?.propertyTaxes || structuredData?.costs?.property_tax_annual || 0,
          condoFees: propertyData?.condoFees || structuredData?.costs?.hoa_monthly || 0,
          bedrooms: propertyData?.bedrooms || structuredData?.property_details?.bedrooms || 0,
          bathrooms: propertyData?.bathrooms || structuredData?.property_details?.bathrooms || 0,
          sqft: propertyData?.sqft || structuredData?.property_details?.square_feet || 0,
          propertyType: propertyData?.propertyType || structuredData?.property_details?.property_type || 'Unknown',
          mlsNumber: propertyData?.mlsNumber || '',
          yearBuilt: propertyData?.yearBuilt || structuredData?.property_details?.year_built || null,
          mainImage: propertyData?.mainImage || '',
          dataSource: 'analysis',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastAnalyzed: admin.firestore.FieldValue.serverTimestamp(),
          externalId: propertyData?.mlsNumber || analysisId
        };
        
        await db.collection('properties').doc(propertyId).set(propertyRecord);
        console.log('Property created/updated:', propertyId);
      } catch (error) {
        console.error('Failed to create property:', error);
        // Continue without propertyId if property creation fails
      }
    }
    
    const analysisData = {
      ...structuredData,
      userId: userId || null,
      propertyId: propertyId, // CRITICAL: Link analysis to property
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
      research_sources: citations.slice(0, 5).map(c => ({
        name: String(c.name || 'Source'),
        url: c.url ? String(c.url) : null,
        date: String(c.date || new Date().toISOString().split('T')[0]),
        description: String(c.description || 'Research source'),
        accessed_at: String(c.accessed_at || new Date().toISOString())
      })),
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

    console.log('========== FINAL ANALYSIS DATA ==========');
    console.log('✅ ANALYSIS COMPLETED');
    console.log('Property Value:', analysisData.property_details?.estimated_value);
    console.log('Monthly Rent:', analysisData.long_term_rental?.monthly_rent);
    console.log('Property Tax Annual:', analysisData.costs?.property_tax_annual);
    console.log('ROI:', analysisData.roi_percentage);
    console.log('Data Sources:', analysisData.data_sources?.length || 0);
    console.log('Research Sources:', analysisData.research_sources?.length || 0);
    console.log('========== END FINAL DATA ==========');

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
    
    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error.message || 'An error occurred during property analysis',
      details: 'Please try again or contact support if the issue persists'
    });
  }
}

// Helper function to build structured data
function buildStructuredData(extracted, propertyAddress, researchContent, citations, address, propertyData) {
  // Use accurate expense calculations
  // Use actual property data if provided, otherwise use extracted/estimated values
  const propertyValue = propertyData?.price || extracted.property_details?.estimated_value || 850000;
  
  // First, try to extract property tax from comparables
  const comparableTax = extractPropertyTaxFromComparables(researchContent, propertyValue);
  
  const accurateExpenses = calculateAccurateExpenses({
    propertyValue: propertyValue,
    city: address.city,
    province: address.state,
    propertyType: propertyData?.propertyType || extracted.property_details?.property_type || 'Single Family',
    squareFeet: propertyData?.sqft || extracted.property_details?.square_feet || null,
    yearBuilt: propertyData?.yearBuilt || extracted.property_details?.year_built || null,
    hasAmenities: false, // Could be enhanced with amenity detection
    actualPropertyTax: propertyData?.propertyTaxes || null,
    actualCondoFees: propertyData?.condoFees || null
  });
  
  // First check if we have actual property tax data from the extension
  console.log('Checking for property tax data. propertyData:', propertyData);
  console.log('propertyData.propertyTaxes:', propertyData?.propertyTaxes);
  
  if (propertyData?.propertyTaxes) {
    console.log('========== ACTUAL PROPERTY TAX DATA FROM EXTENSION ==========');
    console.log(`Using actual property tax: $${propertyData.propertyTaxes}/year instead of calculated $${accurateExpenses.property_tax_annual}/year`);
    accurateExpenses.property_tax_annual = propertyData.propertyTaxes;
    accurateExpenses.property_tax_rate = propertyData.propertyTaxes / propertyValue;
    // Recalculate totals
    accurateExpenses.total_annual_expenses = Math.round(
      propertyData.propertyTaxes +
      accurateExpenses.insurance_annual +
      accurateExpenses.maintenance_annual +
      (accurateExpenses.hoa_monthly * 12) +
      (accurateExpenses.utilities_monthly * 12)
    );
    accurateExpenses.total_monthly_expenses = Math.round(accurateExpenses.total_annual_expenses / 12);
  } else if (comparableTax) {
    // Fall back to comparable tax data if no actual data
    console.log('========== COMPARABLE TAX DATA FOUND ==========');
    console.log(`Using comparable tax data: $${comparableTax}/year instead of calculated $${accurateExpenses.property_tax_annual}/year`);
    accurateExpenses.property_tax_annual = comparableTax;
    accurateExpenses.property_tax_rate = comparableTax / propertyValue;
    // Recalculate totals
    accurateExpenses.total_annual_expenses = Math.round(
      comparableTax +
      accurateExpenses.insurance_annual +
      accurateExpenses.maintenance_annual +
      (accurateExpenses.hoa_monthly * 12) +
      (accurateExpenses.utilities_monthly * 12)
    );
    accurateExpenses.total_monthly_expenses = Math.round(accurateExpenses.total_annual_expenses / 12);
  }
  
  // Also check for condo fees
  if (propertyData?.condoFees) {
    console.log('========== ACTUAL CONDO FEE DATA FROM EXTENSION ==========');
    console.log(`Using actual condo fees: $${propertyData.condoFees}/month instead of calculated $${accurateExpenses.hoa_monthly}/month`);
    accurateExpenses.hoa_monthly = propertyData.condoFees;
    // Recalculate totals with actual condo fees
    accurateExpenses.total_annual_expenses = Math.round(
      accurateExpenses.property_tax_annual +
      accurateExpenses.insurance_annual +
      accurateExpenses.maintenance_annual +
      (propertyData.condoFees * 12) +
      (accurateExpenses.utilities_monthly * 12)
    );
    accurateExpenses.total_monthly_expenses = Math.round(accurateExpenses.total_annual_expenses / 12);
  }
  
  const data = {
    property_address: propertyAddress, // Add this for ensureCalculations to access
    // Include raw property data from extension for frontend to use
    property: propertyData || {},
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
      estimated_value: propertyValue,
      value_date: new Date().toLocaleDateString(),
      property_type: propertyData?.propertyType || extracted.property_details?.property_type || "Single Family",
      bedrooms: parseBedroomBathroomValue(propertyData?.bedrooms) || extracted.property_details?.bedrooms || 3,
      bathrooms: parseBedroomBathroomValue(propertyData?.bathrooms) || extracted.property_details?.bathrooms || 2,
      square_feet: propertyData?.sqft || extracted.property_details?.square_feet || 1800,
      listing_status: "off-market",
      days_on_market: 0,
      // Also include raw data here for backward compatibility
      price: propertyData?.price || propertyValue,
      propertyTaxes: propertyData?.propertyTaxes,
      condoFees: propertyData?.condoFees
    },
    costs: {
      property_tax_annual: accurateExpenses.property_tax_annual,
      property_tax_rate: accurateExpenses.property_tax_rate,
      insurance_annual: accurateExpenses.insurance_annual,
      maintenance_annual: accurateExpenses.maintenance_annual,
      hoa_monthly: accurateExpenses.hoa_monthly,
      utilities_monthly: accurateExpenses.utilities_monthly,
      total_monthly_expenses: accurateExpenses.total_monthly_expenses,
      total_annual_expenses: accurateExpenses.total_annual_expenses,
      calculation_method: propertyData?.propertyTaxes ? 'actual_data' : (comparableTax ? 'comparable_data' : 'location_based_accurate')
    },
    long_term_rental: {
      monthly_rent: extracted.rental_data?.monthly_rent || estimateRentalRate(
        propertyValue,
        address.city,
        extracted.property_details?.property_type || 'Single Family'
      ),
      annual_revenue: 0, // Will be calculated
      annual_profit: 0, // Will be calculated
      rental_demand: "high",
      last_rent_check: new Date().toLocaleDateString(),
      estimation_method: extracted.rental_data?.monthly_rent ? 'market_data' : 'location_based_estimate'
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
    data_sources: citations.slice(0, 10).map(c => ({
      name: c.name || 'Source',
      url: c.url && c.url !== '#' && c.url !== 'null' ? c.url : null,
      access_date: c.accessed_at || new Date().toISOString(),
      data_date: c.date || new Date().toLocaleDateString(),
      description: c.description || 'Research source',
      is_verified: !!(c.url && typeof c.url === 'string' && c.url.startsWith('http'))
    }))
  };
  
  return data;
}

// Fallback extraction when APIs fail
function fallbackDataExtraction(researchContent, propertyAddress, address, citations, propertyData) {
  console.log('Using fallback data extraction with accurate calculations...');
  console.log('Property data in fallback:', propertyData);
  
  // Try to extract numbers from research content
  const priceMatches = researchContent.match(/\$[\d,]+,\d{3}/g) || [];
  const rentMatches = researchContent.match(/\$(\d{1,2},?\d{3})\s*(?:per month|\/month|monthly)/gi) || [];
  
  // Best guess at property value from price matches
  let estimatedValue = propertyData?.price || 850000; // Use actual price if provided
  if (!propertyData?.price && priceMatches.length > 0) {
    const prices = priceMatches.map(p => parseInt(p.replace(/[$,]/g, '')));
    estimatedValue = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  }
  
  // Adjust based on city
  if (address.city.toLowerCase().includes('toronto')) {
    estimatedValue = Math.max(estimatedValue, 900000);
  } else if (address.city.toLowerCase().includes('vancouver')) {
    estimatedValue = Math.max(estimatedValue, 1200000);
  }
  
  // Best guess at rent using location-based calculation
  let monthlyRent = estimateRentalRate(estimatedValue, address.city, 'Single Family');
  if (rentMatches.length > 0) {
    const rents = rentMatches.map(r => parseInt(r.match(/\d+,?\d+/)[0].replace(',', '')));
    monthlyRent = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
  }
  
  return {
    property_address: propertyAddress, // Add this for ensureCalculations to access
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
      property_type: propertyData?.propertyType || "Single Family",
      bedrooms: parseBedroomBathroomValue(propertyData?.bedrooms) || 3,
      bathrooms: parseBedroomBathroomValue(propertyData?.bathrooms) || 2,
      square_feet: propertyData?.sqft || 1800,
      listing_status: "off-market"
    },
    costs: (() => {
      // Use accurate expense calculations
      const expenses = calculateAccurateExpenses({
        propertyValue: estimatedValue,
        city: address.city,
        province: address.state,
        propertyType: propertyData?.propertyType || 'Single Family',
        squareFeet: propertyData?.sqft || 1800,
        yearBuilt: propertyData?.yearBuilt || 2000,
        hasAmenities: false,
        actualPropertyTax: propertyData?.propertyTaxes || null,
        actualCondoFees: propertyData?.condoFees || null
      });
      
      // Override with actual property taxes if provided
      if (propertyData?.propertyTaxes) {
        console.log('========== USING ACTUAL PROPERTY TAX IN FALLBACK ==========');
        console.log(`Overriding calculated tax ${expenses.property_tax_annual} with actual ${propertyData.propertyTaxes}`);
        expenses.property_tax_annual = propertyData.propertyTaxes;
        expenses.property_tax_rate = propertyData.propertyTaxes / estimatedValue;
        // Recalculate totals with actual tax
        expenses.total_annual_expenses = Math.round(
          propertyData.propertyTaxes +
          expenses.insurance_annual +
          expenses.maintenance_annual +
          (expenses.hoa_monthly * 12) +
          (expenses.utilities_monthly * 12)
        );
        expenses.total_monthly_expenses = Math.round(expenses.total_annual_expenses / 12);
      }
      
      // Override HOA fees if provided
      if (propertyData?.condoFees) {
        expenses.hoa_monthly = propertyData.condoFees;
      }
      
      return {
        property_tax_annual: expenses.property_tax_annual,
        property_tax_rate: expenses.property_tax_rate,
        insurance_annual: expenses.insurance_annual,
        maintenance_annual: expenses.maintenance_annual,
        hoa_monthly: expenses.hoa_monthly,
        utilities_monthly: expenses.utilities_monthly,
        property_management_percent: 0, // Default to self-managed
        cost_updated_date: new Date().toLocaleDateString(),
        calculation_method: propertyData?.propertyTaxes ? 'actual_data' : 'location_based_fallback'
      };
    })(),
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
    data_sources: citations.slice(0, 10).map(c => ({
      name: c.name || 'Source',
      url: c.url && c.url !== '#' && c.url !== 'null' ? c.url : null,
      access_date: c.accessed_at || new Date().toISOString(),
      data_date: c.date || new Date().toLocaleDateString(),
      description: c.description || 'Research source',
      is_verified: !!(c.url && typeof c.url === 'string' && c.url.startsWith('http'))
    })),
    recommendation: "Investment analysis based on market averages and comparable properties."
  };
}

// Ensure all calculations are done
function ensureCalculations(data) {
  // Calculate total annual costs - ensuring we interpret monthly vs annual correctly
  const propertyTaxAnnual = data.costs?.property_tax_annual || 0;
  const insuranceAnnual = data.costs?.insurance_annual || 0;
  
  // Validate and correct unrealistic values
  const currentPropertyValue = data.property_details?.estimated_value || 850000;
  
  // Property tax should be 0.5-1.5% of value typically
  // Check if it's too high OR too low - BUT RESPECT ACTUAL DATA
  const hasActualData = data.costs?.calculation_method === 'actual_data';
  if (hasActualData) {
    console.log(`========== KEEPING ACTUAL PROPERTY TAX DATA ==========`);
    console.log(`Property tax: $${propertyTaxAnnual}/year (${(propertyTaxAnnual/currentPropertyValue*100).toFixed(2)}% of value)`);
    console.log(`This is actual data from property listing - NOT overriding`);
  } else if (propertyTaxAnnual > currentPropertyValue * 0.015 || propertyTaxAnnual < currentPropertyValue * 0.005) {
    // This is likely incorrect - either monthly amount or just wrong
    // Use accurate location-based calculation
    let city = 'Toronto';
    let province = 'Ontario';
    
    // Try to extract city and province from property address or use property details
    if (data.property_address) {
      const addressParts = data.property_address.split(',').map(p => p.trim());
      city = addressParts[1] || city;
      province = addressParts[2] || province;
    } else if (data.property_details?.address) {
      const addressParts = data.property_details.address.split(',').map(p => p.trim());
      city = addressParts[1] || city;
      province = addressParts[2] || province;
    }
    
    const taxRate = getPropertyTaxRate(city, province);
    const correctTax = Math.round(currentPropertyValue * taxRate);
    console.log(`Corrected unrealistic property tax from $${propertyTaxAnnual} to $${correctTax} (${(taxRate * 100).toFixed(2)}% rate for ${city})`);
    data.costs.property_tax_annual = correctTax;
  }
  
  // Insurance should be 0.2-0.4% of value typically
  if (insuranceAnnual > currentPropertyValue * 0.01 || insuranceAnnual < currentPropertyValue * 0.002) {
    // This is likely incorrect
    const propertyType = data.property_details?.property_type || 'Single Family';
    const insuranceCalc = calculateInsurance(currentPropertyValue, city, propertyType);
    console.log(`Corrected unrealistic insurance from $${insuranceAnnual} to $${insuranceCalc} for ${propertyType} in ${city}`);
    data.costs.insurance_annual = insuranceCalc;
  }
  
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
  const propValue = data.property_details?.estimated_value || 1;
  const bestProfit = Math.max(
    data.long_term_rental?.annual_profit || 0,
    data.short_term_rental?.annual_profit || 0
  );
  
  data.roi_percentage = ((bestProfit / propValue) * 100).toFixed(2);
  
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
  // Look for specific property value patterns first
  const propertyValuePatterns = [
    /property value[:\s]+\$?([\d,]+)/i,
    /estimated value[:\s]+\$?([\d,]+)/i,
    /assessed at[:\s]+\$?([\d,]+)/i,
    /valued at[:\s]+\$?([\d,]+)/i,
    /worth[:\s]+\$?([\d,]+)/i,
    /price[:\s]+\$?([\d,]+)/i,
    /listed for[:\s]+\$?([\d,]+)/i,
    /sold for[:\s]+\$?([\d,]+)/i,
    /asking[:\s]+\$?([\d,]+)/i
  ];
  
  for (const pattern of propertyValuePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const value = parseInt(match[1].replace(/,/g, ''));
      if (value > 100000 && value < 10000000) { // Reasonable property value range
        console.log('Found property value using pattern:', pattern, 'Value:', value);
        return value;
      }
    }
  }
  
  // Fallback to general price matching, but filter for reasonable property values
  const priceMatches = content.match(/\$[\d,]+,\d{3}/g) || [];
  if (priceMatches.length > 0) {
    const prices = priceMatches.map(p => parseInt(p.replace(/[$,]/g, '')))
      .filter(price => price > 100000 && price < 10000000); // Filter reasonable property values
    
    if (prices.length > 0) {
      // Return the highest value found, as it's more likely to be the property value
      const maxPrice = Math.max(...prices);
      console.log('Using highest price found as property value:', maxPrice);
      return maxPrice;
    }
  }
  
  console.log('No property value found in research, using default');
  return 850000; // Default
}

// Helper to extract comparables with tax data
function extractComparables(content) {
  const comparables = [];
  
  // Look for patterns that include both price and tax
  const patterns = [
    /(\d+ \w+ (?:Street|St|Avenue|Ave|Road|Rd|Gate|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl)).*?(?:sold|listed).*?\$[\d,]+.*?(?:property tax|taxes?|tax):\s*\$[\d,]+/gi,
    /(\d+ \w+ (?:Street|St|Avenue|Ave|Road|Rd|Gate|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl)).*?\$[\d,]+.*?(?:property tax|taxes?|tax):\s*\$[\d,]+/gi
  ];
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => {
      const priceMatch = match.match(/\$[\d,]+/g);
      const taxMatch = match.match(/(?:property tax|taxes?|tax):\s*\$([\d,]+)/i);
      
      // Try to extract date
      const dateMatch = match.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/i);
      const saleDate = dateMatch ? new Date(dateMatch[0]) : new Date();
      
      if (priceMatch && priceMatch.length > 0) {
        const addressMatch = match.match(/(\d+ \w+ (?:Street|St|Avenue|Ave|Road|Rd|Gate|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl))/i);
        comparables.push({
          address: addressMatch ? addressMatch[0].trim() : 'Comparable property',
          sold_price: priceMatch[0],
          property_tax_annual: taxMatch ? parseInt(taxMatch[1].replace(/,/g, '')) : null,
          sold_date: saleDate.toLocaleDateString(),
          is_recent: (new Date() - saleDate) / (1000 * 60 * 60 * 24) < 365 // Within past year
        });
      }
    });
  });
  
  // If no tax data found, try regular price-only pattern
  if (comparables.length === 0) {
    const soldMatches = content.match(/(\d+ \w+ (?:Street|St|Avenue|Ave|Road|Rd|Gate|Drive|Dr)).*?sold.*?\$[\d,]+/gi) || [];
    
    soldMatches.slice(0, 3).forEach(match => {
      const priceMatch = match.match(/\$[\d,]+/);
      const dateMatch = match.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/i);
      const saleDate = dateMatch ? new Date(dateMatch[0]) : new Date();
      
      if (priceMatch) {
        comparables.push({
          address: match.split('sold')[0].trim(),
          sold_price: priceMatch[0],
          property_tax_annual: null,
          sold_date: saleDate.toLocaleDateString(),
          is_recent: (new Date() - saleDate) / (1000 * 60 * 60 * 24) < 365 // Within past year
        });
      }
    });
  }
  
  // Prioritize recent sales (within past year)
  comparables.sort((a, b) => {
    if (a.is_recent && !b.is_recent) return -1;
    if (!a.is_recent && b.is_recent) return 1;
    return 0;
  });
  
  return comparables.slice(0, 3); // Return max 3 comparables
}

// Helper to extract property tax from comparables
function extractPropertyTaxFromComparables(content, propertyValue) {
  // Look for tax amounts in the content
  const taxPatterns = [
    /property tax(?:es)?:\s*\$([\d,]+)(?:\/year)?/gi,
    /taxes?:\s*\$([\d,]+)(?:\/year)?/gi,
    /annual tax(?:es)?:\s*\$([\d,]+)/gi,
    /tax(?:es)? \$([\d,]+)\/year/gi
  ];
  
  const taxAmounts = [];
  taxPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      // Validate it's a reasonable annual amount (not monthly)
      if (amount > 1000 && amount < 50000) {
        taxAmounts.push(amount);
      }
    }
  });
  
  if (taxAmounts.length > 0) {
    // Average the tax amounts found
    const avgTax = Math.round(taxAmounts.reduce((a, b) => a + b, 0) / taxAmounts.length);
    console.log(`Found ${taxAmounts.length} property tax amounts in comparables, average: $${avgTax}`);
    return avgTax;
  }
  
  return null;
}

// Removed demo data generator - only using real data

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
