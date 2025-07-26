const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const screenshotDir = path.join(__dirname, 'screenshots', 'parameter-validation', timestamp);

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        console.error('Error creating directory:', error);
    }
}

async function takeScreenshot(page, name, description) {
    try {
        const filename = `${name}.png`;
        const filepath = path.join(screenshotDir, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`✅ Screenshot saved: ${name} - ${description}`);
        return filepath;
    } catch (error) {
        console.error(`❌ Failed to capture screenshot ${name}:`, error);
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testApp() {
    console.log('🚀 Starting Comprehensive E2E Test with CORRECT Parameter: e2e_test_mode=true');
    console.log('📁 Screenshots will be saved to:', screenshotDir);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
    });

    let page;
    const testResults = {
        authBypassed: false,
        formFilled: false,
        formSubmitted: false,
        resultsReceived: false,
        tabsTested: { str: false, ltr: false, investment: false },
        interactiveElements: 0,
        mobileResponsive: false,
        issues: []
    };

    try {
        page = await browser.newPage();
        
        // Set up console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Console Error:', msg.text());
                testResults.issues.push(`Console Error: ${msg.text()}`);
            }
        });

        // Navigate with CORRECT parameter
        const url = 'https://starter-pack-cf80kci6b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`\n📍 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(2000);
        
        // 1. AUTHENTICATION CHECK
        console.log('\n=== 1. AUTHENTICATION CHECK ===');
        await takeScreenshot(page, '01-initial-load', 'Initial page load with e2e_test_mode=true');
        
        // Check if form fields are visible (better check than looking for form ID)
        const addressField = await page.$('#address');
        const purchasePriceField = await page.$('#purchasePrice');
        const analyzeButton = await page.$('button[type="button"]');
        
        if (addressField && purchasePriceField) {
            console.log('✅ Authentication bypassed - form fields are visible');
            testResults.authBypassed = true;
            
            // 2. FILL PROPERTY FORM
            console.log('\n=== 2. FILLING PROPERTY FORM ===');
            
            // Clear and fill address
            await addressField.click({ clickCount: 3 });
            await page.keyboard.type('123 King Street West, Toronto, ON, M5V 3A8');
            console.log('✅ Filled address');
            
            // Clear and fill purchase price
            await purchasePriceField.click({ clickCount: 3 });
            await page.keyboard.type('750000');
            console.log('✅ Filled purchase price');
            
            // Fill bedrooms
            const bedroomsSelect = await page.$('#bedrooms');
            if (bedroomsSelect) {
                await bedroomsSelect.select('2');
                console.log('✅ Selected 2 bedrooms');
            }
            
            // Fill bathrooms
            const bathroomsSelect = await page.$('#bathrooms');
            if (bathroomsSelect) {
                await bathroomsSelect.select('2');
                console.log('✅ Selected 2 bathrooms');
            }
            
            // Expand optional details
            const expandButton = await page.$('button');
            const expandButtonText = await page.evaluate(el => el.textContent, expandButton);
            if (expandButtonText && expandButtonText.includes('Add More Details')) {
                await expandButton.click();
                await delay(500);
                console.log('✅ Expanded optional details');
            }
            
            // Fill square feet
            const sqftField = await page.$('#squareFeet');
            if (sqftField) {
                await sqftField.type('850');
                console.log('✅ Filled square feet');
            }
            
            // Select property type
            const propertyTypeSelect = await page.$('#propertyType');
            if (propertyTypeSelect) {
                await propertyTypeSelect.select('condo');
                console.log('✅ Selected property type: Condo');
            }
            
            // Fill property taxes
            const taxesField = await page.$('#propertyTaxes');
            if (taxesField) {
                await taxesField.type('4500');
                console.log('✅ Filled property taxes');
            }
            
            // Fill condo fees
            const condoFeesField = await page.$('#condoFees');
            if (condoFeesField) {
                await condoFeesField.type('650');
                console.log('✅ Filled condo fees');
            }
            
            testResults.formFilled = true;
            await takeScreenshot(page, '02-form-filled', 'Property form filled with all data');
            
            // 3. SUBMIT FORM
            console.log('\n=== 3. SUBMITTING FORM ===');
            
            // Find and click the analyze button
            const analyzeButtons = await page.$$('button');
            let submitButton = null;
            
            for (const button of analyzeButtons) {
                const text = await page.evaluate(el => el.textContent, button);
                if (text && text.includes('Analyze Property')) {
                    submitButton = button;
                    break;
                }
            }
            
            if (submitButton) {
                await submitButton.click();
                console.log('✅ Clicked Analyze Property button');
                testResults.formSubmitted = true;
                
                // Wait for results
                await delay(5000);
                await takeScreenshot(page, '03-after-submit', 'After form submission');
                
                // Check if results appeared
                const resultsSection = await page.$('#resultsSection') || 
                                     await page.$('#results') || 
                                     await page.$('.results-container') ||
                                     await page.$('[class*="results"]');
                
                if (resultsSection) {
                    console.log('✅ Results section appeared');
                    testResults.resultsReceived = true;
                    
                    // 4. TEST ALL TABS
                    console.log('\n=== 4. TESTING ALL TABS ===');
                    
                    // Find all tab buttons
                    const tabButtons = await page.$$('button[role="tab"], .tab-button, [class*="tab"]');
                    console.log(`Found ${tabButtons.length} potential tab buttons`);
                    
                    // Test STR tab
                    for (const tab of tabButtons) {
                        const tabText = await page.evaluate(el => el.textContent, tab).catch(() => '');
                        
                        if (tabText.includes('Short-term Rental') || tabText.includes('STR')) {
                            await tab.click();
                            await delay(1000);
                            await takeScreenshot(page, '04-str-tab', 'Short-term Rental Analysis Tab');
                            console.log('✅ Tested STR tab');
                            testResults.tabsTested.str = true;
                            
                            // Check STR calculations
                            const strRevenue = await page.$eval('[class*="revenue"], [class*="income"]', el => el.textContent).catch(() => null);
                            if (strRevenue) {
                                console.log(`📊 STR Revenue found: ${strRevenue}`);
                            }
                        }
                        
                        if (tabText.includes('Long-term Rental') || tabText.includes('LTR')) {
                            await tab.click();
                            await delay(1000);
                            await takeScreenshot(page, '05-ltr-tab', 'Long-term Rental Analysis Tab');
                            console.log('✅ Tested LTR tab');
                            testResults.tabsTested.ltr = true;
                            
                            // Check LTR calculations
                            const ltrRent = await page.$eval('[class*="rent"], [class*="monthly"]', el => el.textContent).catch(() => null);
                            if (ltrRent) {
                                console.log(`📊 LTR Rent found: ${ltrRent}`);
                            }
                        }
                        
                        if (tabText.includes('Investment Analysis') || tabText.includes('ROI')) {
                            await tab.click();
                            await delay(1000);
                            await takeScreenshot(page, '06-investment-tab', 'Investment Analysis Tab');
                            console.log('✅ Tested Investment Analysis tab');
                            testResults.tabsTested.investment = true;
                            
                            // Check ROI calculations
                            const roiValue = await page.$eval('[class*="roi"], [class*="return"]', el => el.textContent).catch(() => null);
                            if (roiValue) {
                                console.log(`📊 ROI Value found: ${roiValue}`);
                            }
                        }
                    }
                    
                    // 5. TEST INTERACTIVE ELEMENTS
                    console.log('\n=== 5. TESTING INTERACTIVE ELEMENTS ===');
                    
                    // Find all interactive buttons in results
                    const resultButtons = await page.$$('#resultsSection button, #results button, .results-container button');
                    console.log(`Found ${resultButtons.length} buttons in results`);
                    testResults.interactiveElements = resultButtons.length;
                    
                    // Test up to 5 buttons
                    for (let i = 0; i < Math.min(resultButtons.length, 5); i++) {
                        try {
                            const buttonText = await page.evaluate(el => el.textContent, resultButtons[i]);
                            console.log(`Testing button ${i}: ${buttonText}`);
                            
                            await resultButtons[i].click();
                            await delay(500);
                            await takeScreenshot(page, `07-button-${i}`, `After clicking: ${buttonText}`);
                            
                            // Look for and close any modals
                            const closeButton = await page.$('.modal-close, .close, [aria-label="Close"], button[class*="close"]');
                            if (closeButton) {
                                await closeButton.click();
                                await delay(300);
                                console.log('✅ Closed modal');
                            }
                        } catch (error) {
                            console.log(`Could not test button ${i}:`, error.message);
                        }
                    }
                    
                    // 6. TEST MOBILE RESPONSIVENESS
                    console.log('\n=== 6. TESTING MOBILE RESPONSIVENESS ===');
                    
                    // Test mobile viewport
                    await page.setViewport({ width: 375, height: 812 });
                    await delay(1000);
                    await takeScreenshot(page, '08-mobile-results', 'Mobile view of results');
                    
                    // Check if content is properly responsive
                    const mobileOverflow = await page.evaluate(() => {
                        const body = document.body;
                        return body.scrollWidth > window.innerWidth;
                    });
                    
                    if (!mobileOverflow) {
                        console.log('✅ Mobile view is responsive - no horizontal overflow');
                        testResults.mobileResponsive = true;
                    } else {
                        console.log('❌ Mobile view has horizontal overflow');
                        testResults.issues.push('Mobile view has horizontal overflow');
                    }
                    
                    // Test tablet viewport
                    await page.setViewport({ width: 768, height: 1024 });
                    await delay(1000);
                    await takeScreenshot(page, '09-tablet-results', 'Tablet view of results');
                    
                } else {
                    console.log('❌ Results section did not appear');
                    testResults.issues.push('Results section did not appear after form submission');
                }
            } else {
                console.log('❌ Analyze button not found');
                testResults.issues.push('Analyze Property button not found');
            }
            
        } else {
            console.log('❌ Authentication NOT bypassed - form fields not visible');
            testResults.issues.push('Authentication was not bypassed with e2e_test_mode=true parameter');
            await takeScreenshot(page, '01a-auth-not-bypassed', 'Authentication still active');
        }
        
        // Generate test report
        console.log('\n=== TEST REPORT ===');
        console.log(JSON.stringify(testResults, null, 2));
        
        // Save test report
        const reportPath = path.join(screenshotDir, 'test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
        console.log(`\n📄 Test report saved to: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Test error:', error);
        testResults.issues.push(`Test error: ${error.message}`);
        if (page) {
            await takeScreenshot(page, 'error-state', 'Error state screenshot');
        }
    } finally {
        await browser.close();
        
        // Final summary
        console.log('\n=== FINAL SUMMARY ===');
        console.log(`✅ Authentication bypassed: ${testResults.authBypassed}`);
        console.log(`✅ Form filled: ${testResults.formFilled}`);
        console.log(`✅ Form submitted: ${testResults.formSubmitted}`);
        console.log(`✅ Results received: ${testResults.resultsReceived}`);
        console.log(`✅ STR tab tested: ${testResults.tabsTested.str}`);
        console.log(`✅ LTR tab tested: ${testResults.tabsTested.ltr}`);
        console.log(`✅ Investment tab tested: ${testResults.tabsTested.investment}`);
        console.log(`✅ Interactive elements found: ${testResults.interactiveElements}`);
        console.log(`✅ Mobile responsive: ${testResults.mobileResponsive}`);
        console.log(`❌ Issues found: ${testResults.issues.length}`);
        
        if (testResults.issues.length > 0) {
            console.log('\nIssues:');
            testResults.issues.forEach((issue, i) => {
                console.log(`  ${i + 1}. ${issue}`);
            });
        }
    }
}

// Run the test
testApp().catch(console.error);