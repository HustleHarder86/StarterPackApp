// STR (Short-Term Rental) metrics calculation utilities

/**
 * Calculate STR metrics from Airbnb comparables
 * @param {Array} comparables - List of comparable Airbnb listings
 * @param {Object} property - Target property details
 * @returns {Object} Calculated STR metrics
 */
function calculateSTRMetrics(comparables, property) {
  if (!comparables || comparables.length === 0) {
    return {
      avgNightlyRate: 0,
      occupancyRate: 0,
      monthlyRevenue: 0,
      annualRevenue: 0,
      confidence: 'low',
      dataPoints: 0
    };
  }

  // Extract pricing data
  const prices = comparables
    .map(comp => comp.price || comp.nightly_price)
    .filter(price => price && price > 0);

  if (prices.length === 0) {
    return {
      avgNightlyRate: 0,
      occupancyRate: 0,
      monthlyRevenue: 0,
      annualRevenue: 0,
      confidence: 'low',
      dataPoints: 0
    };
  }

  // Calculate average and median nightly rates
  const avgNightlyRate = calculateAverage(prices);
  const medianNightlyRate = calculateMedian(prices);

  // Extract occupancy data (if available)
  const occupancyRates = comparables
    .map(comp => comp.occupancy_rate || comp.occupancy)
    .filter(rate => rate && rate > 0 && rate <= 1);

  // Default occupancy rates by property type if no data available
  const defaultOccupancy = {
    'Single Family': 0.70,
    'Condo': 0.75,
    'Townhouse': 0.72,
    'Apartment': 0.75,
    'House': 0.70
  };

  const occupancyRate = occupancyRates.length > 0
    ? calculateAverage(occupancyRates)
    : defaultOccupancy[property.propertyType] || 0.70;

  // Calculate revenue projections
  const avgDaysPerMonth = 30.4; // Average days in a month
  const monthlyRevenue = avgNightlyRate * avgDaysPerMonth * occupancyRate;
  const annualRevenue = monthlyRevenue * 12;

  // Calculate STR-specific costs
  const strCosts = calculateSTRCosts(annualRevenue);

  // Determine confidence level based on data quality
  const confidence = getConfidenceLevel(comparables.length, prices.length);

  return {
    avgNightlyRate: Math.round(avgNightlyRate),
    medianNightlyRate: Math.round(medianNightlyRate),
    occupancyRate: Math.round(occupancyRate * 100) / 100, // Round to 2 decimals
    monthlyRevenue: Math.round(monthlyRevenue),
    annualRevenue: Math.round(annualRevenue),
    costs: strCosts,
    netMonthlyRevenue: Math.round((monthlyRevenue - strCosts.totalMonthly)),
    netAnnualRevenue: Math.round((annualRevenue - strCosts.totalAnnual)),
    confidence,
    dataPoints: comparables.length,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  };
}

/**
 * Calculate average of an array of numbers
 * @param {Array<number>} numbers
 * @returns {number}
 */
function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * Calculate median of an array of numbers
 * @param {Array<number>} numbers
 * @returns {number}
 */
function calculateMedian(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
}

/**
 * Calculate STR-specific operating costs
 * @param {number} annualRevenue - Projected annual revenue
 * @returns {Object} Breakdown of STR costs
 */
function calculateSTRCosts(annualRevenue) {
  // STR-specific cost percentages
  const costRates = {
    management: 0.20,      // 20% property management
    cleaning: 0.10,        // 10% cleaning fees
    supplies: 0.03,        // 3% supplies and consumables
    utilities: 0.05,       // 5% higher utilities
    maintenance: 0.05,     // 5% maintenance and repairs
    insurance: 0.02,       // 2% additional STR insurance
    marketing: 0.02        // 2% listing fees and marketing
  };
  
  // Calculate individual costs
  const costs = {};
  let totalAnnualCosts = 0;
  
  Object.entries(costRates).forEach(([category, rate]) => {
    costs[category] = Math.round(annualRevenue * rate);
    totalAnnualCosts += costs[category];
  });
  
  return {
    breakdown: costs,
    totalAnnual: totalAnnualCosts,
    totalMonthly: Math.round(totalAnnualCosts / 12),
    percentageOfRevenue: Math.round((totalAnnualCosts / annualRevenue) * 100)
  };
}

/**
 * Determine confidence level based on data availability
 * @param {number} totalComparables
 * @param {number} priceDataPoints
 * @returns {string} 'high', 'medium', or 'low'
 */
function getConfidenceLevel(totalComparables, priceDataPoints) {
  if (totalComparables >= 10 && priceDataPoints >= 8) {
    return 'high';
  } else if (totalComparables >= 5 && priceDataPoints >= 4) {
    return 'medium';
  }
  return 'low';
}

/**
 * Filter comparables by similarity to target property
 * @param {Array} comparables - All comparable listings
 * @param {Object} property - Target property
 * @returns {Array} Filtered comparables
 */
function filterComparables(comparables, property) {
  if (!comparables || comparables.length === 0) return [];

  // Score each comparable based on similarity
  const scoredComparables = comparables.map(comp => {
    let score = 0;
    
    // Bedroom similarity (max 40 points)
    if (property.bedrooms && comp.bedrooms) {
      const bedroomDiff = Math.abs(comp.bedrooms - property.bedrooms);
      if (bedroomDiff === 0) score += 40;
      else if (bedroomDiff === 1) score += 20;
      else if (bedroomDiff === 2) score += 10;
    }
    
    // Property type matching (max 30 points)
    if (property.propertyType && comp.property_type) {
      const propType = property.propertyType.toLowerCase();
      const compType = comp.property_type.toLowerCase();
      
      // Exact match
      if (propType === compType) {
        score += 30;
      } 
      // Similar types
      else if (
        (propType.includes('condo') && compType.includes('apartment')) ||
        (propType.includes('apartment') && compType.includes('condo')) ||
        (propType.includes('house') && compType.includes('house')) ||
        (propType.includes('townhouse') && compType.includes('town'))
      ) {
        score += 20;
      }
      // Any residential property
      else if (compType.includes('entire') || compType.includes('private')) {
        score += 10;
      }
    }
    
    // Bathroom similarity (max 20 points)
    if (property.bathrooms && comp.bathrooms) {
      const bathroomDiff = Math.abs(comp.bathrooms - property.bathrooms);
      if (bathroomDiff === 0) score += 20;
      else if (bathroomDiff <= 0.5) score += 15;
      else if (bathroomDiff === 1) score += 10;
    }
    
    // Price reasonability check (max 10 points)
    if (comp.price && comp.price > 50 && comp.price < 1000) {
      score += 10; // Reasonable nightly rate
    }
    
    return { ...comp, similarityScore: score };
  });
  
  // Sort by similarity score and filter out low scores
  const filtered = scoredComparables
    .filter(comp => comp.similarityScore >= 30) // Minimum threshold
    .sort((a, b) => b.similarityScore - a.similarityScore);
  
  // If we have too few results, include some with lower scores
  if (filtered.length < 5 && scoredComparables.length > filtered.length) {
    const additional = scoredComparables
      .filter(comp => comp.similarityScore >= 20 && comp.similarityScore < 30)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5 - filtered.length);
    
    filtered.push(...additional);
  }
  
  return filtered;
}

/**
 * Calculate seasonality adjustments (placeholder for future enhancement)
 * @param {number} baseRate - Base nightly rate
 * @param {string} season - Current season
 * @returns {Object} Seasonal adjustments
 */
function calculateSeasonalAdjustments(baseRate, season = 'average') {
  const seasonalMultipliers = {
    summer: 1.15,  // 15% higher in summer
    winter: 0.85,  // 15% lower in winter
    spring: 1.0,   // Average
    fall: 1.0,     // Average
    average: 1.0   // No adjustment
  };

  const multiplier = seasonalMultipliers[season] || 1.0;
  
  return {
    adjustedRate: Math.round(baseRate * multiplier),
    seasonalMultiplier: multiplier,
    season
  };
}

/**
 * Safely format a number using toLocaleString with null/undefined checks
 * @param {number|undefined|null} value - The number to format
 * @param {number} defaultValue - Default value if the input is null/undefined
 * @returns {string} Formatted number string
 */
function safeToLocaleString(value, defaultValue = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue.toLocaleString();
  }
  return Number(value).toLocaleString();
}

// Export functions for CommonJS
module.exports = {
  calculateSTRMetrics,
  filterComparables,
  calculateSeasonalAdjustments,
  safeToLocaleString
};