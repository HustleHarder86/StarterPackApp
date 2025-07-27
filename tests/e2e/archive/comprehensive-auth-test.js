const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const TEST_URL = 'https://starter-pack-e2efjeqlh-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'comprehensive-auth', new Date().toISOString().split('T')[0]);

const TEST_DATA = {
    address: '123 King Street West, Toronto, ON, M5V 3A8',
    price: '750000',
    bedrooms: '2',
    bathrooms: '2',
    squareFeet: '850',
    propertyType: 'condo',
    propertyTaxes: '4500',
    condoFees: '650'
};

async function comprehensiveAuthTest() {
    console.log('🚀 Comprehensive E2E Authentication Bypass Test');
    console.log(`📍 Testing: ${TEST_URL}`);
    console.log(`📸 Screenshots: ${SCREENSHOT_DIR}\n`);
    
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1366, height: 768 }
    });
    
    const page = await browser.newPage();
    
    // Monitor console and network
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('E2E') || text.includes('test') || text.includes('error')) {
            console.log(`🔍 Console: ${text}`);
        }
    });
    
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/') && !url.includes('config')) {
            console.log(`📡 API Response: ${response.status()} - ${url}`);
        }
    });
    
    const screenshot = async (name) => {
        const path = `${SCREENSHOT_DIR}/${name}.png`;
        await page.screenshot({ path, fullPage: true });
        console.log(`📸 Saved: ${name}.png`);
    };
    
    try {
        // 1. Navigate to page
        console.log('1️⃣ Loading application...');
        await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await screenshot('01-loaded');
        
        // Verify E2E mode
        const pageText = await page.evaluate(() => document.body.textContent);
        const e2eModeActive = pageText.includes('test@e2e.com');
        console.log(`✅ E2E Test Mode: ${e2eModeActive ? 'ACTIVE' : 'INACTIVE'}`);
        
        if (!e2eModeActive) {
            throw new Error('E2E test mode not active!');
        }
        
        // 2. Fill basic form fields
        console.log('\n2️⃣ Filling form fields...');
        
        // Address
        await page.click('input[placeholder*="123 Main Street"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.type('input[placeholder*="123 Main Street"]', TEST_DATA.address);
        console.log('✅ Address filled');
        
        // Price
        await page.click('input[placeholder*="850000"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.type('input[placeholder*="850000"]', TEST_DATA.price);
        console.log('✅ Price filled');
        
        // Bedrooms
        await page.select('select:nth-of-type(1)', TEST_DATA.bedrooms);
        console.log('✅ Bedrooms selected');
        
        // Bathrooms
        await page.select('select:nth-of-type(2)', TEST_DATA.bathrooms);
        console.log('✅ Bathrooms selected');
        
        await screenshot('02-basic-filled');
        
        // 3. Expand and fill optional fields
        console.log('\n3️⃣ Expanding optional fields...');
        
        // Click the expand link
        await page.evaluate(() => {
            const link = document.querySelector('a[href="#"]');
            if (link && link.textContent.includes('Add More Details')) {
                link.click();
            }
        });
        
        await page.waitForTimeout(1000);
        console.log('✅ Optional fields expanded');
        
        // Fill optional fields
        console.log('\n4️⃣ Filling optional fields...');
        
        await page.type('#squareFeet', TEST_DATA.squareFeet);
        console.log('✅ Square feet filled');
        
        await page.select('#propertyType', TEST_DATA.propertyType);
        console.log('✅ Property type selected');
        
        await page.type('#annualPropertyTax', TEST_DATA.propertyTaxes);
        console.log('✅ Property taxes filled');
        
        await page.type('#monthlyCondoFees', TEST_DATA.condoFees);
        console.log('✅ Condo fees filled');
        
        await screenshot('03-all-filled');
        
        // 4. Submit form
        console.log('\n5️⃣ Submitting form...');
        
        // Click the submit button
        await page.evaluate(() => {
            const button = document.querySelector('button[type="submit"], button.btn-primary');
            if (button && button.textContent.includes('Analyze Property')) {
                button.click();
            }
        });
        
        console.log('⏳ Form submitted, waiting for response...');
        
        // Wait a moment for loading state
        await page.waitForTimeout(2000);
        await screenshot('04-loading');
        
        // 5. Wait for and verify results
        let analysisSuccess = false;
        let errorMessage = null;
        
        try {
            // Wait for results with longer timeout
            await page.waitForSelector('#analysisResults', { 
                visible: true, 
                timeout: 60000 
            });
            
            analysisSuccess = true;
            console.log('\n✅ ANALYSIS RESULTS RECEIVED!');
            await screenshot('05-results');
            
            // 6. Test different tabs
            console.log('\n6️⃣ Testing result tabs...');
            
            // Test STR tab
            const strTab = await page.$('button[data-tab="str"]');
            if (strTab) {
                await strTab.click();
                await page.waitForTimeout(1000);
                await screenshot('06-str-analysis');
                console.log('✅ STR Analysis tab');
            }
            
            // Test LTR tab
            const ltrTab = await page.$('button[data-tab="ltr"]');
            if (ltrTab) {
                await ltrTab.click();
                await page.waitForTimeout(1000);
                await screenshot('07-ltr-analysis');
                console.log('✅ LTR Analysis tab');
            }
            
            // Test Investment tab
            const investmentTab = await page.$('button[data-tab="investment"]');
            if (investmentTab) {
                await investmentTab.click();
                await page.waitForTimeout(1000);
                await screenshot('08-investment-analysis');
                console.log('✅ Investment Analysis tab');
            }
            
            // Extract some key metrics
            const metrics = await page.evaluate(() => {
                const results = {};
                
                // Try to find metric values
                const metricElements = document.querySelectorAll('.metric-value, .value, [class*="metric"]');
                metricElements.forEach(el => {
                    const label = el.previousElementSibling?.textContent || 
                                 el.parentElement?.querySelector('.label, .metric-label')?.textContent || '';
                    if (label && el.textContent) {
                        results[label.trim()] = el.textContent.trim();
                    }
                });
                
                return results;
            });
            
            if (Object.keys(metrics).length > 0) {
                console.log('\n📊 Sample Metrics Found:');
                Object.entries(metrics).slice(0, 5).forEach(([key, value]) => {
                    console.log(`  ${key}: ${value}`);
                });
            }
            
        } catch (error) {
            console.log('\n❌ Analysis results did not appear');
            
            // Check for error messages
            const errors = await page.evaluate(() => {
                const errorElements = document.querySelectorAll('.error, .alert-danger, [class*="error"]');
                return Array.from(errorElements).map(el => el.textContent.trim());
            });
            
            if (errors.length > 0) {
                errorMessage = errors.join(' | ');
                console.log(`❌ Error message: ${errorMessage}`);
            }
            
            await screenshot('05-error-state');
        }
        
        // 7. Final summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ E2E Mode Active: ${e2eModeActive}`);
        console.log(`✅ Form Filled: Yes`);
        console.log(`✅ Form Submitted: Yes`);
        console.log(`${analysisSuccess ? '✅' : '❌'} Analysis Received: ${analysisSuccess ? 'Yes' : 'No'}`);
        console.log(`${analysisSuccess ? '✅' : '❌'} Auth Bypass Working: ${analysisSuccess ? 'Yes' : 'No'}`);
        
        if (analysisSuccess) {
            console.log('\n🎉 SUCCESS! The E2E authentication bypass is working correctly!');
            console.log('The API accepted the test mode and returned analysis results.');
        } else {
            console.log('\n❌ The authentication bypass did not produce analysis results.');
            if (errorMessage) {
                console.log(`Error details: ${errorMessage}`);
            }
        }
        
        // Save test report
        const report = {
            timestamp: new Date().toISOString(),
            url: TEST_URL,
            e2eModeActive,
            formSubmitted: true,
            analysisReceived: analysisSuccess,
            authBypassWorking: analysisSuccess,
            errorMessage,
            screenshotCount: await fs.readdir(SCREENSHOT_DIR).then(files => files.length)
        };
        
        await fs.writeFile(
            path.join(SCREENSHOT_DIR, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await screenshot('critical-error');
    } finally {
        await browser.close();
        console.log(`\n📁 All screenshots and report saved to:\n${SCREENSHOT_DIR}`);
    }
}

// Run the test
comprehensiveAuthTest().catch(console.error);