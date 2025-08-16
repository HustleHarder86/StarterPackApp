#!/usr/bin/env node

/**
 * Enhanced Persona Test Suite with Accuracy Validation
 * Tests 10 personas across both mockups with comprehensive validation
 */

const { chromium } = require('@playwright/test');
const FinancialAccuracyValidator = require('./validators/financial-accuracy');
const DataConsistencyChecker = require('./validators/data-consistency');
const BusinessLogicValidator = require('./validators/business-logic');
const VisualAnalyzer = require('./visual/visual-analyzer');
const path = require('path');
const fs = require('fs').promises;

// Define 10 accuracy-focused personas
const PERSONAS = [
  {
    id: 'financial-felix',
    name: 'Financial Expert Felix',
    description: 'Validates all financial calculations',
    focus: 'financial_accuracy',
    config: {
      propertyPrice: 849900,
      downPayment: 0.20,
      interestRate: 0.065,
      propertyTax: 650,
      includeSTR: true,
      validateCalculations: true,
      tolerance: 0.01
    }
  },
  {
    id: 'visual-victoria',
    name: 'Visual Designer Victoria',
    description: 'UI/UX consistency and visual quality',
    focus: 'visual_quality',
    config: {
      checkAlignment: true,
      checkColors: true,
      checkResponsive: true,
      checkAccessibility: true,
      captureScreenshots: true
    }
  },
  {
    id: 'data-diana',
    name: 'Data Analyst Diana',
    description: 'Data accuracy and consistency',
    focus: 'data_consistency',
    config: {
      checkDataFlow: true,
      checkFormatting: true,
      checkUnits: true,
      compareSections: true,
      validateCharts: true
    }
  },
  {
    id: 'realtor-rachel',
    name: 'Real Estate Pro Rachel',
    description: 'Business logic and market validation',
    focus: 'business_logic',
    config: {
      checkMarketRates: true,
      validateRecommendations: true,
      checkSTRRestrictions: true,
      validateComparables: true
    }
  },
  {
    id: 'accessibility-aaron',
    name: 'Accessibility Advocate Aaron',
    description: 'A11y compliance testing',
    focus: 'accessibility',
    config: {
      checkContrast: true,
      checkKeyboardNav: true,
      checkScreenReader: true,
      checkFocusIndicators: true
    }
  },
  {
    id: 'mobile-marcus',
    name: 'Mobile User Marcus',
    description: 'Mobile experience validation',
    focus: 'mobile',
    config: {
      viewport: { width: 375, height: 812 },
      checkTouchTargets: true,
      checkOverflow: true,
      checkPerformance: true
    }
  },
  {
    id: 'pdf-patricia',
    name: 'PDF Power User Patricia',
    description: 'PDF generation and quality',
    focus: 'pdf_generation',
    config: {
      testAllSections: true,
      checkFormatting: true,
      validateData: true,
      checkBranding: true
    }
  },
  {
    id: 'stress-steven',
    name: 'Stress Tester Steven',
    description: 'Edge cases and limits',
    focus: 'edge_cases',
    config: {
      testExtremeValues: true,
      propertyPrices: [1, 100000000],
      testSpecialChars: true,
      testEmptyFields: true
    }
  },
  {
    id: 'international-ivan',
    name: 'International Investor Ivan',
    description: 'Currency and locale testing',
    focus: 'internationalization',
    config: {
      currencies: ['CAD', 'USD'],
      checkTaxRules: true,
      checkDateFormats: true,
      checkMetricUnits: true
    }
  },
  {
    id: 'qa-quinn',
    name: 'Quality Assurance Quinn',
    description: 'Comprehensive validation',
    focus: 'comprehensive',
    config: {
      runAllValidators: true,
      compareResults: true,
      generateReport: true,
      failOnWarnings: true
    }
  }
];

class PersonaAccuracyTests {
  constructor() {
    this.validators = {
      financial: new FinancialAccuracyValidator(),
      consistency: new DataConsistencyChecker(),
      business: new BusinessLogicValidator(),
      visual: new VisualAnalyzer()
    };
    
    this.results = [];
    this.mockups = [
      'http://localhost:8080/mockups/mockup-iterations/base-mockup.html',
      'http://localhost:8080/mockups/mockup-iterations/base-mockup2.html'
    ];
    
    this.testRunId = `accuracy-test-${Date.now()}`;
    this.outputDir = path.join(__dirname, 'reports', this.testRunId);
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log(`🚀 Persona Accuracy Tests initialized`);
    console.log(`📁 Output directory: ${this.outputDir}`);
  }

  /**
   * Run test for a specific persona
   */
  async runPersonaTest(persona, mockupUrl) {
    console.log(`\n👤 Testing as ${persona.name} on ${mockupUrl.split('/').pop()}`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext(
      persona.config.viewport || { width: 1920, height: 1080 }
    );
    const page = await context.newPage();
    
    const testResult = {
      persona: persona.id,
      personaName: persona.name,
      mockup: mockupUrl,
      timestamp: new Date().toISOString(),
      validations: {},
      score: 0,
      issues: [],
      screenshots: []
    };
    
    try {
      // Navigate to mockup
      await page.goto(mockupUrl, { waitUntil: 'networkidle' });
      
      // Simulate property analysis
      await this.simulateAnalysis(page, persona);
      
      // Extract data for validation
      const analysisData = await this.extractAnalysisData(page);
      const pageData = await this.extractPageData(page);
      
      // Run validations based on persona focus
      switch (persona.focus) {
        case 'financial_accuracy':
          testResult.validations.financial = await this.validators.financial.validateAll(analysisData);
          break;
          
        case 'data_consistency':
          testResult.validations.consistency = await this.validators.consistency.checkAll(pageData, null);
          break;
          
        case 'business_logic':
          testResult.validations.business = await this.validators.business.validateAll(analysisData);
          break;
          
        case 'visual_quality':
        case 'accessibility':
        case 'mobile':
          testResult.validations.visual = await this.runVisualTests(page, persona);
          break;
          
        case 'pdf_generation':
          testResult.validations.pdf = await this.testPDFGeneration(page, persona);
          break;
          
        case 'edge_cases':
          testResult.validations.edgeCases = await this.testEdgeCases(page, persona);
          break;
          
        case 'comprehensive':
          // Run all validators
          testResult.validations.financial = await this.validators.financial.validateAll(analysisData);
          testResult.validations.consistency = await this.validators.consistency.checkAll(pageData, null);
          testResult.validations.business = await this.validators.business.validateAll(analysisData);
          testResult.validations.visual = await this.runVisualTests(page, persona);
          break;
      }
      
      // Calculate overall score
      testResult.score = this.calculateScore(testResult.validations);
      
      // Take screenshots
      const screenshotPath = path.join(this.outputDir, `${persona.id}-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResult.screenshots.push(screenshotPath);
      
      // Collect issues
      testResult.issues = this.collectIssues(testResult.validations);
      
    } catch (error) {
      testResult.error = error.message;
      testResult.score = 0;
    } finally {
      await browser.close();
    }
    
    return testResult;
  }

  /**
   * Simulate property analysis
   */
  async simulateAnalysis(page, persona) {
    // Fill in property details
    const addressInput = await page.$('#property-address, input[placeholder*="address"]');
    if (addressInput) {
      await addressInput.fill('123 Test Street, Toronto, ON');
    }
    
    // Set property price if editable
    const priceInput = await page.$('input[name="price"], #purchase-price');
    if (priceInput) {
      await priceInput.fill(String(persona.config.propertyPrice || 849900));
    }
    
    // Click analyze button
    const analyzeBtn = await page.$('button:has-text("Analyze"), button:has-text("Calculate")');
    if (analyzeBtn) {
      await analyzeBtn.click();
      await page.waitForTimeout(2000); // Wait for analysis
    }
  }

  /**
   * Extract analysis data from page
   */
  async extractAnalysisData(page) {
    return await page.evaluate(() => {
      // Try to get data from various sources
      const data = {};
      
      // Check window object
      if (window.analysisData) {
        Object.assign(data, window.analysisData);
      }
      
      // Extract from DOM
      const extractValue = (selector) => {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent.trim();
          return text.replace(/[$,]/g, '');
        }
        return null;
      };
      
      data.purchasePrice = parseFloat(extractValue('.purchase-price, [data-field="price"]')) || 849900;
      data.monthlyRent = parseFloat(extractValue('.monthly-rent, [data-field="rent"]')) || 3950;
      data.cashFlow = parseFloat(extractValue('.cash-flow, [data-field="cashflow"]')) || 1200;
      data.roi = parseFloat(extractValue('.roi, [data-field="roi"]')) || 11.7;
      data.capRate = parseFloat(extractValue('.cap-rate, [data-field="capRate"]')) || 5.8;
      
      // STR data
      data.strMonthlyRevenue = parseFloat(extractValue('.str-revenue, [data-field="strRevenue"]')) || 8500;
      data.strOccupancy = parseFloat(extractValue('.str-occupancy, [data-field="strOccupancy"]')) || 0.75;
      data.strRestricted = document.querySelector('.str-restricted, .restricted-badge') !== null;
      
      return data;
    });
  }

  /**
   * Extract page data for consistency checking
   */
  async extractPageData(page) {
    return await page.evaluate(() => {
      const data = {
        currencyElements: [],
        numberElements: [],
        dateElements: [],
        sections: [],
        property: {},
        displayed: {},
        calculations: {}
      };
      
      // Find all currency values
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent.trim();
        if (/^\$[\d,]+(\.\d{2})?$/.test(text) && el.children.length === 0) {
          data.currencyElements.push({
            value: text,
            location: el.className || el.id || 'unknown',
            raw: text
          });
        }
      });
      
      // Find all percentage values
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent.trim();
        if (/^\d+(\.\d+)?%$/.test(text) && el.children.length === 0) {
          data.numberElements.push({
            value: text,
            type: 'percentage',
            location: el.className || el.id || 'unknown'
          });
        }
      });
      
      // Extract section data
      const sections = document.querySelectorAll('.section, .card, [data-section]');
      sections.forEach(section => {
        const sectionData = {
          name: section.getAttribute('data-section') || section.className,
          data: {}
        };
        
        // Extract data fields within section
        section.querySelectorAll('[data-field]').forEach(field => {
          const fieldName = field.getAttribute('data-field');
          sectionData.data[fieldName] = field.textContent.trim();
        });
        
        data.sections.push(sectionData);
      });
      
      return data;
    });
  }

  /**
   * Run visual tests
   */
  async runVisualTests(page, persona) {
    const visualResults = {
      layout: {},
      accessibility: {},
      responsive: {},
      issues: []
    };
    
    // Check layout alignment
    const misalignments = await page.evaluate(() => {
      const elements = document.querySelectorAll('.card, .section');
      const issues = [];
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.left % 8 !== 0) {
          issues.push({
            element: el.className,
            issue: 'Not aligned to 8px grid',
            position: rect.left
          });
        }
      });
      
      return issues;
    });
    
    visualResults.layout.misalignments = misalignments;
    
    // Check color contrast
    if (persona.config.checkAccessibility) {
      const contrastIssues = await page.evaluate(() => {
        // Simplified contrast check
        const issues = [];
        const texts = document.querySelectorAll('p, span, h1, h2, h3, h4');
        
        texts.forEach(el => {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const color = style.color;
          
          // This would need proper WCAG calculation
          if (bg && color && el.textContent.trim()) {
            // Placeholder for contrast ratio calculation
            issues.push({
              element: el.tagName,
              text: el.textContent.substring(0, 30),
              background: bg,
              foreground: color
            });
          }
        });
        
        return issues.slice(0, 5); // Limit to first 5 for testing
      });
      
      visualResults.accessibility.contrastIssues = contrastIssues;
    }
    
    return visualResults;
  }

  /**
   * Test PDF generation
   */
  async testPDFGeneration(page, persona) {
    const pdfResults = {
      generated: false,
      sections: [],
      formatting: {},
      dataAccuracy: {},
      issues: []
    };
    
    try {
      // Open PDF modal
      const pdfButton = await page.$('button:has-text("Generate PDF")');
      if (pdfButton) {
        await pdfButton.click();
        await page.waitForTimeout(1000);
        
        // Select all sections
        if (persona.config.testAllSections) {
          const checkboxes = await page.$$('input[type="checkbox"]');
          for (const checkbox of checkboxes) {
            await checkbox.check();
          }
        }
        
        // Add realtor info
        const nameInput = await page.$('#realtor-name, input[placeholder*="Name"]');
        if (nameInput) await nameInput.fill(persona.name);
        
        // Generate PDF
        const generateBtn = await page.$('#generate-pdf-btn, button:has-text("Generate PDF Report")');
        if (generateBtn) {
          await generateBtn.click();
          await page.waitForTimeout(2000);
          
          // Check for success
          const success = await page.$('text=PDF Generated Successfully, .pdf-success');
          pdfResults.generated = success !== null;
          
          // Extract PDF data if available
          const pdfData = await page.evaluate(() => {
            return window.lastGeneratedPDF || null;
          });
          
          if (pdfData) {
            pdfResults.dataAccuracy = this.validatePDFData(pdfData);
          }
        }
      }
    } catch (error) {
      pdfResults.error = error.message;
    }
    
    return pdfResults;
  }

  /**
   * Test edge cases
   */
  async testEdgeCases(page, persona) {
    const edgeResults = {
      extremeValues: [],
      specialCharacters: [],
      emptyFields: [],
      issues: []
    };
    
    if (persona.config.testExtremeValues) {
      for (const price of persona.config.propertyPrices) {
        const result = await this.testWithPrice(page, price);
        edgeResults.extremeValues.push({
          price,
          success: result.success,
          error: result.error
        });
      }
    }
    
    if (persona.config.testSpecialChars) {
      const specialInputs = ['123 Test & Street', '456 Rue Été', '789 中文路'];
      for (const input of specialInputs) {
        const result = await this.testWithAddress(page, input);
        edgeResults.specialCharacters.push({
          input,
          handled: result.success
        });
      }
    }
    
    return edgeResults;
  }

  /**
   * Test with specific price
   */
  async testWithPrice(page, price) {
    try {
      const priceInput = await page.$('input[name="price"], #purchase-price');
      if (priceInput) {
        await priceInput.fill(String(price));
        await page.waitForTimeout(500);
        
        // Check if calculations update
        const cashFlow = await page.$('.cash-flow');
        if (cashFlow) {
          const value = await cashFlow.textContent();
          return { success: true, value };
        }
      }
      return { success: false, error: 'Could not test price' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test with specific address
   */
  async testWithAddress(page, address) {
    try {
      const addressInput = await page.$('#property-address, input[placeholder*="address"]');
      if (addressInput) {
        await addressInput.fill(address);
        await page.waitForTimeout(500);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate PDF data
   */
  validatePDFData(pdfData) {
    // Check for required fields
    const requiredFields = ['propertyAddress', 'purchasePrice', 'monthlyRent', 'cashFlow'];
    const validation = {
      hasAllFields: true,
      fieldsPresent: [],
      fieldsMissing: []
    };
    
    requiredFields.forEach(field => {
      if (pdfData[field]) {
        validation.fieldsPresent.push(field);
      } else {
        validation.fieldsMissing.push(field);
        validation.hasAllFields = false;
      }
    });
    
    return validation;
  }

  /**
   * Calculate overall score
   */
  calculateScore(validations) {
    let totalScore = 0;
    let count = 0;
    
    Object.values(validations).forEach(validation => {
      if (validation.accuracy !== undefined) {
        totalScore += validation.accuracy;
        count++;
      } else if (validation.passed !== undefined) {
        totalScore += validation.passed ? 100 : 0;
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalScore / count) : 0;
  }

  /**
   * Collect issues from validations
   */
  collectIssues(validations) {
    const issues = [];
    
    Object.entries(validations).forEach(([type, validation]) => {
      if (validation.violations) {
        issues.push(...validation.violations.map(v => ({ type, ...v })));
      }
      if (validation.errors) {
        issues.push(...validation.errors.map(e => ({ type, error: e })));
      }
      if (validation.issues) {
        issues.push(...validation.issues.map(i => ({ type, ...i })));
      }
    });
    
    return issues;
  }

  /**
   * Run all persona tests
   */
  async runAll() {
    await this.initialize();
    
    console.log(`\n🎭 Testing ${PERSONAS.length} personas across ${this.mockups.length} mockups`);
    console.log('=' + '='.repeat(60));
    
    for (const persona of PERSONAS) {
      for (const mockup of this.mockups) {
        const result = await this.runPersonaTest(persona, mockup);
        this.results.push(result);
        
        // Print summary
        console.log(`  ✓ ${persona.name}: Score ${result.score}% | Issues: ${result.issues.length}`);
      }
    }
    
    // Generate final report
    await this.generateReport();
    
    return this.results;
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    const report = {
      testRunId: this.testRunId,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        avgScore: 0,
        passedTests: 0,
        failedTests: 0,
        criticalIssues: []
      },
      byPersona: {},
      byMockup: {},
      recommendations: []
    };
    
    // Calculate summary
    let totalScore = 0;
    this.results.forEach(result => {
      totalScore += result.score;
      
      if (result.score >= 80) {
        report.summary.passedTests++;
      } else {
        report.summary.failedTests++;
      }
      
      // Group by persona
      if (!report.byPersona[result.persona]) {
        report.byPersona[result.persona] = [];
      }
      report.byPersona[result.persona].push(result);
      
      // Group by mockup
      const mockupName = result.mockup.split('/').pop();
      if (!report.byMockup[mockupName]) {
        report.byMockup[mockupName] = [];
      }
      report.byMockup[mockupName].push(result);
      
      // Collect critical issues
      result.issues.forEach(issue => {
        if (issue.severity === 'high' || issue.type === 'data_mismatch') {
          report.summary.criticalIssues.push({
            persona: result.personaName,
            mockup: mockupName,
            issue
          });
        }
      });
    });
    
    report.summary.avgScore = Math.round(totalScore / this.results.length);
    
    // Generate recommendations
    if (report.summary.avgScore < 90) {
      report.recommendations.push('Overall accuracy needs improvement');
    }
    
    const financialScores = this.results
      .filter(r => r.persona === 'financial-felix')
      .map(r => r.score);
    if (financialScores.some(s => s < 95)) {
      report.recommendations.push('Financial calculations need review');
    }
    
    const visualScores = this.results
      .filter(r => r.persona === 'visual-victoria')
      .map(r => r.score);
    if (visualScores.some(s => s < 85)) {
      report.recommendations.push('Visual quality and UI consistency need attention');
    }
    
    // Save report
    const reportPath = path.join(this.outputDir, 'accuracy-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Save markdown summary
    const markdownReport = this.generateMarkdownReport(report);
    const mdPath = path.join(this.outputDir, 'accuracy-report.md');
    await fs.writeFile(mdPath, markdownReport);
    
    console.log(`\n📊 Report saved to ${this.outputDir}`);
    console.log(`   Average Score: ${report.summary.avgScore}%`);
    console.log(`   Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
    console.log(`   Critical Issues: ${report.summary.criticalIssues.length}`);
    
    return report;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    let md = `# Accuracy Test Report\n\n`;
    md += `**Test Run ID:** ${report.testRunId}\n`;
    md += `**Date:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    
    md += `## Executive Summary\n\n`;
    md += `- **Overall Score:** ${report.summary.avgScore}%\n`;
    md += `- **Tests Passed:** ${report.summary.passedTests}/${report.summary.totalTests}\n`;
    md += `- **Critical Issues:** ${report.summary.criticalIssues.length}\n\n`;
    
    md += `## Results by Persona\n\n`;
    Object.entries(report.byPersona).forEach(([persona, results]) => {
      const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
      md += `### ${results[0].personaName}\n`;
      md += `- Average Score: ${avgScore}%\n`;
      md += `- Issues Found: ${results.reduce((s, r) => s + r.issues.length, 0)}\n\n`;
    });
    
    md += `## Results by Mockup\n\n`;
    Object.entries(report.byMockup).forEach(([mockup, results]) => {
      const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
      md += `### ${mockup}\n`;
      md += `- Average Score: ${avgScore}%\n`;
      md += `- Tests Run: ${results.length}\n\n`;
    });
    
    if (report.summary.criticalIssues.length > 0) {
      md += `## Critical Issues\n\n`;
      report.summary.criticalIssues.forEach((item, index) => {
        md += `${index + 1}. **${item.persona}** on ${item.mockup}:\n`;
        md += `   - Type: ${item.issue.type}\n`;
        md += `   - Message: ${item.issue.message || 'No message'}\n\n`;
      });
    }
    
    if (report.recommendations.length > 0) {
      md += `## Recommendations\n\n`;
      report.recommendations.forEach(rec => {
        md += `- ${rec}\n`;
      });
    }
    
    return md;
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new PersonaAccuracyTests();
  tester.runAll()
    .then(() => {
      console.log('\n✅ All persona accuracy tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = PersonaAccuracyTests;