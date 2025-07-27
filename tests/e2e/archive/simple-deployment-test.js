const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const TEST_URL = 'https://starter-pack-e2efjeqlh-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'simple-test', new Date().toISOString().split('T')[0]);

async function simpleTest() {
    console.log('🚀 Simple E2E Test');
    console.log(`📍 URL: ${TEST_URL}\n`);
    
    // Create screenshot directory
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    try {
        // Navigate to page
        console.log('Loading page...');
        await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
        
        // Take initial screenshot
        await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, '01-initial.png'),
            fullPage: true 
        });
        console.log('✅ Page loaded');
        
        // Check what's on the page
        const pageContent = await page.evaluate(() => {
            return {
                title: document.title,
                h1Text: document.querySelector('h1')?.textContent,
                headerText: document.querySelector('header')?.textContent || document.querySelector('[class*="header"]')?.textContent,
                formExists: !!document.querySelector('form'),
                inputCount: document.querySelectorAll('input').length,
                buttonCount: document.querySelectorAll('button').length,
                e2eIndicator: document.body.textContent.includes('test@e2e.com')
            };
        });
        
        console.log('\n📋 Page Analysis:');
        console.log(JSON.stringify(pageContent, null, 2));
        
        // Try to fill the form
        console.log('\n📝 Attempting to fill form...');
        
        // Fill address
        const addressInput = await page.$('input[type="text"]:first-of-type, input[placeholder*="address" i], input[placeholder*="123 Main" i]');
        if (addressInput) {
            await addressInput.type('123 King Street West, Toronto, ON');
            console.log('✅ Address filled');
        }
        
        // Fill price
        const priceInput = await page.$('input[placeholder*="850000" i], input[placeholder*="price" i], input[type="number"]:first-of-type');
        if (priceInput) {
            await priceInput.click({ clickCount: 3 });
            await priceInput.type('750000');
            console.log('✅ Price filled');
        }
        
        // Select bedrooms (first select)
        const selects = await page.$$('select');
        if (selects[0]) {
            await selects[0].select('2');
            console.log('✅ Bedrooms selected');
        }
        
        // Select bathrooms (second select)
        if (selects[1]) {
            await selects[1].select('2');
            console.log('✅ Bathrooms selected');
        }
        
        await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, '02-form-partial.png'),
            fullPage: true 
        });
        
        // Click expand details
        const expandLink = await page.$('a[href="#"]');
        if (expandLink) {
            await expandLink.click();
            console.log('✅ Clicked expand');
            await new Promise(r => setTimeout(r, 1000));
            
            // Fill optional fields
            await page.type('#squareFeet', '850');
            await page.select('#propertyType', 'condo');
            await page.type('#annualPropertyTax', '4500');
            await page.type('#monthlyCondoFees', '650');
            console.log('✅ Optional fields filled');
        }
        
        await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, '03-form-complete.png'),
            fullPage: true 
        });
        
        // Submit form
        console.log('\n🚀 Submitting form...');
        const submitBtn = await page.$('button[type="submit"], button:has-text("Analyze")');
        if (submitBtn) {
            await submitBtn.click();
            console.log('✅ Form submitted');
            
            // Wait for response
            await new Promise(r => setTimeout(r, 5000));
            
            await page.screenshot({ 
                path: path.join(SCREENSHOT_DIR, '04-after-submit.png'),
                fullPage: true 
            });
            
            // Check for results
            const hasResults = await page.evaluate(() => {
                return document.querySelector('#analysisResults, .analysis-results, [id*="result" i]') !== null;
            });
            
            console.log(`\n${hasResults ? '✅' : '❌'} Analysis results: ${hasResults ? 'RECEIVED' : 'NOT FOUND'}`);
            
            if (hasResults) {
                // Try different tabs
                const tabs = await page.$$('button[data-tab], [role="tab"], .tab-button');
                for (let i = 0; i < Math.min(tabs.length, 3); i++) {
                    await tabs[i].click();
                    await new Promise(r => setTimeout(r, 1000));
                    await page.screenshot({ 
                        path: path.join(SCREENSHOT_DIR, `05-tab-${i+1}.png`),
                        fullPage: true 
                    });
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        await page.screenshot({ 
            path: path.join(SCREENSHOT_DIR, 'error.png'),
            fullPage: true 
        });
    } finally {
        await browser.close();
        console.log(`\n📁 Screenshots: ${SCREENSHOT_DIR}`);
    }
}

simpleTest().catch(console.error);