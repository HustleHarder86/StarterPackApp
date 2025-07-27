const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runFinalE2ETest() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const screenshotDir = path.join(__dirname, 'screenshots', 'final-e2e', timestamp);
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
        
        // Clear cache
        console.log('🧹 Clearing browser cache...');
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCache');
        await client.send('Network.clearBrowserCookies');

        // Navigate to the page
        const url = 'https://starter-pack-cpl95dq4b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`🌐 Navigating to: ${url}\n`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // Wait for form to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take initial screenshot
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-initial-page.png'),
            fullPage: true 
        });
        console.log('✅ Page loaded successfully');

        // Look for the form by searching for inputs with the visible text/placeholders
        const addressInput = await page.$('input[placeholder*="123 Main Street"]');
        const priceInput = await page.$('input[placeholder*="50000"]');
        
        if (!addressInput || !priceInput) {
            throw new Error('Form inputs not found');
        }

        console.log('✅ Form elements found');

        // Clear and fill the address
        await addressInput.click({ clickCount: 3 });
        await page.keyboard.type('123 King Street West, Toronto, ON, M5V 3A8');
        console.log('✅ Address entered');

        // Clear and fill the price
        await priceInput.click({ clickCount: 3 });
        await page.keyboard.type('750000');
        console.log('✅ Price entered');

        // Find and select bedrooms dropdown by looking for select after "Bedrooms" text
        const bedroomsSelect = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const bedroomLabel = labels.find(l => l.textContent.includes('Bedrooms'));
            if (bedroomLabel) {
                return bedroomLabel.parentElement.querySelector('select') || 
                       bedroomLabel.nextElementSibling;
            }
            return null;
        });

        if (bedroomsSelect && bedroomsSelect.asElement()) {
            await bedroomsSelect.asElement().select('2');
            console.log('✅ Bedrooms selected: 2');
        }

        // Find and select bathrooms dropdown
        const bathroomsSelect = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const bathroomLabel = labels.find(l => l.textContent.includes('Bathrooms'));
            if (bathroomLabel) {
                return bathroomLabel.parentElement.querySelector('select') || 
                       bathroomLabel.nextElementSibling;
            }
            return null;
        });

        if (bathroomsSelect && bathroomsSelect.asElement()) {
            await bathroomsSelect.asElement().select('2');
            console.log('✅ Bathrooms selected: 2');
        }

        // Click "Add More Details" link
        const addDetailsLink = await page.$('a[onclick*="toggleOptionalFields"]');
        if (addDetailsLink) {
            await addDetailsLink.click();
            console.log('✅ Clicked Add More Details');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Take screenshot after expanding
        await page.screenshot({ 
            path: path.join(screenshotDir, '02-expanded-form.png'),
            fullPage: true 
        });

        // Fill optional fields if visible
        const sqftInput = await page.$('input[placeholder*="square feet"]');
        if (sqftInput && await sqftInput.isVisible()) {
            await sqftInput.type('850');
            console.log('✅ Square footage entered: 850');
        }

        // Property type dropdown
        const propTypeSelect = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const propTypeLabel = labels.find(l => l.textContent.includes('Property Type'));
            if (propTypeLabel) {
                return propTypeLabel.parentElement.querySelector('select') || 
                       propTypeLabel.nextElementSibling;
            }
            return null;
        });

        if (propTypeSelect && propTypeSelect.asElement()) {
            await propTypeSelect.asElement().select('condo');
            console.log('✅ Property type selected: condo');
        }

        // Property taxes
        const taxInput = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const taxLabel = labels.find(l => l.textContent.includes('Property Taxes'));
            if (taxLabel) {
                return taxLabel.parentElement.querySelector('input') || 
                       taxLabel.nextElementSibling;
            }
            return null;
        });

        if (taxInput && taxInput.asElement()) {
            await taxInput.asElement().type('4500');
            console.log('✅ Property taxes entered: 4500');
        }

        // Condo fees
        const condoInput = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const condoLabel = labels.find(l => l.textContent.includes('HOA/Condo Fees'));
            if (condoLabel) {
                return condoLabel.parentElement.querySelector('input') || 
                       condoLabel.nextElementSibling;
            }
            return null;
        });

        if (condoInput && condoInput.asElement()) {
            await condoInput.asElement().type('650');
            console.log('✅ Condo fees entered: 650');
        }

        // Take screenshot of filled form
        await page.screenshot({ 
            path: path.join(screenshotDir, '03-filled-form.png'),
            fullPage: true 
        });

        // Find and click the Analyze button
        console.log('\n🚀 Submitting form...');
        const analyzeButton = await page.$('button.bg-blue-600');
        if (!analyzeButton) {
            throw new Error('Analyze button not found');
        }

        await analyzeButton.click();

        // Wait for results
        console.log('⏳ Waiting for analysis results...');
        
        // Wait for either results container or a specific result element
        try {
            await page.waitForFunction(
                () => {
                    const results = document.querySelector('#analysisResults');
                    const tabContent = document.querySelector('.tab-content');
                    const strContent = document.querySelector('#str-content');
                    return results || tabContent || strContent;
                },
                { timeout: 60000 }
            );
            console.log('✅ Results loaded!');
        } catch (error) {
            console.error('❌ Results timeout');
            await page.screenshot({ 
                path: path.join(screenshotDir, 'error-timeout.png'),
                fullPage: true 
            });
            throw error;
        }

        // Wait a bit for results to fully render
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take screenshot of results
        await page.screenshot({ 
            path: path.join(screenshotDir, '04-str-results.png'),
            fullPage: true 
        });

        // Test tab navigation
        console.log('\n📑 Testing tab navigation...');
        
        // Find and click LTR tab
        const tabs = await page.$$('button.tab-button');
        if (tabs.length >= 2) {
            await tabs[1].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.screenshot({ 
                path: path.join(screenshotDir, '05-ltr-results.png'),
                fullPage: true 
            });
            console.log('✅ LTR tab tested');
        }

        // Click Investment tab
        if (tabs.length >= 3) {
            await tabs[2].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.screenshot({ 
                path: path.join(screenshotDir, '06-investment-results.png'),
                fullPage: true 
            });
            console.log('✅ Investment tab tested');
        }

        // Check for errors
        const errors = await page.$$('.error, .text-red-500');
        if (errors.length > 0) {
            console.warn(`⚠️ Found ${errors.length} error indicators`);
        }

        // Generate report
        const report = {
            success: true,
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
                formFound: true,
                formFilled: true,
                resultsLoaded: true,
                tabsTested: tabs.length,
                errorsFound: errors.length
            }
        };

        await fs.writeFile(
            path.join(screenshotDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n🎉 E2E Test completed successfully!');
        console.log(`📸 Screenshots saved to: ${screenshotDir}`);

        // Keep browser open briefly
        await new Promise(resolve => setTimeout(resolve, 3000));

        return report;

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (page) {
            await page.screenshot({ 
                path: path.join(screenshotDir, 'error-screenshot.png'),
                fullPage: true 
            });
        }
        throw error;
    } finally {
        await browser.close();
        console.log('\n✅ Browser closed');
    }
}

// Run the test
console.log('🚀 Starting Final E2E Test...\n');
runFinalE2ETest()
    .then(report => {
        console.log('\n📊 Final Test Summary:');
        console.log(`✅ Success: ${report.success}`);
        console.log(`✅ Form filled and submitted`);
        console.log(`✅ Results loaded successfully`);
        console.log(`✅ ${report.results.tabsTested} tabs tested`);
        console.log(`⚠️ Errors found: ${report.results.errorsFound}`);
    })
    .catch(error => {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    });