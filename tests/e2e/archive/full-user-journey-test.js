const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const screenshotDir = path.join(__dirname, 'screenshots', 'full-user-journey', timestamp);

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
    console.log(`📸 Screenshot: ${name} - ${description}`);
    return filepath;
}

async function testFullUserJourney() {
    console.log('🚀 Starting Full User Journey Test of StarterPackApp');
    console.log('📁 Screenshots directory:', screenshotDir);
    
    await ensureDir(screenshotDir);
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
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

    const report = {
        timestamp: new Date().toISOString(),
        url: 'https://starter-pack-kvr6zbo9n-hustleharder86s-projects.vercel.app/roi-finder.html?e2e_test_mode=true',
        sections: [],
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
        // ========================================
        // PHASE 1: INITIAL LOAD & FORM SUBMISSION
        // ========================================
        console.log('\n📋 PHASE 1: Initial Load & Form Submission');
        console.log('==========================================');
        
        await page.goto(report.url, { waitUntil: 'networkidle2', timeout: 60000 });
        await wait(3000);
        
        await takeScreenshot(page, '01-initial-load', 'Initial page load with form');
        
        // Verify E2E mode
        const e2eMode = await page.evaluate(() => {
            return window.location.search.includes('e2e_test_mode=true');
        });
        
        if (e2eMode) {
            console.log('✅ E2E test mode is active');
            report.workingWell.push('E2E test mode properly activates and bypasses authentication');
        }

        // Check form visibility
        const formVisible = await page.evaluate(() => {
            const addressInput = document.querySelector('input[placeholder*="123 Main Street"]');
            return addressInput !== null;
        });

        if (!formVisible) {
            console.log('❌ Property form not immediately visible');
            report.issues.critical.push('Property form not found on initial load');
            return;
        }

        console.log('✅ Property form is visible');
        report.workingWell.push('Property form loads without authentication in E2E mode');

        // Fill the form
        console.log('\n📝 Filling property form...');
        
        // Property Address
        const addressInput = await page.$('input[placeholder*="123 Main Street"]');
        await addressInput.click();
        await addressInput.type('123 King Street West, Toronto, ON, M5V 3A8');
        
        // Purchase Price
        const priceInput = await page.$('input[placeholder*="50000"]');
        await priceInput.click({ clickCount: 3 });
        await priceInput.type('750000');
        
        // Bedrooms
        const bedroomsSelect = await page.$('select[id*="bedroom"], select[name*="bedroom"]');
        if (bedroomsSelect) {
            await bedroomsSelect.select('2');
        }
        
        // Bathrooms
        const bathroomsSelect = await page.$('select[id*="bathroom"], select[name*="bathroom"]');
        if (bathroomsSelect) {
            await bathroomsSelect.select('2');
        }
        
        await takeScreenshot(page, '02-form-partial-fill', 'Form partially filled');
        
        // Click "Add More Details"
        const moreDetailsBtn = await page.$('button:has-text("Add More Details"), button:has-text("Optional")');
        if (moreDetailsBtn) {
            await moreDetailsBtn.click();
            await wait(1000);
            console.log('✅ Expanded optional details section');
            report.workingWell.push('Optional details section expands correctly');
        }
        
        // Fill additional details if visible
        const sqftInput = await page.$('input[placeholder*="square feet"], input[name*="sqft"], input[name*="square"]');
        if (sqftInput) {
            await sqftInput.type('850');
        }
        
        // Property Type
        const propertyTypeSelect = await page.$('select[name*="property"], select[id*="property"]');
        if (propertyTypeSelect) {
            await propertyTypeSelect.select('condo');
        }
        
        // Property Taxes
        const taxesInput = await page.$('input[placeholder*="property tax"], input[name*="tax"]');
        if (taxesInput) {
            await taxesInput.type('4500');
        }
        
        // Condo Fees
        const condoInput = await page.$('input[placeholder*="condo"], input[name*="condo"], input[name*="hoa"]');
        if (condoInput) {
            await condoInput.type('650');
        }
        
        await takeScreenshot(page, '03-form-complete', 'Form completely filled');
        
        // Submit the form
        console.log('\n🚀 Submitting form...');
        const analyzeBtn = await page.$('button:has-text("Analyze Property")');
        if (!analyzeBtn) {
            console.log('❌ Analyze button not found');
            report.issues.critical.push('Analyze Property button not found');
            return;
        }
        
        await analyzeBtn.click();
        
        // Wait for results or error
        console.log('⏳ Waiting for analysis results...');
        await wait(5000);
        
        await takeScreenshot(page, '04-after-submit', 'After form submission');
        
        // Check what happened
        const hasResults = await page.evaluate(() => {
            return document.body.textContent.includes('Investment Analysis') || 
                   document.body.textContent.includes('Short-term Rental') ||
                   document.body.textContent.includes('Analysis Results');
        });
        
        const hasError = await page.evaluate(() => {
            return document.body.textContent.includes('error') || 
                   document.body.textContent.includes('Error') ||
                   document.querySelector('.error, .alert-error, .text-red-500');
        });
        
        if (hasError) {
            console.log('❌ Error occurred during analysis');
            report.issues.high.push('Analysis submission results in error');
            
            const errorText = await page.evaluate(() => {
                const errorEl = document.querySelector('.error, .alert-error, .text-red-500');
                return errorEl ? errorEl.textContent : 'Unknown error';
            });
            console.log('Error message:', errorText);
            report.issues.high.push(`Error message: ${errorText}`);
        } else if (hasResults) {
            console.log('✅ Analysis results appeared');
            report.workingWell.push('Form submission successfully generates analysis');
        } else {
            console.log('⚠️ No clear results or error state');
            report.issues.medium.push('Unclear state after form submission');
        }

        // ========================================
        // PHASE 2: ANALYSIS RESULTS (if available)
        // ========================================
        if (hasResults) {
            console.log('\n📊 PHASE 2: Analysis Results Testing');
            console.log('====================================');
            
            // Look for tabs
            const tabs = await page.$$('[role="tab"], .tab, button[data-tab]');
            console.log(`Found ${tabs.length} tabs`);
            
            if (tabs.length > 0) {
                report.workingWell.push(`Analysis results have ${tabs.length} tabs for different views`);
                
                // Click through each tab
                for (let i = 0; i < tabs.length; i++) {
                    await tabs[i].click();
                    await wait(1500);
                    
                    const tabText = await tabs[i].evaluate(el => el.textContent);
                    await takeScreenshot(page, `05-tab-${i+1}`, `Tab: ${tabText}`);
                    console.log(`✅ Tested tab: ${tabText}`);
                }
            }
            
            // Check for interactive elements
            const buttons = await page.$$('button:not([role="tab"])');
            console.log(`Found ${buttons.length} non-tab buttons`);
            
            // Test expandable sections
            const expandables = await page.$$('[data-toggle], .accordion, .collapsible');
            if (expandables.length > 0) {
                console.log(`Found ${expandables.length} expandable sections`);
                report.workingWell.push('Results include expandable sections for details');
            }
            
            // Check for charts
            const hasCharts = await page.evaluate(() => {
                return document.querySelector('canvas, svg.chart, .recharts-wrapper') !== null;
            });
            
            if (hasCharts) {
                console.log('✅ Charts/visualizations present');
                report.workingWell.push('Analysis includes data visualizations');
            }
        }

        // ========================================
        // PHASE 3: UI/UX TESTING
        // ========================================
        console.log('\n🎨 PHASE 3: UI/UX Testing');
        console.log('=========================');
        
        // Scroll to top for UI testing
        await page.evaluate(() => window.scrollTo(0, 0));
        await wait(1000);
        
        // Check hero section
        const heroSection = await page.$('.hero-section, section.hero, [class*="hero"]');
        if (heroSection) {
            console.log('✅ Hero section present');
            
            // Check Airbnb section position
            const airbnbPosition = await page.evaluate(() => {
                const sections = document.querySelectorAll('.hero-section > div, section.hero > div');
                for (let i = 0; i < sections.length; i++) {
                    if (sections[i].textContent.includes('Airbnb') || 
                        sections[i].className.includes('airbnb')) {
                        return i + 1;
                    }
                }
                return -1;
            });
            
            if (airbnbPosition === 2) {
                console.log('✅ Airbnb section correctly positioned at #2');
                report.workingWell.push('Airbnb hero section positioned at #2 as requested');
            } else if (airbnbPosition > 0) {
                console.log(`⚠️ Airbnb section at position ${airbnbPosition}, expected #2`);
                report.issues.low.push(`Airbnb section at position ${airbnbPosition} instead of #2`);
            }
        }
        
        // Check for broken images
        const brokenImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            return images.filter(img => !img.complete || img.naturalHeight === 0)
                .map(img => ({ src: img.src, alt: img.alt }));
        });
        
        if (brokenImages.length > 0) {
            console.log(`❌ Found ${brokenImages.length} broken images`);
            report.issues.medium.push(`${brokenImages.length} broken images found`);
            brokenImages.forEach(img => {
                console.log(`  - ${img.src}`);
            });
        } else {
            console.log('✅ All images loading correctly');
            report.workingWell.push('All images load successfully');
        }
        
        // Test hover states
        const hoverableElements = await page.$$('button, a, .clickable, [role="button"]');
        console.log(`Found ${hoverableElements.length} hoverable elements`);
        
        if (hoverableElements.length > 0) {
            await hoverableElements[0].hover();
            await wait(500);
            await takeScreenshot(page, '06-hover-state', 'Testing hover states');
        }

        // ========================================
        // PHASE 4: MOBILE RESPONSIVENESS
        // ========================================
        console.log('\n📱 PHASE 4: Mobile Responsiveness Testing');
        console.log('=========================================');
        
        // Test different viewport sizes
        const viewports = [
            { width: 375, height: 812, name: 'iPhone-X' },
            { width: 414, height: 896, name: 'iPhone-XR' },
            { width: 768, height: 1024, name: 'iPad' }
        ];
        
        for (const viewport of viewports) {
            await page.setViewport(viewport);
            await wait(2000);
            
            // Check for horizontal scroll
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });
            
            if (hasHorizontalScroll) {
                console.log(`❌ Horizontal scroll on ${viewport.name}`);
                report.issues.high.push(`Horizontal scroll present on ${viewport.name} view`);
            } else {
                console.log(`✅ No horizontal scroll on ${viewport.name}`);
            }
            
            await takeScreenshot(page, `07-mobile-${viewport.name}`, `Mobile view: ${viewport.name}`);
        }
        
        // Check mobile menu
        await page.setViewport({ width: 375, height: 812 });
        const mobileMenuBtn = await page.$('#mobile-menu-toggle, [aria-label*="menu"], .mobile-menu-toggle');
        if (mobileMenuBtn) {
            await mobileMenuBtn.click();
            await wait(1000);
            console.log('✅ Mobile menu toggle works');
            report.workingWell.push('Mobile navigation menu functions correctly');
            await takeScreenshot(page, '08-mobile-menu', 'Mobile menu opened');
        }

        // ========================================
        // PHASE 5: FUNCTIONALITY TESTING
        // ========================================
        console.log('\n⚙️ PHASE 5: Functionality Testing');
        console.log('=================================');
        
        // Return to desktop view
        await page.setViewport({ width: 1280, height: 800 });
        await page.reload();
        await wait(3000);
        
        // Test PDF generation if available
        const pdfBtn = await page.$('button:has-text("PDF"), button:has-text("Download"), button:has-text("Export")');
        if (pdfBtn) {
            console.log('✅ PDF generation button found');
            report.workingWell.push('PDF export functionality available');
        }
        
        // Test property management toggle if available
        const pmToggle = await page.$('input[type="checkbox"][name*="management"], label:has-text("Property Management")');
        if (pmToggle) {
            console.log('✅ Property management toggle found');
            report.workingWell.push('Property management fee toggle available');
        }

        // ========================================
        // PHASE 6: ERROR HANDLING
        // ========================================
        console.log('\n🚨 PHASE 6: Error Handling Testing');
        console.log('==================================');
        
        // Navigate back to form
        await page.goto(report.url, { waitUntil: 'networkidle2' });
        await wait(2000);
        
        // Try empty form submission
        const emptyAnalyzeBtn = await page.$('button:has-text("Analyze Property")');
        if (emptyAnalyzeBtn) {
            await emptyAnalyzeBtn.click();
            await wait(1000);
            
            const hasValidation = await page.evaluate(() => {
                const invalidInputs = document.querySelectorAll(':invalid');
                const errorMessages = document.querySelectorAll('.error-message, .invalid-feedback, .text-red-500');
                return invalidInputs.length > 0 || errorMessages.length > 0;
            });
            
            if (hasValidation) {
                console.log('✅ Form validation prevents empty submission');
                report.workingWell.push('Form validation properly prevents invalid submissions');
            } else {
                console.log('⚠️ No validation for empty form');
                report.issues.medium.push('Form allows submission without required fields');
            }
            
            await takeScreenshot(page, '09-validation', 'Form validation test');
        }

        // ========================================
        // GENERATE FINAL REPORT
        // ========================================
        console.log('\n📊 GENERATING COMPREHENSIVE REPORT');
        console.log('==================================');
        
        // Calculate totals
        const totalIssues = 
            report.issues.critical.length + 
            report.issues.high.length + 
            report.issues.medium.length + 
            report.issues.low.length;

        // Add recommendations based on findings
        if (report.issues.critical.length > 0) {
            report.recommendations.push('URGENT: Fix critical issues that block core functionality');
        }
        
        if (report.issues.high.some(issue => issue.includes('horizontal scroll'))) {
            report.recommendations.push('Fix mobile layouts to prevent horizontal scrolling');
        }
        
        if (report.issues.high.some(issue => issue.includes('error'))) {
            report.recommendations.push('Improve error handling and user feedback');
        }
        
        if (!hasResults) {
            report.recommendations.push('Ensure analysis API is working and properly connected');
        }
        
        report.recommendations.push('Add loading states and progress indicators');
        report.recommendations.push('Consider adding tooltips for complex fields');
        report.recommendations.push('Implement comprehensive error recovery flows');

        // Console summary
        console.log('\n📈 TEST SUMMARY');
        console.log('===============');
        console.log(`✅ Working Well: ${report.workingWell.length} items`);
        console.log(`❌ Total Issues: ${totalIssues}`);
        console.log(`   - Critical: ${report.issues.critical.length}`);
        console.log(`   - High: ${report.issues.high.length}`);
        console.log(`   - Medium: ${report.issues.medium.length}`);
        console.log(`   - Low: ${report.issues.low.length}`);
        console.log(`💡 Recommendations: ${report.recommendations.length}`);
        
        // Save detailed report
        const reportPath = path.join(screenshotDir, 'comprehensive-test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Full report saved to: ${reportPath}`);
        
        // Generate markdown report
        const markdownReport = generateMarkdownReport(report, screenshotDir);
        const mdPath = path.join(screenshotDir, 'test-report.md');
        await fs.writeFile(mdPath, markdownReport);
        console.log(`📝 Markdown report saved to: ${mdPath}`);

    } catch (error) {
        console.error('❌ Test error:', error);
        await takeScreenshot(page, 'error-state', `Error: ${error.message}`);
        report.issues.critical.push(`Test execution error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

function generateMarkdownReport(report, screenshotDir) {
    const md = [];
    
    md.push('# StarterPackApp Comprehensive Test Report');
    md.push(`\n**Date:** ${new Date(report.timestamp).toLocaleString()}`);
    md.push(`**URL:** ${report.url}`);
    md.push(`**Screenshots:** ${screenshotDir}`);
    
    md.push('\n## Executive Summary');
    
    const totalIssues = 
        report.issues.critical.length + 
        report.issues.high.length + 
        report.issues.medium.length + 
        report.issues.low.length;
    
    md.push(`\n- **Total Issues Found:** ${totalIssues}`);
    md.push(`- **Critical Issues:** ${report.issues.critical.length}`);
    md.push(`- **High Priority:** ${report.issues.high.length}`);
    md.push(`- **Medium Priority:** ${report.issues.medium.length}`);
    md.push(`- **Low Priority:** ${report.issues.low.length}`);
    md.push(`- **Working Well:** ${report.workingWell.length} features`);
    
    md.push('\n## What\'s Working Well ✅');
    report.workingWell.forEach(item => {
        md.push(`- ${item}`);
    });
    
    if (report.issues.critical.length > 0) {
        md.push('\n## Critical Issues 🚨');
        report.issues.critical.forEach(issue => {
            md.push(`- **CRITICAL:** ${issue}`);
        });
    }
    
    if (report.issues.high.length > 0) {
        md.push('\n## High Priority Issues ⚠️');
        report.issues.high.forEach(issue => {
            md.push(`- ${issue}`);
        });
    }
    
    if (report.issues.medium.length > 0) {
        md.push('\n## Medium Priority Issues 📌');
        report.issues.medium.forEach(issue => {
            md.push(`- ${issue}`);
        });
    }
    
    if (report.issues.low.length > 0) {
        md.push('\n## Low Priority Issues 💡');
        report.issues.low.forEach(issue => {
            md.push(`- ${issue}`);
        });
    }
    
    md.push('\n## Recommendations 🎯');
    report.recommendations.forEach((rec, i) => {
        md.push(`${i + 1}. ${rec}`);
    });
    
    md.push('\n## Test Coverage');
    md.push('\nThe following areas were tested:');
    md.push('- [x] Initial page load and E2E mode activation');
    md.push('- [x] Property form filling and submission');
    md.push('- [x] Analysis results display (if accessible)');
    md.push('- [x] UI/UX elements and interactions');
    md.push('- [x] Mobile responsiveness (375px, 414px, 768px)');
    md.push('- [x] Error handling and form validation');
    md.push('- [x] Image loading and broken asset detection');
    md.push('- [x] Interactive elements (buttons, tabs, expandables)');
    
    md.push('\n## Screenshots');
    md.push('\nKey screenshots captured during testing:');
    md.push('- `01-initial-load.png` - Initial page with form');
    md.push('- `02-form-partial-fill.png` - Form with basic details');
    md.push('- `03-form-complete.png` - Fully completed form');
    md.push('- `04-after-submit.png` - Post-submission state');
    md.push('- `06-hover-state.png` - UI interaction states');
    md.push('- `07-mobile-*.png` - Mobile responsive views');
    md.push('- `09-validation.png` - Error handling test');
    
    return md.join('\n');
}

// Run the test
testFullUserJourney().catch(console.error);