const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TEST_URL = 'https://starter-pack-e2efjeqlh-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'final-auth-test', new Date().toISOString().split('T')[0]);

// Test data
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

async function ensureDirectoryExists(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function takeScreenshot(page, name, fullPage = false) {
    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ 
        path: screenshotPath, 
        fullPage: fullPage,
        type: 'png'
    });
    console.log(`📸 Screenshot: ${name}.png`);
    return screenshotPath;
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log('🚀 E2E Authentication Bypass Test - Final Version');
    console.log(`📍 URL: ${TEST_URL}`);
    console.log(`📁 Screenshots: ${SCREENSHOT_DIR}\n`);
    
    await ensureDirectoryExists(SCREENSHOT_DIR);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1366, height: 768 }
    });
    
    const page = await browser.newPage();
    
    // Track console messages and API calls
    page.on('console', msg => {
        if (msg.text().includes('E2E') || msg.text().includes('test')) {
            console.log('🔍', msg.text());
        }
    });
    
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/') && !url.includes('config')) {
            console.log(`📡 API: ${response.status()} ${url.split('/').pop()}`);
        }
    });
    
    try {
        // 1. Load page
        console.log('1️⃣ Loading application...');
        await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
        await takeScreenshot(page, '01-loaded');
        
        // Verify E2E mode
        const headerText = await page.$eval('.navbar', el => el.textContent);
        console.log(`✅ E2E Mode: ${headerText.includes('test@e2e.com') ? 'ACTIVE' : 'INACTIVE'}`);
        
        // 2. Fill basic fields
        console.log('\n2️⃣ Filling form fields...');
        
        // Clear and fill address
        const addressInput = await page.$('input[placeholder*="123 Main Street"]');
        await addressInput.click({ clickCount: 3 });
        await addressInput.type(TEST_DATA.address);
        console.log('✅ Address filled');
        
        // Clear and fill price
        const priceInput = await page.$('input[placeholder*="850000"]');
        await priceInput.click({ clickCount: 3 });
        await priceInput.type(TEST_DATA.price);
        console.log('✅ Price filled');
        
        // Select bedrooms
        await page.select('select:first-of-type', TEST_DATA.bedrooms);
        console.log('✅ Bedrooms selected');
        
        // Select bathrooms
        await page.evaluate((bathrooms) => {
            const selects = document.querySelectorAll('select');
            if (selects[1]) selects[1].value = bathrooms;
        }, TEST_DATA.bathrooms);
        console.log('✅ Bathrooms selected');
        
        await takeScreenshot(page, '02-basic-filled');
        
        // 3. Expand optional fields
        console.log('\n3️⃣ Expanding optional fields...');
        await page.click('a[href="#"]:has-text("Add More Details")');
        await delay(1000);
        console.log('✅ Optional fields expanded');
        
        // 4. Fill optional fields
        console.log('\n4️⃣ Filling optional fields...');
        
        // Square feet
        await page.type('input#squareFeet', TEST_DATA.squareFeet);
        console.log('✅ Square feet filled');
        
        // Property type
        await page.select('select#propertyType', TEST_DATA.propertyType);
        console.log('✅ Property type selected');
        
        // Property taxes
        await page.type('input#annualPropertyTax', TEST_DATA.propertyTaxes);
        console.log('✅ Property taxes filled');
        
        // Condo fees
        await page.type('input#monthlyCondoFees', TEST_DATA.condoFees);
        console.log('✅ Condo fees filled');
        
        await takeScreenshot(page, '03-all-filled', true);
        
        // 5. Submit form
        console.log('\n5️⃣ Submitting form...');
        await page.click('button:has-text("Analyze Property")');
        console.log('⏳ Waiting for analysis...');
        
        // Wait for loading state
        await delay(2000);
        await takeScreenshot(page, '04-loading');
        
        // 6. Check for results
        let success = false;
        let errorMessage = null;
        
        try {
            // Wait for results container
            await page.waitForSelector('#analysisResults', { 
                visible: true, 
                timeout: 45000 
            });
            success = true;
            console.log('\n✅ ANALYSIS RESULTS RECEIVED!');
            await takeScreenshot(page, '05-results', true);
            
            // 7. Test tabs
            console.log('\n6️⃣ Testing result tabs...');
            
            // Find and click tabs
            const tabSelectors = [
                'button[data-tab="str"]',
                'button[data-tab="ltr"]',
                'button[data-tab="investment"]'
            ];
            
            const tabNames = ['STR Analysis', 'LTR Analysis', 'Investment Analysis'];
            
            for (let i = 0; i < tabSelectors.length; i++) {
                const tab = await page.$(tabSelectors[i]);
                if (tab) {
                    await tab.click();
                    await delay(1000);
                    await takeScreenshot(page, `06-${tabNames[i].toLowerCase().replace(/\s+/g, '-')}`, true);
                    console.log(`✅ ${tabNames[i]} tab captured`);
                }
            }
            
            // Extract key metrics
            const metrics = await page.evaluate(() => {
                const getText = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.textContent.trim() : 'Not found';
                };
                
                // Try various selectors for metrics
                return {
                    strRevenue: getText('.str-revenue, [data-metric="str-revenue"], .metric-value:has-text("Monthly Revenue")'),
                    strNOI: getText('.str-noi, [data-metric="str-noi"], .metric-value:has-text("Net Operating Income")'),
                    ltrRent: getText('.ltr-rent, [data-metric="ltr-rent"], .metric-value:has-text("Monthly Rent")'),
                    capRate: getText('.cap-rate, [data-metric="cap-rate"], .metric-value:has-text("Cap Rate")'),
                    cashOnCash: getText('.cash-on-cash, [data-metric="cash-on-cash"], .metric-value:has-text("Cash on Cash")')
                };
            });
            
            console.log('\n📊 Key Metrics:');
            Object.entries(metrics).forEach(([key, value]) => {
                if (value !== 'Not found') {
                    console.log(`  ${key}: ${value}`);
                }
            });
            
        } catch (error) {
            console.log('\n❌ No analysis results received');
            
            // Check for errors
            const errors = await page.$$eval('.error, .alert-danger, [class*="error"]', 
                elements => elements.map(el => el.textContent.trim())
            );
            
            if (errors.length > 0) {
                errorMessage = errors.join(' | ');
                console.log(`❌ Error: ${errorMessage}`);
            }
            
            await takeScreenshot(page, '05-error-state', true);
        }
        
        // 8. Final summary
        console.log('\n' + '='.repeat(50));
        console.log('📋 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ E2E Mode Active: ${headerText.includes('test@e2e.com')}`);
        console.log(`✅ Form Submitted: true`);
        console.log(`${success ? '✅' : '❌'} Analysis Received: ${success}`);
        console.log(`${success ? '✅' : '❌'} Auth Bypass Working: ${success}`);
        
        if (errorMessage) {
            console.log(`\n❌ Error Details: ${errorMessage}`);
        }
        
        if (success) {
            console.log('\n🎉 SUCCESS! The E2E authentication bypass is working correctly.');
            console.log('The API accepted the test mode authentication and returned analysis results.');
        } else {
            console.log('\n❌ FAILED! The authentication bypass did not work as expected.');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await takeScreenshot(page, 'critical-error', true);
    } finally {
        await browser.close();
        console.log('\n📁 All screenshots saved to:', SCREENSHOT_DIR);
    }
}

// Run the test
runTest().catch(console.error);