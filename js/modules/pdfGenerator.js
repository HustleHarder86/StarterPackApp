/**
 * PDF Report Generator Module
 * Creates downloadable PDF reports from analysis data
 * Uses browser-based PDF generation
 */

export class PDFReportGenerator {
  constructor() {
    this.analysisData = null;
  }

  async generateReport(analysisData) {
    this.analysisData = analysisData;
    
    // Create a new window for the report
    const reportWindow = window.open('', '_blank');
    
    if (!reportWindow) {
      alert('Please allow pop-ups to generate the PDF report');
      return;
    }

    // Generate HTML content for the report
    const htmlContent = this.generateHTMLReport();
    
    // Write the content to the new window
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
    
    // Wait for content to load then trigger print
    reportWindow.onload = () => {
      setTimeout(() => {
        reportWindow.print();
      }, 500);
    };
  }

  generateHTMLReport() {
    const data = this.analysisData;
    const currentDate = new Date().toLocaleDateString();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Investment Analysis Report</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
      @page { margin: 0.5in; }
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      margin: -20px -20px 30px -20px;
      text-align: center;
    }
    
    h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    
    h2 {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
      margin-top: 30px;
    }
    
    h3 {
      color: #764ba2;
      margin-top: 20px;
    }
    
    .subtitle {
      font-size: 18px;
      opacity: 0.9;
    }
    
    .date {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 10px;
    }
    
    .key-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    
    .metric-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin: 10px 0;
    }
    
    .metric-label {
      font-size: 14px;
      color: #666;
    }
    
    .recommendation-box {
      background: #f0f4ff;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    
    .recommendation-box.buy {
      background: #e6fffa;
      border-color: #10b981;
    }
    
    .recommendation-box.hold {
      background: #fffbeb;
      border-color: #f59e0b;
    }
    
    .recommendation-box.sell {
      background: #fee;
      border-color: #ef4444;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #667eea;
    }
    
    tr:hover {
      background: #f8f9fa;
    }
    
    .property-image {
      max-width: 100%;
      height: 300px;
      object-fit: cover;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .summary-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .disclaimer {
      font-size: 12px;
      color: #666;
      padding: 20px;
      border-top: 1px solid #ddd;
      margin-top: 40px;
    }
    
    .print-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      margin: 20px auto;
      display: block;
    }
    
    .print-button:hover {
      background: #5a67d8;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Download as PDF</button>
  
  <div class="header">
    <h1>Property Investment Analysis</h1>
    <div class="subtitle">${data.property_address || 'Property Address'}</div>
    <div class="date">Report Generated: ${currentDate}</div>
  </div>
  
  ${this.generatePropertyImage(data)}
  
  <div class="key-metrics">
    <div class="metric-box">
      <div class="metric-label">Purchase Price</div>
      <div class="metric-value">$${(data.property?.price || 0).toLocaleString()}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Monthly Cash Flow</div>
      <div class="metric-value">$${(data.long_term_rental?.cash_flow || 0).toLocaleString()}</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Cap Rate</div>
      <div class="metric-value">${((data.long_term_rental?.cap_rate || 0) * 100).toFixed(2)}%</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Investment Score</div>
      <div class="metric-value">${data.investment_score || 0}/10</div>
    </div>
  </div>
  
  <h2>Executive Summary</h2>
  ${this.generateRecommendationBox(data)}
  
  <div class="summary-section">
    <p>This comprehensive analysis evaluates the investment potential of the property located at <strong>${data.property_address || 'the specified address'}</strong>.</p>
    <ul>
      <li>Expected monthly rental income: <strong>$${(data.long_term_rental?.monthly_rent || 0).toLocaleString()}</strong></li>
      <li>Total monthly expenses: <strong>$${(data.costs?.total_monthly || 0).toLocaleString()}</strong></li>
      <li>Net monthly cash flow: <strong>$${(data.long_term_rental?.cash_flow || 0).toLocaleString()}</strong></li>
      <li>Short-term rental potential: <strong>$${(data.strAnalysis?.monthlyRevenue || 0).toLocaleString()}/month</strong> at ${data.strAnalysis?.occupancyRate || 70}% occupancy</li>
      <li>Recommended strategy: <strong>${data.comparison?.better_strategy === 'str' ? 'Short-Term Rental' : 'Long-Term Rental'}</strong></li>
    </ul>
  </div>
  
  <h2>Property Details</h2>
  <table>
    <tr><th>Feature</th><th>Details</th></tr>
    <tr><td>Address</td><td>${data.property_address || 'N/A'}</td></tr>
    <tr><td>Property Type</td><td>${data.property?.propertyType || 'N/A'}</td></tr>
    <tr><td>Bedrooms</td><td>${data.property?.bedrooms || 'N/A'}</td></tr>
    <tr><td>Bathrooms</td><td>${data.property?.bathrooms || 'N/A'}</td></tr>
    <tr><td>Square Feet</td><td>${data.property?.squareFeet ? data.property.squareFeet.toLocaleString() + ' sq ft' : 'N/A'}</td></tr>
    <tr><td>Year Built</td><td>${data.propertyData?.yearBuilt || 'N/A'}</td></tr>
    <tr><td>Property Taxes</td><td>$${data.costs?.property_tax_monthly || 0}/month</td></tr>
    <tr><td>HOA/Condo Fees</td><td>$${data.costs?.hoa_monthly || 0}/month</td></tr>
  </table>
  
  <div class="page-break"></div>
  
  <h2>Financial Analysis</h2>
  
  <h3>Monthly Operating Expenses</h3>
  <table>
    <tr><th>Expense Category</th><th>Monthly Amount</th></tr>
    <tr><td>Mortgage Payment</td><td>$${(data.costs?.mortgage_payment || 0).toLocaleString()}</td></tr>
    <tr><td>Property Tax</td><td>$${(data.costs?.property_tax_monthly || 0).toLocaleString()}</td></tr>
    <tr><td>Insurance</td><td>$${(data.costs?.insurance_monthly || 0).toLocaleString()}</td></tr>
    <tr><td>HOA/Condo Fees</td><td>$${(data.costs?.hoa_monthly || 0).toLocaleString()}</td></tr>
    <tr><td>Maintenance</td><td>$${(data.costs?.maintenance_monthly || 0).toLocaleString()}</td></tr>
    <tr><td>Utilities</td><td>$${(data.costs?.utilities_monthly || 0).toLocaleString()}</td></tr>
    <tr style="font-weight: bold;"><td>Total Monthly Expenses</td><td>$${(data.costs?.total_monthly || 0).toLocaleString()}</td></tr>
  </table>
  
  <h3>Rental Income Analysis</h3>
  <table>
    <tr><th>Strategy</th><th>Monthly Income</th><th>Annual Income</th><th>Occupancy Rate</th></tr>
    <tr>
      <td>Long-Term Rental</td>
      <td>$${(data.long_term_rental?.monthly_rent || 0).toLocaleString()}</td>
      <td>$${(data.long_term_rental?.annual_income || 0).toLocaleString()}</td>
      <td>${(100 - (data.long_term_rental?.vacancy_rate || 0.05) * 100).toFixed(0)}%</td>
    </tr>
    <tr>
      <td>Short-Term Rental</td>
      <td>$${(data.strAnalysis?.monthlyRevenue || 0).toLocaleString()}</td>
      <td>$${(data.strAnalysis?.annual_revenue || 0).toLocaleString()}</td>
      <td>${data.strAnalysis?.occupancyRate || 70}%</td>
    </tr>
  </table>
  
  ${this.generateComparablesSection(data)}
  
  <div class="page-break"></div>
  
  <h2>Investment Metrics</h2>
  <table>
    <tr><th>Metric</th><th>Value</th><th>Market Benchmark</th><th>Analysis</th></tr>
    <tr>
      <td>Cap Rate</td>
      <td>${((data.long_term_rental?.cap_rate || 0) * 100).toFixed(2)}%</td>
      <td>8-12%</td>
      <td>${(data.long_term_rental?.cap_rate || 0) > 0.08 ? '✓ Good' : '⚠ Below Average'}</td>
    </tr>
    <tr>
      <td>Cash Flow</td>
      <td>$${(data.long_term_rental?.cash_flow || 0).toLocaleString()}/month</td>
      <td>>$200/month</td>
      <td>${(data.long_term_rental?.cash_flow || 0) > 200 ? '✓ Good' : '⚠ Needs Improvement'}</td>
    </tr>
    <tr>
      <td>ROI</td>
      <td>${((data.long_term_rental?.roi || 0) * 100).toFixed(2)}%</td>
      <td>>10%</td>
      <td>${(data.long_term_rental?.roi || 0) > 0.10 ? '✓ Good' : '⚠ Below Average'}</td>
    </tr>
  </table>
  
  <div class="disclaimer">
    <h3>Disclaimer</h3>
    <p>This report is provided for informational purposes only and should not be considered as financial or investment advice. The analysis is based on current market data and estimates that may change over time. Actual rental income, expenses, and property values may vary significantly from the projections shown.</p>
    <p>We recommend consulting with qualified real estate professionals, financial advisors, and tax professionals before making any investment decisions. Past performance is not indicative of future results.</p>
    <p>© ${new Date().getFullYear()} StarterPackApp. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  generatePropertyImage(data) {
    const imageUrl = data.propertyData?.mainImage || data.property?.image || null;
    
    if (imageUrl) {
      return `<img src="${imageUrl}" alt="Property" class="property-image">`;
    }
    
    return '';
  }

  generateRecommendationBox(data) {
    const recommendation = data.recommendation || 'HOLD';
    let boxClass = 'hold';
    
    if (recommendation.includes('BUY')) {
      boxClass = 'buy';
    } else if (recommendation.includes('SELL') || recommendation.includes('NOT')) {
      boxClass = 'sell';
    }
    
    return `
      <div class="recommendation-box ${boxClass}">
        <h3 style="margin-top: 0;">Investment Recommendation</h3>
        <div style="font-size: 24px; font-weight: bold; margin: 10px 0;">${recommendation}</div>
        <div>Investment Score: ${data.investment_score || 0}/10</div>
      </div>
    `;
  }

  generateComparablesSection(data) {
    let html = '<h2>Market Comparables</h2>';
    
    if (data.strAnalysis?.comparables && data.strAnalysis.comparables.length > 0) {
      html += '<h3>Short-Term Rental Comparables</h3>';
      html += '<table>';
      html += '<tr><th>Property</th><th>Nightly Rate</th><th>Occupancy</th><th>Monthly Revenue</th></tr>';
      
      data.strAnalysis.comparables.slice(0, 5).forEach(comp => {
        html += `
          <tr>
            <td>${comp.title || 'Similar Property'}</td>
            <td>$${comp.nightly_rate || 0}/night</td>
            <td>${Math.round((comp.occupancy_rate || 0.7) * 100)}%</td>
            <td>$${(comp.monthly_revenue || 0).toLocaleString()}</td>
          </tr>
        `;
      });
      
      html += '</table>';
    }
    
    if (data.long_term_rental?.comparables && data.long_term_rental.comparables.length > 0) {
      html += '<h3>Long-Term Rental Comparables</h3>';
      html += '<table>';
      html += '<tr><th>Address</th><th>Monthly Rent</th><th>Bedrooms</th><th>Size</th></tr>';
      
      data.long_term_rental.comparables.slice(0, 3).forEach(comp => {
        html += `
          <tr>
            <td>${comp.address || 'Similar Property'}</td>
            <td>$${(comp.rent || 0).toLocaleString()}/month</td>
            <td>${comp.bedrooms || 'N/A'} BR</td>
            <td>${comp.sqft || 'N/A'} sq ft</td>
          </tr>
        `;
      });
      
      html += '</table>';
    }
    
    return html;
  }
}

// Export the generator
export default PDFReportGenerator;