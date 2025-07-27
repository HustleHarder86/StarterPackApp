const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'https://starter-pack-1ud71kr9p-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';

async function testCORS() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1280, height: 800 });

        // Enable console logging
        page.on('console', msg => {
            console.log('Browser console:', msg.text());
        });

        // Capture network errors
        const networkErrors = [];
        page.on('requestfailed', request => {
            networkErrors.push({
                url: request.url(),
                failure: request.failure()
            });
        });

        // Navigate to the test URL
        console.log('Navigating to:', TEST_URL);
        await page.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 60000 });

        // Take initial screenshot
        const screenshotDir = path.join(__dirname, 'screenshots/cors-test');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }

        await page.screenshot({
            path: path.join(screenshotDir, '01-initial-load.png'),
            fullPage: true
        });

        // Wait for form to be ready - using the Analyze Property button as indicator
        await page.waitForSelector('button:has-text("Analyze Property")', { timeout: 30000 });

        // The form is already pre-filled from URL params, but let's verify and update if needed
        console.log('Form should be pre-filled from URL parameters...');
        
        // Clear and fill the price field to ensure correct value
        const priceInput = await page.$('input[placeholder*="850000"]');
        if (priceInput) {
            await priceInput.click({ clickCount: 3 }); // Select all
            await priceInput.type('750000');
        }
        
        // Set bedrooms
        const bedroomsSelect = await page.$('select:has(option:has-text("Select"))');
        if (bedroomsSelect) {
            await bedroomsSelect.select('2');
        }
        
        // Set bathrooms - it's the second select
        const selects = await page.$$('select');
        if (selects[1]) {
            await selects[1].select('2');
        }
        
        // Click "Add More Details" to expand the form
        const addMoreButton = await page.$('button:has-text("Add More Details")');
        if (addMoreButton) {
            await addMoreButton.click();
            await page.waitForTimeout(500);
            
            // Now fill additional fields
            // Square feet
            const sqftInput = await page.$('input[placeholder*="square feet"]');
            if (sqftInput) {
                await sqftInput.type('850');
            }
            
            // Property type
            const propertyTypeSelect = await page.$('select:has(option:has-text("House"))');
            if (propertyTypeSelect) {
                await propertyTypeSelect.select('condo');
            }
            
            // Property taxes
            const taxInput = await page.$('input[placeholder*="property taxes"]');
            if (taxInput) {
                await taxInput.type('4500');
            }
            
            // Condo fees
            const condoInput = await page.$('input[placeholder*="condo fees"]');
            if (condoInput) {
                await condoInput.type('650');
            }
        }

        // Take screenshot of filled form
        await page.screenshot({
            path: path.join(screenshotDir, '02-form-filled.png'),
            fullPage: true
        });

        // Set up response interceptor to capture API responses
        const apiResponses = [];
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                apiResponses.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    headers: response.headers()
                });
            }
        });

        // Submit the form
        console.log('Submitting form...');
        const analyzeButton = await page.$('button:has-text("Analyze Property")');
        if (analyzeButton) {
            await analyzeButton.click();
        }

        // Wait for API response or error
        await page.waitForTimeout(10000);

        // Take screenshot after submission
        await page.screenshot({
            path: path.join(screenshotDir, '03-after-submission.png'),
            fullPage: true
        });

        // Check for loading states
        const isLoading = await page.$('#loading-state');
        if (isLoading) {
            console.log('Loading state detected');
        }

        // Check for error messages
        const errorElement = await page.$('.error-message, .alert-danger, [role="alert"]');
        if (errorElement) {
            const errorText = await page.evaluate(el => el.textContent, errorElement);
            console.log('Error detected:', errorText);
            
            await page.screenshot({
                path: path.join(screenshotDir, '04-error-state.png'),
                fullPage: true
            });
        }

        // Check for success state
        const resultsElement = await page.$('#results, .results-container');
        if (resultsElement) {
            console.log('Results displayed successfully');
            
            await page.screenshot({
                path: path.join(screenshotDir, '04-success-state.png'),
                fullPage: true
            });
        }

        // Get browser console logs
        const consoleLogs = await page.evaluate(() => {
            const logs = [];
            const originalLog = console.log;
            const originalError = console.error;
            
            // Capture any errors in console
            return new Promise(resolve => {
                setTimeout(() => resolve(logs), 1000);
            });
        });

        // Report results
        console.log('\n=== CORS TEST RESULTS ===');
        console.log('Test URL:', TEST_URL);
        console.log('Network Errors:', networkErrors.length > 0 ? networkErrors : 'None');
        console.log('API Responses:', apiResponses);
        
        if (networkErrors.some(e => e.failure && e.failure.errorText.includes('CORS'))) {
            console.log('\n❌ CORS ERROR DETECTED');
        } else if (apiResponses.some(r => r.status >= 200 && r.status < 300)) {
            console.log('\n✅ API CALL SUCCEEDED');
        } else if (apiResponses.some(r => r.status >= 400)) {
            console.log('\n❌ API CALL FAILED WITH STATUS:', apiResponses.find(r => r.status >= 400).status);
        } else {
            console.log('\n⚠️  NO API RESPONSE DETECTED');
        }

        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            url: TEST_URL,
            networkErrors,
            apiResponses,
            screenshotsCreated: fs.readdirSync(screenshotDir)
        };

        fs.writeFileSync(
            path.join(screenshotDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );

    } catch (error) {
        console.error('Test error:', error);
        
        // Take error screenshot
        try {
            await page.screenshot({
                path: path.join(__dirname, 'screenshots/cors-test/error-state.png'),
                fullPage: true
            });
        } catch (e) {
            console.error('Failed to take error screenshot:', e);
        }
    } finally {
        await browser.close();
    }
}

// Run the test
testCORS().catch(console.error);