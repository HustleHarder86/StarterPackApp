const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const TEST_URL = 'https://starter-pack-e2efjeqlh-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'visual-auth', new Date().toISOString().split('T')[0]);

async function visualAuthTest() {
    console.log('🚀 Visual E2E Authentication Test');
    console.log(`📍 URL: ${TEST_URL}\n`);
    
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1366, height: 768 }
    });
    
    const page = await browser.newPage();
    
    // Log console messages
    page.on('console', msg => console.log('🔍', msg.text()));
    
    // Log API responses
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/')) {
            console.log(`📡 API: ${response.status()} ${url}`);
        }
    });
    
    try {
        // 1. Load page
        console.log('1️⃣ Loading page...');
        await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: `${SCREENSHOT_DIR}/01-loaded.png`, fullPage: true });
        
        // Check if test mode is active
        const pageContent = await page.content();
        console.log(`✅ E2E Mode: ${pageContent.includes('test@e2e.com') ? 'ACTIVE' : 'NOT ACTIVE'}`);
        
        // 2. Fill form using generic selectors
        console.log('\n2️⃣ Filling form...');
        
        // Fill first text input (address)
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="text"]');
            if (inputs[0]) {
                inputs[0].value = '123 King Street West, Toronto, ON, M5V 3A8';
            }
        });
        
        // Fill price input
        await page.evaluate(() => {
            const priceInput = document.querySelector('input[placeholder*="50000"]');
            if (priceInput) {
                priceInput.value = '750000';
            }
        });
        
        // Select bedrooms and bathrooms
        await page.evaluate(() => {
            const selects = document.querySelectorAll('select');
            if (selects[0]) selects[0].value = '2';
            if (selects[1]) selects[1].value = '2';
        });
        
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-basic-filled.png`, fullPage: true });
        
        // 3. Expand optional fields
        console.log('3️⃣ Expanding optional fields...');
        await page.evaluate(() => {
            const links = document.querySelectorAll('a');
            for (const link of links) {
                if (link.textContent.includes('Add More Details')) {
                    link.click();
                    break;
                }
            }
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Fill optional fields
        await page.evaluate(() => {
            const sqft = document.querySelector('#squareFeet');
            if (sqft) sqft.value = '850';
            
            const propType = document.querySelector('#propertyType');
            if (propType) propType.value = 'condo';
            
            const tax = document.querySelector('#annualPropertyTax');
            if (tax) tax.value = '4500';
            
            const condo = document.querySelector('#monthlyCondoFees');
            if (condo) condo.value = '650';
        });
        
        await page.screenshot({ path: `${SCREENSHOT_DIR}/03-all-filled.png`, fullPage: true });
        
        // 4. Submit form
        console.log('\n4️⃣ Submitting form...');
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.textContent.includes('Analyze Property')) {
                    btn.click();
                    break;
                }
            }
        });
        
        console.log('⏳ Waiting for response...');
        
        // Take screenshots at intervals
        for (let i = 1; i <= 6; i++) {
            await new Promise(r => setTimeout(r, 5000));
            await page.screenshot({ 
                path: `${SCREENSHOT_DIR}/04-waiting-${i * 5}s.png`, 
                fullPage: true 
            });
            console.log(`📸 Screenshot at ${i * 5} seconds`);
            
            // Check if results appeared
            const hasResults = await page.evaluate(() => {
                return document.querySelector('#analysisResults') !== null ||
                       document.querySelector('.analysis-results') !== null ||
                       document.querySelector('[class*="result"]') !== null;
            });
            
            if (hasResults) {
                console.log('\n✅ RESULTS APPEARED!');
                await page.screenshot({ 
                    path: `${SCREENSHOT_DIR}/05-results.png`, 
                    fullPage: true 
                });
                
                // Try clicking tabs
                await page.evaluate(() => {
                    const tabs = document.querySelectorAll('button[data-tab]');
                    tabs.forEach((tab, index) => {
                        setTimeout(() => tab.click(), index * 1000);
                    });
                });
                
                await new Promise(r => setTimeout(r, 3000));
                await page.screenshot({ 
                    path: `${SCREENSHOT_DIR}/06-all-tabs.png`, 
                    fullPage: true 
                });
                
                console.log('\n🎉 SUCCESS! Auth bypass is working!');
                break;
            }
            
            // Check for errors
            const hasError = await page.evaluate(() => {
                return document.querySelector('.alert-danger, .error-message, [class*="error"]') !== null;
            });
            
            if (hasError) {
                console.log('\n❌ Error detected');
                const errorText = await page.evaluate(() => {
                    const error = document.querySelector('.alert-danger, .error-message, [class*="error"]');
                    return error ? error.textContent : 'Unknown error';
                });
                console.log(`Error: ${errorText}`);
                break;
            }
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png`, fullPage: true });
    } finally {
        await browser.close();
        console.log(`\n📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
    }
}

visualAuthTest().catch(console.error);