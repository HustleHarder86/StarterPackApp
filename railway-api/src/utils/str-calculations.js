/**
 * STR-specific calculation utilities
 */

/**
 * Filter and rank comparable properties based on similarity
 * @param {Array} listings - Raw Airbnb listings
 * @param {Object} targetProperty - Target property to compare against
 * @returns {Array} Filtered and ranked comparables
 */
function filterComparables(listings, targetProperty) {
  if (!listings || listings.length === 0) return [];
  
  const targetBedrooms = targetProperty.bedrooms || 2;
  const targetBathrooms = targetProperty.bathrooms || 1;
  const targetType = targetProperty.propertyType || 'House';
  
  // Score and filter listings
  const scoredListings = listings
    .map(listing => {
      let score = 0;
      
      // Bedroom similarity (40% weight)
      const bedroomDiff = Math.abs((listing.bedrooms || 0) - targetBedrooms);
      if (bedroomDiff === 0) score += 40;
      else if (bedroomDiff === 1) score += 20;
      else if (bedroomDiff === 2) score += 10;
      
      // Bathroom similarity (20% weight)
      const bathroomDiff = Math.abs((listing.bathrooms || 0) - targetBathrooms);
      if (bathroomDiff === 0) score += 20;
      else if (bathroomDiff <= 0.5) score += 15;
      else if (bathroomDiff <= 1) score += 10;
      
      // Property type match (20% weight)
      if (listing.propertyType && targetType) {
        const listingType = listing.propertyType.toLowerCase();
        const targetTypeLower = targetType.toLowerCase();
        
        if (listingType.includes(targetTypeLower) || targetTypeLower.includes(listingType)) {
          score += 20;
        } else if (
          (listingType.includes('apartment') && targetTypeLower.includes('condo')) ||
          (listingType.includes('condo') && targetTypeLower.includes('apartment'))
        ) {
          score += 15;
        }
      }
      
      // Rating bonus (10% weight)
      if (listing.rating >= 4.8) score += 10;
      else if (listing.rating >= 4.5) score += 7;
      else if (listing.rating >= 4.0) score += 5;
      
      // Review count bonus (10% weight)
      if (listing.reviewsCount >= 50) score += 10;
      else if (listing.reviewsCount >= 20) score += 7;
      else if (listing.reviewsCount >= 10) score += 5;
      
      return {
        ...listing,
        similarityScore: score
      };
    })
    .filter(listing => listing.similarityScore >= 30) // Minimum 30% match
    .sort((a, b) => b.similarityScore - a.similarityScore);
  
  // Return top matches (max 20)
  return scoredListings.slice(0, 20);
}

/**
 * Calculate average metrics from comparables
 * @param {Array} comparables - Filtered comparable listings
 * @returns {Object} Average metrics
 */
function calculateAverageMetrics(comparables) {
  if (!comparables || comparables.length === 0) {
    return {
      avgNightlyRate: 0,
      avgOccupancy: 0.70,
      priceRange: { min: 0, max: 0 },
      dataPoints: 0
    };
  }
  
  const prices = comparables
    .map(c => c.price || c.nightly_price)
    .filter(p => p > 0);
  
  const avgNightlyRate = Math.round(
    prices.reduce((sum, price) => sum + price, 0) / prices.length
  );
  
  const avgOccupancy = comparables.reduce((sum, c) => {
    return sum + (c.occupancy_rate || c.occupancy || 0.70);
  }, 0) / comparables.length;
  
  return {
    avgNightlyRate,
    avgOccupancy,
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    dataPoints: prices.length
  };
}

/**
 * Calculate STR metrics from comparables
 * @param {Array} comparables - Airbnb comparable properties
 * @param {Object} options - Additional options
 * @returns {Object} STR metrics
 */
function calculateSTRMetrics(comparables, options = {}) {
  const metrics = calculateAverageMetrics(comparables);
  
  const monthlyRevenue = Math.round(
    metrics.avgNightlyRate * 30.4 * metrics.avgOccupancy
  );
  
  const annualRevenue = monthlyRevenue * 12;
  
  // Estimate expenses (45% of revenue for STR)
  const monthlyExpenses = Math.round(monthlyRevenue * 0.45);
  const annualExpenses = monthlyExpenses * 12;
  
  return {
    avgNightlyRate: metrics.avgNightlyRate,
    occupancyRate: metrics.avgOccupancy,
    monthlyRevenue,
    annualRevenue,
    monthlyExpenses,
    annualExpenses,
    netMonthlyIncome: monthlyRevenue - monthlyExpenses,
    netAnnualIncome: annualRevenue - annualExpenses,
    priceRange: metrics.priceRange,
    dataPoints: metrics.dataPoints,
    confidence: metrics.dataPoints >= 10 ? 'high' : 
                metrics.dataPoints >= 5 ? 'medium' : 'low'
  };
}

module.exports = {
  filterComparables,
  calculateAverageMetrics,
  calculateSTRMetrics
};