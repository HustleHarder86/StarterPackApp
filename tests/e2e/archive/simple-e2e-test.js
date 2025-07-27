const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().split('T')[0];
const screenshotDir = path.join(__dirname, 'screenshots', 'simple-e2e', timestamp);

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        console.log(`Directory exists or created: ${dir}`);
    }
}

async function captureScreenshot(page, name) {
    const fileName = `${name}.png`;
    const filePath = path.join(screenshotDir, fileName);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`📸 Screenshot saved: ${fileName}`);
    return filePath;
}

async function runSimpleE2ETest() {
    console.log('🚀 Starting Simple E2E Test');
    console.log(`📁 Screenshots will be saved to: ${screenshotDir}`);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const issues = [];
    const testResults = {
        authBypass: false,
        formFilled: false,
        analysisSubmitted: false,
        resultsLoaded: false,
        tabsSwitchable: false,
        mobileResponsive: false
    };
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Step 1: Test E2E authentication bypass
        console.log('\n📍 Step 1: Testing E2E authentication bypass...');
        await page.goto('https://starter-pack-app.vercel.app/roi-finder.html?e2e_test_mode=true', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        await captureScreenshot(page, '01-auth-bypass');
        
        // Check if form is visible (meaning auth was bypassed)
        const formVisible = await page.$('#property-analysis-form') !== null;
        if (formVisible) {
            console.log('✅ Authentication bypassed successfully');
            testResults.authBypass = true;
        } else {
            console.log('❌ Authentication bypass failed');
            issues.push({
                severity: 'Critical',
                description: 'E2E test mode did not bypass authentication',
                details: 'Form not visible after loading with e2e_test_mode=true'
            });
        }
        
        // Step 2: Fill form with minimal required data
        if (formVisible) {
            console.log('\n📝 Step 2: Filling form with test data...');
            
            try {
                // Fill address
                await page.type('#property-address', '123 Test Street, Toronto, Ontario, M5V 3A8');
                
                // Fill price
                await page.type('#property-price', '850000');
                
                // Select bedrooms
                await page.select('#property-bedrooms', '3');
                
                // Select bathrooms
                await page.select('#property-bathrooms', '2');
                
                await captureScreenshot(page, '02-form-filled');
                console.log('✅ Form filled successfully');
                testResults.formFilled = true;
                
                // Step 3: Submit form
                console.log('\n🚀 Step 3: Submitting form for analysis...');
                const analyzeButton = await page.$('button.btn-primary');
                if (analyzeButton) {
                    await analyzeButton.click();
                    testResults.analysisSubmitted = true;
                    
                    // Wait for results
                    console.log('⏳ Waiting for results to load...');
                    try {
                        await page.waitForSelector('#resultsSection', { 
                            visible: true, 
                            timeout: 60000 
                        });
                        
                        // Wait a bit for data to populate
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        await captureScreenshot(page, '03-results-loaded');
                        console.log('✅ Results loaded successfully');
                        testResults.resultsLoaded = true;
                        
                        // Step 4: Test tab switching
                        console.log('\n🔄 Step 4: Testing tab switching...');
                        const tabs = await page.$$('.tab-button');
                        console.log(`Found ${tabs.length} tabs`);
                        
                        if (tabs.length >= 3) {
                            // Test each tab
                            for (let i = 0; i < 3; i++) {
                                await tabs[i].click();
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                await captureScreenshot(page, `04-tab-${i}`);
                            }
                            console.log('✅ Tab switching works');
                            testResults.tabsSwitchable = true;
                        } else {
                            issues.push({
                                severity: 'High',
                                description: 'Not all tabs are present',
                                details: `Expected 3 tabs, found ${tabs.length}`
                            });
                        }
                        
                        // Step 5: Test mobile view
                        console.log('\n📱 Step 5: Testing mobile responsiveness...');
                        await page.setViewport({ width: 375, height: 812 });
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await captureScreenshot(page, '05-mobile-view');
                        
                        // Check for overflow
                        const hasOverflow = await page.evaluate(() => {
                            return document.body.scrollWidth > window.innerWidth;
                        });
                        
                        if (!hasOverflow) {
                            console.log('✅ Mobile view is responsive');
                            testResults.mobileResponsive = true;
                        } else {
                            console.log('⚠️  Mobile view has horizontal overflow');
                            issues.push({
                                severity: 'Medium',
                                description: 'Mobile view has horizontal overflow',
                                details: 'Content exceeds viewport width on mobile'
                            });
                        }
                        
                    } catch (error) {
                        console.error('❌ Results failed to load:', error.message);
                        issues.push({
                            severity: 'Critical',
                            description: 'Analysis results did not load',
                            details: error.message
                        });
                    }
                } else {
                    issues.push({
                        severity: 'Critical',
                        description: 'Analyze button not found',
                        details: 'Could not find button with class btn-primary'
                    });
                }
                
            } catch (error) {
                console.error('❌ Form filling failed:', error.message);
                issues.push({
                    severity: 'Critical',
                    description: 'Could not fill form',
                    details: error.message
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        issues.push({
            severity: 'Critical',
            description: 'Test execution failed',
            details: error.message
        });
    } finally {
        await browser.close();
    }
    
    // Generate report
    await generateReport(testResults, issues);
    
    return { testResults, issues };
}

async function generateReport(testResults, issues) {
    console.log('\n📊 Generating Test Report...');
    
    const passedTests = Object.values(testResults).filter(v => v).length;
    const totalTests = Object.keys(testResults).length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    const report = `# Simple E2E Test Report
Generated: ${new Date().toISOString()}

## Test Summary
- **Tests Passed**: ${passedTests}/${totalTests} (${passRate}%)
- **Total Issues**: ${issues.length}
- **Critical Issues**: ${issues.filter(i => i.severity === 'Critical').length}
- **High Priority Issues**: ${issues.filter(i => i.severity === 'High').length}
- **Medium Priority Issues**: ${issues.filter(i => i.severity === 'Medium').length}

## Test Results
${Object.entries(testResults).map(([test, passed]) => 
    `- ${passed ? '✅' : '❌'} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`
).join('\n')}

## Issues Found
${issues.length === 0 ? '🎉 No issues found!' : issues.map(issue => `
### ${issue.severity}: ${issue.description}
${issue.details}
`).join('\n')}

## Screenshots
All screenshots saved to: ${screenshotDir}

## Recommendations
${issues.length === 0 ? 
'All tests passed successfully. The E2E test mode is working correctly.' : 
`Please address the ${issues.filter(i => i.severity === 'Critical').length} critical issues first.`}
`;
    
    const reportPath = path.join(__dirname, 'simple-e2e-report.md');
    await fs.writeFile(reportPath, report);
    console.log(`\n✅ Report saved to: ${reportPath}`);
    
    // Console summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Issues Found: ${issues.length}`);
    if (issues.length > 0) {
        console.log(`- Critical: ${issues.filter(i => i.severity === 'Critical').length}`);
        console.log(`- High: ${issues.filter(i => i.severity === 'High').length}`);
        console.log(`- Medium: ${issues.filter(i => i.severity === 'Medium').length}`);
    }
    console.log('='.repeat(50));
}

// Run the test
runSimpleE2ETest().catch(console.error);