const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const TEST_URL = 'https://starter-pack-e2efjeqlh-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'auth-bypass-deployment', new Date().toISOString().split('T')[0]);

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

async function waitAndLog(page, ms, message) {
    console.log(`⏳ ${message} (${ms}ms)...`);
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuthBypassDeployment() {
    console.log('🚀 Starting E2E Authentication Bypass Deployment Test');
    console.log(`📍 Testing URL: ${TEST_URL}`);
    console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}`);
    
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
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
            console.error('❌ Console Error:', text);
        } else if (type === 'warning') {
            console.warn('⚠️ Console Warning:', text);
        } else if (text.includes('E2E') || text.includes('test mode')) {
            console.log('🔍 Console:', text);
        }
    });
    
    // Set up request interception to log API calls
    page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('railway-api')) {
            console.log(`📡 API Request: ${request.method()} ${url}`);
        }
    });
    
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/') || url.includes('railway-api')) {
            console.log(`📨 API Response: ${response.status()} ${url}`);
        }
    });
    
    try {
        console.log('\n1️⃣ Waiting for deployment to stabilize...');
        await waitAndLog(page, 120000, 'Waiting 2 minutes for deployment');
        
        console.log('\n2️⃣ Navigating to the application...');
        await page.goto(TEST_URL, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        await takeScreenshot(page, '01-initial-load', true);
        
        // Check if E2E test mode is active
        const urlParams = await page.evaluate(() => {
            const params = new URLSearchParams(window.location.search);
            return {
                e2e_test_mode: params.get('e2e_test_mode'),
                full_url: window.location.href
            };
        });
        console.log('🔍 URL Parameters:', urlParams);
        
        // Wait for form to be ready
        await page.waitForSelector('#propertyForm', { timeout: 30000 });
        console.log('✅ Form loaded successfully');
        
        console.log('\n3️⃣ Filling the form with test data...');
        
        // Clear and fill each field
        const fields = [
            { selector: '#address', value: TEST_DATA.address, name: 'Address' },
            { selector: '#purchasePrice', value: TEST_DATA.price, name: 'Purchase Price' },
            { selector: '#bedrooms', value: TEST_DATA.bedrooms, name: 'Bedrooms' },
            { selector: '#bathrooms', value: TEST_DATA.bathrooms, name: 'Bathrooms' },
            { selector: '#squareFeet', value: TEST_DATA.squareFeet, name: 'Square Feet' },
            { selector: '#annualPropertyTax', value: TEST_DATA.propertyTaxes, name: 'Property Taxes' },
            { selector: '#monthlyCondoFees', value: TEST_DATA.condoFees, name: 'Condo Fees' }
        ];
        
        for (const field of fields) {
            await page.waitForSelector(field.selector);
            await page.click(field.selector, { clickCount: 3 });
            await page.type(field.selector, field.value);
            console.log(`✅ Filled ${field.name}: ${field.value}`);
        }
        
        // Select property type
        await page.select('#propertyType', TEST_DATA.propertyType);
        console.log(`✅ Selected property type: ${TEST_DATA.propertyType}`);
        
        await takeScreenshot(page, '02-form-filled', true);
        
        console.log('\n4️⃣ Submitting the form...');
        
        // Click submit button
        await page.click('#submitBtn');
        console.log('🔄 Form submitted, waiting for response...');
        
        // Wait for loading state
        await new Promise(resolve => setTimeout(resolve, 2000));
        await takeScreenshot(page, '03-loading-state');
        
        // Wait for either success or error
        let analysisSuccess = false;
        let errorMessage = null;
        
        try {
            // Wait for analysis results
            await page.waitForSelector('#analysisResults', { 
                visible: true, 
                timeout: 60000 
            });
            analysisSuccess = true;
            console.log('✅ Analysis results appeared!');
        } catch (error) {
            console.log('❌ Analysis results did not appear within timeout');
            
            // Check for error messages
            const errorElements = await page.$$('.error-message, .alert-danger, #error-message');
            if (errorElements.length > 0) {
                errorMessage = await page.evaluate((elements) => {
                    return elements.map(el => el.textContent.trim()).join(' | ');
                }, errorElements);
                console.log(`❌ Error message found: ${errorMessage}`);
            }
        }
        
        await takeScreenshot(page, '04-after-submission', true);
        
        if (analysisSuccess) {
            console.log('\n5️⃣ Testing different tabs...');
            
            // Test STR tab
            const strTab = await page.$('[data-tab="str"], button:has-text("Short-Term Rental")');
            if (strTab) {
                await strTab.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await takeScreenshot(page, '05-str-analysis', true);
                console.log('✅ STR tab tested');
            }
            
            // Test LTR tab
            const ltrTab = await page.$('[data-tab="ltr"], button:has-text("Long-Term Rental")');
            if (ltrTab) {
                await ltrTab.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await takeScreenshot(page, '06-ltr-analysis', true);
                console.log('✅ LTR tab tested');
            }
            
            // Test Investment Analysis tab
            const investmentTab = await page.$('[data-tab="investment"], button:has-text("Investment Analysis")');
            if (investmentTab) {
                await investmentTab.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                await takeScreenshot(page, '07-investment-analysis', true);
                console.log('✅ Investment Analysis tab tested');
            }
            
            // Check for key metrics
            const metrics = await page.evaluate(() => {
                const getTextContent = (selector) => {
                    const el = document.querySelector(selector);
                    return el ? el.textContent.trim() : null;
                };
                
                return {
                    strRevenue: getTextContent('[data-metric="str-revenue"]'),
                    strNOI: getTextContent('[data-metric="str-noi"]'),
                    ltrRevenue: getTextContent('[data-metric="ltr-revenue"]'),
                    ltrNOI: getTextContent('[data-metric="ltr-noi"]'),
                    capRate: getTextContent('[data-metric="cap-rate"]'),
                    cashOnCash: getTextContent('[data-metric="cash-on-cash"]')
                };
            });
            
            console.log('\n📊 Key Metrics Found:');
            Object.entries(metrics).forEach(([key, value]) => {
                if (value) {
                    console.log(`  ${key}: ${value}`);
                }
            });
        }
        
        // Generate test report
        const report = {
            timestamp: new Date().toISOString(),
            url: TEST_URL,
            testData: TEST_DATA,
            results: {
                formLoaded: true,
                formSubmitted: true,
                analysisReceived: analysisSuccess,
                errorMessage: errorMessage,
                authBypassWorking: analysisSuccess && !errorMessage
            },
            screenshotDirectory: SCREENSHOT_DIR
        };
        
        const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📋 Test Summary:');
        console.log('================');
        console.log(`✅ Form loaded: ${report.results.formLoaded}`);
        console.log(`✅ Form submitted: ${report.results.formSubmitted}`);
        console.log(`${report.results.analysisReceived ? '✅' : '❌'} Analysis received: ${report.results.analysisReceived}`);
        console.log(`${report.results.authBypassWorking ? '✅' : '❌'} Auth bypass working: ${report.results.authBypassWorking}`);
        if (errorMessage) {
            console.log(`❌ Error: ${errorMessage}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        await takeScreenshot(page, 'error-state', true);
    } finally {
        await browser.close();
        console.log('\n✅ Test completed. Screenshots saved to:', SCREENSHOT_DIR);
    }
}

// Run the test
testAuthBypassDeployment().catch(console.error);