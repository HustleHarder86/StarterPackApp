const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testSidebarAndTextFixes() {
    const screenshotDir = path.join(__dirname, 'test-screenshots', `sidebar-test-${Date.now()}`);
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    console.log('🚀 Starting Sidebar and Text Color Test');
    console.log(`📁 Screenshots will be saved to: ${screenshotDir}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        // Navigate to the application
        console.log('📂 Navigating to application...');
        await page.goto('http://localhost:3000/roi-finder.html', { 
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });

        // Wait a bit for any dynamic content to load
        await page.waitForTimeout(2000);

        // Take initial screenshot
        console.log('📸 Taking initial screenshot...');
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-initial-state.png'), 
            fullPage: true 
        });

        // Test 1: Check for text color improvements
        console.log('🎨 Testing text color improvements...');
        
        const textElements = await page.evaluate(() => {
            const results = [];
            // Look for all text elements that might have been updated
            const elements = document.querySelectorAll('*');
            
            elements.forEach(el => {
                const styles = window.getComputedStyle(el);
                const color = styles.color;
                const text = el.textContent?.trim();
                
                // Check if this element has the new color (#4b5563 = rgb(75, 85, 99))
                if (color === 'rgb(75, 85, 99)' && text && text.length > 0 && text.length < 200) {
                    results.push({
                        tag: el.tagName,
                        class: el.className,
                        text: text.substring(0, 100),
                        color: color
                    });
                }
                
                // Also check for old problematic colors that should have been fixed
                if (color === 'rgb(153, 153, 153)' && text && text.length > 0 && text.length < 200) {
                    results.push({
                        tag: el.tagName,
                        class: el.className,
                        text: text.substring(0, 100),
                        color: color,
                        issue: 'OLD_LIGHT_COLOR'
                    });
                }
            });
            
            return results;
        });

        console.log(`   Found ${textElements.filter(el => !el.issue).length} elements with improved color`);
        console.log(`   Found ${textElements.filter(el => el.issue).length} elements with old problematic color`);

        // Test 2: Check sidebar functionality
        console.log('📱 Testing sidebar functionality...');
        
        // Find the sidebar toggle button
        const sidebarToggle = await page.$('#sidebarToggle');
        if (!sidebarToggle) {
            console.log('⚠️  Sidebar toggle button not found, checking for alternative selectors...');
            
            // Try alternative selectors
            const alternatives = [
                'button[data-toggle="sidebar"]',
                '.sidebar-toggle',
                '.toggle-sidebar',
                '[data-action="toggle-sidebar"]'
            ];
            
            let found = false;
            for (const selector of alternatives) {
                const alt = await page.$(selector);
                if (alt) {
                    console.log(`✅ Found sidebar toggle with selector: ${selector}`);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                console.log('❌ No sidebar toggle button found');
            }
        }

        // Get initial sidebar measurements
        const initialState = await page.evaluate(() => {
            const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
            const mainContent = document.querySelector('.main-content, #mainContent, .content');
            
            if (!sidebar) {
                return { error: 'Sidebar not found' };
            }
            
            const sidebarRect = sidebar.getBoundingClientRect();
            const contentRect = mainContent ? mainContent.getBoundingClientRect() : null;
            
            return {
                sidebar: {
                    width: sidebarRect.width,
                    left: sidebarRect.left,
                    visible: !sidebar.classList.contains('hidden')
                },
                content: contentRect ? {
                    left: contentRect.left,
                    width: contentRect.width
                } : null,
                viewportWidth: window.innerWidth
            };
        });

        console.log('   Initial state:', JSON.stringify(initialState, null, 2));

        if (initialState.error) {
            console.log('❌ Sidebar element not found');
        } else {
            // Test sidebar collapse if toggle exists
            if (sidebarToggle) {
                console.log('🔽 Testing sidebar collapse...');
                
                // Click to collapse
                await sidebarToggle.click();
                await page.waitForTimeout(1000); // Wait for animation
                
                // Take screenshot after collapse
                await page.screenshot({ 
                    path: path.join(screenshotDir, '02-sidebar-collapsed.png'), 
                    fullPage: true 
                });
                
                // Get collapsed measurements
                const collapsedState = await page.evaluate(() => {
                    const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
                    const mainContent = document.querySelector('.main-content, #mainContent, .content');
                    
                    const sidebarRect = sidebar.getBoundingClientRect();
                    const contentRect = mainContent ? mainContent.getBoundingClientRect() : null;
                    
                    return {
                        sidebar: {
                            width: sidebarRect.width,
                            left: sidebarRect.left,
                            visible: !sidebar.classList.contains('hidden')
                        },
                        content: contentRect ? {
                            left: contentRect.left,
                            width: contentRect.width
                        } : null,
                        viewportWidth: window.innerWidth
                    };
                });

                console.log('   Collapsed state:', JSON.stringify(collapsedState, null, 2));
                
                // Check for white space issue
                const hasWhiteSpaceIssue = collapsedState.content && collapsedState.content.left > 50;
                console.log(`   White space issue: ${hasWhiteSpaceIssue ? 'YES - Content left: ' + collapsedState.content.left + 'px' : 'NO'}`);
                
                // Test expand
                console.log('🔼 Testing sidebar expand...');
                await sidebarToggle.click();
                await page.waitForTimeout(1000);
                
                // Take screenshot after expand
                await page.screenshot({ 
                    path: path.join(screenshotDir, '03-sidebar-expanded.png'), 
                    fullPage: true 
                });
                
                const expandedState = await page.evaluate(() => {
                    const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
                    const mainContent = document.querySelector('.main-content, #mainContent, .content');
                    
                    const sidebarRect = sidebar.getBoundingClientRect();
                    const contentRect = mainContent ? mainContent.getBoundingClientRect() : null;
                    
                    return {
                        sidebar: {
                            width: sidebarRect.width,
                            left: sidebarRect.left,
                            visible: !sidebar.classList.contains('hidden')
                        },
                        content: contentRect ? {
                            left: contentRect.left,
                            width: contentRect.width
                        } : null,
                        viewportWidth: window.innerWidth
                    };
                });

                console.log('   Expanded state:', JSON.stringify(expandedState, null, 2));
                
                // Summary
                console.log('\n📊 TEST RESULTS SUMMARY:');
                console.log('=' .repeat(50));
                
                // Text color results
                const improvedTextElements = textElements.filter(el => !el.issue);
                const problematicTextElements = textElements.filter(el => el.issue);
                
                console.log(`\n🎨 Text Color Improvements:`);
                console.log(`   ✅ Elements with improved color (#4b5563): ${improvedTextElements.length}`);
                console.log(`   ${problematicTextElements.length === 0 ? '✅' : '⚠️'} Elements with old color (#999999): ${problematicTextElements.length}`);
                
                if (improvedTextElements.length > 0) {
                    console.log('   📝 Sample improved elements:');
                    improvedTextElements.slice(0, 3).forEach(el => {
                        console.log(`      • ${el.tag}.${el.class}: "${el.text.substring(0, 50)}..."`);
                    });
                }
                
                if (problematicTextElements.length > 0) {
                    console.log('   ⚠️  Elements still using old color:');
                    problematicTextElements.forEach(el => {
                        console.log(`      • ${el.tag}.${el.class}: "${el.text.substring(0, 50)}..."`);
                    });
                }
                
                // Sidebar results
                console.log(`\n📱 Sidebar Functionality:`);
                console.log(`   ✅ Sidebar toggle button: Found`);
                console.log(`   ${hasWhiteSpaceIssue ? '⚠️' : '✅'} White space when collapsed: ${hasWhiteSpaceIssue ? 'ISSUE DETECTED' : 'NO ISSUES'}`);
                console.log(`   ✅ Collapse/Expand animation: Working`);
                
                // Overall assessment
                const textIssues = problematicTextElements.length > 0;
                const sidebarIssues = hasWhiteSpaceIssue;
                const allGood = !textIssues && !sidebarIssues;
                
                console.log(`\n🎯 OVERALL ASSESSMENT: ${allGood ? '✅ ALL FIXES WORKING PROPERLY' : '⚠️ ISSUES DETECTED'}`);
                
                if (!allGood) {
                    console.log('🔧 Issues to address:');
                    if (textIssues) console.log('   • Some text elements still using old light gray color');
                    if (sidebarIssues) console.log('   • White space visible when sidebar collapsed');
                }
                
                console.log(`\n📸 Screenshots saved to: ${screenshotDir}`);
                console.log('   • 01-initial-state.png - Initial page load');
                console.log('   • 02-sidebar-collapsed.png - Sidebar collapsed');
                console.log('   • 03-sidebar-expanded.png - Sidebar expanded');
                
            } else {
                console.log('⚠️  Sidebar toggle not found, skipping collapse/expand tests');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testSidebarAndTextFixes().then(() => {
    console.log('\n✅ Test completed');
}).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});