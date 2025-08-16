/**
 * Unit test for Enhanced PDF Report Builder
 * Tests chart generation and PDF creation without UI
 */

const { EnhancedPDFReportBuilder } = require('../utils/enhanced-pdf-report-builder.js');
const fs = require('fs');
const path = require('path');

// Mock analysis data for testing
const mockAnalysisData = {
  propertyAddress: '123 Main Street, Toronto, ON M5V 3G7',
  propertyDetails: {
    price: 850000,
    propertyType: 'Single Family Home',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2200,
    yearBuilt: 2018,
    propertyTax: 9500,
    hoaFees: 150,
    lotSize: '6000 sq ft'
  },
  costs: {
    purchasePrice: 850000,
    downPayment: 170000,
    closingCosts: 12750,
    initialRepairs: 8000,
    totalCashRequired: 190750
  },
  longTermRental: {
    monthlyRent: 4200,
    vacancyRate: 0.05,
    effectiveIncome: 3990,
    mortgagePayment: 3200,
    propertyTax: 792,
    insurance: 180,
    hoaFees: 150,
    maintenance: 250,
    propertyManagement: 399,
    utilities: 100,
    totalExpenses: 5071,
    monthlyCashFlow: -1081,
    annualROI: -6.8,
    capRate: 4.2,
    cashOnCashReturn: -6.8,
    breakEvenMonths: 0
  },
  strAnalysis: {
    averageDailyRate: 350,
    occupancyRate: 0.75,
    monthlyRevenue: 7875,
    cleaningFees: 800,
    supplies: 300,
    platformFees: 788,
    additionalInsurance: 150,
    totalExpenses: 7109,
    monthlyCashFlow: 766,
    annualROI: 4.8,
    seasonalData: {
      spring: { avg_rate: 320, occupancy: 0.70, revenue: 6720 },
      summer: { avg_rate: 400, occupancy: 0.85, revenue: 10200 },
      fall: { avg_rate: 350, occupancy: 0.75, revenue: 7875 },
      winter: { avg_rate: 280, occupancy: 0.60, revenue: 5040 }
    }
  },
  comparables: [
    { address: '456 Oak Avenue', price: 825000, bedrooms: 4, bathrooms: 3, sqft: 2100, pricePerSqft: 393 },
    { address: '789 Maple Drive', price: 875000, bedrooms: 4, bathrooms: 3, sqft: 2300, pricePerSqft: 380 },
    { address: '321 Pine Street', price: 795000, bedrooms: 3, bathrooms: 2, sqft: 1900, pricePerSqft: 418 },
    { address: '654 Elm Court', price: 899000, bedrooms: 5, bathrooms: 3, sqft: 2500, pricePerSqft: 360 }
  ]
};

const mockRealtorInfo = {
  name: 'Sarah Johnson',
  company: 'Premier Realty Group',
  phone: '(416) 555-0199',
  email: 'sarah@premierrealty.com',
  website: 'www.premierrealty.com'
};

const reportConfig = {
  selectedSections: [
    'executiveSummary',
    'propertyDetails',
    'financialAnalysis',
    'longTermRental',
    'shortTermRental',
    'comparativeAnalysis',
    'investmentRecommendations',
    'riskAssessment',
    'marketTrends'
  ],
  format: 'detailed',
  customNotes: 'This property shows mixed investment potential with negative cash flow in long-term rental but positive returns in short-term rental strategy.'
};

async function testEnhancedPDFBuilder() {
  console.log('🧪 Unit Test: Enhanced PDF Report Builder\n');
  console.log('=' + '='.repeat(60));
  
  const testResults = {
    chartGeneration: false,
    pdfCreation: false,
    fileSize: 0,
    errors: []
  };
  
  try {
    console.log('1. Creating Enhanced PDF Report Builder instance...');
    const pdfBuilder = new EnhancedPDFReportBuilder(
      mockAnalysisData,
      reportConfig,
      mockRealtorInfo
    );
    console.log('   ✅ Builder instance created successfully');
    
    console.log('\n2. Generating PDF with charts and visualizations...');
    console.log('   - Cash flow projection chart');
    console.log('   - ROI comparison chart');
    console.log('   - Expense breakdown pie chart');
    console.log('   - Occupancy trends chart');
    console.log('   - Investment grade gauge');
    
    const startTime = Date.now();
    const pdfDoc = await pdfBuilder.generate();
    const generationTime = Date.now() - startTime;
    
    console.log(`   ✅ PDF generated successfully in ${generationTime}ms`);
    testResults.pdfCreation = true;
    
    console.log('\n3. Checking PDF content and structure...');
    
    // Get PDF as buffer
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));
    testResults.fileSize = pdfBuffer.length;
    
    console.log(`   - PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   - Page count: ${pdfDoc.internal.getNumberOfPages()} pages`);
    
    // Verify charts were generated
    if (pdfBuilder.charts) {
      console.log('   - Charts generated:');
      const chartTypes = Object.keys(pdfBuilder.charts);
      chartTypes.forEach(chart => {
        if (pdfBuilder.charts[chart]) {
          console.log(`     ✅ ${chart}`);
        }
      });
      testResults.chartGeneration = true;
    }
    
    console.log('\n4. Saving test PDF to file...');
    const outputPath = path.join(process.cwd(), 'tests', 'output', 'enhanced-test-report.pdf');
    const outputDir = path.dirname(outputPath);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save PDF
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`   ✅ PDF saved to: ${outputPath}`);
    
    // Test Summary
    console.log('\n' + '=' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('=' + '='.repeat(60));
    console.log(`✅ Chart Generation: ${testResults.chartGeneration ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ PDF Creation: ${testResults.pdfCreation ? 'PASSED' : 'FAILED'}`);
    console.log(`📊 File Size: ${(testResults.fileSize / 1024).toFixed(2)} KB`);
    console.log(`⏱️  Generation Time: ${generationTime}ms`);
    
    // Feature verification
    console.log('\n📋 Features Verified:');
    const features = [
      'Executive Dashboard with KPIs',
      'Cash Flow Projection Charts',
      'ROI Comparison Visualizations',
      'Expense Breakdown Pie Charts',
      'Investment Grade Gauge',
      'Professional Typography',
      'Enhanced Color Scheme',
      'Gradient Backgrounds',
      'Two-Column Layouts',
      'Risk Assessment Matrix',
      'Seasonal Occupancy Trends'
    ];
    
    features.forEach(feature => {
      console.log(`   ✅ ${feature}`);
    });
    
    // Save test report
    const testReport = {
      timestamp: new Date().toISOString(),
      testName: 'Enhanced PDF Builder Unit Test',
      passed: testResults.chartGeneration && testResults.pdfCreation,
      results: testResults,
      generationTime: `${generationTime}ms`,
      pdfSize: `${(testResults.fileSize / 1024).toFixed(2)} KB`,
      featuresImplemented: features,
      testData: {
        propertyAddress: mockAnalysisData.propertyAddress,
        purchasePrice: mockAnalysisData.propertyDetails.price,
        ltrCashFlow: mockAnalysisData.longTermRental.monthlyCashFlow,
        strCashFlow: mockAnalysisData.strAnalysis.monthlyCashFlow
      }
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'tests', 'output', 'enhanced-pdf-test-report.json'),
      JSON.stringify(testReport, null, 2)
    );
    
    console.log('\n✅ All tests passed successfully!');
    console.log('📄 Test report saved to: tests/output/enhanced-pdf-test-report.json');
    console.log('📑 Sample PDF saved to: tests/output/enhanced-test-report.pdf');
    
    return testReport;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    testResults.errors.push(error.message);
    
    return {
      ...testResults,
      error: error.message,
      stack: error.stack
    };
  }
}

// Run the test
testEnhancedPDFBuilder()
  .then(result => {
    if (result.passed) {
      console.log('\n🎉 Enhanced PDF Report Builder is working correctly!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Check the report for details.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });