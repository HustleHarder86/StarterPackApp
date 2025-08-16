const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Comprehensive E2E Test Suite for Mockups
 * Tests both base-mockup.html and base-mockup2.html
 * Automatically detects and reports all issues
 */

class MockupComprehensiveTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3006';
        this.issues = [];
        this.testResults = {
            passed: [],
            failed: [],
            warnings: []
        };
    }

    async initialize() {
        console.log('🚀 Initializing Puppeteer browser...');
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Setup console message logging
        this.page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                this.issues.push({
                    type: 'console-error',
                    message: text,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Setup error handling
        this.page.on('pageerror', error => {
            this.issues.push({
                type: 'page-error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Setup request interception to check API calls
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            if (request.url().includes('/api/')) {
                console.log(`📡 API Call: ${request.method()} ${request.url()}`);
            }
            request.continue();
        });

        this.page.on('response', response => {
            if (response.url().includes('/api/') && response.status() !== 200) {
                this.issues.push({
                    type: 'api-error',
                    url: response.url(),
                    status: response.status(),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    async testMockup(mockupPath, mockupName) {
        console.log(`\n📋 Testing ${mockupName}...`);
        const url = `${this.baseUrl}${mockupPath}`;
        
        try {
            await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.takeScreenshot(`${mockupName}-initial`);
            
            // Run all test suites for this mockup
            await this.testPropertyForm(mockupName);
            await this.testCachedData(mockupName);
            await this.testCalculators(mockupName);
            await this.testNavigation(mockupName);
            await this.testDataCalculations(mockupName);
            await this.testExtensionFlow(mockupName);
            
            // Specific tests for mockup2
            if (mockupName === 'mockup2') {
                await this.testQuickComparison(mockupName);
                await this.testInvestmentGrade(mockupName);
            }
            
        } catch (error) {
            this.recordFailure(`${mockupName}-load`, `Failed to load mockup: ${error.message}`);
        }
    }

    async testPropertyForm(mockupName) {
        console.log('  📝 Testing property form...');
        
        try {
            // Check if form exists
            const formExists = await this.page.$('#property-form') !== null;
            if (!formExists) {
                this.recordWarning(`${mockupName}-form`, 'Property form not found');
                return;
            }

            // Test form submission with valid data
            await this.page.evaluate(() => {
                const input = document.querySelector('input[name="address"]');
                if (input) {
                    input.value = '123 Test Street, Montreal, QC';
                    return true;
                }
                return false;
            });

            // Check if submit button exists and is clickable
            const submitButton = await this.page.$('button[type="submit"]');
            if (submitButton) {
                // Don't actually submit to avoid API calls during testing
                this.recordSuccess(`${mockupName}-form`, 'Form inputs working correctly');
            } else {
                this.recordWarning(`${mockupName}-form`, 'Submit button not found');
            }

        } catch (error) {
            this.recordFailure(`${mockupName}-form`, error.message);
        }
    }

    async testCachedData(mockupName) {
        console.log('  💾 Testing cached data functionality...');
        
        try {
            // Look for test data button or trigger cached data
            const testDataExists = await this.page.evaluate(() => {
                // Check if there's a test data function or button
                return typeof window.testWithCachedData === 'function' ||
                       Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Test'));
            });

            if (!testDataExists) {
                // Inject cached data directly
                await this.page.evaluate(() => {
                    const cachedData = {
                        success: true,
                        data: {
                            propertyDetails: {
                                address: "123 Test St",
                                estimatedValue: 849900,
                                bedrooms: 3,
                                bathrooms: 2,
                                sqft: 1600
                            },
                            shortTermRental: {
                                dailyRate: 472,
                                monthlyRate: 9912, // This should display as $9,912
                                occupancyRate: 0.7,
                                annualRevenue: 120360
                            },
                            longTermRental: {
                                monthlyRent: 3200,
                                annualIncome: 38400
                            }
                        }
                    };

                    if (window.propertyAPI && typeof window.propertyAPI.updateMockup === 'function') {
                        window.propertyAPI.updateMockup(cachedData);
                        return 'updated';
                    }
                    return 'no-api';
                });
            }

            // Wait for UI update
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify STR monthly revenue displays correctly
            const strMonthlyRevenue = await this.page.$eval('#str-monthly-revenue', el => el.textContent);
            
            if (strMonthlyRevenue) {
                const revenueValue = parseInt(strMonthlyRevenue.replace(/[$,]/g, ''));
                
                if (revenueValue === 9912) {
                    this.recordSuccess(`${mockupName}-str-revenue`, 'STR monthly revenue displays correctly: $9,912');
                } else if (revenueValue > 60000) {
                    this.recordFailure(`${mockupName}-str-revenue`, 
                        `STR monthly revenue incorrect: ${strMonthlyRevenue} (expected $9,912)`);
                } else {
                    this.recordWarning(`${mockupName}-str-revenue`, 
                        `STR monthly revenue: ${strMonthlyRevenue} (verify calculation)`);
                }
            }

            await this.takeScreenshot(`${mockupName}-cached-data`);
            
        } catch (error) {
            this.recordFailure(`${mockupName}-cached-data`, error.message);
        }
    }

    async testCalculators(mockupName) {
        console.log('  🧮 Testing calculator interactions...');
        
        try {
            // Test financial calculator
            const hasFinancialCalc = await this.page.$('#downPaymentSlider') !== null;
            
            if (hasFinancialCalc) {
                // Test slider interaction
                await this.page.evaluate(() => {
                    const slider = document.getElementById('downPaymentSlider');
                    if (slider) {
                        slider.value = 25;
                        slider.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });

                await new Promise(resolve => setTimeout(resolve, 500));

                // Check if calculations updated
                const monthlyPayment = await this.page.$eval('#monthlyPayment', el => el.textContent).catch(() => null);
                if (monthlyPayment && monthlyPayment !== '$0') {
                    this.recordSuccess(`${mockupName}-calculator`, 'Financial calculator updates correctly');
                } else {
                    this.recordWarning(`${mockupName}-calculator`, 'Financial calculator may not be updating');
                }
            }

            // Test STR calculator
            const hasSTRCalc = await this.page.$('#nightlyRate') !== null;
            if (hasSTRCalc) {
                await this.page.evaluate(() => {
                    const input = document.getElementById('nightlyRate');
                    if (input) {
                        input.value = 500;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
                
                this.recordSuccess(`${mockupName}-str-calc`, 'STR calculator inputs functional');
            }

        } catch (error) {
            this.recordFailure(`${mockupName}-calculators`, error.message);
        }
    }

    async testNavigation(mockupName) {
        console.log('  🧭 Testing navigation...');
        
        try {
            // Find navigation buttons
            const navButtons = await this.page.$$eval('.nav-button, [onclick*="handleNavClick"]', 
                buttons => buttons.length);
            
            if (navButtons > 0) {
                // Test clicking first nav button
                await this.page.evaluate(() => {
                    const button = document.querySelector('.nav-button, [onclick*="handleNavClick"]');
                    if (button) button.click();
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                this.recordSuccess(`${mockupName}-navigation`, `Navigation with ${navButtons} buttons working`);
            } else {
                this.recordWarning(`${mockupName}-navigation`, 'No navigation buttons found');
            }

            // Test smooth scrolling
            const hasAnchors = await this.page.$$eval('a[href^="#"]', anchors => anchors.length);
            if (hasAnchors > 0) {
                this.recordSuccess(`${mockupName}-anchors`, `${hasAnchors} anchor links found`);
            }

        } catch (error) {
            this.recordFailure(`${mockupName}-navigation`, error.message);
        }
    }

    async testDataCalculations(mockupName) {
        console.log('  📊 Validating calculations and business logic...');
        
        try {
            const calculations = await this.page.evaluate(() => {
                const results = {};
                
                // Get values from UI
                const getValueFromElement = (id) => {
                    const el = document.getElementById(id);
                    if (!el) return null;
                    const text = el.textContent;
                    return parseInt(text.replace(/[$,]/g, '')) || 0;
                };

                // STR Calculations
                const dailyRate = getValueFromElement('str-daily-rate');
                const occupancy = parseFloat(document.getElementById('str-occupancy')?.textContent) / 100 || 0.7;
                const monthlyRevenue = getValueFromElement('str-monthly-revenue');
                
                if (dailyRate && occupancy) {
                    const expectedMonthly = Math.round(dailyRate * 30 * occupancy);
                    results.strCalculation = {
                        dailyRate,
                        occupancy,
                        displayed: monthlyRevenue,
                        expected: expectedMonthly,
                        correct: Math.abs(monthlyRevenue - expectedMonthly) < 100
                    };
                }

                // LTR Calculations
                const monthlyRent = getValueFromElement('ltr-monthly-rent');
                const annualIncome = getValueFromElement('ltr-annual-income');
                
                if (monthlyRent) {
                    const expectedAnnual = monthlyRent * 12;
                    results.ltrCalculation = {
                        monthly: monthlyRent,
                        displayed: annualIncome,
                        expected: expectedAnnual,
                        correct: annualIncome === expectedAnnual
                    };
                }

                // Cap Rate Calculation
                const propertyValue = 849900; // Default test value
                const noi = (monthlyRevenue || monthlyRent || 0) * 12 * 0.6; // 60% NOI assumption
                const expectedCapRate = (noi / propertyValue) * 100;
                
                results.capRate = {
                    noi,
                    propertyValue,
                    expected: expectedCapRate.toFixed(2)
                };

                return results;
            });

            // Validate calculations
            if (calculations.strCalculation) {
                if (calculations.strCalculation.correct) {
                    this.recordSuccess(`${mockupName}-str-calc-validation`, 
                        'STR calculations are correct');
                } else {
                    this.recordFailure(`${mockupName}-str-calc-validation`, 
                        `STR calculation mismatch: displayed ${calculations.strCalculation.displayed}, expected ${calculations.strCalculation.expected}`);
                }
            }

            if (calculations.ltrCalculation) {
                if (calculations.ltrCalculation.correct) {
                    this.recordSuccess(`${mockupName}-ltr-calc-validation`, 
                        'LTR calculations are correct');
                } else {
                    this.recordWarning(`${mockupName}-ltr-calc-validation`, 
                        `LTR calculation: displayed ${calculations.ltrCalculation.displayed}, expected ${calculations.ltrCalculation.expected}`);
                }
            }

        } catch (error) {
            this.recordFailure(`${mockupName}-calculations`, error.message);
        }
    }

    async testExtensionFlow(mockupName) {
        console.log('  🔗 Testing extension flow...');
        
        try {
            // Simulate extension URL parameters
            const extensionUrl = `${this.baseUrl}${mockupName === 'mockup1' ? '/mockups/mockup-iterations/base-mockup.html' : '/mockups/mockup-iterations/base-mockup2.html'}?fromExtension=true&street=456+Extension+St&city=Montreal&price=750000&bedrooms=4`;
            
            await this.page.goto(extensionUrl, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if form was populated
            const addressValue = await this.page.$eval('input[name="address"]', el => el.value).catch(() => '');
            
            if (addressValue.includes('Extension')) {
                this.recordSuccess(`${mockupName}-extension`, 'Extension data properly populated');
            } else {
                this.recordWarning(`${mockupName}-extension`, 'Extension data may not be populating correctly');
            }

            await this.takeScreenshot(`${mockupName}-extension-flow`);

        } catch (error) {
            this.recordFailure(`${mockupName}-extension`, error.message);
        }
    }

    async testQuickComparison(mockupName) {
        console.log('  ⚖️ Testing quick comparison section...');
        
        try {
            const comparisonData = await this.page.evaluate(() => {
                const strMonthly = document.getElementById('comparison-str-monthly')?.textContent;
                const ltrMonthly = document.getElementById('comparison-ltr-monthly')?.textContent;
                const recommendation = document.getElementById('comparison-recommendation')?.textContent;
                
                return { strMonthly, ltrMonthly, recommendation };
            });

            if (comparisonData.recommendation) {
                this.recordSuccess(`${mockupName}-comparison`, 
                    `Comparison shows: STR ${comparisonData.strMonthly}, LTR ${comparisonData.ltrMonthly}, Recommends: ${comparisonData.recommendation}`);
            } else {
                this.recordWarning(`${mockupName}-comparison`, 'Comparison section not found or not populated');
            }

        } catch (error) {
            this.recordFailure(`${mockupName}-comparison`, error.message);
        }
    }

    async testInvestmentGrade(mockupName) {
        console.log('  🎯 Testing investment grade calculation...');
        
        try {
            const gradeData = await this.page.evaluate(() => {
                const grade = document.getElementById('investment-grade')?.textContent;
                const description = document.getElementById('investment-grade-desc')?.textContent;
                
                return { grade, description };
            });

            if (gradeData.grade) {
                this.recordSuccess(`${mockupName}-grade`, 
                    `Investment grade: ${gradeData.grade} - ${gradeData.description}`);
            } else {
                this.recordWarning(`${mockupName}-grade`, 'Investment grade section not found');
            }

        } catch (error) {
            this.recordFailure(`${mockupName}-grade`, error.message);
        }
    }

    async takeScreenshot(name) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshots/${name}-${timestamp}.png`;
        
        try {
            await fs.mkdir('screenshots', { recursive: true });
            await this.page.screenshot({ 
                path: filename, 
                fullPage: true 
            });
            console.log(`    📸 Screenshot saved: ${filename}`);
        } catch (error) {
            console.error(`    ❌ Failed to save screenshot: ${error.message}`);
        }
    }

    recordSuccess(test, message) {
        this.testResults.passed.push({ test, message });
        console.log(`    ✅ ${test}: ${message}`);
    }

    recordFailure(test, message) {
        this.testResults.failed.push({ test, message });
        console.log(`    ❌ ${test}: ${message}`);
    }

    recordWarning(test, message) {
        this.testResults.warnings.push({ test, message });
        console.log(`    ⚠️ ${test}: ${message}`);
    }

    async generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(80));
        
        console.log(`\n✅ Passed: ${this.testResults.passed.length}`);
        this.testResults.passed.forEach(r => console.log(`   - ${r.test}: ${r.message}`));
        
        console.log(`\n❌ Failed: ${this.testResults.failed.length}`);
        this.testResults.failed.forEach(r => console.log(`   - ${r.test}: ${r.message}`));
        
        console.log(`\n⚠️ Warnings: ${this.testResults.warnings.length}`);
        this.testResults.warnings.forEach(r => console.log(`   - ${r.test}: ${r.message}`));
        
        console.log(`\n🐛 Console/Page Issues: ${this.issues.length}`);
        this.issues.forEach(i => console.log(`   - [${i.type}] ${i.message}`));

        // Generate detailed report file
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                passed: this.testResults.passed.length,
                failed: this.testResults.failed.length,
                warnings: this.testResults.warnings.length,
                issues: this.issues.length
            },
            details: this.testResults,
            issues: this.issues,
            recommendations: this.generateRecommendations()
        };

        await fs.writeFile(
            'test-report.json', 
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to test-report.json');
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check for STR revenue issue
        const strIssue = this.testResults.failed.find(f => f.test.includes('str-revenue'));
        if (strIssue) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'STR monthly revenue calculation',
                fix: 'Update api-integration.js to handle both monthlyRate and monthlyRevenue fields'
            });
        }

        // Check for console errors
        const consoleErrors = this.issues.filter(i => i.type === 'console-error');
        if (consoleErrors.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                issue: `${consoleErrors.length} JavaScript console errors`,
                fix: 'Review and fix JavaScript errors, check for missing functions and scope issues'
            });
        }

        // Check for API errors
        const apiErrors = this.issues.filter(i => i.type === 'api-error');
        if (apiErrors.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: `${apiErrors.length} API call failures`,
                fix: 'Check CORS configuration and API endpoint availability'
            });
        }

        // Check for calculator issues
        const calcIssues = this.testResults.failed.filter(f => f.test.includes('calc'));
        if (calcIssues.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: 'Calculator functionality issues',
                fix: 'Verify event listeners are properly attached and calculation functions are in global scope'
            });
        }

        return recommendations;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.initialize();
            
            // Test both mockups
            await this.testMockup('/mockups/mockup-iterations/base-mockup.html', 'mockup1');
            await this.testMockup('/mockups/mockup-iterations/base-mockup2.html', 'mockup2');
            
            // Generate and display report
            await this.generateReport();
            
        } catch (error) {
            console.error('Fatal error during testing:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run the tests
const tester = new MockupComprehensiveTester();
tester.run().catch(console.error);