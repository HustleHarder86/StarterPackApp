// api/analyze-property-enhanced.js
// Enhanced property analysis with LTR discovery and STR comparison

const { calculateAccurateExpenses, getPropertyTaxRate, estimateRentalRate, calculateInsurance } = require('./property-calculations.js');
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin if not already initialized
let db;
try {
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  db = getFirestore(app);
} catch (error) {
  // App already initialized
  db = getFirestore();
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      propertyAddress, 
      propertyId, // If analyzing from saved property
      userEmail, 
      userName, 
      requestType,
      includeSTR = false // Flag to include STR analysis
    } = req.body;

    // Get property data either from propertyId or propertyAddress
    let propertyData = null;
    if (propertyId) {
      const propertyDoc = await db.collection('properties').doc(propertyId).get();
      if (propertyDoc.exists) {
        propertyData = propertyDoc.data();
        propertyAddress = propertyData.address?.full || propertyData.address;
      }
    }

    if (!propertyAddress && !propertyData) {
      return res.status(400).json({ error: 'Property address or ID is required' });
    }

    console.log('Starting enhanced property analysis for:', propertyAddress);
    console.log('Include STR analysis:', includeSTR);

    // Check user's STR trial status if not Pro
    let canUseSTR = includeSTR;
    if (userId && includeSTR) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const isPro = userData.subscriptionTier === 'pro' || userData.subscriptionTier === 'enterprise';
        const trialRemaining = 5 - (userData.strTrialUsed || 0);
        
        if (!isPro && trialRemaining <= 0) {
          canUseSTR = false;
          console.log('User has exhausted STR trial analyses');
        }
      }
    }

    // Check if API keys are configured
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const perplexityConfigured = !!perplexityApiKey && perplexityApiKey.startsWith('pplx-');
    const openaiConfigured = !!openaiApiKey && openaiApiKey.startsWith('sk-');
    
    if (!perplexityConfigured) {
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

    // Step 1: Enhanced Long-Term Rental Discovery with Perplexity AI
    console.log('Discovering long-term rental rates with AI...');
    
    const ltrPrompt = `Find current long-term rental rates for properties similar to:
- Address: ${propertyAddress}
- Type: ${propertyData?.propertyType || 'residential property'}
- Bedrooms: ${propertyData?.bedrooms || '3'}
- Bathrooms: ${propertyData?.bathrooms || '2'}
- Size: ${propertyData?.sqft || '1800'} sq ft

IMPORTANT: Search for CURRENT rental listings and rates from:
1. Rentals.ca - Search for similar properties in ${address.city}
2. Kijiji.ca - Look for rental listings in the same neighborhood
3. PadMapper - Find comparable rentals
4. Facebook Marketplace rentals in the area
5. Local property management company websites

Provide:
1. Average monthly rent for similar properties (with specific examples)
2. Rent range (low to high) with actual listings
3. At least 3 specific comparable rental listings with:
   - Full address
   - Monthly rent
   - Bedrooms/bathrooms
   - Link to listing (SOURCE: [URL])
4. Vacancy rate in the area
5. Rental market trends (increasing/stable/decreasing)

FORMAT EVERY DATA POINT WITH: SOURCE: [full URL]`;

    let ltrResearch;
    try {
      const ltrResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: `You are a real estate rental market analyst. Research CURRENT rental rates as of ${new Date().toISOString()}. Always include SOURCE URLs.`
            },
            {
              role: 'user',
              content: ltrPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
          search_depth: "advanced",
          search_recency_filter: "month", // Focus on recent listings
          search_domain_filter: ["rentals.ca", "kijiji.ca", "padmapper.com", "facebook.com", "craigslist.org"],
          return_citations: true
        })
      });

      if (!ltrResponse.ok) {
        throw new Error(`LTR research failed: ${ltrResponse.status}`);
      }

      const ltrData = await ltrResponse.json();
      ltrResearch = ltrData.choices[0].message.content;
      console.log('LTR Research completed:', ltrResearch.substring(0, 500) + '...');
    } catch (error) {
      console.error('LTR research error:', error);
      ltrResearch = null;
    }

    // Step 2: Property Value and Details Research
    const propertyResearchPrompt = `Research property details and value for: ${propertyAddress}

Find:
1. Current estimated property value or recent assessment
2. Property details (type, size, bedrooms, bathrooms, year built)
3. Property taxes (annual amount and rate)
4. Recent comparable sales in the area
5. Insurance estimates for the property

Search realtor.ca, housesigma.com, zolo.ca for accurate data.
Include SOURCE: [URL] for every data point.`;

    let propertyResearch;
    try {
      const propertyResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
              content: 'You are a real estate data analyst. Find accurate property information.'
            },
            {
              role: 'user',
              content: propertyResearchPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
          search_depth: "advanced",
          search_domain_filter: ["realtor.ca", "housesigma.com", "zolo.ca"],
          return_citations: true
        })
      });

      if (!propertyResponse.ok) {
        throw new Error(`Property research failed: ${propertyResponse.status}`);
      }

      const propData = await propertyResponse.json();
      propertyResearch = propData.choices[0].message.content;
    } catch (error) {
      console.error('Property research error:', error);
      propertyResearch = null;
    }

    // Step 3: STR Analysis (if requested and allowed)
    let strAnalysis = null;
    if (canUseSTR) {
      // This would call the Airbnb Scraper API
      // For now, we'll use Perplexity to get estimates
      const strPrompt = `Find short-term rental (Airbnb) data for properties near: ${propertyAddress}

Search for:
1. Similar Airbnb listings within 1km
2. Average nightly rates for ${propertyData?.bedrooms || 3} bedroom properties
3. Typical occupancy rates in ${address.city}
4. Seasonal rate variations
5. At least 3 comparable Airbnb listings with rates and links

Include SOURCE: [URL] for all data.`;

      try {
        const strResponse = await fetch('https://api.perplexity.ai/chat/completions', {
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
                content: 'You are a short-term rental market analyst. Find Airbnb rates and occupancy data.'
              },
              {
                role: 'user',
                content: strPrompt
              }
            ],
            max_tokens: 1500,
            temperature: 0.1,
            search_depth: "advanced",
            search_domain_filter: ["airbnb.com", "vrbo.com", "airdna.com"],
            return_citations: true
          })
        });

        if (strResponse.ok) {
          const strData = await strResponse.json();
          strAnalysis = strData.choices[0].message.content;
          
          // Update user's STR trial count if not Pro
          if (userId && !isPro) {
            await db.collection('users').doc(userId).update({
              strTrialUsed: (userData.strTrialUsed || 0) + 1
            });
          }
        }
      } catch (error) {
        console.error('STR analysis error:', error);
      }
    }

    // Step 4: Process and structure all data
    const structuredData = await processAnalysisData({
      ltrResearch,
      propertyResearch,
      strAnalysis,
      propertyAddress,
      address,
      propertyData,
      includeSTR: canUseSTR
    });

    // Step 5: Calculate LTR vs STR comparison
    if (canUseSTR && structuredData.strAnalysis) {
      structuredData.comparison = calculateRentalComparison(
        structuredData.longTermRental,
        structuredData.strAnalysis
      );
    }

    // Step 6: Save analysis to Firebase
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const analysisData = {
      ...structuredData,
      id: analysisId,
      userId: userId || null,
      propertyId: propertyId || null,
      userName: userName || null,
      userEmail: userEmail || null,
      propertyAddress,
      analysisType: canUseSTR ? 'combined' : 'traditional',
      requestType: requestType || 'demo',
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    await db.collection('analyses').doc(analysisId).set(analysisData);
    console.log('Enhanced analysis saved:', analysisId);

    // Update user analysis count
    if (userId && requestType === 'authenticated') {
      try {
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          monthlyAnalysisCount: admin.firestore.FieldValue.increment(1),
          lastAnalysisDate: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to update analysis count:', error);
      }
    }

    // Return enhanced analysis results
    return res.status(200).json({
      success: true,
      analysisId,
      analysis: analysisData,
      strTrialRemaining: canUseSTR ? null : (5 - (userData?.strTrialUsed || 0))
    });

  } catch (error) {
    console.error('Enhanced analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
}

// Process all research data into structured format
async function processAnalysisData({ 
  ltrResearch, 
  propertyResearch, 
  strAnalysis, 
  propertyAddress, 
  address,
  propertyData,
  includeSTR 
}) {
  // Extract property value and details
  let propertyValue = propertyData?.price || 850000;
  let propertyDetails = {
    address: propertyAddress,
    estimatedValue: propertyValue,
    propertyType: propertyData?.propertyType || 'Single Family',
    bedrooms: propertyData?.bedrooms || 3,
    bathrooms: propertyData?.bathrooms || 2,
    sqft: propertyData?.sqft || 1800,
    yearBuilt: propertyData?.yearBuilt || 2000
  };

  // Try to extract better data from research
  if (propertyResearch) {
    const valueMatch = propertyResearch.match(/\$[\d,]+,\d{3}/);
    if (valueMatch) {
      propertyValue = parseInt(valueMatch[0].replace(/[$,]/g, ''));
      propertyDetails.estimatedValue = propertyValue;
    }
  }

  // Extract LTR data
  let monthlyRent = estimateRentalRate(propertyValue, address.city, propertyDetails.propertyType);
  let rentRange = { low: monthlyRent * 0.9, high: monthlyRent * 1.1 };
  let ltrComparables = [];

  if (ltrResearch) {
    // Extract average rent
    const rentMatches = ltrResearch.match(/\$(\d{1,2},?\d{3})\s*(?:per month|\/month|monthly)/gi) || [];
    if (rentMatches.length > 0) {
      const rents = rentMatches.map(r => parseInt(r.match(/\d+,?\d+/)[0].replace(',', '')));
      monthlyRent = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);
      rentRange = {
        low: Math.min(...rents),
        high: Math.max(...rents)
      };
    }

    // Extract comparables
    const comparableMatches = ltrResearch.match(/\d+.*?bedroom.*?\$\d{1,2},?\d{3}.*?(?:SOURCE|http)/gi) || [];
    ltrComparables = comparableMatches.slice(0, 3).map(match => ({
      description: match,
      extracted: true
    }));
  }

  // Calculate expenses
  const expenses = calculateAccurateExpenses({
    propertyValue,
    city: address.city,
    province: address.state,
    propertyType: propertyDetails.propertyType,
    squareFeet: propertyDetails.sqft,
    yearBuilt: propertyDetails.yearBuilt
  });

  // Build structured response
  const result = {
    propertyDetails,
    costs: expenses,
    longTermRental: {
      monthlyRent,
      rentRange,
      comparables: ltrComparables,
      vacancyRate: 5, // Default 5%
      annualRevenue: monthlyRent * 12 * 0.95,
      annualExpenses: Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0),
      annualProfit: (monthlyRent * 12 * 0.95) - Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0),
      cashFlow: monthlyRent - (Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0) / 12),
      capRate: ((monthlyRent * 12 * 0.95) - Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0)) / propertyValue * 100,
      dataSource: ltrResearch ? 'ai_research' : 'estimated'
    }
  };

  // Add STR analysis if available
  if (includeSTR && strAnalysis) {
    let avgNightlyRate = Math.round(monthlyRent / 15); // Default estimate
    let occupancyRate = 65; // Default
    let strComparables = [];

    // Extract from STR research
    if (strAnalysis) {
      const nightlyMatches = strAnalysis.match(/\$(\d{2,3})\s*(?:per night|\/night|nightly)/gi) || [];
      if (nightlyMatches.length > 0) {
        const rates = nightlyMatches.map(r => parseInt(r.match(/\d+/)[0]));
        avgNightlyRate = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
      }

      const occupancyMatch = strAnalysis.match(/(\d{2})\s*%\s*occupancy/i);
      if (occupancyMatch) {
        occupancyRate = parseInt(occupancyMatch[1]);
      }
    }

    result.strAnalysis = {
      avgNightlyRate,
      occupancyRate,
      comparables: strComparables,
      annualRevenue: avgNightlyRate * 365 * (occupancyRate / 100),
      annualExpenses: Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0) * 1.2, // 20% higher for STR
      annualProfit: (avgNightlyRate * 365 * (occupancyRate / 100)) - (Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0) * 1.2),
      dataSource: strAnalysis ? 'ai_research' : 'estimated'
    };
  }

  return result;
}

// Calculate comparison between LTR and STR
function calculateRentalComparison(ltr, str) {
  if (!ltr || !str) return null;

  const monthlyIncomeDiff = (str.annualRevenue / 12) - ltr.monthlyRent;
  const annualIncomeDiff = str.annualRevenue - ltr.annualRevenue;
  const annualProfitDiff = str.annualProfit - ltr.annualProfit;
  
  // Calculate break-even occupancy for STR to match LTR
  const breakEvenOccupancy = (ltr.annualRevenue / (str.avgNightlyRate * 365)) * 100;

  return {
    monthlyIncomeDiff,
    annualIncomeDiff,
    annualProfitDiff,
    betterStrategy: annualProfitDiff > 0 ? 'str' : 'ltr',
    breakEvenOccupancy: Math.round(breakEvenOccupancy),
    percentageIncrease: ((str.annualProfit - ltr.annualProfit) / ltr.annualProfit * 100).toFixed(1),
    riskAssessment: str.occupancyRate < 60 ? 'Higher risk due to low occupancy' : 'Moderate risk with good occupancy',
    recommendation: annualProfitDiff > 20000 
      ? 'Strong recommendation for short-term rental strategy'
      : annualProfitDiff > 0
      ? 'Short-term rental offers better returns but consider management overhead'
      : 'Long-term rental recommended for stable income with less management'
  };
}