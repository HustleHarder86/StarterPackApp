const { chromium } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

class FocusedUIUXAuditor {
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
        const filename = `${name}-${Date.now()}.png`;
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

    async auditPage(url, pageName) {
        console.log(`\n🔍 Auditing ${pageName}: ${url}`);
        
        try {
            // Navigate to page
            await this.page.goto(url, { 
                waitUntil: 'networkidle',
                timeout: 15000 
            });

            // Wait for page to load
            await this.page.waitForTimeout(1000);

            // Capture initial desktop view
            await this.captureScreenshot(
                `${pageName}-desktop-initial`,
                `${pageName} initial desktop view (1280x720)`
            );

            // Test mobile responsiveness
            await this.page.setViewportSize({ width: 375, height: 667 });
            await this.page.waitForTimeout(500);
            await this.captureScreenshot(
                `${pageName}-mobile`,
                `${pageName} mobile view (375x667)`
            );

            // Reset to desktop
            await this.page.setViewportSize({ width: 1280, height: 720 });
            await this.page.waitForTimeout(500);

            // Analyze color scheme
            await this.analyzeColorScheme(pageName);
            
            // Check typography
            await this.analyzeTypography(pageName);
            
            // Test key interactions
            await this.testKeyInteractions(pageName);

            // Check visual hierarchy
            await this.checkVisualHierarchy(pageName);

            return { status: 'success', pageName, url };

        } catch (error) {
            this.issues.push({
                type: 'page_load_error',
                severity: 'critical',
                page: pageName,
                message: error.message
            });

            await this.captureScreenshot(
                `${pageName}-error`,
                `Error loading ${pageName}: ${error.message}`
            );

            return { status: 'error', pageName, url, error: error.message };
        }
    }

    async analyzeColorScheme(pageName) {
        try {
            const colorAnalysis = await this.page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const colors = {
                    backgrounds: new Set(),
                    texts: new Set(),
                    borders: new Set()
                };

                let totalElements = 0;
                
                elements.forEach(el => {
                    if (el.offsetParent !== null) { // Only visible elements
                        const computedStyle = window.getComputedStyle(el);
                        
                        if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                            colors.backgrounds.add(computedStyle.backgroundColor);
                        }
                        if (computedStyle.color !== 'rgba(0, 0, 0, 0)') {
                            colors.texts.add(computedStyle.color);
                        }
                        if (computedStyle.borderColor !== 'rgba(0, 0, 0, 0)') {
                            colors.borders.add(computedStyle.borderColor);
                        }
                        totalElements++;
                    }
                });

                return {
                    backgroundColors: Array.from(colors.backgrounds),
                    textColors: Array.from(colors.texts),
                    borderColors: Array.from(colors.borders),
                    totalElements
                };
            });

            // Check for excessive color variety
            const totalUniqueColors = colorAnalysis.backgroundColors.length + 
                                    colorAnalysis.textColors.length + 
                                    colorAnalysis.borderColors.length;

            if (totalUniqueColors > 15) {
                this.issues.push({
                    type: 'color_scheme',
                    severity: 'medium',
                    page: pageName,
                    message: `High color variety detected (${totalUniqueColors} unique colors). Consider using a more consistent color palette.`,
                    details: colorAnalysis
                });
            }

            console.log(`   🎨 Color analysis: ${totalUniqueColors} unique colors`);

        } catch (error) {
            console.log(`   ⚠️ Color analysis failed: ${error.message}`);
        }
    }

    async analyzeTypography(pageName) {
        try {
            const typography = await this.page.evaluate(() => {
                const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, input, label');
                const fonts = new Set();
                const fontSizes = new Set();
                const headingStructure = [];

                elements.forEach(el => {
                    if (el.offsetParent !== null) {
                        const computedStyle = window.getComputedStyle(el);
                        fonts.add(computedStyle.fontFamily);
                        fontSizes.add(computedStyle.fontSize);
                        
                        if (el.tagName.match(/^H[1-6]$/)) {
                            headingStructure.push({
                                tag: el.tagName,
                                text: el.textContent.trim().substring(0, 50)
                            });
                        }
                    }
                });

                return {
                    uniqueFonts: Array.from(fonts),
                    uniqueFontSizes: Array.from(fontSizes),
                    headingStructure: headingStructure
                };
            });

            if (typography.uniqueFonts.length > 3) {
                this.issues.push({
                    type: 'typography',
                    severity: 'medium',
                    page: pageName,
                    message: `Multiple font families detected (${typography.uniqueFonts.length}). Consider font consistency.`,
                    details: typography.uniqueFonts
                });
            }

            console.log(`   📝 Typography: ${typography.uniqueFonts.length} fonts, ${typography.uniqueFontSizes.length} sizes`);

        } catch (error) {
            console.log(`   ⚠️ Typography analysis failed: ${error.message}`);
        }
    }

    async testKeyInteractions(pageName) {
        try {
            // Find primary CTA buttons
            const ctaButtons = await this.page.$$('button, a[href*="roi-finder"], .btn, .button, [role="button"]');
            
            if (ctaButtons.length > 0) {
                console.log(`   🖱️ Found ${ctaButtons.length} interactive elements`);
                
                // Test hover state on first CTA
                await ctaButtons[0].hover();
                await this.page.waitForTimeout(300);
                await this.captureScreenshot(
                    `${pageName}-cta-hover`,
                    `${pageName} CTA button hover state`
                );

                // Test focus state
                await ctaButtons[0].focus();
                await this.page.waitForTimeout(300);
                await this.captureScreenshot(
                    `${pageName}-cta-focus`,
                    `${pageName} CTA button focus state`
                );
            }

            // Test form interactions if forms exist
            const forms = await this.page.$$('form');
            if (forms.length > 0) {
                console.log(`   📝 Found ${forms.length} forms`);
                
                const inputs = await this.page.$$('input[type="text"], input[type="email"], textarea');
                if (inputs.length > 0) {
                    await inputs[0].click();
                    await this.captureScreenshot(
                        `${pageName}-form-focus`,
                        `${pageName} form input focus state`
                    );
                }
            }

        } catch (error) {
            console.log(`   ⚠️ Interaction testing failed: ${error.message}`);
        }
    }

    async checkVisualHierarchy(pageName) {
        try {
            const hierarchy = await this.page.evaluate(() => {
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                const structure = [];
                
                headings.forEach(heading => {
                    if (heading.offsetParent !== null) {
                        const computedStyle = window.getComputedStyle(heading);
                        structure.push({
                            tag: heading.tagName,
                            fontSize: computedStyle.fontSize,
                            fontWeight: computedStyle.fontWeight,
                            text: heading.textContent.trim().substring(0, 30),
                            rect: heading.getBoundingClientRect()
                        });
                    }
                });

                return structure.sort((a, b) => a.rect.top - b.rect.top);
            });

            // Check for proper heading hierarchy
            if (hierarchy.length === 0) {
                this.issues.push({
                    type: 'visual_hierarchy',
                    severity: 'medium',
                    page: pageName,
                    message: 'No heading elements found. Consider adding proper heading structure for better SEO and accessibility.'
                });
            } else {
                const h1Count = hierarchy.filter(h => h.tag === 'H1').length;
                if (h1Count === 0) {
                    this.issues.push({
                        type: 'visual_hierarchy',
                        severity: 'high',
                        page: pageName,
                        message: 'No H1 heading found. Every page should have exactly one H1 for proper SEO.'
                    });
                } else if (h1Count > 1) {
                    this.issues.push({
                        type: 'visual_hierarchy',
                        severity: 'medium',
                        page: pageName,
                        message: `Multiple H1 headings found (${h1Count}). Consider using only one H1 per page.`
                    });
                }
            }

            console.log(`   📊 Visual hierarchy: ${hierarchy.length} headings`);

        } catch (error) {
            console.log(`   ⚠️ Visual hierarchy check failed: ${error.message}`);
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
            screenshots: this.screenshots,
            issues: this.issues,
            recommendations: this.generateRecommendations(),
            overallScore: this.calculateOverallScore()
        };

        // Save report
        const reportPath = path.join(this.screenshotDir, `focused-ui-ux-report-${this.timestamp}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyze issues and generate recommendations
        const issueTypes = [...new Set(this.issues.map(i => i.type))];

        if (issueTypes.includes('color_scheme')) {
            recommendations.push({
                category: 'Design System',
                priority: 'Medium',
                title: 'Standardize Color Palette',
                description: 'Consider creating a consistent color palette with primary, secondary, and accent colors.',
                impact: 'Improved visual consistency and brand recognition'
            });
        }

        if (issueTypes.includes('typography')) {
            recommendations.push({
                category: 'Typography',
                priority: 'Medium',
                title: 'Consolidate Font Usage',
                description: 'Limit to 2-3 font families maximum for better visual consistency.',
                impact: 'Cleaner design and faster page loading'
            });
        }

        if (issueTypes.includes('visual_hierarchy')) {
            recommendations.push({
                category: 'SEO & Accessibility',
                priority: 'High',
                title: 'Fix Heading Structure',
                description: 'Ensure proper H1-H6 hierarchy for better SEO and accessibility.',
                impact: 'Better search engine rankings and accessibility compliance'
            });
        }

        if (this.issues.filter(i => i.severity === 'critical').length > 0) {
            recommendations.push({
                category: 'Critical',
                priority: 'Critical',
                title: 'Fix Page Loading Issues',
                description: 'Address critical page loading errors that prevent proper functionality.',
                impact: 'Essential for basic site functionality'
            });
        }

        return recommendations;
    }

    calculateOverallScore() {
        const maxScore = 100;
        let deductions = 0;

        // Deduct points based on issue severity
        deductions += this.issues.filter(i => i.severity === 'critical').length * 25;
        deductions += this.issues.filter(i => i.severity === 'high').length * 15;
        deductions += this.issues.filter(i => i.severity === 'medium').length * 8;
        deductions += this.issues.filter(i => i.severity === 'low').length * 3;

        const score = Math.max(0, maxScore - deductions);
        
        let rating;
        if (score >= 90) rating = 'Excellent';
        else if (score >= 80) rating = 'Good';
        else if (score >= 70) rating = 'Fair';
        else if (score >= 60) rating = 'Poor';
        else rating = 'Critical Issues';

        return { score, rating, deductions };
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
            { url: `${baseUrl}/roi-finder.html`, name: 'roi-finder-page' }
        ];

        try {
            await this.setup();
            console.log('🚀 Starting focused UI/UX audit...\n');

            for (const pageConfig of pages) {
                await this.auditPage(pageConfig.url, pageConfig.name);
                await this.page.waitForTimeout(500); // Small delay between pages
            }

            console.log('\n📊 Generating audit report...');
            const report = await this.generateReport();

            console.log('\n✅ UI/UX Audit Complete!');
            console.log(`📸 Screenshots captured: ${report.summary.totalScreenshots}`);
            console.log(`🐛 Issues found: ${report.summary.totalIssues}`);
            console.log(`   - Critical: ${report.summary.criticalIssues}`);
            console.log(`   - High: ${report.summary.highIssues}`);
            console.log(`   - Medium: ${report.summary.mediumIssues}`);
            console.log(`   - Low: ${report.summary.lowIssues}`);
            console.log(`📈 Overall Score: ${report.overallScore.score}/100 (${report.overallScore.rating})`);
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
    const auditor = new FocusedUIUXAuditor();
    auditor.runAudit()
        .then(report => {
            console.log('\n🎉 Focused audit completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Audit failed:', error);
            process.exit(1);
        });
}

module.exports = FocusedUIUXAuditor;