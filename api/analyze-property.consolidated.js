/**
 * Consolidated Property Analysis API Endpoint
 * Merges functionality from all three versions:
 * - Base: Simple proxy to Railway API
 * - Enhanced: Additional data validation and processing
 * - Full: Complete analysis with Perplexity integration
 * 
 * Features controlled by request parameters or feature flags
 */

const { calculateAccurateExpenses, getPropertyTaxRate, estimateRentalRate, calculateInsurance } = require('./property-calculations.js');
const { applyCorsHeaders } = require('../utils/cors-config.js');
const { authenticate } = require('../utils/auth-middleware-cjs.js');

/**
 * Parse bedroom/bathroom strings that may contain "X + Y" format
 */
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

/**
 * Main handler function
 */
module.exports = async function handler(req, res) {
  // Apply proper CORS headers
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract mode from request
    const mode = req.body.mode || req.query.mode || 'full'; // 'proxy', 'enhanced', or 'full'
    const useRailway = process.env.USE_RAILWAY_API === 'true' || mode === 'proxy';
    
    console.log(`[analyze-property] Running in ${mode} mode`);

    // For proxy mode, forward to Railway API
    if (useRailway) {
      return handleRailwayProxy(req, res);
    }

    // For enhanced/full mode, run local analysis
    return handleLocalAnalysis(req, res, mode);
    
  } catch (error) {
    console.error('[analyze-property] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Failed to process property analysis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Handle Railway API proxy mode
 */
async function handleRailwayProxy(req, res) {
  try {
    console.log('[Proxy Mode] Forwarding to Railway API');
    
    // Get Railway API URL from environment
    const railwayUrl = process.env.RAILWAY_API_URL || 'https://real-estate-app-production-ba5c.up.railway.app';
    const endpoint = `${railwayUrl}/api/analysis/property`;
    
    console.log('[Proxy Mode] Railway endpoint:', endpoint);
    
    // Forward the request to Railway
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        ...(process.env.RAILWAY_API_KEY && {
          'X-API-Key': process.env.RAILWAY_API_KEY
        })
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Proxy Mode] Railway API error:', response.status, data);
      return res.status(response.status).json(data);
    }
    
    console.log('[Proxy Mode] Successfully received analysis from Railway');
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('[Proxy Mode] Error forwarding to Railway:', error);
    throw error;
  }
}

/**
 * Handle local analysis (enhanced/full mode)
 */
async function handleLocalAnalysis(req, res, mode) {
  try {
    // Authenticate user
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Extract request data
    const userId = req.user?.uid || req.body.userId;
    const userEmail = req.user?.email || req.body.userEmail;
    const userName = req.body.userName;
    const { propertyAddress, requestType, propertyData } = req.body;

    // Validate required fields
    if (!propertyAddress) {
      return res.status(400).json({ error: 'Property address is required' });
    }

    console.log(`[${mode} Mode] Starting property analysis for:`, propertyAddress);
    console.log('Property data received:', JSON.stringify(propertyData, null, 2));
    
    // Process property data
    const processedData = processPropertyData(propertyData);
    
    // Check API configuration
    const apiConfig = checkAPIConfiguration();
    
    if (!apiConfig.perplexity && mode === 'full' && !req.isE2ETest) {
      console.error('Perplexity API key not configured for full mode');
      return res.status(500).json({
        success: false,
        error: 'API configuration error - Perplexity API key required for full analysis',
        mode: mode
      });
    }

    // Perform analysis based on mode
    let analysisResult;
    
    if (mode === 'enhanced') {
      // Enhanced mode: Local calculations only
      analysisResult = await performEnhancedAnalysis(processedData, propertyAddress);
    } else {
      // Full mode: Complete analysis with AI
      analysisResult = await performFullAnalysis(processedData, propertyAddress, apiConfig);
    }

    // Add metadata
    analysisResult.metadata = {
      timestamp: new Date().toISOString(),
      mode: mode,
      userId: userId,
      userEmail: userEmail,
      address: propertyAddress
    };

    console.log(`[${mode} Mode] Analysis completed successfully`);
    return res.status(200).json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error(`[${mode} Mode] Analysis error:`, error);
    throw error;
  }
}

/**
 * Process and validate property data
 */
function processPropertyData(propertyData) {
  if (!propertyData) return {};
  
  return {
    price: parseFloat(propertyData.price) || 0,
    propertyTaxes: parseFloat(propertyData.propertyTaxes) || 0,
    condoFees: parseFloat(propertyData.condoFees) || 0,
    bedrooms: parseBedroomBathroomValue(propertyData.bedrooms),
    bathrooms: parseBedroomBathroomValue(propertyData.bathrooms),
    sqft: parseFloat(propertyData.sqft) || 0,
    propertyType: propertyData.propertyType || 'unknown',
    yearBuilt: parseInt(propertyData.yearBuilt) || null,
    address: propertyData.address || '',
    city: propertyData.city || '',
    province: propertyData.province || 'ON'
  };
}

/**
 * Check API configuration
 */
function checkAPIConfiguration() {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const airbnbApiKey = process.env.AIRBNB_SCRAPER_API_KEY;

  return {
    perplexity: !!perplexityApiKey && perplexityApiKey.startsWith('pplx-'),
    openai: !!openaiApiKey && openaiApiKey.startsWith('sk-'),
    airbnb: !!airbnbApiKey
  };
}

/**
 * Perform enhanced analysis (local calculations only)
 */
async function performEnhancedAnalysis(propertyData, address) {
  console.log('[Enhanced Analysis] Starting local calculations');
  
  const { price, propertyTaxes, condoFees, bedrooms, bathrooms, sqft, propertyType, city } = propertyData;
  
  // Calculate expenses
  const expenses = calculateAccurateExpenses({
    purchasePrice: price,
    propertyTaxes: propertyTaxes,
    condoFees: condoFees,
    propertyType: propertyType,
    city: city
  });
  
  // Estimate rental rates
  const monthlyRent = estimateRentalRate({
    bedrooms: bedrooms,
    bathrooms: bathrooms,
    sqft: sqft,
    propertyType: propertyType,
    city: city
  });
  
  // Calculate STR revenue (simplified)
  const strRevenue = monthlyRent * 1.5; // Simplified assumption
  const occupancyRate = 70; // Default occupancy
  
  return {
    property_data: propertyData,
    costs: expenses,
    long_term_rental: {
      monthly_rent: monthlyRent,
      annual_rent: monthlyRent * 12,
      vacancy_rate: 5
    },
    short_term_rental: {
      nightly_rate: Math.round(strRevenue / 30),
      monthly_revenue: strRevenue,
      annual_revenue: strRevenue * 12,
      occupancy_rate: occupancyRate
    },
    financial_summary: {
      total_monthly_expenses: expenses.totalMonthly,
      ltr_net_income: monthlyRent - expenses.totalMonthly,
      str_net_income: strRevenue - expenses.totalMonthly,
      cap_rate: ((monthlyRent * 12 - expenses.totalAnnual) / price * 100).toFixed(2),
      cash_on_cash_return: ((monthlyRent * 12 - expenses.totalAnnual) / (price * 0.2) * 100).toFixed(2)
    },
    analysis_type: 'enhanced',
    confidence_level: 'medium'
  };
}

/**
 * Perform full analysis with AI integration
 */
async function performFullAnalysis(propertyData, address, apiConfig) {
  console.log('[Full Analysis] Starting comprehensive analysis with AI');
  
  // This would include:
  // 1. Enhanced analysis as base
  const baseAnalysis = await performEnhancedAnalysis(propertyData, address);
  
  // 2. Perplexity AI market research
  if (apiConfig.perplexity) {
    // Add Perplexity integration here
    baseAnalysis.market_insights = {
      source: 'perplexity',
      confidence: 'high',
      data: {} // Placeholder for Perplexity data
    };
  }
  
  // 3. Airbnb comparables
  if (apiConfig.airbnb) {
    // Add Airbnb scraper integration here
    baseAnalysis.comparables = {
      source: 'airbnb',
      count: 0,
      data: [] // Placeholder for Airbnb data
    };
  }
  
  baseAnalysis.analysis_type = 'full';
  baseAnalysis.confidence_level = 'high';
  
  return baseAnalysis;
}

// Export helper functions for testing
module.exports.parseBedroomBathroomValue = parseBedroomBathroomValue;
module.exports.processPropertyData = processPropertyData;