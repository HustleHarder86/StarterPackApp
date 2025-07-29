const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function manualLTRTest() {
    console.log('🔍 Manual LTR UI Test Starting...\n');
    
    const browser = await puppeteer.launch({
        headless: false, // Show browser for manual observation
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Create screenshots directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const screenshotDir = path.join(__dirname, 'screenshots', 'ltr-manual-test', timestamp);
    await fs.mkdir(screenshotDir, { recursive: true });
    
    console.log('📁 Screenshots will be saved to:', screenshotDir);
    
    try {
        // Navigate to the test page
        console.log('\n1️⃣ Navigating to LTR test page...');
        const testUrl = 'http://localhost:5173/tests/test-ltr-chart-fix.html';
        
        await page.goto(testUrl, {
            waitUntil: 'domcontentloaded', // Don't wait for all network activity
            timeout: 10000
        });
        
        console.log('✅ Page loaded');
        
        // Wait a bit for JavaScript to initialize
        await page.waitFor(3000);
        
        // Take initial screenshot
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-initial-state.png'), 
            fullPage: true 
        });
        console.log('📸 Initial screenshot taken');
        
        // Check page content
        const pageContent = await page.evaluate(() => {
            const statusEl = document.getElementById('test-status');
            const containerEl = document.getElementById('analysis-container');
            const errorEl = document.querySelector('.bg-red-100');
            
            return {
                statusText: statusEl ? statusEl.textContent : 'No status element',
                hasContainer: \!\!containerEl,
                containerHTML: containerEl ? containerEl.innerHTML.substring(0, 500) : 'No container',
                hasError: \!\!errorEl,
                errorText: errorEl ? errorEl.textContent : null,
                documentTitle: document.title,
                bodyClasses: document.body.className
            };
        });
        
        console.log('\n📋 Page Content Analysis:');
        console.log('Status:', pageContent.statusText);
        console.log('Has Container:', pageContent.hasContainer);
        console.log('Has Error:', pageContent.hasError);
        if (pageContent.hasError) {
            console.log('Error Text:', pageContent.errorText);
        }
        
        // Check for tabs
        console.log('\n2️⃣ Checking for tab buttons...');
        const tabs = await page.$$eval('.tab-button', buttons => 
            buttons.map(btn => ({
                text: btn.textContent.trim(),
                id: btn.id,
                classes: btn.className
            }))
        );
        
        console.log(`Found ${tabs.length} tabs:`, tabs);
        
        if (tabs.length > 0) {
            // Find LTR tab
            const ltrTabIndex = tabs.findIndex(tab => tab.text.includes('Long-Term Rental'));
            
            if (ltrTabIndex >= 0) {
                console.log(`\n3️⃣ Clicking LTR tab (index ${ltrTabIndex})...`);
                const tabButtons = await page.$$('.tab-button');
                await tabButtons[ltrTabIndex].click();
                
                // Wait for content to update
                await page.waitFor(2000);
                
                // Take screenshot after clicking tab
                await page.screenshot({ 
                    path: path.join(screenshotDir, '02-after-ltr-click.png'), 
                    fullPage: true 
                });
                console.log('📸 Screenshot after LTR tab click');
                
                // Check for chart elements
                console.log('\n4️⃣ Checking for chart elements...');
                const chartElements = await page.evaluate(() => {
                    const elements = {
                        revenueComparisonContainer: document.getElementById('revenue-comparison-container'),
                        revenueComparisonChart: document.getElementById('revenue-comparison-chart'),
                        ltrRevenueChart: document.getElementById('ltr-revenue-chart'),
                        ltrContent: document.getElementById('ltr-content')
                    };
                    
                    return {
                        hasRevenueComparisonContainer: \!\!elements.revenueComparisonContainer,
                        hasRevenueComparisonChart: \!\!elements.revenueComparisonChart,
                        hasLTRRevenueChart: \!\!elements.ltrRevenueChart,
                        hasLTRContent: \!\!elements.ltrContent,
                        ltrContentVisible: elements.ltrContent ? \!elements.ltrContent.classList.contains('hidden') : false,
                        containerDetails: elements.revenueComparisonContainer ? {
                            id: elements.revenueComparisonContainer.id,
                            className: elements.revenueComparisonContainer.className,
                            innerHTML: elements.revenueComparisonContainer.innerHTML.substring(0, 200)
                        } : null
                    };
                });
                
                console.log('Chart Elements:', chartElements);
                
                // If we found the revenue comparison container, take a focused screenshot
                if (chartElements.hasRevenueComparisonContainer) {
                    console.log('\n5️⃣ Taking focused screenshot of Revenue Comparison chart...');
                    
                    const container = await page.$('#revenue-comparison-container');
                    if (container) {
                        await container.scrollIntoViewIfNeeded();
                        await page.waitFor(500);
                        
                        const box = await container.boundingBox();
                        if (box) {
                            await page.screenshot({
                                path: path.join(screenshotDir, '03-revenue-comparison-focused.png'),
                                clip: {
                                    x: Math.max(0, box.x - 20),
                                    y: Math.max(0, box.y - 20),
                                    width: box.width + 40,
                                    height: box.height + 40
                                }
                            });
                            console.log('📸 Focused chart screenshot taken');
                        }
                    }
                }
                
                // Test interactivity
                console.log('\n6️⃣ Testing chart interactivity...');
                const monthlyRentInput = await page.$('#monthlyRent');
                if (monthlyRentInput) {
                    console.log('Found monthly rent input, changing value...');
                    await monthlyRentInput.click({ clickCount: 3 });
                    await monthlyRentInput.type('2500');
                    await page.waitFor(1000);
                    
                    await page.screenshot({ 
                        path: path.join(screenshotDir, '04-after-rent-change.png'), 
                        fullPage: true 
                    });
                    console.log('📸 Screenshot after rent change');
                }
            } else {
                console.log('❌ Long-Term Rental tab not found');
            }
        } else {
            console.log('❌ No tab buttons found on page');
        }
        
        // Final summary
        console.log('\n📊 Test Summary:');
        console.log('- Test completed successfully');
        console.log(`- Screenshots saved: ${screenshotDir}`);
        console.log('- Check screenshots to verify chart rendering');
        
        // Keep browser open for manual inspection
        console.log('\n👀 Browser will remain open for manual inspection.');
        console.log('Press Ctrl+C to close when done.');
        
        // Wait indefinitely (user will close manually)
        await new Promise(() => {});
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        // Take error screenshot
        await page.screenshot({
            path: path.join(screenshotDir, 'error-state.png'),
            fullPage: true
        });
        
        // Save error details
        await fs.writeFile(
            path.join(screenshotDir, 'error-details.json'),
            JSON.stringify({
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            }, null, 2)
        );
        
        await browser.close();
    }
}

// Run the test
console.log('StarterPackApp - Manual LTR UI Test');
console.log('====================================\n');

manualLTRTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
EOF < /dev/null
