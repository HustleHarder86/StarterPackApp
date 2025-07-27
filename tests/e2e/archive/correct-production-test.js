const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function testProductionFormCorrect() {
    let browser;
    const screenshotDir = path.join(__dirname, 'screenshots', 'production-correct', new Date().toISOString().split('T')[0]);
    
    try {
        // Create screenshot directory
        await fs.mkdir(screenshotDir, { recursive: true });
        
        console.log('🚀 Starting production form test with correct selectors...\n');
        
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            defaultViewport: { width: 1280, height: 800 }
        });

        const page = await browser.newPage();
        page.setDefaultTimeout(30000);

        let screenshotCounter = 1;
        const saveScreenshot = async (name) => {
            try {
                const filename = `${String(screenshotCounter).padStart(2, '0')}-${name}.png`;
                await page.screenshot({ 
                    path: path.join(screenshotDir, filename),
                    fullPage: true 
                });
                console.log(`📸 Screenshot: ${filename}`);
                screenshotCounter++;
                return filename;
            } catch (err) {
                console.error(`Failed to save screenshot ${name}:`, err.message);
            }
        };

        // Navigate to production URL with E2E test mode
        const url = 'https://starter-pack-3qfqfyy8i-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`📍 Navigating to: ${url}`);
        
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log(`✅ Page loaded (Status: ${response.status()})\n`);
        await saveScreenshot('01-initial-load');

        // Wait for the form section to be visible
        console.log('⏳ Waiting for property input section...');
        await page.waitForSelector('#property-input-section', { visible: true, timeout: 15000 });
        console.log('✅ Property input section found!\n');

        // Scroll to form
        await page.evaluate(() => {
            document.querySelector('#property-input-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await new Promise(r => setTimeout(r, 1000));
        await saveScreenshot('02-form-visible');

        // Fill form fields with CORRECT IDs
        console.log('📝 Filling form fields...');
        
        // Address - using property-address ID based on HTML structure
        try {
            const addressSelector = 'input[placeholder*="123 Main Street"]';
            await page.waitForSelector(addressSelector, { visible: true, timeout: 5000 });
            await page.click(addressSelector);
            await page.type(addressSelector, '123 King Street West, Toronto, ON, M5V 3A8');
            console.log('✅ Address: 123 King Street West, Toronto, ON, M5V 3A8');
        } catch (err) {
            console.error('❌ Failed to fill Address:', err.message);
        }

        // Purchase Price
        try {
            await page.waitForSelector('#property-price', { visible: true, timeout: 5000 });
            await page.click('#property-price');
            await page.type('#property-price', '750000');
            console.log('✅ Purchase Price: 750000');
        } catch (err) {
            console.error('❌ Failed to fill Purchase Price:', err.message);
        }

        // Bedrooms
        try {
            await page.waitForSelector('#property-bedrooms', { visible: true });
            await page.select('#property-bedrooms', '2');
            console.log('✅ Bedrooms: 2');
        } catch (err) {
            console.error('❌ Failed to select bedrooms:', err.message);
        }

        // Bathrooms
        try {
            await page.waitForSelector('#property-bathrooms', { visible: true });
            await page.select('#property-bathrooms', '2');
            console.log('✅ Bathrooms: 2');
        } catch (err) {
            console.error('❌ Failed to select bathrooms:', err.message);
        }

        // Square Feet
        try {
            await page.waitForSelector('#property-sqft', { visible: true });
            await page.click('#property-sqft');
            await page.type('#property-sqft', '850');
            console.log('✅ Square Feet: 850');
        } catch (err) {
            console.error('❌ Failed to fill Square Feet:', err.message);
        }

        // Property Type
        try {
            await page.waitForSelector('#property-type', { visible: true });
            await page.select('#property-type', 'condo');
            console.log('✅ Property Type: Condo');
        } catch (err) {
            console.error('❌ Failed to select property type:', err.message);
        }

        // Property Taxes
        try {
            await page.waitForSelector('#property-taxes', { visible: true });
            await page.click('#property-taxes');
            await page.type('#property-taxes', '4500');
            console.log('✅ Property Taxes: 4500');
        } catch (err) {
            console.error('❌ Failed to fill Property Taxes:', err.message);
        }

        // Condo Fees
        try {
            await page.waitForSelector('#property-condofees', { visible: true });
            await page.click('#property-condofees');
            await page.type('#property-condofees', '650');
            console.log('✅ Condo Fees: 650');
        } catch (err) {
            console.error('❌ Failed to fill Condo Fees:', err.message);
        }

        await saveScreenshot('03-form-filled');

        // Submit form
        console.log('\n🚀 Submitting form...');
        
        // Find submit button - looking for "Analyze Property" button
        const submitButton = await page.$('button.btn-primary');
        if (submitButton) {
            // Monitor console for errors
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    console.log(`🔴 Browser error: ${msg.text()}`);
                }
            });

            await submitButton.click();
            console.log('✅ Submit button clicked\n');
            await saveScreenshot('04-form-submitting');
        } else {
            console.error('❌ Submit button not found');
            return;
        }

        // Wait for results or error
        console.log('⏳ Waiting for API response...');
        
        try {
            // Wait for either results or error
            await Promise.race([
                page.waitForSelector('#analysis-results:not([style*="display: none"])', { timeout: 120000 }),
                page.waitForSelector('.error, .alert-danger, #error-state', { timeout: 120000 })
            ]);
            
            await new Promise(r => setTimeout(r, 3000)); // Let content settle
            
            // Check what we got
            const hasResults = await page.evaluate(() => {
                const results = document.querySelector('#analysis-results');
                return results && results.style.display !== 'none' && results.innerHTML.length > 100;
            });
            
            const hasError = await page.$('.error, .alert-danger, #error-state') !== null;
            
            if (hasResults) {
                console.log('\n✅ SUCCESS! Analysis results received!');
                await saveScreenshot('05-results-received');
                
                // Capture different sections of results
                const resultSections = [
                    { selector: '.purchase-summary', name: 'purchase-summary' },
                    { selector: '.rental-analysis', name: 'rental-analysis' },
                    { selector: '.str-analysis', name: 'str-analysis' },
                    { selector: '.financial-metrics', name: 'financial-metrics' },
                    { selector: '.investment-summary', name: 'investment-summary' }
                ];
                
                for (const section of resultSections) {
                    const element = await page.$(section.selector);
                    if (element) {
                        await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), element);
                        await new Promise(r => setTimeout(r, 500));
                        await saveScreenshot(`06-${section.name}`);
                        console.log(`📸 Captured ${section.name}`);
                    }
                }
                
                // Try to extract key metrics
                console.log('\n📊 Extracting Key Metrics:');
                try {
                    const metrics = await page.evaluate(() => {
                        const getText = (selectors) => {
                            for (const selector of selectors) {
                                const el = document.querySelector(selector);
                                if (el) return el.textContent.trim();
                            }
                            return 'Not found';
                        };
                        
                        // Try multiple possible selectors for each metric
                        return {
                            monthlyRent: getText(['.monthly-rent-value', '[data-metric="monthly-rent"]', '.rental-income']),
                            strRevenue: getText(['.str-revenue-value', '[data-metric="str-revenue"]', '.str-monthly-revenue']),
                            cashFlow: getText(['.cash-flow-value', '[data-metric="cash-flow"]', '.monthly-cash-flow']),
                            roi: getText(['.roi-value', '[data-metric="roi"]', '.roi-percentage', '.annual-roi'])
                        };
                    });
                    
                    console.log(`Monthly Rent: ${metrics.monthlyRent}`);
                    console.log(`STR Revenue: ${metrics.strRevenue}`);
                    console.log(`Cash Flow: ${metrics.cashFlow}`);
                    console.log(`ROI: ${metrics.roi}`);
                } catch (err) {
                    console.log('Could not extract all metrics:', err.message);
                }
                
            } else if (hasError) {
                console.log('\n❌ ERROR occurred during submission');
                await saveScreenshot('05-error-state');
                
                const errorText = await page.evaluate(() => {
                    const error = document.querySelector('.error, .alert-danger, #error-state');
                    return error ? error.textContent.trim() : 'Unknown error';
                });
                console.log(`Error message: ${errorText}`);
            } else {
                console.log('\n⚠️ No clear results or error state detected');
                await saveScreenshot('05-unknown-state');
            }
            
        } catch (timeoutErr) {
            console.log('\n⏱️ TIMEOUT: No response after 2 minutes');
            await saveScreenshot('05-timeout-state');
        }

        // Final screenshot
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 1000));
        await saveScreenshot('07-final-state');

        // Generate test report
        const report = `# Production Form Test Report

**Date:** ${new Date().toISOString()}  
**URL:** ${url}  
**Screenshots:** ${screenshotDir}

## Test Data Used
- Address: 123 King Street West, Toronto, ON, M5V 3A8
- Purchase Price: $750,000
- Bedrooms: 2
- Bathrooms: 2  
- Square Feet: 850
- Property Type: Condo
- Property Taxes: $4,500
- Condo Fees: $650

## Results
Check the screenshots directory for visual evidence of the test execution.

${screenshotCounter - 1} screenshots captured during test.
`;
        
        await fs.writeFile(path.join(screenshotDir, 'test-report.md'), report);
        console.log(`\n✅ Test completed! Report saved to: ${path.join(screenshotDir, 'test-report.md')}`);

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error(error.stack);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run test
testProductionFormCorrect().catch(console.error);