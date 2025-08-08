const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const screenshotDir = path.join(__dirname, 'screenshots', `comparison-${timestamp}`);

if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

// Test configurations
const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 }
];

const pages = [
    {
        name: 'mockup',
        url: 'http://localhost:3000/mockups/property-analysis-mockup-4-cards.html',
        title: 'Option 4 Mockup'
    },
    {
        name: 'implementation',
        url: 'http://localhost:3000/test-property-confirmation.html',
        title: 'Current Implementation'
    }
];

async function captureScreenshots() {
    console.log('🚀 Starting visual comparison test...');
    console.log(`📁 Screenshots will be saved to: ${screenshotDir}`);
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const analysisData = {
        timestamp,
        viewports: [],
        pages: [],
        screenshots: []
    };

    try {
        for (const viewport of viewports) {
            console.log(`\n📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
            
            for (const pageConfig of pages) {
                console.log(`   📄 Loading: ${pageConfig.title}`);
                
                const page = await browser.newPage();
                await page.setViewport({
                    width: viewport.width,
                    height: viewport.height,
                    deviceScaleFactor: 1
                });

                try {
                    // Navigate to page with timeout
                    await page.goto(pageConfig.url, { 
                        waitUntil: 'networkidle0',
                        timeout: 15000 
                    });

                    // Wait for animations and dynamic content
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Take full page screenshot
                    const filename = `${pageConfig.name}-${viewport.name}-full.png`;
                    const screenshotPath = path.join(screenshotDir, filename);
                    await page.screenshot({
                        path: screenshotPath,
                        fullPage: true
                    });

                    // Take viewport screenshot
                    const viewportFilename = `${pageConfig.name}-${viewport.name}-viewport.png`;
                    const viewportScreenshotPath = path.join(screenshotDir, viewportFilename);
                    await page.screenshot({
                        path: viewportScreenshotPath,
                        fullPage: false
                    });

                    // Extract computed styles for key elements
                    const styles = await page.evaluate(() => {
                        const getComputedStylesForSelector = (selector) => {
                            const element = document.querySelector(selector);
                            if (!element) return null;
                            
                            const computedStyle = window.getComputedStyle(element);
                            return {
                                backgroundColor: computedStyle.backgroundColor,
                                background: computedStyle.background,
                                borderRadius: computedStyle.borderRadius,
                                boxShadow: computedStyle.boxShadow,
                                fontSize: computedStyle.fontSize,
                                fontWeight: computedStyle.fontWeight,
                                padding: computedStyle.padding,
                                margin: computedStyle.margin,
                                width: computedStyle.width,
                                height: computedStyle.height
                            };
                        };

                        return {
                            body: getComputedStylesForSelector('body'),
                            mainContainer: getComputedStylesForSelector('.min-h-screen, .container, main'),
                            cards: getComputedStylesForSelector('.bg-white, .card'),
                            buttons: getComputedStylesForSelector('button, .btn'),
                            titles: getComputedStylesForSelector('h1, h2, .title'),
                            text: getComputedStylesForSelector('p, .text')
                        };
                    });

                    // Capture hover state for buttons
                    const buttonSelector = 'button, .btn, [role="button"]';
                    const buttons = await page.$$(buttonSelector);
                    
                    if (buttons.length > 0) {
                        // Hover over first button and capture
                        await buttons[0].hover();
                        await new Promise(resolve => setTimeout(resolve, 500));
                        
                        const hoverFilename = `${pageConfig.name}-${viewport.name}-hover.png`;
                        const hoverScreenshotPath = path.join(screenshotDir, hoverFilename);
                        await page.screenshot({
                            path: hoverScreenshotPath,
                            fullPage: false
                        });
                    }

                    analysisData.screenshots.push({
                        page: pageConfig.name,
                        viewport: viewport.name,
                        fullPage: filename,
                        viewport: viewportFilename,
                        hover: buttons.length > 0 ? `${pageConfig.name}-${viewport.name}-hover.png` : null,
                        styles,
                        url: pageConfig.url,
                        title: pageConfig.title
                    });

                    console.log(`   ✅ Screenshots captured for ${pageConfig.title}`);

                } catch (error) {
                    console.error(`   ❌ Error capturing ${pageConfig.title}: ${error.message}`);
                    analysisData.screenshots.push({
                        page: pageConfig.name,
                        viewport: viewport.name,
                        error: error.message,
                        url: pageConfig.url,
                        title: pageConfig.title
                    });
                }

                await page.close();
            }
        }

        // Save analysis data
        const analysisPath = path.join(screenshotDir, 'analysis-data.json');
        fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2));

        console.log('\n🎯 Visual comparison test completed!');
        console.log(`📊 Analysis data saved to: ${analysisPath}`);

    } finally {
        await browser.close();
    }

    return analysisData;
}

async function generateComparisonReport(analysisData) {
    console.log('\n📋 Generating comparison report...');
    
    const report = {
        summary: {
            timestamp: analysisData.timestamp,
            totalScreenshots: analysisData.screenshots.length,
            viewportsTested: viewports.length,
            pagesTested: pages.length
        },
        findings: [],
        recommendations: []
    };

    // Analyze screenshots by comparing styles
    const mockupScreenshots = analysisData.screenshots.filter(s => s.page === 'mockup' && !s.error);
    const implementationScreenshots = analysisData.screenshots.filter(s => s.page === 'implementation' && !s.error);

    for (const viewport of viewports) {
        const mockupData = mockupScreenshots.find(s => s.viewport === viewport.name);
        const implData = implementationScreenshots.find(s => s.viewport === viewport.name);

        if (!mockupData || !implData) continue;

        const findings = [];

        // Compare styles
        if (mockupData.styles && implData.styles) {
            // Background comparison
            if (mockupData.styles.body?.background !== implData.styles.body?.background) {
                findings.push({
                    type: 'background',
                    severity: 'medium',
                    description: 'Background styles differ between mockup and implementation',
                    mockup: mockupData.styles.body?.background,
                    implementation: implData.styles.body?.background
                });
            }

            // Card styling comparison
            if (mockupData.styles.cards?.borderRadius !== implData.styles.cards?.borderRadius) {
                findings.push({
                    type: 'card_styling',
                    severity: 'low',
                    description: 'Card border radius differs',
                    mockup: mockupData.styles.cards?.borderRadius,
                    implementation: implData.styles.cards?.borderRadius
                });
            }

            if (mockupData.styles.cards?.boxShadow !== implData.styles.cards?.boxShadow) {
                findings.push({
                    type: 'card_styling',
                    severity: 'medium',
                    description: 'Card shadow differs',
                    mockup: mockupData.styles.cards?.boxShadow,
                    implementation: implData.styles.cards?.boxShadow
                });
            }

            // Typography comparison
            if (mockupData.styles.titles?.fontSize !== implData.styles.titles?.fontSize) {
                findings.push({
                    type: 'typography',
                    severity: 'medium',
                    description: 'Title font size differs',
                    mockup: mockupData.styles.titles?.fontSize,
                    implementation: implData.styles.titles?.fontSize
                });
            }

            if (mockupData.styles.titles?.fontWeight !== implData.styles.titles?.fontWeight) {
                findings.push({
                    type: 'typography',
                    severity: 'low',
                    description: 'Title font weight differs',
                    mockup: mockupData.styles.titles?.fontWeight,
                    implementation: implData.styles.titles?.fontWeight
                });
            }
        }

        if (findings.length > 0) {
            report.findings.push({
                viewport: viewport.name,
                issues: findings
            });
        }
    }

    // Generate recommendations based on findings
    const allFindings = report.findings.flatMap(f => f.issues);
    
    if (allFindings.some(f => f.type === 'background')) {
        report.recommendations.push({
            priority: 'high',
            category: 'Background',
            recommendation: 'Update the background gradient to match the mockup exactly. Check CSS gradient syntax and angles.',
            affectedViewports: report.findings.filter(f => f.issues.some(i => i.type === 'background')).map(f => f.viewport)
        });
    }

    if (allFindings.some(f => f.type === 'card_styling')) {
        report.recommendations.push({
            priority: 'medium',
            category: 'Card Styling',
            recommendation: 'Adjust card border radius and shadow to match mockup specifications.',
            affectedViewports: report.findings.filter(f => f.issues.some(i => i.type === 'card_styling')).map(f => f.viewport)
        });
    }

    if (allFindings.some(f => f.type === 'typography')) {
        report.recommendations.push({
            priority: 'medium',
            category: 'Typography',
            recommendation: 'Update font sizes and weights to match mockup typography.',
            affectedViewports: report.findings.filter(f => f.issues.some(i => i.type === 'typography')).map(f => f.viewport)
        });
    }

    // Save report
    const reportPath = path.join(screenshotDir, 'comparison-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Comparison report saved to: ${reportPath}`);
    return report;
}

// Main execution
async function main() {
    try {
        const analysisData = await captureScreenshots();
        const report = await generateComparisonReport(analysisData);
        
        console.log('\n🏁 Visual Comparison Test Results:');
        console.log(`📁 Screenshots: ${screenshotDir}`);
        console.log(`📊 Total Issues Found: ${report.findings.flatMap(f => f.issues).length}`);
        console.log(`🎯 Recommendations: ${report.recommendations.length}`);
        
        return { analysisData, report, screenshotDir };
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };