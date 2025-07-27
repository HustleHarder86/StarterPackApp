const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const screenshotDir = path.join(__dirname, 'screenshots', 'correct-parameter-test', timestamp);

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        console.error('Error creating directory:', error);
    }
}

async function takeScreenshot(page, name, description) {
    try {
        const filename = `${name}.png`;
        const filepath = path.join(screenshotDir, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`✅ Screenshot saved: ${name} - ${description}`);
        return filepath;
    } catch (error) {
        console.error(`❌ Failed to capture screenshot ${name}:`, error);
    }
}

async function waitAndClick(page, selector, description) {
    try {
        await page.waitForSelector(selector, { visible: true, timeout: 10000 });
        await page.click(selector);
        console.log(`✅ Clicked: ${description}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    } catch (error) {
        console.error(`❌ Failed to click ${description}:`, error);
        return false;
    }
}

async function testApp() {
    console.log('🚀 Starting Comprehensive E2E Test with CORRECT Parameter');
    console.log('📁 Screenshots will be saved to:', screenshotDir);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
    });

    let page;
    try {
        page = await browser.newPage();
        
        // Set up console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Console Error:', msg.text());
            }
        });

        // Navigate with CORRECT parameter
        const url = 'https://starter-pack-cf80kci6b-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        console.log(`\n📍 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 1. AUTHENTICATION CHECK
        console.log('\n=== 1. AUTHENTICATION CHECK ===');
        await takeScreenshot(page, '01-initial-load', 'Initial page load with e2e_test_mode=true');
        
        // Check if form is visible (authentication bypassed)
        const formVisible = await page.$('#propertyForm') !== null;
        console.log(`📋 Form visible: ${formVisible}`);
        
        if (!formVisible) {
            console.log('❌ Authentication NOT bypassed - form not visible');
            await takeScreenshot(page, '01a-auth-not-bypassed', 'Authentication still active');
            
            // Check for sign-in elements
            const signInButton = await page.$('[data-test="sign-in-button"]') || 
                                await page.$('button') && await page.evaluate(() => {
                                    const buttons = Array.from(document.querySelectorAll('button'));
                                    return buttons.find(b => b.textContent.includes('Sign In') || b.textContent.includes('Get Started'));
                                });
            if (signInButton) {
                console.log('🔐 Sign-in button found - authentication is still active');
            }
        } else {
            console.log('✅ Authentication bypassed - form is visible');
        }

        // 2. FILL PROPERTY FORM
        console.log('\n=== 2. FILLING PROPERTY FORM ===');
        
        if (formVisible) {
            // Fill each field
            await page.type('#address', '123 King Street West, Toronto, ON, M5V 3A8');
            console.log('✅ Filled address');
            
            await page.type('#purchasePrice', '750000');
            console.log('✅ Filled purchase price');
            
            await page.type('#bedrooms', '2');
            console.log('✅ Filled bedrooms');
            
            await page.type('#bathrooms', '2');
            console.log('✅ Filled bathrooms');
            
            await page.type('#squareFeet', '850');
            console.log('✅ Filled square feet');
            
            await page.select('#propertyType', 'condo');
            console.log('✅ Selected property type: Condo');
            
            await page.type('#propertyTaxes', '4500');
            console.log('✅ Filled property taxes');
            
            await page.type('#condoFees', '650');
            console.log('✅ Filled condo fees');
            
            await takeScreenshot(page, '02-form-filled', 'Property form filled with data');
            
            // 3. SUBMIT FORM
            console.log('\n=== 3. SUBMITTING FORM ===');
            const submitButton = await page.$('#analyzeButton, button[type="submit"], button:has-text("Analyze Property")');
            
            if (submitButton) {
                await submitButton.click();
                console.log('✅ Clicked submit button');
                
                // Wait for results
                await new Promise(resolve => setTimeout(resolve, 3000));
                await takeScreenshot(page, '03-after-submit', 'After form submission');
                
                // Check for results container
                const resultsVisible = await page.$('#resultsSection, #results, .results-container') !== null;
                if (resultsVisible) {
                    console.log('✅ Results section appeared');
                    
                    // 4. TEST ALL TABS
                    console.log('\n=== 4. TESTING ALL TABS ===');
                    
                    // STR Tab
                    const strTab = await page.$('[data-tab="str"], #strTab, button:has-text("Short-term Rental")');
                    if (strTab) {
                        await strTab.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await takeScreenshot(page, '04-str-tab', 'Short-term Rental Analysis Tab');
                        console.log('✅ Tested STR tab');
                        
                        // Test STR interactive elements
                        const strButtons = await page.$$('#strAnalysis button, #strAnalysis .interactive-element');
                        console.log(`Found ${strButtons.length} STR interactive elements`);
                    }
                    
                    // LTR Tab
                    const ltrTab = await page.$('[data-tab="ltr"], #ltrTab, button:has-text("Long-term Rental")');
                    if (ltrTab) {
                        await ltrTab.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await takeScreenshot(page, '05-ltr-tab', 'Long-term Rental Analysis Tab');
                        console.log('✅ Tested LTR tab');
                    }
                    
                    // Investment Analysis Tab
                    const investmentTab = await page.$('[data-tab="investment"], #investmentTab, button:has-text("Investment Analysis")');
                    if (investmentTab) {
                        await investmentTab.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await takeScreenshot(page, '06-investment-tab', 'Investment Analysis Tab');
                        console.log('✅ Tested Investment Analysis tab');
                        
                        // Check ROI calculations
                        const roiElement = await page.$('.roi-value, .roi-percentage, [data-roi]');
                        if (roiElement) {
                            const roiText = await page.evaluate(el => el.textContent, roiElement);
                            console.log(`📊 ROI Value: ${roiText}`);
                        }
                    }
                    
                    // 5. TEST INTERACTIVE ELEMENTS
                    console.log('\n=== 5. TESTING INTERACTIVE ELEMENTS ===');
                    
                    // Find all buttons and clickable elements
                    const buttons = await page.$$('button');
                    const filteredButtons = [];
                    for (const button of buttons) {
                        const type = await page.evaluate(el => el.type, button);
                        if (type !== 'submit') {
                            filteredButtons.push(button);
                        }
                    }
                    console.log(`Found ${filteredButtons.length} buttons to test`);
                    
                    for (let i = 0; i < Math.min(filteredButtons.length, 5); i++) {
                        try {
                            await filteredButtons[i].click();
                            await new Promise(resolve => setTimeout(resolve, 500));
                            await takeScreenshot(page, `07-button-${i}`, `After clicking button ${i}`);
                            
                            // Close any modals
                            const closeButton = await page.$('.modal-close') || await page.$('.close-button') || 
                                               await page.evaluate(() => {
                                                   const buttons = Array.from(document.querySelectorAll('button'));
                                                   return buttons.find(b => b.textContent === 'Close' || b.textContent === '×');
                                               });
                            if (closeButton && typeof closeButton.click === 'function') {
                                await closeButton.click();
                                await new Promise(resolve => setTimeout(resolve, 300));
                            }
                        } catch (error) {
                            console.log(`Could not click button ${i}`);
                        }
                    }
                    
                    // 6. TEST MOBILE RESPONSIVENESS
                    console.log('\n=== 6. TESTING MOBILE RESPONSIVENESS ===');
                    
                    // Test mobile viewport
                    await page.setViewport({ width: 375, height: 812 });
                    await page.waitForTimeout(1000);
                    await takeScreenshot(page, '08-mobile-results', 'Mobile view of results');
                    
                    // Test tablet viewport
                    await page.setViewport({ width: 768, height: 1024 });
                    await page.waitForTimeout(1000);
                    await takeScreenshot(page, '09-tablet-results', 'Tablet view of results');
                    
                } else {
                    console.log('❌ Results section did not appear');
                    await takeScreenshot(page, '03a-no-results', 'No results shown after submission');
                }
            } else {
                console.log('❌ Submit button not found');
            }
        }
        
        // Final summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`✅ Test completed`);
        console.log(`📁 Screenshots saved to: ${screenshotDir}`);
        
    } catch (error) {
        console.error('❌ Test error:', error);
        if (page) {
            await page.screenshot({ path: path.join(screenshotDir, 'error-state.png'), fullPage: true });
        }
    } finally {
        await browser.close();
    }
}

// Run the test
testApp().catch(console.error);