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
        const apiCalls = [];
        
        page.on('requestfailed', request => {
            if (request.url().includes('/api/')) {
                networkErrors.push({
                    url: request.url(),
                    failure: request.failure()
                });
            }
        });

        page.on('response', response => {
            if (response.url().includes('/api/')) {
                apiCalls.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
            }
        });

        // Navigate to the test URL
        console.log('Navigating to:', TEST_URL);
        await page.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 60000 });

        // Take initial screenshot
        const screenshotDir = path.join(__dirname, 'screenshots/cors-test-simple');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
        }

        await page.screenshot({
            path: path.join(screenshotDir, '01-page-loaded.png'),
            fullPage: true
        });

        // Wait a bit for page to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Try to find and click the analyze button by evaluating in page context
        console.log('Looking for Analyze Property button...');
        
        const buttonClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const analyzeButton = buttons.find(btn => btn.textContent.includes('Analyze Property'));
            if (analyzeButton) {
                analyzeButton.click();
                return true;
            }
            return false;
        });

        if (buttonClicked) {
            console.log('Clicked Analyze Property button');
        } else {
            console.log('Could not find Analyze Property button');
        }

        // Wait for potential API call
        console.log('Waiting for API response...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Take final screenshot
        await page.screenshot({
            path: path.join(screenshotDir, '02-after-click.png'),
            fullPage: true
        });

        // Check for any visible error messages
        const errorText = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.error-message, .alert-danger, [role="alert"], .text-red-500');
            return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text);
        });

        // Report results
        console.log('\n=== CORS TEST RESULTS ===');
        console.log('Test URL:', TEST_URL);
        console.log('\nNetwork Errors:', networkErrors.length > 0 ? JSON.stringify(networkErrors, null, 2) : 'None');
        console.log('\nAPI Calls:', apiCalls.length > 0 ? JSON.stringify(apiCalls, null, 2) : 'None');
        console.log('\nError Messages on Page:', errorText.length > 0 ? errorText : 'None');
        
        // Determine test result
        if (networkErrors.some(e => e.failure && e.failure.errorText && e.failure.errorText.includes('CORS'))) {
            console.log('\n❌ TEST FAILED: CORS ERROR DETECTED');
        } else if (apiCalls.some(call => call.status >= 200 && call.status < 300)) {
            console.log('\n✅ TEST PASSED: API CALL SUCCEEDED');
        } else if (apiCalls.some(call => call.status >= 400)) {
            console.log('\n❌ TEST FAILED: API RETURNED ERROR STATUS:', apiCalls.find(call => call.status >= 400).status);
        } else {
            console.log('\n⚠️  WARNING: NO API CALLS DETECTED');
        }

        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            url: TEST_URL,
            networkErrors,
            apiCalls,
            errorMessages: errorText,
            screenshots: fs.readdirSync(screenshotDir)
        };

        fs.writeFileSync(
            path.join(screenshotDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\nScreenshots saved to:', screenshotDir);

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testCORS().catch(console.error);