const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function testGradientDesign() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport for desktop testing
  await page.setViewport({ width: 1920, height: 1080 });

  // Create screenshots directory with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotDir = path.join(__dirname, `gradient-test-screenshots-${timestamp}`);
  await fs.mkdir(screenshotDir, { recursive: true });

  console.log('\n🎨 UI/UX Gradient Design Test Starting...\n');
  console.log(`📸 Screenshots will be saved to: ${screenshotDir}\n`);

  try {
    // Navigate to the page
    console.log('📍 Navigating to http://localhost:8080/roi-finder.html...');
    await page.goto('http://localhost:8080/roi-finder.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take initial full page screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '01-full-page-initial.png'),
      fullPage: true
    });
    console.log('✅ Full page screenshot captured');

    // Test 1: Check for gradient background
    console.log('\n🔍 Testing gradient background...');
    const hasGradientBackground = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const backgroundImage = computedStyle.backgroundImage;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Check for inline styles
      const inlineStyle = body.getAttribute('style');
      
      console.log('Body inline style:', inlineStyle);
      console.log('Computed background-image:', backgroundImage);
      console.log('Computed background-color:', backgroundColor);
      
      return {
        hasInlineGradient: inlineStyle && inlineStyle.includes('gradient'),
        computedBackgroundImage: backgroundImage,
        computedBackgroundColor: backgroundColor,
        hasGradient: backgroundImage.includes('gradient') || (inlineStyle && inlineStyle.includes('gradient'))
      };
    });
    
    console.log('Gradient background check:', hasGradientBackground);
    
    // Test 2: Check for Plus Jakarta Sans font
    console.log('\n🔍 Testing Plus Jakarta Sans font...');
    const fontCheck = await page.evaluate(() => {
      const body = document.body;
      const computedFont = window.getComputedStyle(body).fontFamily;
      const hasJakartaSans = computedFont.toLowerCase().includes('jakarta');
      
      // Check if font is loaded
      const fontLink = document.querySelector('link[href*="Plus+Jakarta+Sans"]');
      
      return {
        computedFont,
        hasJakartaSans,
        fontLinkExists: !!fontLink,
        fontLinkHref: fontLink ? fontLink.href : null
      };
    });
    
    console.log('Font check:', fontCheck);

    // Test 3: Check for glass morphism effects
    console.log('\n🔍 Testing glass morphism effects...');
    const glassElements = await page.evaluate(() => {
      const elements = [];
      
      // Check various selectors for glass morphism
      const selectors = [
        '.glass-card',
        '.glass-morphism',
        '[class*="glass"]',
        '.backdrop-blur',
        '[style*="backdrop-filter"]'
      ];
      
      selectors.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach(el => {
          const computedStyle = window.getComputedStyle(el);
          const inlineStyle = el.getAttribute('style') || '';
          
          elements.push({
            selector,
            className: el.className,
            hasBackdropFilter: computedStyle.backdropFilter !== 'none' || inlineStyle.includes('backdrop-filter'),
            backdropFilter: computedStyle.backdropFilter,
            backgroundColor: computedStyle.backgroundColor,
            border: computedStyle.border,
            boxShadow: computedStyle.boxShadow,
            inlineStyle: inlineStyle.substring(0, 200) // Truncate for logging
          });
        });
      });
      
      return elements;
    });
    
    console.log(`Found ${glassElements.length} potential glass morphism elements`);
    glassElements.slice(0, 3).forEach(el => console.log('Glass element:', el));

    // Test 4: Check for gradient buttons
    console.log('\n🔍 Testing gradient buttons...');
    const gradientButtons = await page.evaluate(() => {
      const buttons = [];
      const buttonElements = document.querySelectorAll('button, .btn, [class*="button"], input[type="submit"]');
      
      buttonElements.forEach(btn => {
        const computedStyle = window.getComputedStyle(btn);
        const inlineStyle = btn.getAttribute('style') || '';
        const backgroundImage = computedStyle.backgroundImage;
        
        if (backgroundImage.includes('gradient') || inlineStyle.includes('gradient')) {
          buttons.push({
            text: btn.textContent.trim(),
            className: btn.className,
            backgroundImage,
            backgroundColor: computedStyle.backgroundColor,
            hasGradient: true,
            inlineStyle: inlineStyle.substring(0, 200)
          });
        }
      });
      
      return buttons;
    });
    
    console.log(`Found ${gradientButtons.length} gradient buttons`);
    gradientButtons.forEach(btn => console.log('Gradient button:', btn));

    // Test 5: Check for animated background elements
    console.log('\n🔍 Testing animated background elements...');
    const animatedElements = await page.evaluate(() => {
      const elements = [];
      
      // Check for animation-related styles
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        const inlineStyle = el.getAttribute('style') || '';
        
        if (computedStyle.animation !== 'none' || 
            computedStyle.animationName !== 'none' ||
            inlineStyle.includes('animation') ||
            el.className.includes('animate')) {
          elements.push({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            animation: computedStyle.animation,
            animationName: computedStyle.animationName,
            hasAnimation: true
          });
        }
      });
      
      return elements;
    });
    
    console.log(`Found ${animatedElements.length} animated elements`);
    animatedElements.slice(0, 5).forEach(el => console.log('Animated element:', el));

    // Take screenshots of specific sections
    console.log('\n📸 Taking section screenshots...');
    
    // Hero section
    const heroSection = await page.$('#hero-section, .hero-section, header, [class*="hero"]');
    if (heroSection) {
      await heroSection.screenshot({
        path: path.join(screenshotDir, '02-hero-section.png')
      });
      console.log('✅ Hero section screenshot captured');
    }

    // Form section
    const formSection = await page.$('#property-form, form, [class*="form"]');
    if (formSection) {
      await formSection.screenshot({
        path: path.join(screenshotDir, '03-form-section.png')
      });
      console.log('✅ Form section screenshot captured');
    }

    // Scroll and capture middle section
    await page.evaluate(() => window.scrollTo(0, window.innerHeight / 2));
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({
      path: path.join(screenshotDir, '04-middle-section.png')
    });
    console.log('✅ Middle section screenshot captured');

    // Mobile viewport test
    console.log('\n📱 Testing mobile viewport...');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({
      path: path.join(screenshotDir, '05-mobile-view.png'),
      fullPage: true
    });
    console.log('✅ Mobile view screenshot captured');

    // Generate test report
    console.log('\n📊 Test Summary:\n');
    console.log('🎨 Gradient Background:', hasGradientBackground.hasGradient ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('🔤 Plus Jakarta Sans Font:', fontCheck.hasJakartaSans ? '✅ LOADED' : '❌ NOT LOADED');
    console.log('🪟 Glass Morphism Effects:', glassElements.length > 0 ? `✅ ${glassElements.length} ELEMENTS` : '❌ NONE FOUND');
    console.log('🔘 Gradient Buttons:', gradientButtons.length > 0 ? `✅ ${gradientButtons.length} BUTTONS` : '❌ NONE FOUND');
    console.log('✨ Animated Elements:', animatedElements.length > 0 ? `✅ ${animatedElements.length} ELEMENTS` : '❌ NONE FOUND');
    
    console.log(`\n📁 Screenshots saved to: ${screenshotDir}`);
    
    // Create detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'http://localhost:8080/roi-finder.html',
      results: {
        gradientBackground: hasGradientBackground,
        font: fontCheck,
        glassMorphism: {
          count: glassElements.length,
          samples: glassElements.slice(0, 3)
        },
        gradientButtons: {
          count: gradientButtons.length,
          buttons: gradientButtons
        },
        animations: {
          count: animatedElements.length,
          samples: animatedElements.slice(0, 5)
        }
      },
      screenshotDir
    };
    
    await fs.writeFile(
      path.join(screenshotDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n✅ Test report saved to test-report.json');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({
      path: path.join(screenshotDir, 'error-screenshot.png')
    });
  } finally {
    await browser.close();
  }
}

// Run the test
testGradientDesign().catch(console.error);