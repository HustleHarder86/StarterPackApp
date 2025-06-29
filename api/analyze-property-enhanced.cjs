// CommonJS version of analyze-property-enhanced for testing
const { calculateAccurateExpenses, getPropertyTaxRate, estimateRentalRate, calculateInsurance } = require('./property-calculations.js');

// Mock the imports for testing
let db, Timer, logger, getFromCache, setInCache, cacheKeys, monitorAPICall;

if (process.env.NODE_ENV === 'test') {
  // Use mocks in test environment
  db = require('../utils/firebase-admin.js').db;
  Timer = jest.fn(() => ({ end: jest.fn() }));
  logger = { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() };
  getFromCache = jest.fn(() => Promise.resolve(null));
  setInCache = jest.fn(() => Promise.resolve());
  cacheKeys = { propertyAnalysis: jest.fn((id, str) => `test-key-${id}-${str}`) };
  monitorAPICall = jest.fn((name, fn) => fn());
} else {
  // Use real modules in production
  const { db: firebaseDb } = require('../utils/firebase-admin.js');
  const { Timer: PerfTimer, monitorAPICall: perfMonitor } = require('../utils/performance-monitor.js');
  const { loggers } = require('../utils/logger.js');
  const cache = require('../utils/cache-manager.js');
  
  db = firebaseDb;
  Timer = PerfTimer;
  logger = loggers.api.child('analyze-property');
  getFromCache = cache.getFromCache;
  setInCache = cache.setInCache;
  cacheKeys = cache.cacheKeys;
  monitorAPICall = perfMonitor;
}

async function handler(req, res) {
  const requestTimer = new Timer('api.analyze-property', {
    method: req.method,
    path: req.url
  });

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
      propertyId,
      userEmail, 
      userName, 
      requestType,
      includeSTR = false
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

    logger.info('Starting enhanced property analysis', {
      propertyAddress,
      includeSTR,
      userId,
      propertyId
    });

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

    // Mock successful response for testing
    const mockAnalysis = {
      id: `analysis_${Date.now()}`,
      propertyDetails: {
        address: propertyAddress,
        estimatedValue: 850000,
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800
      },
      costs: {
        mortgage_monthly: 3200,
        property_tax_annual: 8500,
        insurance_annual: 1200
      },
      longTermRental: {
        monthlyRent: 3500,
        rentRange: { low: 3200, high: 3800 },
        comparables: [],
        vacancyRate: 5,
        annualRevenue: 39900,
        cashFlow: 450,
        capRate: 4.2,
        dataSource: 'estimated'
      }
    };

    if (includeSTR) {
      mockAnalysis.strAnalysis = {
        avgNightlyRate: 185,
        occupancyRate: 68,
        comparables: [],
        annualRevenue: 45900,
        dataSource: 'estimated'
      };
      
      mockAnalysis.comparison = {
        monthlyIncomeDiff: 500,
        annualIncomeDiff: 6000,
        betterStrategy: 'str',
        breakEvenOccupancy: 56
      };
    }

    requestTimer.end({ success: true, cached: false });
    
    return res.status(200).json({
      success: true,
      analysisId: mockAnalysis.id,
      analysis: mockAnalysis
    });

  } catch (error) {
    requestTimer.end({ success: false, error: error.name });
    logger.error('Analysis failed', { 
      error,
      propertyAddress: req.body.propertyAddress,
      userId: req.body.userId
    });
    
    return res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
}

module.exports = handler;