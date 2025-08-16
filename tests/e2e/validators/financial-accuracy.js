/**
 * Financial Accuracy Validator
 * Validates all financial calculations for accuracy and consistency
 */

class FinancialAccuracyValidator {
  constructor() {
    this.tolerance = {
      exact: 0.01,      // $0.01 tolerance for simple arithmetic
      calculated: 0.005, // 0.5% tolerance for complex calculations
      estimated: 0.02   // 2% tolerance for market-based estimates
    };
    
    this.validationResults = [];
    this.errors = [];
  }

  /**
   * Validate monthly cash flow calculation
   */
  validateCashFlow(data) {
    const {
      rentalIncome,
      mortgage,
      propertyTax,
      insurance,
      hoaFees,
      management,
      maintenance,
      utilities,
      vacancy
    } = data;

    // Calculate expected cash flow
    const grossIncome = rentalIncome;
    const effectiveIncome = grossIncome * (1 - (vacancy || 0.05)); // 5% default vacancy
    
    const totalExpenses = (
      (mortgage || 0) +
      (propertyTax || 0) +
      (insurance || 0) +
      (hoaFees || 0) +
      (management || rentalIncome * 0.08) + // 8% default management
      (maintenance || rentalIncome * 0.05) + // 5% default maintenance
      (utilities || 0)
    );
    
    const expectedCashFlow = effectiveIncome - totalExpenses;
    const actualCashFlow = data.cashFlow;
    
    const difference = Math.abs(expectedCashFlow - actualCashFlow);
    const percentDiff = (difference / Math.abs(expectedCashFlow)) * 100;
    
    const passed = difference <= this.tolerance.exact || percentDiff <= this.tolerance.calculated * 100;
    
    this.validationResults.push({
      type: 'cash_flow',
      expected: expectedCashFlow,
      actual: actualCashFlow,
      difference,
      percentDiff,
      passed,
      message: passed 
        ? 'Cash flow calculation accurate' 
        : `Cash flow off by $${difference.toFixed(2)} (${percentDiff.toFixed(2)}%)`
    });
    
    return passed;
  }

  /**
   * Validate cap rate calculation
   */
  validateCapRate(data) {
    const { noi, purchasePrice, capRate } = data;
    
    if (!noi || !purchasePrice) {
      this.errors.push('Missing NOI or purchase price for cap rate calculation');
      return false;
    }
    
    const expectedCapRate = (noi / purchasePrice) * 100;
    const actualCapRate = capRate;
    
    const difference = Math.abs(expectedCapRate - actualCapRate);
    const passed = difference <= this.tolerance.calculated * 100;
    
    this.validationResults.push({
      type: 'cap_rate',
      expected: expectedCapRate,
      actual: actualCapRate,
      difference,
      passed,
      message: passed
        ? 'Cap rate calculation accurate'
        : `Cap rate off by ${difference.toFixed(2)}%`
    });
    
    return passed;
  }

  /**
   * Validate ROI calculation
   */
  validateROI(data) {
    const {
      annualCashFlow,
      appreciation,
      initialInvestment,
      roi
    } = data;
    
    const appreciationAmount = (data.purchasePrice || 0) * (appreciation || 0.032); // 3.2% default
    const totalReturn = (annualCashFlow || 0) + appreciationAmount;
    const expectedROI = (totalReturn / initialInvestment) * 100;
    const actualROI = roi;
    
    const difference = Math.abs(expectedROI - actualROI);
    const passed = difference <= this.tolerance.calculated * 100;
    
    this.validationResults.push({
      type: 'roi',
      expected: expectedROI,
      actual: actualROI,
      difference,
      passed,
      message: passed
        ? 'ROI calculation accurate'
        : `ROI off by ${difference.toFixed(2)}%`
    });
    
    return passed;
  }

  /**
   * Validate mortgage payment calculation
   */
  validateMortgagePayment(data) {
    const {
      loanAmount,
      interestRate,
      loanTerm,
      mortgagePayment
    } = data;
    
    // Monthly interest rate
    const monthlyRate = (interestRate || 0.065) / 12;
    const numPayments = (loanTerm || 30) * 12;
    
    // Calculate monthly payment using standard formula
    const expectedPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const actualPayment = mortgagePayment;
    
    const difference = Math.abs(expectedPayment - actualPayment);
    const passed = difference <= this.tolerance.exact;
    
    this.validationResults.push({
      type: 'mortgage_payment',
      expected: expectedPayment,
      actual: actualPayment,
      difference,
      passed,
      message: passed
        ? 'Mortgage calculation accurate'
        : `Mortgage payment off by $${difference.toFixed(2)}`
    });
    
    return passed;
  }

  /**
   * Validate STR revenue calculations
   */
  validateSTRRevenue(data) {
    const {
      nightlyRate,
      occupancyRate,
      strMonthlyRevenue,
      strAnnualRevenue
    } = data;
    
    const daysPerMonth = 30.4; // Average days per month
    const expectedMonthly = nightlyRate * occupancyRate * daysPerMonth;
    const expectedAnnual = expectedMonthly * 12;
    
    const monthlyDiff = Math.abs(expectedMonthly - strMonthlyRevenue);
    const annualDiff = Math.abs(expectedAnnual - strAnnualRevenue);
    
    const monthlyPassed = monthlyDiff <= this.tolerance.calculated * expectedMonthly;
    const annualPassed = annualDiff <= this.tolerance.calculated * expectedAnnual;
    
    this.validationResults.push({
      type: 'str_revenue',
      expected: { monthly: expectedMonthly, annual: expectedAnnual },
      actual: { monthly: strMonthlyRevenue, annual: strAnnualRevenue },
      difference: { monthly: monthlyDiff, annual: annualDiff },
      passed: monthlyPassed && annualPassed,
      message: monthlyPassed && annualPassed
        ? 'STR revenue calculations accurate'
        : `STR revenue off by $${monthlyDiff.toFixed(2)}/mo, $${annualDiff.toFixed(2)}/yr`
    });
    
    return monthlyPassed && annualPassed;
  }

  /**
   * Validate Canadian tax calculations
   */
  validateCanadianTaxes(data) {
    const {
      purchasePrice,
      propertyTaxRate,
      propertyTax,
      province
    } = data;
    
    // Property tax rates by province (approximate)
    const taxRates = {
      'ON': 0.0125, // Ontario ~1.25%
      'BC': 0.0035, // British Columbia ~0.35%
      'AB': 0.0065, // Alberta ~0.65%
      'QC': 0.0095, // Quebec ~0.95%
      'default': 0.01 // 1% default
    };
    
    const expectedRate = propertyTaxRate || taxRates[province] || taxRates.default;
    const expectedTax = purchasePrice * expectedRate;
    const actualTax = propertyTax * 12; // Convert monthly to annual
    
    const difference = Math.abs(expectedTax - actualTax);
    const percentDiff = (difference / expectedTax) * 100;
    const passed = percentDiff <= this.tolerance.estimated * 100;
    
    this.validationResults.push({
      type: 'property_tax',
      expected: expectedTax,
      actual: actualTax,
      difference,
      percentDiff,
      passed,
      message: passed
        ? 'Property tax calculation accurate'
        : `Property tax off by $${difference.toFixed(2)} (${percentDiff.toFixed(2)}%)`
    });
    
    return passed;
  }

  /**
   * Validate break-even occupancy for STR
   */
  validateBreakEvenOccupancy(data) {
    const {
      nightlyRate,
      totalMonthlyExpenses,
      breakEvenOccupancy
    } = data;
    
    const daysPerMonth = 30.4;
    const maxRevenue = nightlyRate * daysPerMonth;
    const expectedBreakEven = totalMonthlyExpenses / maxRevenue;
    const actualBreakEven = breakEvenOccupancy;
    
    const difference = Math.abs(expectedBreakEven - actualBreakEven);
    const passed = difference <= this.tolerance.calculated;
    
    this.validationResults.push({
      type: 'break_even_occupancy',
      expected: expectedBreakEven,
      actual: actualBreakEven,
      difference,
      passed,
      message: passed
        ? 'Break-even occupancy accurate'
        : `Break-even off by ${(difference * 100).toFixed(2)}%`
    });
    
    return passed;
  }

  /**
   * Validate all financial calculations
   */
  async validateAll(analysisData) {
    const results = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      accuracy: 0,
      details: []
    };
    
    // Extract data from analysis
    const financialData = this.extractFinancialData(analysisData);
    
    // Run all validations
    const validations = [
      () => this.validateCashFlow(financialData),
      () => this.validateCapRate(financialData),
      () => this.validateROI(financialData),
      () => this.validateMortgagePayment(financialData),
      () => this.validateSTRRevenue(financialData),
      () => this.validateCanadianTaxes(financialData),
      () => this.validateBreakEvenOccupancy(financialData)
    ];
    
    for (const validate of validations) {
      try {
        const passed = validate();
        results.totalTests++;
        if (passed) {
          results.passed++;
        } else {
          results.failed++;
        }
      } catch (error) {
        this.errors.push(`Validation error: ${error.message}`);
        results.failed++;
        results.totalTests++;
      }
    }
    
    results.accuracy = (results.passed / results.totalTests) * 100;
    results.details = this.validationResults;
    results.errors = this.errors;
    
    return results;
  }

  /**
   * Extract financial data from analysis response
   */
  extractFinancialData(analysis) {
    // Handle different data structures (snake_case vs camelCase)
    return {
      // Property details
      purchasePrice: analysis.purchase_price || analysis.purchasePrice || analysis.price,
      province: analysis.province || 'ON',
      
      // Income
      rentalIncome: analysis.monthly_rent || analysis.monthlyRent || 
                   analysis.long_term_rental?.monthly_rent || 
                   analysis.longTermRental?.monthlyRent,
      nightlyRate: analysis.str_nightly_rate || analysis.strNightlyRate ||
                  analysis.short_term_rental?.nightly_rate ||
                  analysis.shortTermRental?.nightlyRate,
      occupancyRate: analysis.str_occupancy || analysis.strOccupancy ||
                    analysis.short_term_rental?.occupancy_rate ||
                    analysis.shortTermRental?.occupancyRate || 0.75,
      strMonthlyRevenue: analysis.str_monthly_revenue || analysis.strMonthlyRevenue ||
                        analysis.short_term_rental?.monthly_revenue ||
                        analysis.shortTermRental?.monthlyRevenue,
      strAnnualRevenue: analysis.str_annual_revenue || analysis.strAnnualRevenue ||
                       analysis.short_term_rental?.annual_revenue ||
                       analysis.shortTermRental?.annualRevenue,
      
      // Expenses
      mortgage: analysis.monthly_mortgage || analysis.monthlyMortgage,
      propertyTax: analysis.property_tax || analysis.propertyTax,
      insurance: analysis.insurance || 250, // Default $250/month
      hoaFees: analysis.hoa_fees || analysis.hoaFees || analysis.condo_fees || analysis.condoFees,
      management: analysis.management_fee || analysis.managementFee,
      maintenance: analysis.maintenance || 0,
      utilities: analysis.utilities || 0,
      vacancy: analysis.vacancy_rate || analysis.vacancyRate || 0.05,
      
      // Financial metrics
      cashFlow: analysis.monthly_cash_flow || analysis.monthlyCashFlow ||
               analysis.cash_flow || analysis.cashFlow,
      noi: analysis.noi || analysis.net_operating_income || analysis.netOperatingIncome,
      capRate: analysis.cap_rate || analysis.capRate,
      roi: analysis.roi || analysis.annual_roi || analysis.annualROI,
      annualCashFlow: analysis.annual_cash_flow || analysis.annualCashFlow,
      
      // Loan details
      loanAmount: analysis.loan_amount || analysis.loanAmount,
      interestRate: analysis.interest_rate || analysis.interestRate || 0.065,
      loanTerm: analysis.loan_term || analysis.loanTerm || 30,
      mortgagePayment: analysis.mortgage_payment || analysis.mortgagePayment ||
                      analysis.monthly_mortgage || analysis.monthlyMortgage,
      
      // Investment details
      downPayment: analysis.down_payment || analysis.downPayment,
      initialInvestment: analysis.initial_investment || analysis.initialInvestment ||
                        analysis.down_payment || analysis.downPayment,
      appreciation: analysis.appreciation_rate || analysis.appreciationRate || 0.032,
      
      // Other metrics
      totalMonthlyExpenses: analysis.total_monthly_expenses || analysis.totalMonthlyExpenses,
      breakEvenOccupancy: analysis.break_even_occupancy || analysis.breakEvenOccupancy,
      propertyTaxRate: analysis.property_tax_rate || analysis.propertyTaxRate
    };
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const summary = {
      totalValidations: this.validationResults.length,
      passed: this.validationResults.filter(r => r.passed).length,
      failed: this.validationResults.filter(r => !r.passed).length,
      accuracy: 0,
      criticalIssues: [],
      recommendations: []
    };
    
    summary.accuracy = (summary.passed / summary.totalValidations) * 100;
    
    // Identify critical issues
    this.validationResults.forEach(result => {
      if (!result.passed) {
        if (result.percentDiff > 5) {
          summary.criticalIssues.push({
            type: result.type,
            severity: 'high',
            message: result.message
          });
        }
      }
    });
    
    // Generate recommendations
    if (summary.accuracy < 95) {
      summary.recommendations.push('Review calculation formulas for accuracy');
    }
    if (summary.criticalIssues.length > 0) {
      summary.recommendations.push('Address critical calculation errors immediately');
    }
    
    return {
      summary,
      details: this.validationResults,
      errors: this.errors,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = FinancialAccuracyValidator;