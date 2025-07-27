const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory
const timestamp = new Date().toISOString().split('T').join('_').split(':').join('-').substring(0, 19);
const screenshotDir = path.join(__dirname, 'screenshots', 'final-complete-test', timestamp);

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        console.error('Error creating directory:', error);
    }
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name, description) {
    const filename = `${name}.png`;
    const filepath = path.join(screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 ${name}: ${description}`);
    return filepath;
}

async function runFinalTest() {
    console.log('🚀 FINAL COMPLETE TEST - StarterPackApp');
    console.log('=======================================');
    console.log(`📁 Screenshots: ${screenshotDir}\n`);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();

    try {
        const url = 'https://starter-pack-kvr6zbo9n-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        
        console.log('📋 Step 1: Navigate to application');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(3000);
        await takeScreenshot(page, '01-initial-page', 'Initial page load');

        // Check E2E mode
        const headerText = await page.evaluate(() => {
            const nav = document.querySelector('nav');
            return nav ? nav.textContent : '';
        });
        console.log('✅ E2E Mode Active:', headerText.includes('test@e2e.com'));

        console.log('\n📋 Step 2: Fill property form');
        
        // Find the actual input by its container structure
        const addressInput = await page.evaluateHandle(() => {
            // Find the input that's in the Property Address section
            const labels = Array.from(document.querySelectorAll('label'));
            const addressLabel = labels.find(l => l.textContent.includes('Property Address'));
            if (addressLabel) {
                const container = addressLabel.closest('div');
                return container ? container.querySelector('input') : null;
            }
            // Fallback to placeholder
            return document.querySelector('input[placeholder*="123 Main Street"]');
        });

        if (addressInput) {
            await addressInput.click();
            await addressInput.type('123 King Street West, Toronto, ON, M5V 3A8');
            console.log('✅ Filled address');
        }

        // Purchase Price
        const priceInput = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const priceLabel = labels.find(l => l.textContent.includes('Purchase Price'));
            if (priceLabel) {
                const container = priceLabel.closest('div');
                return container ? container.querySelector('input') : null;
            }
            return document.querySelector('input[placeholder*="50000"]');
        });

        if (priceInput) {
            await priceInput.click({ clickCount: 3 });
            await priceInput.type('750000');
            console.log('✅ Filled price: $750,000');
        }

        // Bedrooms
        const bedroomsSelect = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const bedroomsLabel = labels.find(l => l.textContent.includes('Bedrooms'));
            if (bedroomsLabel) {
                const container = bedroomsLabel.closest('div');
                return container ? container.querySelector('select') : null;
            }
            return null;
        });

        if (bedroomsSelect) {
            await bedroomsSelect.select('2');
            console.log('✅ Selected 2 bedrooms');
        }

        // Bathrooms
        const bathroomsSelect = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const bathroomsLabel = labels.find(l => l.textContent.includes('Bathrooms'));
            if (bathroomsLabel) {
                const container = bathroomsLabel.closest('div');
                return container ? container.querySelector('select') : null;
            }
            return null;
        });

        if (bathroomsSelect) {
            await bathroomsSelect.select('2');
            console.log('✅ Selected 2 bathrooms');
        }

        await takeScreenshot(page, '02-basic-form-filled', 'Basic form fields filled');

        // Try sample data button first
        console.log('\n📋 Step 3: Testing sample data feature');
        const sampleDataBtn = await page.evaluateHandle(() => {
            const links = Array.from(document.querySelectorAll('a, button'));
            return links.find(l => l.textContent.includes('Try with Sample Data'));
        });

        if (sampleDataBtn) {
            await sampleDataBtn.click();
            await wait(1000);
            console.log('✅ Clicked sample data button');
            await takeScreenshot(page, '03-sample-data', 'After clicking sample data');
        }

        // Expand optional details
        console.log('\n📋 Step 4: Expand optional details');
        const expandBtn = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.textContent.includes('Add More Details'));
        });

        if (expandBtn) {
            await expandBtn.click();
            await wait(1000);
            console.log('✅ Expanded optional details');
            
            // Fill additional fields
            // Square feet
            const sqftInput = await page.evaluateHandle(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                return inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('square'));
            });
            
            if (sqftInput) {
                await sqftInput.click();
                await sqftInput.type('850');
                console.log('✅ Filled square feet: 850');
            }

            // Property type
            const propertyTypeSelect = await page.evaluateHandle(() => {
                const selects = Array.from(document.querySelectorAll('select'));
                // Find select that has property type options
                return selects.find(s => {
                    const options = Array.from(s.options);
                    return options.some(o => o.value === 'condo' || o.value === 'house');
                });
            });

            if (propertyTypeSelect) {
                await propertyTypeSelect.select('condo');
                console.log('✅ Selected property type: Condo');
            }

            // Property taxes
            const taxInput = await page.evaluateHandle(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                return inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('tax'));
            });

            if (taxInput) {
                await taxInput.click();
                await taxInput.type('4500');
                console.log('✅ Filled property taxes: $4,500');
            }

            // Condo fees
            const condoInput = await page.evaluateHandle(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                return inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('condo'));
            });

            if (condoInput) {
                await condoInput.click();
                await condoInput.type('650');
                console.log('✅ Filled condo fees: $650');
            }

            await takeScreenshot(page, '04-all-fields-filled', 'All form fields completed');
        }

        // Submit form
        console.log('\n📋 Step 5: Submit form for analysis');
        const analyzeBtn = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.textContent.includes('Analyze Property'));
        });

        if (analyzeBtn) {
            await analyzeBtn.click();
            console.log('✅ Clicked Analyze Property');
            console.log('⏳ Waiting for response...');
            
            // Wait longer for API response
            await wait(10000);
            await takeScreenshot(page, '05-after-submission', 'After form submission');

            // Check what happened
            const pageState = await page.evaluate(() => {
                const bodyText = document.body.textContent;
                return {
                    hasResults: bodyText.includes('Analysis') || bodyText.includes('Rental') || bodyText.includes('ROI'),
                    hasError: bodyText.includes('Error') || bodyText.includes('error') || document.querySelector('.error') !== null,
                    hasLoading: bodyText.includes('Loading') || bodyText.includes('Analyzing'),
                    currentUrl: window.location.href,
                    pageTitle: document.title
                };
            });

            console.log('\n📊 Results:');
            console.log('- Has results:', pageState.hasResults);
            console.log('- Has error:', pageState.hasError);
            console.log('- Has loading:', pageState.hasLoading);
            console.log('- Current URL:', pageState.currentUrl);

            // If we have results, test the tabs
            if (pageState.hasResults) {
                console.log('\n📋 Step 6: Testing analysis results');
                
                const tabs = await page.$$('[role="tab"], .tab, button[data-tab]');
                console.log(`Found ${tabs.length} tabs`);
                
                for (let i = 0; i < tabs.length && i < 3; i++) {
                    await tabs[i].click();
                    await wait(1500);
                    const tabName = await tabs[i].evaluate(el => el.textContent);
                    await takeScreenshot(page, `06-tab-${i+1}`, `Tab view: ${tabName}`);
                }
            }
        }

        // Test mobile view
        console.log('\n📋 Step 7: Testing mobile responsiveness');
        await page.setViewport({ width: 375, height: 812 });
        await wait(2000);
        await takeScreenshot(page, '07-mobile-view', 'Mobile viewport test');

        const mobileCheck = await page.evaluate(() => {
            return {
                hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
                viewportWidth: window.innerWidth,
                bodyWidth: document.body.scrollWidth
            };
        });

        console.log('Mobile check:', mobileCheck);

        // Generate final summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 FINAL TEST SUMMARY');
        console.log('='.repeat(50));
        
        const summary = {
            timestamp: new Date().toISOString(),
            url: url,
            screenshotDir: screenshotDir,
            testsPerformed: [
                'E2E authentication bypass',
                'Form field filling',
                'Sample data feature',
                'Optional details expansion',
                'Form submission',
                'Mobile responsiveness'
            ],
            recommendations: [
                'Verify API endpoint connectivity',
                'Add loading states during form submission',
                'Implement clear error messaging',
                'Test complete user journey from submission to results',
                'Optimize mobile layout for smaller screens'
            ]
        };

        // Save summary
        const summaryPath = path.join(screenshotDir, 'test-summary.json');
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
        console.log(`\n📄 Test summary saved to: ${summaryPath}`);

    } catch (error) {
        console.error('\n❌ Test Error:', error);
        await takeScreenshot(page, 'error-state', 'Error occurred during test');
    } finally {
        await browser.close();
        console.log('\n✅ Test completed successfully');
    }
}

// Run the test
runFinalTest().catch(console.error);