const express = require('express');
const { PerplexityService } = require('../services/perplexityService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Fetch real-time property appreciation data using Perplexity AI
 */
router.post('/real-time', verifyToken, async (req, res) => {
  try {
    const { address, propertyType, city, province } = req.body;
    
    if (!address || !city) {
      return res.status(400).json({ 
        error: 'Address and city are required' 
      });
    }
    
    // Construct a detailed query for Perplexity
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    const query = `
      Search for the most recent property appreciation data for ${city}, ${province || 'Canada'}.
      
      Specifically find:
      1. Current year-over-year home price change percentage for ${propertyType || 'all property types'}
      2. Average appreciation rate over the last 5 years
      3. Month-over-month trend (increasing, decreasing, or stable)
      4. How this compares to the Canadian national average
      
      Search these sources:
      - CREA (Canadian Real Estate Association) statistics for ${currentMonth} ${currentYear}
      - realtor.ca market reports
      - housesigma.com market data for ${city}
      - zolo.ca housing market trends
      - Local real estate board reports (TREB, REBGV, etc.)
      
      Provide specific percentages and cite the source and date of the data.
    `;
    
    const perplexityService = new PerplexityService();
    const response = await perplexityService.search(query);
    
    // Parse the response to extract appreciation data
    const appreciationData = parseAppreciationResponse(response, city, propertyType);
    
    // Log for debugging
    console.log(`Appreciation data for ${city}:`, appreciationData);
    
    res.json({
      success: true,
      data: appreciationData,
      query: query,
      rawResponse: response
    });
    
  } catch (error) {
    console.error('Appreciation data fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch appreciation data',
      message: error.message 
    });
  }
});

/**
 * Parse Perplexity response to extract structured appreciation data
 */
function parseAppreciationResponse(response, city, propertyType) {
  const text = response.toLowerCase();
  
  // Initialize default values
  let appreciationData = {
    city: city,
    propertyType: propertyType || 'All Types',
    currentYearOverYear: null,
    fiveYearAverage: null,
    trend: 'stable',
    nationalComparison: null,
    dataSource: 'Perplexity AI aggregated data',
    lastUpdated: new Date().toISOString(),
    confidence: 'low'
  };
  
  // Extract year-over-year percentage
  const yoyPatterns = [
    /(\d+\.?\d*)\s*%\s*year[\s-]over[\s-]year/i,
    /year[\s-]over[\s-]year[:\s]+(\d+\.?\d*)\s*%/i,
    /annual[\s]+appreciation[:\s]+(\d+\.?\d*)\s*%/i,
    /prices?\s+(?:up|increased?|rose)\s+(\d+\.?\d*)\s*%/i,
    /(\d+\.?\d*)\s*%\s+annual/i
  ];
  
  for (const pattern of yoyPatterns) {
    const match = response.match(pattern);
    if (match) {
      appreciationData.currentYearOverYear = parseFloat(match[1]);
      appreciationData.confidence = 'medium';
      break;
    }
  }
  
  // Check for negative appreciation
  const negativePatterns = [
    /prices?\s+(?:down|decreased?|fell)\s+(\d+\.?\d*)\s*%/i,
    /declined?\s+(\d+\.?\d*)\s*%/i,
    /-(\d+\.?\d*)\s*%\s*year/i
  ];
  
  for (const pattern of negativePatterns) {
    const match = response.match(pattern);
    if (match && !appreciationData.currentYearOverYear) {
      appreciationData.currentYearOverYear = -parseFloat(match[1]);
      appreciationData.confidence = 'medium';
      break;
    }
  }
  
  // Extract 5-year average
  const fiveYearPatterns = [
    /5[\s-]year\s+average[:\s]+(\d+\.?\d*)\s*%/i,
    /five[\s-]year\s+average[:\s]+(\d+\.?\d*)\s*%/i,
    /(\d+\.?\d*)\s*%\s+(?:over\s+)?(?:the\s+)?(?:last|past)\s+5\s+years/i
  ];
  
  for (const pattern of fiveYearPatterns) {
    const match = response.match(pattern);
    if (match) {
      appreciationData.fiveYearAverage = parseFloat(match[1]);
      appreciationData.confidence = 'high';
      break;
    }
  }
  
  // Determine trend
  if (text.includes('rising') || text.includes('increasing') || text.includes('up')) {
    appreciationData.trend = 'rising';
  } else if (text.includes('falling') || text.includes('decreasing') || text.includes('down')) {
    appreciationData.trend = 'falling';
  }
  
  // Extract data source mentions
  if (text.includes('crea') || text.includes('canadian real estate association')) {
    appreciationData.dataSource = 'CREA Statistics';
    appreciationData.confidence = 'high';
  } else if (text.includes('realtor.ca')) {
    appreciationData.dataSource = 'Realtor.ca Market Reports';
  } else if (text.includes('housesigma')) {
    appreciationData.dataSource = 'HouseSigma Market Data';
  }
  
  // If no specific data found, provide estimates based on city
  if (!appreciationData.currentYearOverYear) {
    appreciationData.currentYearOverYear = getCityFallbackRate(city);
    appreciationData.confidence = 'low';
    appreciationData.dataSource = 'Estimated based on historical data';
  }
  
  return appreciationData;
}

/**
 * Fallback rates based on city if Perplexity doesn't return specific data
 */
function getCityFallbackRate(city) {
  const fallbackRates = {
    'Toronto': 5.5,
    'Vancouver': 6.0,
    'Montreal': 4.0,
    'Calgary': 3.5,
    'Ottawa': 4.5,
    'Edmonton': 3.3,
    'Mississauga': 5.8,
    'Hamilton': 6.5,
    'Winnipeg': 3.6,
    'Halifax': 4.8
  };
  
  return fallbackRates[city] || 4.0; // Canadian average
}

module.exports = router;