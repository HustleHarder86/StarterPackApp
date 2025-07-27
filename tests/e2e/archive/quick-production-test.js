const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function quickProductionTest() {
    let browser;
    try {
        console.log('🚀 Starting quick production test...');
        
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            defaultViewport: { width: 1280, height: 800 },
            protocolTimeout: 180000, // 3 minutes
            timeout: 60000
        });

        const page = await browser.newPage();
        
        // Set page timeout
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);

        // Create screenshot directory
        const screenshotDir = path.join(__dirname, 'screenshots', 'quick-production', new Date().toISOString().split('T')[0]);
        await fs.mkdir(screenshotDir, { recursive: true });

        let screenshotCounter = 1;
        const saveScreenshot = async (name) => {
            try {
                const filename = `${String(screenshotCounter).padStart(2, '0')}-${name}.png`;
                await page.screenshot({ 
                    path: path.join(screenshotDir, filename),
                    fullPage: false // Faster with viewport only
                });
                console.log(`✅ Screenshot: ${filename}`);
                screenshotCounter++;
            } catch (err) {
                console.error(`Failed to save screenshot ${name}:`, err.message);
            }
        };

        // Navigate to production URL
        const url = 'https://starter-pack-3qfqfyy8i-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`📍 Loading: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            console.log('✅ Page loaded');
        } catch (err) {
            console.error('❌ Failed to load page:', err.message);
            return;
        }

        await saveScreenshot('page-loaded');

        // Wait for form
        try {
            await page.waitForSelector('#property-form', { timeout: 10000 });
            console.log('✅ Form found');
        } catch (err) {
            console.error('❌ Form not found');
            await saveScreenshot('no-form');
            return;
        }

        // Fill form quickly
        console.log('📝 Filling form...');
        
        const formData = {
            '#address': '123 King Street West, Toronto, ON, M5V 3A8',
            '#purchasePrice': '750000',
            '#bedrooms': '2',
            '#bathrooms': '2',
            '#squareFeet': '850',
            '#propertyTaxes': '4500',
            '#condoFees': '650'
        };

        for (const [selector, value] of Object.entries(formData)) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                await page.type(selector, value);
                console.log(`✅ Filled ${selector}`);
            } catch (err) {
                console.error(`❌ Failed to fill ${selector}:`, err.message);
            }
        }

        // Select property type
        try {
            await page.select('#propertyType', 'condo');
            console.log('✅ Selected Condo');
        } catch (err) {
            console.error('❌ Failed to select property type');
        }

        await saveScreenshot('form-filled');

        // Submit form
        console.log('🚀 Submitting form...');
        
        // Listen for console
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`Browser error: ${msg.text()}`);
            }
        });

        try {
            await page.click('#submit-btn');
            console.log('✅ Clicked submit');
        } catch (err) {
            console.error('❌ Failed to click submit:', err.message);
            return;
        }

        // Wait for response
        console.log('⏳ Waiting for results...');
        await page.waitForTimeout(3000);
        await saveScreenshot('after-submit');

        // Check for results or errors
        const hasResults = await page.$('#analysis-results') !== null;
        const hasError = await page.$('.error, .alert-danger') !== null;

        if (hasResults) {
            console.log('✅ Analysis results appeared!');
            await saveScreenshot('results-shown');
            
            // Try to get some values
            try {
                const values = await page.evaluate(() => {
                    const getText = (selector) => {
                        const el = document.querySelector(selector);
                        return el ? el.textContent.trim() : null;
                    };
                    
                    return {
                        visible: document.querySelector('#analysis-results').style.display !== 'none',
                        hasContent: document.querySelector('#analysis-results').innerHTML.length > 100
                    };
                });
                
                console.log('Results visible:', values.visible);
                console.log('Has content:', values.hasContent);
            } catch (err) {
                console.error('Failed to extract values:', err.message);
            }
        } else if (hasError) {
            console.log('❌ Error appeared');
            await saveScreenshot('error-shown');
            
            const errorText = await page.evaluate(() => {
                const error = document.querySelector('.error, .alert-danger');
                return error ? error.textContent : 'Unknown error';
            });
            console.log('Error:', errorText);
        } else {
            console.log('⚠️  No results or error shown');
            await saveScreenshot('no-response');
        }

        // Wait a bit more and take final screenshot
        await page.waitForTimeout(5000);
        await saveScreenshot('final-state');

        console.log(`\n✅ Test completed! Check screenshots in: ${screenshotDir}`);

    } catch (error) {
        console.error('❌ Test error:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run test
quickProductionTest().catch(console.error);