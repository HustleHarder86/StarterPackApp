/**
 * Business Logic Validator
 * Validates business rules, recommendations, and market logic
 */

class BusinessLogicValidator {
  constructor() {
    this.validationResults = [];
    this.violations = [];
    this.marketData = this.loadMarketData();
  }

  /**
   * Load market data for validation
   */
  loadMarketData() {
    return {
      toronto: {
        avgPricePerSqft: 895,
        avgRent2BR: 3200,
        propertyTaxRate: 0.0125,
        strOccupancy: 0.75,
        strPremium: 2.5, // STR typically 2.5x LTR
        appreciationRate: 0.032
      },
      vancouver: {
        avgPricePerSqft: 1250,
        avgRent2BR: 3800,
        propertyTaxRate: 0.0035,
        strOccupancy: 0.70,
        strPremium: 2.8,
        appreciationRate: 0.028
      },
      default: {
        avgPricePerSqft: 650,
        avgRent2BR: 2500,
        propertyTaxRate: 0.01,
        strOccupancy: 0.65,
        strPremium: 2.0,
        appreciationRate: 0.03
      }
    };
  }

  /**
   * Validate STR restrictions detection
   */
  validateSTRRestrictions(data) {
    const {
      propertyType,
      buildingName,
      strAllowed,
      strRestricted,
      zoningType,
      condoBoard,
      city
    } = data;

    const restrictions = {
      zoning: false,
      condo: false,
      municipal: false,
      detected: false
    };

    // Check zoning restrictions
    if (zoningType && ['R1', 'R2', 'R3'].includes(zoningType)) {
      restrictions.zoning = true;
      restrictions.detected = true;
    }

    // Check condo/HOA restrictions
    if (propertyType === 'Condo' || propertyType === 'Apartment') {
      if (condoBoard === false || strAllowed === false) {
        restrictions.condo = true;
        restrictions.detected = true;
      }
    }

    // Check municipal restrictions (Toronto specific)
    if (city === 'Toronto') {
      // Toronto requires principal residence for STR
      restrictions.municipal = true;
      restrictions.detected = true;
    }

    // Validate detection accuracy
    const actualRestricted = strRestricted || !strAllowed;
    const detectedCorrectly = restrictions.detected === actualRestricted;

    const result = {
      type: 'str_restrictions',
      expected: restrictions.detected,
      actual: actualRestricted,
      passed: detectedCorrectly,
      restrictions,
      message: detectedCorrectly 
        ? 'STR restrictions correctly detected'
        : 'STR restriction detection mismatch'
    };

    this.validationResults.push(result);

    if (!detectedCorrectly) {
      this.violations.push({
        type: 'str_detection_error',
        expected: restrictions.detected,
        actual: actualRestricted,
        details: restrictions
      });
    }

    return result;
  }

  /**
   * Validate investment recommendation
   */
  validateInvestmentRecommendation(data) {
    const {
      strRestricted,
      ltrCashFlow,
      strCashFlow,
      roi,
      capRate,
      recommendation,
      investmentGrade
    } = data;

    let expectedRecommendation = null;
    let expectedGrade = null;

    // Determine expected recommendation
    if (strRestricted) {
      expectedRecommendation = 'LTR';
    } else {
      // Compare STR vs LTR returns
      if (strCashFlow > ltrCashFlow * 1.5) {
        expectedRecommendation = 'STR';
      } else if (ltrCashFlow > 0) {
        expectedRecommendation = 'LTR';
      } else {
        expectedRecommendation = 'Not Recommended';
      }
    }

    // Determine expected investment grade
    if (roi >= 15) {
      expectedGrade = 'A';
    } else if (roi >= 10) {
      expectedGrade = 'B';
    } else if (roi >= 5) {
      expectedGrade = 'C';
    } else if (roi >= 0) {
      expectedGrade = 'D';
    } else {
      expectedGrade = 'F';
    }

    // Allow for grade variations (B+ counts as B)
    const normalizedActualGrade = investmentGrade ? investmentGrade[0] : null;
    const gradeMatches = normalizedActualGrade === expectedGrade;
    const recommendationMatches = recommendation === expectedRecommendation;

    const result = {
      type: 'investment_recommendation',
      expectedRecommendation,
      actualRecommendation: recommendation,
      expectedGrade,
      actualGrade: investmentGrade,
      passed: recommendationMatches && gradeMatches,
      details: {
        roi,
        capRate,
        strRestricted,
        cashFlows: { str: strCashFlow, ltr: ltrCashFlow }
      }
    };

    this.validationResults.push(result);

    if (!recommendationMatches || !gradeMatches) {
      this.violations.push({
        type: 'recommendation_error',
        expected: { recommendation: expectedRecommendation, grade: expectedGrade },
        actual: { recommendation, grade: investmentGrade },
        message: 'Investment recommendation logic error'
      });
    }

    return result;
  }

  /**
   * Validate market comparables
   */
  validateMarketComparables(data) {
    const {
      city,
      propertyType,
      pricePerSqft,
      monthlyRent,
      bedrooms,
      comparables
    } = data;

    const market = this.marketData[city.toLowerCase()] || this.marketData.default;
    const results = [];

    // Check price per sqft is within reasonable range (±30% of average)
    const priceVariance = Math.abs(pricePerSqft - market.avgPricePerSqft) / market.avgPricePerSqft;
    const priceReasonable = priceVariance <= 0.30;

    results.push({
      metric: 'price_per_sqft',
      value: pricePerSqft,
      marketAvg: market.avgPricePerSqft,
      variance: priceVariance,
      passed: priceReasonable
    });

    // Check rental rate is within range
    if (bedrooms === 2) {
      const rentVariance = Math.abs(monthlyRent - market.avgRent2BR) / market.avgRent2BR;
      const rentReasonable = rentVariance <= 0.25;

      results.push({
        metric: 'monthly_rent',
        value: monthlyRent,
        marketAvg: market.avgRent2BR,
        variance: rentVariance,
        passed: rentReasonable
      });
    }

    // Validate comparables if provided
    if (comparables && comparables.length > 0) {
      const compPrices = comparables.map(c => c.price);
      const avgCompPrice = compPrices.reduce((a, b) => a + b, 0) / compPrices.length;
      const subjectPrice = data.purchasePrice;
      
      const compVariance = Math.abs(subjectPrice - avgCompPrice) / avgCompPrice;
      const comparablesReasonable = compVariance <= 0.15; // Within 15% of comps

      results.push({
        metric: 'comparable_pricing',
        subjectPrice,
        avgCompPrice,
        variance: compVariance,
        passed: comparablesReasonable
      });
    }

    const allPassed = results.every(r => r.passed);

    const validationResult = {
      type: 'market_comparables',
      passed: allPassed,
      results,
      message: allPassed 
        ? 'Market comparables are reasonable'
        : 'Market comparables show anomalies'
    };

    this.validationResults.push(validationResult);

    if (!allPassed) {
      this.violations.push({
        type: 'market_anomaly',
        results,
        message: 'Property metrics outside normal market range'
      });
    }

    return validationResult;
  }

  /**
   * Validate risk assessment
   */
  validateRiskAssessment(data) {
    const {
      vacancy,
      leverage,
      cashFlow,
      reserves,
      propertyAge,
      riskLevel,
      riskFactors
    } = data;

    const risks = {
      high: [],
      medium: [],
      low: []
    };

    // Assess vacancy risk
    if (vacancy > 0.10) {
      risks.high.push('High vacancy rate');
    } else if (vacancy > 0.05) {
      risks.medium.push('Moderate vacancy rate');
    }

    // Assess leverage risk
    const ltv = leverage || 0.80;
    if (ltv > 0.80) {
      risks.high.push('High leverage');
    } else if (ltv > 0.70) {
      risks.medium.push('Moderate leverage');
    }

    // Assess cash flow risk
    if (cashFlow < 0) {
      risks.high.push('Negative cash flow');
    } else if (cashFlow < 500) {
      risks.medium.push('Low cash flow');
    }

    // Assess reserve risk
    const monthlyExpenses = data.totalExpenses || 5000;
    const reserveMonths = reserves / monthlyExpenses;
    if (reserveMonths < 3) {
      risks.high.push('Insufficient reserves');
    } else if (reserveMonths < 6) {
      risks.medium.push('Limited reserves');
    }

    // Assess property age risk
    if (propertyAge > 30) {
      risks.medium.push('Aging property');
    } else if (propertyAge > 50) {
      risks.high.push('Old property - high maintenance risk');
    }

    // Determine overall risk level
    let expectedRiskLevel;
    if (risks.high.length >= 2) {
      expectedRiskLevel = 'High';
    } else if (risks.high.length === 1 || risks.medium.length >= 2) {
      expectedRiskLevel = 'Medium';
    } else {
      expectedRiskLevel = 'Low';
    }

    const actualRiskLevel = riskLevel || 'Unknown';
    const riskMatches = expectedRiskLevel.toLowerCase() === actualRiskLevel.toLowerCase();

    const result = {
      type: 'risk_assessment',
      expectedRiskLevel,
      actualRiskLevel,
      passed: riskMatches,
      identifiedRisks: risks,
      providedRiskFactors: riskFactors
    };

    this.validationResults.push(result);

    if (!riskMatches) {
      this.violations.push({
        type: 'risk_assessment_error',
        expected: expectedRiskLevel,
        actual: actualRiskLevel,
        risks
      });
    }

    return result;
  }

  /**
   * Validate occupancy assumptions
   */
  validateOccupancyAssumptions(data) {
    const {
      city,
      propertyType,
      strOccupancy,
      ltrVacancy,
      season
    } = data;

    const market = this.marketData[city.toLowerCase()] || this.marketData.default;
    const results = [];

    // Validate STR occupancy
    if (strOccupancy !== undefined) {
      const expectedOccupancy = market.strOccupancy;
      const variance = Math.abs(strOccupancy - expectedOccupancy);
      const reasonable = variance <= 0.10; // Within 10%

      results.push({
        metric: 'str_occupancy',
        value: strOccupancy,
        expected: expectedOccupancy,
        variance,
        passed: reasonable
      });

      // Check seasonal adjustments
      if (season === 'winter' && strOccupancy > 0.80) {
        results.push({
          metric: 'seasonal_str',
          issue: 'Unrealistic winter STR occupancy',
          passed: false
        });
      }
    }

    // Validate LTR vacancy
    if (ltrVacancy !== undefined) {
      const reasonable = ltrVacancy >= 0.03 && ltrVacancy <= 0.10;
      
      results.push({
        metric: 'ltr_vacancy',
        value: ltrVacancy,
        expectedRange: [0.03, 0.10],
        passed: reasonable
      });
    }

    const allPassed = results.every(r => r.passed);

    const validationResult = {
      type: 'occupancy_assumptions',
      passed: allPassed,
      results
    };

    this.validationResults.push(validationResult);

    if (!allPassed) {
      this.violations.push({
        type: 'occupancy_assumption_error',
        results,
        message: 'Unrealistic occupancy assumptions'
      });
    }

    return validationResult;
  }

  /**
   * Validate expense ratios
   */
  validateExpenseRatios(data) {
    const {
      grossIncome,
      operatingExpenses,
      managementFee,
      maintenanceCost,
      insurance,
      utilities
    } = data;

    const ratios = {
      operating: operatingExpenses / grossIncome,
      management: managementFee / grossIncome,
      maintenance: maintenanceCost / grossIncome,
      insurance: insurance / grossIncome,
      utilities: utilities / grossIncome
    };

    const expectedRanges = {
      operating: [0.30, 0.50],     // 30-50% typical
      management: [0.08, 0.10],     // 8-10% for property management
      maintenance: [0.05, 0.10],    // 5-10% for maintenance
      insurance: [0.01, 0.03],      // 1-3% for insurance
      utilities: [0.02, 0.05]       // 2-5% for utilities (if landlord pays)
    };

    const results = [];

    Object.entries(ratios).forEach(([expense, ratio]) => {
      const [min, max] = expectedRanges[expense];
      const inRange = ratio >= min && ratio <= max;

      results.push({
        expense,
        ratio,
        expectedRange: [min, max],
        passed: inRange
      });

      if (!inRange && ratio > 0) {
        this.violations.push({
          type: 'expense_ratio_anomaly',
          expense,
          ratio,
          expected: expectedRanges[expense],
          message: `${expense} ratio outside normal range`
        });
      }
    });

    const validationResult = {
      type: 'expense_ratios',
      passed: results.every(r => r.passed),
      ratios,
      results
    };

    this.validationResults.push(validationResult);
    return validationResult;
  }

  /**
   * Validate appreciation assumptions
   */
  validateAppreciationAssumptions(data) {
    const {
      city,
      appreciationRate,
      historicalAppreciation,
      neighborhoodTrend
    } = data;

    const market = this.marketData[city.toLowerCase()] || this.marketData.default;
    const expectedRate = market.appreciationRate;
    
    // Check if appreciation rate is reasonable (within 2% of market average)
    const variance = Math.abs(appreciationRate - expectedRate);
    const reasonable = variance <= 0.02;

    // Check if it aligns with neighborhood trend
    let trendAlignment = true;
    if (neighborhoodTrend === 'declining' && appreciationRate > 0.02) {
      trendAlignment = false;
    } else if (neighborhoodTrend === 'hot' && appreciationRate < 0.04) {
      trendAlignment = false;
    }

    const result = {
      type: 'appreciation_assumptions',
      value: appreciationRate,
      marketExpected: expectedRate,
      variance,
      trendAlignment,
      passed: reasonable && trendAlignment
    };

    this.validationResults.push(result);

    if (!result.passed) {
      this.violations.push({
        type: 'appreciation_assumption_error',
        actual: appreciationRate,
        expected: expectedRate,
        message: 'Unrealistic appreciation assumptions'
      });
    }

    return result;
  }

  /**
   * Run all business logic validations
   */
  async validateAll(analysisData) {
    const results = {
      timestamp: new Date().toISOString(),
      totalValidations: 0,
      passed: 0,
      failed: 0,
      accuracy: 0,
      violations: [],
      details: {}
    };

    // Extract business data
    const businessData = this.extractBusinessData(analysisData);

    // Run all validations
    const validations = [
      { name: 'str_restrictions', fn: () => this.validateSTRRestrictions(businessData) },
      { name: 'investment_recommendation', fn: () => this.validateInvestmentRecommendation(businessData) },
      { name: 'market_comparables', fn: () => this.validateMarketComparables(businessData) },
      { name: 'risk_assessment', fn: () => this.validateRiskAssessment(businessData) },
      { name: 'occupancy_assumptions', fn: () => this.validateOccupancyAssumptions(businessData) },
      { name: 'expense_ratios', fn: () => this.validateExpenseRatios(businessData) },
      { name: 'appreciation_assumptions', fn: () => this.validateAppreciationAssumptions(businessData) }
    ];

    for (const validation of validations) {
      try {
        const result = validation.fn();
        results.details[validation.name] = result;
        results.totalValidations++;
        
        if (result.passed) {
          results.passed++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.details[validation.name] = { 
          error: error.message,
          passed: false 
        };
        results.failed++;
        results.totalValidations++;
      }
    }

    results.accuracy = (results.passed / results.totalValidations) * 100;
    results.violations = this.violations;

    return results;
  }

  /**
   * Extract business data from analysis
   */
  extractBusinessData(analysis) {
    return {
      // Property info
      city: analysis.city || 'Toronto',
      propertyType: analysis.property_type || analysis.propertyType,
      buildingName: analysis.building_name || analysis.buildingName,
      propertyAge: new Date().getFullYear() - (analysis.year_built || analysis.yearBuilt || 2010),
      
      // STR/LTR data
      strAllowed: analysis.str_allowed !== false,
      strRestricted: analysis.str_restricted || analysis.strRestricted,
      strOccupancy: analysis.str_occupancy || analysis.strOccupancy,
      strCashFlow: analysis.str_cash_flow || analysis.strCashFlow,
      ltrCashFlow: analysis.ltr_cash_flow || analysis.ltrCashFlow,
      ltrVacancy: analysis.ltr_vacancy || analysis.ltrVacancy || 0.05,
      
      // Financial metrics
      purchasePrice: analysis.purchase_price || analysis.purchasePrice,
      monthlyRent: analysis.monthly_rent || analysis.monthlyRent,
      roi: analysis.roi || analysis.annual_roi || analysis.annualROI,
      capRate: analysis.cap_rate || analysis.capRate,
      cashFlow: analysis.monthly_cash_flow || analysis.monthlyCashFlow,
      
      // Market data
      pricePerSqft: (analysis.purchase_price || analysis.purchasePrice) / 
                    (analysis.square_feet || analysis.squareFeet || 1000),
      bedrooms: analysis.bedrooms,
      comparables: analysis.comparables,
      
      // Risk factors
      vacancy: analysis.vacancy_rate || analysis.vacancyRate || 0.05,
      leverage: analysis.ltv || analysis.loan_to_value || 0.80,
      reserves: analysis.reserves || 10000,
      totalExpenses: analysis.total_expenses || analysis.totalExpenses,
      riskLevel: analysis.risk_level || analysis.riskLevel,
      riskFactors: analysis.risk_factors || analysis.riskFactors,
      
      // Recommendations
      recommendation: analysis.recommendation || analysis.strategy_recommendation,
      investmentGrade: analysis.investment_grade || analysis.investmentGrade,
      
      // Expense breakdown
      grossIncome: analysis.gross_income || analysis.grossIncome,
      operatingExpenses: analysis.operating_expenses || analysis.operatingExpenses,
      managementFee: analysis.management_fee || analysis.managementFee,
      maintenanceCost: analysis.maintenance || analysis.maintenanceCost,
      insurance: analysis.insurance,
      utilities: analysis.utilities || 0,
      
      // Appreciation
      appreciationRate: analysis.appreciation_rate || analysis.appreciationRate || 0.032,
      historicalAppreciation: analysis.historical_appreciation,
      neighborhoodTrend: analysis.neighborhood_trend || 'stable',
      
      // Other
      zoningType: analysis.zoning || analysis.zoningType,
      condoBoard: analysis.condo_board_allows_str,
      season: new Date().getMonth() < 3 || new Date().getMonth() > 10 ? 'winter' : 'summer'
    };
  }

  /**
   * Generate business logic report
   */
  generateReport() {
    const summary = {
      totalValidations: this.validationResults.length,
      passed: this.validationResults.filter(r => r.passed).length,
      failed: this.validationResults.filter(r => !r.passed).length,
      accuracy: 0,
      criticalViolations: [],
      recommendations: []
    };

    summary.accuracy = (summary.passed / summary.totalValidations) * 100;

    // Identify critical violations
    this.violations.forEach(violation => {
      if (violation.type === 'str_detection_error' || 
          violation.type === 'recommendation_error' ||
          violation.type === 'risk_assessment_error') {
        summary.criticalViolations.push(violation);
      }
    });

    // Generate recommendations
    if (summary.accuracy < 90) {
      summary.recommendations.push('Review business logic rules and algorithms');
    }
    
    const violationTypes = [...new Set(this.violations.map(v => v.type))];
    violationTypes.forEach(type => {
      switch(type) {
        case 'str_detection_error':
          summary.recommendations.push('Improve STR restriction detection logic');
          break;
        case 'market_anomaly':
          summary.recommendations.push('Update market data and comparable analysis');
          break;
        case 'expense_ratio_anomaly':
          summary.recommendations.push('Review expense calculation formulas');
          break;
        case 'occupancy_assumption_error':
          summary.recommendations.push('Adjust occupancy assumptions to market norms');
          break;
      }
    });

    return {
      summary,
      details: this.validationResults,
      violations: this.violations,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BusinessLogicValidator;