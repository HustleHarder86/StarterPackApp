const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const screenshotDir = path.join(__dirname, 'screenshots', 'comprehensive-user-test', timestamp);

async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        console.error('Error creating directory:', error);
    }
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name, description) {
    const filename = `${name}.png`;
    const filepath = path.join(screenshotDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot saved: ${name} - ${description}`);
    return filepath;
}

async function testApplication() {
    console.log('🚀 Starting Comprehensive User Test of StarterPackApp');
    console.log('📁 Screenshots will be saved to:', screenshotDir);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ Console Error:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('❌ Page Error:', error.message);
    });

    const results = {
        timestamp: new Date().toISOString(),
        url: 'https://starter-pack-kvr6zbo9n-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true',
        issues: {
            critical: [],
            high: [],
            medium: [],
            low: []
        },
        workingWell: [],
        recommendations: []
    };

    try {
        // 1. INITIAL LOAD & FORM SUBMISSION
        console.log('\n📋 Phase 1: Initial Load & Form Submission');
        console.log('========================================');
        
        await page.goto(results.url, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(3000);
        
        await takeScreenshot(page, '01-initial-load', 'Initial page load');

        // Check if form is visible
        const formVisible = await page.$('#property-form') !== null;
        if (formVisible) {
            console.log('✅ Property form is visible');
            results.workingWell.push('Property form loads correctly');

            // Fill the form
            console.log('📝 Filling property form...');
            
            // Address
            await page.type('#address', '123 King Street West, Toronto, ON, M5V 3A8');
            
            // Purchase Price
            await page.evaluate(() => {
                document.querySelector('#purchasePrice').value = '750000';
            });
            
            // Bedrooms
            await page.evaluate(() => {
                document.querySelector('#bedrooms').value = '2';
            });
            
            // Bathrooms
            await page.evaluate(() => {
                document.querySelector('#bathrooms').value = '2';
            });
            
            // Square Feet
            await page.evaluate(() => {
                document.querySelector('#squareFeet').value = '850';
            });
            
            // Property Type
            await page.select('#propertyType', 'condo');
            
            // Property Taxes
            await page.evaluate(() => {
                document.querySelector('#propertyTaxes').value = '4500';
            });
            
            // Condo Fees
            await page.evaluate(() => {
                document.querySelector('#condoFees').value = '650';
            });
            
            await takeScreenshot(page, '02-form-filled', 'Form filled with test data');
            
            // Submit the form
            console.log('🚀 Submitting form...');
            await page.click('#analyze-btn');
            
            // Wait for response
            await wait(5000);
            await takeScreenshot(page, '03-after-submit', 'After form submission');
            
            // Check for authentication modal or results
            const authModalVisible = await page.$('#authModal') !== null;
            const resultsVisible = await page.$('#results-section') !== null;
            
            if (authModalVisible) {
                console.log('🔐 Authentication modal appeared');
                results.issues.high.push('Form submission requires authentication - blocking user flow');
                await takeScreenshot(page, '04-auth-modal', 'Authentication modal');
                
                // Try to find and click sign-in option
                const signInBtn = await page.$('[data-action="signin"]');
                if (signInBtn) {
                    await signInBtn.click();
                    await wait(2000);
                    await takeScreenshot(page, '05-after-signin-click', 'After clicking sign in');
                }
            } else if (resultsVisible) {
                console.log('✅ Results section appeared');
                results.workingWell.push('Form submission works without authentication');
            } else {
                console.log('❌ Neither auth modal nor results appeared');
                results.issues.critical.push('Form submission does not produce any visible response');
            }
            
        } else {
            console.log('❌ Property form not found');
            results.issues.critical.push('Property form not visible on page load');
        }

        // 2. UI/UX TESTING - DESKTOP
        console.log('\n🎨 Phase 2: UI/UX Testing - Desktop View');
        console.log('========================================');
        
        // Check hero section
        const heroSection = await page.$('.hero-section');
        if (heroSection) {
            console.log('✅ Hero section present');
            results.workingWell.push('Hero section displays correctly');
            
            // Check Airbnb section position
            const airbnbSection = await page.$('.airbnb-hero');
            if (airbnbSection) {
                const position = await page.evaluate(() => {
                    const sections = document.querySelectorAll('.hero-section > div');
                    for (let i = 0; i < sections.length; i++) {
                        if (sections[i].classList.contains('airbnb-hero')) {
                            return i + 1;
                        }
                    }
                    return -1;
                });
                
                if (position === 2) {
                    console.log('✅ Airbnb section in position #2 as requested');
                    results.workingWell.push('Airbnb hero section correctly positioned at #2');
                } else {
                    console.log(`⚠️ Airbnb section in position ${position}, expected #2`);
                    results.issues.medium.push(`Airbnb section in position ${position}, should be #2`);
                }
            }
        }

        // Test hover states
        const buttons = await page.$$('button');
        console.log(`Found ${buttons.length} buttons to test`);
        
        // Check for broken images
        const brokenImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            return images.filter(img => !img.complete || img.naturalHeight === 0)
                .map(img => img.src);
        });
        
        if (brokenImages.length > 0) {
            console.log(`❌ Found ${brokenImages.length} broken images`);
            results.issues.high.push(`${brokenImages.length} broken images: ${brokenImages.join(', ')}`);
        } else {
            console.log('✅ All images loading correctly');
            results.workingWell.push('All images load successfully');
        }

        // 3. MOBILE RESPONSIVENESS
        console.log('\n📱 Phase 3: Mobile Responsiveness Testing');
        console.log('========================================');
        
        // Switch to mobile viewport
        await page.setViewport({ width: 375, height: 812 });
        await wait(2000);
        await takeScreenshot(page, '06-mobile-view', 'Mobile viewport (375x812)');
        
        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        if (hasHorizontalScroll) {
            console.log('❌ Horizontal scroll detected on mobile');
            results.issues.high.push('Horizontal scroll present on mobile view');
        } else {
            console.log('✅ No horizontal scroll on mobile');
            results.workingWell.push('Mobile view has no horizontal scroll');
        }

        // Check form visibility on mobile
        const formVisibleMobile = await page.evaluate(() => {
            const form = document.querySelector('#property-form');
            if (!form) return false;
            const rect = form.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        });
        
        if (formVisibleMobile) {
            console.log('✅ Form visible on mobile');
            results.workingWell.push('Form displays correctly on mobile');
        } else {
            console.log('❌ Form not properly visible on mobile');
            results.issues.critical.push('Form not visible or accessible on mobile');
        }

        // 4. FUNCTIONALITY TESTING
        console.log('\n⚙️ Phase 4: Functionality Testing');
        console.log('==================================');
        
        // Return to desktop view
        await page.setViewport({ width: 1280, height: 800 });
        
        // Check for expandable sections
        const expandables = await page.$$('[data-toggle], .accordion-header, .collapsible');
        console.log(`Found ${expandables.length} expandable elements`);
        
        if (expandables.length > 0) {
            for (let i = 0; i < Math.min(expandables.length, 3); i++) {
                await expandables[i].click();
                await wait(500);
            }
            await takeScreenshot(page, '07-expanded-sections', 'After expanding sections');
        }

        // Check for tooltips
        const tooltips = await page.$$('[data-tooltip], [title], .tooltip-trigger');
        console.log(`Found ${tooltips.length} elements with tooltips`);
        
        // 5. ERROR HANDLING
        console.log('\n🚨 Phase 5: Error Handling Testing');
        console.log('==================================');
        
        // Try submitting empty form
        await page.reload();
        await wait(2000);
        
        const analyzeBtn = await page.$('#analyze-btn');
        if (analyzeBtn) {
            await analyzeBtn.click();
            await wait(1000);
            
            // Check for validation messages
            const validationMessages = await page.evaluate(() => {
                const messages = [];
                const invalids = document.querySelectorAll(':invalid');
                invalids.forEach(el => {
                    if (el.validationMessage) {
                        messages.push(`${el.id || el.name}: ${el.validationMessage}`);
                    }
                });
                return messages;
            });
            
            if (validationMessages.length > 0) {
                console.log('✅ Form validation working');
                results.workingWell.push('Form validation prevents empty submission');
            } else {
                console.log('⚠️ No form validation messages');
                results.issues.medium.push('Form validation may not be working properly');
            }
            
            await takeScreenshot(page, '08-empty-form-submit', 'Empty form submission attempt');
        }

        // 6. PERFORMANCE OBSERVATIONS
        console.log('\n⚡ Phase 6: Performance Observations');
        console.log('====================================');
        
        // Check page load metrics
        const metrics = await page.metrics();
        console.log('Page metrics:', {
            'DOM nodes': metrics.Nodes,
            'JS Event Listeners': metrics.JSEventListeners,
            'Documents': metrics.Documents
        });
        
        if (metrics.Nodes > 1500) {
            results.issues.medium.push(`High DOM node count: ${metrics.Nodes} (consider optimizing)`);
        }

        // Generate summary
        const totalIssues = 
            results.issues.critical.length + 
            results.issues.high.length + 
            results.issues.medium.length + 
            results.issues.low.length;

        console.log('\n📊 TEST SUMMARY');
        console.log('===============');
        console.log(`✅ Working Well: ${results.workingWell.length} items`);
        console.log(`❌ Total Issues: ${totalIssues}`);
        console.log(`   - Critical: ${results.issues.critical.length}`);
        console.log(`   - High: ${results.issues.high.length}`);
        console.log(`   - Medium: ${results.issues.medium.length}`);
        console.log(`   - Low: ${results.issues.low.length}`);

        // Add recommendations based on findings
        if (results.issues.critical.length > 0) {
            results.recommendations.push('URGENT: Address critical issues blocking core functionality');
        }
        if (results.issues.high.includes('Form submission requires authentication - blocking user flow')) {
            results.recommendations.push('Consider allowing anonymous property analysis or clearer auth flow');
        }
        if (hasHorizontalScroll) {
            results.recommendations.push('Fix mobile layout to prevent horizontal scrolling');
        }
        
        results.recommendations.push('Add loading states for better user feedback');
        results.recommendations.push('Implement proper error messages for failed operations');
        results.recommendations.push('Consider adding a demo mode for new users');

        // Save detailed report
        const reportPath = path.join(screenshotDir, 'test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    } catch (error) {
        console.error('❌ Test error:', error);
        await takeScreenshot(page, 'error-state', `Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

// Run the test
testApplication().catch(console.error);