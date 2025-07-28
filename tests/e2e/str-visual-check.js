const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkSTRTabVisuals() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotDir = path.join(__dirname, 'screenshots', 'str-visual', timestamp);
    
    // Create screenshot directory
    await fs.mkdir(screenshotDir, { recursive: true });
    
    let browser;
    const results = {
        checks: [],
        screenshots: [],
        errors: []
    };

    try {
        console.log('🚀 Starting STR Visual Check...\n');
        
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: {
                width: 1920,
                height: 1080
            },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Monitor console
        page.on('console', msg => {
            if (msg.type() === 'error') {
                results.errors.push(msg.text());
                console.log('❌ Console error:', msg.text());
            }
        });

        // Navigate to the test file
        const filePath = path.join(__dirname, '../test-str-no-annual-chart.html');
        const fileUrl = `file://${filePath}`;
        
        console.log('📄 Opening test file...');
        console.log('   Path:', filePath);
        
        // Check if file exists
        try {
            await fs.access(filePath);
            console.log('✅ Test file found');
        } catch {
            console.error('❌ Test file not found!');
            return;
        }

        await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
        await wait(2000); // Wait for scripts to load
        
        // Take initial screenshot
        const screenshotPath1 = path.join(screenshotDir, '01-initial-page.png');
        await page.screenshot({ path: screenshotPath1, fullPage: true });
        results.screenshots.push(screenshotPath1);
        console.log('📸 Initial screenshot saved');

        // Click STR tab
        console.log('\n🔄 Clicking STR tab...');
        try {
            await page.evaluate(() => {
                const strTab = document.querySelector('[data-tab="str"]');
                if (strTab) {
                    strTab.click();
                    return true;
                }
                return false;
            });
            await wait(1500);
            console.log('✅ STR tab clicked');
        } catch (e) {
            console.log('❌ Could not click STR tab:', e.message);
        }

        // Take STR tab screenshot
        const screenshotPath2 = path.join(screenshotDir, '02-str-tab-active.png');
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        results.screenshots.push(screenshotPath2);
        console.log('📸 STR tab screenshot saved');

        console.log('\n🔍 Performing visual checks...\n');

        // 1. Check for Annual Revenue Chart (should NOT exist)
        const annualChartCheck = await page.evaluate(() => {
            const checks = {
                byId: !!document.querySelector('#annual-revenue-chart'),
                byCanvas: false,
                byTitle: false
            };
            
            // Check canvases
            document.querySelectorAll('canvas').forEach(canvas => {
                const container = canvas.closest('.chart-container');
                if (container && container.textContent.includes('Annual Revenue')) {
                    checks.byCanvas = true;
                }
            });
            
            // Check titles
            document.querySelectorAll('h4').forEach(h4 => {
                if (h4.textContent.includes('Annual Revenue Comparison')) {
                    checks.byTitle = true;
                }
            });
            
            return {
                found: checks.byId || checks.byCanvas || checks.byTitle,
                details: checks
            };
        });

        if (!annualChartCheck.found) {
            console.log('✅ Annual Revenue Chart is ABSENT (as expected)');
            results.checks.push({ name: 'Annual Chart Removal', status: 'PASS' });
        } else {
            console.log('❌ Annual Revenue Chart is PRESENT (should be removed)');
            console.log('   Details:', annualChartCheck.details);
            results.checks.push({ name: 'Annual Chart Removal', status: 'FAIL', details: annualChartCheck.details });
        }

        // 2. Check Financial Summary section
        const financialSummaryCheck = await page.evaluate(() => {
            const section = document.querySelector('.financial-summary');
            if (!section) return { exists: false };
            
            const rect = section.getBoundingClientRect();
            return {
                exists: true,
                visible: rect.height > 0 && rect.width > 0,
                dimensions: { width: rect.width, height: rect.height }
            };
        });

        if (financialSummaryCheck.exists && financialSummaryCheck.visible) {
            console.log('✅ Financial Summary section is PRESENT and VISIBLE');
            console.log(`   Dimensions: ${financialSummaryCheck.dimensions.width}x${financialSummaryCheck.dimensions.height}`);
            results.checks.push({ name: 'Financial Summary', status: 'PASS' });
            
            // Take screenshot of just this section
            const financialSummary = await page.$('.financial-summary');
            if (financialSummary) {
                const screenshotPath3 = path.join(screenshotDir, '03-financial-summary.png');
                await financialSummary.screenshot({ path: screenshotPath3 });
                results.screenshots.push(screenshotPath3);
            }
        } else {
            console.log('❌ Financial Summary section issue');
            results.checks.push({ name: 'Financial Summary', status: 'FAIL' });
        }

        // 3. Check Financial Calculator
        const calculatorCheck = await page.evaluate(() => {
            const calc = document.querySelector('.financial-calculator');
            if (!calc) return { exists: false };
            
            const styles = window.getComputedStyle(calc);
            const rect = calc.getBoundingClientRect();
            
            return {
                exists: true,
                visible: rect.height > 0 && rect.width > 0,
                styles: {
                    backgroundColor: styles.backgroundColor,
                    padding: styles.padding,
                    borderRadius: styles.borderRadius
                }
            };
        });

        if (calculatorCheck.exists && calculatorCheck.visible) {
            console.log('✅ Financial Calculator is PRESENT and STYLED');
            console.log('   Styles:', calculatorCheck.styles);
            results.checks.push({ name: 'Financial Calculator', status: 'PASS' });
            
            // Take screenshot
            const calculator = await page.$('.financial-calculator');
            if (calculator) {
                const screenshotPath4 = path.join(screenshotDir, '04-financial-calculator.png');
                await calculator.screenshot({ path: screenshotPath4 });
                results.screenshots.push(screenshotPath4);
            }
        } else {
            console.log('❌ Financial Calculator issue');
            results.checks.push({ name: 'Financial Calculator', status: 'FAIL' });
        }

        // 4. Check Key Metrics
        const metricsCheck = await page.evaluate(() => {
            const section = document.querySelector('.key-metrics');
            if (!section) return { exists: false };
            
            const cards = section.querySelectorAll('.metric-card');
            return {
                exists: true,
                cardCount: cards.length,
                cards: Array.from(cards).map(card => ({
                    title: card.querySelector('h4')?.textContent || '',
                    hasIndicator: !!card.querySelector('.metric-indicator')
                }))
            };
        });

        if (metricsCheck.exists && metricsCheck.cardCount > 0) {
            console.log(`✅ Key Metrics section has ${metricsCheck.cardCount} cards`);
            metricsCheck.cards.forEach(card => {
                console.log(`   - ${card.title} (indicator: ${card.hasIndicator ? 'YES' : 'NO'})`);
            });
            results.checks.push({ name: 'Key Metrics', status: 'PASS' });
            
            // Take screenshot
            const keyMetrics = await page.$('.key-metrics');
            if (keyMetrics) {
                const screenshotPath5 = path.join(screenshotDir, '05-key-metrics.png');
                await keyMetrics.screenshot({ path: screenshotPath5 });
                results.screenshots.push(screenshotPath5);
            }
        } else {
            console.log('❌ Key Metrics section issue');
            results.checks.push({ name: 'Key Metrics', status: 'FAIL' });
        }

        // 5. Check for visual gaps
        const layoutCheck = await page.evaluate(() => {
            const content = document.querySelector('#str-content');
            if (!content) return { hasContent: false };
            
            const children = Array.from(content.children).filter(el => 
                el.offsetHeight > 0 && !el.classList.contains('hidden')
            );
            
            const gaps = [];
            for (let i = 0; i < children.length - 1; i++) {
                const current = children[i].getBoundingClientRect();
                const next = children[i + 1].getBoundingClientRect();
                const gap = next.top - current.bottom;
                
                if (gap > 50) { // Flag gaps larger than 50px
                    gaps.push({
                        between: `${children[i].className} → ${children[i + 1].className}`,
                        gap: Math.round(gap) + 'px'
                    });
                }
            }
            
            return {
                hasContent: true,
                childCount: children.length,
                largeGaps: gaps
            };
        });

        if (layoutCheck.hasContent) {
            console.log(`\n📐 Layout Analysis:`);
            console.log(`   Visible sections: ${layoutCheck.childCount}`);
            
            if (layoutCheck.largeGaps.length === 0) {
                console.log('   ✅ No unusual gaps detected');
                results.checks.push({ name: 'Layout Spacing', status: 'PASS' });
            } else {
                console.log('   ⚠️  Large gaps found:');
                layoutCheck.largeGaps.forEach(gap => {
                    console.log(`      ${gap.between}: ${gap.gap}`);
                });
                results.checks.push({ name: 'Layout Spacing', status: 'WARNING', details: layoutCheck.largeGaps });
            }
        }

        // 6. Mobile responsive check
        console.log('\n📱 Testing mobile view...');
        await page.setViewport({ width: 375, height: 812 });
        await wait(1000);
        
        const screenshotPath6 = path.join(screenshotDir, '06-mobile-view.png');
        await page.screenshot({ path: screenshotPath6, fullPage: true });
        results.screenshots.push(screenshotPath6);
        console.log('📸 Mobile screenshot saved');

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 VISUAL TEST SUMMARY');
        console.log('='.repeat(60));
        
        const passed = results.checks.filter(c => c.status === 'PASS').length;
        const failed = results.checks.filter(c => c.status === 'FAIL').length;
        const warnings = results.checks.filter(c => c.status === 'WARNING').length;
        
        console.log(`Total Checks: ${results.checks.length}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Warnings: ${warnings}`);
        console.log(`🚨 Console Errors: ${results.errors.length}`);
        
        console.log(`\n📁 Screenshots saved to:\n   ${screenshotDir}`);
        
        // Save report
        const report = {
            timestamp,
            summary: { passed, failed, warnings, errors: results.errors.length },
            checks: results.checks,
            errors: results.errors,
            screenshots: results.screenshots
        };
        
        await fs.writeFile(
            path.join(screenshotDir, 'report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n✅ Test completed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
checkSTRTabVisuals().catch(console.error);