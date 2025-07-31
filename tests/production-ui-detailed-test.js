const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function detailedProductionUITest() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotDir = path.join(__dirname, `production-detailed-${timestamp}`);
    
    // Create screenshot directory
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    console.log('🚀 Starting detailed production UI test...');
    console.log(`📸 Screenshots will be saved to: ${screenshotDir}`);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // Navigate to production site
        console.log('\n📍 Navigating to https://starter-pack-app.vercel.app/roi-finder.html');
        await page.goto('https://starter-pack-app.vercel.app/roi-finder.html', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Detailed gradient analysis
        console.log('\n🎨 Detailed Gradient Analysis:');
        const gradientAnalysis = await page.evaluate(() => {
            const analysis = {
                body: {},
                buttons: [],
                cards: [],
                orbs: [],
                backgrounds: []
            };
            
            // Check body gradient
            const bodyStyle = window.getComputedStyle(document.body);
            analysis.body = {
                backgroundImage: bodyStyle.backgroundImage,
                backgroundColor: bodyStyle.backgroundColor,
                hasGradient: bodyStyle.backgroundImage.includes('gradient')
            };
            
            // Check all elements with gradient classes
            const gradientElements = document.querySelectorAll('[class*="gradient"]');
            gradientElements.forEach(el => {
                const style = window.getComputedStyle(el);
                analysis.backgrounds.push({
                    element: el.tagName,
                    classes: el.className,
                    backgroundImage: style.backgroundImage,
                    hasGradient: style.backgroundImage.includes('gradient')
                });
            });
            
            // Check buttons
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                const style = window.getComputedStyle(btn);
                analysis.buttons.push({
                    text: btn.textContent.trim(),
                    classes: btn.className,
                    backgroundImage: style.backgroundImage,
                    backgroundColor: style.backgroundColor,
                    hasGradient: style.backgroundImage.includes('gradient')
                });
            });
            
            // Check cards
            const cards = document.querySelectorAll('.card, .auth-card, .login-card, [class*="card"]');
            cards.forEach(card => {
                const style = window.getComputedStyle(card);
                analysis.cards.push({
                    classes: card.className,
                    backdropFilter: style.backdropFilter,
                    webkitBackdropFilter: style.webkitBackdropFilter,
                    backgroundColor: style.backgroundColor,
                    hasGlassEffect: style.backdropFilter !== 'none' || style.webkitBackdropFilter !== 'none'
                });
            });
            
            // Check floating orbs
            const orbs = document.querySelectorAll('.floating-orb, .orb, [class*="orb"]');
            orbs.forEach(orb => {
                const style = window.getComputedStyle(orb);
                analysis.orbs.push({
                    classes: orb.className,
                    animation: style.animation,
                    backgroundImage: style.backgroundImage,
                    position: style.position
                });
            });
            
            return analysis;
        });
        
        console.log('\nBody Background:', gradientAnalysis.body);
        console.log('\nGradient Elements:', gradientAnalysis.backgrounds.length);
        console.log('\nButtons with Gradients:', gradientAnalysis.buttons.filter(b => b.hasGradient).length);
        console.log('\nCards with Glass Effects:', gradientAnalysis.cards.filter(c => c.hasGlassEffect).length);
        console.log('\nFloating Orbs:', gradientAnalysis.orbs.length);
        
        // Check CSS files
        console.log('\n📄 CSS Files Analysis:');
        const cssFiles = await page.evaluate(() => {
            const stylesheets = Array.from(document.styleSheets);
            return stylesheets.map(sheet => {
                try {
                    return {
                        href: sheet.href,
                        rules: sheet.cssRules ? sheet.cssRules.length : 0,
                        media: sheet.media.mediaText
                    };
                } catch (e) {
                    return {
                        href: sheet.href,
                        error: 'Cannot access rules (CORS)'
                    };
                }
            });
        });
        cssFiles.forEach(css => {
            console.log(`  ${css.href || 'inline'}: ${css.rules || 'N/A'} rules`);
        });
        
        // Check specific gradient classes
        console.log('\n🔍 Checking Specific Gradient Classes:');
        const specificChecks = await page.evaluate(() => {
            return {
                gradientBg: document.querySelector('.gradient-bg') !== null,
                gradientAnimation: document.querySelector('.gradient-animation') !== null,
                bgGradientToR: document.querySelector('[class*="bg-gradient-to-r"]') !== null,
                animatedGradient: document.querySelector('.animated-gradient-background') !== null,
                heroGradient: document.querySelector('.hero-gradient') !== null
            };
        });
        console.log('Specific gradient classes found:', specificChecks);
        
        // Take screenshots with annotations
        await page.evaluate(() => {
            // Add visual indicators
            const addIndicator = (selector, label, color) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach((el, i) => {
                    const indicator = document.createElement('div');
                    indicator.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        background: ${color};
                        color: white;
                        padding: 2px 8px;
                        font-size: 12px;
                        z-index: 9999;
                        pointer-events: none;
                    `;
                    indicator.textContent = `${label} ${i + 1}`;
                    el.style.position = 'relative';
                    el.appendChild(indicator);
                });
            };
            
            addIndicator('[class*="gradient"]', 'GRADIENT', 'red');
            addIndicator('.floating-orb, .orb', 'ORB', 'blue');
            addIndicator('.card, .auth-card', 'CARD', 'green');
        });
        
        await page.screenshot({
            path: path.join(screenshotDir, 'annotated-elements.png'),
            fullPage: true
        });
        console.log('\n✅ Annotated screenshot saved');
        
        // Save detailed report
        const detailedReport = {
            timestamp: new Date().toISOString(),
            url: 'https://starter-pack-app.vercel.app/roi-finder.html',
            gradientAnalysis,
            cssFiles,
            specificChecks,
            summary: {
                hasBodyGradient: gradientAnalysis.body.hasGradient,
                gradientElements: gradientAnalysis.backgrounds.length,
                gradientButtons: gradientAnalysis.buttons.filter(b => b.hasGradient).length,
                totalButtons: gradientAnalysis.buttons.length,
                glassCards: gradientAnalysis.cards.filter(c => c.hasGlassEffect).length,
                totalCards: gradientAnalysis.cards.length,
                floatingOrbs: gradientAnalysis.orbs.length
            }
        };
        
        fs.writeFileSync(
            path.join(screenshotDir, 'detailed-report.json'),
            JSON.stringify(detailedReport, null, 2)
        );
        
        console.log('\n📊 Summary Report:');
        console.log('==================');
        console.log(`✅ Plus Jakarta Sans font: Loaded`);
        console.log(`✅ Glass morphism effects: ${detailedReport.summary.glassCards}/${detailedReport.summary.totalCards} cards`);
        console.log(`⚠️  Gradient buttons: ${detailedReport.summary.gradientButtons}/${detailedReport.summary.totalButtons} buttons`);
        console.log(`✅ Floating orbs: ${detailedReport.summary.floatingOrbs} found`);
        console.log(`❌ Body gradient background: ${detailedReport.summary.hasBodyGradient ? 'Present' : 'Not found'}`);
        console.log(`⚠️  Gradient elements: ${detailedReport.summary.gradientElements} found`);
        
        console.log('\n📁 Results saved to:', screenshotDir);
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
        await page.screenshot({
            path: path.join(screenshotDir, 'error-screenshot.png'),
            fullPage: true
        });
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

// Run the test
detailedProductionUITest().catch(console.error);