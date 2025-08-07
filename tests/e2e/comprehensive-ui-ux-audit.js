const { chromium } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

class UIUXAuditor {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshots = [];
        this.issues = [];
        this.recommendations = [];
        this.screenshotDir = path.join(__dirname, 'screenshots', 'ux-audit');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    }

    async setup() {
        this.browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Configure viewport for desktop testing
        await this.page.setViewportSize({ width: 1280, height: 720 });
        
        // Setup console and error logging
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.issues.push({
                    type: 'console_error',
                    severity: 'medium',
                    message: msg.text(),
                    location: msg.location()
                });
            }
        });

        this.page.on('pageerror', (error) => {
            this.issues.push({
                type: 'page_error',
                severity: 'high',
                message: error.message,
                stack: error.stack
            });
        });
    }

    async captureScreenshot(name, description) {
        const filename = `${this.timestamp}-${name}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        
        await this.page.screenshot({ 
            path: filepath, 
            fullPage: true 
        });
        
        this.screenshots.push({
            name,
            description,
            filename,
            filepath,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📸 Screenshot captured: ${name}`);
        return filepath;
    }

    async testResponsiveDesign(pageName) {
        const viewports = [
            { name: 'mobile', width: 375, height: 667 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'desktop', width: 1280, height: 720 },
            { name: 'wide', width: 1920, height: 1080 }
        ];

        for (const viewport of viewports) {
            await this.page.setViewportSize(viewport);
            await this.page.waitForTimeout(500); // Allow for responsive adjustments
            await this.captureScreenshot(
                `${pageName}-${viewport.name}-${viewport.width}x${viewport.height}`,
                `${pageName} responsive view at ${viewport.width}x${viewport.height}`
            );
        }

        // Reset to desktop for further testing
        await this.page.setViewportSize({ width: 1280, height: 720 });
    }

    async analyzePage(url, pageName) {
        console.log(`\n🔍 Testing ${pageName}: ${url}`);
        
        try {
            // Navigate to page
            await this.page.goto(url, { 
                waitUntil: 'networkidle',
                timeout: 30000 
            });

            // Wait for page to fully load
            await this.page.waitForTimeout(2000);

            // Capture initial state
            await this.captureScreenshot(
                `${pageName}-initial`,
                `Initial load of ${pageName}`
            );

            // Test responsive design
            await this.testResponsiveDesign(pageName);

            // Analyze accessibility
            await this.checkAccessibility(pageName);

            // Test interactive elements
            await this.testInteractiveElements(pageName);

            // Check visual consistency
            await this.checkVisualConsistency(pageName);

            // Test loading states if applicable
            await this.testLoadingStates(pageName);

            return {
                status: 'success',
                url,
                pageName,
                issues: this.issues.filter(issue => issue.page === pageName),
                screenshots: this.screenshots.filter(shot => shot.name.includes(pageName))
            };

        } catch (error) {
            this.issues.push({
                type: 'page_load_error',
                severity: 'critical',
                page: pageName,
                message: error.message,
                stack: error.stack
            });

            await this.captureScreenshot(
                `${pageName}-error`,
                `Error state for ${pageName}: ${error.message}`
            );

            return {
                status: 'error',
                url,
                pageName,
                error: error.message
            };
        }
    }

    async checkAccessibility(pageName) {
        try {
            // Check for alt text on images
            const imagesWithoutAlt = await this.page.$$eval('img:not([alt])', imgs => imgs.length);
            if (imagesWithoutAlt > 0) {
                this.issues.push({
                    type: 'accessibility',
                    severity: 'medium',
                    page: pageName,
                    message: `${imagesWithoutAlt} images missing alt text`
                });
            }

            // Check for proper heading hierarchy
            const headings = await this.page.$$eval('h1, h2, h3, h4, h5, h6', headings => 
                headings.map(h => ({
                    tag: h.tagName.toLowerCase(),
                    text: h.textContent.trim()
                }))
            );

            // Check for form labels
            const inputsWithoutLabels = await this.page.$$eval('input:not([aria-label]):not([aria-labelledby])', inputs => {
                return inputs.filter(input => {
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    return !label && input.type !== 'hidden' && input.type !== 'submit';
                }).length;
            });

            if (inputsWithoutLabels > 0) {
                this.issues.push({
                    type: 'accessibility',
                    severity: 'high',
                    page: pageName,
                    message: `${inputsWithoutLabels} form inputs missing proper labels`
                });
            }

        } catch (error) {
            console.log(`⚠️ Accessibility check failed for ${pageName}: ${error.message}`);
        }
    }

    async testInteractiveElements(pageName) {
        try {
            // Find all clickable elements
            const buttons = await this.page.$$('button, [role="button"], a, input[type="submit"], input[type="button"]');
            
            console.log(`Found ${buttons.length} interactive elements on ${pageName}`);

            // Test hover states
            for (let i = 0; i < Math.min(buttons.length, 10); i++) { // Limit to first 10 to avoid too many screenshots
                try {
                    await buttons[i].hover();
                    await this.page.waitForTimeout(200);
                    
                    // Capture hover state
                    await this.captureScreenshot(
                        `${pageName}-hover-${i+1}`,
                        `Hover state for interactive element ${i+1} on ${pageName}`
                    );
                } catch (error) {
                    // Skip if element is not hoverable
                    continue;
                }
            }

            // Test form interactions
            await this.testFormElements(pageName);

        } catch (error) {
            console.log(`⚠️ Interactive element testing failed for ${pageName}: ${error.message}`);
        }
    }

    async testFormElements(pageName) {
        try {
            const forms = await this.page.$$('form');
            
            for (const form of forms) {
                // Find inputs in this form
                const inputs = await form.$$('input[type="text"], input[type="email"], textarea, select');
                
                // Test form validation
                for (const input of inputs) {
                    try {
                        // Clear and focus input
                        await input.click();
                        await input.fill('');
                        
                        // Try to submit to trigger validation
                        const submitButton = await form.$('input[type="submit"], button[type="submit"], button:not([type])');
                        if (submitButton) {
                            await submitButton.click();
                            await this.page.waitForTimeout(500);
                            
                            // Capture validation state
                            await this.captureScreenshot(
                                `${pageName}-validation`,
                                `Form validation state on ${pageName}`
                            );
                        }
                    } catch (error) {
                        // Continue with other forms
                        continue;
                    }
                    break; // Only test first input to avoid too many screenshots
                }
            }

        } catch (error) {
            console.log(`⚠️ Form testing failed for ${pageName}: ${error.message}`);
        }
    }

    async checkVisualConsistency(pageName) {
        try {
            // Check for consistent color usage
            const colors = await this.page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const colorSet = new Set();
                
                elements.forEach(el => {
                    const computedStyle = window.getComputedStyle(el);
                    if (computedStyle.color !== 'rgba(0, 0, 0, 0)') {
                        colorSet.add(computedStyle.color);
                    }
                    if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        colorSet.add(computedStyle.backgroundColor);
                    }
                });
                
                return Array.from(colorSet);
            });

            // Check font consistency
            const fonts = await this.page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const fontSet = new Set();
                
                elements.forEach(el => {
                    const computedStyle = window.getComputedStyle(el);
                    fontSet.add(computedStyle.fontFamily);
                });
                
                return Array.from(fontSet);
            });

            // Report if too many different colors/fonts (potential inconsistency)
            if (colors.length > 20) {
                this.issues.push({
                    type: 'visual_consistency',
                    severity: 'low',
                    page: pageName,
                    message: `High color variety detected (${colors.length} unique colors) - consider design system consistency`
                });
            }

            if (fonts.length > 5) {
                this.issues.push({
                    type: 'visual_consistency',
                    severity: 'medium',
                    page: pageName,
                    message: `Multiple font families detected (${fonts.length}) - consider font consistency`
                });
            }

        } catch (error) {
            console.log(`⚠️ Visual consistency check failed for ${pageName}: ${error.message}`);
        }
    }

    async testLoadingStates(pageName) {
        try {
            // Look for loading indicators, spinners, etc.
            const loadingElements = await this.page.$$('.loading, .spinner, [data-loading], .progress');
            
            if (loadingElements.length > 0) {
                console.log(`Found ${loadingElements.length} loading indicators on ${pageName}`);
                
                await this.captureScreenshot(
                    `${pageName}-loading-states`,
                    `Loading states visible on ${pageName}`
                );
            }

        } catch (error) {
            console.log(`⚠️ Loading state testing failed for ${pageName}: ${error.message}`);
        }
    }

    async testSpecificPageFeatures(pageName, url) {
        if (pageName.includes('roi-finder')) {
            await this.testROIFinderFeatures();
        } else if (pageName.includes('index') || pageName.includes('landing')) {
            await this.testLandingPageFeatures();
        }
    }

    async testROIFinderFeatures() {
        try {
            console.log('🏠 Testing ROI Finder specific features...');

            // Look for property input form
            const propertyForm = await this.page.$('form, .property-form, [data-form="property"]');
            if (propertyForm) {
                // Test form interactions
                const addressInput = await this.page.$('input[name*="address"], input[placeholder*="address"], #address');
                if (addressInput) {
                    await addressInput.fill('123 Test Street, Toronto, ON');
                    await this.captureScreenshot(
                        'roi-finder-form-filled',
                        'ROI Finder form with sample address'
                    );
                }

                // Test other common inputs
                const priceInput = await this.page.$('input[name*="price"], input[placeholder*="price"]');
                if (priceInput) {
                    await priceInput.fill('500000');
                }

                await this.captureScreenshot(
                    'roi-finder-form-complete',
                    'ROI Finder form with all fields filled'
                );
            }

            // Look for tabs or navigation
            const tabs = await this.page.$$('.tab, [role="tab"], .nav-item');
            if (tabs.length > 0) {
                console.log(`Found ${tabs.length} tabs/navigation items`);
                
                for (let i = 0; i < Math.min(tabs.length, 5); i++) {
                    try {
                        await tabs[i].click();
                        await this.page.waitForTimeout(1000);
                        await this.captureScreenshot(
                            `roi-finder-tab-${i+1}`,
                            `ROI Finder tab ${i+1} active`
                        );
                    } catch (error) {
                        continue;
                    }
                }
            }

        } catch (error) {
            console.log(`⚠️ ROI Finder specific testing failed: ${error.message}`);
        }
    }

    async testLandingPageFeatures() {
        try {
            console.log('🏡 Testing Landing Page specific features...');

            // Test hero section
            const heroSection = await this.page.$('.hero, .jumbotron, header, .banner');
            if (heroSection) {
                await this.captureScreenshot(
                    'landing-hero-section',
                    'Landing page hero section'
                );
            }

            // Test call-to-action buttons
            const ctaButtons = await this.page.$$('a[href*="roi-finder"], button:has-text("Get Started"), a:has-text("Start"), .cta-button');
            if (ctaButtons.length > 0) {
                console.log(`Found ${ctaButtons.length} CTA buttons`);
                
                // Test first CTA hover state
                await ctaButtons[0].hover();
                await this.page.waitForTimeout(300);
                await this.captureScreenshot(
                    'landing-cta-hover',
                    'Landing page CTA button hover state'
                );
            }

            // Test navigation
            const navigation = await this.page.$('nav, .navbar, .navigation');
            if (navigation) {
                await this.captureScreenshot(
                    'landing-navigation',
                    'Landing page navigation'
                );
            }

        } catch (error) {
            console.log(`⚠️ Landing page specific testing failed: ${error.message}`);
        }
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalScreenshots: this.screenshots.length,
                totalIssues: this.issues.length,
                criticalIssues: this.issues.filter(i => i.severity === 'critical').length,
                highIssues: this.issues.filter(i => i.severity === 'high').length,
                mediumIssues: this.issues.filter(i => i.severity === 'medium').length,
                lowIssues: this.issues.filter(i => i.severity === 'low').length
            },
            pages: {},
            screenshots: this.screenshots,
            issues: this.issues,
            recommendations: this.recommendations
        };

        // Group issues by page
        for (const issue of this.issues) {
            if (!report.pages[issue.page]) {
                report.pages[issue.page] = {
                    issues: [],
                    screenshots: []
                };
            }
            report.pages[issue.page].issues.push(issue);
        }

        // Group screenshots by page
        for (const screenshot of this.screenshots) {
            const pageName = screenshot.name.split('-')[1] || 'unknown';
            if (!report.pages[pageName]) {
                report.pages[pageName] = {
                    issues: [],
                    screenshots: []
                };
            }
            report.pages[pageName].screenshots.push(screenshot);
        }

        // Generate recommendations
        this.generateRecommendations(report);

        // Save report
        const reportPath = path.join(this.screenshotDir, `ui-ux-audit-report-${this.timestamp}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    generateRecommendations(report) {
        // Accessibility recommendations
        const accessibilityIssues = this.issues.filter(i => i.type === 'accessibility').length;
        if (accessibilityIssues > 0) {
            this.recommendations.push({
                category: 'Accessibility',
                priority: 'High',
                title: 'Improve Accessibility Compliance',
                description: `Found ${accessibilityIssues} accessibility issues. Consider implementing ARIA labels, alt text for images, and proper form labeling.`,
                impact: 'Better user experience for users with disabilities and improved SEO.'
            });
        }

        // Visual consistency recommendations
        const visualIssues = this.issues.filter(i => i.type === 'visual_consistency').length;
        if (visualIssues > 0) {
            this.recommendations.push({
                category: 'Design System',
                priority: 'Medium',
                title: 'Establish Consistent Design System',
                description: 'Multiple font families and color variations detected. Consider creating a unified design system.',
                impact: 'More professional appearance and better brand consistency.'
            });
        }

        // Error handling recommendations
        const errorIssues = this.issues.filter(i => i.type === 'page_error' || i.type === 'console_error').length;
        if (errorIssues > 0) {
            this.recommendations.push({
                category: 'Technical',
                priority: 'High',
                title: 'Fix JavaScript Errors',
                description: `Found ${errorIssues} JavaScript errors that may impact user experience.`,
                impact: 'Improved stability and user experience.'
            });
        }

        report.recommendations = this.recommendations;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runAudit() {
        const baseUrl = 'http://localhost:3000';
        const pages = [
            { url: baseUrl, name: 'landing-page' },
            { url: `${baseUrl}/roi-finder.html`, name: 'roi-finder' },
            { url: `${baseUrl}/contact.html`, name: 'contact' },
            { url: `${baseUrl}/blog.html`, name: 'blog' }
        ];

        try {
            await this.setup();
            console.log('🚀 Starting comprehensive UI/UX audit...');

            const results = [];
            for (const pageConfig of pages) {
                const result = await this.analyzePage(pageConfig.url, pageConfig.name);
                await this.testSpecificPageFeatures(pageConfig.name, pageConfig.url);
                results.push(result);
                
                // Small delay between pages
                await this.page.waitForTimeout(1000);
            }

            console.log('\n📊 Generating comprehensive report...');
            const report = await this.generateReport();

            console.log('\n✅ UI/UX Audit Complete!');
            console.log(`📸 Screenshots: ${report.summary.totalScreenshots}`);
            console.log(`🐛 Issues found: ${report.summary.totalIssues}`);
            console.log(`💡 Recommendations: ${report.recommendations.length}`);

            return report;

        } catch (error) {
            console.error('❌ Audit failed:', error.message);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the audit if this script is executed directly
if (require.main === module) {
    const auditor = new UIUXAuditor();
    auditor.runAudit()
        .then(report => {
            console.log('\n🎉 Audit completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Audit failed:', error);
            process.exit(1);
        });
}

module.exports = UIUXAuditor;