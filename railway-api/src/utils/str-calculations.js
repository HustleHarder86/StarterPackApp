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
  
  console.log(`Filtering ${listings.length} listings with price and property type quality checks`);
  
  // Apply practical filtering based on available API data
  const filteredListings = listings.filter(listing => {
    // Price sanity check
    const price = listing.price || listing.nightly_rate || 0;
    if (price < 50 || price > 2000) {
      console.log(`Filtered out: "${listing.title}" - unrealistic price ($${price})`);
      return false;
    }
    
    return true;
  });
  
  // Add basic similarity scores for display and ranking
  const scoredListings = filteredListings.map(listing => {
    let score = 50; // Base score
    
    // Boost score for better property types
    const propertyType = (listing.propertyType || listing.property_type || '').toLowerCase();
    if (propertyType.includes('entire_home') || propertyType.includes('house')) {
      score += 20; // Better for house analysis
    } else if (propertyType.includes('apartment') || propertyType.includes('condo')) {
      score += 10; // Decent for house analysis
    } else if (propertyType.includes('private_room') || propertyType.includes('shared_room')) {
      score -= 20; // Poor comparables for house analysis
    }
    
    // Boost score for better ratings
    if (listing.rating >= 4.5) score += 10;
    else if (listing.rating >= 4.0) score += 5;
    
    return {
      ...listing,
      similarityScore: Math.max(10, score) // Minimum score of 10
    };
  })
  .sort((a, b) => b.similarityScore - a.similarityScore);
  
  console.log(`Filtered from ${listings.length} to ${scoredListings.length} listings with quality checks`);
  return scoredListings;
  
  /*
  // COMMENTED OUT - Original similarity scoring logic (restore later)
  const targetBedrooms = targetProperty.bedrooms || 2;
  const targetBathrooms = targetProperty.bathrooms || 1;
  const targetType = targetProperty.propertyType || 'House';
  const targetCity = targetProperty.address?.city?.toLowerCase().trim();
  
  // Score and filter listings
  const scoredListings = listings
    .map(listing => {
      let score = 0;
      
      // City filtering - only include same city listings
      const listingCity = extractCityFromListing(listing);
      if (targetCity && listingCity && targetCity !== listingCity) {
        return null; // Exclude listings from different cities
      }
      
      // Bedroom similarity (40% weight)
      const bedroomDiff = Math.abs((listing.bedrooms || 0) - targetBedrooms);
      if (bedroomDiff === 0) score += 40;
      else if (bedroomDiff === 1) score += 30;  // More points for ±1 bedroom
      else if (bedroomDiff === 2) score += 20;  // More points for ±2 bedrooms
      else if (bedroomDiff === 3) score += 10;  // Still some points for ±3 bedrooms
      
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
      
      // Rating bonus (10% weight) - all listings get some points
      if (listing.rating >= 4.8) score += 10;
      else if (listing.rating >= 4.5) score += 8;
      else if (listing.rating >= 4.0) score += 6;
      else score += 5; // Even low-rated or unrated listings get points
      
      // Review count bonus (10% weight) - all listings get some points
      if (listing.reviewsCount >= 50) score += 10;
      else if (listing.reviewsCount >= 20) score += 8;
      else if (listing.reviewsCount >= 10) score += 6;
      else if (listing.reviewsCount >= 5) score += 5;
      else score += 4; // Even new listings with few reviews get points
      
      return {
        ...listing,
        similarityScore: score
      };
    })
    .filter(listing => listing !== null && listing.similarityScore >= 10) // Minimum 10% match - more inclusive
    .sort((a, b) => b.similarityScore - a.similarityScore);
  
  // Return top matches (max 20)
  return scoredListings.slice(0, 20);
  */
}

/**
 * Extract city from listing data
 * @param {Object} listing - Airbnb listing
 * @returns {string} City name in lowercase
 */
function extractCityFromListing(listing) {
  // Try to extract city from various possible fields
  let city = null;
  
  // Check title/name for city patterns
  if (listing.title || listing.name) {
    const text = (listing.title || listing.name).toLowerCase();
    // Common city patterns in Airbnb titles
    const cityMatch = text.match(/(?:in|near|downtown|)\s*([a-z\s]+?)(?:\s*,|\s*-|\s*\||\s*$)/i);
    if (cityMatch) {
      city = cityMatch[1];
    }
  }
  
  // Check location object
  if (listing.location?.city) {
    city = listing.location.city;
  }
  
  // Check address
  if (listing.address?.city) {
    city = listing.address.city;
  }
  
  // Clean up city name
  if (city) {
    return city.toLowerCase().trim()
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\w\s]/g, ''); // Remove special characters
  }
  
  return null;
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