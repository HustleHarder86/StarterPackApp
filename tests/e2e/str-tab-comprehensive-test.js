const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function runSTRTabTest() {
    console.log('Starting comprehensive STR tab test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Create screenshot directory
    const screenshotDir = path.join(__dirname, 'screenshots', 'str-tab-test', new Date().toISOString().split('T')[0]);
    await fs.mkdir(screenshotDir, { recursive: true });
    
    let screenshotCount = 0;
    const takeScreenshot = async (name) => {
        screenshotCount++;
        const filename = `${screenshotCount.toString().padStart(2, '0')}-${name}.png`;
        await page.screenshot({ 
            path: path.join(screenshotDir, filename),
            fullPage: true 
        });
        console.log(`📸 Screenshot saved: ${filename}`);
    };

    try {
        // 1. Navigate to the app
        console.log('\n1. Navigating to ROI Finder...');
        await page.goto('http://localhost:3000/roi-finder.html', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Wait for the page to be ready
        await page.waitForTimeout(3000);
        await takeScreenshot('initial-page-load');

        // Check for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console error:', msg.text());
            }
        });

        // 2. Fill in the property form
        console.log('\n2. Filling property form with test data...');
        
        // Wait for form to be ready
        await page.waitForSelector('#property-form', { visible: true });
        
        // Fill in form fields
        await page.type('#street', '123 Test Street');
        await page.type('#city', 'Toronto');
        await page.type('#province', 'Ontario');
        await page.type('#price', '850000');
        await page.type('#bedrooms', '3');
        await page.type('#bathrooms', '2');
        await page.type('#sqft', '1800');
        await page.type('#property-taxes', '8500');
        await page.type('#condo-fees', '450');
        
        await takeScreenshot('form-filled');

        // 3. Submit the form
        console.log('\n3. Submitting form...');
        const submitButton = await page.$('button[type="submit"]');
        await submitButton.click();
        
        // Wait for loading state
        await page.waitForSelector('.loading', { visible: true });
        await takeScreenshot('loading-state');
        
        // Wait for results to load (max 60 seconds)
        console.log('Waiting for analysis to complete...');
        await page.waitForSelector('.results-section', { 
            visible: true,
            timeout: 60000 
        });
        
        // Wait a bit for all content to render
        await page.waitForTimeout(2000);
        await takeScreenshot('results-loaded');

        // 4. Click on the STR tab
        console.log('\n4. Clicking on STR tab...');
        
        // Check for duplicate tabs
        const tabButtons = await page.$$('.tab-button');
        console.log(`Found ${tabButtons.length} tab buttons`);
        
        // Find and click STR tab
        const strTabFound = await page.evaluate(() => {
            const tabs = document.querySelectorAll('.tab-button');
            for (let tab of tabs) {
                if (tab.textContent.includes('STR Analysis')) {
                    tab.click();
                    return true;
                }
            }
            return false;
        });

        if (!strTabFound) {
            throw new Error('STR tab not found!');
        }

        // Wait for STR content to be visible
        await page.waitForSelector('#str-content', { visible: true });
        await page.waitForTimeout(1000); // Let animations complete
        
        await takeScreenshot('str-tab-active');

        // 5. Validate STR content
        console.log('\n5. Validating STR content...');
        
        // Check for property image
        const propertyImage = await page.$eval('.property-image img', img => ({
            src: img.src,
            isDefault: img.src.includes('default-property.jpg')
        }));
        console.log(`Property image: ${propertyImage.isDefault ? '❌ Default image' : '✅ Custom image'}`);
        
        // Check for duplicate tabs
        const duplicateTabs = await page.evaluate(() => {
            const tabContainers = document.querySelectorAll('.tabs');
            return tabContainers.length;
        });
        console.log(`Tab containers found: ${duplicateTabs} ${duplicateTabs > 1 ? '❌ Duplicates!' : '✅ No duplicates'}`);
        
        // Check STR header
        const strHeaders = await page.$$('.str-header');
        console.log(`STR headers found: ${strHeaders.length} ${strHeaders.length > 1 ? '❌ Multiple headers!' : '✅ Clean header'}`);
        
        // Scroll to revenue comparison chart
        await page.evaluate(() => {
            const chart = document.querySelector('.str-revenue-comparison');
            if (chart) chart.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(500);
        await takeScreenshot('revenue-comparison-chart');
        
        // Check if chart rendered
        const chartExists = await page.$('.str-revenue-comparison canvas') !== null;
        console.log(`Revenue comparison chart: ${chartExists ? '✅ Rendered' : '❌ Not rendered'}`);
        
        // 6. Test STR calculator
        console.log('\n6. Testing STR calculator...');
        
        // Scroll to calculator
        await page.evaluate(() => {
            const calc = document.querySelector('.str-calculator');
            if (calc) calc.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(500);
        
        // Check for $ symbol positioning
        const dollarSymbols = await page.evaluate(() => {
            const inputs = document.querySelectorAll('.str-calculator .input-group');
            return Array.from(inputs).map(group => {
                const symbol = group.querySelector('.input-prefix');
                const input = group.querySelector('input');
                return {
                    hasSymbol: !!symbol,
                    symbolText: symbol?.textContent,
                    inputType: input?.type
                };
            });
        });
        console.log('Input formatting:', dollarSymbols);
        
        await takeScreenshot('str-calculator-initial');
        
        // Test occupancy slider
        const occupancySlider = await page.$('#occupancy-rate');
        if (occupancySlider) {
            const sliderBox = await occupancySlider.boundingBox();
            await page.mouse.move(sliderBox.x + sliderBox.width / 2, sliderBox.y + sliderBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(sliderBox.x + sliderBox.width * 0.8, sliderBox.y + sliderBox.height / 2);
            await page.mouse.up();
            console.log('✅ Occupancy slider adjusted');
            await page.waitForTimeout(500);
            await takeScreenshot('str-calculator-adjusted');
        } else {
            console.log('❌ Occupancy slider not found');
        }
        
        // 7. Check financial calculator
        console.log('\n7. Checking financial calculator...');
        
        // Scroll to bottom
        await page.evaluate(() => {
            const calc = document.querySelector('.financial-calculator');
            if (calc) calc.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(500);
        
        const financialCalcExists = await page.$('.financial-calculator') !== null;
        const annualRevenueChart = await page.$('.financial-calculator canvas') !== null;
        
        console.log(`Financial calculator: ${financialCalcExists ? '✅ Found' : '❌ Not found'}`);
        console.log(`Annual revenue chart: ${annualRevenueChart ? '✅ Rendered' : '❌ Not rendered'}`);
        
        await takeScreenshot('financial-calculator');
        
        // 8. Check layout
        console.log('\n8. Validating layout...');
        
        const layoutCheck = await page.evaluate(() => {
            const strContent = document.querySelector('#str-content');
            if (!strContent) return { error: 'STR content not found' };
            
            const columns = strContent.querySelectorAll('.str-column');
            const overlapping = [];
            
            // Check for overlapping elements
            const elements = strContent.querySelectorAll('*');
            for (let i = 0; i < elements.length; i++) {
                const rect1 = elements[i].getBoundingClientRect();
                for (let j = i + 1; j < elements.length; j++) {
                    const rect2 = elements[j].getBoundingClientRect();
                    if (rect1.left < rect2.right && rect1.right > rect2.left &&
                        rect1.top < rect2.bottom && rect1.bottom > rect2.top) {
                        // Elements overlap
                        if (!elements[i].contains(elements[j]) && !elements[j].contains(elements[i])) {
                            overlapping.push({
                                elem1: elements[i].className,
                                elem2: elements[j].className
                            });
                        }
                    }
                }
            }
            
            return {
                columnsFound: columns.length,
                hasOverlapping: overlapping.length > 0,
                overlappingElements: overlapping.slice(0, 5)
            };
        });
        
        console.log(`Layout columns: ${layoutCheck.columnsFound} ${layoutCheck.columnsFound === 2 ? '✅ 2-column layout' : '❌ Layout issue'}`);
        console.log(`Overlapping elements: ${layoutCheck.hasOverlapping ? '❌ Found overlaps' : '✅ No overlaps'}`);
        if (layoutCheck.overlappingElements.length > 0) {
            console.log('Overlapping:', layoutCheck.overlappingElements);
        }
        
        // Final full page screenshot
        await takeScreenshot('str-tab-complete');
        
        console.log('\n✅ Test completed successfully!');
        console.log(`Screenshots saved to: ${screenshotDir}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await takeScreenshot('error-state');
    } finally {
        await browser.close();
    }
}

// Run the test
runSTRTabTest().catch(console.error);