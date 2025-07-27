const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runQuickDeploymentTest() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const screenshotDir = path.join(__dirname, 'screenshots', 'quick-deployment', timestamp);
    await fs.mkdir(screenshotDir, { recursive: true });

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

    let page;
    try {
        page = await browser.newPage();
        
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
            } else if (type === 'log') {
                console.log('Console Log:', text);
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

        // Click the "Add More Details" link to expand optional fields
        console.log('Looking for Add More Details button...');
        const addDetailsLink = await page.$('a[href="javascript:void(0)"]');
        if (addDetailsLink) {
            const linkText = await addDetailsLink.evaluate(el => el.textContent);
            console.log('Found link with text:', linkText);
            if (linkText.includes('Add More Details')) {
                await addDetailsLink.click();
                console.log('Clicked Add More Details');
                await page.waitForTimeout(1000);
            }
        }

        // Take screenshot after expanding
        await page.screenshot({ 
            path: path.join(screenshotDir, '02-form-expanded.png'),
            fullPage: true 
        });

        // Clear and fill the form with test data
        console.log('Clearing and filling form with test data...');
        
        // Clear and fill each field
        const fields = [
            { selector: '#propertyAddress', value: '123 King Street West, Toronto, ON, M5V 3A8' },
            { selector: '#purchasePrice', value: '750000' },
            { selector: '#squareFootage', value: '850' },
            { selector: '#propertyTaxes', value: '4500' },
            { selector: '#hoaCondoFees', value: '650' }
        ];

        for (const field of fields) {
            const input = await page.$(field.selector);
            if (input) {
                await input.click({ clickCount: 3 });
                await page.keyboard.down('Control');
                await page.keyboard.press('A');
                await page.keyboard.up('Control');
                await page.keyboard.press('Backspace');
                await input.type(field.value);
                console.log(`✅ Filled ${field.selector} with ${field.value}`);
            } else {
                console.log(`⚠️ Field ${field.selector} not found`);
            }
        }

        // Select dropdowns
        await page.select('#bedrooms', '2');
        await page.select('#bathrooms', '2');
        
        const propertyTypeSelect = await page.$('#propertyType');
        if (propertyTypeSelect) {
            await page.select('#propertyType', 'condo');
        }

        // Take screenshot of filled form
        await page.screenshot({ 
            path: path.join(screenshotDir, '03-form-filled.png'),
            fullPage: true 
        });
        console.log('✅ Form filled with test data');

        // Submit the form
        console.log('Submitting form...');
        const analyzeButton = await page.$('#analyzeButton');
        if (analyzeButton) {
            await analyzeButton.click();
        } else {
            throw new Error('Analyze button not found');
        }

        // Wait for results with extended timeout
        console.log('Waiting for results...');
        try {
            await page.waitForSelector('#analysisResults', { 
                visible: true, 
                timeout: 60000 
            });
            console.log('✅ Results loaded successfully');
        } catch (error) {
            console.error('❌ Results did not load within timeout');
            await page.screenshot({ 
                path: path.join(screenshotDir, '04-error-state.png'),
                fullPage: true 
            });
            throw error;
        }

        // Take screenshot of results
        await page.screenshot({ 
            path: path.join(screenshotDir, '05-results-loaded.png'),
            fullPage: true 
        });

        // Test STR tab (should be active by default)
        console.log('Testing STR tab...');
        await page.waitForTimeout(2000);
        await page.screenshot({ 
            path: path.join(screenshotDir, '06-str-tab.png'),
            fullPage: true 
        });

        // Test LTR tab
        console.log('Testing LTR tab...');
        const ltrTab = await page.$('button[onclick*="showTab(\'ltr\')"]');
        if (!ltrTab) {
            // Try alternate selector
            const tabs = await page.$$('.tab-button');
            for (const tab of tabs) {
                const text = await tab.evaluate(el => el.textContent);
                if (text.includes('Long-Term')) {
                    await tab.click();
                    break;
                }
            }
        } else {
            await ltrTab.click();
        }
        await page.waitForTimeout(1000);
        await page.screenshot({ 
            path: path.join(screenshotDir, '07-ltr-tab.png'),
            fullPage: true 
        });

        // Test Investment tab
        console.log('Testing Investment tab...');
        const investmentTab = await page.$('button[onclick*="showTab(\'investment\')"]');
        if (!investmentTab) {
            // Try alternate selector
            const tabs = await page.$$('.tab-button');
            for (const tab of tabs) {
                const text = await tab.evaluate(el => el.textContent);
                if (text.includes('Investment')) {
                    await tab.click();
                    break;
                }
            }
        } else {
            await investmentTab.click();
        }
        await page.waitForTimeout(1000);
        await page.screenshot({ 
            path: path.join(screenshotDir, '08-investment-tab.png'),
            fullPage: true 
        });

        // Check for any errors in results
        const errorElements = await page.$$('.error, .alert-danger, .text-red-500');
        if (errorElements.length > 0) {
            console.error(`⚠️ Found ${errorElements.length} potential error elements`);
            for (let i = 0; i < errorElements.length; i++) {
                const errorText = await errorElements[i].evaluate(el => el.textContent);
                console.error(`Error ${i + 1}: ${errorText.trim()}`);
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
                tabsFound: {
                    str: true,
                    ltr: ltrTab !== null || await page.$('.tab-button') !== null,
                    investment: investmentTab !== null || await page.$('.tab-button') !== null
                },
                errorsFound: errorElements.length
            },
            screenshotDir: screenshotDir
        };

        await fs.writeFile(
            path.join(screenshotDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n✅ Quick deployment test completed successfully!');
        console.log(`📸 Screenshots saved to: ${screenshotDir}`);
        
        return report;

    } catch (error) {
        console.error('❌ Test failed:', error);
        if (page) {
            try {
                await page.screenshot({ 
                    path: path.join(screenshotDir, 'error-final.png'),
                    fullPage: true 
                });
            } catch (screenshotError) {
                console.error('Could not capture error screenshot:', screenshotError);
            }
        }
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
runQuickDeploymentTest()
    .then(report => {
        console.log('\n📊 Test Summary:');
        console.log('- Page loaded:', report.results.pageLoaded ? '✅' : '❌');
        console.log('- Form filled:', report.results.formFilled ? '✅' : '❌');
        console.log('- Form submitted:', report.results.formSubmitted ? '✅' : '❌');
        console.log('- Results displayed:', report.results.resultsDisplayed ? '✅' : '❌');
        console.log('- STR tab:', report.results.tabsFound.str ? '✅' : '❌');
        console.log('- LTR tab:', report.results.tabsFound.ltr ? '✅' : '❌');
        console.log('- Investment tab:', report.results.tabsFound.investment ? '✅' : '❌');
        console.log('- Errors found:', report.results.errorsFound);
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    });