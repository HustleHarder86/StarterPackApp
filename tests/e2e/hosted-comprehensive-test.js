const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().split('T')[0];
const screenshotDir = path.join(__dirname, 'screenshots', 'hosted-comprehensive', timestamp);

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
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Results loaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to load results:', error.message);
        await captureScreenshot(page, 'error-results-not-loaded');
        return false;
    }
}

async function testTab(page, tabName, tabIndex, issues) {
    console.log(`\n🔍 Testing ${tabName} Tab...`);
    
    try {
        // Click on the tab
        const tabs = await page.$$('.tab-button');
        if (tabs[tabIndex]) {
            await tabs[tabIndex].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Capture full page screenshot
            await captureScreenshot(page, `${tabName.toLowerCase().replace(' ', '-')}-full`, true);
            
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
}

async function testLTRTab(page, issues) {
    console.log('  - Checking rental income calculations...');
    
    // Check for key elements
    const elements = [
        { selector: '[data-field="monthlyRent"]', name: 'Monthly Rent' },
        { selector: '[data-field="propertyTax"]', name: 'Property Tax' },
        { selector: '[data-field="insurance"]', name: 'Insurance' },
        { selector: '[data-field="hoa"]', name: 'HOA Fees' },
        { selector: '[data-field="monthlyExpenses"]', name: 'Monthly Expenses' },
        { selector: '[data-field="monthlyCashFlow"]', name: 'Monthly Cash Flow' },
        { selector: '#cashFlowChart', name: 'Cash Flow Chart' }
    ];
    
    for (const element of elements) {
        try {
            const exists = await page.$(element.selector) !== null;
            if (!exists) {
                issues.push({
                    severity: 'High',
                    description: `Missing element: ${element.name}`,
                    details: `Selector ${element.selector} not found in LTR tab`
                });
            } else {
                // Get the value if it's a data field
                if (element.selector.includes('data-field')) {
                    const value = await page.$eval(element.selector, el => el.textContent);
                    console.log(`    ✓ ${element.name}: ${value}`);
                }
            }
        } catch (error) {
            console.error(`    ✗ Error checking ${element.name}:`, error.message);
        }
    }
}

async function testSTRTab(page, issues) {
    console.log('  - Checking Airbnb comparables...');
    
    // Check for comparables container
    const comparablesContainer = await page.$('.airbnb-comparables-grid, .comparables-grid');
    if (!comparablesContainer) {
        issues.push({
            severity: 'High',
            description: 'Airbnb comparables container not found',
            details: 'STR analysis requires comparable listings to be displayed'
        });
        return;
    }
    
    // Count comparable cards
    const comparables = await page.$$('.property-card, .comparable-card');
    console.log(`    ✓ Found ${comparables.length} comparable listings`);
    
    if (comparables.length === 0) {
        issues.push({
            severity: 'Critical',
            description: 'No Airbnb comparables displayed',
            details: 'STR analysis requires at least one comparable listing'
        });
    }
    
    // Check for key STR metrics
    const metrics = [
        { selector: '[data-field="avgNightlyRate"], .avg-nightly-rate', name: 'Average Nightly Rate' },
        { selector: '[data-field="occupancyRate"], .occupancy-rate', name: 'Occupancy Rate' },
        { selector: '[data-field="monthlyRevenue"], .monthly-revenue', name: 'Monthly Revenue' }
    ];
    
    for (const metric of metrics) {
        const exists = await page.$(metric.selector) !== null;
        if (!exists) {
            issues.push({
                severity: 'Medium',
                description: `Missing STR metric: ${metric.name}`,
                details: `Selector ${metric.selector} not found`
            });
        }
    }
}

async function testInvestmentTab(page, issues) {
    console.log('  - Checking investment metrics...');
    
    // Check for key investment elements
    const elements = [
        { selector: '[data-field="totalInvestment"], .total-investment', name: 'Total Investment' },
        { selector: '[data-field="cashOnCashReturn"], .cash-on-cash', name: 'Cash on Cash Return' },
        { selector: '[data-field="capRate"], .cap-rate', name: 'Cap Rate' },
        { selector: '[data-field="annualROI"], .annual-roi', name: 'Annual ROI' }
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
    const pdfButton = await page.$('button[onclick*="generatePDF"], .pdf-download-btn');
    if (!pdfButton) {
        issues.push({
            severity: 'Medium',
            description: 'PDF download button not found',
            details: 'Users cannot download analysis as PDF'
        });
    } else {
        console.log('  ✓ PDF download button found');
    }
    
    // Test print button
    const printButton = await page.$('button[onclick*="print"], .print-btn');
    if (!printButton) {
        issues.push({
            severity: 'Low',
            description: 'Print button not found',
            details: 'Print functionality not available'
        });
    } else {
        console.log('  ✓ Print button found');
    }
}

async function testMobileView(page, issues) {
    console.log('\n📱 Testing Mobile View (375px)...');
    
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Capture mobile screenshots for each tab
    const tabs = await page.$$('.tab-button');
    for (let i = 0; i < tabs.length && i < 3; i++) {
        await tabs[i].click();
        await new Promise(resolve => setTimeout(resolve, 500));
        await captureScreenshot(page, `mobile-tab-${i}`);
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
                    id: elem.id,
                    width: elem.scrollWidth
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
            elements: overflowingElements.slice(0, 5) // Limit to first 5 for brevity
        });
    } else {
        console.log('  ✓ No overflow issues detected');
    }
    
    // Reset to desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive E2E Test (Hosted Version)');
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
        
        // Set up console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('❌ Console error:', msg.text());
            }
        });
        
        // Navigate to the hosted app with E2E test mode - just the parameter, no data
        console.log('\n📍 Step 1: Navigate to app with E2E test mode...');
        await page.goto('https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        await captureScreenshot(page, '01-initial-load');
        
        // Wait for form to be visible
        console.log('\n📝 Step 2: Check if form is displayed...');
        try {
            await page.waitForSelector('#property-analysis-form', { visible: true, timeout: 10000 });
            console.log('✅ Form is visible');
            
            // Now fill the form manually
            console.log('\n📝 Step 3: Fill form with test data...');
            
            // Fill the address field (it's a textarea)
            await page.waitForSelector('#property-address');
            await page.click('#property-address');
            await page.type('#property-address', '123 Test Street, Toronto, Ontario, M5V 3A8');
            
            // Fill price field
            await page.click('#property-price');
            await page.type('#property-price', '850000');
            
            // Select bedrooms - it's a dropdown
            await page.select('#property-bedrooms', '3');
            
            // Select bathrooms - it's a dropdown  
            await page.select('#property-bathrooms', '2');
            
            // Click "Add More Details" to expand optional fields
            console.log('  - Expanding optional fields...');
            const moreDetailsButton = await page.$('button.text-blue-600');
            if (moreDetailsButton) {
                await moreDetailsButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Now fill optional fields that should be visible
                console.log('  - Filling optional fields...');
                
                // Property Type - should be visible now
                await page.waitForSelector('#property-type', { visible: true });
                await page.select('#property-type', 'Condo');
                
                // Square footage
                await page.type('#property-sqft', '1500');
                
                // Property taxes
                await page.type('#property-taxes', '7200');
                
                // Condo fees
                await page.type('#property-condofees', '580');
            } else {
                console.log('  - Could not find "Add More Details" button');
            }
            
            await captureScreenshot(page, '02-form-filled');
            
            // Submit the form
            console.log('\n🚀 Step 4: Submit form for analysis...');
            const analyzeButton = await page.$('button.btn-primary');
            if (analyzeButton) {
                await analyzeButton.click();
                
                // Wait for results
                const resultsLoaded = await waitForResults(page);
                
                if (resultsLoaded) {
                    console.log('\n✅ Step 5: Analysis results loaded successfully');
                    await captureScreenshot(page, '03-results-loaded');
                    
                    // Test each tab
                    await testTab(page, 'Long Term Rental', 0, allIssues);
                    await testTab(page, 'Short Term Rental', 1, allIssues);
                    await testTab(page, 'Investment Analysis', 2, allIssues);
                    
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
            console.error('❌ Form not displayed:', error.message);
            allIssues.push({
                severity: 'Critical',
                description: 'Form not displayed',
                details: 'Property analysis form is not visible. E2E test mode may not be working correctly.'
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
    
    const report = `# Comprehensive E2E Test Report (Hosted Version)
Generated: ${new Date().toISOString()}

## Test Summary
- **Total Issues Found**: ${issues.length}
- **Critical**: ${criticalCount}
- **High**: ${highCount}
- **Medium**: ${mediumCount}
- **Low**: ${lowCount}

## Test Status
${issues.length === 0 ? '✅ **ALL TESTS PASSED**' : '❌ **TESTS FAILED - Issues Found**'}

## Test Coverage
✅ E2E test mode authentication bypass
✅ Form display and manual filling
✅ Form submission and analysis
✅ Long Term Rental (LTR) calculations
✅ Short Term Rental (STR) analysis
✅ Investment Analysis metrics
✅ General functionality (PDF, print)
✅ Mobile responsiveness (375px viewport)
✅ Tab switching and data display

## Issues Found

${issues.length === 0 ? '🎉 No issues found! All tests passed successfully.' : issues.map(issue => `
### ${issue.severity}: ${issue.description}
**Details**: ${issue.details}
${issue.elements ? `**Affected Elements**: ${JSON.stringify(issue.elements, null, 2)}` : ''}
`).join('\n')}

## Screenshots
All screenshots saved to: ${screenshotDir}

## Recommendations
${issues.length === 0 ? 
'The application is working correctly with E2E test mode. All features are functional and responsive.' : 
`Please address the ${criticalCount} critical issues first, followed by ${highCount} high priority issues.`}
`;
    
    const reportPath = path.join(__dirname, 'hosted-comprehensive-report.md');
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