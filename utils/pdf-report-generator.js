/**
 * PDF Report Generator
 * Creates professional investment analysis reports
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export class PDFReportGenerator {
  constructor() {
    this.doc = null;
    this.pageHeight = 297; // A4 height in mm
    this.pageWidth = 210; // A4 width in mm
    this.margin = 20;
    this.currentY = this.margin;
    this.primaryColor = [102, 126, 234]; // Purple
    this.secondaryColor = [118, 75, 162]; // Darker purple
  }

  generateReport(analysisData) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add custom fonts if available
    this.doc.setFont('helvetica');

    // Generate report sections
    this.addCoverPage(analysisData);
    this.addExecutiveSummary(analysisData);
    this.addPropertyDetails(analysisData);
    this.addFinancialAnalysis(analysisData);
    this.addRentalComparison(analysisData);
    this.addMarketData(analysisData);
    this.addInvestmentRecommendation(analysisData);
    this.addDisclaimer();

    // Return the PDF as blob
    return this.doc.output('blob');
  }

  addCoverPage(data) {
    // Background gradient effect
    this.doc.setFillColor(...this.primaryColor);
    this.doc.rect(0, 0, this.pageWidth, 100, 'F');

    // Logo placeholder
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('StarterPackApp', this.pageWidth / 2, 30, { align: 'center' });

    // Title
    this.doc.setFontSize(24);
    this.doc.text('Property Investment Analysis', this.pageWidth / 2, 50, { align: 'center' });

    // Property address
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    const address = data.property_address || data.propertyAddress || 'Property Address';
    this.doc.text(address, this.pageWidth / 2, 65, { align: 'center' });

    // Report date
    this.doc.setFontSize(12);
    this.doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, this.pageWidth / 2, 80, { align: 'center' });

    // Property image if available
    if (data.propertyData?.mainImage || data.property?.image) {
      try {
        // Note: In real implementation, we'd need to convert image URL to base64
        // For now, we'll add a placeholder
        this.doc.setFillColor(240, 240, 240);
        this.doc.rect(this.margin, 110, this.pageWidth - 2 * this.margin, 100, 'F');
        this.doc.setTextColor(150, 150, 150);
        this.doc.text('Property Image', this.pageWidth / 2, 160, { align: 'center' });
      } catch (error) {
        console.error('Error adding property image:', error);
      }
    }

    // Key metrics
    this.doc.setTextColor(0, 0, 0);
    this.currentY = 230;
    this.addKeyMetrics(data);

    this.doc.addPage();
  }

  addKeyMetrics(data) {
    const metrics = [
      {
        label: 'Purchase Price',
        value: `$${(data.property?.price || 0).toLocaleString()}`
      },
      {
        label: 'Monthly Cash Flow',
        value: `$${(data.long_term_rental?.cash_flow || 0).toLocaleString()}`
      },
      {
        label: 'Cap Rate',
        value: `${((data.long_term_rental?.cap_rate || 0) * 100).toFixed(2)}%`
      },
      {
        label: 'Investment Score',
        value: `${data.investment_score || 0}/10`
      }
    ];

    this.doc.setFontSize(10);
    const boxWidth = (this.pageWidth - 2 * this.margin - 30) / 4;
    
    metrics.forEach((metric, index) => {
      const x = this.margin + index * (boxWidth + 10);
      
      // Box
      this.doc.setFillColor(248, 248, 248);
      this.doc.rect(x, this.currentY, boxWidth, 25, 'F');
      
      // Label
      this.doc.setTextColor(100, 100, 100);
      this.doc.setFontSize(9);
      this.doc.text(metric.label, x + boxWidth / 2, this.currentY + 8, { align: 'center' });
      
      // Value
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metric.value, x + boxWidth / 2, this.currentY + 18, { align: 'center' });
    });
  }

  addExecutiveSummary(data) {
    this.currentY = this.margin;
    this.addSectionHeader('Executive Summary');

    const recommendation = data.recommendation || 'HOLD';
    const recommendationColor = recommendation.includes('BUY') ? [16, 185, 129] : 
                               recommendation.includes('HOLD') ? [245, 158, 11] : 
                               [239, 68, 68];

    // Recommendation box
    this.doc.setFillColor(...recommendationColor);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 30, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Investment Recommendation: ${recommendation}`, this.pageWidth / 2, this.currentY + 18, { align: 'center' });

    this.currentY += 40;

    // Summary points
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const summaryPoints = [
      `This property at ${data.property_address || 'the specified location'} has been thoroughly analyzed for investment potential.`,
      `The property is expected to generate $${(data.long_term_rental?.monthly_rent || 0).toLocaleString()} in monthly rental income.`,
      `Short-term rental potential shows ${data.strAnalysis?.occupancyRate || 70}% occupancy at $${data.strAnalysis?.avgNightlyRate || 0}/night.`,
      `The analysis indicates ${data.comparison?.better_strategy === 'str' ? 'short-term rental' : 'long-term rental'} as the optimal strategy.`,
      `Overall investment score: ${data.investment_score || 0}/10`
    ];

    summaryPoints.forEach(point => {
      const lines = this.doc.splitTextToSize(point, this.pageWidth - 2 * this.margin);
      this.doc.text(lines, this.margin, this.currentY);
      this.currentY += lines.length * 5 + 3;
    });
  }

  addPropertyDetails(data) {
    this.checkNewPage();
    this.addSectionHeader('Property Details');

    const details = [
      ['Address', data.property_address || 'N/A'],
      ['Property Type', data.property?.propertyType || 'N/A'],
      ['Bedrooms', data.property?.bedrooms || 'N/A'],
      ['Bathrooms', data.property?.bathrooms || 'N/A'],
      ['Square Feet', data.property?.squareFeet ? `${data.property.squareFeet.toLocaleString()} sq ft` : 'N/A'],
      ['Year Built', data.propertyData?.yearBuilt || 'N/A'],
      ['Purchase Price', data.property?.price ? `$${data.property.price.toLocaleString()}` : 'N/A'],
      ['Property Taxes', data.costs?.property_tax_monthly ? `$${data.costs.property_tax_monthly}/month` : 'N/A'],
      ['HOA/Condo Fees', data.costs?.hoa_monthly ? `$${data.costs.hoa_monthly}/month` : 'N/A']
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [],
      body: details,
      theme: 'plain',
      styles: {
        fontSize: 11,
        cellPadding: 5
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addFinancialAnalysis(data) {
    this.checkNewPage();
    this.addSectionHeader('Financial Analysis');

    // Monthly expenses
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Monthly Operating Expenses', this.margin, this.currentY);
    this.currentY += 8;

    const expenses = [
      ['Mortgage Payment', data.costs?.mortgage_payment || 0],
      ['Property Tax', data.costs?.property_tax_monthly || 0],
      ['Insurance', data.costs?.insurance_monthly || 0],
      ['HOA/Condo Fees', data.costs?.hoa_monthly || 0],
      ['Maintenance', data.costs?.maintenance_monthly || 0],
      ['Utilities', data.costs?.utilities_monthly || 0],
      ['Total Monthly Expenses', data.costs?.total_monthly || 0]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Expense Category', 'Monthly Amount']],
      body: expenses.map(([category, amount]) => [
        category,
        `$${amount.toLocaleString()}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: this.primaryColor },
      footStyles: { fontStyle: 'bold' }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 15;

    // Cash flow analysis
    this.doc.text('Cash Flow Analysis', this.margin, this.currentY);
    this.currentY += 8;

    const cashFlow = [
      ['Monthly Rental Income', data.long_term_rental?.monthly_rent || 0],
      ['Monthly Expenses', -(data.costs?.total_monthly || 0)],
      ['Net Monthly Cash Flow', data.long_term_rental?.cash_flow || 0],
      ['Annual Cash Flow', (data.long_term_rental?.cash_flow || 0) * 12]
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Description', 'Amount']],
      body: cashFlow.map(([desc, amount]) => [
        desc,
        `$${amount.toLocaleString()}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: this.primaryColor }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  addRentalComparison(data) {
    this.checkNewPage();
    this.addSectionHeader('Long-Term vs Short-Term Rental Analysis');

    const comparison = [
      ['Strategy', 'Long-Term Rental', 'Short-Term Rental'],
      ['Monthly Revenue', `$${(data.long_term_rental?.monthly_rent || 0).toLocaleString()}`, `$${(data.strAnalysis?.monthlyRevenue || 0).toLocaleString()}`],
      ['Occupancy Rate', `${((data.long_term_rental?.vacancy_rate || 0.05) * 100).toFixed(0)}%`, `${data.strAnalysis?.occupancyRate || 70}%`],
      ['Annual Revenue', `$${(data.long_term_rental?.annual_income || 0).toLocaleString()}`, `$${(data.strAnalysis?.annual_revenue || 0).toLocaleString()}`],
      ['Management Effort', 'Low', 'High'],
      ['Revenue Stability', 'High', 'Medium']
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [comparison[0]],
      body: comparison.slice(1),
      theme: 'grid',
      headStyles: { fillColor: this.primaryColor },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;

    // Recommendation
    const betterStrategy = data.comparison?.better_strategy === 'str' ? 'Short-Term Rental' : 'Long-Term Rental';
    const monthlyDiff = Math.abs(data.comparison?.monthly_difference || 0);
    
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F');
    
    this.doc.setFontSize(12);
    this.doc.text(
      `Recommended Strategy: ${betterStrategy} (+$${monthlyDiff.toLocaleString()}/month)`,
      this.pageWidth / 2,
      this.currentY + 15,
      { align: 'center' }
    );

    this.currentY += 35;
  }

  addMarketData(data) {
    this.checkNewPage();
    this.addSectionHeader('Market Comparables');

    if (data.strAnalysis?.comparables && data.strAnalysis.comparables.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Airbnb Comparables', this.margin, this.currentY);
      this.currentY += 8;

      const comparables = data.strAnalysis.comparables.slice(0, 5).map(comp => [
        comp.title || 'Similar Property',
        `$${comp.nightly_rate || 0}/night`,
        `${Math.round((comp.occupancy_rate || 0.7) * 100)}%`,
        comp.area || 'Local Area',
        `$${(comp.monthly_revenue || 0).toLocaleString()}`
      ]);

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Property', 'Nightly Rate', 'Occupancy', 'Location', 'Monthly Revenue']],
        body: comparables,
        theme: 'striped',
        headStyles: { fillColor: this.primaryColor },
        styles: { fontSize: 10 }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 15;
    }

    if (data.long_term_rental?.comparables && data.long_term_rental.comparables.length > 0) {
      this.doc.text('Long-Term Rental Comparables', this.margin, this.currentY);
      this.currentY += 8;

      const ltComparables = data.long_term_rental.comparables.slice(0, 3).map(comp => [
        comp.address || 'Similar Property',
        `$${comp.rent || 0}/month`,
        `${comp.bedrooms || 'N/A'} BR`,
        `${comp.sqft || 'N/A'} sq ft`
      ]);

      this.doc.autoTable({
        startY: this.currentY,
        head: [['Address', 'Monthly Rent', 'Bedrooms', 'Size']],
        body: ltComparables,
        theme: 'striped',
        headStyles: { fillColor: this.primaryColor },
        styles: { fontSize: 10 }
      });

      this.currentY = this.doc.lastAutoTable.finalY + 10;
    }
  }

  addInvestmentRecommendation(data) {
    this.checkNewPage();
    this.addSectionHeader('Investment Recommendation');

    const metrics = [
      {
        metric: 'Cap Rate',
        value: `${((data.long_term_rental?.cap_rate || 0) * 100).toFixed(2)}%`,
        benchmark: '8-12%',
        status: (data.long_term_rental?.cap_rate || 0) > 0.08 ? 'Good' : 'Below Average'
      },
      {
        metric: 'Cash Flow',
        value: `$${(data.long_term_rental?.cash_flow || 0).toLocaleString()}/month`,
        benchmark: '>$200/month',
        status: (data.long_term_rental?.cash_flow || 0) > 200 ? 'Good' : 'Poor'
      },
      {
        metric: 'ROI',
        value: `${((data.long_term_rental?.roi || 0) * 100).toFixed(2)}%`,
        benchmark: '>10%',
        status: (data.long_term_rental?.roi || 0) > 0.10 ? 'Good' : 'Below Average'
      }
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Investment Metric', 'Property Value', 'Market Benchmark', 'Status']],
      body: metrics.map(m => [m.metric, m.value, m.benchmark, m.status]),
      theme: 'grid',
      headStyles: { fillColor: this.primaryColor },
      columnStyles: {
        3: { 
          cellWidth: 30,
          halign: 'center'
        }
      },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.row.index >= 0) {
          const status = data.cell.text[0];
          if (status === 'Good') {
            data.cell.styles.textColor = [16, 185, 129];
          } else if (status === 'Poor') {
            data.cell.styles.textColor = [239, 68, 68];
          } else {
            data.cell.styles.textColor = [245, 158, 11];
          }
        }
      }
    });

    this.currentY = this.doc.lastAutoTable.finalY + 15;

    // Final recommendation box
    const recommendation = data.recommendation || 'HOLD';
    const score = data.investment_score || 0;
    
    this.doc.setFillColor(248, 248, 248);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 40, 'F');
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Final Recommendation', this.pageWidth / 2, this.currentY + 12, { align: 'center' });
    
    this.doc.setFontSize(18);
    const recColor = recommendation.includes('BUY') ? [16, 185, 129] : 
                     recommendation.includes('HOLD') ? [245, 158, 11] : 
                     [239, 68, 68];
    this.doc.setTextColor(...recColor);
    this.doc.text(recommendation, this.pageWidth / 2, this.currentY + 25, { align: 'center' });
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Investment Score: ${score}/10`, this.pageWidth / 2, this.currentY + 35, { align: 'center' });
  }

  addDisclaimer() {
    this.doc.addPage();
    this.currentY = this.margin;
    this.addSectionHeader('Disclaimer');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const disclaimer = [
      'This report is provided for informational purposes only and should not be considered as financial or investment advice.',
      'The analysis is based on current market data and estimates that may change over time.',
      'Actual rental income, expenses, and property values may vary significantly from the projections shown.',
      'Tax implications and financing options have not been fully considered in this analysis.',
      'We recommend consulting with qualified real estate professionals, financial advisors, and tax professionals before making any investment decisions.',
      'Past performance is not indicative of future results.',
      'StarterPackApp and its affiliates are not responsible for any investment decisions made based on this report.'
    ];

    disclaimer.forEach(text => {
      const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin);
      this.doc.text(lines, this.margin, this.currentY);
      this.currentY += lines.length * 4 + 5;
    });

    // Footer
    this.currentY = this.pageHeight - 20;
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(
      `Generated by StarterPackApp on ${new Date().toLocaleString()}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );
  }

  addSectionHeader(title) {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.primaryColor);
    this.doc.text(title, this.margin, this.currentY);
    
    // Underline
    this.doc.setDrawColor(...this.primaryColor);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY + 2, this.pageWidth - this.margin, this.currentY + 2);
    
    this.currentY += 12;
    this.doc.setTextColor(0, 0, 0);
  }

  checkNewPage() {
    if (this.currentY > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }
}

// Export function for easy use
export async function generatePDFReport(analysisData) {
  const generator = new PDFReportGenerator();
  return generator.generateReport(analysisData);
}