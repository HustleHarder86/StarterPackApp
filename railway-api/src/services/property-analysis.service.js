const axios = require('axios');
const config = require('../config');
const logger = require('./logger.service');
const { cache } = require('./simple-cache.service');
const { createAnalysis, createProperty } = require('./firebase.service');
const { 
  calculateAccurateExpenses, 
  getPropertyTaxRate, 
  estimateRentalRate, 
  calculateInsurance 
} = require('../utils/property-calculations');

// Helper function to extract numeric value from text
function extractNumericValue(text, keyword) {
  if (!text) return null;
  
  const patterns = [
    new RegExp(`${keyword}:?\\s*\\$?([\\d,]+(?:\\.\\d+)?)`, 'i'),
    new RegExp(`\\$?([\\d,]+(?:\\.\\d+)?)\\s*${keyword}`, 'i'),
    new RegExp(`${keyword}.*?\\$?([\\d,]+(?:\\.\\d+)?)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }
  
  return null;
}

// Calculate API usage cost
function calculateAPIUsageCost(usage) {
  const costs = {
    perplexity: {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01
    }
  };
  
  const inputCost = (costs.perplexity.inputTokens / 1000) * costs.perplexity.costPer1kInput;
  const outputCost = (costs.perplexity.outputTokens / 1000) * costs.perplexity.costPer1kOutput;
  
  return {
    inputTokens: costs.perplexity.inputTokens,
    outputTokens: costs.perplexity.outputTokens,
    totalTokens: costs.perplexity.inputTokens + costs.perplexity.outputTokens,
    inputCost: inputCost.toFixed(4),
    outputCost: outputCost.toFixed(4),
    totalCost: (inputCost + outputCost).toFixed(4),
    model: 'perplexity-sonar'
  };
}

// Main analysis logic
async function analyzePropertyLogic({
  propertyAddress,
  propertyData,
  userId,
  userEmail,
  userName,
  requestType,
  onProgress
}) {
  const startTime = Date.now();
  
  logger.info('Starting property analysis', {
    propertyAddress,
    userId,
    hasPropertyData: !!propertyData
  });
  
  // Progress callback helper
  const updateProgress = async (progress, message) => {
    if (onProgress) {
      await onProgress(progress, message);
    }
  };
  
  try {
    // Parse address
    const addressParts = propertyAddress.split(',').map(part => part.trim());
    const address = {
      street: addressParts[0] || '',
      city: addressParts[1] || '',
      state: addressParts[2] || '',
      country: addressParts[3] || 'Canada',
      postal: addressParts[4] || ''
    };
    
    // Estimate property value
    let estimatedValue = propertyData?.price || 850000;
    if (!propertyData?.price) {
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
    }
    
    await updateProgress(20, 'Fetching market data from AI...');
    
    // Call Perplexity AI for research
    const perplexityResponse = await callPerplexityAI({
      propertyAddress,
      address,
      estimatedValue,
      propertyData
    });
    
    await updateProgress(40, 'Analyzing rental rates...');
    
    // Process the research data
    const processedData = await processResearchData({
      researchContent: perplexityResponse.content,
      propertyAddress,
      address,
      estimatedValue,
      propertyData,
      citations: perplexityResponse.citations
    });
    
    await updateProgress(60, 'Calculating financial metrics...');
    
    // Calculate financial metrics
    const financialMetrics = calculateFinancialMetrics({
      ...processedData,
      propertyData
    });
    
    await updateProgress(80, 'Generating recommendations...');
    
    // Generate insights and recommendations
    const insights = generateInsights(financialMetrics);
    
    // Prepare final response
    const analysis = {
      success: true,
      propertyAddress,
      timestamp: new Date().toISOString(),
      executionTime: `${((Date.now() - startTime) / 1000).toFixed(2)} seconds`,
      apiCosts: perplexityResponse.apiCosts,
      ...processedData,
      ...financialMetrics,
      insights,
      metadata: {
        dataSource: propertyData ? 'listing_with_ai_enhancement' : 'ai_research_only',
        confidence: processedData.dataQuality || 'high'
      }
    };
    
    // Save to database if user is authenticated
    if (userId) {
      try {
        const analysisId = await createAnalysis({
          userId,
          propertyAddress,
          analysisType: 'traditional',
          ...analysis
        });
        analysis.analysisId = analysisId;
      } catch (dbError) {
        logger.error('Failed to save analysis to database', dbError);
      }
    }
    
    await updateProgress(100, 'Analysis complete!');
    
    return analysis;
    
  } catch (error) {
    logger.error('Property analysis failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Call Perplexity AI for research
async function callPerplexityAI({ propertyAddress, address, estimatedValue, propertyData }) {
  const perplexityApiKey = config.apis.perplexity.key;
  
  if (!perplexityApiKey || !perplexityApiKey.startsWith('pplx-')) {
    throw new Error('Perplexity API key not configured');
  }
  
  const requestBody = {
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
        content: buildPerplexityPrompt({ propertyAddress, address, estimatedValue, propertyData })
      }
    ],
    max_tokens: 3000,
    temperature: 0.1,
    top_p: 0.9,
    stream: false
  };
  
  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const content = response.data.choices[0].message.content;
    const apiCosts = calculateAPIUsageCost(response.data.usage || {});
    
    return {
      content,
      apiCosts,
      citations: response.data.citations || []
    };
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 401) {
        throw new Error('Invalid Perplexity API key');
      } else if (status === 429) {
        throw new Error('Perplexity API rate limit exceeded');
      } else {
        throw new Error(`Perplexity API error: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    }
    throw error;
  }
}

// Build Perplexity prompt
function buildPerplexityPrompt({ propertyAddress, address, estimatedValue, propertyData }) {
  const { getPropertyTaxRate } = require('../utils/property-calculations');
  const expectedTaxRate = getPropertyTaxRate(address.city, address.state);
  
  return `Perform REAL-TIME research for property: ${propertyAddress}

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
   - IMPORTANT: Property tax in ${address.city} should be approximately ${expectedTaxRate * 100}% of property value
   - For a $${estimatedValue.toLocaleString()} property in ${address.city}, expect taxes around $${Math.round(estimatedValue * expectedTaxRate).toLocaleString()}/year
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

${propertyData ? `
IMPORTANT: The following data was extracted from the listing:
- Price: $${propertyData.price?.toLocaleString() || 'Unknown'}
- Property Taxes: $${propertyData.propertyTaxes || 'Unknown'}/year
- Square Feet: ${propertyData.sqft || 'Unknown'}
- Bedrooms: ${propertyData.bedrooms || 'Unknown'}
- Bathrooms: ${propertyData.bathrooms || 'Unknown'}
- Property Type: ${propertyData.propertyType || 'Unknown'}

USE THIS ACTUAL DATA in your analysis and calculations!` : ''}`;
}

// Process research data
async function processResearchData({ researchContent, propertyAddress, address, estimatedValue, propertyData, citations }) {
  // This is a simplified version - the full implementation would extract all the data
  // from the research content similar to the original analyze-property.js
  
  const extractedData = {
    propertyDetails: {
      address: propertyAddress,
      city: address.city,
      state: address.state,
      estimatedValue: propertyData?.price || estimatedValue,
      propertyType: propertyData?.propertyType || 'Single Family',
      bedrooms: propertyData?.bedrooms || extractNumericValue(researchContent, 'bedroom') || 3,
      bathrooms: propertyData?.bathrooms || extractNumericValue(researchContent, 'bathroom') || 2,
      sqft: propertyData?.sqft || extractNumericValue(researchContent, 'sq|square') || 1800,
      yearBuilt: propertyData?.yearBuilt || extractNumericValue(researchContent, 'built') || 2000
    },
    expenses: await calculateAccurateExpenses({
      city: address.city,
      province: address.state,
      propertyValue: propertyData?.price || estimatedValue,
      sqft: propertyData?.sqft || 1800,
      propertyType: propertyData?.propertyType || 'Single Family',
      actualPropertyTax: propertyData?.propertyTaxes,
      actualCondoFees: propertyData?.condoFees
    }),
    rental: {
      monthlyRent: extractNumericValue(researchContent, 'rent|monthly') || estimateRentalRate(estimatedValue),
      comparables: [] // Would extract from research content
    },
    citations: citations || []
  };
  
  return extractedData;
}

// Calculate financial metrics
function calculateFinancialMetrics(data) {
  const { propertyDetails, expenses, rental } = data;
  
  // Mortgage calculations (assuming 20% down, 5% interest, 25 years)
  const downPayment = propertyDetails.estimatedValue * 0.2;
  const mortgageAmount = propertyDetails.estimatedValue - downPayment;
  const monthlyRate = 0.05 / 12;
  const numPayments = 25 * 12;
  const mortgagePayment = mortgageAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  // Monthly expenses
  const monthlyExpenses = {
    mortgage: Math.round(mortgagePayment),
    propertyTax: Math.round(expenses.property_tax_annual / 12),
    insurance: Math.round(expenses.insurance_annual / 12),
    maintenance: Math.round(expenses.maintenance_annual / 12),
    utilities: expenses.utilities_monthly,
    hoa: expenses.hoa_monthly,
    management: Math.round(rental.monthlyRent * 0.08), // 8% property management
    total: 0
  };
  
  monthlyExpenses.total = Object.values(monthlyExpenses).reduce((sum, val) => sum + val, 0);
  
  // Cash flow and metrics
  const monthlyCashFlow = rental.monthlyRent - monthlyExpenses.total;
  const annualCashFlow = monthlyCashFlow * 12;
  const capRate = ((rental.monthlyRent * 12 - (monthlyExpenses.total - monthlyExpenses.mortgage) * 12) / propertyDetails.estimatedValue) * 100;
  const cashOnCashReturn = (annualCashFlow / downPayment) * 100;
  
  return {
    purchase: {
      price: propertyDetails.estimatedValue,
      downPayment,
      mortgageAmount,
      closingCosts: Math.round(propertyDetails.estimatedValue * 0.015)
    },
    monthlyExpenses,
    cashFlow: {
      monthly: monthlyCashFlow,
      annual: annualCashFlow
    },
    metrics: {
      capRate: capRate.toFixed(2),
      cashOnCashReturn: cashOnCashReturn.toFixed(2),
      totalROI: ((annualCashFlow + (propertyDetails.estimatedValue * 0.03)) / downPayment * 100).toFixed(2)
    }
  };
}

// Generate insights
function generateInsights(financialMetrics) {
  const insights = [];
  const { cashFlow, metrics } = financialMetrics;
  
  // Cash flow insights
  if (cashFlow.monthly > 500) {
    insights.push({
      type: 'positive',
      category: 'cash_flow',
      message: `Strong positive cash flow of $${cashFlow.monthly.toLocaleString()}/month`
    });
  } else if (cashFlow.monthly > 0) {
    insights.push({
      type: 'neutral',
      category: 'cash_flow',
      message: `Modest positive cash flow of $${cashFlow.monthly.toLocaleString()}/month`
    });
  } else {
    insights.push({
      type: 'negative',
      category: 'cash_flow',
      message: `Negative cash flow of $${Math.abs(cashFlow.monthly).toLocaleString()}/month`
    });
  }
  
  // Cap rate insights
  if (parseFloat(metrics.capRate) > 6) {
    insights.push({
      type: 'positive',
      category: 'cap_rate',
      message: `Excellent cap rate of ${metrics.capRate}%`
    });
  } else if (parseFloat(metrics.capRate) > 4) {
    insights.push({
      type: 'neutral',
      category: 'cap_rate',
      message: `Moderate cap rate of ${metrics.capRate}%`
    });
  } else {
    insights.push({
      type: 'negative',
      category: 'cap_rate',
      message: `Low cap rate of ${metrics.capRate}%`
    });
  }
  
  return insights;
}

module.exports = {
  analyzePropertyLogic,
  calculateAPIUsageCost,
  extractNumericValue
};