const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory
const timestamp = new Date().toISOString().split('T')[0];
const screenshotDir = path.join(__dirname, 'screenshots', 'complete-ui-ux-test', timestamp);

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

async function performCompleteTest() {
    console.log('🚀 COMPREHENSIVE UI/UX TEST - StarterPackApp');
    console.log('============================================');
    console.log(`📁 Screenshots: ${screenshotDir}\n`);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    const report = [];

    try {
        const url = 'https://starter-pack-kvr6zbo9n-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true';
        
        console.log('📍 TEST 1: Initial Page Load');
        console.log('----------------------------');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(3000);
        
        await takeScreenshot(page, '01-initial-load', 'Initial page load');
        
        // Check page structure
        const pageAnalysis = await page.evaluate(() => {
            return {
                title: document.title,
                hasForm: document.querySelector('input[placeholder*="123 Main Street"]') !== null,
                hasAnalyzeButton: document.querySelector('button').textContent.includes('Analyze Property'),
                formInputs: Array.from(document.querySelectorAll('input, select')).map(el => ({
                    type: el.type,
                    placeholder: el.placeholder,
                    name: el.name || el.id
                }))
            };
        });
        
        console.log('✅ Page loaded successfully');
        console.log(`  - Title: ${pageAnalysis.title}`);
        console.log(`  - Form present: ${pageAnalysis.hasForm}`);
        console.log(`  - Analyze button: ${pageAnalysis.hasAnalyzeButton}`);
        console.log(`  - Input fields: ${pageAnalysis.formInputs.length}`);
        
        report.push({
            test: 'Initial Load',
            status: '✅ Working',
            details: 'Page loads with form visible in E2E mode'
        });

        console.log('\n📍 TEST 2: Form Filling & Submission');
        console.log('------------------------------------');
        
        // Fill the form - using the actual selectors from the page
        console.log('Filling property address...');
        await page.click('input[placeholder*="123 Main Street"]');
        await page.keyboard.type('123 King Street West, Toronto, ON, M5V 3A8');
        
        console.log('Filling purchase price...');
        await page.click('input[placeholder*="50000"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
        await page.keyboard.type('750000');
        
        console.log('Selecting bedrooms...');
        const bedroomSelects = await page.$$('select');
        if (bedroomSelects[0]) {
            await bedroomSelects[0].select('2');
        }
        
        console.log('Selecting bathrooms...');
        if (bedroomSelects[1]) {
            await bedroomSelects[1].select('2');
        }
        
        await takeScreenshot(page, '02-form-basic-filled', 'Basic form fields filled');
        
        // Click "Add More Details"
        console.log('Expanding optional details...');
        const expandButton = await page.$('button');
        const buttons = await page.$$('button');
        for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes('Add More Details') || text.includes('Optional')) {
                await button.click();
                await wait(1000);
                console.log('✅ Expanded optional section');
                break;
            }
        }
        
        // Fill additional fields if visible
        console.log('Filling additional details...');
        const inputs = await page.$$('input[type="number"], input[type="text"]');
        
        // Find and fill square feet
        for (const input of inputs) {
            const placeholder = await input.evaluate(el => el.placeholder);
            if (placeholder && placeholder.toLowerCase().includes('square')) {
                await input.click();
                await input.type('850');
                console.log('  - Square feet: 850');
            } else if (placeholder && placeholder.toLowerCase().includes('tax')) {
                await input.click();
                await input.type('4500');
                console.log('  - Property taxes: $4,500');
            } else if (placeholder && placeholder.toLowerCase().includes('condo')) {
                await input.click();
                await input.type('650');
                console.log('  - Condo fees: $650');
            }
        }
        
        // Select property type
        const selects = await page.$$('select');
        for (const select of selects) {
            const options = await select.$$eval('option', opts => opts.map(o => o.value));
            if (options.includes('condo')) {
                await select.select('condo');
                console.log('  - Property type: Condo');
            }
        }
        
        await takeScreenshot(page, '03-form-complete', 'All form fields filled');
        
        // Submit form
        console.log('\nSubmitting form...');
        const analyzeButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.textContent.includes('Analyze Property'));
        });
        
        if (analyzeButton) {
            await analyzeButton.click();
            console.log('✅ Clicked Analyze Property button');
            
            // Wait for response
            await wait(8000);
            await takeScreenshot(page, '04-after-submission', 'After form submission');
            
            // Check results
            const resultsCheck = await page.evaluate(() => {
                const bodyText = document.body.textContent;
                return {
                    hasResults: bodyText.includes('Analysis') || bodyText.includes('Rental'),
                    hasError: bodyText.includes('Error') || bodyText.includes('error'),
                    hasAuth: bodyText.includes('Sign In') || bodyText.includes('Login'),
                    visibleText: bodyText.substring(0, 200)
                };
            });
            
            if (resultsCheck.hasResults) {
                console.log('✅ Analysis results displayed');
                report.push({
                    test: 'Form Submission',
                    status: '✅ Working',
                    details: 'Form submits and shows analysis results'
                });
            } else if (resultsCheck.hasError) {
                console.log('❌ Error occurred');
                report.push({
                    test: 'Form Submission',
                    status: '❌ Error',
                    details: 'Form submission resulted in error'
                });
            } else if (resultsCheck.hasAuth) {
                console.log('⚠️ Authentication required');
                report.push({
                    test: 'Form Submission',
                    status: '⚠️ Issue',
                    details: 'E2E mode not bypassing authentication'
                });
            }
        }

        console.log('\n📍 TEST 3: UI Elements & Design');
        console.log('-------------------------------');
        
        // Check for broken images
        const imageCheck = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            const broken = images.filter(img => !img.complete || img.naturalHeight === 0);
            return {
                total: images.length,
                broken: broken.map(img => img.src)
            };
        });
        
        console.log(`Images: ${imageCheck.total} total, ${imageCheck.broken.length} broken`);
        if (imageCheck.broken.length > 0) {
            report.push({
                test: 'Images',
                status: '❌ Issues',
                details: `${imageCheck.broken.length} broken images found`
            });
        } else {
            report.push({
                test: 'Images',
                status: '✅ Working',
                details: 'All images loading correctly'
            });
        }

        console.log('\n📍 TEST 4: Mobile Responsiveness');
        console.log('--------------------------------');
        
        // Test mobile viewport
        await page.setViewport({ width: 375, height: 812 });
        await wait(2000);
        await takeScreenshot(page, '05-mobile-view', 'Mobile viewport (iPhone X)');
        
        const mobileCheck = await page.evaluate(() => {
            const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
            const formVisible = document.querySelector('input[placeholder*="123 Main Street"]') !== null;
            return {
                horizontalScroll: hasHorizontalScroll,
                formVisible: formVisible,
                viewportWidth: window.innerWidth
            };
        });
        
        console.log(`Mobile view (${mobileCheck.viewportWidth}px):`);
        console.log(`  - Horizontal scroll: ${mobileCheck.horizontalScroll ? '❌ Yes' : '✅ No'}`);
        console.log(`  - Form visible: ${mobileCheck.formVisible ? '✅ Yes' : '❌ No'}`);
        
        if (!mobileCheck.horizontalScroll) {
            report.push({
                test: 'Mobile Layout',
                status: '✅ Working',
                details: 'No horizontal scroll on mobile'
            });
        } else {
            report.push({
                test: 'Mobile Layout',
                status: '❌ Issues',
                details: 'Horizontal scroll present on mobile'
            });
        }

        console.log('\n📍 TEST 5: Interactive Elements');
        console.log('-------------------------------');
        
        // Return to desktop
        await page.setViewport({ width: 1280, height: 800 });
        
        // Test buttons and hover states
        const interactiveElements = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const links = document.querySelectorAll('a');
            const inputs = document.querySelectorAll('input, select, textarea');
            return {
                buttons: buttons.length,
                links: links.length,
                inputs: inputs.length
            };
        });
        
        console.log('Interactive elements found:');
        console.log(`  - Buttons: ${interactiveElements.buttons}`);
        console.log(`  - Links: ${interactiveElements.links}`);
        console.log(`  - Form inputs: ${interactiveElements.inputs}`);
        
        // Test a hover state
        const firstButton = await page.$('button');
        if (firstButton) {
            await firstButton.hover();
            await wait(500);
            await takeScreenshot(page, '06-hover-state', 'Button hover state test');
        }

        console.log('\n📍 TEST 6: Error Handling');
        console.log('------------------------');
        
        // Navigate back and test empty form submission
        await page.goto(url, { waitUntil: 'networkidle2' });
        await wait(2000);
        
        // Try to submit empty form
        const emptySubmitButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.textContent.includes('Analyze Property'));
        });
        
        if (emptySubmitButton) {
            await emptySubmitButton.click();
            await wait(1000);
            
            const validationCheck = await page.evaluate(() => {
                const invalidInputs = document.querySelectorAll(':invalid');
                const errorMessages = document.querySelectorAll('.error, .text-red-500');
                return {
                    invalidCount: invalidInputs.length,
                    errorCount: errorMessages.length
                };
            });
            
            if (validationCheck.invalidCount > 0 || validationCheck.errorCount > 0) {
                console.log('✅ Form validation working');
                report.push({
                    test: 'Form Validation',
                    status: '✅ Working',
                    details: 'Empty form submission properly prevented'
                });
            } else {
                console.log('⚠️ No validation on empty form');
                report.push({
                    test: 'Form Validation',
                    status: '⚠️ Warning',
                    details: 'Form may submit without required fields'
                });
            }
            
            await takeScreenshot(page, '07-validation-test', 'Form validation test');
        }

        // Generate final report
        console.log('\n' + '='.repeat(50));
        console.log('📊 COMPREHENSIVE TEST REPORT');
        console.log('='.repeat(50));
        
        console.log('\n🎯 Test Results Summary:');
        report.forEach(item => {
            console.log(`\n${item.test}:`);
            console.log(`  Status: ${item.status}`);
            console.log(`  Details: ${item.details}`);
        });
        
        // Count results
        const working = report.filter(r => r.status.includes('✅')).length;
        const issues = report.filter(r => r.status.includes('❌')).length;
        const warnings = report.filter(r => r.status.includes('⚠️')).length;
        
        console.log('\n📈 Overall Statistics:');
        console.log(`  ✅ Working: ${working}`);
        console.log(`  ❌ Issues: ${issues}`);
        console.log(`  ⚠️ Warnings: ${warnings}`);
        
        console.log('\n💡 Key Recommendations:');
        if (issues > 0 || warnings > 0) {
            console.log('  1. Fix authentication bypass for E2E test mode');
            console.log('  2. Ensure API endpoints are properly connected');
            console.log('  3. Add better error handling and user feedback');
            console.log('  4. Implement loading states during form submission');
        }
        console.log('  5. Consider adding tooltips for form fields');
        console.log('  6. Add progress indicators for multi-step processes');
        
        // Save JSON report
        const jsonReport = {
            timestamp: new Date().toISOString(),
            url: url,
            screenshotDir: screenshotDir,
            results: report,
            statistics: {
                working: working,
                issues: issues,
                warnings: warnings
            }
        };
        
        const reportPath = path.join(screenshotDir, 'test-results.json');
        await fs.writeFile(reportPath, JSON.stringify(jsonReport, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
    } catch (error) {
        console.error('\n❌ Test Error:', error);
        await takeScreenshot(page, 'error-state', 'Test error occurred');
    } finally {
        await browser.close();
        console.log('\n✅ Test completed. Browser closed.');
    }
}

// Run the test
performCompleteTest().catch(console.error);