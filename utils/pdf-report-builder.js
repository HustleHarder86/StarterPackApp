// PDF Report Builder with jsPDF - Enhanced Version with Charts and Professional Design
// This is now the main PDF builder that includes all enhanced features

import { EnhancedPDFReportBuilder } from './enhanced-pdf-report-builder-es6.js';

// Re-export the enhanced version as the main PDFReportBuilder
// This maintains backward compatibility while providing all new features
export class PDFReportBuilder extends EnhancedPDFReportBuilder {
  constructor(analysisData, reportConfig, realtorInfo) {
    // Call the enhanced parent constructor with all features
    super(analysisData, reportConfig, realtorInfo);
    
    // Any additional customizations can be added here if needed
    console.log('Initializing Enhanced PDF Report Builder with charts and visualizations');
  }
  
  // Override any methods if needed for specific customizations
  // The enhanced builder already includes:
  // - Executive Dashboard with KPIs
  // - Cash Flow Projection Charts
  // - ROI Comparison Charts
  // - Expense Breakdown Pie Charts
  // - Investment Grade Gauge
  // - Seasonal Occupancy Trends
  // - Professional Typography and Design
  // - Risk Assessment Matrix
  // - Market Trends Analysis
}

// For backward compatibility, also export the original basic builder if needed
export { EnhancedPDFReportBuilder } from './enhanced-pdf-report-builder-es6.js';

// Export a factory function for easy PDF generation
export async function generatePDFReport(analysisData, reportConfig = {}, realtorInfo = null) {
  // Set default configuration if not provided
  const defaultConfig = {
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
    customNotes: reportConfig.customNotes || ''
  };
  
  const finalConfig = {
    ...defaultConfig,
    ...reportConfig,
    selectedSections: reportConfig.selectedSections || defaultConfig.selectedSections
  };
  
  try {
    console.log('Generating enhanced PDF report with charts...');
    const pdfBuilder = new PDFReportBuilder(analysisData, finalConfig, realtorInfo);
    const pdfDoc = await pdfBuilder.generate();
    console.log('Enhanced PDF generated successfully');
    return pdfDoc;
  } catch (error) {
    console.error('Error generating enhanced PDF:', error);
    throw error;
  }
}

// Export default for simple imports
export default PDFReportBuilder;