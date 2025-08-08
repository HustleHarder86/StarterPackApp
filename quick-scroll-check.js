const puppeteer = require('puppeteer');
const path = require('path');

async function quickScrollCheck() {
    console.log('🔍 Quick Scroll Check - Verifying No Scrollbars');
    console.log('=' * 50);
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set to exactly 100% zoom on standard 1920x1080 monitor
    await page.setViewport({ width: 1920, height: 1080 });
    
    const filePath = path.join(__dirname, 'standalone-property-confirmation-noscroll.html');
    const fileUrl = `file://${filePath}`;
    
    try {
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const scrollCheck = await page.evaluate(() => {
            const doc = document.documentElement;
            const body = document.body;
            
            return {
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                document: {
                    scrollHeight: doc.scrollHeight,
                    scrollWidth: doc.scrollWidth,
                    clientHeight: doc.clientHeight,
                    clientWidth: doc.clientWidth,
                    hasVerticalScroll: doc.scrollHeight > doc.clientHeight,
                    hasHorizontalScroll: doc.scrollWidth > doc.clientWidth
                },
                body: {
                    scrollHeight: body.scrollHeight,
                    scrollWidth: body.scrollWidth,
                    clientHeight: body.clientHeight,
                    clientWidth: body.clientWidth,
                    hasVerticalScroll: body.scrollHeight > body.clientHeight,
                    hasHorizontalScroll: body.scrollWidth > body.clientWidth
                },
                styles: {
                    htmlOverflow: getComputedStyle(doc).overflow,
                    bodyOverflow: getComputedStyle(body).overflow
                }
            };
        });
        
        console.log(`Viewport: ${scrollCheck.viewport.width}x${scrollCheck.viewport.height}`);
        console.log(`Document: ${scrollCheck.document.scrollWidth}x${scrollCheck.document.scrollHeight} (client: ${scrollCheck.document.clientWidth}x${scrollCheck.document.clientHeight})`);
        console.log(`Body: ${scrollCheck.body.scrollWidth}x${scrollCheck.body.scrollHeight} (client: ${scrollCheck.body.clientWidth}x${scrollCheck.body.clientHeight})`);
        console.log(`HTML overflow: ${scrollCheck.styles.htmlOverflow}`);
        console.log(`Body overflow: ${scrollCheck.styles.bodyOverflow}`);
        
        const hasScrollbars = scrollCheck.document.hasVerticalScroll || 
                             scrollCheck.document.hasHorizontalScroll ||
                             scrollCheck.body.hasVerticalScroll || 
                             scrollCheck.body.hasHorizontalScroll;
        
        if (hasScrollbars) {
            console.log('❌ SCROLLBARS DETECTED!');
            if (scrollCheck.document.hasVerticalScroll) console.log('  - Document vertical scroll');
            if (scrollCheck.document.hasHorizontalScroll) console.log('  - Document horizontal scroll');
            if (scrollCheck.body.hasVerticalScroll) console.log('  - Body vertical scroll');
            if (scrollCheck.body.hasHorizontalScroll) console.log('  - Body horizontal scroll');
        } else {
            console.log('✅ NO SCROLLBARS - Perfect fit!');
        }
        
        return !hasScrollbars;
        
    } catch (error) {
        console.error('Error:', error);
        return false;
    } finally {
        await browser.close();
    }
}

quickScrollCheck().then(success => {
    process.exit(success ? 0 : 1);
});