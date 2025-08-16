const puppeteer = require('puppeteer');

async function visualDebug() {
    const browser = await puppeteer.launch({ 
        headless: false,  // Show browser window
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1200, height: 800 }
    });
    const page = await browser.newPage();
    
    console.log('🔍 Visual debugging - Opening page...\n');
    
    try {
        // Navigate to the page
        await page.goto('http://localhost:3000/mockups/mockup-iterations/base-mockup-hybrid-complete-full.html', {
            waitUntil: 'networkidle0'
        });
        
        // Wait for page to load
        await new Promise(r => setTimeout(r, 2000));
        
        // Take screenshot of full page
        await page.screenshot({ 
            path: '/home/amy/StarterPackApp/mockups/mockup-iterations/visual-debug-fullpage.png',
            fullPage: true 
        });
        
        // Take screenshot of viewport only
        await page.screenshot({ 
            path: '/home/amy/StarterPackApp/mockups/mockup-iterations/visual-debug-viewport.png',
            fullPage: false 
        });
        
        // Check for sidebar visibility and positioning
        const sidebarInfo = await page.evaluate(() => {
            const sidebar = document.querySelector('.sidebar');
            const quickNav = document.querySelector('.sidebar .sidebar-header');
            const simpleView = document.querySelector('.simple-view');
            const mainContent = document.querySelector('main');
            
            const getSizeAndPosition = (el) => {
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const styles = window.getComputedStyle(el);
                return {
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom,
                    position: styles.position,
                    zIndex: styles.zIndex,
                    display: styles.display,
                    visibility: styles.visibility,
                    overflow: styles.overflow
                };
            };
            
            return {
                sidebar: getSizeAndPosition(sidebar),
                quickNav: getSizeAndPosition(quickNav),
                simpleView: getSizeAndPosition(simpleView),
                mainContent: getSizeAndPosition(mainContent),
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight
            };
        });
        
        console.log('📊 SIDEBAR LAYOUT INFO:');
        console.log('='.repeat(50));
        console.log('Viewport:', sidebarInfo.windowWidth + 'x' + sidebarInfo.windowHeight);
        
        if (sidebarInfo.sidebar) {
            console.log('\n📋 SIDEBAR:');
            console.log(`  Size: ${sidebarInfo.sidebar.width}x${sidebarInfo.sidebar.height}`);
            console.log(`  Position: ${sidebarInfo.sidebar.left}, ${sidebarInfo.sidebar.top}`);
            console.log(`  CSS Position: ${sidebarInfo.sidebar.position}`);
            console.log(`  Z-Index: ${sidebarInfo.sidebar.zIndex}`);
            console.log(`  Display: ${sidebarInfo.sidebar.display}`);
            console.log(`  Visibility: ${sidebarInfo.sidebar.visibility}`);
        }
        
        if (sidebarInfo.quickNav) {
            console.log('\n🧭 QUICK NAVIGATION:');
            console.log(`  Size: ${sidebarInfo.quickNav.width}x${sidebarInfo.quickNav.height}`);
            console.log(`  Position: ${sidebarInfo.quickNav.left}, ${sidebarInfo.quickNav.top}`);
            console.log(`  CSS Position: ${sidebarInfo.quickNav.position}`);
        }
        
        if (sidebarInfo.mainContent) {
            console.log('\n📄 MAIN CONTENT:');
            console.log(`  Size: ${sidebarInfo.mainContent.width}x${sidebarInfo.mainContent.height}`);
            console.log(`  Position: ${sidebarInfo.mainContent.left}, ${sidebarInfo.mainContent.top}`);
            console.log(`  CSS Position: ${sidebarInfo.mainContent.position}`);
        }
        
        // Check if sidebar is covering content
        const overlap = sidebarInfo.sidebar && sidebarInfo.mainContent && 
                       sidebarInfo.sidebar.right > sidebarInfo.mainContent.left;
        
        console.log('\n🚨 OVERLAP DETECTION:');
        console.log(`  Sidebar covering content: ${overlap ? 'YES ❌' : 'NO ✅'}`);
        
        if (overlap) {
            console.log(`  Sidebar ends at: ${sidebarInfo.sidebar.right}px`);
            console.log(`  Main content starts at: ${sidebarInfo.mainContent.left}px`);
            console.log(`  Overlap: ${sidebarInfo.sidebar.right - sidebarInfo.mainContent.left}px`);
        }
        
        console.log('\n📸 Screenshots saved:');
        console.log('  - visual-debug-fullpage.png (full page)');
        console.log('  - visual-debug-viewport.png (viewport only)');
        
        // Keep browser open for 10 seconds to allow manual inspection
        console.log('\n👀 Browser window opened for visual inspection...');
        console.log('   Browser will close automatically in 10 seconds');
        await new Promise(r => setTimeout(r, 10000));
        
    } catch (error) {
        console.error('❌ Visual debug failed:', error.message);
    } finally {
        await browser.close();
    }
}

visualDebug().catch(console.error);