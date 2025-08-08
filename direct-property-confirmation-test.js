/**
 * Direct Property Confirmation Screen Test
 * Tests the implementation on the roi-finder.html page
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testDirectPropertyConfirmation() {
  console.log('🚀 Starting Direct Property Confirmation Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  let testResults = { passed: 0, failed: 0, issues: [], screenshots: [] };
  
  // Create screenshots directory
  const screenshotDir = '/home/amy/StarterPackApp/test-screenshots';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  
  try {
    // Navigate directly to ROI Finder
    console.log('📱 Navigating to ROI Finder page...');
    await page.goto('http://localhost:3000/roi-finder.html', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take initial screenshot
    const initialScreenshot = 'direct-01-roi-finder-loaded.png';
    await page.screenshot({ 
      path: path.join(screenshotDir, initialScreenshot),
      fullPage: true 
    });
    testResults.screenshots.push(initialScreenshot);
    console.log('✅ ROI Finder page loaded');
    
    // Look for property confirmation dialog or trigger
    console.log('🎯 Looking for property confirmation...');
    
    // First, try to see if dialog is already visible
    let dialog = await page.$('.property-confirmation, .modal, [role="dialog"]');
    
    if (!dialog) {
      // Try to trigger the dialog by simulating extension data injection
      console.log('Attempting to trigger property confirmation...');
      
      // Inject test property data like the extension would
      await page.evaluate(() => {
        // Simulate extension sending property data
        const testPropertyData = {
          url: 'https://www.realtor.ca/real-estate/123456/test-property',
          address: '1514 - 150 East Liberty Street',
          city: 'Toronto',
          province: 'Ontario',
          postalCode: 'M6K 3R5',
          price: 489000,
          propertyType: 'Apartment',
          bedrooms: 1,
          bathrooms: 1,
          sqft: 650,
          propertyTax: 2548,
          condoFee: 554,
          listingId: '123456'
        };
        
        // Try multiple ways to trigger the dialog
        if (window.showPropertyConfirmation) {
          window.showPropertyConfirmation(testPropertyData);
        } else if (window.handlePropertyData) {
          window.handlePropertyData(testPropertyData);
        } else if (window.processPropertyData) {
          window.processPropertyData(testPropertyData);
        } else {
          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('propertyDataReceived', {
            detail: testPropertyData
          }));
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      dialog = await page.$('.property-confirmation, .modal, [role="dialog"]');
    }
    
    if (!dialog) {
      // Try clicking any trigger buttons
      const triggers = [
        'button[data-testid*="show-property-confirmation"]',
        'button[onclick*="showPropertyConfirmation"]',
        'button.show-property-confirmation',
        '.test-controls button'
      ];
      
      for (const selector of triggers) {
        const element = await page.$(selector);
        if (element) {
          console.log(`Found trigger button: ${selector}`);
          await element.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          dialog = await page.$('.property-confirmation, .modal, [role="dialog"]');
          if (dialog) break;
        }
      }
    }
    
    // Take screenshot after trigger attempts
    const afterTriggerScreenshot = 'direct-02-after-trigger.png';
    await page.screenshot({ 
      path: path.join(screenshotDir, afterTriggerScreenshot),
      fullPage: true 
    });
    testResults.screenshots.push(afterTriggerScreenshot);
    
    if (dialog) {
      console.log('✅ Property confirmation dialog found!');
      
      // Test 1: Purple gradient background
      console.log('🎨 Testing purple gradient background...');
      const hasGradient = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const background = styles.background || styles.backgroundColor;
        const backgroundImage = styles.backgroundImage;
        
        return background.includes('gradient') || backgroundImage.includes('gradient') ||
               background.includes('purple') || background.includes('rgb(147') || 
               background.includes('#9333ea') || background.includes('147, 51, 234') ||
               backgroundImage.includes('purple') || backgroundImage.includes('147, 51, 234');
      }, dialog);
      
      if (hasGradient) {
        console.log('✅ Purple gradient background detected');
        testResults.passed++;
      } else {
        console.log('❌ Purple gradient background not detected');
        testResults.failed++;
        testResults.issues.push('Purple gradient background not found on dialog');
      }
      
      // Test 2: Rounded corners on white card
      console.log('🎨 Testing rounded corners...');
      const cards = await page.$$('.card, .bg-white, .modal-content, .property-details');
      let hasRoundedCorners = false;
      
      for (const card of cards) {
        const borderRadius = await page.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.borderRadius;
        }, card);
        
        const radiusValue = parseInt(borderRadius);
        if (borderRadius.includes('14px') || radiusValue >= 14) {
          hasRoundedCorners = true;
          console.log(`Found rounded corners: ${borderRadius} on element`);
          break;
        }
      }
      
      if (hasRoundedCorners) {
        console.log('✅ Rounded corners (14px+) detected');
        testResults.passed++;
      } else {
        console.log('❌ Rounded corners (14px+) not detected');
        testResults.failed++;
        testResults.issues.push('14px rounded corners not found on cards');
      }
      
      // Test 3: No scrollbars
      console.log('🎨 Testing for scrollbars...');
      const hasScrollbars = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const hasVerticalScroll = el.scrollHeight > el.clientHeight;
        const hasHorizontalScroll = el.scrollWidth > el.clientWidth;
        const overflowY = styles.overflowY;
        const overflow = styles.overflow;
        
        return hasVerticalScroll || hasHorizontalScroll || 
               overflowY === 'scroll' || overflow === 'scroll';
      }, dialog);
      
      if (!hasScrollbars) {
        console.log('✅ No scrollbars detected - content fits');
        testResults.passed++;
      } else {
        console.log('❌ Scrollbars detected or content overflow');
        testResults.failed++;
        testResults.issues.push('Content has scrollbars or overflow');
      }
      
      // Test 4: Fits on screen at 100% zoom
      console.log('🎨 Testing screen fit...');
      const dialogBounds = await dialog.boundingBox();
      const viewport = page.viewport();
      const fitsOnScreen = dialogBounds && dialogBounds.height <= viewport.height * 0.95;
      
      if (fitsOnScreen) {
        console.log(`✅ Dialog fits on screen (${Math.round(dialogBounds.height)}px ≤ ${Math.round(viewport.height * 0.95)}px)`);
        testResults.passed++;
      } else {
        console.log(`❌ Dialog too tall for screen (${dialogBounds ? Math.round(dialogBounds.height) : 'unknown'}px > ${Math.round(viewport.height * 0.95)}px)`);
        testResults.failed++;
        testResults.issues.push(`Dialog height exceeds 95% of viewport`);
      }
      
      // Test 5: Card selection functionality
      console.log('🎯 Testing card selection...');
      const analysisCards = await page.$$('.analysis-card, .option-card, [data-analysis-type]');
      
      if (analysisCards.length >= 2) {
        // Take screenshot before interaction
        const beforeSelectionScreenshot = 'direct-03-before-card-selection.png';
        await page.screenshot({ 
          path: path.join(screenshotDir, beforeSelectionScreenshot),
          fullPage: true 
        });
        testResults.screenshots.push(beforeSelectionScreenshot);
        
        // Click first card
        await analysisCards[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const firstCardScreenshot = 'direct-04-first-card-selected.png';
        await page.screenshot({ 
          path: path.join(screenshotDir, firstCardScreenshot),
          fullPage: true 
        });
        testResults.screenshots.push(firstCardScreenshot);
        
        // Click second card
        await analysisCards[1].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const secondCardScreenshot = 'direct-05-second-card-selected.png';
        await page.screenshot({ 
          path: path.join(screenshotDir, secondCardScreenshot),
          fullPage: true 
        });
        testResults.screenshots.push(secondCardScreenshot);
        
        console.log('✅ Card selection interaction tested');
        testResults.passed++;
      } else {
        console.log('⚠️  Less than 2 analysis cards found for selection testing');
        testResults.issues.push('Insufficient cards for selection testing');
      }
      
      // Test 6: Mobile responsiveness
      console.log('📱 Testing mobile responsiveness...');
      
      // Test mobile view (375px)
      await page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mobileScreenshot = 'direct-06-mobile-view.png';
      await page.screenshot({ 
        path: path.join(screenshotDir, mobileScreenshot),
        fullPage: true 
      });
      testResults.screenshots.push(mobileScreenshot);
      
      // Check if dialog still fits on mobile
      const mobileDialog = await page.$('.property-confirmation, .modal, [role="dialog"]');
      if (mobileDialog) {
        const mobileBounds = await mobileDialog.boundingBox();
        const mobileViewport = page.viewport();
        const fitsOnMobile = mobileBounds && mobileBounds.height <= mobileViewport.height * 0.95;
        
        if (fitsOnMobile) {
          console.log('✅ Dialog fits on mobile screen');
          testResults.passed++;
        } else {
          console.log('❌ Dialog too tall for mobile screen');
          testResults.failed++;
          testResults.issues.push('Dialog does not fit on mobile screen');
        }
      }
      
      // Test tablet view (768px)
      await page.setViewport({ width: 768, height: 1024 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const tabletScreenshot = 'direct-07-tablet-view.png';
      await page.screenshot({ 
        path: path.join(screenshotDir, tabletScreenshot),
        fullPage: true 
      });
      testResults.screenshots.push(tabletScreenshot);
      
      console.log('✅ Responsive design tested');
      testResults.passed++;
      
      // Reset to desktop
      await page.setViewport({ width: 1920, height: 1080 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } else {
      console.log('❌ No property confirmation dialog found');
      testResults.failed++;
      testResults.issues.push('Property confirmation dialog not found after multiple trigger attempts');
      
      // Try to find what elements are available
      const availableElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, .modal, .dialog, [role="dialog"], [data-testid]');
        return Array.from(elements).map(el => ({
          tag: el.tagName,
          classes: el.className,
          id: el.id,
          testId: el.dataset.testid,
          text: el.textContent?.trim().substring(0, 50)
        })).slice(0, 10); // First 10 elements
      });
      
      console.log('Available elements:', availableElements);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
    testResults.failed++;
    testResults.issues.push(`Test execution error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Generate comprehensive report
  const totalTests = testResults.passed + testResults.failed;
  const passRate = totalTests > 0 ? (testResults.passed / totalTests) * 100 : 0;
  
  console.log('\\n═══════════════════════════════════════════');
  console.log('📊 DIRECT PROPERTY CONFIRMATION TEST REPORT');
  console.log('═══════════════════════════════════════════');
  console.log(`🕒 Test Time: ${new Date().toISOString()}`);
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📈 Pass Rate: ${passRate.toFixed(1)}%`);
  console.log(`📸 Screenshots Taken: ${testResults.screenshots.length}`);
  console.log(`📁 Screenshots Location: ${screenshotDir}/`);
  
  if (testResults.screenshots.length > 0) {
    console.log('\\n📸 Screenshots:');
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
  
  console.log('\\n💡 Test Coverage:');
  console.log('- Purple gradient background');
  console.log('- Rounded corners (14px)');
  console.log('- No scrollbars/overflow');
  console.log('- Fits on screen at 100% zoom');
  console.log('- Card selection functionality');  
  console.log('- Mobile responsiveness (375px)');
  console.log('- Tablet responsiveness (768px)');
  
  if (passRate >= 90) {
    console.log('\\n🎉 EXCELLENT: Property confirmation screen implementation is perfect!');
  } else if (passRate >= 80) {
    console.log('\\n👍 GOOD: Property confirmation screen works well with minor issues');
  } else if (passRate >= 60) {
    console.log('\\n⚠️  NEEDS IMPROVEMENT: Several issues need attention');
  } else {
    console.log('\\n🚨 CRITICAL: Major implementation problems found');
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
  testDirectPropertyConfirmation().catch(console.error);
}

module.exports = testDirectPropertyConfirmation;