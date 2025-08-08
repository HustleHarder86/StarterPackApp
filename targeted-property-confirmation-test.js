/**
 * Targeted Property Confirmation Screen Test
 * Fills out the form and triggers the actual workflow
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testTargetedPropertyConfirmation() {
  console.log('🚀 Starting Targeted Property Confirmation Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 100 // Slow down interactions for better observation
  });

  const page = await browser.newPage();
  let testResults = { passed: 0, failed: 0, issues: [], screenshots: [] };
  
  // Create screenshots directory
  const screenshotDir = '/home/amy/StarterPackApp/test-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  try {
    // Navigate to ROI Finder
    console.log('📱 Navigating to ROI Finder...');
    await page.goto('http://localhost:3000/roi-finder.html', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for the form to fully load
    await page.waitForSelector('#property-address', { timeout: 10000 });
    
    const initialScreenshot = 'targeted-01-form-loaded.png';
    await page.screenshot({ 
      path: path.join(screenshotDir, initialScreenshot),
      fullPage: true 
    });
    testResults.screenshots.push(initialScreenshot);
    console.log('✅ ROI Finder form loaded');
    
    // Fill out the property form with test data
    console.log('📝 Filling out property form...');
    
    // Fill property address
    await page.type('#property-address', '123 Test Street, Toronto, ON M5V 3A8');
    
    // Fill purchase price
    await page.type('#purchase-price', '850000');
    
    // Select bedrooms (2 bedrooms)
    await page.select('#bedrooms', '2');
    
    // Select bathrooms (2 bathrooms)  
    await page.select('#bathrooms', '2');
    
    // Wait a moment for form to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const formFilledScreenshot = 'targeted-02-form-filled.png';
    await page.screenshot({ 
      path: path.join(screenshotDir, formFilledScreenshot),
      fullPage: true 
    });
    testResults.screenshots.push(formFilledScreenshot);
    console.log('✅ Form filled with test data');
    
    // Click "Analyze Property" button
    console.log('🎯 Clicking Analyze Property button...');
    const analyzeButton = await page.$('#analyze-property-btn, button[onclick*=\"analyzeProperty\"], .btn-primary:contains(\"Analyze\")');
    
    if (!analyzeButton) {
      // Try alternative selectors
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent.trim(), button);
        if (text.includes('Analyze Property') || text.includes('Analyze')) {
          await button.click();
          console.log(`Clicked button with text: ${text}`);
          break;
        }
      }
    } else {
      await analyzeButton.click();
      console.log('Clicked Analyze Property button');
    }
    
    // Wait for property confirmation dialog to appear
    console.log('⏳ Waiting for property confirmation dialog...');
    
    let dialog = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts && !dialog) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      dialog = await page.$('.property-confirmation, .modal, [role=\"dialog\"]');
      attempts++;
      console.log(`Attempt ${attempts}: Looking for dialog...`);
    }
    
    if (!dialog) {
      // Check for any modals or overlays that might have appeared
      const possibleDialogs = await page.$$('.modal, .dialog, .overlay, .popup, [class*=\"modal\"], [class*=\"dialog\"]');
      if (possibleDialogs.length > 0) {
        dialog = possibleDialogs[0];
        console.log('Found alternative dialog element');
      }
    }
    
    const afterClickScreenshot = 'targeted-03-after-analyze-click.png';
    await page.screenshot({ 
      path: path.join(screenshotDir, afterClickScreenshot),
      fullPage: true 
    });
    testResults.screenshots.push(afterClickScreenshot);
    
    if (dialog) {
      console.log('🎉 Property confirmation dialog found!');
      
      // Test 1: Purple gradient background
      console.log('🎨 Testing purple gradient background...');
      const backgroundInfo = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          background: styles.background,
          backgroundColor: styles.backgroundColor,
          backgroundImage: styles.backgroundImage,
          className: el.className,
          computed: styles.background.includes('gradient') || styles.backgroundImage.includes('gradient')
        };
      }, dialog);
      
      console.log('Background info:', backgroundInfo);
      
      const hasGradient = backgroundInfo.background.includes('gradient') || 
                         backgroundInfo.backgroundImage.includes('gradient') ||
                         backgroundInfo.background.includes('purple') ||
                         backgroundInfo.background.includes('147, 51, 234') ||
                         backgroundInfo.backgroundColor.includes('147, 51, 234');
      
      if (hasGradient) {
        console.log('✅ Purple gradient background detected');
        testResults.passed++;
      } else {
        console.log('❌ Purple gradient background not clearly detected');
        testResults.failed++;
        testResults.issues.push(`Purple gradient not found. Background: ${backgroundInfo.background}`);
      }
      
      // Test 2: Rounded corners
      console.log('🎨 Testing rounded corners...');
      const contentElements = await page.$$('.card, .bg-white, .modal-content, .dialog-content, [class*=\"rounded\"]');
      let roundedCornerInfo = [];
      
      for (const element of contentElements) {
        const borderRadius = await page.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            borderRadius: styles.borderRadius,
            className: el.className
          };
        }, element);
        roundedCornerInfo.push(borderRadius);
      }
      
      console.log('Rounded corner elements:', roundedCornerInfo);
      
      const hasRoundedCorners = roundedCornerInfo.some(info => 
        info.borderRadius.includes('14px') || parseInt(info.borderRadius) >= 14
      );
      
      if (hasRoundedCorners) {
        console.log('✅ Rounded corners (14px+) detected');
        testResults.passed++;
      } else {
        console.log('❌ 14px rounded corners not detected');
        testResults.failed++;
        testResults.issues.push('14px+ rounded corners not found');
      }
      
      // Test 3: Content fits without scrolling
      console.log('🎨 Testing content fit...');
      const scrollInfo = await page.evaluate((el) => {
        return {
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          hasVerticalScroll: el.scrollHeight > el.clientHeight,
          hasHorizontalScroll: el.scrollWidth > el.clientWidth,
          overflowY: window.getComputedStyle(el).overflowY
        };
      }, dialog);
      
      console.log('Scroll info:', scrollInfo);
      
      const hasScrolling = scrollInfo.hasVerticalScroll || scrollInfo.hasHorizontalScroll || scrollInfo.overflowY === 'scroll';
      
      if (!hasScrolling) {
        console.log('✅ Content fits without scrolling');
        testResults.passed++;
      } else {
        console.log('❌ Content has scrolling or overflow');
        testResults.failed++;
        testResults.issues.push('Content requires scrolling or has overflow');
      }
      
      // Test 4: Screen fit at 100% zoom
      const dialogBounds = await dialog.boundingBox();
      const viewport = page.viewport();
      const fitsOnScreen = dialogBounds && dialogBounds.height <= viewport.height * 0.95;
      
      console.log(`Dialog size: ${dialogBounds?.height}px, Viewport: ${viewport.height}px`);
      
      if (fitsOnScreen) {
        console.log('✅ Dialog fits on screen at 100% zoom');
        testResults.passed++;
      } else {
        console.log('❌ Dialog too large for screen');
        testResults.failed++;
        testResults.issues.push(`Dialog height (${dialogBounds?.height}px) exceeds screen space`);
      }
      
      // Take screenshot showing the dialog
      const dialogScreenshot = 'targeted-04-property-confirmation-dialog.png';
      await page.screenshot({ 
        path: path.join(screenshotDir, dialogScreenshot),
        fullPage: true 
      });
      testResults.screenshots.push(dialogScreenshot);
      
      // Test 5: Look for analysis selection cards
      console.log('🎯 Testing analysis selection cards...');
      const analysisCards = await page.$$('.analysis-card, .option-card, [data-analysis-type], .card');
      
      if (analysisCards.length >= 2) {
        console.log(`Found ${analysisCards.length} potential analysis cards`);
        
        // Test card interaction
        try {
          await analysisCards[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const firstCardScreenshot = 'targeted-05-first-card-selected.png';
          await page.screenshot({ 
            path: path.join(screenshotDir, firstCardScreenshot),
            fullPage: true 
          });
          testResults.screenshots.push(firstCardScreenshot);
          
          if (analysisCards.length > 1) {
            await analysisCards[1].click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const secondCardScreenshot = 'targeted-06-second-card-selected.png';
            await page.screenshot({ 
              path: path.join(screenshotDir, secondCardScreenshot),
              fullPage: true 
            });
            testResults.screenshots.push(secondCardScreenshot);
          }
          
          console.log('✅ Card selection interaction tested');
          testResults.passed++;
        } catch (error) {
          console.log('⚠️  Card interaction test failed:', error.message);
          testResults.issues.push('Card interaction failed: ' + error.message);
        }
      } else {
        console.log('⚠️  Less than 2 cards found for selection testing');
        testResults.issues.push('Insufficient analysis cards found');
      }
      
      // Test 6: Mobile responsiveness
      console.log('📱 Testing mobile responsiveness...');
      await page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mobileScreenshot = 'targeted-07-mobile-responsive.png';
      await page.screenshot({ 
        path: path.join(screenshotDir, mobileScreenshot),
        fullPage: true 
      });
      testResults.screenshots.push(mobileScreenshot);
      
      // Check if dialog still fits on mobile
      const mobileDialog = await page.$('.property-confirmation, .modal, [role=\"dialog\"]');
      if (mobileDialog) {
        const mobileBounds = await mobileDialog.boundingBox();
        const mobileViewport = page.viewport();
        const fitsOnMobile = mobileBounds && mobileBounds.height <= mobileViewport.height * 0.95;
        
        if (fitsOnMobile) {
          console.log('✅ Dialog responsive on mobile');
          testResults.passed++;
        } else {
          console.log('❌ Dialog not properly responsive on mobile');
          testResults.failed++;
          testResults.issues.push('Dialog not responsive on mobile viewport');
        }
      }
      
    } else {
      console.log('❌ Property confirmation dialog not found');
      testResults.failed++;
      testResults.issues.push('Property confirmation dialog did not appear after form submission');
      
      // Debug: Check what elements are currently visible
      const visibleElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('div, section, modal, dialog');
        return Array.from(elements).map(el => ({
          tag: el.tagName,
          classes: el.className,
          id: el.id,
          visible: el.offsetWidth > 0 && el.offsetHeight > 0,
          text: el.textContent?.trim().substring(0, 100)
        })).filter(el => el.visible && (el.classes.includes('modal') || el.classes.includes('dialog') || el.text.includes('confirmation'))).slice(0, 5);
      });
      
      console.log('Visible elements that might be dialogs:', visibleElements);
    }
    
  } catch (error) {
    console.log('❌ Test execution error:', error.message);
    testResults.failed++;
    testResults.issues.push(`Test execution error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate comprehensive report
  const totalTests = testResults.passed + testResults.failed;
  const passRate = totalTests > 0 ? (testResults.passed / totalTests) * 100 : 0;
  
  console.log('\\n═══════════════════════════════════════════');
  console.log('📊 TARGETED PROPERTY CONFIRMATION TEST REPORT');
  console.log('═══════════════════════════════════════════');
  console.log(`🕒 Test Time: ${new Date().toISOString()}`);
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📈 Pass Rate: ${passRate.toFixed(1)}%`);
  console.log(`📸 Screenshots Taken: ${testResults.screenshots.length}`);
  console.log(`📁 Screenshots: ${screenshotDir}/`);
  
  if (testResults.screenshots.length > 0) {
    console.log('\\n📸 Test Screenshots:');
    testResults.screenshots.forEach((screenshot, index) => {
      console.log(`${index + 1}. ${screenshot}`);
    });
  }
  
  if (testResults.issues.length > 0) {
    console.log('\\n🐛 Issues Found:');
    testResults.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  console.log('\\n🎯 Test Methodology:');
  console.log('- Filled property form with realistic test data');
  console.log('- Clicked \"Analyze Property\" to trigger workflow');
  console.log('- Waited for property confirmation dialog');
  console.log('- Tested visual design requirements');
  console.log('- Verified responsive behavior');
  
  if (passRate >= 90) {
    console.log('\\n🎉 EXCELLENT: Property confirmation implementation is outstanding!');
  } else if (passRate >= 80) {
    console.log('\\n👍 GOOD: Property confirmation works well with minor issues');
  } else if (passRate >= 60) {
    console.log('\\n⚠️  NEEDS IMPROVEMENT: Several issues require attention');
  } else if (passRate >= 40) {
    console.log('\\n🚨 CRITICAL: Major implementation issues found');
  } else {
    console.log('\\n💥 FAILED: Implementation not working as expected');
  }
  
  console.log('═══════════════════════════════════════════');
  
  return {
    passRate,
    passed: testResults.passed,
    failed: testResults.failed,
    issues: testResults.issues,
    screenshots: testResults.screenshots
  };
}

if (require.main === module) {
  testTargetedPropertyConfirmation().catch(console.error);
}

module.exports = testTargetedPropertyConfirmation;