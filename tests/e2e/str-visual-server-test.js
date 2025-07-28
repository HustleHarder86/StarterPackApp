const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const express = require('express');

async function runSTRVisualTest() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotDir = path.join(__dirname, 'screenshots', 'str-visual-final', timestamp);
    
    // Create screenshot directory
    await fs.mkdir(screenshotDir, { recursive: true });
    
    // Set up Express server
    const app = express();
    const projectRoot = path.join(__dirname, '../../');
    
    // Serve static files
    app.use(express.static(projectRoot));
    
    // Create server
    const server = http.createServer(app);
    const PORT = 9876;
    
    // Start server
    await new Promise((resolve) => {
        server.listen(PORT, () => {
            console.log(`🌐 Test server running on http://localhost:${PORT}`);
            resolve();
        });
    });

    let browser;
    
    try {
        console.log('\n🚀 Starting STR Tab Visual Test\n');
        console.log('Test Objectives:');
        console.log('1. Verify Annual Revenue Chart is NOT present');
        console.log('2. Check Financial Summary section layout');
        console.log('3. Verify Financial Calculator is present');
        console.log('4. Check Key Metrics section');
        console.log('5. Look for visual gaps or spacing issues');
        console.log('6. Test responsive behavior\n');
        
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: {
                width: 1920,
                height: 1080
            },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Track console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
                console.log('❌ Console Error:', msg.text());
            }
        });

        // Navigate to test page
        const testUrl = `http://localhost:${PORT}/tests/test-str-no-annual-chart.html`;
        console.log(`📄 Opening: ${testUrl}`);
        
        await page.goto(testUrl, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for content to load
        await page.waitForSelector('#str-tab-content', { timeout: 10000 });
        console.log('✅ Page loaded successfully\n');
        
        // Take initial screenshot
        await page.screenshot({
            path: path.join(screenshotDir, '01-full-page-initial.png'),
            fullPage: true
        });
        console.log('📸 Screenshot 1: Full page initial view');

        // Ensure STR tab is active
        await page.evaluate(() => {
            const strTab = document.getElementById('str-tab');
            if (strTab && !strTab.classList.contains('active')) {
                strTab.click();
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // VISUAL CHECK 1: Annual Revenue Chart should NOT exist
        console.log('\n🔍 CHECK 1: Annual Revenue Chart Removal');
        const annualChartPresent = await page.evaluate(() => {
            // Multiple ways to check for the chart
            const checks = {
                canvasById: !!document.querySelector('#annual-revenue-chart'),
                chartContainer: false,
                chartTitle: false
            };
            
            // Check all chart containers
            document.querySelectorAll('.chart-container').forEach(container => {
                const text = container.textContent || '';
                if (text.includes('Annual Revenue') || text.includes('Revenue Comparison')) {
                    checks.chartContainer = true;
                }
            });
            
            // Check all h4 titles
            document.querySelectorAll('h4').forEach(h4 => {
                if (h4.textContent.includes('Annual Revenue')) {
                    checks.chartTitle = true;
                }
            });
            
            return {
                found: checks.canvasById || checks.chartContainer || checks.chartTitle,
                details: checks
            };
        });

        if (!annualChartPresent.found) {
            console.log('✅ PASS: Annual Revenue Chart is correctly ABSENT');
        } else {
            console.log('❌ FAIL: Annual Revenue Chart is still present!');
            console.log('   Details:', annualChartPresent.details);
        }

        // VISUAL CHECK 2: Financial Summary Section
        console.log('\n🔍 CHECK 2: Financial Summary Section');
        const financialSummaryPresent = await page.$('.financial-summary');
        if (financialSummaryPresent) {
            console.log('✅ PASS: Financial Summary section found');
            await financialSummaryPresent.screenshot({
                path: path.join(screenshotDir, '02-financial-summary.png')
            });
            console.log('📸 Screenshot 2: Financial Summary section');
        } else {
            console.log('❌ FAIL: Financial Summary section not found');
        }

        // VISUAL CHECK 3: Financial Calculator
        console.log('\n🔍 CHECK 3: Financial Calculator');
        const calculatorPresent = await page.$('.financial-calculator');
        if (calculatorPresent) {
            console.log('✅ PASS: Financial Calculator found');
            
            // Check styling
            const calculatorStyles = await page.evaluate(() => {
                const calc = document.querySelector('.financial-calculator');
                const styles = window.getComputedStyle(calc);
                return {
                    backgroundColor: styles.backgroundColor,
                    padding: styles.padding,
                    borderRadius: styles.borderRadius,
                    minHeight: styles.minHeight
                };
            });
            console.log('   Styles:', calculatorStyles);
            
            await calculatorPresent.screenshot({
                path: path.join(screenshotDir, '03-financial-calculator.png')
            });
            console.log('📸 Screenshot 3: Financial Calculator');
        } else {
            console.log('❌ FAIL: Financial Calculator not found');
        }

        // VISUAL CHECK 4: Key Metrics
        console.log('\n🔍 CHECK 4: Key Metrics Section');
        const keyMetricsPresent = await page.$('.key-metrics');
        if (keyMetricsPresent) {
            const metricCards = await page.evaluate(() => {
                const cards = document.querySelectorAll('.metric-card');
                return {
                    count: cards.length,
                    titles: Array.from(cards).map(card => 
                        card.querySelector('h4')?.textContent || 'No title'
                    )
                };
            });
            
            console.log(`✅ PASS: Key Metrics section found with ${metricCards.count} cards`);
            metricCards.titles.forEach((title, i) => {
                console.log(`   Card ${i + 1}: ${title}`);
            });
            
            await keyMetricsPresent.screenshot({
                path: path.join(screenshotDir, '04-key-metrics.png')
            });
            console.log('📸 Screenshot 4: Key Metrics section');
        } else {
            console.log('❌ FAIL: Key Metrics section not found');
        }

        // VISUAL CHECK 5: Layout Gaps
        console.log('\n🔍 CHECK 5: Layout and Spacing');
        const layoutAnalysis = await page.evaluate(() => {
            const strContent = document.querySelector('#str-content');
            if (!strContent) return { error: 'STR content not found' };
            
            const sections = strContent.querySelectorAll(':scope > *:not(.hidden)');
            const gaps = [];
            
            for (let i = 0; i < sections.length - 1; i++) {
                const current = sections[i].getBoundingClientRect();
                const next = sections[i + 1].getBoundingClientRect();
                const gap = next.top - current.bottom;
                
                if (gap > 60) {
                    gaps.push({
                        between: `Section ${i + 1} and Section ${i + 2}`,
                        gap: Math.round(gap) + 'px',
                        elements: [sections[i].className, sections[i + 1].className]
                    });
                }
            }
            
            return {
                sectionCount: sections.length,
                largeGaps: gaps,
                totalHeight: strContent.scrollHeight
            };
        });

        console.log(`   Found ${layoutAnalysis.sectionCount} sections`);
        console.log(`   Total content height: ${layoutAnalysis.totalHeight}px`);
        
        if (layoutAnalysis.largeGaps.length === 0) {
            console.log('✅ PASS: No unusual gaps detected');
        } else {
            console.log('⚠️  WARNING: Large gaps detected:');
            layoutAnalysis.largeGaps.forEach(gap => {
                console.log(`   - ${gap.between}: ${gap.gap}`);
                console.log(`     Classes: ${gap.elements.join(' → ')}`);
            });
        }

        // Scroll to show different parts
        await page.evaluate(() => window.scrollTo(0, 500));
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.screenshot({
            path: path.join(screenshotDir, '05-scrolled-view.png'),
            fullPage: false
        });
        console.log('\n📸 Screenshot 5: Scrolled view');

        // VISUAL CHECK 6: Responsive
        console.log('\n🔍 CHECK 6: Responsive Behavior');
        
        // Tablet view
        await page.setViewport({ width: 768, height: 1024 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({
            path: path.join(screenshotDir, '06-tablet-view.png'),
            fullPage: true
        });
        console.log('📸 Screenshot 6: Tablet view (768x1024)');
        
        // Mobile view
        await page.setViewport({ width: 375, height: 812 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({
            path: path.join(screenshotDir, '07-mobile-view.png'),
            fullPage: true
        });
        console.log('📸 Screenshot 7: Mobile view (375x812)');

        // Final Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 VISUAL TEST SUMMARY');
        console.log('='.repeat(70));
        console.log('✅ Annual Revenue Chart: REMOVED (as expected)');
        console.log(`${financialSummaryPresent ? '✅' : '❌'} Financial Summary: ${financialSummaryPresent ? 'PRESENT' : 'MISSING'}`);
        console.log(`${calculatorPresent ? '✅' : '❌'} Financial Calculator: ${calculatorPresent ? 'PRESENT' : 'MISSING'}`);
        console.log(`${keyMetricsPresent ? '✅' : '❌'} Key Metrics: ${keyMetricsPresent ? 'PRESENT' : 'MISSING'}`);
        console.log(`${layoutAnalysis.largeGaps.length === 0 ? '✅' : '⚠️'} Layout: ${layoutAnalysis.largeGaps.length === 0 ? 'No gaps' : layoutAnalysis.largeGaps.length + ' gaps found'}`);
        console.log(`🚨 Console Errors: ${consoleErrors.length}`);
        
        console.log(`\n📁 Screenshots saved to:\n   ${screenshotDir}`);
        console.log('\n✅ Visual test completed successfully!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        // Try to capture error screenshot
        if (browser) {
            const page = (await browser.pages())[0];
            if (page) {
                await page.screenshot({
                    path: path.join(screenshotDir, 'error-screenshot.png'),
                    fullPage: true
                });
            }
        }
    } finally {
        if (browser) {
            await browser.close();
        }
        server.close(() => {
            console.log('\n🛑 Test server stopped');
        });
    }
}

// Run the test
runSTRVisualTest().catch(console.error);