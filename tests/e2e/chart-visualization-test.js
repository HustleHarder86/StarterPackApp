const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function testLTRRevenueComparisonChart() {
    console.log('Starting Revenue Comparison Chart Visual Test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Create screenshots directory
    const screenshotDir = path.join(__dirname, 'screenshots', 'chart-visualization', new Date().toISOString().replace(/[:.]/g, '-'));
    await fs.mkdir(screenshotDir, { recursive: true });
    
    try {
        console.log('1. Navigating to test page...');
        await page.goto('http://localhost:5173/tests/test-ltr-chart-fix.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Take initial screenshot
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-initial-page-load.png'), 
            fullPage: true 
        });
        console.log('✅ Initial page loaded and screenshot taken');
        
        // Click on Long-Term Rental tab
        console.log('2. Clicking on Long-Term Rental tab...');
        await page.waitForSelector('.tab-button', { timeout: 10000 });
        
        // Find and click the LTR tab
        const ltrTab = await page.evaluateHandle(() => {
            const tabs = Array.from(document.querySelectorAll('.tab-button'));
            return tabs.find(tab => tab.textContent.includes('Long-Term Rental'));
        });
        
        if (!ltrTab) {
            throw new Error('Long-Term Rental tab not found');
        }
        
        await ltrTab.click();
        
        // Wait for charts to load
        console.log('3. Waiting for charts to load...');
        await page.waitFor(2000); // Give charts time to render
        
        // Take screenshot of LTR tab with focus on Revenue Comparison
        await page.screenshot({ 
            path: path.join(screenshotDir, '02-ltr-tab-loaded.png'), 
            fullPage: true 
        });
        
        // Scroll to Revenue Comparison chart if needed
        const revenueComparisonSection = await page.$('#revenue-comparison-container');
        if (revenueComparisonSection) {
            await revenueComparisonSection.scrollIntoViewIfNeeded();
            await page.waitFor(500);
            
            // Take focused screenshot of Revenue Comparison chart
            const chartBounds = await revenueComparisonSection.boundingBox();
            if (chartBounds) {
                await page.screenshot({
                    path: path.join(screenshotDir, '03-revenue-comparison-chart-focused.png'),
                    clip: {
                        x: chartBounds.x - 20,
                        y: chartBounds.y - 20,
                        width: chartBounds.width + 40,
                        height: chartBounds.height + 40
                    }
                });
            }
        }
        
        // Verify chart elements
        console.log('4. Verifying chart elements...');
        const chartVerification = await page.evaluate(() => {
            const container = document.getElementById('revenue-comparison-container');
            if (!container) return { found: false, error: 'Container not found' };
            
            const canvas = container.querySelector('canvas');
            if (!canvas) return { found: false, error: 'Canvas not found' };
            
            // Check for percentage text
            const percentageText = container.querySelector('.text-center.mt-4');
            
            return {
                found: true,
                canvasPresent: !!canvas,
                canvasWidth: canvas ? canvas.width : 0,
                canvasHeight: canvas ? canvas.height : 0,
                percentageText: percentageText ? percentageText.textContent : null
            };
        });
        
        console.log('Chart verification:', chartVerification);
        
        // Test interactive elements
        console.log('5. Testing interactive elements...');
        
        // Change monthly rent
        console.log('   - Changing monthly rent to $2,500...');
        const rentInput = await page.$('#monthlyRent');
        if (rentInput) {
            await rentInput.click({ clickCount: 3 }); // Select all
            await rentInput.type('2500');
            await page.waitFor(1000); // Wait for chart update
            
            await page.screenshot({
                path: path.join(screenshotDir, '04-after-rent-change.png'),
                fullPage: true
            });
        }
        
        // Adjust vacancy slider
        console.log('   - Adjusting vacancy slider to 10%...');
        const vacancySlider = await page.$('#vacancyRate');
        if (vacancySlider) {
            await page.evaluate(() => {
                const slider = document.getElementById('vacancyRate');
                if (slider) {
                    slider.value = '10';
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    slider.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            
            await page.waitFor(1000); // Wait for chart update
            
            // Take final screenshot
            await page.screenshot({
                path: path.join(screenshotDir, '05-after-vacancy-adjustment.png'),
                fullPage: true
            });
            
            // Take focused screenshot of updated chart
            if (revenueComparisonSection) {
                const updatedBounds = await revenueComparisonSection.boundingBox();
                if (updatedBounds) {
                    await page.screenshot({
                        path: path.join(screenshotDir, '06-updated-chart-focused.png'),
                        clip: {
                            x: updatedBounds.x - 20,
                            y: updatedBounds.y - 20,
                            width: updatedBounds.width + 40,
                            height: updatedBounds.height + 40
                        }
                    });
                }
            }
        }
        
        // Final verification
        const finalVerification = await page.evaluate(() => {
            const container = document.getElementById('revenue-comparison-container');
            if (!container) return null;
            
            // Try to get chart data from the page
            const chartData = window.ltrChartData || null;
            const percentageText = container.querySelector('.text-center.mt-4');
            
            return {
                chartDataAvailable: !!chartData,
                percentageText: percentageText ? percentageText.textContent : null,
                chartData: chartData
            };
        });
        
        console.log('\n✅ Test completed successfully!');
        console.log('Final verification:', finalVerification);
        console.log(`\nScreenshots saved to: ${screenshotDir}`);
        
        // Generate report
        const report = {
            testDate: new Date().toISOString(),
            testPassed: true,
            screenshots: {
                initial: '01-initial-page-load.png',
                ltrTab: '02-ltr-tab-loaded.png',
                chartFocused: '03-revenue-comparison-chart-focused.png',
                afterRentChange: '04-after-rent-change.png',
                afterVacancy: '05-after-vacancy-adjustment.png',
                finalChart: '06-updated-chart-focused.png'
            },
            verification: {
                initial: chartVerification,
                final: finalVerification
            }
        };
        
        await fs.writeFile(
            path.join(screenshotDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        
        // Take error screenshot
        await page.screenshot({
            path: path.join(screenshotDir, 'error-state.png'),
            fullPage: true
        });
        
        // Save error report
        await fs.writeFile(
            path.join(screenshotDir, 'error-report.json'),
            JSON.stringify({
                testDate: new Date().toISOString(),
                testPassed: false,
                error: error.message,
                stack: error.stack
            }, null, 2)
        );
        
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
testLTRRevenueComparisonChart().catch(console.error);