const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Create timestamp for organizing screenshots
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const screenshotDir = path.join(__dirname, 'screenshots', 'ui-analysis-mock', timestamp);

// Mock analysis data that matches the expected structure
const mockAnalysisData = {
    timestamp: new Date().toISOString(),
    propertyData: {
        address: '456 Queen Street West, Toronto, ON M5V 2A9',
        price: 950000,
        bedrooms: 3,
        bathrooms: 2.5,
        sqft: 1850,
        propertyType: 'townhouse',
        propertyTaxes: 7200,
        condoFees: 450
    },
    costs: {
        mortgage_monthly: 4125,
        property_tax_monthly: 600,
        insurance_monthly: 150,
        utilities_monthly: 200,
        maintenance_monthly: 185,
        property_management_monthly: 0,
        hoa_monthly: 450,
        total_monthly: 5710
    },
    longTermRental: {
        monthlyRent: 3800,
        vacancy_rate: 0.05,
        annual_revenue: 43320,
        annual_expenses: 23520,
        annual_profit: 19800,
        cashFlow: 1650,
        roi: 2.08,
        cap_rate: 2.29,
        cash_on_cash_return: 8.68
    },
    strAnalysis: {
        avgNightlyRate: 185,
        nightlyRate: 185,
        daily_rate: 185,
        occupancyRate: 65,
        occupancy_rate: 0.65,
        monthlyRevenue: 3608,
        annual_revenue: 43290,
        annual_expenses: 28800,
        annual_profit: 14490,
        comparables: [
            {
                title: 'Modern Downtown Townhouse - 3BR',
                nightly_rate: 195,
                occupancy_rate: 0.68,
                monthly_revenue: 3978,
                bedrooms: 3,
                bathrooms: 2,
                rating: 4.8,
                reviews: 124,
                area: 'Downtown Toronto'
            },
            {
                title: 'Stylish Queen West Home',
                nightly_rate: 175,
                occupancy_rate: 0.63,
                monthly_revenue: 3308,
                bedrooms: 3,
                bathrooms: 2.5,
                rating: 4.7,
                reviews: 89,
                area: 'Queen West'
            },
            {
                title: 'Cozy Urban Retreat',
                nightly_rate: 190,
                occupancy_rate: 0.64,
                monthly_revenue: 3648,
                bedrooms: 3,
                bathrooms: 2,
                rating: 4.9,
                reviews: 156,
                area: 'West End'
            }
        ]
    },
    investment_analysis: {
        total_investment: 237500,
        year_1_cash_flow: 19800,
        year_5_appreciation: 142500,
        ten_year_equity: 385000,
        break_even_year: 3
    }
};

// Helper function to ensure directory exists
async function ensureDir(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

// Helper function to take labeled screenshots
async function takeScreenshot(page, name, options = {}) {
    const screenshotPath = path.join(screenshotDir, `${name}.png`);
    await page.screenshot({ 
        path: screenshotPath, 
        fullPage: options.fullPage !== false,
        ...options 
    });
    console.log(`📸 Screenshot saved: ${name}`);
    return screenshotPath;
}

// Helper function to inject mock data and render analysis
async function renderMockAnalysis(page) {
    await page.evaluate((mockData) => {
        // Set up mock app state
        window.appState = {
            currentUser: { uid: 'test-user', email: 'test@example.com' },
            currentAnalysis: mockData,
            userData: { subscriptionTier: 'premium', strTrialUsed: 0 }
        };
        
        // Also set window.analysisData for compatibility
        window.analysisData = mockData;
        
        // Hide all sections
        document.querySelectorAll('#loading-state, #login-section, #property-input-section, #error-state')
            .forEach(el => el.classList.add('hidden'));
        
        // Show analysis results
        const resultsContainer = document.getElementById('analysis-results');
        resultsContainer.classList.remove('hidden');
        
        // Load component loader and render
        if (window.componentLoader) {
            window.componentLoader.renderAnalysisResults(mockData, resultsContainer);
        }
    }, mockAnalysisData);
}

// Main UI/UX analysis function
async function analyzeUIUX() {
    console.log('🎨 Starting UI/UX Analysis with Mock Data');
    console.log('📁 Screenshots will be saved to:', screenshotDir);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
            width: 1440,
            height: 900,
            deviceScaleFactor: 2
        }
    });

    const analysisResults = {
        timestamp: new Date().toISOString(),
        tabs: {},
        issues: [],
        recommendations: [],
        screenshots: {}
    };

    try {
        const page = await browser.newPage();
        
        // Go to the app
        await page.goto('http://localhost:3000/roi-finder.html', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Inject mock data and render analysis
        await renderMockAnalysis(page);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take overview screenshot
        console.log('\n📍 Analyzing Overview Tab');
        await takeScreenshot(page, '01-overview-tab', { fullPage: true });
        
        // Analyze tab structure
        const tabButtons = await page.$$eval('nav[aria-label="Tabs"] button, .tab-button, button[role="tab"]', buttons => 
            buttons.map(btn => btn.textContent.trim())
        );
        console.log('Found tabs:', tabButtons);
        
        // Click Long Term Rental tab
        console.log('\n📍 Analyzing Long Term Rental Tab');
        const ltrClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const ltrButton = buttons.find(btn => 
                btn.textContent.includes('Long Term Rental') || 
                btn.textContent.includes('Long-Term') ||
                btn.getAttribute('aria-label')?.includes('Long Term')
            );
            if (ltrButton) {
                ltrButton.click();
                return true;
            }
            return false;
        });
        
        if (ltrClicked) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await takeScreenshot(page, '02-long-term-rental-tab', { fullPage: true });
            
            // Analyze LTR content
            const ltrAnalysis = await page.evaluate(() => {
                const content = document.querySelector('#analysis-results').textContent;
                return {
                    hasMonthlyRent: content.includes('3,800') || content.includes('Monthly Rent'),
                    hasCashFlow: content.includes('1,650') || content.includes('Cash Flow'),
                    hasROI: content.includes('2.08') || content.includes('ROI'),
                    hasExpenses: content.includes('expense') || content.includes('Expense')
                };
            });
            
            analysisResults.tabs.longTermRental = {
                ...ltrAnalysis,
                screenshot: '02-long-term-rental-tab.png',
                notes: 'Analyzed Long Term Rental financial metrics and presentation'
            };
        }
        
        // Click Investment Analysis tab
        console.log('\n📍 Analyzing Investment Analysis Tab');
        const investmentClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const invButton = buttons.find(btn => 
                btn.textContent.includes('Investment Analysis') || 
                btn.textContent.includes('Investment') ||
                btn.getAttribute('aria-label')?.includes('Investment')
            );
            if (invButton) {
                invButton.click();
                return true;
            }
            return false;
        });
        
        if (investmentClicked) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await takeScreenshot(page, '03-investment-analysis-tab', { fullPage: true });
            
            // Analyze Investment content
            const investmentAnalysis = await page.evaluate(() => {
                const content = document.querySelector('#analysis-results').textContent;
                return {
                    hasCapRate: content.includes('Cap Rate') || content.includes('2.29'),
                    hasCashOnCash: content.includes('Cash-on-Cash') || content.includes('8.68'),
                    hasBreakeven: content.includes('Break') || content.includes('year 3'),
                    hasProjections: content.includes('Year') || content.includes('Projection')
                };
            });
            
            analysisResults.tabs.investmentAnalysis = {
                ...investmentAnalysis,
                screenshot: '03-investment-analysis-tab.png',
                notes: 'Analyzed Investment metrics and projections'
            };
        }
        
        // Check for charts
        console.log('\n📍 Checking for Data Visualizations');
        const chartAnalysis = await page.evaluate(() => {
            const charts = document.querySelectorAll('canvas');
            const svgCharts = document.querySelectorAll('svg[role="img"], .chart-container svg');
            return {
                canvasCharts: charts.length,
                svgCharts: svgCharts.length,
                totalCharts: charts.length + svgCharts.length
            };
        });
        
        analysisResults.dataVisualization = chartAnalysis;
        
        // Test responsive design
        console.log('\n📍 Testing Responsive Design');
        
        // Tablet view
        await page.setViewport({ width: 768, height: 1024 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await takeScreenshot(page, '04-tablet-view');
        
        // Mobile view
        await page.setViewport({ width: 375, height: 812 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await takeScreenshot(page, '05-mobile-view');
        
        // Generate recommendations
        analysisResults.recommendations = generateRecommendations(analysisResults);
        
        // Generate report
        await generateReport(analysisResults, screenshotDir);
        
    } catch (error) {
        console.error('❌ Error during analysis:', error);
        analysisResults.issues.push({
            type: 'test-error',
            message: error.message,
            severity: 'high'
        });
    } finally {
        await browser.close();
    }
    
    return analysisResults;
}

// Generate recommendations based on analysis
function generateRecommendations(results) {
    const recommendations = [];
    
    // Check data visualization
    if (!results.dataVisualization || results.dataVisualization.totalCharts < 3) {
        recommendations.push({
            category: 'Data Visualization',
            priority: 'high',
            suggestion: 'Add more charts to visualize financial data',
            details: [
                'Add a pie chart for expense breakdown in Long Term Rental tab',
                'Add a line chart for cash flow projections over time',
                'Add a bar chart comparing rental income to expenses',
                'Consider using Chart.js or D3.js for interactive visualizations'
            ]
        });
    }
    
    // Long Term Rental improvements
    if (results.tabs.longTermRental) {
        recommendations.push({
            category: 'Long Term Rental Tab',
            priority: 'medium',
            suggestion: 'Enhance financial metrics presentation',
            details: [
                'Group related metrics in visual cards',
                'Add percentage indicators for ROI and cap rate',
                'Include a monthly vs annual toggle for all values',
                'Add tooltips explaining each financial term'
            ]
        });
    }
    
    // Investment Analysis improvements
    if (results.tabs.investmentAnalysis) {
        recommendations.push({
            category: 'Investment Analysis Tab',
            priority: 'high',
            suggestion: 'Improve investment projections visualization',
            details: [
                'Add an interactive timeline showing investment growth',
                'Include scenario analysis (best/worst/likely cases)',
                'Add a break-even point visual indicator',
                'Show cumulative cash flow chart over 10 years'
            ]
        });
    }
    
    // General UI improvements
    recommendations.push({
        category: 'General UI/UX',
        priority: 'medium',
        suggestion: 'Enhance overall user experience',
        details: [
            'Add loading skeletons for smoother transitions',
            'Implement tab change animations',
            'Add a summary card at the top of each tab',
            'Include a "Download PDF Report" button on each tab'
        ]
    });
    
    return recommendations;
}

// Generate markdown report
async function generateReport(results, screenshotDir) {
    const reportPath = path.join(screenshotDir, 'ui-ux-analysis-report.md');
    
    const report = `# StarterPackApp UI/UX Analysis Report

**Date:** ${new Date(results.timestamp).toLocaleString()}
**Test Type:** UI/UX Analysis with Mock Data
**Focus:** Long Term Rental and Investment Analysis Tabs

## Executive Summary

This analysis evaluates the visual design, data presentation, and user experience of the StarterPackApp's analysis tabs, with specific focus on the Long Term Rental and Investment Analysis sections.

## Screenshots

1. [Overview Tab](01-overview-tab.png)
2. [Long Term Rental Tab](02-long-term-rental-tab.png)
3. [Investment Analysis Tab](03-investment-analysis-tab.png)
4. [Tablet View](04-tablet-view.png)
5. [Mobile View](05-mobile-view.png)

## Tab Analysis

### Long Term Rental Tab
${results.tabs.longTermRental ? `
- Monthly Rent Display: ${results.tabs.longTermRental.hasMonthlyRent ? '✅ Present' : '❌ Missing'}
- Cash Flow Metrics: ${results.tabs.longTermRental.hasCashFlow ? '✅ Present' : '❌ Missing'}
- ROI Calculation: ${results.tabs.longTermRental.hasROI ? '✅ Present' : '❌ Missing'}
- Expense Breakdown: ${results.tabs.longTermRental.hasExpenses ? '✅ Present' : '❌ Missing'}
` : 'Tab not analyzed'}

### Investment Analysis Tab
${results.tabs.investmentAnalysis ? `
- Cap Rate: ${results.tabs.investmentAnalysis.hasCapRate ? '✅ Present' : '❌ Missing'}
- Cash-on-Cash Return: ${results.tabs.investmentAnalysis.hasCashOnCash ? '✅ Present' : '❌ Missing'}
- Break-even Analysis: ${results.tabs.investmentAnalysis.hasBreakeven ? '✅ Present' : '❌ Missing'}
- Future Projections: ${results.tabs.investmentAnalysis.hasProjections ? '✅ Present' : '❌ Missing'}
` : 'Tab not analyzed'}

## Data Visualization Analysis

- Canvas Charts: ${results.dataVisualization?.canvasCharts || 0}
- SVG Charts: ${results.dataVisualization?.svgCharts || 0}
- Total Visualizations: ${results.dataVisualization?.totalCharts || 0}

## Key Recommendations

${results.recommendations.map((rec, index) => `
### ${index + 1}. ${rec.suggestion}
**Category:** ${rec.category}  
**Priority:** ${rec.priority}

${rec.details ? rec.details.map(detail => `- ${detail}`).join('\n') : ''}
`).join('\n')}

## Specific Improvements for Charts and Layouts

### Long Term Rental Tab Enhancements

1. **Financial Metrics Dashboard**
   \`\`\`
   ┌─────────────────────────────────────────┐
   │  Monthly Rent    │  Cash Flow           │
   │  $3,800         │  $1,650              │
   │  ▲ 5% vs avg    │  ▲ Positive          │
   └─────────────────────────────────────────┘
   \`\`\`

2. **Expense Breakdown Chart**
   - Implement a donut chart showing:
     - Mortgage: 72%
     - Property Tax: 11%
     - Insurance: 3%
     - Utilities: 4%
     - Maintenance: 3%
     - HOA Fees: 8%

3. **Cash Flow Projection Timeline**
   - Interactive line chart showing monthly cash flow over 5 years
   - Include toggle for different scenarios

### Investment Analysis Tab Enhancements

1. **Investment Scorecard**
   \`\`\`
   ┌─────────────────────────────────────────┐
   │  Investment Score: B+                    │
   │  ████████░░ 8.2/10                      │
   │                                         │
   │  ✓ Positive Cash Flow                  │
   │  ✓ Good Location                       │
   │  ⚠ Moderate Cap Rate                   │
   └─────────────────────────────────────────┘
   \`\`\`

2. **ROI Comparison Chart**
   - Horizontal bar chart comparing:
     - This Property ROI
     - Market Average ROI
     - Top 25% Properties

3. **Equity Build-up Visualization**
   - Stacked area chart showing:
     - Principal payments
     - Property appreciation
     - Total equity over 10 years

## CSS/Component Improvements

### Suggested CSS Enhancements
\`\`\`css
/* Enhanced metric cards */
.metric-card {
  background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%);
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Chart containers */
.chart-container {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

/* Responsive grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
\`\`\`

## Conclusion

The StarterPackApp shows a solid foundation for property investment analysis. The main areas for improvement are:

1. **Data Visualization**: Adding charts will significantly improve data comprehension
2. **Visual Hierarchy**: Better grouping and spacing of related metrics
3. **Interactive Elements**: Adding hover states and tooltips for better UX
4. **Mobile Optimization**: Ensuring all data is easily accessible on small screens

Implementing these recommendations will elevate the user experience from functional to exceptional.
`;

    await fs.writeFile(reportPath, report);
    console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Run the analysis
(async () => {
    try {
        const results = await analyzeUIUX();
        console.log('\n✅ UI/UX Analysis completed successfully!');
        console.log(`📁 Results saved in: ${screenshotDir}`);
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
})();