/**
 * Mobile UI Validation Test
 * Comprehensive test for mobile responsiveness and error handling
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Test configuration
const BASE_URL = 'http://localhost:8000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'mobile-ui-test', new Date().toISOString().split('T')[0]);

// Mobile viewports to test
const VIEWPORTS = [
    { name: 'iPhone-SE', width: 375, height: 667 },
    { name: 'iPhone-12', width: 390, height: 844 },
    { name: 'Pixel-5', width: 393, height: 851 },
    { name: 'iPhone-14-Pro-Max', width: 430, height: 932 }
];

// Ensure screenshot directory exists
async function ensureDir() {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

// Take screenshot helper
async function screenshot(page, name) {
    const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 ${name}`);
    return filepath;
}

// Main test runner
async function runMobileUITests() {
    console.log('🚀 Starting Mobile UI Validation Tests\n');
    await ensureDir();
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const results = {
        timestamp: new Date().toISOString(),
        viewports: {},
        summary: {
            totalChecks: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        }
    };
    
    try {
        for (const viewport of VIEWPORTS) {
            console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            const page = await browser.newPage();
            await page.setViewport(viewport);
            
            // Use E2E test mode
            const url = `${BASE_URL}/roi-finder.html?e2e_test_mode=true`;
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            
            results.viewports[viewport.name] = {
                viewport: viewport,
                checks: {}
            };
            
            // 1. Check for horizontal scrolling
            console.log('  Checking horizontal scroll...');
            const horizontalScroll = await page.evaluate(() => {
                const docWidth = document.documentElement.scrollWidth;
                const viewWidth = window.innerWidth;
                return {
                    hasScroll: docWidth > viewWidth,
                    docWidth: docWidth,
                    viewWidth: viewWidth,
                    difference: docWidth - viewWidth
                };
            });
            
            results.viewports[viewport.name].checks.horizontalScroll = horizontalScroll;
            results.summary.totalChecks++;
            
            if (horizontalScroll.hasScroll) {
                console.log(`  ❌ Horizontal scroll detected (${horizontalScroll.difference}px overflow)`);
                results.summary.failed++;
                
                // Find overflowing elements
                const overflowing = await page.evaluate(() => {
                    const elements = [];
                    const vw = window.innerWidth;
                    
                    document.querySelectorAll('*').forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (rect.right > vw || rect.width > vw) {
                            elements.push({
                                tag: el.tagName,
                                id: el.id,
                                class: el.className,
                                width: rect.width,
                                right: rect.right,
                                overflow: rect.right - vw
                            });
                        }
                    });
                    
                    return elements.slice(0, 5); // Top 5 offenders
                });
                
                results.viewports[viewport.name].checks.overflowingElements = overflowing;
            } else {
                console.log('  ✅ No horizontal scroll');
                results.summary.passed++;
            }
            
            await screenshot(page, `${viewport.name}_01_initial`);
            
            // 2. Check touch target sizes
            console.log('  Checking touch targets...');
            const touchTargets = await page.evaluate(() => {
                const MIN_SIZE = 44;
                const buttons = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
                const small = [];
                
                buttons.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const styles = window.getComputedStyle(el);
                    
                    if (styles.display !== 'none' && styles.visibility !== 'hidden' && 
                        (rect.width < MIN_SIZE || rect.height < MIN_SIZE)) {
                        small.push({
                            tag: el.tagName,
                            text: el.innerText?.substring(0, 20) || el.value?.substring(0, 20),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height)
                        });
                    }
                });
                
                return {
                    total: buttons.length,
                    smallCount: small.length,
                    percentage: ((buttons.length - small.length) / buttons.length * 100).toFixed(1),
                    examples: small.slice(0, 3)
                };
            });
            
            results.viewports[viewport.name].checks.touchTargets = touchTargets;
            results.summary.totalChecks++;
            
            if (touchTargets.smallCount > 0) {
                console.log(`  ⚠️  ${touchTargets.smallCount} small touch targets (${touchTargets.percentage}% pass)`);
                results.summary.warnings++;
            } else {
                console.log(`  ✅ All touch targets meet 44x44px minimum`);
                results.summary.passed++;
            }
            
            // 3. Test form spacing
            console.log('  Checking form layout...');
            
            // Wait for property input section
            await page.waitForSelector('#property-input-section', { visible: true });
            
            // Show optional fields
            await page.evaluate(() => {
                const btn = document.querySelector('button[onclick*="toggleOptionalFields"]');
                if (btn) btn.click();
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const formMetrics = await page.evaluate(() => {
                const form = document.querySelector('#property-analysis-form');
                if (!form) return null;
                
                const inputs = form.querySelectorAll('input, select, textarea');
                const labels = form.querySelectorAll('label');
                
                // Check spacing between form groups
                const groups = form.querySelectorAll('.grid > div');
                const spacings = [];
                
                for (let i = 1; i < groups.length; i++) {
                    const prev = groups[i-1].getBoundingClientRect();
                    const curr = groups[i].getBoundingClientRect();
                    spacings.push(curr.top - prev.bottom);
                }
                
                return {
                    inputCount: inputs.length,
                    labelCount: labels.length,
                    avgSpacing: spacings.length ? (spacings.reduce((a,b) => a+b) / spacings.length).toFixed(1) : 0,
                    minSpacing: spacings.length ? Math.min(...spacings) : 0,
                    formWidth: form.getBoundingClientRect().width,
                    viewportWidth: window.innerWidth
                };
            });
            
            results.viewports[viewport.name].checks.formLayout = formMetrics;
            results.summary.totalChecks++;
            
            if (formMetrics && formMetrics.minSpacing >= 16) {
                console.log(`  ✅ Form spacing adequate (min: ${formMetrics.minSpacing}px)`);
                results.summary.passed++;
            } else {
                console.log(`  ⚠️  Form spacing may be too tight`);
                results.summary.warnings++;
            }
            
            await screenshot(page, `${viewport.name}_02_form_expanded`);
            
            // 4. Test form validation
            console.log('  Testing form validation...');
            
            // Clear and test empty required field
            await page.evaluate(() => {
                const priceInput = document.querySelector('#property-price');
                if (priceInput) {
                    priceInput.value = '';
                    priceInput.focus();
                }
            });
            
            await page.keyboard.press('Tab'); // Blur to trigger validation
            await new Promise(resolve => setTimeout(resolve, 600));
            
            const validationCheck = await page.evaluate(() => {
                const priceInput = document.querySelector('#property-price');
                const hasError = priceInput?.classList.contains('border-red-500');
                const errorMsg = document.querySelector('.error-message');
                
                return {
                    hasErrorClass: hasError,
                    hasErrorMessage: !!errorMsg,
                    errorText: errorMsg?.innerText
                };
            });
            
            results.viewports[viewport.name].checks.formValidation = validationCheck;
            results.summary.totalChecks++;
            
            if (validationCheck.hasErrorClass || validationCheck.hasErrorMessage) {
                console.log('  ✅ Form validation working');
                results.summary.passed++;
            } else {
                console.log('  ❌ Form validation not showing errors');
                results.summary.failed++;
            }
            
            await screenshot(page, `${viewport.name}_03_validation_error`);
            
            // 5. Test error handling UI
            console.log('  Testing error display...');
            
            // Navigate to login and test auth error
            await page.reload();
            await page.waitForSelector('#login-section', { visible: true });
            
            // Fill invalid credentials
            await page.type('#login-email', 'test@example.com');
            await page.type('#login-password', 'wrongpassword');
            await page.click('button[type="submit"]');
            
            // Wait for potential error
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const errorDisplay = await page.evaluate(() => {
                const authError = document.querySelector('#auth-error');
                const errorState = document.querySelector('#error-state:not(.hidden)');
                
                if (authError && !authError.classList.contains('hidden')) {
                    return {
                        type: 'auth',
                        visible: true,
                        hasMessage: !!document.querySelector('#auth-error-message')
                    };
                } else if (errorState) {
                    return {
                        type: 'general',
                        visible: true,
                        hasIcon: !!errorState.querySelector('.text-6xl'),
                        hasTitle: !!errorState.querySelector('h2'),
                        hasTroubleshooting: !!errorState.querySelector('.bg-gray-50'),
                        hasSupport: !!errorState.querySelector('a[href*="mailto"]')
                    };
                }
                
                return { visible: false };
            });
            
            results.viewports[viewport.name].checks.errorHandling = errorDisplay;
            results.summary.totalChecks++;
            
            if (errorDisplay.visible) {
                console.log('  ✅ Error handling UI displayed');
                results.summary.passed++;
            } else {
                console.log('  ⚠️  Error UI not detected (may be API dependent)');
                results.summary.warnings++;
            }
            
            await screenshot(page, `${viewport.name}_04_error_display`);
            
            await page.close();
        }
        
        // Generate summary report
        const report = generateReport(results);
        
        // Save results
        await fs.writeFile(
            path.join(SCREENSHOT_DIR, 'test-results.json'),
            JSON.stringify(results, null, 2)
        );
        
        await fs.writeFile(
            path.join(SCREENSHOT_DIR, 'test-report.md'),
            report
        );
        
        console.log(`\n📄 Report saved to: ${SCREENSHOT_DIR}/test-report.md`);
        console.log('\n' + '='.repeat(50));
        console.log(report);
        
    } catch (error) {
        console.error('❌ Test error:', error);
        results.summary.failed++;
    } finally {
        await browser.close();
    }
    
    return results.summary.failed === 0 ? 0 : 1;
}

// Generate markdown report
function generateReport(results) {
    const { summary } = results;
    const passRate = ((summary.passed / summary.totalChecks) * 100).toFixed(1);
    
    let report = `# Mobile UI Validation Test Report

**Date**: ${new Date(results.timestamp).toLocaleString()}
**Pass Rate**: ${passRate}%

## Summary

- ✅ Passed: ${summary.passed}
- ❌ Failed: ${summary.failed}
- ⚠️  Warnings: ${summary.warnings}
- 📊 Total Checks: ${summary.totalChecks}

## Results by Viewport

`;

    for (const [name, data] of Object.entries(results.viewports)) {
        report += `### ${name} (${data.viewport.width}x${data.viewport.height})\n\n`;
        
        // Horizontal scroll
        const hs = data.checks.horizontalScroll;
        report += `**Horizontal Scrolling**: ${hs.hasScroll ? '❌ DETECTED' : '✅ None'}\n`;
        if (hs.hasScroll) {
            report += `- Overflow: ${hs.difference}px\n`;
            if (data.checks.overflowingElements?.length) {
                report += `- Problem elements:\n`;
                data.checks.overflowingElements.forEach(el => {
                    report += `  - ${el.tag}${el.id ? '#' + el.id : ''}: ${el.overflow}px overflow\n`;
                });
            }
        }
        report += '\n';
        
        // Touch targets
        const tt = data.checks.touchTargets;
        report += `**Touch Targets**: ${tt.percentage}% meet 44x44px minimum\n`;
        if (tt.smallCount > 0) {
            report += `- ${tt.smallCount} elements too small\n`;
            if (tt.examples?.length) {
                report += `- Examples:\n`;
                tt.examples.forEach(ex => {
                    report += `  - ${ex.tag}: ${ex.width}x${ex.height}px "${ex.text || 'no text'}"\n`;
                });
            }
        }
        report += '\n';
        
        // Form layout
        const fl = data.checks.formLayout;
        if (fl) {
            report += `**Form Layout**:\n`;
            report += `- Input fields: ${fl.inputCount}\n`;
            report += `- Average spacing: ${fl.avgSpacing}px\n`;
            report += `- Minimum spacing: ${fl.minSpacing}px\n`;
            report += `- Form width: ${fl.formWidth}px (viewport: ${fl.viewportWidth}px)\n`;
        }
        report += '\n';
        
        // Validation
        const fv = data.checks.formValidation;
        report += `**Form Validation**: ${fv.hasErrorClass || fv.hasErrorMessage ? '✅ Working' : '❌ Not working'}\n`;
        if (fv.errorText) {
            report += `- Error message: "${fv.errorText}"\n`;
        }
        report += '\n';
        
        // Error handling
        const eh = data.checks.errorHandling;
        report += `**Error Handling**: ${eh.visible ? '✅ Displayed' : '⚠️  Not visible'}\n`;
        if (eh.visible && eh.type === 'general') {
            report += `- Has icon: ${eh.hasIcon ? '✅' : '❌'}\n`;
            report += `- Has title: ${eh.hasTitle ? '✅' : '❌'}\n`;
            report += `- Has troubleshooting: ${eh.hasTroubleshooting ? '✅' : '❌'}\n`;
            report += `- Has support info: ${eh.hasSupport ? '✅' : '❌'}\n`;
        }
        report += '\n---\n\n';
    }
    
    // Add recommendations
    report += `## Recommendations\n\n`;
    
    if (summary.failed > 0 || summary.warnings > 0) {
        report += `Based on the test results, consider the following improvements:\n\n`;
        
        // Check for common issues
        const hasHorizontalScroll = Object.values(results.viewports).some(v => v.checks.horizontalScroll?.hasScroll);
        const hasSmallTargets = Object.values(results.viewports).some(v => v.checks.touchTargets?.smallCount > 0);
        
        if (hasHorizontalScroll) {
            report += `1. **Fix Horizontal Scrolling**:\n`;
            report += `   - Add \`overflow-x: hidden\` to containers\n`;
            report += `   - Check for fixed-width elements\n`;
            report += `   - Use \`max-width: 100%\` on images and tables\n\n`;
        }
        
        if (hasSmallTargets) {
            report += `2. **Improve Touch Targets**:\n`;
            report += `   - Set \`min-height: 44px\` on all buttons and inputs\n`;
            report += `   - Increase padding on small elements\n`;
            report += `   - Group small actions into larger touch areas\n\n`;
        }
        
        report += `3. **General Mobile Improvements**:\n`;
        report += `   - Test with real devices when possible\n`;
        report += `   - Consider thumb-friendly button placement\n`;
        report += `   - Ensure forms are easy to fill on small screens\n`;
    } else {
        report += `🎉 All tests passed! The mobile UI is working well.\n`;
    }
    
    return report;
}

// Run the tests
if (require.main === module) {
    runMobileUITests().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runMobileUITests };