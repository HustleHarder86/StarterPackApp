const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testProductionUI() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotDir = path.join(__dirname, `production-screenshots-${timestamp}`);
    
    // Create screenshot directory
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    console.log('🚀 Starting production UI test...');
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
        
        // Take initial screenshot
        await page.screenshot({
            path: path.join(screenshotDir, '01-initial-load.png'),
            fullPage: true
        });
        console.log('✅ Initial page screenshot captured');
        
        // Check for gradient styles
        console.log('\n🎨 Checking gradient styles...');
        const hasGradientBackground = await page.evaluate(() => {
            const body = document.body;
            const computedStyle = window.getComputedStyle(body);
            return computedStyle.backgroundImage.includes('gradient');
        });
        console.log(`  Gradient background: ${hasGradientBackground ? '✅ Present' : '❌ Not found'}`);
        
        // Check for Plus Jakarta Sans font
        console.log('\n🔤 Checking font loading...');
        const fontLoaded = await page.evaluate(() => {
            const testElement = document.createElement('div');
            testElement.style.fontFamily = 'Plus Jakarta Sans, sans-serif';
            document.body.appendChild(testElement);
            const computedFont = window.getComputedStyle(testElement).fontFamily;
            document.body.removeChild(testElement);
            return computedFont.includes('Plus Jakarta Sans');
        });
        console.log(`  Plus Jakarta Sans font: ${fontLoaded ? '✅ Loaded' : '❌ Not loaded'}`);
        
        // Check for glass morphism effects
        console.log('\n🪟 Checking glass morphism effects...');
        const glassEffects = await page.evaluate(() => {
            const cards = document.querySelectorAll('.card, .auth-card, .login-card');
            let hasGlassEffect = false;
            cards.forEach(card => {
                const style = window.getComputedStyle(card);
                if (style.backdropFilter !== 'none' || style.webkitBackdropFilter !== 'none') {
                    hasGlassEffect = true;
                }
            });
            return { count: cards.length, hasEffect: hasGlassEffect };
        });
        console.log(`  Glass morphism cards: ${glassEffects.count} found, effects: ${glassEffects.hasEffect ? '✅ Present' : '❌ Not found'}`);
        
        // Check for gradient buttons
        console.log('\n🔘 Checking gradient buttons...');
        const gradientButtons = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            let gradientCount = 0;
            buttons.forEach(button => {
                const style = window.getComputedStyle(button);
                if (style.backgroundImage.includes('gradient')) {
                    gradientCount++;
                }
            });
            return { total: buttons.length, withGradient: gradientCount };
        });
        console.log(`  Gradient buttons: ${gradientButtons.withGradient}/${gradientButtons.total} have gradients`);
        
        // Check for animated background/floating orbs
        console.log('\n🌐 Checking animated elements...');
        const animatedElements = await page.evaluate(() => {
            const orbs = document.querySelectorAll('.floating-orb, .orb, .animated-orb');
            const animations = document.querySelectorAll('[class*="animate"]');
            return { orbs: orbs.length, animations: animations.length };
        });
        console.log(`  Floating orbs: ${animatedElements.orbs} found`);
        console.log(`  Animated elements: ${animatedElements.animations} found`);
        
        // Take screenshots of specific sections
        console.log('\n📸 Capturing section screenshots...');
        
        // Hero section
        const heroSection = await page.$('.hero-section, #hero, section:first-of-type');
        if (heroSection) {
            await heroSection.screenshot({
                path: path.join(screenshotDir, '02-hero-section.png')
            });
            console.log('✅ Hero section screenshot captured');
        }
        
        // Login/Auth section if visible
        const authSection = await page.$('.auth-section, .login-card, .auth-card');
        if (authSection) {
            await authSection.screenshot({
                path: path.join(screenshotDir, '03-auth-section.png')
            });
            console.log('✅ Auth section screenshot captured');
        }
        
        // Take viewport screenshot
        await page.screenshot({
            path: path.join(screenshotDir, '04-viewport.png')
        });
        console.log('✅ Viewport screenshot captured');
        
        // Check CSS loading
        console.log('\n🎨 Checking CSS resources...');
        const cssInfo = await page.evaluate(() => {
            const stylesheets = Array.from(document.styleSheets);
            const designSystemLoaded = stylesheets.some(sheet => 
                sheet.href && sheet.href.includes('design-system.css')
            );
            const gradientClasses = Array.from(document.querySelectorAll('[class*="gradient"]'));
            return {
                totalStylesheets: stylesheets.length,
                designSystemLoaded,
                gradientClassesCount: gradientClasses.length
            };
        });
        console.log(`  Total stylesheets: ${cssInfo.totalStylesheets}`);
        console.log(`  Design system CSS: ${cssInfo.designSystemLoaded ? '✅ Loaded' : '❌ Not found'}`);
        console.log(`  Elements with gradient classes: ${cssInfo.gradientClassesCount}`);
        
        // Generate summary report
        const report = {
            timestamp: new Date().toISOString(),
            url: 'https://starter-pack-app.vercel.app/roi-finder.html',
            results: {
                gradientBackground: hasGradientBackground,
                plusJakartaSansFont: fontLoaded,
                glassEffects: glassEffects.hasEffect,
                gradientButtons: gradientButtons.withGradient > 0,
                floatingOrbs: animatedElements.orbs > 0,
                designSystemCSS: cssInfo.designSystemLoaded
            },
            details: {
                glassCards: glassEffects.count,
                gradientButtons: `${gradientButtons.withGradient}/${gradientButtons.total}`,
                orbs: animatedElements.orbs,
                animations: animatedElements.animations,
                stylesheets: cssInfo.totalStylesheets,
                gradientElements: cssInfo.gradientClassesCount
            },
            screenshotDir: screenshotDir
        };
        
        fs.writeFileSync(
            path.join(screenshotDir, 'test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📊 Test Summary:');
        console.log('================');
        Object.entries(report.results).forEach(([key, value]) => {
            console.log(`${key}: ${value ? '✅ PASS' : '❌ FAIL'}`);
        });
        
        console.log('\n📁 Screenshots saved to:', screenshotDir);
        console.log('📄 Full report saved to:', path.join(screenshotDir, 'test-report.json'));
        
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
testProductionUI().catch(console.error);