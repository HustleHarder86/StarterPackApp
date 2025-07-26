/**
 * Focused Mobile Responsiveness Test
 * Tests specific mobile fixes without auth dependencies
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:8000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'mobile-focused', new Date().toISOString().split('T')[0]);

async function ensureDir() {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

async function runFocusedTest() {
    console.log('🚀 Mobile Responsiveness Focused Test\n');
    await ensureDir();
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };
    
    try {
        // Test multiple viewports
        const viewports = [
            { name: 'iPhone-SE', width: 375, height: 667 },
            { name: 'Pixel-5', width: 393, height: 851 },
            { name: 'iPhone-14-Pro', width: 428, height: 926 }
        ];
        
        for (const vp of viewports) {
            console.log(`\n📱 Testing ${vp.name} (${vp.width}x${vp.height})`);
            
            const page = await browser.newPage();
            await page.setViewport(vp);
            
            // Navigate with E2E test mode
            await page.goto(`${BASE_URL}/roi-finder.html?e2e_test_mode=true`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            // Wait for content to load
            await page.waitForSelector('#property-input-section', { visible: true });
            
            const vpResult = {
                viewport: vp,
                checks: {}
            };
            
            // 1. Horizontal Scroll Check
            console.log('  ✓ Checking horizontal scroll...');
            const scrollCheck = await page.evaluate(() => {
                // Force a reflow to ensure accurate measurements
                document.body.offsetHeight;
                
                const docWidth = document.documentElement.scrollWidth;
                const clientWidth = document.documentElement.clientWidth;
                const bodyWidth = document.body.scrollWidth;
                
                // Find specific overflowing elements
                const overflowing = [];
                document.querySelectorAll('*').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.right > clientWidth || rect.width > clientWidth) {
                        overflowing.push({
                            selector: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : ''),
                            width: rect.width,
                            right: rect.right,
                            overflow: rect.right - clientWidth
                        });
                    }
                });
                
                return {
                    hasHorizontalScroll: docWidth > clientWidth,
                    documentWidth: docWidth,
                    viewportWidth: clientWidth,
                    bodyWidth: bodyWidth,
                    overflowX: window.getComputedStyle(document.body).overflowX,
                    htmlOverflowX: window.getComputedStyle(document.documentElement).overflowX,
                    overflowingElements: overflowing.slice(0, 3)
                };
            });
            
            vpResult.checks.horizontalScroll = scrollCheck;
            
            if (scrollCheck.hasHorizontalScroll) {
                console.log(`  ❌ Horizontal scroll detected: ${scrollCheck.documentWidth}px > ${scrollCheck.viewportWidth}px`);
                if (scrollCheck.overflowingElements.length > 0) {
                    console.log('  Overflowing elements:');
                    scrollCheck.overflowingElements.forEach(el => {
                        console.log(`    - ${el.selector}: ${el.overflow}px overflow`);
                    });
                }
            } else {
                console.log('  ✅ No horizontal scroll');
            }
            
            // Take screenshot
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, `${vp.name}_01_layout.png`),
                fullPage: true
            });
            
            // 2. Touch Target Check
            console.log('  ✓ Checking touch targets...');
            const touchTargets = await page.evaluate(() => {
                const MIN_SIZE = 44;
                const issues = [];
                
                // Check all interactive elements
                const selectors = ['button', 'a', 'input', 'select', 'textarea', '[onclick]'];
                const elements = document.querySelectorAll(selectors.join(','));
                
                elements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const styles = window.getComputedStyle(el);
                    
                    if (styles.display !== 'none' && 
                        styles.visibility !== 'hidden' && 
                        rect.width > 0 && 
                        rect.height > 0) {
                        
                        if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
                            issues.push({
                                element: el.tagName,
                                id: el.id,
                                text: (el.innerText || el.value || '').substring(0, 20),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                minDimension: Math.min(rect.width, rect.height)
                            });
                        }
                    }
                });
                
                return {
                    totalInteractive: elements.length,
                    belowMinimum: issues.length,
                    percentage: ((elements.length - issues.length) / elements.length * 100).toFixed(1),
                    topIssues: issues.sort((a, b) => a.minDimension - b.minDimension).slice(0, 5)
                };
            });
            
            vpResult.checks.touchTargets = touchTargets;
            
            if (touchTargets.belowMinimum > 0) {
                console.log(`  ⚠️  ${touchTargets.belowMinimum}/${touchTargets.totalInteractive} touch targets below 44px (${touchTargets.percentage}% OK)`);
                console.log('  Smallest targets:');
                touchTargets.topIssues.forEach(t => {
                    console.log(`    - ${t.element}${t.id ? '#' + t.id : ''}: ${t.width}x${t.height}px`);
                });
            } else {
                console.log(`  ✅ All ${touchTargets.totalInteractive} touch targets meet minimum size`);
            }
            
            // 3. Form Element Spacing
            console.log('  ✓ Checking form spacing...');
            
            // Expand optional fields
            await page.evaluate(() => {
                const btn = document.querySelector('button[onclick*="toggleOptionalFields"]');
                if (btn) btn.click();
            });
            await new Promise(r => setTimeout(r, 500));
            
            const formSpacing = await page.evaluate(() => {
                const form = document.querySelector('#property-analysis-form');
                if (!form) return null;
                
                const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
                const spacings = [];
                
                // Measure vertical spacing between consecutive inputs
                for (let i = 1; i < inputs.length; i++) {
                    const prev = inputs[i-1].getBoundingClientRect();
                    const curr = inputs[i].getBoundingClientRect();
                    const spacing = curr.top - prev.bottom;
                    spacings.push(spacing);
                }
                
                // Check input sizes
                const inputSizes = inputs.map(input => {
                    const rect = input.getBoundingClientRect();
                    return {
                        type: input.tagName,
                        height: rect.height,
                        width: rect.width,
                        fontSize: window.getComputedStyle(input).fontSize
                    };
                });
                
                return {
                    inputCount: inputs.length,
                    avgSpacing: spacings.length ? (spacings.reduce((a,b) => a+b) / spacings.length).toFixed(1) : 0,
                    minSpacing: spacings.length ? Math.min(...spacings) : 0,
                    maxSpacing: spacings.length ? Math.max(...spacings) : 0,
                    avgInputHeight: (inputSizes.reduce((a,b) => a + b.height, 0) / inputSizes.length).toFixed(1),
                    minInputHeight: Math.min(...inputSizes.map(s => s.height)),
                    fontSizes: [...new Set(inputSizes.map(s => s.fontSize))]
                };
            });
            
            vpResult.checks.formSpacing = formSpacing;
            
            console.log(`  📊 Form metrics:`);
            console.log(`     - ${formSpacing.inputCount} inputs`);
            console.log(`     - Avg spacing: ${formSpacing.avgSpacing}px`);
            console.log(`     - Avg height: ${formSpacing.avgInputHeight}px`);
            console.log(`     - Font sizes: ${formSpacing.fontSizes.join(', ')}`);
            
            // Take form screenshot
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, `${vp.name}_02_form.png`),
                fullPage: true
            });
            
            // 4. Container Overflow Check
            console.log('  ✓ Checking container overflow...');
            const containerCheck = await page.evaluate(() => {
                const containers = document.querySelectorAll('.container, .card, section, main');
                const issues = [];
                
                containers.forEach(container => {
                    const styles = window.getComputedStyle(container);
                    const rect = container.getBoundingClientRect();
                    
                    if (rect.width > window.innerWidth) {
                        issues.push({
                            selector: container.tagName + (container.id ? '#' + container.id : '') + (container.className ? '.' + container.className.split(' ')[0] : ''),
                            width: rect.width,
                            viewportWidth: window.innerWidth,
                            overflow: rect.width - window.innerWidth,
                            overflowX: styles.overflowX,
                            maxWidth: styles.maxWidth
                        });
                    }
                });
                
                return {
                    totalContainers: containers.length,
                    overflowing: issues.length,
                    issues: issues
                };
            });
            
            vpResult.checks.containerOverflow = containerCheck;
            
            if (containerCheck.overflowing > 0) {
                console.log(`  ❌ ${containerCheck.overflowing} containers overflowing`);
                containerCheck.issues.forEach(issue => {
                    console.log(`    - ${issue.selector}: ${issue.overflow}px overflow`);
                });
            } else {
                console.log(`  ✅ All ${containerCheck.totalContainers} containers within viewport`);
            }
            
            // 5. CSS Mobile Fixes Applied
            console.log('  ✓ Checking CSS fixes...');
            const cssCheck = await page.evaluate(() => {
                const html = document.documentElement;
                const body = document.body;
                
                return {
                    htmlOverflowX: window.getComputedStyle(html).overflowX,
                    bodyOverflowX: window.getComputedStyle(body).overflowX,
                    htmlMaxWidth: window.getComputedStyle(html).maxWidth,
                    bodyMaxWidth: window.getComputedStyle(body).maxWidth,
                    mobileFixesLoaded: !!document.querySelector('link[href*="mobile-fixes.css"]'),
                    viewportMeta: document.querySelector('meta[name="viewport"]')?.content
                };
            });
            
            vpResult.checks.cssFixes = cssCheck;
            
            console.log(`  📋 CSS status:`);
            console.log(`     - Mobile fixes CSS: ${cssCheck.mobileFixesLoaded ? '✅ Loaded' : '❌ Not loaded'}`);
            console.log(`     - Body overflow-x: ${cssCheck.bodyOverflowX}`);
            console.log(`     - Viewport meta: ${cssCheck.viewportMeta ? '✅' : '❌'}`);
            
            results.tests.push(vpResult);
            await page.close();
        }
        
        // Generate summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY\n');
        
        let totalPassed = 0;
        let totalFailed = 0;
        let totalWarnings = 0;
        
        results.tests.forEach(test => {
            console.log(`${test.viewport.name}:`);
            
            // Horizontal scroll
            if (!test.checks.horizontalScroll.hasHorizontalScroll) {
                console.log('  ✅ No horizontal scroll');
                totalPassed++;
            } else {
                console.log('  ❌ Has horizontal scroll');
                totalFailed++;
            }
            
            // Touch targets
            const touchPct = parseFloat(test.checks.touchTargets.percentage);
            if (touchPct === 100) {
                console.log('  ✅ All touch targets OK');
                totalPassed++;
            } else if (touchPct >= 90) {
                console.log(`  ⚠️  ${test.checks.touchTargets.percentage}% touch targets OK`);
                totalWarnings++;
            } else {
                console.log(`  ❌ Only ${test.checks.touchTargets.percentage}% touch targets OK`);
                totalFailed++;
            }
            
            // Container overflow
            if (test.checks.containerOverflow.overflowing === 0) {
                console.log('  ✅ No container overflow');
                totalPassed++;
            } else {
                console.log(`  ❌ ${test.checks.containerOverflow.overflowing} containers overflow`);
                totalFailed++;
            }
            
            console.log('');
        });
        
        console.log('TOTALS:');
        console.log(`  ✅ Passed: ${totalPassed}`);
        console.log(`  ❌ Failed: ${totalFailed}`);
        console.log(`  ⚠️  Warnings: ${totalWarnings}`);
        
        // Save detailed results
        await fs.writeFile(
            path.join(SCREENSHOT_DIR, 'results.json'),
            JSON.stringify(results, null, 2)
        );
        
        console.log(`\n📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
if (require.main === module) {
    runFocusedTest().catch(console.error);
}

module.exports = { runFocusedTest };