const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runManualBrowserTest() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const screenshotDir = path.join(__dirname, 'screenshots', 'manual-browser', timestamp);
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
        
        // Clear everything
        console.log('Clearing browser data...');
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCache');
        await client.send('Network.clearBrowserCookies');
        await client.send('Storage.clearDataForOrigin', {
            origin: 'https://starter-pack-cpl95dq4b-hustleharder86s-projects.vercel.app',
            storageTypes: 'all'
        });

        // Set up console logging
        page.on('console', msg => {
            console.log(`Browser ${msg.type()}:`, msg.text());
        });

        page.on('pageerror', error => {
            console.error('Page error:', error.message);
        });

        // Navigate to the page
        const url = 'https://starter-pack-cpl95dq4b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`\nNavigating to: ${url}\n`);
        
        const response = await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });

        console.log('Response status:', response.status());
        
        // Wait a bit for JavaScript to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take initial screenshot
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-page-loaded.png'),
            fullPage: true 
        });

        // Check what's on the page
        const pageTitle = await page.title();
        console.log('Page title:', pageTitle);

        // Look for the form elements
        console.log('\nChecking for form elements...');
        
        const elements = {
            propertyAddress: await page.$('#propertyAddress') !== null,
            purchasePrice: await page.$('#purchasePrice') !== null,
            bedrooms: await page.$('#bedrooms') !== null,
            bathrooms: await page.$('#bathrooms') !== null,
            analyzeButton: await page.$('#analyzeButton') !== null,
            addDetailsLink: await page.$('a[onclick*="toggleOptionalFields"]') !== null
        };

        console.log('Form elements found:', elements);

        // If propertyAddress exists, let's try to interact with it
        if (elements.propertyAddress) {
            console.log('\n✅ Form is visible, proceeding with test...');
            
            // Click Add More Details if available
            const addDetailsLink = await page.$('a[onclick*="toggleOptionalFields"]');
            if (addDetailsLink) {
                console.log('Clicking Add More Details...');
                await addDetailsLink.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Take screenshot after expanding
            await page.screenshot({ 
                path: path.join(screenshotDir, '02-details-expanded.png'),
                fullPage: true 
            });

            // Clear and fill the form
            console.log('\nFilling form fields...');
            
            // Property Address
            const addressField = await page.$('#propertyAddress');
            await addressField.evaluate(el => el.value = '');
            await addressField.type('123 King Street West, Toronto, ON, M5V 3A8');
            console.log('✅ Address filled');

            // Purchase Price
            const priceField = await page.$('#purchasePrice');
            await priceField.evaluate(el => el.value = '');
            await priceField.type('750000');
            console.log('✅ Price filled');

            // Bedrooms
            await page.select('#bedrooms', '2');
            console.log('✅ Bedrooms selected');

            // Bathrooms  
            await page.select('#bathrooms', '2');
            console.log('✅ Bathrooms selected');

            // Check if optional fields are visible
            const sqftField = await page.$('#squareFootage');
            if (sqftField && await sqftField.isVisible()) {
                await sqftField.evaluate(el => el.value = '');
                await sqftField.type('850');
                console.log('✅ Square footage filled');
            }

            const propTypeField = await page.$('#propertyType');
            if (propTypeField && await propTypeField.isVisible()) {
                await page.select('#propertyType', 'condo');
                console.log('✅ Property type selected');
            }

            const taxField = await page.$('#propertyTaxes');
            if (taxField && await taxField.isVisible()) {
                await taxField.evaluate(el => el.value = '');
                await taxField.type('4500');
                console.log('✅ Property taxes filled');
            }

            const condoField = await page.$('#hoaCondoFees');
            if (condoField && await condoField.isVisible()) {
                await condoField.evaluate(el => el.value = '');
                await condoField.type('650');
                console.log('✅ Condo fees filled');
            }

            // Screenshot the filled form
            await page.screenshot({ 
                path: path.join(screenshotDir, '03-form-filled.png'),
                fullPage: true 
            });

            // Submit the form
            console.log('\nSubmitting form...');
            await page.click('#analyzeButton');

            // Wait for results
            console.log('Waiting for results...');
            let resultsLoaded = false;
            
            try {
                await page.waitForSelector('#analysisResults', { 
                    visible: true, 
                    timeout: 60000 
                });
                resultsLoaded = true;
                console.log('✅ Results loaded!');
            } catch (e) {
                console.log('⚠️ Results selector not found, checking for alternative indicators...');
                
                // Check if any tab content is visible
                const strContent = await page.$('#str-content');
                const tabContent = await page.$('.tab-content');
                
                if (strContent || tabContent) {
                    resultsLoaded = true;
                    console.log('✅ Found tab content - results loaded!');
                }
            }

            if (resultsLoaded) {
                // Take screenshots of results
                await new Promise(resolve => setTimeout(resolve, 2000)); // Let results fully render
                
                await page.screenshot({ 
                    path: path.join(screenshotDir, '04-results-str.png'),
                    fullPage: true 
                });

                // Try to click LTR tab
                console.log('\nTesting tab navigation...');
                const tabs = await page.$$('.tab-button');
                
                if (tabs.length > 0) {
                    console.log(`Found ${tabs.length} tabs`);
                    
                    // Click second tab (LTR)
                    if (tabs[1]) {
                        await tabs[1].click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await page.screenshot({ 
                            path: path.join(screenshotDir, '05-results-ltr.png'),
                            fullPage: true 
                        });
                        console.log('✅ LTR tab tested');
                    }

                    // Click third tab (Investment)
                    if (tabs[2]) {
                        await tabs[2].click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await page.screenshot({ 
                            path: path.join(screenshotDir, '06-results-investment.png'),
                            fullPage: true 
                        });
                        console.log('✅ Investment tab tested');
                    }
                }

                console.log('\n🎉 Test completed successfully!');
            } else {
                console.error('❌ Results failed to load');
                await page.screenshot({ 
                    path: path.join(screenshotDir, 'error-no-results.png'),
                    fullPage: true 
                });
            }

        } else {
            console.error('❌ Form not found on page');
            
            // Get page content for debugging
            const bodyText = await page.$eval('body', el => el.innerText);
            console.log('\nPage content:', bodyText.substring(0, 500) + '...');
        }

        // Final summary
        console.log(`\n📸 Screenshots saved to: ${screenshotDir}`);
        
        // Keep browser open for 5 seconds to observe
        console.log('\nKeeping browser open for observation...');
        await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
        if (page) {
            await page.screenshot({ 
                path: path.join(screenshotDir, 'error-screenshot.png'),
                fullPage: true 
            });
        }
    } finally {
        await browser.close();
        console.log('\n✅ Browser closed');
    }
}

// Run the test
console.log('🚀 Starting manual browser test...\n');
runManualBrowserTest();