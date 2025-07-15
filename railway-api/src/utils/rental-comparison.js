const logger = require('../services/logger.service');

class RentalComparisonEngine {
  /**
   * Compare LTR and STR strategies
   * @param {Object} ltrAnalysis - Long-term rental analysis results
   * @param {Object} strAnalysis - Short-term rental analysis results
   * @param {Object} property - Property details
   * @returns {Object} Comprehensive comparison
   */
  compare(ltrAnalysis, strAnalysis, property = {}) {
    // Extract key metrics
    const ltrMonthly = ltrAnalysis.monthlyRent || 0;
    const ltrAnnual = ltrMonthly * 12;
    const ltrNet = ltrAnalysis.netAnnualIncome || (ltrAnnual * 0.85); // Assume 15% expenses if not provided
    
    const strMonthly = strAnalysis.projections.moderate.monthlyRevenue || 0;
    const strAnnual = strAnalysis.projections.moderate.annualRevenue || 0;
    const strNet = strAnalysis.netIncome.moderate || 0;
    
    // Calculate differences
    const monthlyDifference = strMonthly - ltrMonthly;
    const annualDifference = strNet - ltrNet;
    
    // Determine winner
    const winner = strNet > ltrNet ? 'str' : 'ltr';
    
    // Calculate break-even occupancy for STR
    const breakEvenOccupancy = this.calculateBreakEvenOccupancy(
      ltrNet,
      strAnalysis.rates.selected,
      strAnalysis.expenses.total
    );
    
    // Assess confidence based on data quality
    const confidence = this.assessConfidence(strAnalysis);
    
    // Generate risk profiles
    const riskProfiles = this.assessRiskProfiles(ltrAnalysis, strAnalysis);
    
    // Create recommendation
    const recommendation = this.generateRecommendation(
      winner,
      annualDifference,
      breakEvenOccupancy,
      riskProfiles,
      property
    );
    
    return {
      winner,
      metrics: {
        ltr: {
          monthlyIncome: ltrMonthly,
          annualGross: ltrAnnual,
          annualNet: ltrNet,
          occupancy: 0.95, // Typical LTR occupancy
          managementEffort: 'low'
        },
        str: {
          monthlyIncome: strMonthly,
          annualGross: strAnnual,
          annualNet: strNet,
          occupancy: strAnalysis.projections.moderate.occupancy,
          managementEffort: 'high'
        }
      },
      financial: {
        monthlyDifference,
        annualDifference,
        percentDifference: ltrNet > 0 ? Math.round((annualDifference / ltrNet) * 100) : 0,
        roiImprovement: this.calculateROIImprovement(ltrNet, strNet, property)
      },
      breakEven: {
        occupancy: breakEvenOccupancy,
        nightsPerYear: Math.round(365 * breakEvenOccupancy),
        interpretation: this.interpretBreakEven(breakEvenOccupancy)
      },
      confidence,
      riskProfiles,
      recommendation,
      sensitivity: this.generateSensitivityAnalysis(ltrNet, strAnalysis)
    };
  }

  /**
   * Calculate STR occupancy needed to match LTR income
   */
  calculateBreakEvenOccupancy(ltrNetIncome, strNightlyRate, strAnnualExpenses) {
    if (strNightlyRate <= 0) return 1; // Impossible to break even
    
    // Need to earn LTR income + STR expenses
    const requiredGrossIncome = ltrNetIncome + strAnnualExpenses;
    const requiredNights = requiredGrossIncome / strNightlyRate;
    const breakEvenOccupancy = requiredNights / 365;
    
    return Math.min(Math.round(breakEvenOccupancy * 100) / 100, 1); // Cap at 100%
  }

  /**
   * Assess confidence level based on data quality
   */
  assessConfidence(strAnalysis) {
    const dataQuality = strAnalysis.analysis?.dataQuality || 'moderate';
    const comparableCount = strAnalysis.comparables?.quality || 0;
    
    if (dataQuality === 'high' && comparableCount >= 15) {
      return 'high';
    } else if (dataQuality === 'moderate' || comparableCount >= 10) {
      return 'moderate';
    }
    return 'low';
  }

  /**
   * Assess risk profiles for both strategies
   */
  assessRiskProfiles(ltrAnalysis, strAnalysis) {
    return {
      ltr: {
        level: 'low',
        factors: [
          'Stable monthly income',
          'Long-term lease agreements',
          'Minimal management required',
          'Lower turnover costs'
        ],
        concerns: [
          'Potential vacancy between tenants',
          'Risk of problem tenants',
          'Limited income growth potential'
        ]
      },
      str: {
        level: 'moderate-high',
        factors: [
          'Higher income potential',
          'Flexible pricing',
          'Tax benefits',
          'Property appreciation from upgrades'
        ],
        concerns: [
          'Income variability by season',
          'Higher management requirements',
          'Regulatory changes',
          'Platform dependency',
          'Higher wear and tear'
        ]
      }
    };
  }

  /**
   * Generate recommendation based on analysis
   */
  generateRecommendation(winner, annualDifference, breakEvenOccupancy, riskProfiles, property) {
    const recommendation = {
      strategy: winner.toUpperCase(),
      strength: 'moderate'
    };
    
    // Determine recommendation strength
    if (Math.abs(annualDifference) < 5000) {
      recommendation.strength = 'weak';
      recommendation.primary = 'Both strategies offer similar returns';
      recommendation.rationale = 'The financial difference is minimal. Choose based on your management preferences and risk tolerance.';
    } else if (winner === 'str' && annualDifference > 20000) {
      recommendation.strength = 'strong';
      recommendation.primary = 'Short-term rental strongly recommended';
      recommendation.rationale = `STR offers ${Math.round(annualDifference / 1000)}k more annual income with a low break-even occupancy of ${Math.round(breakEvenOccupancy * 100)}%.`;
    } else if (winner === 'str') {
      recommendation.primary = 'Short-term rental recommended';
      recommendation.rationale = `STR offers better returns with moderate effort. Break-even occupancy of ${Math.round(breakEvenOccupancy * 100)}% is achievable.`;
    } else {
      recommendation.primary = 'Long-term rental recommended';
      recommendation.rationale = 'LTR provides more stable income with minimal management requirements.';
    }
    
    // Add specific caveats
    recommendation.considerations = this.generateConsiderations(winner, breakEvenOccupancy, property);
    
    // Action items
    recommendation.nextSteps = this.generateNextSteps(winner);
    
    return recommendation;
  }

  /**
   * Generate specific considerations
   */
  generateConsiderations(winner, breakEvenOccupancy, property) {
    const considerations = [];
    
    if (winner === 'str') {
      considerations.push('Check local STR regulations and HOA rules');
      considerations.push('Factor in your available time for management');
      
      if (breakEvenOccupancy > 0.6) {
        considerations.push('Break-even occupancy is relatively high - ensure strong marketing');
      }
      
      if (property.propertyType === 'Condo') {
        considerations.push('Verify building allows short-term rentals');
      }
    } else {
      considerations.push('Screen tenants carefully for long-term stability');
      considerations.push('Consider property management if remote');
    }
    
    considerations.push('Review insurance requirements for your chosen strategy');
    considerations.push('Consider tax implications of rental income');
    
    return considerations;
  }

  /**
   * Generate actionable next steps
   */
  generateNextSteps(winner) {
    if (winner === 'str') {
      return [
        'Research local STR regulations and licensing',
        'Set up STR-specific insurance policy',
        'Create listing on Airbnb/VRBO',
        'Invest in quality photography',
        'Develop pricing strategy based on seasonality'
      ];
    } else {
      return [
        'List property on rental platforms',
        'Set competitive rent based on comparables',
        'Prepare lease agreement',
        'Set up tenant screening process',
        'Consider property management options'
      ];
    }
  }

  /**
   * Calculate ROI improvement
   */
  calculateROIImprovement(ltrNet, strNet, property) {
    const downPayment = property.price * 0.2; // Assume 20% down
    const ltrROI = (ltrNet / downPayment) * 100;
    const strROI = (strNet / downPayment) * 100;
    
    return {
      ltr: Math.round(ltrROI * 10) / 10,
      str: Math.round(strROI * 10) / 10,
      improvement: Math.round((strROI - ltrROI) * 10) / 10
    };
  }

  /**
   * Interpret break-even occupancy
   */
  interpretBreakEven(occupancy) {
    if (occupancy <= 0.4) return 'Very achievable - low risk';
    if (occupancy <= 0.5) return 'Achievable with good marketing';
    if (occupancy <= 0.6) return 'Moderate - requires consistent bookings';
    if (occupancy <= 0.7) return 'Challenging - need excellent location/amenities';
    return 'Very challenging - high risk';
  }

  /**
   * Generate sensitivity analysis
   */
  generateSensitivityAnalysis(ltrNet, strAnalysis) {
    const baseRate = strAnalysis.rates.selected;
    const baseExpenses = strAnalysis.expenses.total;
    
    const scenarios = [];
    
    // Vary occupancy
    for (const occupancy of [0.5, 0.6, 0.7, 0.8]) {
      const revenue = baseRate * 365 * occupancy;
      const expenses = this.estimateExpensesForRevenue(revenue);
      const net = revenue - expenses;
      
      scenarios.push({
        variable: 'occupancy',
        value: occupancy,
        strNet: net,
        difference: net - ltrNet,
        betterThanLTR: net > ltrNet
      });
    }
    
    // Vary nightly rate
    for (const rateMultiplier of [0.8, 0.9, 1.0, 1.1, 1.2]) {
      const rate = baseRate * rateMultiplier;
      const revenue = rate * 365 * 0.7; // Assume 70% occupancy
      const expenses = this.estimateExpensesForRevenue(revenue);
      const net = revenue - expenses;
      
      scenarios.push({
        variable: 'nightlyRate',
        value: Math.round(rate),
        strNet: net,
        difference: net - ltrNet,
        betterThanLTR: net > ltrNet
      });
    }
    
    return scenarios;
  }

  /**
   * Estimate expenses based on revenue (simplified)
   */
  estimateExpensesForRevenue(revenue) {
    return Math.round(revenue * 0.45); // Assume 45% expense ratio
  }
}

// Export singleton instance
module.exports = {
  rentalComparison: new RentalComparisonEngine()
};