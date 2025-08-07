const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComprehensiveUXTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            javascriptErrors: [],
            colorPalette: new Set(),
            accessibilityIssues: [],
            visualHierarchy: {},
            buttonStyles: [],
            formInteractions: [],
            spacingIssues: [],
            loadingElements: [],
            typography: {},
            animations: [],
            mobileIssues: [],
            screenshots: []
        };
        this.screenshotDir = path.join(__dirname, 'test-screenshots', new Date().toISOString().slice(0, 19));
    }

    async init() {
        // Create screenshot directory
        fs.mkdirSync(this.screenshotDir, { recursive: true });
        
        this.browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Listen for console messages and errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.testResults.javascriptErrors.push(msg.text());
            }
        });
        
        this.page.on('pageerror', error => {
            this.testResults.javascriptErrors.push(error.message);
        });
    }

    async takeScreenshot(name, description = '') {
        const filename = `${name}-${Date.now()}.png`;
        const filepath = path.join(this.screenshotDir, filename);
        await this.page.screenshot({ path: filepath, fullPage: true });
        this.testResults.screenshots.push({
            name,
            description,
            filepath,
            timestamp: new Date().toISOString()
        });
        console.log(`Screenshot taken: ${filename} - ${description}`);
        return filepath;
    }

    async testBasicPageLoad() {
        console.log('Testing basic page load...');
        
        // Navigate to the page
        await this.page.goto('http://localhost:3002/roi-finder.html', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        await this.takeScreenshot('01-initial-load', 'Initial page load');
        
        // Check if page loaded properly
        const title = await this.page.title();
        console.log(`Page title: ${title}`);
        
        // Wait a bit more for any lazy loading
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return title;
    }

    async analyzeColorPalette() {
        console.log('Analyzing color palette...');
        
        const colors = await this.page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const colorSet = new Set();
            
            elements.forEach(el => {
                const computed = window.getComputedStyle(el);
                const bgColor = computed.backgroundColor;
                const color = computed.color;
                const borderColor = computed.borderColor;
                
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    colorSet.add(bgColor);
                }
                if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
                    colorSet.add(color);
                }
                if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && borderColor !== 'transparent') {
                    colorSet.add(borderColor);
                }
            });
            
            return Array.from(colorSet);
        });
        
        this.testResults.colorPalette = new Set(colors);
        console.log(`Found ${colors.length} unique colors`);
        
        return colors;
    }

    async testAccessibilityFeatures() {
        console.log('Testing accessibility features...');
        
        // Check for skip navigation
        const skipNav = await this.page.$('[data-skip-nav], .skip-nav, a[href="#main-content"]');
        if (!skipNav) {
            this.testResults.accessibilityIssues.push('No skip navigation found');
        }
        
        // Check ARIA labels
        const elementsNeedingAria = await this.page.$$('button, input, select, textarea');
        for (const element of elementsNeedingAria) {
            const ariaLabel = await element.evaluate(el => el.getAttribute('aria-label'));
            const ariaLabelledBy = await element.evaluate(el => el.getAttribute('aria-labelledby'));
            const id = await element.evaluate(el => el.id);
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            
            if (!ariaLabel && !ariaLabelledBy && tagName === 'button') {
                const textContent = await element.evaluate(el => el.textContent.trim());
                if (!textContent) {
                    this.testResults.accessibilityIssues.push(`Button without accessible name found: ${id || 'no id'}`);
                }
            }
        }
        
        // Check form labels
        const inputs = await this.page.$$('input, select, textarea');
        for (const input of inputs) {
            const id = await input.evaluate(el => el.id);
            const type = await input.evaluate(el => el.type);
            
            if (id && type !== 'hidden') {
                const label = await this.page.$(`label[for="${id}"]`);
                const ariaLabel = await input.evaluate(el => el.getAttribute('aria-label'));
                const ariaLabelledBy = await input.evaluate(el => el.getAttribute('aria-labelledby'));
                
                if (!label && !ariaLabel && !ariaLabelledBy) {
                    this.testResults.accessibilityIssues.push(`Input without label: ${id}`);
                }
            }
        }
        
        await this.takeScreenshot('02-accessibility-check', 'Accessibility features check');
    }

    async testVisualHierarchy() {
        console.log('Testing visual hierarchy...');
        
        const hierarchy = await this.page.evaluate(() => {
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const headingData = [];
            
            headings.forEach(h => {
                const style = window.getComputedStyle(h);
                headingData.push({
                    tagName: h.tagName,
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    margin: style.margin,
                    textContent: h.textContent.substring(0, 50)
                });
            });
            
            return headingData;
        });
        
        this.testResults.visualHierarchy = hierarchy;
        console.log(`Found ${hierarchy.length} headings`);
        
        await this.takeScreenshot('03-visual-hierarchy', 'Visual hierarchy analysis');
    }

    async testButtonStyles() {
        console.log('Testing button styles and hover effects...');
        
        const buttons = await this.page.$$('button, .btn, [role="button"]');
        
        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
            const button = buttons[i];
            
            // Get initial styles
            const initialStyles = await button.evaluate(el => {
                const style = window.getComputedStyle(el);
                return {
                    backgroundColor: style.backgroundColor,
                    color: style.color,
                    border: style.border,
                    borderRadius: style.borderRadius,
                    padding: style.padding,
                    fontSize: style.fontSize,
                    transition: style.transition
                };
            });
            
            try {
                // Test hover state
                await button.hover();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const hoverStyles = await button.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return {
                        backgroundColor: style.backgroundColor,
                        color: style.color,
                        transform: style.transform,
                        boxShadow: style.boxShadow
                    };
                });
                
                this.testResults.buttonStyles.push({
                    index: i,
                    initial: initialStyles,
                    hover: hoverStyles,
                    hasTransition: initialStyles.transition !== 'all 0s ease 0s'
                });
            } catch (error) {
                console.log(`Skipping button ${i} (not hoverable): ${error.message}`);
                this.testResults.buttonStyles.push({
                    index: i,
                    initial: initialStyles,
                    hover: initialStyles, // Use initial styles if hover fails
                    hasTransition: initialStyles.transition !== 'all 0s ease 0s',
                    error: 'Could not test hover state'
                });
            }
            
            if (i === 0) {
                await this.takeScreenshot('04-button-hover', 'Button hover state');
            }
        }
        
        console.log(`Tested ${Math.min(buttons.length, 10)} buttons`);
    }

    async testFormInteractions() {
        console.log('Testing form interactions...');
        
        const forms = await this.page.$$('form');
        const inputs = await this.page.$$('input, select, textarea');
        
        // Test first few inputs
        for (let i = 0; i < Math.min(inputs.length, 5); i++) {
            const input = inputs[i];
            const type = await input.evaluate(el => el.type);
            const id = await input.evaluate(el => el.id);
            
            if (type !== 'hidden' && type !== 'submit') {
                try {
                    // Focus the input
                    await input.focus();
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Check focus styles
                    const focusStyles = await input.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        return {
                            outline: style.outline,
                            boxShadow: style.boxShadow,
                            borderColor: style.borderColor
                        };
                    });
                    
                    // Type some test data
                    if (type === 'text' || type === 'number') {
                        await input.type(type === 'number' ? '123' : 'Test input');
                    }
                    
                    this.testResults.formInteractions.push({
                        id,
                        type,
                        focusStyles,
                        hasFocusIndicator: focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none'
                    });
                } catch (error) {
                    console.log(`Skipping input ${id} (focus failed): ${error.message}`);
                    this.testResults.formInteractions.push({
                        id,
                        type,
                        focusStyles: { outline: 'unknown', boxShadow: 'unknown', borderColor: 'unknown' },
                        hasFocusIndicator: false,
                        error: 'Could not focus input'
                    });
                }
            }
        }
        
        if (inputs.length > 0) {
            await this.takeScreenshot('05-form-interaction', 'Form interaction testing');
        }
        
        console.log(`Tested ${Math.min(inputs.length, 5)} form inputs`);
    }

    async checkSpacingAndAlignment() {
        console.log('Checking spacing and alignment...');
        
        const spacingIssues = await this.page.evaluate(() => {
            const issues = [];
            const elements = document.querySelectorAll('*');
            
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                
                // Check for elements that might be overlapping
                if (rect.width > 0 && rect.height > 0) {
                    const zIndex = style.zIndex;
                    const position = style.position;
                    
                    // Check for inconsistent margins
                    const marginTop = parseFloat(style.marginTop);
                    const marginBottom = parseFloat(style.marginBottom);
                    
                    if (marginTop > 100 || marginBottom > 100) {
                        issues.push({
                            element: el.tagName + (el.className && typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''),
                            issue: 'Large margin detected',
                            marginTop,
                            marginBottom
                        });
                    }
                }
            });
            
            return issues.slice(0, 10); // Limit to first 10 issues
        });
        
        this.testResults.spacingIssues = spacingIssues;
        console.log(`Found ${spacingIssues.length} spacing issues`);
        
        await this.takeScreenshot('06-spacing-alignment', 'Spacing and alignment check');
    }

    async checkLoadingElements() {
        console.log('Checking for loading skeletons and animations...');
        
        const loadingElements = await this.page.evaluate(() => {
            const skeletons = document.querySelectorAll('.skeleton, .loading, [data-loading], .shimmer');
            const animations = [];
            
            // Check for CSS animations
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const animation = style.animation;
                const transition = style.transition;
                
                if (animation !== 'none' && animation !== '') {
                    animations.push({
                        element: el.tagName + (el.className && typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''),
                        animation
                    });
                }
            });
            
            return {
                skeletons: skeletons.length,
                animations: animations.slice(0, 10)
            };
        });
        
        this.testResults.loadingElements = loadingElements;
        console.log(`Found ${loadingElements.skeletons} skeleton elements and ${loadingElements.animations.length} animations`);
    }

    async testTypography() {
        console.log('Testing typography consistency...');
        
        const typography = await this.page.evaluate(() => {
            const fontSizes = new Set();
            const fontFamilies = new Set();
            const fontWeights = new Set();
            const lineHeights = new Set();
            
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, input, label');
            
            textElements.forEach(el => {
                const style = window.getComputedStyle(el);
                fontSizes.add(style.fontSize);
                fontFamilies.add(style.fontFamily);
                fontWeights.add(style.fontWeight);
                lineHeights.add(style.lineHeight);
            });
            
            return {
                uniqueFontSizes: Array.from(fontSizes).length,
                uniqueFontFamilies: Array.from(fontFamilies).length,
                uniqueFontWeights: Array.from(fontWeights).length,
                uniqueLineHeights: Array.from(lineHeights).length,
                fontSizes: Array.from(fontSizes),
                fontFamilies: Array.from(fontFamilies)
            };
        });
        
        this.testResults.typography = typography;
        console.log(`Typography analysis: ${typography.uniqueFontSizes} font sizes, ${typography.uniqueFontFamilies} font families`);
        
        await this.takeScreenshot('07-typography', 'Typography analysis');
    }

    async testMobileResponsiveness() {
        console.log('Testing mobile responsiveness...');
        
        // Test different viewport sizes
        const viewports = [
            { width: 375, height: 667, name: 'Mobile Portrait' },
            { width: 768, height: 1024, name: 'Tablet Portrait' },
            { width: 1024, height: 768, name: 'Tablet Landscape' }
        ];
        
        for (const viewport of viewports) {
            await this.page.setViewport(viewport);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check for horizontal scroll
            const hasHorizontalScroll = await this.page.evaluate(() => {
                return document.body.scrollWidth > window.innerWidth;
            });
            
            if (hasHorizontalScroll) {
                this.testResults.mobileIssues.push(`Horizontal scroll detected on ${viewport.name}`);
            }
            
            // Check for overlapping elements
            const overlappingElements = await this.page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*'));
                const overlaps = [];
                
                for (let i = 0; i < Math.min(elements.length, 50); i++) {
                    const rect1 = elements[i].getBoundingClientRect();
                    if (rect1.width === 0 || rect1.height === 0) continue;
                    
                    for (let j = i + 1; j < Math.min(elements.length, 50); j++) {
                        const rect2 = elements[j].getBoundingClientRect();
                        if (rect2.width === 0 || rect2.height === 0) continue;
                        
                        // Check for overlap
                        if (rect1.left < rect2.right && rect2.left < rect1.right &&
                            rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
                            overlaps.push({
                                element1: elements[i].tagName,
                                element2: elements[j].tagName
                            });
                            if (overlaps.length >= 5) break;
                        }
                    }
                    if (overlaps.length >= 5) break;
                }
                
                return overlaps;
            });
            
            this.testResults.mobileIssues.push(...overlappingElements.map(o => 
                `Overlapping elements on ${viewport.name}: ${o.element1} and ${o.element2}`
            ));
            
            await this.takeScreenshot(`08-mobile-${viewport.name.toLowerCase().replace(' ', '-')}`, 
                `${viewport.name} (${viewport.width}x${viewport.height})`);
        }
        
        // Reset to desktop
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        console.log(`Mobile testing complete. Found ${this.testResults.mobileIssues.length} mobile issues`);
    }

    async testSmoothAnimations() {
        console.log('Testing smooth transitions and animations...');
        
        // Find interactive elements and test their animations
        const interactiveElements = await this.page.$$('button, a, .card, .btn');
        
        for (let i = 0; i < Math.min(interactiveElements.length, 5); i++) {
            const element = interactiveElements[i];
            
            try {
                // Test hover animation
                await element.hover();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const transitionStyles = await element.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return {
                        transition: style.transition,
                        transform: style.transform,
                        opacity: style.opacity
                    };
                });
                
                this.testResults.animations.push({
                    index: i,
                    hasTransition: transitionStyles.transition !== 'all 0s ease 0s',
                    transitionStyles
                });
            } catch (error) {
                console.log(`Skipping element ${i} for animation test (not hoverable): ${error.message}`);
                this.testResults.animations.push({
                    index: i,
                    hasTransition: false,
                    transitionStyles: { transition: 'unknown', transform: 'unknown', opacity: 'unknown' },
                    error: 'Could not test hover animation'
                });
            }
        }
        
        if (interactiveElements.length > 0) {
            await this.takeScreenshot('09-animations', 'Animation and transition testing');
        }
        
        console.log(`Tested animations on ${Math.min(interactiveElements.length, 5)} elements`);
    }

    generateUXScore() {
        let score = 100;
        let feedback = [];
        
        // JavaScript errors (-20 points each, max -40)
        const jsErrorPenalty = Math.min(this.testResults.javascriptErrors.length * 20, 40);
        score -= jsErrorPenalty;
        if (jsErrorPenalty > 0) {
            feedback.push(`JavaScript errors found: ${this.testResults.javascriptErrors.length} (-${jsErrorPenalty} points)`);
        }
        
        // Color palette (ideal: 8-15 colors)
        const colorCount = this.testResults.colorPalette.size;
        if (colorCount > 20) {
            score -= 15;
            feedback.push(`Too many colors (${colorCount}): Consider consolidating color palette (-15 points)`);
        } else if (colorCount <= 15) {
            feedback.push(`Good color palette size (${colorCount} colors)`);
        }
        
        // Accessibility issues (-10 points each, max -30)
        const a11yPenalty = Math.min(this.testResults.accessibilityIssues.length * 10, 30);
        score -= a11yPenalty;
        if (a11yPenalty > 0) {
            feedback.push(`Accessibility issues: ${this.testResults.accessibilityIssues.length} (-${a11yPenalty} points)`);
        }
        
        // Button hover effects
        const buttonsWithHover = this.testResults.buttonStyles.filter(b => 
            b.hover.backgroundColor !== b.initial.backgroundColor || 
            b.hover.transform !== 'none' || 
            b.hover.boxShadow !== 'none'
        ).length;
        const hoverPercentage = this.testResults.buttonStyles.length > 0 ? 
            (buttonsWithHover / this.testResults.buttonStyles.length) * 100 : 0;
        
        if (hoverPercentage < 50) {
            score -= 10;
            feedback.push(`Poor hover effects: Only ${hoverPercentage.toFixed(0)}% of buttons have hover effects (-10 points)`);
        } else {
            feedback.push(`Good hover effects: ${hoverPercentage.toFixed(0)}% of buttons have hover effects`);
        }
        
        // Form interactions
        const formsWithFocus = this.testResults.formInteractions.filter(f => f.hasFocusIndicator).length;
        const focusPercentage = this.testResults.formInteractions.length > 0 ? 
            (formsWithFocus / this.testResults.formInteractions.length) * 100 : 0;
        
        if (focusPercentage < 70) {
            score -= 10;
            feedback.push(`Poor focus indicators: Only ${focusPercentage.toFixed(0)}% of inputs have proper focus styles (-10 points)`);
        }
        
        // Mobile issues (-5 points each, max -20)
        const mobilePenalty = Math.min(this.testResults.mobileIssues.length * 5, 20);
        score -= mobilePenalty;
        if (mobilePenalty > 0) {
            feedback.push(`Mobile issues: ${this.testResults.mobileIssues.length} (-${mobilePenalty} points)`);
        }
        
        // Typography consistency bonus
        if (this.testResults.typography.uniqueFontSizes <= 8) {
            feedback.push(`Good typography consistency: ${this.testResults.typography.uniqueFontSizes} font sizes`);
        } else if (this.testResults.typography.uniqueFontSizes > 12) {
            score -= 5;
            feedback.push(`Too many font sizes: ${this.testResults.typography.uniqueFontSizes} (-5 points)`);
        }
        
        return {
            score: Math.max(score, 0),
            grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
            feedback
        };
    }

    async generateReport() {
        const uxScore = this.generateUXScore();
        
        const report = {
            timestamp: new Date().toISOString(),
            testUrl: 'http://localhost:3002/roi-finder.html',
            overallScore: uxScore,
            detailedResults: {
                javascriptErrors: this.testResults.javascriptErrors,
                colorPalette: {
                    count: this.testResults.colorPalette.size,
                    colors: Array.from(this.testResults.colorPalette)
                },
                accessibilityIssues: this.testResults.accessibilityIssues,
                visualHierarchy: this.testResults.visualHierarchy,
                buttonStyles: this.testResults.buttonStyles,
                formInteractions: this.testResults.formInteractions,
                spacingIssues: this.testResults.spacingIssues,
                loadingElements: this.testResults.loadingElements,
                typography: this.testResults.typography,
                animations: this.testResults.animations,
                mobileIssues: this.testResults.mobileIssues
            },
            screenshots: this.testResults.screenshots,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(this.screenshotDir, 'ux-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n=== COMPREHENSIVE UX TEST REPORT ===`);
        console.log(`Overall Score: ${uxScore.score}/100 (${uxScore.grade})`);
        console.log(`\nFeedback:`);
        uxScore.feedback.forEach(f => console.log(`  - ${f}`));
        console.log(`\nDetailed report saved to: ${reportPath}`);
        console.log(`Screenshots saved to: ${this.screenshotDir}`);
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.javascriptErrors.length > 0) {
            recommendations.push({
                priority: 'High',
                category: 'JavaScript',
                issue: `${this.testResults.javascriptErrors.length} JavaScript errors detected`,
                solution: 'Fix all JavaScript errors to ensure proper functionality',
                errors: this.testResults.javascriptErrors
            });
        }
        
        if (this.testResults.colorPalette.size > 20) {
            recommendations.push({
                priority: 'Medium',
                category: 'Design System',
                issue: `Too many colors (${this.testResults.colorPalette.size})`,
                solution: 'Consolidate color palette to 10-15 colors maximum for better consistency'
            });
        }
        
        if (this.testResults.accessibilityIssues.length > 0) {
            recommendations.push({
                priority: 'High',
                category: 'Accessibility',
                issue: `${this.testResults.accessibilityIssues.length} accessibility issues`,
                solution: 'Add proper ARIA labels, form labels, and skip navigation',
                issues: this.testResults.accessibilityIssues
            });
        }
        
        const buttonsWithoutHover = this.testResults.buttonStyles.filter(b => 
            b.hover.backgroundColor === b.initial.backgroundColor && 
            b.hover.transform === 'none' && 
            b.hover.boxShadow === 'none'
        ).length;
        
        if (buttonsWithoutHover > this.testResults.buttonStyles.length * 0.5) {
            recommendations.push({
                priority: 'Medium',
                category: 'Interaction Design',
                issue: `${buttonsWithoutHover} buttons lack hover effects`,
                solution: 'Add hover states to all interactive elements for better user feedback'
            });
        }
        
        if (this.testResults.mobileIssues.length > 0) {
            recommendations.push({
                priority: 'High',
                category: 'Responsive Design',
                issue: `${this.testResults.mobileIssues.length} mobile issues`,
                solution: 'Fix responsive design issues for better mobile experience',
                issues: this.testResults.mobileIssues
            });
        }
        
        if (this.testResults.loadingElements.skeletons === 0) {
            recommendations.push({
                priority: 'Low',
                category: 'User Experience',
                issue: 'No loading skeletons found',
                solution: 'Consider adding loading skeletons for better perceived performance'
            });
        }
        
        return recommendations;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main execution
async function runComprehensiveTest() {
    const tester = new ComprehensiveUXTester();
    
    try {
        console.log('Initializing comprehensive UX test...');
        await tester.init();
        
        console.log('Testing basic page load...');
        await tester.testBasicPageLoad();
        
        console.log('Analyzing color palette...');
        await tester.analyzeColorPalette();
        
        console.log('Testing accessibility features...');
        await tester.testAccessibilityFeatures();
        
        console.log('Testing visual hierarchy...');
        await tester.testVisualHierarchy();
        
        console.log('Testing button styles...');
        await tester.testButtonStyles();
        
        console.log('Testing form interactions...');
        await tester.testFormInteractions();
        
        console.log('Checking spacing and alignment...');
        await tester.checkSpacingAndAlignment();
        
        console.log('Checking loading elements...');
        await tester.checkLoadingElements();
        
        console.log('Testing typography...');
        await tester.testTypography();
        
        console.log('Testing mobile responsiveness...');
        await tester.testMobileResponsiveness();
        
        console.log('Testing smooth animations...');
        await tester.testSmoothAnimations();
        
        console.log('Generating final report...');
        const report = await tester.generateReport();
        
        return report;
        
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        await tester.cleanup();
    }
}

// Run the test
if (require.main === module) {
    runComprehensiveTest()
        .then(report => {
            console.log('Comprehensive UX test completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { ComprehensiveUXTester, runComprehensiveTest };