/**
 * Enhanced PDF Report Builder with Charts and Professional Design
 * Extends the basic PDF builder with data visualizations and improved styling
 */

const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const { PDFChartGenerator } = require('./pdf-chart-generator.js');

class EnhancedPDFReportBuilder {
  constructor(analysisData, reportConfig, realtorInfo) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    this.analysisData = analysisData;
    this.reportConfig = reportConfig;
    this.realtorInfo = realtorInfo;
    this.chartGenerator = new PDFChartGenerator();
    
    // Page dimensions
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 15; // Reduced margin for more content space
    this.contentWidth = this.pageWidth - (2 * this.margin);
    
    // Enhanced color palette
    this.colors = {
      primary: [41, 128, 185],      // Professional blue
      secondary: [52, 73, 94],       // Dark gray
      accent: [26, 188, 156],        // Teal
      success: [46, 204, 113],       // Green
      warning: [241, 196, 15],       // Yellow
      danger: [231, 76, 60],         // Red
      light: [236, 240, 241],        // Light gray
      dark: [44, 62, 80],            // Very dark gray
      gradient1: [103, 126, 234],    // Purple-blue
      gradient2: [118, 75, 162]      // Purple
    };
    
    // Enhanced typography settings
    this.typography = {
      title: { size: 32, font: 'helvetica', style: 'bold' },
      h1: { size: 24, font: 'helvetica', style: 'bold' },
      h2: { size: 18, font: 'helvetica', style: 'bold' },
      h3: { size: 14, font: 'helvetica', style: 'bold' },
      body: { size: 11, font: 'helvetica', style: 'normal' },
      small: { size: 9, font: 'helvetica', style: 'normal' },
      caption: { size: 8, font: 'helvetica', style: 'italic' }
    };
    
    this.currentY = this.margin;
    this.pageNumber = 1;
    this.charts = null;
  }
  
  // Generate the complete PDF with charts
  async generate() {
    try {
      // Generate all charts first
      console.log('Generating charts for PDF report...');
      this.charts = await this.chartGenerator.generateAllCharts(this.analysisData);
      
      // Add professional header with gradient
      await this.addProfessionalHeader();
      
      // Add enhanced cover page
      this.addEnhancedCoverPage();
      
      // Add table of contents for detailed reports
      if (this.reportConfig.format === 'detailed') {
        this.addEnhancedTableOfContents();
      }
      
      // Add selected sections with enhanced design
      const sections = this.reportConfig.selectedSections || [];
      
      if (sections.includes('executiveSummary')) {
        await this.addEnhancedExecutiveSummary();
      }
      
      if (sections.includes('propertyDetails')) {
        this.addEnhancedPropertyDetails();
      }
      
      if (sections.includes('financialAnalysis')) {
        await this.addEnhancedFinancialAnalysis();
      }
      
      if (sections.includes('longTermRental')) {
        await this.addEnhancedLongTermRentalAnalysis();
      }
      
      if (sections.includes('shortTermRental') && this.analysisData.strAnalysis) {
        await this.addEnhancedShortTermRentalAnalysis();
      }
      
      if (sections.includes('comparativeAnalysis')) {
        this.addEnhancedComparativeAnalysis();
      }
      
      if (sections.includes('investmentRecommendations')) {
        this.addEnhancedInvestmentRecommendations();
      }
      
      if (sections.includes('riskAssessment')) {
        this.addEnhancedRiskAssessment();
      }
      
      if (sections.includes('marketTrends')) {
        await this.addEnhancedMarketTrends();
      }
      
      // Add custom notes with professional styling
      if (this.reportConfig.customNotes) {
        this.addEnhancedCustomNotes();
      }
      
      // Add professional footer to all pages
      this.addProfessionalFooter();
      
      return this.doc;
      
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      throw error;
    }
  }
  
  // Add professional header with gradient effect
  async addProfessionalHeader() {
    if (!this.realtorInfo) return;
    
    // Add gradient background (simulated with rectangles)
    const gradientSteps = 20;
    const stepHeight = 35 / gradientSteps;
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / gradientSteps;
      const r = Math.round(this.colors.gradient1[0] * (1 - ratio) + this.colors.gradient2[0] * ratio);
      const g = Math.round(this.colors.gradient1[1] * (1 - ratio) + this.colors.gradient2[1] * ratio);
      const b = Math.round(this.colors.gradient1[2] * (1 - ratio) + this.colors.gradient2[2] * ratio);
      
      this.doc.setFillColor(r, g, b);
      this.doc.rect(0, i * stepHeight, this.pageWidth, stepHeight, 'F');
    }
    
    // Add realtor info with professional layout
    this.doc.setTextColor(255, 255, 255);
    
    if (this.realtorInfo.logoUrl) {
      try {
        const logoImg = await this.loadImage(this.realtorInfo.logoUrl);
        this.doc.addImage(logoImg, 'PNG', this.margin, 8, 25, 20);
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }
    
    // Realtor details in white
    const textX = this.realtorInfo.logoUrl ? this.margin + 30 : this.margin;
    let textY = 12;
    
    if (this.realtorInfo.name) {
      this.setTypography('h3');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(this.realtorInfo.name, textX, textY);
      textY += 6;
    }
    
    this.setTypography('small');
    if (this.realtorInfo.company) {
      this.doc.text(this.realtorInfo.company, textX, textY);
      textY += 4;
    }
    
    if (this.realtorInfo.phone) {
      this.doc.text(this.realtorInfo.phone, textX, textY);
      textY += 4;
    }
    
    if (this.realtorInfo.email) {
      this.doc.text(this.realtorInfo.email, textX, textY);
    }
    
    this.currentY = 45;
  }
  
  // Enhanced cover page with executive dashboard
  addEnhancedCoverPage() {
    // Main title with gradient text effect
    this.setTypography('title');
    this.doc.setTextColor(...this.colors.gradient1);
    this.doc.text('Property Investment', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 10;
    this.doc.setTextColor(...this.colors.gradient2);
    this.doc.text('Analysis Report', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 20;
    
    // Property address with elegant styling
    this.setTypography('h2');
    this.doc.setTextColor(...this.colors.secondary);
    const address = this.analysisData.propertyAddress || 'Property Address';
    this.doc.text(address, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 25;
    
    // Executive Dashboard - Key Performance Indicators
    this.addExecutiveDashboard();
    
    // Investment grade visualization
    if (this.charts && this.charts.investmentGauge) {
      this.currentY += 15;
      this.doc.addImage(this.charts.investmentGauge, 'PNG', 
        (this.pageWidth - 60) / 2, this.currentY, 60, 45);
      this.currentY += 50;
    }
    
    // Report metadata
    this.setTypography('body');
    this.doc.setTextColor(...this.colors.secondary);
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    this.doc.text(`Generated: ${date}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    if (this.realtorInfo && this.realtorInfo.name) {
      this.currentY += 6;
      this.doc.text(`Prepared by: ${this.realtorInfo.name}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    }
    
    this.addNewPage();
  }
  
  // Executive Dashboard with KPIs
  addExecutiveDashboard() {
    const metrics = this.calculateKeyMetrics();
    const dashboardY = this.currentY;
    const cardWidth = 42;
    const cardHeight = 35;
    const spacing = 5;
    
    // Create 4 KPI cards
    const cards = [
      {
        title: 'Purchase Price',
        value: metrics.purchasePrice,
        color: this.colors.primary,
        icon: '💰'
      },
      {
        title: 'Monthly Cash Flow',
        value: metrics.monthlyCashFlow,
        color: metrics.cashFlowPositive ? this.colors.success : this.colors.danger,
        icon: '📊'
      },
      {
        title: 'Annual ROI',
        value: metrics.annualROI,
        color: this.colors.accent,
        icon: '📈'
      },
      {
        title: 'Cap Rate',
        value: metrics.capRate,
        color: this.colors.secondary,
        icon: '🏆'
      }
    ];
    
    let cardX = this.margin + 5;
    
    cards.forEach((card, index) => {
      // Card background with shadow effect
      this.doc.setFillColor(250, 250, 250);
      this.doc.setDrawColor(220, 220, 220);
      this.doc.roundedRect(cardX, dashboardY, cardWidth, cardHeight, 3, 3, 'FD');
      
      // Colored accent bar at top
      this.doc.setFillColor(...card.color);
      this.doc.rect(cardX, dashboardY, cardWidth, 3, 'F');
      
      // Card title
      this.setTypography('small');
      this.doc.setTextColor(...this.colors.secondary);
      this.doc.text(card.title, cardX + cardWidth/2, dashboardY + 10, { align: 'center' });
      
      // Card value with large font
      this.doc.setFontSize(16);
      this.doc.setFont(undefined, 'bold');
      this.doc.setTextColor(...card.color);
      this.doc.text(card.value, cardX + cardWidth/2, dashboardY + 22, { align: 'center' });
      
      cardX += cardWidth + spacing;
    });
    
    this.currentY = dashboardY + cardHeight + 10;
  }
  
  // Enhanced Executive Summary with charts
  async addEnhancedExecutiveSummary() {
    this.addSectionHeader('Executive Summary', this.colors.primary);
    
    const summary = this.generateExecutiveSummary();
    
    this.setTypography('body');
    this.doc.setTextColor(...this.colors.secondary);
    
    const lines = this.doc.splitTextToSize(summary, this.contentWidth);
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * 5 + 15;
    
    // Add cash flow projection chart
    if (this.charts && this.charts.cashFlow) {
      this.addSubHeader('5-Year Cash Flow Projection');
      this.doc.addImage(this.charts.cashFlow, 'PNG', 
        this.margin, this.currentY, this.contentWidth, this.contentWidth * 0.5);
      this.currentY += this.contentWidth * 0.5 + 10;
    }
    
    this.checkPageBreak();
  }
  
  // Enhanced Property Details with better formatting
  addEnhancedPropertyDetails() {
    this.addSectionHeader('Property Details', this.colors.primary);
    
    const details = this.analysisData.propertyDetails || {};
    
    // Create two-column layout for property details
    const leftColumn = [
      ['Address', this.analysisData.propertyAddress || 'N/A'],
      ['Property Type', details.propertyType || 'N/A'],
      ['Bedrooms', details.bedrooms?.toString() || 'N/A'],
      ['Bathrooms', details.bathrooms?.toString() || 'N/A'],
      ['Square Footage', details.sqft ? `${details.sqft.toLocaleString()} sq ft` : 'N/A']
    ];
    
    const rightColumn = [
      ['Year Built', details.yearBuilt?.toString() || 'N/A'],
      ['Lot Size', details.lotSize || 'N/A'],
      ['Purchase Price', this.formatCurrency(details.price || 0)],
      ['Property Tax', this.formatCurrency(details.propertyTax || 0) + '/year'],
      ['HOA/Condo Fees', this.formatCurrency(details.hoaFees || 0) + '/month']
    ];
    
    // Render columns
    this.renderTwoColumnLayout(leftColumn, rightColumn);
    
    this.checkPageBreak();
  }
  
  // Enhanced Financial Analysis with expense breakdown chart
  async addEnhancedFinancialAnalysis() {
    this.addSectionHeader('Financial Analysis', this.colors.primary);
    
    const costs = this.analysisData.costs || {};
    const rental = this.analysisData.longTermRental || {};
    
    // Purchase costs with visual emphasis
    this.addSubHeader('Initial Investment Requirements');
    
    const purchaseData = [
      ['Purchase Price', this.formatCurrency(costs.purchasePrice || 0)],
      ['Down Payment (20%)', this.formatCurrency(costs.downPayment || 0)],
      ['Closing Costs', this.formatCurrency(costs.closingCosts || 0)],
      ['Initial Repairs', this.formatCurrency(costs.initialRepairs || 0)]
    ];
    
    this.addStyledTable(purchaseData, ['Item', 'Amount'], this.colors.primary);
    
    // Total cash required with emphasis box
    this.addHighlightBox(
      'Total Cash Required',
      this.formatCurrency(costs.totalCashRequired || 0),
      this.colors.accent
    );
    
    // Add expense breakdown pie chart
    if (this.charts && this.charts.expenseBreakdown) {
      this.addSubHeader('Monthly Expense Distribution');
      this.checkPageBreak(100);
      this.doc.addImage(this.charts.expenseBreakdown, 'PNG', 
        this.margin + 20, this.currentY, this.contentWidth - 40, this.contentWidth - 40);
      this.currentY += this.contentWidth - 30;
    }
    
    this.checkPageBreak();
  }
  
  // Enhanced Long-term Rental Analysis
  async addEnhancedLongTermRentalAnalysis() {
    this.addSectionHeader('Long-term Rental Analysis', this.colors.primary);
    
    const rental = this.analysisData.longTermRental || {};
    
    // Key metrics cards
    this.addMetricsCards([
      { label: 'Monthly Rent', value: this.formatCurrency(rental.monthlyRent || 0) },
      { label: 'Monthly Cash Flow', value: this.formatCurrency(rental.monthlyCashFlow || 0),
        positive: rental.monthlyCashFlow > 0 },
      { label: 'Cap Rate', value: `${(rental.capRate || 0).toFixed(2)}%` },
      { label: 'Annual ROI', value: `${(rental.annualROI || 0).toFixed(2)}%` }
    ]);
    
    // Detailed breakdown
    this.addSubHeader('Cash Flow Analysis');
    
    const cashFlowData = [
      ['Monthly Rental Income', this.formatCurrency(rental.effectiveIncome || 0), '+'],
      ['Mortgage Payment', this.formatCurrency(rental.mortgagePayment || 0), '-'],
      ['Property Tax', this.formatCurrency(rental.propertyTax || 0), '-'],
      ['Insurance', this.formatCurrency(rental.insurance || 0), '-'],
      ['HOA/Maintenance', this.formatCurrency((rental.hoaFees || 0) + (rental.maintenance || 0)), '-'],
      ['Property Management', this.formatCurrency(rental.propertyManagement || 0), '-'],
      ['Net Monthly Cash Flow', this.formatCurrency(rental.monthlyCashFlow || 0), '=']
    ];
    
    this.addCashFlowTable(cashFlowData);
    
    this.checkPageBreak();
  }
  
  // Enhanced Short-term Rental Analysis with comparison chart
  async addEnhancedShortTermRentalAnalysis() {
    this.addSectionHeader('Short-term Rental Analysis', this.colors.accent);
    
    const str = this.analysisData.strAnalysis || {};
    
    // Add ROI comparison chart
    if (this.charts && this.charts.roiComparison) {
      this.addSubHeader('Rental Strategy Comparison');
      this.doc.addImage(this.charts.roiComparison, 'PNG', 
        this.margin, this.currentY, this.contentWidth, this.contentWidth * 0.5);
      this.currentY += this.contentWidth * 0.5 + 10;
    }
    
    // Key STR metrics
    this.addMetricsCards([
      { label: 'Nightly Rate', value: this.formatCurrency(str.averageDailyRate || 0) },
      { label: 'Occupancy', value: `${((str.occupancyRate || 0) * 100).toFixed(0)}%` },
      { label: 'Monthly Revenue', value: this.formatCurrency(str.monthlyRevenue || 0) },
      { label: 'Annual ROI', value: `${(str.annualROI || 0).toFixed(1)}%` }
    ]);
    
    // Add occupancy trends chart
    if (this.charts && this.charts.occupancyTrends) {
      this.addSubHeader('Seasonal Occupancy Patterns');
      this.checkPageBreak(100);
      this.doc.addImage(this.charts.occupancyTrends, 'PNG', 
        this.margin, this.currentY, this.contentWidth, this.contentWidth * 0.5);
      this.currentY += this.contentWidth * 0.5 + 10;
    }
    
    this.checkPageBreak();
  }
  
  // Enhanced Comparative Analysis
  addEnhancedComparativeAnalysis() {
    this.addSectionHeader('Market Comparison', this.colors.primary);
    
    const comparables = this.analysisData.comparables || [];
    
    if (comparables.length > 0) {
      this.setTypography('body');
      this.doc.setTextColor(...this.colors.secondary);
      this.doc.text('Analysis of comparable properties in the area:', this.margin, this.currentY);
      this.currentY += 10;
      
      const compData = comparables.slice(0, 5).map(comp => [
        comp.address ? comp.address.substring(0, 30) + '...' : 'N/A',
        this.formatCurrency(comp.price || 0),
        `${comp.bedrooms || 0}/${comp.bathrooms || 0}`,
        comp.sqft ? `${comp.sqft.toLocaleString()}` : 'N/A',
        this.formatCurrency(comp.pricePerSqft || 0)
      ]);
      
      this.doc.autoTable({
        head: [['Property', 'Price', 'Bed/Bath', 'Sq Ft', '$/Sq Ft']],
        body: compData,
        startY: this.currentY,
        margin: { left: this.margin, right: this.margin },
        theme: 'grid',
        headStyles: { 
          fillColor: this.colors.primary,
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        }
      });
      
      this.currentY = this.doc.previousAutoTable.finalY + 10;
    }
    
    this.checkPageBreak();
  }
  
  // Enhanced Investment Recommendations
  addEnhancedInvestmentRecommendations() {
    this.addSectionHeader('Investment Recommendations', this.colors.success);
    
    const recommendations = this.generateRecommendations();
    const grade = this.calculateInvestmentGrade();
    
    // Investment grade box
    this.addInvestmentGradeBox(grade);
    
    // Recommendations with icons
    this.setTypography('body');
    recommendations.forEach((rec, index) => {
      // Determine icon based on recommendation type
      let icon = '💡';
      let color = this.colors.secondary;
      
      if (rec.includes('Strong') || rec.includes('excellent')) {
        icon = '✅';
        color = this.colors.success;
      } else if (rec.includes('Negative') || rec.includes('careful')) {
        icon = '⚠️';
        color = this.colors.warning;
      } else if (rec.includes('Consider')) {
        icon = '🔍';
        color = this.colors.primary;
      }
      
      // Add recommendation with icon
      this.doc.setTextColor(...color);
      this.doc.setFillColor(...color);
      this.doc.circle(this.margin + 2, this.currentY - 2, 1.5, 'F');
      
      this.doc.setTextColor(...this.colors.secondary);
      const lines = this.doc.splitTextToSize(rec, this.contentWidth - 10);
      this.doc.text(lines, this.margin + 8, this.currentY);
      this.currentY += lines.length * 5 + 5;
      
      this.checkPageBreak();
    });
    
    this.currentY += 5;
  }
  
  // Enhanced Risk Assessment with matrix
  addEnhancedRiskAssessment() {
    this.addSectionHeader('Risk Assessment', this.colors.danger);
    
    const risks = this.generateRiskAssessment();
    
    // Risk matrix visualization
    this.addRiskMatrix(risks);
    
    // Detailed risk descriptions
    risks.forEach(risk => {
      this.addEnhancedRiskItem(risk);
    });
    
    this.checkPageBreak();
  }
  
  // Enhanced Market Trends
  async addEnhancedMarketTrends() {
    this.addSectionHeader('Market Trends & Outlook', this.colors.primary);
    
    const trends = [
      { trend: 'Property values increased 5-7% annually over past 5 years', positive: true },
      { trend: 'Strong rental demand due to population growth', positive: true },
      { trend: 'Interest rates currently favorable for investment', positive: true },
      { trend: 'Low unemployment and business growth in area', positive: true },
      { trend: 'Future development plans may impact property values', positive: true }
    ];
    
    this.setTypography('body');
    trends.forEach(item => {
      const color = item.positive ? this.colors.success : this.colors.warning;
      
      // Trend indicator
      this.doc.setFillColor(...color);
      this.doc.triangle(
        this.margin + 2, this.currentY - 3,
        this.margin + 4, this.currentY - 1,
        this.margin, this.currentY - 1,
        'F'
      );
      
      // Trend text
      this.doc.setTextColor(...this.colors.secondary);
      const lines = this.doc.splitTextToSize(item.trend, this.contentWidth - 10);
      this.doc.text(lines, this.margin + 8, this.currentY);
      this.currentY += lines.length * 5 + 5;
    });
    
    this.checkPageBreak();
  }
  
  // Enhanced Custom Notes
  addEnhancedCustomNotes() {
    this.addSectionHeader('Additional Notes', this.colors.secondary);
    
    // Add note box with professional styling
    this.doc.setFillColor(248, 249, 250);
    this.doc.setDrawColor(...this.colors.light);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 50, 3, 3, 'FD');
    
    this.setTypography('body');
    this.doc.setTextColor(...this.colors.secondary);
    
    const lines = this.doc.splitTextToSize(this.reportConfig.customNotes, this.contentWidth - 10);
    this.doc.text(lines, this.margin + 5, this.currentY + 8);
    this.currentY += 55;
    
    this.checkPageBreak();
  }
  
  // Enhanced Table of Contents
  addEnhancedTableOfContents() {
    this.addSectionHeader('Table of Contents', this.colors.primary);
    
    const sections = this.reportConfig.selectedSections || [];
    const tocItems = [];
    let pageNum = 3;
    
    const sectionMap = {
      'executiveSummary': 'Executive Summary',
      'propertyDetails': 'Property Details',
      'financialAnalysis': 'Financial Analysis',
      'longTermRental': 'Long-term Rental Analysis',
      'shortTermRental': 'Short-term Rental Analysis',
      'comparativeAnalysis': 'Market Comparison',
      'investmentRecommendations': 'Investment Recommendations',
      'riskAssessment': 'Risk Assessment',
      'marketTrends': 'Market Trends & Outlook'
    };
    
    sections.forEach(section => {
      if (sectionMap[section]) {
        tocItems.push([sectionMap[section], pageNum]);
        pageNum += section.includes('Analysis') ? 2 : 1;
      }
    });
    
    this.setTypography('body');
    this.doc.setTextColor(...this.colors.secondary);
    
    tocItems.forEach(([title, page], index) => {
      // Section number
      this.doc.setFont(undefined, 'bold');
      this.doc.text(`${index + 1}.`, this.margin, this.currentY);
      
      // Section title
      this.doc.setFont(undefined, 'normal');
      this.doc.text(title, this.margin + 8, this.currentY);
      
      // Page number
      this.doc.text(page.toString(), this.pageWidth - this.margin - 10, this.currentY);
      
      // Dotted line
      this.doc.setLineDash([1, 1]);
      this.doc.setDrawColor(...this.colors.light);
      this.doc.line(
        this.margin + 8 + this.doc.getTextWidth(title) + 5,
        this.currentY - 1,
        this.pageWidth - this.margin - 15,
        this.currentY - 1
      );
      this.doc.setLineDash([]);
      
      this.currentY += 8;
    });
    
    this.addNewPage();
  }
  
  // Helper Methods
  
  setTypography(style) {
    const settings = this.typography[style];
    if (settings) {
      this.doc.setFontSize(settings.size);
      this.doc.setFont(settings.font, settings.style);
    }
  }
  
  addSectionHeader(title, color = this.colors.primary) {
    this.checkPageBreak(40);
    
    // Section number
    this.sectionNumber = (this.sectionNumber || 0) + 1;
    
    // Background accent
    this.doc.setFillColor(...color);
    this.doc.rect(this.margin - 5, this.currentY - 8, 3, 20, 'F');
    
    this.setTypography('h1');
    this.doc.setTextColor(...color);
    this.doc.text(title, this.margin, this.currentY);
    
    // Underline
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY + 3, this.margin + this.doc.getTextWidth(title), this.currentY + 3);
    
    this.currentY += 15;
  }
  
  addSubHeader(title) {
    this.checkPageBreak(30);
    
    this.setTypography('h3');
    this.doc.setTextColor(...this.colors.secondary);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
  }
  
  addStyledTable(data, headers, headerColor) {
    this.doc.autoTable({
      head: [headers],
      body: data,
      startY: this.currentY,
      margin: { left: this.margin, right: this.margin },
      theme: 'grid',
      headStyles: { 
        fillColor: headerColor,
        fontSize: 11,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      }
    });
    
    this.currentY = this.doc.previousAutoTable.finalY + 10;
  }
  
  addCashFlowTable(data) {
    const tableY = this.currentY;
    const rowHeight = 8;
    
    data.forEach((row, index) => {
      const isTotal = row[2] === '=';
      const isIncome = row[2] === '+';
      
      if (isTotal) {
        // Total row with emphasis
        this.doc.setFillColor(...this.colors.light);
        this.doc.rect(this.margin, tableY + (index * rowHeight) - 2, this.contentWidth, rowHeight, 'F');
        this.doc.setFont(undefined, 'bold');
      }
      
      // Label
      this.setTypography('body');
      this.doc.setTextColor(...this.colors.secondary);
      this.doc.text(row[0], this.margin + 5, tableY + (index * rowHeight) + 3);
      
      // Amount with color coding
      if (isIncome || row[1].includes('-')) {
        this.doc.setTextColor(...(isIncome ? this.colors.success : this.colors.secondary));
      } else if (isTotal) {
        const value = parseFloat(row[1].replace(/[^0-9.-]/g, ''));
        this.doc.setTextColor(...(value >= 0 ? this.colors.success : this.colors.danger));
      }
      
      this.doc.text(row[1], this.pageWidth - this.margin - 5, tableY + (index * rowHeight) + 3, { align: 'right' });
      
      if (isTotal) {
        this.doc.setFont(undefined, 'normal');
      }
    });
    
    this.currentY = tableY + (data.length * rowHeight) + 10;
  }
  
  addHighlightBox(label, value, color) {
    const boxHeight = 20;
    
    this.doc.setFillColor(...color);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxHeight, 3, 3, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.setTypography('h3');
    this.doc.text(label, this.margin + 10, this.currentY + 8);
    
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(value, this.pageWidth - this.margin - 10, this.currentY + 12, { align: 'right' });
    
    this.currentY += boxHeight + 10;
  }
  
  addMetricsCards(metrics) {
    const cardWidth = (this.contentWidth - 15) / 4;
    const cardHeight = 25;
    let cardX = this.margin;
    
    metrics.forEach(metric => {
      // Card background
      this.doc.setFillColor(248, 249, 250);
      this.doc.setDrawColor(...this.colors.light);
      this.doc.roundedRect(cardX, this.currentY, cardWidth, cardHeight, 2, 2, 'FD');
      
      // Label
      this.setTypography('small');
      this.doc.setTextColor(...this.colors.secondary);
      this.doc.text(metric.label, cardX + cardWidth/2, this.currentY + 8, { align: 'center' });
      
      // Value
      const valueColor = metric.positive !== undefined ? 
        (metric.positive ? this.colors.success : this.colors.danger) : 
        this.colors.primary;
      
      this.doc.setFontSize(14);
      this.doc.setFont(undefined, 'bold');
      this.doc.setTextColor(...valueColor);
      this.doc.text(metric.value, cardX + cardWidth/2, this.currentY + 17, { align: 'center' });
      
      cardX += cardWidth + 5;
    });
    
    this.currentY += cardHeight + 10;
  }
  
  addInvestmentGradeBox(grade) {
    const gradeColors = {
      'A+': this.colors.success,
      'A': this.colors.success,
      'B+': this.colors.accent,
      'B': this.colors.accent,
      'C+': this.colors.warning,
      'C': this.colors.warning,
      'D': this.colors.danger,
      'F': this.colors.danger
    };
    
    const color = gradeColors[grade] || this.colors.secondary;
    
    // Grade box with gradient effect
    const boxWidth = 120;
    const boxHeight = 30;
    const boxX = (this.pageWidth - boxWidth) / 2;
    
    // Gradient background
    for (let i = 0; i < 10; i++) {
      const alpha = 1 - (i * 0.08);
      this.doc.setFillColor(...color.map(c => 255 - (255 - c) * alpha));
      this.doc.roundedRect(boxX, this.currentY + i, boxWidth, boxHeight - i, 3, 3, 'F');
    }
    
    // Grade text
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(`Grade: ${grade}`, this.pageWidth / 2, this.currentY + 20, { align: 'center' });
    
    this.currentY += boxHeight + 15;
  }
  
  addRiskMatrix(risks) {
    // Simple risk matrix visualization
    const matrixSize = 60;
    const matrixX = (this.pageWidth - matrixSize) / 2;
    
    // Matrix grid
    this.doc.setDrawColor(...this.colors.light);
    this.doc.setLineWidth(0.5);
    
    // Draw grid
    for (let i = 0; i <= 3; i++) {
      const offset = i * (matrixSize / 3);
      this.doc.line(matrixX, this.currentY + offset, matrixX + matrixSize, this.currentY + offset);
      this.doc.line(matrixX + offset, this.currentY, matrixX + offset, this.currentY + matrixSize);
    }
    
    // Labels
    this.setTypography('caption');
    this.doc.setTextColor(...this.colors.secondary);
    this.doc.text('Impact →', matrixX + matrixSize + 5, this.currentY + matrixSize / 2);
    this.doc.text('Probability ↑', matrixX + matrixSize / 2, this.currentY - 5, { align: 'center' });
    
    this.currentY += matrixSize + 20;
  }
  
  addEnhancedRiskItem(risk) {
    const levelColors = {
      'Low': this.colors.success,
      'Medium': this.colors.warning,
      'High': this.colors.danger
    };
    
    const levelColor = levelColors[risk.level] || this.colors.secondary;
    
    // Risk card
    this.doc.setFillColor(248, 249, 250);
    this.doc.setDrawColor(...this.colors.light);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 25, 2, 2, 'FD');
    
    // Risk level indicator
    this.doc.setFillColor(...levelColor);
    this.doc.rect(this.margin, this.currentY, 3, 25, 'F');
    
    // Risk category
    this.setTypography('h3');
    this.doc.setTextColor(...this.colors.secondary);
    this.doc.text(risk.category, this.margin + 8, this.currentY + 8);
    
    // Risk level badge
    this.doc.setFillColor(...levelColor);
    this.doc.roundedRect(this.pageWidth - this.margin - 30, this.currentY + 3, 25, 8, 2, 2, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.setTypography('small');
    this.doc.text(risk.level, this.pageWidth - this.margin - 17.5, this.currentY + 8, { align: 'center' });
    
    // Risk description
    this.setTypography('small');
    this.doc.setTextColor(...this.colors.secondary);
    const lines = this.doc.splitTextToSize(risk.description, this.contentWidth - 15);
    this.doc.text(lines, this.margin + 8, this.currentY + 15);
    
    this.currentY += 30;
  }
  
  renderTwoColumnLayout(leftData, rightData) {
    const columnWidth = (this.contentWidth - 10) / 2;
    const startY = this.currentY;
    
    // Left column
    let leftY = startY;
    leftData.forEach(([label, value]) => {
      this.setTypography('small');
      this.doc.setTextColor(...this.colors.secondary);
      this.doc.setFont(undefined, 'bold');
      this.doc.text(label + ':', this.margin, leftY);
      
      this.doc.setFont(undefined, 'normal');
      this.doc.text(value, this.margin + 35, leftY);
      leftY += 8;
    });
    
    // Right column
    let rightY = startY;
    rightData.forEach(([label, value]) => {
      this.setTypography('small');
      this.doc.setTextColor(...this.colors.secondary);
      this.doc.setFont(undefined, 'bold');
      this.doc.text(label + ':', this.margin + columnWidth + 10, rightY);
      
      this.doc.setFont(undefined, 'normal');
      this.doc.text(value, this.margin + columnWidth + 45, rightY);
      rightY += 8;
    });
    
    this.currentY = Math.max(leftY, rightY) + 10;
  }
  
  generateRiskAssessment() {
    const risks = [
      {
        category: 'Market Risk',
        level: 'Medium',
        description: 'Property values may fluctuate based on local market conditions.'
      },
      {
        category: 'Vacancy Risk',
        level: this.analysisData.longTermRental?.vacancyRate > 0.1 ? 'High' : 'Low',
        description: 'Extended vacancy periods can impact cash flow projections.'
      },
      {
        category: 'Maintenance Risk',
        level: 'Medium',
        description: 'Unexpected repairs may exceed budgeted amounts.'
      }
    ];
    
    if (this.analysisData.strAnalysis) {
      risks.push({
        category: 'Regulatory Risk (STR)',
        level: 'High',
        description: 'Local STR regulations may change, affecting income potential.'
      });
    }
    
    return risks;
  }
  
  addProfessionalFooter() {
    const totalPages = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Footer background
      this.doc.setFillColor(...this.colors.light);
      this.doc.rect(0, this.pageHeight - 20, this.pageWidth, 20, 'F');
      
      // Disclaimer
      this.setTypography('caption');
      this.doc.setTextColor(...this.colors.secondary);
      const disclaimer = 'This report is for informational purposes only. Consult professionals before making investment decisions.';
      this.doc.text(disclaimer, this.pageWidth / 2, this.pageHeight - 12, { align: 'center' });
      
      // Contact info and page number
      if (this.realtorInfo) {
        let contactInfo = this.realtorInfo.phone || '';
        if (this.realtorInfo.email) {
          contactInfo += (contactInfo ? ' | ' : '') + this.realtorInfo.email;
        }
        this.doc.text(contactInfo, this.margin, this.pageHeight - 6);
      }
      
      // Page number
      if (i > 1) {
        this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 6, { align: 'right' });
      }
    }
  }
  
  // Inherited helper methods
  
  calculateKeyMetrics() {
    const data = this.analysisData;
    const purchasePrice = data.propertyDetails?.price || 0;
    const monthlyCashFlow = data.longTermRental?.monthlyCashFlow || 0;
    const annualROI = data.longTermRental?.annualROI || 0;
    const capRate = data.longTermRental?.capRate || 0;
    
    return {
      purchasePrice: this.formatCurrency(purchasePrice),
      monthlyCashFlow: this.formatCurrency(monthlyCashFlow),
      cashFlowPositive: monthlyCashFlow > 0,
      annualROI: `${annualROI.toFixed(1)}%`,
      capRate: `${capRate.toFixed(1)}%`
    };
  }
  
  calculateInvestmentGrade() {
    const roi = this.analysisData.longTermRental?.annualROI || 0;
    const cashFlow = this.analysisData.longTermRental?.monthlyCashFlow || 0;
    const capRate = this.analysisData.longTermRental?.capRate || 0;
    
    let score = 0;
    
    if (roi >= 15) score += 40;
    else if (roi >= 10) score += 30;
    else if (roi >= 7) score += 20;
    else if (roi >= 5) score += 10;
    else if (roi >= 0) score += 5;
    
    if (cashFlow >= 1000) score += 30;
    else if (cashFlow >= 500) score += 20;
    else if (cashFlow >= 200) score += 15;
    else if (cashFlow >= 0) score += 10;
    
    if (capRate >= 8) score += 30;
    else if (capRate >= 6) score += 20;
    else if (capRate >= 4) score += 10;
    else if (capRate >= 2) score += 5;
    
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }
  
  generateExecutiveSummary() {
    const data = this.analysisData;
    const address = data.propertyAddress || 'the property';
    const price = this.formatCurrency(data.propertyDetails?.price || 0);
    const cashFlow = this.formatCurrency(data.longTermRental?.monthlyCashFlow || 0);
    const roi = (data.longTermRental?.annualROI || 0).toFixed(1);
    
    let summary = `This comprehensive analysis evaluates the investment potential of ${address}. `;
    summary += `With a purchase price of ${price}, the property demonstrates `;
    
    if (data.longTermRental?.monthlyCashFlow > 0) {
      summary += `positive monthly cash flow of ${cashFlow} and an annual ROI of ${roi}%. `;
    } else {
      summary += `negative monthly cash flow of ${cashFlow}, requiring careful consideration. `;
    }
    
    if (data.strAnalysis) {
      const strRevenue = this.formatCurrency(data.strAnalysis.monthlyRevenue || 0);
      summary += `Short-term rental analysis indicates potential monthly revenue of ${strRevenue}, `;
      summary += `offering an alternative investment strategy. `;
    }
    
    summary += `This report provides detailed financial projections, market comparisons, and strategic recommendations `;
    summary += `to support your investment decision-making process.`;
    
    return summary;
  }
  
  generateRecommendations() {
    const recommendations = [];
    const roi = this.analysisData.longTermRental?.annualROI || 0;
    const cashFlow = this.analysisData.longTermRental?.monthlyCashFlow || 0;
    const capRate = this.analysisData.longTermRental?.capRate || 0;
    
    if (roi >= 10) {
      recommendations.push('Strong ROI indicates excellent investment potential. Consider proceeding with purchase.');
    } else if (roi >= 5) {
      recommendations.push('Moderate ROI suggests reasonable investment opportunity. Compare with alternative investments.');
    } else {
      recommendations.push('Low ROI indicates limited investment potential. Consider negotiating price or exploring other properties.');
    }
    
    if (cashFlow > 500) {
      recommendations.push('Positive cash flow provides good monthly income and financial stability.');
    } else if (cashFlow > 0) {
      recommendations.push('Marginal positive cash flow. Consider strategies to increase rental income or reduce expenses.');
    } else {
      recommendations.push('Negative cash flow requires careful consideration. Ensure you can sustain monthly losses.');
    }
    
    if (this.analysisData.strAnalysis) {
      const strCashFlow = this.analysisData.strAnalysis.monthlyCashFlow || 0;
      if (strCashFlow > cashFlow * 1.5) {
        recommendations.push('Short-term rental shows significantly higher returns. Consider STR strategy if regulations permit.');
      }
    }
    
    if (capRate >= 6) {
      recommendations.push('Cap rate indicates strong income relative to property value.');
    }
    
    recommendations.push('Conduct professional property inspection before finalizing purchase.');
    recommendations.push('Review local market trends and economic indicators for long-term appreciation potential.');
    
    return recommendations;
  }
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  
  checkPageBreak(requiredSpace = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - 20) {
      this.addNewPage();
    }
  }
  
  addNewPage() {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.margin + 10;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnhancedPDFReportBuilder };
} else {
  window.EnhancedPDFReportBuilder = EnhancedPDFReportBuilder;
}