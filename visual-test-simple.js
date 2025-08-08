const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function simpleVisualTest() {
    console.log('🎯 Starting Simple Visual Test - Sidebar & Text Color Fixes');
    
    const screenshotDir = path.join(__dirname, 'test-screenshots', `visual-test-${Date.now()}`);
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    console.log(`📁 Screenshots directory: ${screenshotDir}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });

    const page = await browser.newPage();
    
    try {
        // Set a reasonable viewport
        await page.setViewport({ width: 1400, height: 900 });

        console.log('📂 Loading the page...');
        
        // Try loading with a simpler approach
        await page.goto('http://localhost:3000/roi-finder.html', {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        // Give the page some time to render
        console.log('⏳ Waiting for page to fully render...');
        await page.waitForTimeout(3000);

        // Take initial screenshot
        console.log('📸 Taking initial screenshot...');
        const initialScreenshot = path.join(screenshotDir, '01-initial-state.png');
        await page.screenshot({ 
            path: initialScreenshot, 
            fullPage: true 
        });

        console.log('✅ Initial screenshot captured');

        // Check what we have on the page
        const pageAnalysis = await page.evaluate(() => {
            const sidebar = document.getElementById('app-sidebar') || document.querySelector('.app-sidebar');
            const toggleBtn = document.querySelector('.sidebar-toggle-btn') || document.getElementById('sidebarToggle');
            const mainContent = document.querySelector('.main-content-with-sidebar') || document.querySelector('.main-content');
            
            // Analyze text colors
            const allElements = document.querySelectorAll('*');
            const colorAnalysis = {
                improvedColors: 0,  // Elements using #4b5563 (our improved color)
                oldProblematicColors: 0, // Elements using #999999 (old light color)
                totalTextElements: 0
            };

            allElements.forEach(el => {
                const styles = window.getComputedStyle(el);
                const color = styles.color;
                const text = el.textContent?.trim();
                
                if (text && text.length > 0) {
                    colorAnalysis.totalTextElements++;
                    
                    // Check for improved color (rgb(75, 85, 99) = #4b5563)
                    if (color === 'rgb(75, 85, 99)') {
                        colorAnalysis.improvedColors++;
                    }
                    
                    // Check for old problematic color (rgb(153, 153, 153) = #999999)
                    if (color === 'rgb(153, 153, 153)') {
                        colorAnalysis.oldProblematicColors++;
                    }
                }
            });

            return {
                pageTitle: document.title,
                sidebar: sidebar ? {
                    found: true,
                    width: sidebar.offsetWidth,
                    collapsed: sidebar.classList.contains('collapsed')
                } : { found: false },
                toggleButton: toggleBtn ? { found: true } : { found: false },
                mainContent: mainContent ? {
                    found: true,
                    marginLeft: window.getComputedStyle(mainContent).marginLeft,
                    width: mainContent.offsetWidth
                } : { found: false },
                colorAnalysis,
                viewportWidth: window.innerWidth,
                totalElements: allElements.length
            };
        });

        console.log('\n📊 PAGE ANALYSIS RESULTS:');
        console.log('=' .repeat(50));
        console.log(`   Page Title: ${pageAnalysis.pageTitle}`);
        console.log(`   Sidebar Found: ${pageAnalysis.sidebar.found ? '✅ Yes' : '❌ No'}`);
        console.log(`   Toggle Button Found: ${pageAnalysis.toggleButton.found ? '✅ Yes' : '❌ No'}`);
        console.log(`   Main Content Found: ${pageAnalysis.mainContent.found ? '✅ Yes' : '❌ No'}`);
        
        if (pageAnalysis.sidebar.found) {
            console.log(`   Sidebar Width: ${pageAnalysis.sidebar.width}px`);
            console.log(`   Sidebar Collapsed: ${pageAnalysis.sidebar.collapsed ? 'Yes' : 'No'}`);
        }
        
        if (pageAnalysis.mainContent.found) {
            console.log(`   Main Content Margin: ${pageAnalysis.mainContent.marginLeft}`);
        }

        // Color Analysis Results
        console.log('\n🎨 TEXT COLOR ANALYSIS:');
        console.log('   Total elements analyzed:', pageAnalysis.colorAnalysis.totalTextElements);
        console.log(`   Elements with improved color (#4b5563): ${pageAnalysis.colorAnalysis.improvedColors}`);
        console.log(`   Elements with old problematic color (#999999): ${pageAnalysis.colorAnalysis.oldProblematicColors}`);
        
        const textColorStatus = pageAnalysis.colorAnalysis.oldProblematicColors === 0 ? '✅ FIXED' : '⚠️ NEEDS ATTENTION';
        console.log(`   Text Color Fix Status: ${textColorStatus}`);

        // Test sidebar if available
        if (pageAnalysis.sidebar.found && pageAnalysis.toggleButton.found) {
            console.log('\n🔽 TESTING SIDEBAR COLLAPSE...');
            
            // Click the toggle
            await page.click('.sidebar-toggle-btn, #sidebarToggle');
            await page.waitForTimeout(1000); // Wait for animation
            
            // Take collapsed screenshot
            const collapsedScreenshot = path.join(screenshotDir, '02-sidebar-collapsed.png');
            await page.screenshot({ 
                path: collapsedScreenshot, 
                fullPage: true 
            });
            console.log('📸 Collapsed state screenshot captured');

            // Analyze collapsed state
            const collapsedState = await page.evaluate(() => {
                const sidebar = document.getElementById('app-sidebar') || document.querySelector('.app-sidebar');
                const mainContent = document.querySelector('.main-content-with-sidebar') || document.querySelector('.main-content');
                
                return {
                    sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
                    sidebarCollapsed: sidebar ? sidebar.classList.contains('collapsed') : false,
                    mainContentMarginLeft: mainContent ? parseInt(window.getComputedStyle(mainContent).marginLeft) : 0,
                    mainContentWidth: mainContent ? mainContent.offsetWidth : 0
                };
            });

            console.log('   Collapsed sidebar width:', collapsedState.sidebarWidth + 'px');
            console.log('   Main content margin after collapse:', collapsedState.mainContentMarginLeft + 'px');
            
            // Check for white space issue
            const whiteSpaceIssue = collapsedState.mainContentMarginLeft > 100;
            console.log(`   White space issue: ${whiteSpaceIssue ? '⚠️ YES - Need to fix' : '✅ NO'}`);

            console.log('\n🔼 TESTING SIDEBAR EXPAND...');
            
            // Click toggle again to expand
            await page.click('.sidebar-toggle-btn, #sidebarToggle');
            await page.waitForTimeout(1000);
            
            // Take expanded screenshot
            const expandedScreenshot = path.join(screenshotDir, '03-sidebar-expanded.png');
            await page.screenshot({ 
                path: expandedScreenshot, 
                fullPage: true 
            });
            console.log('📸 Expanded state screenshot captured');

            const expandedState = await page.evaluate(() => {
                const sidebar = document.getElementById('app-sidebar') || document.querySelector('.app-sidebar');
                const mainContent = document.querySelector('.main-content-with-sidebar') || document.querySelector('.main-content');
                
                return {
                    sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
                    sidebarCollapsed: sidebar ? sidebar.classList.contains('collapsed') : false,
                    mainContentMarginLeft: mainContent ? parseInt(window.getComputedStyle(mainContent).marginLeft) : 0
                };
            });

            console.log('   Expanded sidebar width:', expandedState.sidebarWidth + 'px');
            console.log('   Main content margin after expand:', expandedState.mainContentMarginLeft + 'px');
            
            // Final Assessment
            console.log('\n🎯 FINAL ASSESSMENT:');
            console.log('=' .repeat(50));
            
            const sidebarWorking = expandedState.sidebarWidth > 200 && !whiteSpaceIssue;
            const textFixed = pageAnalysis.colorAnalysis.oldProblematicColors === 0;
            const hasImprovements = pageAnalysis.colorAnalysis.improvedColors > 0;
            
            console.log(`✅ Sidebar Functionality: ${sidebarWorking ? 'WORKING' : 'NEEDS ATTENTION'}`);
            console.log(`✅ Text Color Improvements: ${hasImprovements ? 'DETECTED' : 'NOT FOUND'}`);
            console.log(`✅ Old Color Issues Fixed: ${textFixed ? 'YES' : 'NO'}`);
            
            const overallScore = (sidebarWorking ? 1 : 0) + (textFixed ? 1 : 0) + (hasImprovements ? 1 : 0);
            const overallStatus = overallScore >= 2 ? '🟢 MOSTLY GOOD' : overallScore === 1 ? '🟡 SOME ISSUES' : '🔴 NEEDS WORK';
            
            console.log(`\n🏆 OVERALL STATUS: ${overallStatus} (${overallScore}/3 checks passed)`);

        } else {
            console.log('\n⚠️  Sidebar or toggle button not found - limited testing performed');
        }

        // List all screenshots
        console.log('\n📸 SCREENSHOTS GENERATED:');
        const screenshots = fs.readdirSync(screenshotDir);
        screenshots.forEach(screenshot => {
            console.log(`   • ${path.join(screenshotDir, screenshot)}`);
        });

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        
        // Try to capture error screenshot
        try {
            const errorScreenshot = path.join(screenshotDir, 'error-state.png');
            await page.screenshot({ path: errorScreenshot });
            console.log(`📸 Error screenshot saved: ${errorScreenshot}`);
        } catch (screenshotError) {
            console.log('Could not capture error screenshot');
        }
    } finally {
        await browser.close();
        console.log('\n🔚 Test completed');
    }
}

// Run the test
simpleVisualTest().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});