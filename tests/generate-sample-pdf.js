/**
 * Generate a sample enhanced PDF report for demonstration
 */

const { EnhancedPDFReportBuilder } = require('../utils/enhanced-pdf-report-builder.js');
const fs = require('fs');
const path = require('path');

// Rich sample data for a compelling report
const sampleAnalysisData = {
  propertyAddress: '456 Maple Avenue, Toronto, ON M5H 2N2',
  propertyDetails: {
    price: 1250000,
    propertyType: 'Luxury Condo',
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1850,
    yearBuilt: 2019,
    propertyTax: 12500,
    hoaFees: 850,
    lotSize: 'N/A'
  },
  costs: {
    purchasePrice: 1250000,
    downPayment: 250000,
    closingCosts: 18750,
    initialRepairs: 10000,
    totalCashRequired: 278750
  },
  longTermRental: {
    monthlyRent: 5500,
    vacancyRate: 0.05,
    effectiveIncome: 5225,
    mortgagePayment: 4650,
    propertyTax: 1042,
    insurance: 200,
    hoaFees: 850,
    maintenance: 300,
    propertyManagement: 523,
    utilities: 150,
    totalExpenses: 7715,
    monthlyCashFlow: -2490,
    annualROI: -10.7,
    capRate: 3.8,
    cashOnCashReturn: -10.7,
    breakEvenMonths: 0
  },
  strAnalysis: {
    averageDailyRate: 425,
    occupancyRate: 0.72,
    monthlyRevenue: 9180,
    cleaningFees: 900,
    supplies: 350,
    platformFees: 918,
    additionalInsurance: 200,
    totalExpenses: 10083,
    monthlyCashFlow: -903,
    annualROI: -3.9,
    seasonalData: {
      spring: { avg_rate: 385, occupancy: 0.68, revenue: 7854 },
      summer: { avg_rate: 485, occupancy: 0.82, revenue: 11931 },
      fall: { avg_rate: 425, occupancy: 0.72, revenue: 9180 },
      winter: { avg_rate: 365, occupancy: 0.62, revenue: 6789 }
    }
  },
  comparables: [
    { address: '123 King Street West', price: 1195000, bedrooms: 3, bathrooms: 2, sqft: 1750, pricePerSqft: 683 },
    { address: '789 Queen Street', price: 1350000, bedrooms: 3, bathrooms: 3, sqft: 1950, pricePerSqft: 692 },
    { address: '555 Bay Street', price: 1175000, bedrooms: 2, bathrooms: 2, sqft: 1650, pricePerSqft: 712 },
    { address: '900 Front Street', price: 1425000, bedrooms: 4, bathrooms: 3, sqft: 2100, pricePerSqft: 679 },
    { address: '200 Wellington', price: 1299000, bedrooms: 3, bathrooms: 2.5, sqft: 1900, pricePerSqft: 684 }
  ]
};

const sampleRealtorInfo = {
  name: 'Alexandra Chen',
  company: 'Luxury Properties International',
  phone: '(416) 555-8888',
  email: 'alexandra@luxuryproperties.ca',
  website: 'www.luxuryproperties.ca'
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
  customNotes: 'This luxury condo presents a unique investment opportunity in Toronto\'s prime financial district. While current cash flow projections are negative, the property\'s location and quality suggest strong long-term appreciation potential. Consider this as a long-term hold strategy with potential for future rental rate increases.'
};

async function generateSamplePDF() {
  console.log('🎨 Generating Enhanced Sample PDF Report\n');
  console.log('Property: ' + sampleAnalysisData.propertyAddress);
  console.log('Price: $' + sampleAnalysisData.propertyDetails.price.toLocaleString());
  console.log('\nGenerating PDF with:');
  console.log('  ✅ Executive Dashboard');
  console.log('  ✅ Investment Grade Visualization');
  console.log('  ✅ Cash Flow Projection Charts');
  console.log('  ✅ ROI Comparison Charts');
  console.log('  ✅ Expense Breakdown Charts');
  console.log('  ✅ Seasonal Occupancy Trends\n');
  
  try {
    const pdfBuilder = new EnhancedPDFReportBuilder(
      sampleAnalysisData,
      reportConfig,
      sampleRealtorInfo
    );
    
    const pdfDoc = await pdfBuilder.generate();
    
    // Get PDF as buffer
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'tests', 'output', 'sample-enhanced-report.pdf');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, pdfBuffer);
    
    console.log('✅ Sample PDF generated successfully!');
    console.log(`📄 File saved to: ${outputPath}`);
    console.log(`📊 File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📑 Page count: ${pdfDoc.internal.getNumberOfPages()} pages`);
    
    // Generate summary for display
    console.log('\n' + '='.repeat(60));
    console.log('SAMPLE REPORT HIGHLIGHTS');
    console.log('='.repeat(60));
    console.log('Investment Grade: C+ (Moderate potential)');
    console.log('Monthly Cash Flow (LTR): -$2,490');
    console.log('Monthly Cash Flow (STR): -$903');
    console.log('Annual ROI (LTR): -10.7%');
    console.log('Annual ROI (STR): -3.9%');
    console.log('Cap Rate: 3.8%');
    console.log('\nRecommendation: Consider as long-term appreciation play');
    console.log('Risk Level: Medium-High due to negative cash flow');
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ Error generating sample PDF:', error);
    throw error;
  }
}

// Generate the sample
generateSamplePDF()
  .then(filePath => {
    console.log('\n🎉 Sample PDF ready for viewing!');
    console.log('You can open it at: ' + filePath);
  })
  .catch(console.error);