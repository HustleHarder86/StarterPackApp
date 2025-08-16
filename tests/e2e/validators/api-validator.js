/**
 * API Response Validator
 * Validates API responses for structure, data types, and business logic
 */

class APIValidator {
  constructor() {
    // Expected response structure for property analysis
    this.propertyAnalysisSchema = {
      required: [
        'success',
        'propertyAddress',
        'timestamp',
        'executionTime',
        'propertyDetails',
        'costs',
        'monthlyExpenses',
        'cashFlow',
        'metrics'
      ],
      optional: [
        'strAnalysis',
        'longTermRental',
        'comparables',
        'insights',
        'citations',
        'aiInsights',
        'debugInfo'
      ],
      propertyDetails: {
        required: ['address', 'price'],
        optional: ['bedrooms', 'bathrooms', 'sqft', 'type', 'yearBuilt', 'hoa']
      },
      costs: {
        required: ['downPayment', 'closingCosts', 'totalUpfront'],
        optional: ['renovationCosts', 'furnishingCosts']
      },
      monthlyExpenses: {
        required: ['mortgage', 'propertyTax', 'insurance', 'total'],
        optional: ['hoa', 'maintenance', 'utilities', 'management']
      },
      cashFlow: {
        required: ['monthlyRental', 'totalExpenses', 'netCashFlow'],
        optional: ['annualCashFlow', 'cashOnCashReturn']
      },
      metrics: {
        required: ['capRate', 'cashOnCashReturn', 'totalROI'],
        optional: ['rentToPrice', 'grossRentMultiplier', 'debtServiceCoverage']
      }
    };

    // Value range validations
    this.valueRanges = {
      price: { min: 100000, max: 10000000 },
      monthlyRent: { min: 500, max: 20000 },
      capRate: { min: 0, max: 20 },
      cashOnCashReturn: { min: -50, max: 50 },
      totalROI: { min: -30, max: 30 },
      downPaymentPercent: { min: 5, max: 50 },
      interestRate: { min: 2, max: 12 },
      executionTime: { min: 100, max: 120000 } // 100ms to 2 minutes
    };

    this.results = [];
  }

  /**
   * Validate a property analysis API response
   */
  async validatePropertyAnalysis(response, expectedData = {}) {
    const validation = {
      timestamp: new Date().toISOString(),
      endpoint: 'property-analysis',
      passed: true,
      errors: [],
      warnings: [],
      data: {}
    };

    try {
      // Check if response is valid JSON
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      
      // Check success status
      if (!data.success) {
        validation.passed = false;
        validation.errors.push(`API returned success: false - ${data.error || 'Unknown error'}`);
        this.results.push(validation);
        return validation;
      }

      // Validate required fields
      this.validateRequiredFields(data, this.propertyAnalysisSchema.required, validation);

      // Validate nested structures
      if (data.propertyDetails) {
        this.validateRequiredFields(
          data.propertyDetails, 
          this.propertyAnalysisSchema.propertyDetails.required, 
          validation,
          'propertyDetails'
        );
      }

      if (data.costs) {
        this.validateRequiredFields(
          data.costs,
          this.propertyAnalysisSchema.costs.required,
          validation,
          'costs'
        );
      }

      if (data.monthlyExpenses) {
        this.validateRequiredFields(
          data.monthlyExpenses,
          this.propertyAnalysisSchema.monthlyExpenses.required,
          validation,
          'monthlyExpenses'
        );
      }

      if (data.cashFlow) {
        this.validateRequiredFields(
          data.cashFlow,
          this.propertyAnalysisSchema.cashFlow.required,
          validation,
          'cashFlow'
        );
      }

      if (data.metrics) {
        this.validateRequiredFields(
          data.metrics,
          this.propertyAnalysisSchema.metrics.required,
          validation,
          'metrics'
        );
        
        // Validate metric ranges
        this.validateMetricRanges(data.metrics, validation);
      }

      // Validate data types
      this.validateDataTypes(data, validation);

      // Validate business logic
      this.validateBusinessLogic(data, validation);

      // Check for expected values if provided
      if (expectedData.monthlyRent) {
        this.validateExpectedRent(data, expectedData, validation);
      }

      if (expectedData.cashFlow) {
        this.validateExpectedCashFlow(data, expectedData, validation);
      }

      // Check execution time
      if (data.executionTime) {
        const execTime = parseFloat(data.executionTime);
        if (execTime > this.valueRanges.executionTime.max) {
          validation.warnings.push(
            `Execution time (${execTime}ms) exceeds expected maximum (${this.valueRanges.executionTime.max}ms)`
          );
        }
      }

      // Store validation result
      validation.data = {
        address: data.propertyAddress,
        price: data.propertyDetails?.price,
        monthlyRent: data.cashFlow?.monthlyRental,
        cashFlow: data.cashFlow?.netCashFlow,
        capRate: data.metrics?.capRate,
        roi: data.metrics?.totalROI
      };

    } catch (error) {
      validation.passed = false;
      validation.errors.push(`Validation error: ${error.message}`);
    }

    this.results.push(validation);
    return validation;
  }

  /**
   * Validate required fields exist
   */
  validateRequiredFields(data, requiredFields, validation, prefix = '') {
    for (const field of requiredFields) {
      const fieldPath = prefix ? `${prefix}.${field}` : field;
      
      if (data[field] === undefined || data[field] === null) {
        validation.passed = false;
        validation.errors.push(`Missing required field: ${fieldPath}`);
      }
    }
  }

  /**
   * Validate data types
   */
  validateDataTypes(data, validation) {
    // Check numeric fields
    const numericFields = [
      'propertyDetails.price',
      'costs.downPayment',
      'costs.totalUpfront',
      'monthlyExpenses.total',
      'cashFlow.monthlyRental',
      'cashFlow.netCashFlow',
      'metrics.capRate',
      'metrics.cashOnCashReturn',
      'metrics.totalROI'
    ];

    for (const fieldPath of numericFields) {
      const value = this.getNestedValue(data, fieldPath);
      if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
        validation.errors.push(`Invalid data type for ${fieldPath}: expected number, got ${typeof value}`);
        validation.passed = false;
      }
    }

    // Check string fields
    const stringFields = [
      'propertyAddress',
      'timestamp',
      'propertyDetails.address'
    ];

    for (const fieldPath of stringFields) {
      const value = this.getNestedValue(data, fieldPath);
      if (value !== undefined && typeof value !== 'string') {
        validation.errors.push(`Invalid data type for ${fieldPath}: expected string, got ${typeof value}`);
        validation.passed = false;
      }
    }

    // Check boolean fields
    if (data.success !== undefined && typeof data.success !== 'boolean') {
      validation.errors.push(`Invalid data type for success: expected boolean, got ${typeof data.success}`);
      validation.passed = false;
    }
  }

  /**
   * Validate business logic rules
   */
  validateBusinessLogic(data, validation) {
    // Cash flow should be rental income minus expenses
    if (data.cashFlow?.monthlyRental && data.cashFlow?.totalExpenses && data.cashFlow?.netCashFlow) {
      const calculatedCashFlow = data.cashFlow.monthlyRental - data.cashFlow.totalExpenses;
      const actualCashFlow = data.cashFlow.netCashFlow;
      
      if (Math.abs(calculatedCashFlow - actualCashFlow) > 10) {
        validation.warnings.push(
          `Cash flow calculation mismatch: ${actualCashFlow} != ${data.cashFlow.monthlyRental} - ${data.cashFlow.totalExpenses}`
        );
      }
    }

    // Down payment should be percentage of price
    if (data.costs?.downPayment && data.propertyDetails?.price) {
      const downPaymentPercent = (data.costs.downPayment / data.propertyDetails.price) * 100;
      
      if (downPaymentPercent < this.valueRanges.downPaymentPercent.min || 
          downPaymentPercent > this.valueRanges.downPaymentPercent.max) {
        validation.warnings.push(
          `Down payment percentage (${downPaymentPercent.toFixed(1)}%) outside expected range`
        );
      }
    }

    // Cap rate calculation: (Annual NOI / Property Price) * 100
    if (data.metrics?.capRate && data.cashFlow?.netCashFlow && data.propertyDetails?.price) {
      const annualNOI = data.cashFlow.netCashFlow * 12;
      const calculatedCapRate = (annualNOI / data.propertyDetails.price) * 100;
      
      if (Math.abs(calculatedCapRate - data.metrics.capRate) > 0.5) {
        validation.warnings.push(
          `Cap rate calculation mismatch: ${data.metrics.capRate}% vs calculated ${calculatedCapRate.toFixed(2)}%`
        );
      }
    }
  }

  /**
   * Validate metric ranges
   */
  validateMetricRanges(metrics, validation) {
    // Cap rate should be reasonable
    if (metrics.capRate !== undefined) {
      if (metrics.capRate < this.valueRanges.capRate.min || 
          metrics.capRate > this.valueRanges.capRate.max) {
        validation.warnings.push(
          `Cap rate (${metrics.capRate}%) outside expected range (${this.valueRanges.capRate.min}-${this.valueRanges.capRate.max}%)`
        );
      }
    }

    // Cash on cash return
    if (metrics.cashOnCashReturn !== undefined) {
      if (metrics.cashOnCashReturn < this.valueRanges.cashOnCashReturn.min || 
          metrics.cashOnCashReturn > this.valueRanges.cashOnCashReturn.max) {
        validation.warnings.push(
          `Cash on cash return (${metrics.cashOnCashReturn}%) outside expected range`
        );
      }
    }

    // Total ROI
    if (metrics.totalROI !== undefined) {
      if (metrics.totalROI < this.valueRanges.totalROI.min || 
          metrics.totalROI > this.valueRanges.totalROI.max) {
        validation.warnings.push(
          `Total ROI (${metrics.totalROI}%) outside expected range`
        );
      }
    }
  }

  /**
   * Validate expected rent against actual
   */
  validateExpectedRent(data, expected, validation) {
    const actualRent = data.cashFlow?.monthlyRental || data.longTermRental?.estimatedRent;
    
    if (actualRent && expected.monthlyRent) {
      const { min, max } = expected.monthlyRent;
      
      if (actualRent < min || actualRent > max) {
        validation.warnings.push(
          `Monthly rent ($${actualRent}) outside expected range ($${min}-$${max})`
        );
      }
    }
  }

  /**
   * Validate expected cash flow
   */
  validateExpectedCashFlow(data, expected, validation) {
    const actualCashFlow = data.cashFlow?.netCashFlow;
    
    if (actualCashFlow !== undefined && expected.cashFlow) {
      const { min, max } = expected.cashFlow;
      
      if (actualCashFlow < min || actualCashFlow > max) {
        validation.warnings.push(
          `Cash flow ($${actualCashFlow}) outside expected range ($${min}-$${max})`
        );
      }
    }
  }

  /**
   * Validate STR analysis response
   */
  async validateSTRAnalysis(response) {
    const validation = {
      timestamp: new Date().toISOString(),
      endpoint: 'str-analysis',
      passed: true,
      errors: [],
      warnings: []
    };

    try {
      const data = typeof response === 'string' ? JSON.parse(response) : response;
      
      // Check for STR-specific fields
      const requiredSTRFields = [
        'averageDailyRate',
        'occupancyRate',
        'monthlyRevenue',
        'annualRevenue',
        'competitorAnalysis'
      ];

      for (const field of requiredSTRFields) {
        if (!data.strAnalysis?.[field]) {
          validation.errors.push(`Missing STR field: ${field}`);
          validation.passed = false;
        }
      }

      // Validate STR metrics
      if (data.strAnalysis) {
        const str = data.strAnalysis;
        
        // ADR should be reasonable
        if (str.averageDailyRate < 50 || str.averageDailyRate > 1000) {
          validation.warnings.push(
            `ADR ($${str.averageDailyRate}) seems unusual for Toronto market`
          );
        }

        // Occupancy rate should be 0-100
        if (str.occupancyRate < 0 || str.occupancyRate > 100) {
          validation.errors.push(`Invalid occupancy rate: ${str.occupancyRate}%`);
          validation.passed = false;
        }

        // Monthly revenue calculation
        const calculatedMonthly = str.averageDailyRate * 30 * (str.occupancyRate / 100);
        if (Math.abs(calculatedMonthly - str.monthlyRevenue) > 100) {
          validation.warnings.push(
            `STR revenue calculation mismatch: $${str.monthlyRevenue} vs calculated $${calculatedMonthly.toFixed(2)}`
          );
        }
      }

    } catch (error) {
      validation.passed = false;
      validation.errors.push(`STR validation error: ${error.message}`);
    }

    this.results.push(validation);
    return validation;
  }

  /**
   * Validate API performance metrics
   */
  validatePerformance(metrics) {
    const validation = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      passed: true,
      warnings: []
    };

    // API response time
    if (metrics.apiResponseTime > 30000) {
      validation.warnings.push(`API response time (${metrics.apiResponseTime}ms) exceeds 30 seconds`);
    }

    // Page load time
    if (metrics.pageLoadTime > 5000) {
      validation.warnings.push(`Page load time (${metrics.pageLoadTime}ms) exceeds 5 seconds`);
    }

    // Time to interactive
    if (metrics.timeToInteractive > 3000) {
      validation.warnings.push(`Time to interactive (${metrics.timeToInteractive}ms) exceeds 3 seconds`);
    }

    return validation;
  }

  /**
   * Helper to get nested object value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate validation summary
   */
  generateSummary() {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      warnings: this.results.reduce((sum, r) => sum + (r.warnings?.length || 0), 0),
      errors: this.results.reduce((sum, r) => sum + (r.errors?.length || 0), 0),
      results: this.results
    };

    // Calculate pass rate
    summary.passRate = summary.total > 0 ? 
      ((summary.passed / summary.total) * 100).toFixed(1) : 0;

    // Group errors by type
    summary.errorsByType = {};
    this.results.forEach(result => {
      result.errors?.forEach(error => {
        const type = error.split(':')[0];
        summary.errorsByType[type] = (summary.errorsByType[type] || 0) + 1;
      });
    });

    return summary;
  }
}

module.exports = APIValidator;