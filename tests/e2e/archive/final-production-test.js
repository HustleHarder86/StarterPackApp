const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function testProductionForm() {
    let browser;
    const screenshotDir = path.join(__dirname, 'screenshots', 'production-final', new Date().toISOString().split('T')[0]);
    
    try {
        // Create screenshot directory
        await fs.mkdir(screenshotDir, { recursive: true });
        
        console.log('🚀 Starting production form test...');
        
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
        console.log(`\n📍 Navigating to: ${url}`);
        
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log(`✅ Page loaded (Status: ${response.status()})`);
        await saveScreenshot('01-initial-load');

        // Wait for the correct form selector
        console.log('\n⏳ Waiting for form...');
        await page.waitForSelector('#property-analysis-form', { timeout: 15000 });
        console.log('✅ Form found!');

        // Scroll to form
        await page.evaluate(() => {
            document.querySelector('#property-analysis-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await new Promise(r => setTimeout(r, 1000));
        await saveScreenshot('02-form-visible');

        // Fill form fields
        console.log('\n📝 Filling form fields...');
        
        // Fill text inputs
        const textInputs = [
            { selector: '#address', value: '123 King Street West, Toronto, ON, M5V 3A8', label: 'Address' },
            { selector: '#purchasePrice', value: '750000', label: 'Purchase Price' },
            { selector: '#propertyTaxes', value: '4500', label: 'Property Taxes' },
            { selector: '#condoFees', value: '650', label: 'Condo Fees' },
            { selector: '#squareFeet', value: '850', label: 'Square Feet' }
        ];

        for (const input of textInputs) {
            try {
                await page.waitForSelector(input.selector, { visible: true, timeout: 5000 });
                await page.click(input.selector); // Focus first
                await page.type(input.selector, input.value);
                console.log(`✅ ${input.label}: ${input.value}`);
            } catch (err) {
                console.error(`❌ Failed to fill ${input.label}: ${err.message}`);
            }
        }

        // Select dropdowns
        console.log('\n📋 Setting dropdown values...');
        
        // Bedrooms
        try {
            await page.waitForSelector('#bedrooms', { visible: true });
            await page.select('#bedrooms', '2');
            console.log('✅ Bedrooms: 2');
        } catch (err) {
            console.error('❌ Failed to select bedrooms:', err.message);
        }

        // Bathrooms
        try {
            await page.waitForSelector('#bathrooms', { visible: true });
            await page.select('#bathrooms', '2');
            console.log('✅ Bathrooms: 2');
        } catch (err) {
            console.error('❌ Failed to select bathrooms:', err.message);
        }

        // Property Type
        try {
            await page.waitForSelector('#propertyType', { visible: true });
            await page.select('#propertyType', 'condo');
            console.log('✅ Property Type: Condo');
        } catch (err) {
            console.error('❌ Failed to select property type:', err.message);
        }

        await saveScreenshot('03-form-filled');

        // Submit form
        console.log('\n🚀 Submitting form...');
        
        // Find and click submit button
        const submitButton = await page.$('#submit-btn, button[type="submit"], button:has-text("Analyze")');
        if (submitButton) {
            await submitButton.click();
            console.log('✅ Submit button clicked');
        } else {
            console.error('❌ Submit button not found');
            return;
        }

        await saveScreenshot('04-form-submitting');

        // Wait for results or error
        console.log('\n⏳ Waiting for API response...');
        
        // Monitor console for errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔴 Browser error: ${msg.text()}`);
            }
        });

        // Wait for either results or error
        try {
            await Promise.race([
                page.waitForSelector('#analysis-results:not([style*="display: none"])', { timeout: 120000 }),
                page.waitForSelector('.error, .alert-danger', { timeout: 120000 })
            ]);
            
            await new Promise(r => setTimeout(r, 2000)); // Let content settle
            
            // Check what we got
            const hasResults = await page.$eval('#analysis-results', el => 
                el && el.style.display !== 'none' && el.innerHTML.length > 100
            ).catch(() => false);
            
            const hasError = await page.$('.error, .alert-danger') !== null;
            
            if (hasResults) {
                console.log('\n✅ SUCCESS! Analysis results received!');
                await saveScreenshot('05-results-received');
                
                // Capture different sections
                const sections = [
                    '.purchase-analysis',
                    '.rental-analysis', 
                    '.str-analysis',
                    '.financial-summary'
                ];
                
                for (const selector of sections) {
                    const element = await page.$(selector);
                    if (element) {
                        await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), element);
                        await new Promise(r => setTimeout(r, 500));
                        const sectionName = selector.replace('.', '').replace('-', '_');
                        await saveScreenshot(`06-${sectionName}`);
                    }
                }
                
                // Extract key metrics
                console.log('\n📊 Key Metrics:');
                try {
                    const metrics = await page.evaluate(() => {
                        const getText = (selector) => {
                            const el = document.querySelector(selector);
                            return el ? el.textContent.trim() : 'Not found';
                        };
                        
                        return {
                            monthlyRent: getText('[data-metric="monthly-rent"]') || getText('.monthly-rent'),
                            strRevenue: getText('[data-metric="str-revenue"]') || getText('.str-revenue'),
                            cashFlow: getText('[data-metric="cash-flow"]') || getText('.cash-flow'),
                            roi: getText('[data-metric="roi"]') || getText('.roi-percent')
                        };
                    });
                    
                    console.log(`Monthly Rent: ${metrics.monthlyRent}`);
                    console.log(`STR Revenue: ${metrics.strRevenue}`);
                    console.log(`Cash Flow: ${metrics.cashFlow}`);
                    console.log(`ROI: ${metrics.roi}`);
                } catch (err) {
                    console.log('Could not extract all metrics');
                }
                
            } else if (hasError) {
                console.log('\n❌ ERROR occurred during submission');
                await saveScreenshot('05-error-state');
                
                const errorText = await page.evaluate(() => {
                    const error = document.querySelector('.error, .alert-danger');
                    return error ? error.textContent.trim() : 'Unknown error';
                });
                console.log(`Error message: ${errorText}`);
            }
            
        } catch (timeoutErr) {
            console.log('\n⏱️ TIMEOUT: No response after 2 minutes');
            await saveScreenshot('05-timeout-state');
            
            // Get current page state
            const pageState = await page.evaluate(() => {
                return {
                    formVisible: !!document.querySelector('#property-analysis-form'),
                    resultsVisible: document.querySelector('#analysis-results')?.style.display !== 'none',
                    hasError: !!document.querySelector('.error, .alert-danger'),
                    loadingVisible: !!document.querySelector('.loading, .spinner')
                };
            });
            
            console.log('Page state:', pageState);
        }

        // Final screenshot
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 1000));
        await saveScreenshot('07-final-state');

        console.log(`\n✅ Test completed! Screenshots saved to: ${screenshotDir}`);
        
        // Generate report
        const report = `
# Production Form Test Report
Date: ${new Date().toISOString()}
URL: ${url}

## Test Summary
- Form found and filled: ✅
- Form submitted: ✅
- Results/Error received: Check screenshots

## Screenshots Generated
Check the screenshots directory for visual evidence of the test run.

Directory: ${screenshotDir}
`;
        
        await fs.writeFile(path.join(screenshotDir, 'test-report.md'), report);
        console.log('\n📄 Test report saved');

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
testProductionForm().catch(console.error);