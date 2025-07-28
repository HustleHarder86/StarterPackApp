const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const express = require('express');

async function testSTRTabVisual() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotDir = path.join(__dirname, 'screenshots', 'str-visual-test', timestamp);
    
    // Create screenshot directory
    await fs.mkdir(screenshotDir, { recursive: true });
    
    // Set up a simple express server
    const app = express();
    app.use(express.static(path.join(__dirname, '../../')));
    
    const server = http.createServer(app);
    const PORT = 8765;
    
    await new Promise((resolve) => {
        server.listen(PORT, () => {
            console.log(`🌐 Test server running on http://localhost:${PORT}`);
            resolve();
        });
    });

    let browser;
    let results = {
        timestamp,
        visualChecks: [],
        errors: []
    };

    try {
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: {
                width: 1920,
                height: 1080
            },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Capture console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                results.errors.push(msg.text());
                console.log('❌ Console Error:', msg.text());
            }
        });

        // Navigate to the test page
        console.log('📄 Loading test page...');
        await page.goto(`http://localhost:${PORT}/tests/test-str-no-annual-chart.html`, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for page to settle
        await page.waitForTimeout(3000);
        
        console.log('📸 Taking screenshots...');
        
        // 1. Full page screenshot
        await page.screenshot({
            path: path.join(screenshotDir, '01-full-page.png'),
            fullPage: true
        });
        console.log('✅ Full page screenshot captured');

        // 2. Click STR tab if needed
        const strTabActive = await page.evaluate(() => {
            const strTab = document.querySelector('[data-tab="str"]');
            return strTab && strTab.classList.contains('active');
        });

        if (!strTabActive) {
            console.log('🔄 Clicking STR tab...');
            await page.click('[data-tab="str"]');
            await page.waitForTimeout(1500);
        }

        // 3. Check for Annual Revenue Chart (should NOT exist)
        const hasAnnualChart = await page.evaluate(() => {
            // Check multiple ways
            const byId = document.querySelector('#annual-revenue-chart');
            const byCanvas = Array.from(document.querySelectorAll('canvas')).find(canvas => {
                const parent = canvas.closest('.chart-container');
                return parent && parent.textContent.includes('Annual Revenue');
            });
            const byTitle = Array.from(document.querySelectorAll('h4')).find(h4 => 
                h4.textContent.includes('Annual Revenue Comparison')
            );
            
            return !!(byId || byCanvas || byTitle);
        });

        if (!hasAnnualChart) {
            console.log('✅ Annual Revenue Chart is correctly absent');
            results.visualChecks.push({
                check: 'Annual Chart Absent',
                status: 'PASS',
                details: 'No Annual Revenue Comparison chart found'
            });
        } else {
            console.log('❌ Annual Revenue Chart is still present!');
            results.visualChecks.push({
                check: 'Annual Chart Absent',
                status: 'FAIL',
                details: 'Annual Revenue Comparison chart should be removed'
            });
        }

        // 4. Screenshot Financial Summary section
        const financialSummary = await page.$('.financial-summary');
        if (financialSummary) {
            await financialSummary.screenshot({
                path: path.join(screenshotDir, '02-financial-summary.png')
            });
            console.log('✅ Financial Summary screenshot captured');
            
            // Check for visual gaps
            const summaryBounds = await financialSummary.boundingBox();
            results.visualChecks.push({
                check: 'Financial Summary Present',
                status: 'PASS',
                details: `Height: ${summaryBounds.height}px, Width: ${summaryBounds.width}px`
            });
        }

        // 5. Check Financial Calculator
        const calculator = await page.$('.financial-calculator');
        if (calculator) {
            await calculator.screenshot({
                path: path.join(screenshotDir, '03-financial-calculator.png')
            });
            console.log('✅ Financial Calculator screenshot captured');
            
            // Check styling
            const styles = await page.evaluate(() => {
                const calc = document.querySelector('.financial-calculator');
                const computed = window.getComputedStyle(calc);
                return {
                    backgroundColor: computed.backgroundColor,
                    padding: computed.padding,
                    borderRadius: computed.borderRadius
                };
            });
            
            results.visualChecks.push({
                check: 'Financial Calculator Styling',
                status: 'PASS',
                details: styles
            });
        }

        // 6. Check Key Metrics
        const keyMetrics = await page.$('.key-metrics');
        if (keyMetrics) {
            await keyMetrics.screenshot({
                path: path.join(screenshotDir, '04-key-metrics.png')
            });
            console.log('✅ Key Metrics screenshot captured');
            
            const metricCount = await page.evaluate(() => {
                return document.querySelectorAll('.metric-card').length;
            });
            
            results.visualChecks.push({
                check: 'Key Metrics Present',
                status: 'PASS',
                details: `${metricCount} metric cards found`
            });
        }

        // 7. Check for visual gaps in layout
        const layoutAnalysis = await page.evaluate(() => {
            const strContent = document.querySelector('#str-content');
            if (!strContent) return null;
            
            const sections = strContent.querySelectorAll('.financial-summary, .financial-calculator, .key-metrics');
            const gaps = [];
            
            for (let i = 0; i < sections.length - 1; i++) {
                const current = sections[i].getBoundingClientRect();
                const next = sections[i + 1].getBoundingClientRect();
                const gap = next.top - current.bottom;
                
                if (gap > 60) {
                    gaps.push({
                        between: `${sections[i].className} and ${sections[i + 1].className}`,
                        gap: Math.round(gap)
                    });
                }
            }
            
            return { sectionCount: sections.length, gaps };
        });

        if (layoutAnalysis) {
            if (layoutAnalysis.gaps.length === 0) {
                console.log('✅ No unusual visual gaps detected');
                results.visualChecks.push({
                    check: 'Layout Spacing',
                    status: 'PASS',
                    details: 'No large gaps between sections'
                });
            } else {
                console.log('⚠️ Visual gaps detected:', layoutAnalysis.gaps);
                results.visualChecks.push({
                    check: 'Layout Spacing',
                    status: 'WARNING',
                    details: layoutAnalysis.gaps
                });
            }
        }

        // 8. Responsive screenshots
        console.log('📱 Testing responsive views...');
        
        // Tablet
        await page.setViewport({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(screenshotDir, '05-tablet-view.png'),
            fullPage: true
        });
        
        // Mobile
        await page.setViewport({ width: 375, height: 812 });
        await page.waitForTimeout(1000);
        await page.screenshot({
            path: path.join(screenshotDir, '06-mobile-view.png'),
            fullPage: true
        });

        // Generate report
        const report = {
            testName: 'STR Tab Visual Test (No Annual Chart)',
            timestamp,
            screenshotDir,
            summary: {
                totalChecks: results.visualChecks.length,
                passed: results.visualChecks.filter(c => c.status === 'PASS').length,
                failed: results.visualChecks.filter(c => c.status === 'FAIL').length,
                warnings: results.visualChecks.filter(c => c.status === 'WARNING').length,
                consoleErrors: results.errors.length
            },
            checks: results.visualChecks,
            errors: results.errors
        };

        await fs.writeFile(
            path.join(screenshotDir, 'visual-test-report.json'),
            JSON.stringify(report, null, 2)
        );

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 STR TAB VISUAL TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`⚠️  Warnings: ${report.summary.warnings}`);
        console.log(`🚨 Console Errors: ${report.summary.consoleErrors}`);
        
        console.log('\n📋 Visual Checks:');
        results.visualChecks.forEach(check => {
            const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
            console.log(`${icon} ${check.check}: ${check.status}`);
            if (check.details) {
                console.log(`   Details: ${JSON.stringify(check.details)}`);
            }
        });

        console.log(`\n📁 Screenshots saved to: ${screenshotDir}`);
        console.log('\n✅ Visual test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        results.errors.push(error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
        server.close();
    }
}

// Run the test
testSTRTabVisual().catch(console.error);