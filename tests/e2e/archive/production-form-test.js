const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function testProductionFormSubmission() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    
    // Create screenshot directory
    const screenshotDir = path.join(__dirname, 'screenshots', 'production-test', new Date().toISOString().split('T')[0]);
    await fs.mkdir(screenshotDir, { recursive: true });

    let screenshotCounter = 1;
    const takeScreenshot = async (name) => {
        const filename = `${String(screenshotCounter).padStart(2, '0')}-${name}.png`;
        await page.screenshot({ 
            path: path.join(screenshotDir, filename),
            fullPage: true 
        });
        console.log(`✅ Screenshot saved: ${filename}`);
        screenshotCounter++;
    };

    try {
        console.log('🚀 Starting production form submission test...');
        
        // Navigate to the production URL with E2E test mode
        const url = 'https://starter-pack-3qfqfyy8i-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`📍 Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await takeScreenshot('initial-page-load');

        // Wait for form to be ready
        await page.waitForSelector('#property-form', { timeout: 10000 });
        console.log('✅ Form loaded successfully');

        // Scroll to form section to ensure visibility
        await page.evaluate(() => {
            document.querySelector('#property-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        await page.waitForTimeout(1000);
        await takeScreenshot('form-in-view');

        // Fill in the form fields
        console.log('📝 Filling form fields...');

        // Address
        await page.type('#address', '123 King Street West, Toronto, ON, M5V 3A8');
        console.log('✅ Address entered');

        // Purchase Price
        await page.type('#purchasePrice', '750000');
        console.log('✅ Purchase price entered');

        // Bedrooms
        await page.type('#bedrooms', '2');
        console.log('✅ Bedrooms entered');

        // Bathrooms
        await page.type('#bathrooms', '2');
        console.log('✅ Bathrooms entered');

        // Square Feet
        await page.type('#squareFeet', '850');
        console.log('✅ Square feet entered');

        // Property Type - Select Condo
        await page.select('#propertyType', 'condo');
        console.log('✅ Property type selected: Condo');

        // Property Taxes
        await page.type('#propertyTaxes', '4500');
        console.log('✅ Property taxes entered');

        // Condo Fees
        await page.type('#condoFees', '650');
        console.log('✅ Condo fees entered');

        await takeScreenshot('form-filled');

        // Submit the form
        console.log('🚀 Submitting form...');
        
        // Listen for console messages
        page.on('console', msg => {
            console.log(`Browser console: ${msg.type()} - ${msg.text()}`);
        });

        // Listen for any errors
        page.on('error', err => {
            console.error('Page error:', err);
        });

        page.on('pageerror', err => {
            console.error('Page error:', err);
        });

        // Click submit button
        await page.click('#submit-btn');
        console.log('✅ Submit button clicked');

        // Wait for loading state
        await page.waitForTimeout(2000);
        await takeScreenshot('form-submitting');

        // Wait for either success or error
        try {
            // Wait for analysis results with increased timeout
            await page.waitForSelector('#analysis-results', { 
                visible: true, 
                timeout: 120000 // 2 minutes for API processing
            });
            
            console.log('✅ Analysis results received!');
            await takeScreenshot('analysis-results-initial');

            // Wait a bit for all content to load
            await page.waitForTimeout(3000);
            
            // Capture full results
            await takeScreenshot('analysis-results-complete');

            // Check for specific result sections
            const sections = [
                { selector: '.purchase-analysis', name: 'purchase-analysis' },
                { selector: '.rental-analysis', name: 'rental-analysis' },
                { selector: '.str-analysis', name: 'str-analysis' },
                { selector: '.financial-summary', name: 'financial-summary' }
            ];

            for (const section of sections) {
                const element = await page.$(section.selector);
                if (element) {
                    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), element);
                    await page.waitForTimeout(500);
                    await takeScreenshot(section.name);
                    console.log(`✅ Captured ${section.name}`);
                }
            }

            // Extract some key results
            const results = await page.evaluate(() => {
                const getTextContent = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.textContent.trim() : 'Not found';
                };

                return {
                    monthlyRent: getTextContent('.monthly-rent-value'),
                    strRevenue: getTextContent('.str-revenue-value'),
                    cashFlow: getTextContent('.cash-flow-value'),
                    roi: getTextContent('.roi-value')
                };
            });

            console.log('\n📊 Key Results:');
            console.log(`Monthly Rent: ${results.monthlyRent}`);
            console.log(`STR Revenue: ${results.strRevenue}`);
            console.log(`Cash Flow: ${results.cashFlow}`);
            console.log(`ROI: ${results.roi}`);

        } catch (timeoutError) {
            console.error('❌ Timeout waiting for results');
            await takeScreenshot('timeout-error');

            // Check for any error messages
            const errorElement = await page.$('.error, .alert-danger, #error-message');
            if (errorElement) {
                const errorText = await page.evaluate(el => el.textContent, errorElement);
                console.error(`Error message: ${errorText}`);
                await takeScreenshot('error-message');
            }

            // Check network activity
            const requests = await page.evaluate(() => {
                return performance.getEntriesByType('resource')
                    .filter(entry => entry.name.includes('api'))
                    .map(entry => ({
                        url: entry.name,
                        duration: entry.duration,
                        status: entry.responseStatus
                    }));
            });
            console.log('API Requests:', requests);
        }

        // Final screenshot
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);
        await takeScreenshot('final-state');

        console.log(`\n✅ Test completed! Screenshots saved in: ${screenshotDir}`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        await takeScreenshot('test-failure');
    } finally {
        await browser.close();
    }
}

// Run the test
testProductionFormSubmission().catch(console.error);