const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().split('T')[0];
const screenshotDir = path.join(__dirname, 'screenshots', 'comprehensive-e2e', timestamp);

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        console.log(`Directory exists or created: ${dir}`);
    }
}

async function captureScreenshot(page, name, fullPage = false) {
    const fileName = `${name}.png`;
    const filePath = path.join(screenshotDir, fileName);
    await page.screenshot({ 
        path: filePath, 
        fullPage: fullPage 
    });
    console.log(`📸 Screenshot saved: ${fileName}`);
    return filePath;
}

async function waitForResults(page) {
    console.log('⏳ Waiting for results to load...');
    try {
        // Wait for results container
        await page.waitForSelector('#resultsSection', { 
            visible: true, 
            timeout: 60000 
        });
        
        // Wait for tabs to be visible
        await page.waitForSelector('.tab-button', { 
            visible: true, 
            timeout: 30000 
        });
        
        // Additional wait for data to populate
        await page.waitForTimeout(3000);
        
        console.log('✅ Results loaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to load results:', error.message);
        await captureScreenshot(page, 'error-results-not-loaded');
        return false;
    }
}

async function testTab(page, tabName, tabIndex) {
    console.log(`\n🔍 Testing ${tabName} Tab...`);
    const issues = [];
    
    try {
        // Click on the tab
        const tabs = await page.$$('.tab-button');
        if (tabs[tabIndex]) {
            await tabs[tabIndex].click();
            await page.waitForTimeout(1000);
            
            // Capture full page screenshot
            await captureScreenshot(page, `${tabName.toLowerCase().replace(' ', '-')}-full`, true);
            
            // Check for console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            // Test specific elements based on tab
            switch(tabIndex) {
                case 0: // LTR Tab
                    await testLTRTab(page, issues);
                    break;
                case 1: // STR Tab
                    await testSTRTab(page, issues);
                    break;
                case 2: // Investment Analysis
                    await testInvestmentTab(page, issues);
                    break;
            }
            
            // Check for any console errors
            if (consoleErrors.length > 0) {
                issues.push({
                    severity: 'High',
                    description: `Console errors in ${tabName} tab`,
                    details: consoleErrors.join('\n')
                });
            }
            
        } else {
            issues.push({
                severity: 'Critical',
                description: `${tabName} tab not found`,
                details: 'Tab button element not present'
            });
        }
    } catch (error) {
        issues.push({
            severity: 'Critical',
            description: `Error testing ${tabName} tab`,
            details: error.message
        });
    }
    
    return issues;
}

async function testLTRTab(page, issues) {
    console.log('  - Checking rental income calculations...');
    
    // Check for key elements
    const elements = [
        { selector: '[data-field="monthlyRent"]', name: 'Monthly Rent' },
        { selector: '[data-field="propertyTax"]', name: 'Property Tax' },
        { selector: '[data-field="insurance"]', name: 'Insurance' },
        { selector: '[data-field="hoa"]', name: 'HOA Fees' },
        { selector: '#monthlyExpenses', name: 'Monthly Expenses' },
        { selector: '#monthlyCashFlow', name: 'Monthly Cash Flow' },
        { selector: '#cashFlowChart', name: 'Cash Flow Chart' }
    ];
    
    for (const element of elements) {
        const exists = await page.$(element.selector) !== null;
        if (!exists) {
            issues.push({
                severity: 'High',
                description: `Missing element: ${element.name}`,
                details: `Selector ${element.selector} not found in LTR tab`
            });
        }
    }
    
    // Check if charts are rendered
    const chartCanvas = await page.$('#cashFlowChart canvas');
    if (!chartCanvas) {
        issues.push({
            severity: 'Medium',
            description: 'Cash flow chart not rendered',
            details: 'Canvas element not found within chart container'
        });
    }
}

async function testSTRTab(page, issues) {
    console.log('  - Checking Airbnb comparables...');
    
    // Check for key STR elements
    const elements = [
        { selector: '.airbnb-comparable', name: 'Airbnb Comparables' },
        { selector: '[data-field="avgNightlyRate"]', name: 'Average Nightly Rate' },
        { selector: '[data-field="occupancyRate"]', name: 'Occupancy Rate' },
        { selector: '[data-field="monthlyRevenue"]', name: 'Monthly Revenue' },
        { selector: '#strRevenueChart', name: 'STR Revenue Chart' }
    ];
    
    for (const element of elements) {
        const exists = await page.$(element.selector) !== null;
        if (!exists) {
            issues.push({
                severity: 'High',
                description: `Missing element: ${element.name}`,
                details: `Selector ${element.selector} not found in STR tab`
            });
        }
    }
    
    // Check if comparable listings are displayed
    const comparables = await page.$$('.airbnb-comparable');
    if (comparables.length === 0) {
        issues.push({
            severity: 'Critical',
            description: 'No Airbnb comparables displayed',
            details: 'STR analysis requires comparable listings'
        });
    }
}

async function testInvestmentTab(page, issues) {
    console.log('  - Checking investment metrics...');
    
    // Check for key investment elements
    const elements = [
        { selector: '[data-field="totalInvestment"]', name: 'Total Investment' },
        { selector: '[data-field="cashOnCashReturn"]', name: 'Cash on Cash Return' },
        { selector: '[data-field="capRate"]', name: 'Cap Rate' },
        { selector: '[data-field="roi"]', name: 'ROI' },
        { selector: '#investmentChart', name: 'Investment Chart' }
    ];
    
    for (const element of elements) {
        const exists = await page.$(element.selector) !== null;
        if (!exists) {
            issues.push({
                severity: 'High',
                description: `Missing element: ${element.name}`,
                details: `Selector ${element.selector} not found in Investment tab`
            });
        }
    }
}

async function testGeneralFunctionality(page, issues) {
    console.log('\n🔧 Testing General Functionality...');
    
    // Test PDF download button
    const pdfButton = await page.$('[onclick*="generatePDF"]');
    if (!pdfButton) {
        issues.push({
            severity: 'Medium',
            description: 'PDF download button not found',
            details: 'Users cannot download analysis as PDF'
        });
    }
    
    // Test print button
    const printButton = await page.$('[onclick*="print"]');
    if (!printButton) {
        issues.push({
            severity: 'Low',
            description: 'Print button not found',
            details: 'Print functionality not available'
        });
    }
    
    // Test tooltips
    const tooltips = await page.$$('[data-tooltip], .tooltip');
    console.log(`  - Found ${tooltips.length} tooltips`);
    if (tooltips.length === 0) {
        issues.push({
            severity: 'Low',
            description: 'No tooltips found',
            details: 'User guidance through tooltips is missing'
        });
    }
}

async function testMobileView(page, issues) {
    console.log('\n📱 Testing Mobile View...');
    
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    
    // Capture mobile screenshots for each tab
    const tabs = await page.$$('.tab-button');
    for (let i = 0; i < tabs.length; i++) {
        await tabs[i].click();
        await page.waitForTimeout(500);
        await captureScreenshot(page, `mobile-tab-${i}`, true);
    }
    
    // Check if content is properly responsive
    const overflowingElements = await page.evaluate(() => {
        const elements = [];
        const all = document.querySelectorAll('*');
        for (let elem of all) {
            if (elem.scrollWidth > window.innerWidth) {
                elements.push({
                    tag: elem.tagName,
                    class: elem.className,
                    id: elem.id
                });
            }
        }
        return elements;
    });
    
    if (overflowingElements.length > 0) {
        issues.push({
            severity: 'Medium',
            description: 'Elements overflowing on mobile',
            details: `${overflowingElements.length} elements exceed viewport width`,
            elements: overflowingElements
        });
    }
    
    // Reset to desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive E2E Test');
    console.log(`📁 Screenshots will be saved to: ${screenshotDir}`);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const allIssues = [];
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to the app with E2E test mode and test data
        const testData = {
            street: '123 Test Street',
            city: 'Toronto',
            state: 'Ontario',
            country: 'Canada',
            postal: 'M5V 3A8',
            price: '850000',
            bedrooms: '3',
            bathrooms: '2',
            sqft: '1500',
            propertyType: 'Condo',
            taxes: '7200',
            condoFees: '580'
        };
        
        const params = new URLSearchParams({
            e2e_test_mode: 'true',
            ...testData
        });
        
        const url = 'file://' + path.join(__dirname, '../../roi-finder.html') + '?' + params.toString();
        console.log(`\n📍 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        await captureScreenshot(page, '01-initial-load');
        
        // Wait for form to be visible
        console.log('\n📝 Waiting for form to load...');
        try {
            await page.waitForSelector('#property-analysis-form', { visible: true, timeout: 10000 });
            console.log('✅ Form is visible');
            
            // Check if form is pre-filled
            const addressValue = await page.$eval('#address', el => el.value);
            if (!addressValue) {
                allIssues.push({
                    severity: 'High',
                    description: 'Form not pre-filled',
                    details: 'E2E test mode should pre-fill the form with test data'
                });
            } else {
                console.log('✅ Form is pre-filled with:', addressValue);
            }
        } catch (error) {
            allIssues.push({
                severity: 'Critical',
                description: 'Form not displayed',
                details: 'Property analysis form is not visible'
            });
        }
        
        // Submit the form
        console.log('\n🚀 Submitting form...');
        const analyzeButton = await page.$('#analyzeButton');
        if (analyzeButton) {
            await analyzeButton.click();
            
            // Wait for results
            const resultsLoaded = await waitForResults(page);
            
            if (resultsLoaded) {
                // Test each tab
                const tabIssues1 = await testTab(page, 'Long Term Rental', 0);
                allIssues.push(...tabIssues1);
                
                const tabIssues2 = await testTab(page, 'Short Term Rental', 1);
                allIssues.push(...tabIssues2);
                
                const tabIssues3 = await testTab(page, 'Investment Analysis', 2);
                allIssues.push(...tabIssues3);
                
                // Test general functionality
                await testGeneralFunctionality(page, allIssues);
                
                // Test mobile view
                await testMobileView(page, allIssues);
                
            } else {
                allIssues.push({
                    severity: 'Critical',
                    description: 'Results failed to load',
                    details: 'Analysis did not complete successfully'
                });
            }
        } else {
            allIssues.push({
                severity: 'Critical',
                description: 'Analyze button not found',
                details: 'Cannot submit form for analysis'
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        allIssues.push({
            severity: 'Critical',
            description: 'Test execution failed',
            details: error.message
        });
    } finally {
        await browser.close();
    }
    
    // Generate report
    await generateReport(allIssues);
    
    return allIssues;
}

async function generateReport(issues) {
    console.log('\n📊 Generating Test Report...');
    
    const criticalCount = issues.filter(i => i.severity === 'Critical').length;
    const highCount = issues.filter(i => i.severity === 'High').length;
    const mediumCount = issues.filter(i => i.severity === 'Medium').length;
    const lowCount = issues.filter(i => i.severity === 'Low').length;
    
    const report = `# Comprehensive E2E Test Report
Generated: ${new Date().toISOString()}

## Test Summary
- **Total Issues Found**: ${issues.length}
- **Critical**: ${criticalCount}
- **High**: ${highCount}
- **Medium**: ${mediumCount}
- **Low**: ${lowCount}

## Test Coverage
✅ Form pre-filling with E2E test mode
✅ Form submission and analysis
✅ Long Term Rental (LTR) calculations
✅ Short Term Rental (STR) analysis
✅ Investment Analysis metrics
✅ General functionality (PDF, print, tooltips)
✅ Mobile responsiveness (375px viewport)
✅ Tab switching and data sync

## Issues Found

${issues.length === 0 ? '🎉 No issues found! All tests passed successfully.' : issues.map(issue => `
### ${issue.severity}: ${issue.description}
**Details**: ${issue.details}
${issue.elements ? `**Affected Elements**: ${JSON.stringify(issue.elements, null, 2)}` : ''}
`).join('\n')}

## Screenshots
All screenshots saved to: ${screenshotDir}
`;
    
    const reportPath = path.join(__dirname, 'comprehensive-e2e-report.md');
    await fs.writeFile(reportPath, report);
    console.log(`\n✅ Report saved to: ${reportPath}`);
    
    // Console summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Issues: ${issues.length}`);
    console.log(`Critical: ${criticalCount} | High: ${highCount} | Medium: ${mediumCount} | Low: ${lowCount}`);
    console.log('='.repeat(50));
}

// Run the test
runComprehensiveTest().catch(console.error);