const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function quickVerification() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
        }
    });

    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:3000/roi-finder.html', { waitUntil: 'networkidle2' });
        
        // Check if we're on the property confirmation screen or need to navigate there
        const currentState = await page.evaluate(() => {
            // Look for property confirmation indicators
            const propertyInfo = document.querySelector('.property-info, [class*="property"], [class*="confirmation"]');
            const hasPropertyData = window.propertyData && Object.keys(window.propertyData).length > 0;
            
            return {
                hasPropertyInfo: !!propertyInfo,
                hasPropertyData,
                url: window.location.href,
                bodyClasses: document.body.className,
                mainElements: Array.from(document.querySelectorAll('main, .container, .content')).map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id
                }))
            };
        });

        console.log('Current page state:', currentState);
        
        // Check for key design elements
        const designCheck = await page.evaluate(() => {
            // Look for white cards with rounded corners
            const whiteCards = document.querySelectorAll('.bg-white, [class*="bg-white"]');
            const roundedElements = document.querySelectorAll('[class*="rounded"]');
            
            const results = {
                whiteCards: whiteCards.length,
                roundedElements: roundedElements.length,
                backgroundGradient: window.getComputedStyle(document.body).backgroundImage.includes('gradient'),
                viewportHeight: window.innerHeight,
                contentHeight: Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                ),
                cardDetails: []
            };
            
            // Analyze main content cards
            whiteCards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const styles = window.getComputedStyle(card);
                
                if (rect.width > 100 && rect.height > 100) {
                    results.cardDetails.push({
                        index,
                        className: card.className,
                        borderRadius: styles.borderRadius,
                        width: rect.width,
                        height: rect.height,
                        top: rect.top,
                        left: rect.left
                    });
                }
            });
            
            return results;
        });

        console.log('Design analysis:', designCheck);
        
        // Take final screenshot
        const screenshotDir = path.join(__dirname, 'visual-verification-screenshots');
        await fs.mkdir(screenshotDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await page.screenshot({
            path: path.join(screenshotDir, `${timestamp}_final_verification.png`),
            fullPage: false,
            type: 'png'
        });
        
        console.log('\n📋 QUICK VERIFICATION SUMMARY:');
        console.log('='.repeat(50));
        console.log(`1. White Cards Found: ${designCheck.whiteCards}`);
        console.log(`2. Rounded Elements: ${designCheck.roundedElements}`);
        console.log(`3. Background Gradient: ${designCheck.backgroundGradient ? 'YES' : 'NO'}`);
        console.log(`4. Viewport Height: ${designCheck.viewportHeight}px`);
        console.log(`5. Content Height: ${designCheck.contentHeight}px`);
        console.log(`6. Fits in Viewport: ${designCheck.contentHeight <= designCheck.viewportHeight ? 'YES' : 'NO'}`);
        
        console.log('\n📊 Card Details:');
        designCheck.cardDetails.forEach(card => {
            console.log(`   Card ${card.index}: ${card.borderRadius} radius, ${card.width}x${card.height}px`);
        });
        
    } finally {
        await browser.close();
    }
}

quickVerification().catch(console.error);