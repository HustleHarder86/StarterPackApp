const logger = require('./logger.service');

class STRCalculatorService {
  constructor() {
    // Occupancy rate scenarios
    this.occupancyScenarios = {
      conservative: 0.60,  // 219 nights/year
      moderate: 0.70,      // 255 nights/year
      optimistic: 0.80     // 292 nights/year
    };

    // STR expense ratios
    this.expenseRatios = {
      cleaning: 150,         // Per turnover
      supplies: 0.05,        // 5% of revenue
      utilities: 300,        // Monthly average
      insurance: 200,        // Monthly STR premium
      management: 0.25       // 25% if professionally managed
    };
  }

  /**
   * Calculate average nightly rate from comparable listings
   * @param {Array} listings - Array of Airbnb listings
   * @returns {Object} Rate statistics
   */
  calculateAverageRate(listings) {
    if (!listings || listings.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0
      };
    }

    const prices = listings.map(l => l.price || l.nightly_price).filter(p => p > 0);
    
    if (prices.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0
      };
    }

    // Sort for median calculation
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      median: Math.round(median),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
      standardDeviation: this.calculateStandardDeviation(prices)
    };
  }

  /**
   * Calculate standard deviation for price variance
   */
  calculateStandardDeviation(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(Math.sqrt(avgSquareDiff));
  }

  /**
   * Filter for quality comparable listings
   * @param {Array} listings - All listings
   * @param {Object} property - Target property details
   * @returns {Array} Filtered quality comparables
   */
  filterQualityComparables(listings, property) {
    return listings.filter(listing => {
      // Must have a price
      if (!listing.price || listing.price <= 0) return false;
      
      // Exact bedroom match only
      if (listing.bedrooms !== property.bedrooms) return false;
      
      // No rating filter - include all listings regardless of rating
      // This gives a more realistic view of the market
      
      return true;
    });
  }

  /**
   * Estimate occupancy rate based on market data
   * @param {Array} listings - Comparable listings
   * @param {string} scenario - 'conservative', 'moderate', or 'optimistic'
   * @returns {number} Occupancy rate (0-1)
   */
  estimateOccupancy(listings, scenario = 'moderate') {
    // Base occupancy on scenario
    let occupancy = this.occupancyScenarios[scenario] || this.occupancyScenarios.moderate;
    
    // Adjust based on market signals if available
    if (listings && listings.length > 0) {
      // Higher average rating = slightly higher occupancy
      const avgRating = listings.reduce((sum, l) => sum + (l.rating || 4.5), 0) / listings.length;
      if (avgRating > 4.7) {
        occupancy += 0.05; // 5% boost for high-rated market
      }
      
      // Many listings with high review counts = active market
      const highReviewListings = listings.filter(l => l.reviewsCount > 50).length;
      if (highReviewListings > listings.length * 0.5) {
        occupancy += 0.03; // 3% boost for active market
      }
    }
    
    // Cap at reasonable maximum
    return Math.min(occupancy, 0.85);
  }

  /**
   * Project revenue for different scenarios
   * @param {number} avgNightlyRate - Average nightly rate
   * @param {Object} property - Property details
   * @returns {Object} Revenue projections
   */
  projectRevenue(avgNightlyRate, property = {}) {
    const projections = {};
    
    for (const [scenario, baseOccupancy] of Object.entries(this.occupancyScenarios)) {
      const occupancy = baseOccupancy;
      const nightsBooked = Math.round(365 * occupancy);
      
      projections[scenario] = {
        occupancy,
        nightsBooked,
        monthlyRevenue: Math.round(avgNightlyRate * 30 * occupancy),
        annualRevenue: Math.round(avgNightlyRate * nightsBooked),
        avgNightlyRate
      };
    }
    
    return projections;
  }

  /**
   * Calculate STR-specific expenses
   * @param {number} annualRevenue - Projected annual revenue
   * @param {Object} property - Property details
   * @param {Object} options - Expense options (e.g., professional management)
   * @returns {Object} Itemized expenses
   */
  calculateExpenses(annualRevenue, property = {}, options = {}) {
    const { professionalManagement = false } = options;
    
    // Estimate turnovers based on average 3-night stays and occupancy
    // If 70% occupied with 3-night average stays = ~85 turnovers per year
    const occupancyRate = 0.70; // Moderate scenario
    const avgStayLength = 3;
    const estimatedTurnovers = Math.round((365 * occupancyRate) / avgStayLength);
    
    const expenses = {
      // Cleaning: $150 per turnover
      cleaning: estimatedTurnovers * this.expenseRatios.cleaning,
      
      // Supplies: 5% of revenue (toiletries, linens, etc.)
      supplies: Math.round(annualRevenue * this.expenseRatios.supplies),
      
      // Utilities: $300/month (higher than LTR)
      utilities: this.expenseRatios.utilities * 12,
      
      // STR Insurance: $200/month
      insurance: this.expenseRatios.insurance * 12,
      
      // Maintenance: Higher than LTR due to wear
      maintenance: Math.round(annualRevenue * 0.03), // 3% of revenue
      
      // Platform fees (Airbnb/VRBO)
      platformFees: Math.round(annualRevenue * 0.03), // 3% host fee
    };
    
    // Add management fee if applicable
    if (professionalManagement) {
      expenses.management = Math.round(annualRevenue * this.expenseRatios.management);
    }
    
    // Calculate total
    expenses.total = Object.values(expenses).reduce((sum, expense) => sum + expense, 0);
    
    return expenses;
  }

  /**
   * Generate comprehensive STR analysis
   * @param {Object} airbnbData - Results from Airbnb scraper
   * @param {Object} property - Property details
   * @param {Object} options - Analysis options
   * @returns {Object} Complete STR analysis
   */
  analyzeSTRPotential(airbnbData, property, options = {}) {
    const { listings = [], metadata = {} } = airbnbData;
    
    // Filter for quality comparables
    const qualityListings = this.filterQualityComparables(listings, property);
    
    // Calculate rate statistics
    const rateStats = this.calculateAverageRate(qualityListings);
    
    // Use median if high variance, otherwise average
    const useMedian = rateStats.standardDeviation > rateStats.average * 0.3;
    const nightlyRate = useMedian ? rateStats.median : rateStats.average;
    
    logger.info('STR rate analysis', {
      totalListings: listings.length,
      qualityListings: qualityListings.length,
      avgRate: rateStats.average,
      medianRate: rateStats.median,
      useMedian,
      selectedRate: nightlyRate
    });
    
    // Project revenue for all scenarios
    const projections = this.projectRevenue(nightlyRate, property);
    
    // Calculate expenses for moderate scenario
    const expenses = this.calculateExpenses(
      projections.moderate.annualRevenue,
      property,
      options
    );
    
    // Calculate net income for each scenario
    const netIncome = {};
    for (const [scenario, projection] of Object.entries(projections)) {
      // Recalculate expenses for each revenue level
      const scenarioExpenses = this.calculateExpenses(
        projection.annualRevenue,
        property,
        options
      );
      netIncome[scenario] = projection.annualRevenue - scenarioExpenses.total;
    }
    
    return {
      comparables: {
        total: listings.length,
        quality: qualityListings.length,
        listings: qualityListings.slice(0, 10), // Top 10 for display
        location: metadata.location
      },
      rates: {
        ...rateStats,
        selected: nightlyRate,
        methodology: useMedian ? 'median' : 'average'
      },
      projections,
      expenses,
      netIncome,
      analysis: {
        dataQuality: this.assessDataQuality(qualityListings.length, rateStats),
        marketActivity: this.assessMarketActivity(qualityListings),
        recommendedScenario: 'moderate'
      }
    };
  }

  /**
   * Assess data quality for confidence level
   */
  assessDataQuality(listingCount, rateStats) {
    if (listingCount < 5) return 'low';
    if (listingCount < 10) return 'moderate';
    
    // Check price variance
    const coefficientOfVariation = rateStats.standardDeviation / rateStats.average;
    if (coefficientOfVariation > 0.5) return 'moderate'; // High variance
    
    return 'high';
  }

  /**
   * Assess market activity level
   */
  assessMarketActivity(listings) {
    const avgReviews = listings.reduce((sum, l) => sum + (l.reviewsCount || 0), 0) / listings.length;
    const highRatedCount = listings.filter(l => l.rating >= 4.5).length;
    
    if (avgReviews > 100 && highRatedCount > listings.length * 0.7) {
      return 'very active';
    } else if (avgReviews > 50) {
      return 'active';
    } else if (avgReviews > 20) {
      return 'moderate';
    }
    return 'developing';
  }
}

// Export singleton instance
module.exports = {
  strCalculator: new STRCalculatorService()
};