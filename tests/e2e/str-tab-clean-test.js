const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function runSTRTabTest() {
    console.log('Starting STR Tab Comprehensive Test...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Create screenshot directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotDir = path.join(__dirname, 'screenshots', 'str-test', timestamp);
    await fs.mkdir(screenshotDir, { recursive: true });
    
    let screenshotCount = 0;
    const takeScreenshot = async (name) => {
        screenshotCount++;
        const filename = `${screenshotCount.toString().padStart(2, '0')}-${name}.png`;
        await page.screenshot({ 
            path: path.join(screenshotDir, filename),
            fullPage: true 
        });
        console.log(`📸 Screenshot: ${filename}`);
        return filename;
    };

    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    try {
        // Clear all data before starting
        console.log('1. Clearing browser data...');
        await page.evaluateOnNewDocument(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // Navigate to clean URL
        console.log('2. Navigating to ROI Finder (clean URL)...');
        await page.goto('http://localhost:3000/roi-finder.html', { 
            waitUntil: 'domcontentloaded'
        });
        
        // Wait for page to initialize
        await page.waitForTimeout(2000);
        
        // Check if we're in loading state
        const isLoading = await page.$('.loading-section') !== null;
        if (isLoading) {
            console.log('⚠️  Page is in loading state, waiting for it to clear...');
            
            // Try to cancel/close the loading state
            await page.evaluate(() => {
                // Hide loading section
                const loadingSection = document.querySelector('.loading-section');
                if (loadingSection) {
                    loadingSection.style.display = 'none';
                }
                
                // Show property input section
                const propertySection = document.querySelector('.property-input-section');
                if (propertySection) {
                    propertySection.style.display = 'block';
                }
                
                // Clear any stored analysis
                localStorage.removeItem('currentAnalysis');
                localStorage.removeItem('analysisId');
            });
            
            await page.waitForTimeout(1000);
        }

        await takeScreenshot('initial-state');

        // Check if form is visible
        console.log('3. Checking for property form...');
        const formVisible = await page.$('#property-analysis-form') !== null;
        
        if (!formVisible) {
            console.log('❌ Form not visible, trying to show it...');
            
            // Click logout to reset state
            const logoutBtn = await page.$('button:has-text("Logout")');
            if (logoutBtn) {
                await logoutBtn.click();
                await page.waitForTimeout(1000);
            }
            
            // Reload page
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);
            
            // Skip auth for testing
            await page.evaluate(() => {
                if (window.app && window.app.handleSkipAuth) {
                    window.app.handleSkipAuth();
                } else {
                    // Manually show property form
                    document.querySelector('.auth-section')?.classList.add('hidden');
                    document.querySelector('.property-input-section')?.classList.remove('hidden');
                }
            });
            
            await page.waitForTimeout(1000);
            await takeScreenshot('after-skip-auth');
        }

        // Wait for form to be ready
        await page.waitForSelector('#property-analysis-form', { visible: true, timeout: 10000 });
        results.passed.push('Property form is visible');

        // Fill in the form
        console.log('4. Filling property form...');
        
        // Use the textarea for address
        await page.type('#property-address', '123 Test Street, Toronto, ON M5V 3A8');
        
        // Fill other fields
        await page.type('#listing-price', '850000');
        await page.type('#bedrooms', '3');
        await page.type('#bathrooms', '2');
        await page.type('#square-feet', '1800');
        await page.type('#property-taxes', '8500');
        await page.type('#condo-fees', '450');
        
        await takeScreenshot('form-filled');
        results.passed.push('Form filled successfully');

        // Submit form
        console.log('5. Submitting form...');
        await page.click('button[type="submit"]');
        
        // Wait for loading
        await page.waitForSelector('.loading', { visible: true });
        await takeScreenshot('loading-analysis');
        
        // Wait for results (with longer timeout)
        console.log('6. Waiting for analysis results...');
        await page.waitForSelector('.results-section', { 
            visible: true, 
            timeout: 90000 
        });
        
        await page.waitForTimeout(3000); // Let everything render
        await takeScreenshot('results-loaded');
        results.passed.push('Analysis completed successfully');

        // Check for tabs
        console.log('7. Checking tabs structure...');
        const tabInfo = await page.evaluate(() => {
            const tabContainers = document.querySelectorAll('.tabs');
            const tabButtons = document.querySelectorAll('.tab-button');
            const strTabs = Array.from(tabButtons).filter(btn => 
                btn.textContent.includes('STR Analysis')
            );
            
            return {
                containerCount: tabContainers.length,
                buttonCount: tabButtons.length,
                strTabCount: strTabs.length,
                tabTexts: Array.from(tabButtons).map(btn => btn.textContent.trim())
            };
        });
        
        console.log('Tab Info:', tabInfo);
        
        if (tabInfo.containerCount > 1) {
            results.failed.push(`Multiple tab containers found: ${tabInfo.containerCount}`);
        } else {
            results.passed.push('Single tab container (no duplicates)');
        }

        // Click STR tab
        console.log('8. Clicking STR tab...');
        await page.evaluate(() => {
            const strTab = Array.from(document.querySelectorAll('.tab-button'))
                .find(btn => btn.textContent.includes('STR Analysis'));
            if (strTab) strTab.click();
        });
        
        await page.waitForSelector('#str-content', { visible: true });
        await page.waitForTimeout(1500); // Let animations complete
        await takeScreenshot('str-tab-active');
        results.passed.push('STR tab activated');

        // Validate STR content
        console.log('9. Validating STR content...');
        
        // Property image check
        const imageCheck = await page.evaluate(() => {
            const img = document.querySelector('.property-image img');
            return {
                exists: !!img,
                src: img?.src || '',
                isDefault: img?.src?.includes('default-property.jpg') || false
            };
        });
        
        if (imageCheck.exists && !imageCheck.isDefault) {
            results.passed.push('Property image displayed (not default)');
        } else {
            results.failed.push('Property image issue: ' + 
                (!imageCheck.exists ? 'Not found' : 'Using default image'));
        }

        // Check headers
        const headerCount = await page.$$eval('.str-header', headers => headers.length);
        if (headerCount === 1) {
            results.passed.push('Clean STR header (no duplicates)');
        } else {
            results.failed.push(`Multiple STR headers found: ${headerCount}`);
        }

        // Check revenue comparison chart
        await page.evaluate(() => {
            const chart = document.querySelector('.str-revenue-comparison');
            if (chart) chart.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(1000);
        await takeScreenshot('revenue-comparison');
        
        const chartExists = await page.$('.str-revenue-comparison canvas') !== null;
        if (chartExists) {
            results.passed.push('Revenue comparison chart rendered');
        } else {
            results.failed.push('Revenue comparison chart not found');
        }

        // Test STR calculator
        console.log('10. Testing STR calculator...');
        await page.evaluate(() => {
            const calc = document.querySelector('.str-calculator');
            if (calc) calc.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(1000);
        await takeScreenshot('str-calculator');
        
        // Check input formatting
        const inputFormatting = await page.evaluate(() => {
            const inputs = document.querySelectorAll('.str-calculator .input-group');
            return Array.from(inputs).map(group => {
                const prefix = group.querySelector('.input-prefix');
                const input = group.querySelector('input');
                return {
                    hasPrefix: !!prefix,
                    prefixText: prefix?.textContent || '',
                    inputName: input?.name || input?.id || 'unknown'
                };
            });
        });
        
        console.log('Input formatting:', inputFormatting);
        const properlyFormatted = inputFormatting.filter(i => i.hasPrefix && i.prefixText === '$');
        if (properlyFormatted.length > 0) {
            results.passed.push(`${properlyFormatted.length} inputs with proper $ formatting`);
        } else {
            results.warnings.push('No inputs with $ prefix formatting found');
        }

        // Test occupancy slider
        const sliderExists = await page.$('#occupancy-rate') !== null;
        if (sliderExists) {
            await page.evaluate(() => {
                const slider = document.querySelector('#occupancy-rate');
                if (slider) {
                    slider.value = '80';
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            results.passed.push('Occupancy slider interaction successful');
            await page.waitForTimeout(500);
            await takeScreenshot('calculator-adjusted');
        } else {
            results.failed.push('Occupancy slider not found');
        }

        // Check financial calculator
        console.log('11. Checking financial calculator...');
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(1000);
        
        const financialCalc = await page.$('.financial-calculator') !== null;
        const annualChart = await page.$('.financial-calculator canvas') !== null;
        
        if (financialCalc) {
            results.passed.push('Financial calculator found');
            if (annualChart) {
                results.passed.push('Annual revenue chart rendered');
            } else {
                results.failed.push('Annual revenue chart not rendered');
            }
        } else {
            results.failed.push('Financial calculator not found');
        }
        
        await takeScreenshot('financial-calculator');

        // Check layout
        console.log('12. Validating layout...');
        const layoutCheck = await page.evaluate(() => {
            const strContent = document.querySelector('#str-content');
            if (!strContent) return { error: 'STR content not found' };
            
            const columns = strContent.querySelectorAll('.str-column');
            const style = window.getComputedStyle(strContent);
            
            return {
                columns: columns.length,
                display: style.display,
                gridTemplate: style.gridTemplateColumns
            };
        });
        
        if (layoutCheck.columns === 2) {
            results.passed.push('2-column layout confirmed');
        } else {
            results.failed.push(`Layout issue: ${layoutCheck.columns} columns found`);
        }

        // Final full-page screenshot
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
        await takeScreenshot('final-complete-view');

    } catch (error) {
        console.error('❌ Test error:', error.message);
        results.failed.push(`Test error: ${error.message}`);
        await takeScreenshot('error-state');
    } finally {
        // Generate report
        console.log('\n' + '='.repeat(50));
        console.log('TEST REPORT - STR TAB VALIDATION');
        console.log('='.repeat(50));
        
        console.log(`\n✅ PASSED (${results.passed.length}):`);
        results.passed.forEach(item => console.log(`  - ${item}`));
        
        if (results.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`);
            results.warnings.forEach(item => console.log(`  - ${item}`));
        }
        
        if (results.failed.length > 0) {
            console.log(`\n❌ FAILED (${results.failed.length}):`);
            results.failed.forEach(item => console.log(`  - ${item}`));
        }
        
        console.log(`\n📁 Screenshots saved to: ${screenshotDir}`);
        console.log(`\nOVERALL: ${results.failed.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
        
        await browser.close();
    }
}

// Run the test
runSTRTabTest().catch(console.error);