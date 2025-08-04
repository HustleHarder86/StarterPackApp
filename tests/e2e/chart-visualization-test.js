const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots', 'chart-test', new Date().toISOString().split('T')[0]);
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function testChartVisualizations() {
    console.log('🚀 Starting Chart Visualization E2E Test...\n');
    
    const browser = await puppeteer.launch({
        headless: false, // Run in visible mode to see what's happening
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    });

    const page = await browser.newPage();
    const testResults = {
        passed: [],
        failed: [],
        warnings: []
    };

    try {
        // Listen for console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
                console.log('❌ Console Error:', msg.text());
            }
        });

        // Navigate to the application
        console.log('📍 Navigating to ROI Finder page...');
        await page.goto('http://localhost:8080/roi-finder.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Take initial screenshot
        await page.screenshot({
            path: path.join(screenshotsDir, '01-initial-page.png'),
            fullPage: true
        });
        console.log('📸 Captured initial page state');

        // Fill in the form with test data
        console.log('\n📝 Filling in property form...');
        
        // Property details
        await page.type('#address', '123 Test Street, Toronto, ON');
        await page.type('#price', '850000');
        await page.type('#downPayment', '170000');
        await page.type('#interestRate', '5.5');
        await page.type('#monthlyRent', '3500');
        await page.type('#propertyTax', '8500');
        await page.type('#insurance', '1800');
        await page.type('#hoaFees', '0');
        await page.type('#utilities', '300');
        await page.type('#maintenance', '250');
        await page.type('#managementFee', '10');
        await page.type('#vacancy', '5');
        await page.type('#squareFootage', '1500');
        await page.type('#bedrooms', '3');
        await page.type('#bathrooms', '2');
        await page.type('#yearBuilt', '2015');

        // Take screenshot after form fill
        await page.screenshot({
            path: path.join(screenshotsDir, '02-form-filled.png'),
            fullPage: true
        });
        console.log('📸 Captured filled form');

        // Submit the form
        console.log('\n🚀 Submitting form...');
        await page.click('#submitAnalysis');

        // Wait for analysis to complete
        await page.waitForFunction(
            () => {
                const resultsSection = document.querySelector('#resultsSection');
                return resultsSection && !resultsSection.classList.contains('hidden');
            },
            { timeout: 30000 }
        );
        console.log('✅ Analysis completed');

        // Take screenshot of initial results
        await page.screenshot({
            path: path.join(screenshotsDir, '03-initial-results.png'),
            fullPage: true
        });

        // Test Long Term Rental Tab (should be active by default)
        console.log('\n📊 Testing Long Term Rental Tab Charts...');
        
        // Wait for charts to load
        await page.waitForTimeout(2000); // Give charts time to render

        // Check if chart canvases exist
        const ltrChartCanvases = await page.$$eval('canvas', canvases => 
            canvases.map(canvas => ({
                id: canvas.id,
                width: canvas.width,
                height: canvas.height,
                hasContent: canvas.width > 0 && canvas.height > 0
            }))
        );

        console.log('Found canvases in LTR tab:', ltrChartCanvases);

        // Scroll to ensure all charts are visible
        await page.evaluate(() => {
            const tabContent = document.querySelector('#longTermTab');
            if (tabContent) {
                tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        await page.waitForTimeout(1000);

        // Take screenshot of LTR charts
        await page.screenshot({
            path: path.join(screenshotsDir, '04-ltr-charts-full.png'),
            fullPage: true
        });

        // Take close-up screenshots of individual chart sections if they exist
        const ltrChartsExist = await page.evaluate(() => {
            const cashFlowChart = document.querySelector('#cashFlowChart');
            const equityChart = document.querySelector('#equityGrowthChart');
            return {
                cashFlow: cashFlowChart && cashFlowChart.offsetHeight > 0,
                equity: equityChart && equityChart.offsetHeight > 0
            };
        });

        if (ltrChartsExist.cashFlow || ltrChartsExist.equity) {
            testResults.passed.push('Long Term Rental charts detected');
            console.log('✅ LTR charts found');
        } else {
            testResults.failed.push('Long Term Rental charts not found or not visible');
            console.log('❌ LTR charts missing');
        }

        // Switch to Investment Tab
        console.log('\n🔄 Switching to Investment Tab...');
        await page.click('#investmentTabBtn');
        await page.waitForTimeout(2000); // Wait for tab transition and chart rendering

        // Check if Investment tab is active
        const investmentTabActive = await page.evaluate(() => {
            const tab = document.querySelector('#investmentTab');
            return tab && !tab.classList.contains('hidden');
        });

        if (investmentTabActive) {
            console.log('✅ Investment tab activated');
            testResults.passed.push('Investment tab switching works');
        } else {
            console.log('❌ Investment tab not active');
            testResults.failed.push('Investment tab switching failed');
        }

        // Take screenshot of Investment tab
        await page.screenshot({
            path: path.join(screenshotsDir, '05-investment-tab-full.png'),
            fullPage: true
        });

        // Check for charts in Investment tab
        const investmentChartCanvases = await page.$$eval('#investmentTab canvas', canvases => 
            canvases.map(canvas => ({
                id: canvas.id,
                width: canvas.width,
                height: canvas.height,
                hasContent: canvas.width > 0 && canvas.height > 0
            }))
        );

        console.log('Found canvases in Investment tab:', investmentChartCanvases);

        // Check specific investment charts
        const investmentChartsExist = await page.evaluate(() => {
            const roiChart = document.querySelector('#roiComparisonChart');
            const breakEvenChart = document.querySelector('#breakEvenChart');
            return {
                roi: roiChart && roiChart.offsetHeight > 0,
                breakEven: breakEvenChart && breakEvenChart.offsetHeight > 0
            };
        });

        if (investmentChartsExist.roi || investmentChartsExist.breakEven) {
            testResults.passed.push('Investment charts detected');
            console.log('✅ Investment charts found');
        } else {
            testResults.failed.push('Investment charts not found or not visible');
            console.log('❌ Investment charts missing');
        }

        // Test responsiveness
        console.log('\n📱 Testing mobile responsiveness...');
        
        // Set mobile viewport
        await page.setViewport({ width: 375, height: 812 });
        await page.waitForTimeout(1000);

        // Take mobile screenshots
        await page.screenshot({
            path: path.join(screenshotsDir, '06-mobile-ltr-charts.png'),
            fullPage: true
        });

        // Switch back to Investment tab on mobile
        await page.click('#investmentTabBtn');
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: path.join(screenshotsDir, '07-mobile-investment-charts.png'),
            fullPage: true
        });

        // Check for responsive behavior
        const mobileChartsVisible = await page.evaluate(() => {
            const charts = document.querySelectorAll('canvas');
            return Array.from(charts).some(chart => 
                chart.offsetWidth > 0 && chart.offsetWidth <= 375
            );
        });

        if (mobileChartsVisible) {
            testResults.passed.push('Charts are responsive on mobile');
            console.log('✅ Mobile responsiveness working');
        } else {
            testResults.warnings.push('Charts may not be properly responsive');
            console.log('⚠️  Mobile responsiveness needs review');
        }

        // Check for console errors related to charts
        const chartErrors = consoleErrors.filter(error => 
            error.includes('Chart') || error.includes('chart') || 
            error.includes('Canvas') || error.includes('canvas')
        );

        if (chartErrors.length > 0) {
            testResults.failed.push(`Chart-related console errors: ${chartErrors.join(', ')}`);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        testResults.failed.push(`Test execution error: ${error.message}`);
        
        // Take error screenshot
        await page.screenshot({
            path: path.join(screenshotsDir, 'error-state.png'),
            fullPage: true
        });
    } finally {
        await browser.close();
        
        // Generate test report
        console.log('\n📋 TEST SUMMARY');
        console.log('================');
        console.log(`✅ Passed: ${testResults.passed.length}`);
        console.log(`❌ Failed: ${testResults.failed.length}`);
        console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
        
        if (testResults.passed.length > 0) {
            console.log('\nPassed Tests:');
            testResults.passed.forEach(test => console.log(`  ✓ ${test}`));
        }
        
        if (testResults.failed.length > 0) {
            console.log('\nFailed Tests:');
            testResults.failed.forEach(test => console.log(`  ✗ ${test}`));
        }
        
        if (testResults.warnings.length > 0) {
            console.log('\nWarnings:');
            testResults.warnings.forEach(warning => console.log(`  ⚠ ${warning}`));
        }
        
        console.log(`\n📸 Screenshots saved to: ${screenshotsDir}`);
        
        // Generate detailed report
        const report = {
            timestamp: new Date().toISOString(),
            testResults,
            screenshotDirectory: screenshotsDir,
            recommendation: testResults.failed.length === 0 ? 
                'Charts appear to be working correctly' : 
                'Charts need attention - see failed tests above'
        };
        
        fs.writeFileSync(
            path.join(screenshotsDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );
    }
}

// Run the test
testChartVisualizations().catch(console.error);