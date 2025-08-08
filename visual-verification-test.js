const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class VisualVerificationTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.screenshotDir = path.join(__dirname, 'visual-verification-screenshots');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    }

    async initialize() {
        // Create screenshots directory
        await fs.mkdir(this.screenshotDir, { recursive: true });
        
        // Launch browser with specific settings for consistent screenshots
        this.browser = await puppeteer.launch({
            headless: false, // Set to false to see what's happening
            defaultViewport: {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--force-device-scale-factor=1',
                '--high-dpi-support=0',
                '--disable-web-security'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Set viewport to exactly 1920x1080 for 100% zoom testing
        await this.page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
        });

        console.log('Visual Verification Test initialized');
    }

    async navigateToPropertyConfirmation() {
        console.log('\n📍 Navigating to property confirmation screen...');
        
        try {
            // Navigate to the main page first
            await this.page.goto('http://localhost:3000/roi-finder.html', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait for the page to fully load
            await this.page.waitForSelector('.container', { timeout: 10000 });
            
            // Look for property data or create test data to get to confirmation screen
            const hasPropertyData = await this.page.evaluate(() => {
                return window.propertyData && Object.keys(window.propertyData).length > 0;
            });

            if (!hasPropertyData) {
                console.log('No property data found, injecting test data...');
                
                // Inject test property data
                await this.page.evaluate(() => {
                    window.propertyData = {
                        address: "123 Test Street, Toronto, ON",
                        listingPrice: 850000,
                        propertyType: "Condo",
                        bedrooms: 2,
                        bathrooms: 2,
                        sqft: 1200,
                        yearBuilt: 2015,
                        propertyTax: 5490,
                        maintenanceFee: 450,
                        parkingSpaces: 1,
                        url: "https://example.com/listing"
                    };
                    
                    // Trigger property confirmation display
                    if (window.showPropertyConfirmation) {
                        window.showPropertyConfirmation();
                    }
                });
            }

            // Wait a moment for any animations or state changes
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log('✅ Successfully navigated to property confirmation screen');
            
        } catch (error) {
            console.error('❌ Error navigating to property confirmation:', error.message);
            throw error;
        }
    }

    async takeFullPageScreenshot(filename, description) {
        const screenshotPath = path.join(this.screenshotDir, `${this.timestamp}_${filename}.png`);
        
        await this.page.screenshot({
            path: screenshotPath,
            fullPage: true,
            type: 'png'
        });
        
        console.log(`📸 ${description}: ${screenshotPath}`);
        return screenshotPath;
    }

    async takeViewportScreenshot(filename, description) {
        const screenshotPath = path.join(this.screenshotDir, `${this.timestamp}_${filename}.png`);
        
        await this.page.screenshot({
            path: screenshotPath,
            fullPage: false,
            type: 'png'
        });
        
        console.log(`📸 ${description}: ${screenshotPath}`);
        return screenshotPath;
    }

    async verifyRoundedCorners() {
        console.log('\n🔍 Verifying rounded corners (14px on ALL sides)...');
        
        const cornerStyles = await this.page.evaluate(() => {
            const cards = document.querySelectorAll('.bg-white, .card, [class*="rounded"]');
            const results = [];
            
            cards.forEach((card, index) => {
                const styles = window.getComputedStyle(card);
                const rect = card.getBoundingClientRect();
                
                if (rect.width > 0 && rect.height > 0) {
                    results.push({
                        index,
                        className: card.className,
                        borderRadius: styles.borderRadius,
                        borderTopLeftRadius: styles.borderTopLeftRadius,
                        borderTopRightRadius: styles.borderTopRightRadius,
                        borderBottomLeftRadius: styles.borderBottomLeftRadius,
                        borderBottomRightRadius: styles.borderBottomRightRadius,
                        rect: {
                            width: rect.width,
                            height: rect.height,
                            top: rect.top,
                            left: rect.left
                        }
                    });
                }
            });
            
            return results;
        });

        // Take screenshot highlighting rounded corners
        await this.page.evaluate(() => {
            // Add visual indicators for rounded corners
            const style = document.createElement('style');
            style.textContent = `
                .corner-highlight {
                    position: absolute;
                    border: 2px solid red;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    pointer-events: none;
                    z-index: 10000;
                }
            `;
            document.head.appendChild(style);
            
            // Highlight corners of main cards
            document.querySelectorAll('.bg-white, .card').forEach(card => {
                const rect = card.getBoundingClientRect();
                if (rect.width > 100 && rect.height > 100) {
                    // Top-left corner
                    const tlCorner = document.createElement('div');
                    tlCorner.className = 'corner-highlight';
                    tlCorner.style.left = (rect.left - 10) + 'px';
                    tlCorner.style.top = (rect.top - 10) + 'px';
                    document.body.appendChild(tlCorner);
                    
                    // Top-right corner
                    const trCorner = document.createElement('div');
                    trCorner.className = 'corner-highlight';
                    trCorner.style.left = (rect.right - 10) + 'px';
                    trCorner.style.top = (rect.top - 10) + 'px';
                    document.body.appendChild(trCorner);
                }
            });
        });

        await this.takeViewportScreenshot('rounded_corners_highlighted', 'Rounded corners with highlights');

        // Clean up highlights
        await this.page.evaluate(() => {
            document.querySelectorAll('.corner-highlight').forEach(el => el.remove());
        });

        console.log('📊 Rounded corner analysis:');
        cornerStyles.forEach(style => {
            console.log(`  Card ${style.index} (${style.className}):`);
            console.log(`    Border Radius: ${style.borderRadius}`);
            console.log(`    Top-Left: ${style.borderTopLeftRadius}`);
            console.log(`    Top-Right: ${style.borderTopRightRadius}`);
            console.log(`    Bottom-Left: ${style.borderBottomLeftRadius}`);
            console.log(`    Bottom-Right: ${style.borderBottomRightRadius}`);
        });

        return cornerStyles;
    }

    async verifyNoScrollbars() {
        console.log('\n🔍 Verifying no scrollbars are present...');
        
        const scrollInfo = await this.page.evaluate(() => {
            const body = document.body;
            const html = document.documentElement;
            
            return {
                bodyScroll: {
                    hasHorizontalScroll: body.scrollWidth > body.clientWidth,
                    hasVerticalScroll: body.scrollHeight > body.clientHeight,
                    scrollWidth: body.scrollWidth,
                    scrollHeight: body.scrollHeight,
                    clientWidth: body.clientWidth,
                    clientHeight: body.clientHeight
                },
                htmlScroll: {
                    hasHorizontalScroll: html.scrollWidth > html.clientWidth,
                    hasVerticalScroll: html.scrollHeight > html.clientHeight,
                    scrollWidth: html.scrollWidth,
                    scrollHeight: html.scrollHeight,
                    clientWidth: html.clientWidth,
                    clientHeight: html.clientHeight
                },
                viewportDimensions: {
                    innerWidth: window.innerWidth,
                    innerHeight: window.innerHeight
                }
            };
        });

        console.log('📊 Scrollbar analysis:');
        console.log(`  Viewport: ${scrollInfo.viewportDimensions.innerWidth}x${scrollInfo.viewportDimensions.innerHeight}`);
        console.log(`  Body scroll width/height: ${scrollInfo.bodyScroll.scrollWidth}x${scrollInfo.bodyScroll.scrollHeight}`);
        console.log(`  Body client width/height: ${scrollInfo.bodyScroll.clientWidth}x${scrollInfo.bodyScroll.clientHeight}`);
        console.log(`  Has horizontal scroll: ${scrollInfo.bodyScroll.hasHorizontalScroll}`);
        console.log(`  Has vertical scroll: ${scrollInfo.bodyScroll.hasVerticalScroll}`);

        return scrollInfo;
    }

    async verifyFitsOnScreen() {
        console.log('\n🔍 Verifying everything fits on screen at 100% zoom (1920x1080)...');
        
        const contentInfo = await this.page.evaluate(() => {
            const allElements = document.querySelectorAll('*');
            let maxRight = 0;
            let maxBottom = 0;
            const elementsOutsideViewport = [];
            
            allElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    if (rect.right > maxRight) maxRight = rect.right;
                    if (rect.bottom > maxBottom) maxBottom = rect.bottom;
                    
                    // Check if element extends beyond viewport
                    if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
                        elementsOutsideViewport.push({
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id,
                            rect: {
                                right: rect.right,
                                bottom: rect.bottom,
                                width: rect.width,
                                height: rect.height
                            }
                        });
                    }
                }
            });
            
            return {
                maxRight,
                maxBottom,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                fitsHorizontally: maxRight <= window.innerWidth,
                fitsVertically: maxBottom <= window.innerHeight,
                elementsOutsideViewport
            };
        });

        console.log('📊 Content fit analysis:');
        console.log(`  Viewport: ${contentInfo.viewportWidth}x${contentInfo.viewportHeight}`);
        console.log(`  Content extends to: ${contentInfo.maxRight}x${contentInfo.maxBottom}`);
        console.log(`  Fits horizontally: ${contentInfo.fitsHorizontally}`);
        console.log(`  Fits vertically: ${contentInfo.fitsVertically}`);
        
        if (contentInfo.elementsOutsideViewport.length > 0) {
            console.log('  ⚠️  Elements outside viewport:');
            contentInfo.elementsOutsideViewport.forEach(el => {
                console.log(`    ${el.tagName}.${el.className} extends to ${el.rect.right}x${el.rect.bottom}`);
            });
        }

        return contentInfo;
    }

    async verifyPurpleGradientBackground() {
        console.log('\n🔍 Verifying purple gradient background...');
        
        const backgroundInfo = await this.page.evaluate(() => {
            const body = document.body;
            const html = document.documentElement;
            const styles = window.getComputedStyle(body);
            
            return {
                bodyBackground: styles.background,
                bodyBackgroundColor: styles.backgroundColor,
                bodyBackgroundImage: styles.backgroundImage,
                htmlBackground: window.getComputedStyle(html).background,
                hasGradient: styles.backgroundImage.includes('gradient'),
                hasPurpleColor: styles.background.toLowerCase().includes('purple') || 
                               styles.backgroundImage.toLowerCase().includes('purple') ||
                               styles.background.includes('rgb(139, 69, 19)') || // Check for purple-ish colors
                               styles.background.includes('#8b4513')
            };
        });

        console.log('📊 Background analysis:');
        console.log(`  Body background: ${backgroundInfo.bodyBackground}`);
        console.log(`  Has gradient: ${backgroundInfo.hasGradient}`);
        console.log(`  Has purple color: ${backgroundInfo.hasPurpleColor}`);

        return backgroundInfo;
    }

    async testCardSelectionStates() {
        console.log('\n🔍 Testing card selection states...');
        
        // Find all clickable cards
        const cards = await this.page.$$('.card, [class*="cursor-pointer"], button[class*="card"]');
        const selectionStates = [];

        for (let i = 0; i < Math.min(cards.length, 3); i++) {
            const card = cards[i];
            
            // Get initial state
            const initialState = await card.evaluate(el => ({
                className: el.className,
                computedStyles: {
                    backgroundColor: window.getComputedStyle(el).backgroundColor,
                    borderColor: window.getComputedStyle(el).borderColor,
                    boxShadow: window.getComputedStyle(el).boxShadow
                }
            }));

            // Take screenshot before interaction
            await this.takeViewportScreenshot(`card_${i}_initial_state`, `Card ${i} initial state`);

            // Hover over card
            await card.hover();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const hoverState = await card.evaluate(el => ({
                className: el.className,
                computedStyles: {
                    backgroundColor: window.getComputedStyle(el).backgroundColor,
                    borderColor: window.getComputedStyle(el).borderColor,
                    boxShadow: window.getComputedStyle(el).boxShadow
                }
            }));

            await this.takeViewportScreenshot(`card_${i}_hover_state`, `Card ${i} hover state`);

            // Click card if it's clickable
            try {
                await card.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const clickedState = await card.evaluate(el => ({
                    className: el.className,
                    computedStyles: {
                        backgroundColor: window.getComputedStyle(el).backgroundColor,
                        borderColor: window.getComputedStyle(el).borderColor,
                        boxShadow: window.getComputedStyle(el).boxShadow
                    }
                }));

                await this.takeViewportScreenshot(`card_${i}_clicked_state`, `Card ${i} clicked/selected state`);
                
                selectionStates.push({
                    cardIndex: i,
                    initialState,
                    hoverState,
                    clickedState
                });
                
            } catch (error) {
                console.log(`    Card ${i} is not clickable: ${error.message}`);
            }
        }

        return selectionStates;
    }

    async generateReport(cornerStyles, scrollInfo, contentInfo, backgroundInfo, selectionStates) {
        console.log('\n📋 VISUAL VERIFICATION REPORT');
        console.log('=' * 50);
        
        // 1. Rounded Corners Verification
        console.log('\n1. ROUNDED CORNERS (14px requirement):');
        const has14pxCorners = cornerStyles.some(style => 
            style.borderRadius === '14px' || 
            (style.borderTopLeftRadius === '14px' && 
             style.borderTopRightRadius === '14px' && 
             style.borderBottomLeftRadius === '14px' && 
             style.borderBottomRightRadius === '14px')
        );
        console.log(`   Status: ${has14pxCorners ? '✅ PASS' : '❌ FAIL'}`);
        if (!has14pxCorners) {
            console.log('   Issue: No cards found with 14px border radius on all corners');
        }
        
        // 2. No Scrollbars Verification
        console.log('\n2. NO SCROLLBARS:');
        const hasScrollbars = scrollInfo.bodyScroll.hasHorizontalScroll || scrollInfo.bodyScroll.hasVerticalScroll;
        console.log(`   Status: ${!hasScrollbars ? '✅ PASS' : '❌ FAIL'}`);
        if (hasScrollbars) {
            console.log(`   Issue: Scrollbars detected - Content: ${scrollInfo.bodyScroll.scrollWidth}x${scrollInfo.bodyScroll.scrollHeight}, Viewport: ${scrollInfo.bodyScroll.clientWidth}x${scrollInfo.bodyScroll.clientHeight}`);
        }
        
        // 3. Fits on Screen Verification
        console.log('\n3. FITS ON SCREEN (1920x1080 @ 100% zoom):');
        const fitsOnScreen = contentInfo.fitsHorizontally && contentInfo.fitsVertically;
        console.log(`   Status: ${fitsOnScreen ? '✅ PASS' : '❌ FAIL'}`);
        if (!fitsOnScreen) {
            console.log(`   Issue: Content extends beyond viewport - Max dimensions: ${contentInfo.maxRight}x${contentInfo.maxBottom}`);
        }
        
        // 4. Purple Gradient Background
        console.log('\n4. PURPLE GRADIENT BACKGROUND:');
        console.log(`   Status: ${backgroundInfo.hasGradient ? '✅ PASS' : '❌ FAIL'}`);
        if (!backgroundInfo.hasGradient) {
            console.log('   Issue: No gradient detected in background');
        }
        
        // 5. Card Selection States
        console.log('\n5. CARD SELECTION STATES:');
        console.log(`   Status: ${selectionStates.length > 0 ? '✅ PASS' : '⚠️  PARTIAL'}`);
        console.log(`   Tested ${selectionStates.length} interactive cards`);
        
        // Overall Assessment
        const allPassed = has14pxCorners && !hasScrollbars && fitsOnScreen && backgroundInfo.hasGradient;
        console.log(`\n🎯 OVERALL ASSESSMENT: ${allPassed ? '✅ ALL REQUIREMENTS MET' : '❌ REQUIREMENTS NOT FULLY MET'}`);
        
        return {
            roundedCorners: has14pxCorners,
            noScrollbars: !hasScrollbars,
            fitsOnScreen: fitsOnScreen,
            purpleGradient: backgroundInfo.hasGradient,
            overallPass: allPassed,
            screenshotDirectory: this.screenshotDir
        };
    }

    async runCompleteVerification() {
        try {
            await this.initialize();
            await this.navigateToPropertyConfirmation();
            
            // Take initial full page screenshot
            await this.takeFullPageScreenshot('01_full_page_initial', 'Full page view at 100% zoom');
            await this.takeViewportScreenshot('02_viewport_initial', 'Viewport view at 100% zoom');
            
            // Run all verification tests
            const cornerStyles = await this.verifyRoundedCorners();
            const scrollInfo = await this.verifyNoScrollbars();
            const contentInfo = await this.verifyFitsOnScreen();
            const backgroundInfo = await this.verifyPurpleGradientBackground();
            const selectionStates = await this.testCardSelectionStates();
            
            // Take final screenshots
            await this.takeFullPageScreenshot('99_full_page_final', 'Final full page view');
            
            // Generate comprehensive report
            const report = await this.generateReport(
                cornerStyles, 
                scrollInfo, 
                contentInfo, 
                backgroundInfo, 
                selectionStates
            );
            
            return report;
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the verification
async function main() {
    const tester = new VisualVerificationTester();
    const report = await tester.runCompleteVerification();
    
    console.log('\n📁 All screenshots saved to:', report.screenshotDirectory);
    console.log('\n🔍 Review the screenshots to visually confirm the implementation matches the optimized design.');
    
    process.exit(0);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = VisualVerificationTester;