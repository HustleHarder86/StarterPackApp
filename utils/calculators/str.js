// Enhanced STR (Short-Term Rental) Calculator with comprehensive metrics
const { calculateSTRMetrics, filterComparables, calculateSeasonalAdjustments, safeToLocaleString } = require('../str-calculations');

/**
 * Main STR analysis function that orchestrates all calculations
 * @param {Object} property - Property details from listing
 * @param {Array} comparables - Airbnb comparable properties
 * @param {Object} marketData - Additional market insights
 * @returns {Object} Comprehensive STR analysis
 */
function analyzeSTRPotential(property, comparables, marketData = {}) {
  // Filter and rank comparables by similarity
  const filteredComparables = filterComparables(comparables, property);
  
  // Calculate base STR metrics
  const baseMetrics = calculateSTRMetrics(filteredComparables, property);
  
  // Calculate seasonal projections
  const seasonalAnalysis = calculateSeasonalProjections(baseMetrics.avgNightlyRate, baseMetrics.occupancyRate);
  
  // Calculate operating expenses
  const operatingExpenses = calculateDetailedSTRExpenses(baseMetrics.annualRevenue, property);
  
  // Calculate financial metrics
  const financialMetrics = calculateFinancialMetrics(
    baseMetrics,
    operatingExpenses,
    property.price || property.listingPrice
  );
  
  // Generate revenue scenarios
  const scenarios = generateRevenueScenarios(baseMetrics, property);
  
  // Compare with long-term rental potential
  const comparison = compareLTRvsSTR(property, baseMetrics, marketData.ltrRent || 0);
  
  return {
    // Base metrics
    avgNightlyRate: baseMetrics.avgNightlyRate,
    occupancyRate: baseMetrics.occupancyRate,
    monthlyRevenue: baseMetrics.monthlyRevenue,
    annualRevenue: baseMetrics.annualRevenue,
    
    // Financial analysis
    expenses: operatingExpenses,
    netMonthlyIncome: baseMetrics.monthlyRevenue - operatingExpenses.monthly.total,
    netAnnualIncome: baseMetrics.annualRevenue - operatingExpenses.annual.total,
    
    // Investment metrics
    capRate: financialMetrics.capRate,
    cashOnCashReturn: financialMetrics.cashOnCashReturn,
    paybackPeriod: financialMetrics.paybackPeriod,
    
    // Market analysis
    comparables: filteredComparables.slice(0, 5), // Top 5 most similar
    confidence: baseMetrics.confidence,
    dataPoints: baseMetrics.dataPoints,
    priceRange: baseMetrics.priceRange,
    
    // Seasonal data
    seasonalData: seasonalAnalysis,
    
    // Revenue scenarios
    scenarios: scenarios,
    
    // LTR vs STR comparison
    comparison: comparison,
    
    // Recommendations
    recommendations: generateRecommendations(baseMetrics, comparison, property)
  };
}

/**
 * Calculate detailed STR operating expenses
 * @param {number} annualRevenue - Projected annual revenue
 * @param {Object} property - Property details
 * @returns {Object} Detailed expense breakdown
 */
function calculateDetailedSTRExpenses(annualRevenue, property) {
  // Base operating costs as percentage of revenue
  const revenueBased = {
    management: annualRevenue * 0.20,      // 20% for professional management
    cleaning: annualRevenue * 0.10,        // 10% for cleaning between guests
    supplies: annualRevenue * 0.03,        // 3% for consumables
    platformFees: annualRevenue * 0.03,    // 3% Airbnb service fees
    marketing: annualRevenue * 0.02        // 2% for additional marketing
  };
  
  // Fixed costs (not revenue-based)
  const fixed = {
    utilities: calculateUtilities(property), // Higher for STR
    insurance: calculateSTRInsurance(property),
    maintenance: calculateMaintenance(property),
    internet: 100 * 12, // High-speed internet required
    cable: 50 * 12,     // Basic cable/streaming
    licenses: 500       // Annual STR license/permits
  };
  
  // Property-specific costs
  const propertySpecific = {
    propertyTax: property.propertyTaxes || (property.price * 0.01), // 1% if not provided
    hoaFees: (property.condoFees || property.hoaFees || 0) * 12,
    mortgage: 0 // To be calculated separately if financing
  };
  
  // Calculate totals
  const totalRevenueBased = Object.values(revenueBased).reduce((sum, cost) => sum + cost, 0);
  const totalFixed = Object.values(fixed).reduce((sum, cost) => sum + cost, 0);
  const totalPropertySpecific = Object.values(propertySpecific).reduce((sum, cost) => sum + cost, 0);
  const totalAnnual = totalRevenueBased + totalFixed + totalPropertySpecific;
  
  return {
    annual: {
      revenueBased: revenueBased,
      fixed: fixed,
      propertySpecific: propertySpecific,
      total: Math.round(totalAnnual)
    },
    monthly: {
      revenueBased: Object.fromEntries(
        Object.entries(revenueBased).map(([k, v]) => [k, Math.round(v / 12)])
      ),
      fixed: Object.fromEntries(
        Object.entries(fixed).map(([k, v]) => [k, Math.round(v / 12)])
      ),
      propertySpecific: Object.fromEntries(
        Object.entries(propertySpecific).map(([k, v]) => [k, Math.round(v / 12)])
      ),
      total: Math.round(totalAnnual / 12)
    },
    percentageOfRevenue: Math.round((totalAnnual / annualRevenue) * 100)
  };
}

/**
 * Calculate utilities for STR (typically higher than LTR)
 * @param {Object} property
 * @returns {number} Annual utility cost
 */
function calculateUtilities(property) {
  const baseCost = 200; // Base monthly utility cost
  const bedroomMultiplier = 1 + (property.bedrooms - 1) * 0.2; // 20% per additional bedroom
  const strPremium = 1.5; // STRs use 50% more utilities on average
  
  return baseCost * bedroomMultiplier * strPremium * 12;
}

/**
 * Calculate STR-specific insurance costs
 * @param {Object} property
 * @returns {number} Annual insurance cost
 */
function calculateSTRInsurance(property) {
  const baseHomeownersInsurance = property.price * 0.005; // 0.5% of property value
  const strLiabilityPremium = 1000; // Additional liability coverage
  const contentsCoverage = 500; // Additional contents coverage
  
  return baseHomeownersInsurance + strLiabilityPremium + contentsCoverage;
}

/**
 * Calculate maintenance costs for STR
 * @param {Object} property
 * @returns {number} Annual maintenance cost
 */
function calculateMaintenance(property) {
  const baseRate = property.price * 0.01; // 1% of property value
  const strMultiplier = 1.5; // 50% higher maintenance for STR
  
  return baseRate * strMultiplier;
}

/**
 * Calculate seasonal revenue projections
 * @param {number} avgNightlyRate - Average nightly rate
 * @param {number} avgOccupancy - Average occupancy rate
 * @returns {Object} Seasonal projections
 */
function calculateSeasonalProjections(avgNightlyRate, avgOccupancy) {
  const seasons = {
    spring: { rateMultiplier: 0.95, occupancyMultiplier: 0.90 },
    summer: { rateMultiplier: 1.15, occupancyMultiplier: 1.10 },
    fall: { rateMultiplier: 1.00, occupancyMultiplier: 0.95 },
    winter: { rateMultiplier: 0.90, occupancyMultiplier: 0.85 }
  };
  
  const projections = {};
  
  Object.entries(seasons).forEach(([season, multipliers]) => {
    const seasonalRate = Math.round(avgNightlyRate * multipliers.rateMultiplier);
    const seasonalOccupancy = Math.min(avgOccupancy * multipliers.occupancyMultiplier, 0.95);
    const daysInSeason = 91; // Approximately 3 months
    
    projections[season] = {
      avgRate: seasonalRate,
      occupancy: seasonalOccupancy,
      revenue: Math.round(seasonalRate * daysInSeason * seasonalOccupancy),
      bookings: Math.round(daysInSeason * seasonalOccupancy)
    };
  });
  
  return projections;
}

/**
 * Calculate key financial metrics
 * @param {Object} baseMetrics - Base STR metrics
 * @param {Object} expenses - Operating expenses
 * @param {number} propertyPrice - Property purchase price
 * @returns {Object} Financial metrics
 */
function calculateFinancialMetrics(baseMetrics, expenses, propertyPrice) {
  const netOperatingIncome = baseMetrics.annualRevenue - expenses.annual.total;
  
  // Cap Rate = NOI / Property Price
  const capRate = propertyPrice > 0 ? (netOperatingIncome / propertyPrice) * 100 : 0;
  
  // Cash on Cash Return (assuming 20% down payment)
  const downPayment = propertyPrice * 0.20;
  const cashOnCashReturn = downPayment > 0 ? (netOperatingIncome / downPayment) * 100 : 0;
  
  // Payback Period
  const paybackPeriod = netOperatingIncome > 0 ? propertyPrice / netOperatingIncome : 999;
  
  return {
    capRate: Math.round(capRate * 10) / 10, // Round to 1 decimal
    cashOnCashReturn: Math.round(cashOnCashReturn * 10) / 10,
    paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    netOperatingIncome: Math.round(netOperatingIncome)
  };
}

/**
 * Generate revenue scenarios (conservative, realistic, optimistic)
 * @param {Object} baseMetrics - Base STR metrics
 * @param {Object} property - Property details
 * @returns {Object} Revenue scenarios
 */
function generateRevenueScenarios(baseMetrics, property) {
  return {
    conservative: {
      occupancyRate: Math.max(baseMetrics.occupancyRate - 0.15, 0.40), // 15% lower, min 40%
      nightlyRate: Math.round(baseMetrics.avgNightlyRate * 0.85), // 15% lower rate
      monthlyRevenue: calculateMonthlyRevenue(
        baseMetrics.avgNightlyRate * 0.85,
        Math.max(baseMetrics.occupancyRate - 0.15, 0.40)
      )
    },
    realistic: {
      occupancyRate: baseMetrics.occupancyRate,
      nightlyRate: baseMetrics.avgNightlyRate,
      monthlyRevenue: baseMetrics.monthlyRevenue
    },
    optimistic: {
      occupancyRate: Math.min(baseMetrics.occupancyRate + 0.10, 0.90), // 10% higher, max 90%
      nightlyRate: Math.round(baseMetrics.avgNightlyRate * 1.10), // 10% higher rate
      monthlyRevenue: calculateMonthlyRevenue(
        baseMetrics.avgNightlyRate * 1.10,
        Math.min(baseMetrics.occupancyRate + 0.10, 0.90)
      )
    }
  };
}

/**
 * Calculate monthly revenue
 * @param {number} nightlyRate
 * @param {number} occupancyRate
 * @returns {number}
 */
function calculateMonthlyRevenue(nightlyRate, occupancyRate) {
  return Math.round(nightlyRate * 30.4 * occupancyRate);
}

/**
 * Compare LTR vs STR potential
 * @param {Object} property - Property details
 * @param {Object} strMetrics - STR analysis results
 * @param {number} ltrRent - Estimated long-term rental rate
 * @returns {Object} Comparison analysis
 */
function compareLTRvsSTR(property, strMetrics, ltrRent) {
  const strMonthlyNet = strMetrics.netMonthlyRevenue || strMetrics.monthlyRevenue * 0.55; // Assume 45% expenses if not calculated
  const ltrMonthlyNet = ltrRent * 0.75; // Assume 25% expenses for LTR
  
  const monthlyDifference = strMonthlyNet - ltrMonthlyNet;
  const annualDifference = monthlyDifference * 12;
  
  // Calculate break-even occupancy for STR to match LTR income
  const strDailyNet = (strMetrics.avgNightlyRate * 0.55); // Net after expenses
  const breakEvenDays = ltrMonthlyNet / strDailyNet;
  const breakEvenOccupancy = breakEvenDays / 30.4;
  
  return {
    ltr: {
      monthlyGross: ltrRent,
      monthlyNet: Math.round(ltrMonthlyNet),
      annualNet: Math.round(ltrMonthlyNet * 12)
    },
    str: {
      monthlyGross: strMetrics.monthlyRevenue,
      monthlyNet: Math.round(strMonthlyNet),
      annualNet: Math.round(strMonthlyNet * 12)
    },
    difference: {
      monthly: Math.round(monthlyDifference),
      annual: Math.round(annualDifference),
      percentage: ltrMonthlyNet > 0 ? Math.round((monthlyDifference / ltrMonthlyNet) * 100) : 0
    },
    breakEvenOccupancy: Math.round(breakEvenOccupancy * 100),
    recommendation: monthlyDifference > 0 ? 'STR' : 'LTR',
    riskAssessment: assessRisk(strMetrics.occupancyRate, breakEvenOccupancy)
  };
}

/**
 * Assess risk level of STR investment
 * @param {number} projectedOccupancy
 * @param {number} breakEvenOccupancy
 * @returns {string}
 */
function assessRisk(projectedOccupancy, breakEvenOccupancy) {
  const cushion = projectedOccupancy - breakEvenOccupancy;
  
  if (cushion > 0.20) return 'Low Risk - Strong occupancy cushion';
  if (cushion > 0.10) return 'Moderate Risk - Reasonable occupancy cushion';
  if (cushion > 0) return 'Higher Risk - Minimal occupancy cushion';
  return 'High Risk - Projected occupancy below break-even';
}

/**
 * Generate recommendations based on analysis
 * @param {Object} metrics - STR metrics
 * @param {Object} comparison - LTR vs STR comparison
 * @param {Object} property - Property details
 * @returns {Array} List of recommendations
 */
function generateRecommendations(metrics, comparison, property) {
  const recommendations = [];
  
  // Occupancy-based recommendations
  if (metrics.occupancyRate > 0.75) {
    recommendations.push({
      type: 'positive',
      message: 'High projected occupancy rate indicates strong STR demand in this area'
    });
  } else if (metrics.occupancyRate < 0.60) {
    recommendations.push({
      type: 'warning',
      message: 'Lower occupancy projection - consider seasonal factors and marketing strategy'
    });
  }
  
  // Price-based recommendations
  if (metrics.avgNightlyRate > 200) {
    recommendations.push({
      type: 'positive',
      message: 'Premium nightly rates possible - focus on high-end amenities and presentation'
    });
  }
  
  // Comparison-based recommendations
  if (comparison.recommendation === 'STR' && comparison.difference.percentage > 30) {
    recommendations.push({
      type: 'positive',
      message: `STR projected to generate ${comparison.difference.percentage}% more income than traditional rental`
    });
  } else if (comparison.recommendation === 'LTR') {
    recommendations.push({
      type: 'warning',
      message: 'Traditional rental may provide more stable income with less management overhead'
    });
  }
  
  // Property-specific recommendations
  if (property.bedrooms >= 3) {
    recommendations.push({
      type: 'info',
      message: 'Larger properties attract families and groups - consider family-friendly amenities'
    });
  }
  
  // Risk recommendations
  if (comparison.breakEvenOccupancy > 70) {
    recommendations.push({
      type: 'warning',
      message: 'High break-even occupancy - ensure strong marketing and competitive pricing'
    });
  }
  
  return recommendations;
}

// Export for use in API endpoints
module.exports = {
  analyzeSTRPotential,
  calculateDetailedSTRExpenses,
  calculateSeasonalProjections,
  generateRevenueScenarios,
  compareLTRvsSTR,
  generateRecommendations
};