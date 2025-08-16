/**
 * Data Consistency Checker
 * Validates data consistency across all sections and formats
 */

class DataConsistencyChecker {
  constructor() {
    this.inconsistencies = [];
    this.validationResults = [];
    this.dataPoints = new Map();
  }

  /**
   * Check currency formatting consistency
   */
  checkCurrencyFormatting(elements) {
    const currencyRegex = /^\$[\d,]+(\.\d{2})?$/;
    const results = [];
    
    elements.forEach(element => {
      const { value, location, raw } = element;
      
      // Check if it matches standard currency format
      const isValidFormat = currencyRegex.test(value);
      
      // Check for consistent decimal places
      const hasDecimals = value.includes('.');
      const decimalPlaces = hasDecimals ? value.split('.')[1].length : 0;
      
      // Check for proper comma placement
      const numberPart = value.replace(/[$,]/g, '');
      const expectedWithCommas = this.formatCurrency(parseFloat(numberPart));
      const hasCorrectCommas = value === expectedWithCommas;
      
      results.push({
        location,
        value,
        raw,
        isValidFormat,
        hasCorrectCommas,
        decimalPlaces,
        passed: isValidFormat && hasCorrectCommas
      });
      
      if (!isValidFormat || !hasCorrectCommas) {
        this.inconsistencies.push({
          type: 'currency_format',
          location,
          value,
          expected: expectedWithCommas,
          message: `Inconsistent currency format at ${location}`
        });
      }
    });
    
    return results;
  }

  /**
   * Format currency properly
   */
  formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Check number precision consistency
   */
  checkNumberPrecision(elements) {
    const precisionMap = {
      percentage: 1,    // 5.5%
      currency: 2,      // $1,234.56
      squareFeet: 0,    // 1,500 sq ft
      years: 0,         // 2015
      bedrooms: 0,      // 3
      monthlyValues: 0  // For display purposes
    };
    
    const results = [];
    
    elements.forEach(element => {
      const { value, type, location } = element;
      const expectedPrecision = precisionMap[type];
      
      if (expectedPrecision !== undefined) {
        const actualPrecision = this.getDecimalPlaces(value);
        const passed = actualPrecision === expectedPrecision;
        
        results.push({
          location,
          type,
          value,
          expectedPrecision,
          actualPrecision,
          passed
        });
        
        if (!passed) {
          this.inconsistencies.push({
            type: 'number_precision',
            location,
            value,
            expected: `${expectedPrecision} decimal places`,
            actual: `${actualPrecision} decimal places`,
            message: `Incorrect precision for ${type} at ${location}`
          });
        }
      }
    });
    
    return results;
  }

  /**
   * Get decimal places in a number
   */
  getDecimalPlaces(value) {
    const numStr = value.toString().replace(/[^0-9.]/g, '');
    if (!numStr.includes('.')) return 0;
    return numStr.split('.')[1].length;
  }

  /**
   * Check date formatting consistency
   */
  checkDateFormatting(elements) {
    const dateFormats = {
      'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
      'MM/DD/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
      'Month DD, YYYY': /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/,
      'DD Month YYYY': /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/
    };
    
    const formatCounts = {};
    const results = [];
    
    elements.forEach(element => {
      const { value, location } = element;
      let matchedFormat = null;
      
      for (const [format, regex] of Object.entries(dateFormats)) {
        if (regex.test(value)) {
          matchedFormat = format;
          formatCounts[format] = (formatCounts[format] || 0) + 1;
          break;
        }
      }
      
      results.push({
        location,
        value,
        format: matchedFormat,
        passed: matchedFormat !== null
      });
      
      if (!matchedFormat) {
        this.inconsistencies.push({
          type: 'date_format',
          location,
          value,
          message: `Unrecognized date format at ${location}`
        });
      }
    });
    
    // Check if multiple formats are used
    const formatsUsed = Object.keys(formatCounts);
    if (formatsUsed.length > 1) {
      this.inconsistencies.push({
        type: 'date_format_inconsistency',
        formats: formatsUsed,
        counts: formatCounts,
        message: 'Multiple date formats used across the application'
      });
    }
    
    return results;
  }

  /**
   * Verify data consistency across sections
   */
  verifyDataAcrossSections(sections) {
    const dataMap = new Map();
    const results = [];
    
    // Collect all data points
    sections.forEach(section => {
      const { name, data } = section;
      
      Object.entries(data).forEach(([key, value]) => {
        if (!dataMap.has(key)) {
          dataMap.set(key, []);
        }
        dataMap.get(key).push({
          section: name,
          value
        });
      });
    });
    
    // Check for inconsistencies
    dataMap.forEach((occurrences, key) => {
      if (occurrences.length > 1) {
        const values = occurrences.map(o => o.value);
        const uniqueValues = [...new Set(values)];
        
        if (uniqueValues.length > 1) {
          // Data inconsistency found
          const inconsistency = {
            dataPoint: key,
            occurrences,
            uniqueValues,
            passed: false
          };
          
          results.push(inconsistency);
          
          this.inconsistencies.push({
            type: 'data_mismatch',
            dataPoint: key,
            values: occurrences,
            message: `Data mismatch for ${key} across sections`
          });
        } else {
          // Data is consistent
          results.push({
            dataPoint: key,
            value: uniqueValues[0],
            occurrences: occurrences.length,
            passed: true
          });
        }
      }
    });
    
    return results;
  }

  /**
   * Check property data consistency
   */
  checkPropertyData(propertyData, displayedData) {
    const criticalFields = [
      'address',
      'price',
      'bedrooms',
      'bathrooms',
      'squareFeet',
      'yearBuilt',
      'propertyType'
    ];
    
    const results = [];
    
    criticalFields.forEach(field => {
      const sourceValue = this.normalizeValue(propertyData[field]);
      const displayValue = this.normalizeValue(displayedData[field]);
      
      const passed = sourceValue === displayValue;
      
      results.push({
        field,
        source: sourceValue,
        displayed: displayValue,
        passed
      });
      
      if (!passed && sourceValue && displayValue) {
        this.inconsistencies.push({
          type: 'property_data_mismatch',
          field,
          source: sourceValue,
          displayed: displayValue,
          message: `Property ${field} mismatch`
        });
      }
    });
    
    return results;
  }

  /**
   * Normalize value for comparison
   */
  normalizeValue(value) {
    if (value === null || value === undefined) return null;
    
    // Convert to string and trim
    let normalized = value.toString().trim();
    
    // Remove currency symbols and commas for numbers
    if (typeof value === 'number' || /^\$?[\d,]+\.?\d*$/.test(normalized)) {
      normalized = normalized.replace(/[$,]/g, '');
      return parseFloat(normalized);
    }
    
    // Lowercase for text comparison
    return normalized.toLowerCase();
  }

  /**
   * Check calculation relationships
   */
  checkCalculationRelationships(data) {
    const relationships = [
      {
        name: 'STR vs LTR Revenue',
        check: () => {
          const strRevenue = data.strMonthlyRevenue || 0;
          const ltrRevenue = data.ltrMonthlyRent || 0;
          const strRestricted = data.strRestricted || false;
          
          // STR should typically be higher than LTR (unless restricted)
          if (!strRestricted && strRevenue > 0 && ltrRevenue > 0) {
            return strRevenue >= ltrRevenue * 1.5; // STR should be at least 1.5x LTR
          }
          return true;
        },
        message: 'STR revenue should be significantly higher than LTR'
      },
      {
        name: 'Operating Expenses Range',
        check: () => {
          const revenue = data.monthlyRevenue || data.monthlyRent || 0;
          const expenses = data.operatingExpenses || 0;
          const ratio = expenses / revenue;
          
          // Operating expenses typically 15-30% of revenue
          return ratio >= 0.15 && ratio <= 0.40;
        },
        message: 'Operating expenses should be 15-40% of revenue'
      },
      {
        name: 'Property Tax Range',
        check: () => {
          const propertyValue = data.purchasePrice || 0;
          const annualTax = (data.propertyTax || 0) * 12;
          const taxRate = annualTax / propertyValue;
          
          // Property tax typically 0.5-2% of property value
          return taxRate >= 0.005 && taxRate <= 0.02;
        },
        message: 'Property tax should be 0.5-2% of property value'
      },
      {
        name: 'Cash Flow Sanity',
        check: () => {
          const income = data.monthlyIncome || 0;
          const expenses = data.monthlyExpenses || 0;
          const cashFlow = data.monthlyCashFlow || 0;
          const calculated = income - expenses;
          
          // Cash flow should equal income minus expenses
          return Math.abs(calculated - cashFlow) < 10; // $10 tolerance
        },
        message: 'Cash flow should equal income minus expenses'
      }
    ];
    
    const results = [];
    
    relationships.forEach(relationship => {
      try {
        const passed = relationship.check();
        results.push({
          name: relationship.name,
          passed,
          message: relationship.message
        });
        
        if (!passed) {
          this.inconsistencies.push({
            type: 'relationship_violation',
            name: relationship.name,
            message: relationship.message
          });
        }
      } catch (error) {
        results.push({
          name: relationship.name,
          passed: false,
          error: error.message
        });
      }
    });
    
    return results;
  }

  /**
   * Validate units consistency
   */
  checkUnitsConsistency(elements) {
    const unitStandards = {
      area: ['sq ft', 'sqft', 'square feet'],
      currency: ['$', 'CAD', 'USD'],
      percentage: ['%'],
      time: ['month', 'year', 'annually', 'monthly'],
      count: ['bedrooms', 'bathrooms', 'BR', 'BA']
    };
    
    const unitsUsed = {};
    const results = [];
    
    elements.forEach(element => {
      const { value, type, location } = element;
      const category = this.categorizeUnit(value);
      
      if (category) {
        if (!unitsUsed[category]) {
          unitsUsed[category] = new Set();
        }
        
        const unit = this.extractUnit(value);
        unitsUsed[category].add(unit);
        
        results.push({
          location,
          category,
          unit,
          value
        });
      }
    });
    
    // Check for inconsistent units
    Object.entries(unitsUsed).forEach(([category, units]) => {
      if (units.size > 1) {
        this.inconsistencies.push({
          type: 'unit_inconsistency',
          category,
          unitsFound: Array.from(units),
          message: `Inconsistent units for ${category}`
        });
      }
    });
    
    return results;
  }

  /**
   * Categorize unit type
   */
  categorizeUnit(value) {
    const str = value.toString();
    if (str.includes('sq') || str.includes('square')) return 'area';
    if (str.includes('$') || str.includes('CAD')) return 'currency';
    if (str.includes('%')) return 'percentage';
    if (str.includes('month') || str.includes('year')) return 'time';
    if (str.includes('bedroom') || str.includes('BR')) return 'count';
    return null;
  }

  /**
   * Extract unit from value
   */
  extractUnit(value) {
    const str = value.toString();
    if (str.includes('sq ft')) return 'sq ft';
    if (str.includes('sqft')) return 'sqft';
    if (str.includes('square feet')) return 'square feet';
    if (str.includes('$')) return '$';
    if (str.includes('%')) return '%';
    if (str.includes('monthly')) return 'monthly';
    if (str.includes('annually')) return 'annually';
    return str;
  }

  /**
   * Run all consistency checks
   */
  async checkAll(pageData, pdfData) {
    const results = {
      timestamp: new Date().toISOString(),
      totalChecks: 0,
      passed: 0,
      failed: 0,
      consistency: 0,
      inconsistencies: [],
      details: {}
    };
    
    // Run all checks
    const checks = [
      {
        name: 'currency_formatting',
        fn: () => this.checkCurrencyFormatting(pageData.currencyElements || [])
      },
      {
        name: 'number_precision',
        fn: () => this.checkNumberPrecision(pageData.numberElements || [])
      },
      {
        name: 'date_formatting',
        fn: () => this.checkDateFormatting(pageData.dateElements || [])
      },
      {
        name: 'data_across_sections',
        fn: () => this.verifyDataAcrossSections(pageData.sections || [])
      },
      {
        name: 'property_data',
        fn: () => this.checkPropertyData(pageData.property || {}, pageData.displayed || {})
      },
      {
        name: 'calculation_relationships',
        fn: () => this.checkCalculationRelationships(pageData.calculations || {})
      },
      {
        name: 'units_consistency',
        fn: () => this.checkUnitsConsistency(pageData.unitElements || [])
      }
    ];
    
    for (const check of checks) {
      try {
        const checkResults = check.fn();
        results.details[check.name] = checkResults;
        
        // Count passed/failed
        const passed = checkResults.filter(r => r.passed).length;
        const total = checkResults.length;
        
        results.totalChecks += total;
        results.passed += passed;
        results.failed += (total - passed);
        
      } catch (error) {
        results.details[check.name] = { error: error.message };
        results.failed++;
        results.totalChecks++;
      }
    }
    
    // Compare with PDF data if provided
    if (pdfData) {
      const pdfComparison = this.comparePDFData(pageData, pdfData);
      results.details.pdf_comparison = pdfComparison;
      results.totalChecks += pdfComparison.length;
      results.passed += pdfComparison.filter(r => r.passed).length;
      results.failed += pdfComparison.filter(r => !r.passed).length;
    }
    
    results.consistency = (results.passed / results.totalChecks) * 100;
    results.inconsistencies = this.inconsistencies;
    
    return results;
  }

  /**
   * Compare page data with PDF data
   */
  comparePDFData(pageData, pdfData) {
    const comparisons = [];
    
    // Compare key values
    const keysToCompare = [
      'propertyAddress',
      'purchasePrice',
      'monthlyRent',
      'cashFlow',
      'roi',
      'capRate'
    ];
    
    keysToCompare.forEach(key => {
      const pageValue = this.normalizeValue(pageData[key]);
      const pdfValue = this.normalizeValue(pdfData[key]);
      
      const passed = pageValue === pdfValue;
      
      comparisons.push({
        field: key,
        pageValue,
        pdfValue,
        passed
      });
      
      if (!passed && pageValue !== null && pdfValue !== null) {
        this.inconsistencies.push({
          type: 'pdf_data_mismatch',
          field: key,
          pageValue,
          pdfValue,
          message: `PDF data mismatch for ${key}`
        });
      }
    });
    
    return comparisons;
  }

  /**
   * Generate consistency report
   */
  generateReport() {
    const summary = {
      totalInconsistencies: this.inconsistencies.length,
      byType: {},
      criticalIssues: [],
      recommendations: []
    };
    
    // Group inconsistencies by type
    this.inconsistencies.forEach(issue => {
      if (!summary.byType[issue.type]) {
        summary.byType[issue.type] = 0;
      }
      summary.byType[issue.type]++;
      
      // Mark critical issues
      if (issue.type === 'data_mismatch' || issue.type === 'property_data_mismatch') {
        summary.criticalIssues.push(issue);
      }
    });
    
    // Generate recommendations
    if (summary.byType.currency_format > 0) {
      summary.recommendations.push('Standardize currency formatting across all sections');
    }
    if (summary.byType.date_format_inconsistency > 0) {
      summary.recommendations.push('Use consistent date format throughout the application');
    }
    if (summary.byType.data_mismatch > 0) {
      summary.recommendations.push('Ensure data is synchronized across all display sections');
    }
    if (summary.byType.pdf_data_mismatch > 0) {
      summary.recommendations.push('Verify PDF generation uses the same data as the web display');
    }
    
    return {
      summary,
      inconsistencies: this.inconsistencies,
      validationResults: this.validationResults,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DataConsistencyChecker;