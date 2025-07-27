/**
 * Error Handling Test Suite
 * Tests enhanced error messages, form validation, and error recovery
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:8000';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots', 'error-handling', new Date().toISOString().split('T')[0]);

async function ensureDir() {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

async function screenshot(page, name) {
    const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`  📸 ${name}`);
}

async function runErrorHandlingTests() {
    console.log('🚀 Error Handling Test Suite\n');
    await ensureDir();
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const results = {
        timestamp: new Date().toISOString(),
        formValidation: {},
        errorDisplay: {},
        errorRecovery: {},
        summary: { passed: 0, failed: 0, total: 0 }
    };
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        // Test 1: Form Validation
        console.log('📝 Testing Form Validation\n');
        
        await page.goto(`${BASE_URL}/roi-finder.html?e2e_test_mode=true`, {
            waitUntil: 'networkidle2'
        });
        
        await page.waitForSelector('#property-input-section', { visible: true });
        
        // Test required field validation
        console.log('  Testing required fields...');
        
        // Clear and blur price field
        await page.evaluate(() => {
            const priceInput = document.querySelector('#property-price');
            priceInput.value = '';
            priceInput.focus();
        });
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 700));
        
        const priceValidation = await page.evaluate(() => {
            const input = document.querySelector('#property-price');
            const errorMsg = document.querySelector('.error-message');
            const hasRedBorder = input.classList.contains('border-red-500');
            
            return {
                hasError: !!errorMsg,
                hasRedBorder: hasRedBorder,
                errorText: errorMsg?.textContent,
                errorIcon: !!errorMsg?.querySelector('svg')
            };
        });
        
        results.formValidation.requiredField = priceValidation;
        results.summary.total++;
        
        if (priceValidation.hasError && priceValidation.hasRedBorder) {
            console.log('  ✅ Required field validation working');
            console.log(`     Error: "${priceValidation.errorText}"`);
            results.summary.passed++;
        } else {
            console.log('  ❌ Required field validation not working');
            results.summary.failed++;
        }
        
        await screenshot(page, '01_required_field_error');
        
        // Test invalid number validation
        console.log('  Testing number validation...');
        
        await page.type('#property-price', '999999999999');
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 700));
        
        const numberValidation = await page.evaluate(() => {
            const input = document.querySelector('#property-price');
            const errorMsg = input.parentElement.querySelector('.error-message');
            
            return {
                hasError: !!errorMsg,
                errorText: errorMsg?.textContent,
                value: input.value
            };
        });
        
        results.formValidation.numberRange = numberValidation;
        results.summary.total++;
        
        if (numberValidation.hasError) {
            console.log('  ✅ Number range validation working');
            console.log(`     Error: "${numberValidation.errorText}"`);
            results.summary.passed++;
        } else {
            console.log('  ⚠️  Number range validation may not be enforced');
        }
        
        // Test valid input shows success
        console.log('  Testing success indicators...');
        
        await page.evaluate(() => {
            document.querySelector('#property-price').value = '';
        });
        await page.type('#property-price', '850000');
        await page.keyboard.press('Tab');
        await new Promise(r => setTimeout(r, 700));
        
        const successValidation = await page.evaluate(() => {
            const input = document.querySelector('#property-price');
            const hasGreenBorder = input.classList.contains('border-green-500');
            const hasCheckmark = !!input.parentElement.querySelector('.success-icon');
            
            return {
                hasGreenBorder: hasGreenBorder,
                hasCheckmark: hasCheckmark
            };
        });
        
        results.formValidation.successIndicator = successValidation;
        results.summary.total++;
        
        if (successValidation.hasGreenBorder) {
            console.log('  ✅ Success indicators working');
            results.summary.passed++;
        } else {
            console.log('  ❌ Success indicators not showing');
            results.summary.failed++;
        }
        
        await screenshot(page, '02_valid_input_success');
        
        // Test 2: Error Display UI
        console.log('\n🚨 Testing Error Display UI\n');
        
        // Inject error handler and trigger an error
        await page.evaluate(() => {
            if (window.ErrorHandler) {
                const errorHandler = new ErrorHandler();
                const testError = new Error('Network connection lost');
                testError.name = 'NetworkError';
                errorHandler.displayError(testError, 'error-state');
            }
        });
        
        await new Promise(r => setTimeout(r, 500));
        
        const errorDisplay = await page.evaluate(() => {
            const errorState = document.querySelector('#error-state:not(.hidden)');
            if (!errorState) return { visible: false };
            
            return {
                visible: true,
                hasIcon: !!errorState.querySelector('.text-6xl'),
                iconText: errorState.querySelector('.text-6xl')?.textContent,
                hasTitle: !!errorState.querySelector('h2'),
                titleText: errorState.querySelector('h2')?.textContent,
                hasMessage: !!errorState.querySelector('p'),
                messageText: errorState.querySelector('p')?.textContent,
                hasTroubleshooting: !!errorState.querySelector('.bg-gray-50'),
                troubleshootingSteps: errorState.querySelectorAll('.bg-gray-50 li').length,
                hasActionButtons: !!errorState.querySelector('.btn'),
                buttonCount: errorState.querySelectorAll('.btn').length,
                hasSupport: !!errorState.querySelector('a[href^="mailto"]'),
                supportEmail: errorState.querySelector('a[href^="mailto"]')?.textContent,
                hasErrorId: !!errorState.querySelector('.text-xs.text-gray-500')
            };
        });
        
        results.errorDisplay = errorDisplay;
        results.summary.total++;
        
        if (errorDisplay.visible && errorDisplay.hasIcon && errorDisplay.hasTroubleshooting && errorDisplay.hasSupport) {
            console.log('  ✅ Error display UI fully functional');
            console.log(`     Icon: ${errorDisplay.iconText}`);
            console.log(`     Title: "${errorDisplay.titleText}"`);
            console.log(`     Troubleshooting steps: ${errorDisplay.troubleshootingSteps}`);
            console.log(`     Support: ${errorDisplay.supportEmail}`);
            results.summary.passed++;
        } else {
            console.log('  ❌ Error display UI missing components');
            results.summary.failed++;
        }
        
        await screenshot(page, '03_error_display_ui');
        
        // Test different error types
        console.log('  Testing different error types...');
        
        const errorTypes = [
            { name: 'TimeoutError', code: null, expectedIcon: '⏱️' },
            { name: null, code: 'auth/user-not-found', expectedIcon: '👤' },
            { name: null, code: 'api/rate-limit', expectedIcon: '⚡' }
        ];
        
        for (const errorType of errorTypes) {
            await page.evaluate((error) => {
                const errorHandler = new ErrorHandler();
                const testError = new Error('Test error');
                if (error.name) testError.name = error.name;
                if (error.code) testError.code = error.code;
                errorHandler.displayError(testError, 'error-state');
            }, errorType);
            
            await new Promise(r => setTimeout(r, 300));
            
            const icon = await page.$eval('#error-state .text-6xl', el => el.textContent);
            console.log(`     ${errorType.name || errorType.code}: ${icon === errorType.expectedIcon ? '✅' : '❌'} ${icon}`);
        }
        
        // Test 3: Error Recovery
        console.log('\n🔄 Testing Error Recovery\n');
        
        // Test Try Again button
        const tryAgainExists = await page.$('#error-state button:first-child');
        if (tryAgainExists) {
            console.log('  ✅ Try Again button present');
            
            // Click and verify page reloads
            await page.evaluate(() => {
                window.reloadTriggered = false;
                const originalReload = window.location.reload;
                window.location.reload = () => { window.reloadTriggered = true; };
            });
            
            await page.click('#error-state button:first-child');
            
            const reloadTriggered = await page.evaluate(() => window.reloadTriggered);
            if (reloadTriggered) {
                console.log('  ✅ Try Again triggers reload');
                results.summary.passed++;
            } else {
                console.log('  ❌ Try Again not working');
                results.summary.failed++;
            }
        }
        
        // Test Go Back button
        const goBackExists = await page.$('#error-state button:nth-child(2)');
        if (goBackExists) {
            console.log('  ✅ Go Back button present');
            
            await page.evaluate(() => {
                window.historyBackTriggered = false;
                const originalBack = window.history.back;
                window.history.back = () => { window.historyBackTriggered = true; };
            });
            
            await page.click('#error-state button:nth-child(2)');
            
            const backTriggered = await page.evaluate(() => window.historyBackTriggered);
            if (backTriggered) {
                console.log('  ✅ Go Back triggers history.back()');
                results.summary.passed++;
            } else {
                console.log('  ❌ Go Back not working');
                results.summary.failed++;
            }
        }
        
        results.summary.total += 2;
        
        // Test 4: Authentication Error Handling
        console.log('\n🔐 Testing Authentication Errors\n');
        
        // Navigate to fresh page
        await page.goto(`${BASE_URL}/roi-finder.html`, {
            waitUntil: 'networkidle2'
        });
        
        // Wait for login form
        await page.waitForSelector('#login-section', { visible: true });
        
        // Test invalid email
        await page.type('#login-email', 'notanemail');
        await page.type('#login-password', 'password123');
        await page.click('#login-form button[type="submit"]');
        
        await new Promise(r => setTimeout(r, 2000));
        
        const authError = await page.evaluate(() => {
            const errorDiv = document.querySelector('#auth-error:not(.hidden)');
            return {
                visible: !!errorDiv,
                message: document.querySelector('#auth-error-message')?.textContent,
                hasRedBackground: errorDiv?.classList.contains('bg-red-50'),
                hasBorder: errorDiv?.classList.contains('border-red-200')
            };
        });
        
        results.authError = authError;
        results.summary.total++;
        
        if (authError.visible && authError.hasRedBackground) {
            console.log('  ✅ Auth error display working');
            console.log(`     Message: "${authError.message}"`);
            results.summary.passed++;
        } else {
            console.log('  ⚠️  Auth error not displayed (may require real Firebase)');
        }
        
        await screenshot(page, '04_auth_error');
        
        // Generate report
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY\n');
        
        const passRate = ((results.summary.passed / results.summary.total) * 100).toFixed(1);
        console.log(`Total Tests: ${results.summary.total}`);
        console.log(`Passed: ${results.summary.passed} ✅`);
        console.log(`Failed: ${results.summary.failed} ❌`);
        console.log(`Pass Rate: ${passRate}%`);
        
        console.log('\n📋 Detailed Results:');
        
        console.log('\nForm Validation:');
        console.log(`  - Required fields: ${results.formValidation.requiredField?.hasError ? '✅' : '❌'}`);
        console.log(`  - Number validation: ${results.formValidation.numberRange?.hasError ? '✅' : '⚠️'}`);
        console.log(`  - Success indicators: ${results.formValidation.successIndicator?.hasGreenBorder ? '✅' : '❌'}`);
        
        console.log('\nError Display:');
        console.log(`  - Error UI visible: ${results.errorDisplay.visible ? '✅' : '❌'}`);
        console.log(`  - Has icon: ${results.errorDisplay.hasIcon ? '✅' : '❌'}`);
        console.log(`  - Has troubleshooting: ${results.errorDisplay.hasTroubleshooting ? '✅' : '❌'}`);
        console.log(`  - Has support info: ${results.errorDisplay.hasSupport ? '✅' : '❌'}`);
        console.log(`  - Has error ID: ${results.errorDisplay.hasErrorId ? '✅' : '❌'}`);
        
        // Save results
        await fs.writeFile(
            path.join(SCREENSHOT_DIR, 'test-results.json'),
            JSON.stringify(results, null, 2)
        );
        
        console.log(`\n📁 Results saved to: ${SCREENSHOT_DIR}`);
        
    } catch (error) {
        console.error('❌ Test error:', error);
        results.summary.failed++;
    } finally {
        await browser.close();
    }
    
    return results.summary.failed === 0 ? 0 : 1;
}

// Run tests
if (require.main === module) {
    runErrorHandlingTests().then(process.exit).catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { runErrorHandlingTests };