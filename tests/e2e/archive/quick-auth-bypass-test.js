const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TEST_URL = 'https://starter-pack-e2efjeqlh-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'quick-auth-test', new Date().toISOString().split('T')[0]);

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
    console.log(`📸 Screenshot saved: ${name}.png`);
    return screenshotPath;
}

async function quickAuthBypassTest() {
    console.log('🚀 Starting Quick E2E Authentication Bypass Test');
    console.log(`📍 Testing URL: ${TEST_URL}`);
    
    await ensureDirectoryExists(SCREENSHOT_DIR);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: {
            width: 1366,
            height: 768
        }
    });
    
    const page = await browser.newPage();
    
    // Set up console logging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('E2E') || text.includes('test mode')) {
            console.log('🔍 Console:', text);
        }
    });
    
    // Set up API logging
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/')) {
            console.log(`📨 API Response: ${response.status()} ${url}`);
        }
    });
    
    try {
        console.log('\n1️⃣ Navigating to application...');
        await page.goto(TEST_URL, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        await takeScreenshot(page, '01-loaded', true);
        
        // Check E2E mode is active
        const testEmail = await page.$eval('.user-email, #userEmail, .navbar-text', el => el.textContent);
        console.log(`✅ E2E Test Mode Active: ${testEmail}`);
        
        console.log('\n2️⃣ Expanding optional fields...');
        // Click "Add More Details" to expand all fields
        const expandButton = await page.$('button:has-text("Add More Details"), a:has-text("Add More Details"), [href="#"]:has-text("Add More Details")');
        if (expandButton) {
            await expandButton.click();
            console.log('✅ Clicked expand button');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n3️⃣ Filling form fields...');
        
        // Fill address
        await page.type('input[placeholder*="123 Main Street"]', TEST_DATA.address);
        console.log('✅ Filled address');
        
        // Fill purchase price
        const priceInput = await page.$('input[placeholder*="850000"]');
        if (priceInput) {
            await priceInput.click({ clickCount: 3 });
            await priceInput.type(TEST_DATA.price);
            console.log('✅ Filled price');
        }
        
        // Select bedrooms
        await page.select('select:has(option:has-text("3 Bedrooms"))', TEST_DATA.bedrooms);
        console.log('✅ Selected bedrooms');
        
        // Select bathrooms
        const bathroomSelect = await page.$$('select');
        if (bathroomSelect[1]) {
            await bathroomSelect[1].select(TEST_DATA.bathrooms);
            console.log('✅ Selected bathrooms');
        }
        
        await takeScreenshot(page, '02-basic-fields-filled');
        
        // Now fill optional fields if visible
        const sqftInput = await page.$('input[name="squareFeet"], input#squareFeet, input[placeholder*="square feet"]');
        if (sqftInput) {
            await sqftInput.type(TEST_DATA.squareFeet);
            console.log('✅ Filled square feet');
        }
        
        const propertyTypeSelect = await page.$('select#propertyType, select[name="propertyType"]');
        if (propertyTypeSelect) {
            await propertyTypeSelect.select(TEST_DATA.propertyType);
            console.log('✅ Selected property type');
        }
        
        const taxInput = await page.$('input#annualPropertyTax, input[name="annualPropertyTax"], input[placeholder*="property tax"]');
        if (taxInput) {
            await taxInput.type(TEST_DATA.propertyTaxes);
            console.log('✅ Filled property taxes');
        }
        
        const condoInput = await page.$('input#monthlyCondoFees, input[name="monthlyCondoFees"], input[placeholder*="condo fee"]');
        if (condoInput) {
            await condoInput.type(TEST_DATA.condoFees);
            console.log('✅ Filled condo fees');
        }
        
        await takeScreenshot(page, '03-all-fields-filled', true);
        
        console.log('\n4️⃣ Submitting form...');
        await page.click('button:has-text("Analyze Property")');
        console.log('🔄 Form submitted');
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 3000));
        await takeScreenshot(page, '04-after-submit');
        
        // Check for results or errors
        let success = false;
        try {
            await page.waitForSelector('#analysisResults, .analysis-results, [class*="result"]', { 
                visible: true, 
                timeout: 30000 
            });
            success = true;
            console.log('✅ Analysis results received!');
            await takeScreenshot(page, '05-analysis-results', true);
            
            // Try to capture different tabs
            const tabs = await page.$$('[role="tab"], .tab-button, button[data-tab]');
            console.log(`📊 Found ${tabs.length} tabs`);
            
            for (let i = 0; i < Math.min(tabs.length, 3); i++) {
                await tabs[i].click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await takeScreenshot(page, `06-tab-${i+1}`, true);
            }
            
        } catch (error) {
            console.log('❌ No results appeared');
            const errorText = await page.evaluate(() => {
                const errorEl = document.querySelector('.error, .alert-danger, [class*="error"]');
                return errorEl ? errorEl.textContent : null;
            });
            if (errorText) {
                console.log(`❌ Error: ${errorText}`);
            }
        }
        
        console.log('\n📋 Test Summary:');
        console.log('================');
        console.log(`✅ E2E Mode Active: ${testEmail.includes('test@e2e.com')}`);
        console.log(`✅ Form Submitted: true`);
        console.log(`${success ? '✅' : '❌'} Analysis Received: ${success}`);
        console.log(`${success ? '✅' : '❌'} Auth Bypass Working: ${success}`);
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
        await takeScreenshot(page, 'error-state', true);
    } finally {
        await browser.close();
        console.log('\n✅ Screenshots saved to:', SCREENSHOT_DIR);
    }
}

// Run test
quickAuthBypassTest().catch(console.error);