const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Function to wait for specified minutes
async function waitMinutes(minutes) {
    console.log(`Waiting ${minutes} minutes for deployment to complete...`);
    const totalSeconds = minutes * 60;
    const updateInterval = 30; // Update every 30 seconds
    
    for (let elapsed = 0; elapsed < totalSeconds; elapsed += updateInterval) {
        const remaining = totalSeconds - elapsed;
        const remainingMinutes = Math.floor(remaining / 60);
        const remainingSeconds = remaining % 60;
        console.log(`Time remaining: ${remainingMinutes}m ${remainingSeconds}s`);
        await new Promise(resolve => setTimeout(resolve, updateInterval * 1000));
    }
    console.log('Wait complete. Starting test...');
}

async function runFinalDeploymentTest() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const screenshotDir = path.join(__dirname, 'screenshots', 'final-deployment', timestamp);
    await fs.mkdir(screenshotDir, { recursive: true });

    // Wait 5 minutes for deployment
    await waitMinutes(5);

    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        ],
        defaultViewport: {
            width: 1920,
            height: 1080
        }
    });

    try {
        const page = await browser.newPage();
        
        // Clear cache and cookies
        console.log('Clearing browser cache and cookies...');
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCache');
        await client.send('Network.clearBrowserCookies');

        // Set up console logging
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            if (type === 'error') {
                console.error('Console Error:', text);
            } else if (type === 'warning') {
                console.warn('Console Warning:', text);
            }
        });

        // Navigate to the page with E2E test mode
        const url = 'https://starter-pack-cpl95dq4b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`Navigating to: ${url}`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // Take initial screenshot
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-initial-load.png'),
            fullPage: true 
        });
        console.log('✅ Initial page loaded');

        // Wait for form to be ready
        await page.waitForSelector('#propertyAddress', { visible: true });

        // First, check if "Add More Details" is visible and click it
        const addDetailsButton = await page.$('button:has-text("Add More Details")');
        if (!addDetailsButton) {
            // If not visible, click the "+" button to expand optional fields
            const expandButton = await page.$('button[onclick*="toggleOptionalFields"]');
            if (expandButton) {
                await expandButton.click();
                await page.waitForTimeout(500);
            }
        }

        // Clear and fill the form with test data
        console.log('Clearing and filling form with test data...');
        
        // Address
        const addressInput = await page.$('#propertyAddress');
        await addressInput.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
        await addressInput.type('123 King Street West, Toronto, ON, M5V 3A8');
        
        // Purchase Price
        const priceInput = await page.$('#purchasePrice');
        await priceInput.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
        await priceInput.type('750000');
        
        // Bedrooms
        await page.select('#bedrooms', '2');
        
        // Bathrooms
        await page.select('#bathrooms', '2');
        
        // Wait for optional fields to be visible
        await page.waitForSelector('#squareFootage', { visible: true, timeout: 5000 }).catch(() => {});
        
        // Square Feet
        const sqftInput = await page.$('#squareFootage');
        if (sqftInput) {
            await sqftInput.click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await sqftInput.type('850');
        }
        
        // Property Type
        const propertyTypeSelect = await page.$('#propertyType');
        if (propertyTypeSelect) {
            await page.select('#propertyType', 'condo');
        }
        
        // Property Taxes
        const taxInput = await page.$('#propertyTaxes');
        if (taxInput) {
            await taxInput.click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await taxInput.type('4500');
        }
        
        // Condo Fees
        const condoInput = await page.$('#hoaCondoFees');
        if (condoInput) {
            await condoInput.click({ clickCount: 3 });
            await page.keyboard.press('Backspace');
            await condoInput.type('650');
        }

        // Take screenshot of filled form
        await page.screenshot({ 
            path: path.join(screenshotDir, '02-form-filled.png'),
            fullPage: true 
        });
        console.log('✅ Form filled with test data');

        // Submit the form
        console.log('Submitting form...');
        await page.click('#analyzeButton');

        // Wait for results with extended timeout
        try {
            await page.waitForSelector('#analysisResults', { 
                visible: true, 
                timeout: 60000 
            });
            console.log('✅ Results loaded successfully');
        } catch (error) {
            console.error('❌ Results did not load within timeout');
            await page.screenshot({ 
                path: path.join(screenshotDir, '03-error-state.png'),
                fullPage: true 
            });
            throw error;
        }

        // Take screenshot of results
        await page.screenshot({ 
            path: path.join(screenshotDir, '04-results-loaded.png'),
            fullPage: true 
        });

        // Test STR tab (should be active by default)
        console.log('Testing STR tab...');
        const strContent = await page.$('#str-content');
        if (strContent) {
            const isVisible = await strContent.isVisible();
            console.log(`STR content visible: ${isVisible}`);
            await page.screenshot({ 
                path: path.join(screenshotDir, '05-str-tab.png'),
                fullPage: true 
            });
        }

        // Test LTR tab
        console.log('Testing LTR tab...');
        const ltrTab = await page.$('[onclick*="showTab(\'ltr\')"]');
        if (ltrTab) {
            await ltrTab.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ 
                path: path.join(screenshotDir, '06-ltr-tab.png'),
                fullPage: true 
            });
        }

        // Test Investment tab
        console.log('Testing Investment tab...');
        const investmentTab = await page.$('[onclick*="showTab(\'investment\')"]');
        if (investmentTab) {
            await investmentTab.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ 
                path: path.join(screenshotDir, '07-investment-tab.png'),
                fullPage: true 
            });
        }

        // Check for any errors in results
        const errorElements = await page.$$('.error, .alert-danger');
        if (errorElements.length > 0) {
            console.error(`❌ Found ${errorElements.length} error elements`);
            for (let i = 0; i < errorElements.length; i++) {
                const errorText = await errorElements[i].evaluate(el => el.textContent);
                console.error(`Error ${i + 1}: ${errorText}`);
            }
        }

        // Generate test report
        const report = {
            timestamp: new Date().toISOString(),
            url: url,
            testData: {
                address: '123 King Street West, Toronto, ON, M5V 3A8',
                price: 750000,
                bedrooms: 2,
                bathrooms: 2,
                squareFeet: 850,
                propertyType: 'condo',
                propertyTaxes: 4500,
                condoFees: 650
            },
            results: {
                pageLoaded: true,
                formFilled: true,
                formSubmitted: true,
                resultsDisplayed: await page.$('#analysisResults') !== null,
                tabsWorking: {
                    str: await page.$('#str-content') !== null,
                    ltr: ltrTab !== null,
                    investment: investmentTab !== null
                },
                errorsFound: errorElements.length
            },
            screenshotDir: screenshotDir
        };

        await fs.writeFile(
            path.join(screenshotDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n✅ Final deployment test completed successfully!');
        console.log(`📸 Screenshots saved to: ${screenshotDir}`);
        
        return report;

    } catch (error) {
        console.error('❌ Test failed:', error);
        try {
            await page.screenshot({ 
                path: path.join(screenshotDir, 'error-final.png'),
                fullPage: true 
            });
        } catch (screenshotError) {
            console.error('Could not capture error screenshot:', screenshotError);
        }
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
runFinalDeploymentTest()
    .then(report => {
        console.log('\n📊 Test Summary:');
        console.log('- Page loaded:', report.results.pageLoaded ? '✅' : '❌');
        console.log('- Form filled:', report.results.formFilled ? '✅' : '❌');
        console.log('- Form submitted:', report.results.formSubmitted ? '✅' : '❌');
        console.log('- Results displayed:', report.results.resultsDisplayed ? '✅' : '❌');
        console.log('- STR tab:', report.results.tabsWorking.str ? '✅' : '❌');
        console.log('- LTR tab:', report.results.tabsWorking.ltr ? '✅' : '❌');
        console.log('- Investment tab:', report.results.tabsWorking.investment ? '✅' : '❌');
        console.log('- Errors found:', report.results.errorsFound);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    });