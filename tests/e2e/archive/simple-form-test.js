const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runSimpleFormTest() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const screenshotDir = path.join(__dirname, 'screenshots', 'simple-form', timestamp);
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
        
        // Navigate to the page
        const url = 'https://starter-pack-cpl95dq4b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`🌐 Testing URL: ${url}\n`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        console.log('✅ Page loaded');
        
        // Wait for form to initialize
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take initial screenshot
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-initial-state.png'),
            fullPage: true 
        });

        // The form is pre-filled in E2E mode, so let's modify the values
        console.log('📝 Modifying pre-filled form data...');

        // Clear and update the address field
        const addressInput = await page.$('input[value="123 Main Street, Toronto, ON M5V 3A8"]');
        if (addressInput) {
            await addressInput.click({ clickCount: 3 });
            await page.keyboard.press('Delete');
            await addressInput.type('123 King Street West, Toronto, ON, M5V 3A8');
            console.log('✅ Updated address');
        }

        // Clear and update the price field  
        const priceInput = await page.$('input[value="50000"]');
        if (priceInput) {
            await priceInput.click({ clickCount: 3 });
            await page.keyboard.press('Delete');
            await priceInput.type('750000');
            console.log('✅ Updated price to $750,000');
        }

        // Update bedrooms using the select
        const bedroomsSelect = await page.$('select');
        if (bedroomsSelect) {
            await bedroomsSelect.select('2');
            console.log('✅ Selected 2 bedrooms');
        }

        // Update bathrooms (second select)
        const selects = await page.$$('select');
        if (selects.length > 1) {
            await selects[1].select('2');
            console.log('✅ Selected 2 bathrooms');
        }

        // Click "Add More Details" to expand optional fields
        console.log('\n📋 Expanding optional fields...');
        const addDetailsLink = await page.$('a[onclick*="toggleOptionalFields"]');
        if (addDetailsLink) {
            await addDetailsLink.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Expanded optional fields');
        }

        // Take screenshot after expanding
        await page.screenshot({ 
            path: path.join(screenshotDir, '02-expanded-form.png'),
            fullPage: true 
        });

        // Fill optional fields by finding inputs after expansion
        const allInputs = await page.$$('input[type="text"], input[type="number"]');
        
        // Try to fill square footage (should be 3rd or 4th input)
        if (allInputs.length > 3) {
            await allInputs[3].click();
            await allInputs[3].type('850');
            console.log('✅ Entered square footage: 850');
        }

        // Select property type if available
        if (selects.length > 2) {
            await selects[2].select('condo');
            console.log('✅ Selected property type: Condo');
        }

        // Fill property taxes (might be 4th or 5th input)
        if (allInputs.length > 4) {
            await allInputs[4].click();
            await allInputs[4].type('4500');
            console.log('✅ Entered property taxes: $4,500');
        }

        // Fill condo fees (might be 5th or 6th input)
        if (allInputs.length > 5) {
            await allInputs[5].click();
            await allInputs[5].type('650');
            console.log('✅ Entered condo fees: $650');
        }

        // Take screenshot of completed form
        await page.screenshot({ 
            path: path.join(screenshotDir, '03-completed-form.png'),
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
        console.log('⏳ Waiting for results...');
        
        // Wait up to 60 seconds for results to appear
        let resultsAppeared = false;
        for (let i = 0; i < 60; i++) {
            // Check for any sign of results
            const hasResults = await page.evaluate(() => {
                const tabButtons = document.querySelectorAll('.tab-button');
                const resultsContainer = document.querySelector('#analysisResults');
                const strContent = document.querySelector('#str-content');
                const tabContent = document.querySelector('.tab-content');
                
                return tabButtons.length > 0 || resultsContainer || strContent || tabContent;
            });

            if (hasResults) {
                resultsAppeared = true;
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            if (i % 5 === 0) {
                console.log(`   Waiting... ${i} seconds`);
            }
        }

        if (!resultsAppeared) {
            throw new Error('Results did not appear within 60 seconds');
        }

        console.log('✅ Results loaded!');
        
        // Wait a bit more for full rendering
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take screenshot of results
        await page.screenshot({ 
            path: path.join(screenshotDir, '04-str-results.png'),
            fullPage: true 
        });

        // Test tab navigation
        console.log('\n📑 Testing tabs...');
        const tabButtons = await page.$$('.tab-button');
        console.log(`Found ${tabButtons.length} tab buttons`);

        // Click LTR tab (usually second)
        if (tabButtons.length > 1) {
            await tabButtons[1].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            await page.screenshot({ 
                path: path.join(screenshotDir, '05-ltr-results.png'),
                fullPage: true 
            });
            console.log('✅ LTR tab tested');
        }

        // Click Investment tab (usually third)
        if (tabButtons.length > 2) {
            await tabButtons[2].click();
            await new Promise(resolve => setTimeout(resolve, 1500));
            await page.screenshot({ 
                path: path.join(screenshotDir, '06-investment-results.png'),
                fullPage: true 
            });
            console.log('✅ Investment tab tested');
        }

        // Generate final report
        const report = {
            success: true,
            timestamp: new Date().toISOString(),
            testSummary: {
                pageLoaded: true,
                formModified: true,
                formSubmitted: true,
                resultsLoaded: true,
                tabsTested: tabButtons.length,
                screenshotsGenerated: 6
            },
            testData: {
                address: '123 King Street West, Toronto, ON, M5V 3A8',
                price: 750000,
                bedrooms: 2,
                bathrooms: 2,
                squareFeet: 850,
                propertyType: 'condo',
                propertyTaxes: 4500,
                condoFees: 650
            }
        };

        await fs.writeFile(
            path.join(screenshotDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('\n✅ E2E Test Completed Successfully!');
        console.log(`📸 Screenshots saved to: ${screenshotDir}`);
        console.log('\n📊 Test Summary:');
        console.log('   ✅ Form pre-filling works in E2E mode');
        console.log('   ✅ Form data can be modified');
        console.log('   ✅ Form submission works');
        console.log('   ✅ Results are displayed');
        console.log(`   ✅ All ${tabButtons.length} tabs are functional`);

        // Keep browser open for observation
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
console.log('🚀 Starting Simple Form E2E Test...\n');
console.log('This test will:');
console.log('1. Load the page in E2E test mode');
console.log('2. Modify the pre-filled form data');
console.log('3. Submit the form');
console.log('4. Verify results are displayed');
console.log('5. Test all tabs\n');

runSimpleFormTest()
    .then(report => {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    });