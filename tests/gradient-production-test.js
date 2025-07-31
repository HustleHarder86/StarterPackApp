const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Production Gradient Visual Test
 * Tests the gradient design implementation on production
 */

const PRODUCTION_URL = 'https://starter-pack-app.vercel.app/roi-finder.html';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const SCREENSHOT_DIR = path.join(__dirname, `gradient-production-test-${timestamp}`);

// Expected design values from gradient-theme.css
const EXPECTED_VALUES = {
  gradientBackground: 'linear-gradient(135deg, rgb(245, 243, 255) 0%, rgb(255, 238, 248) 50%, rgb(240, 249, 255) 100%)',
  glassCard: {
    backdropFilter: 'blur(16px) saturate(180%)',
    background: 'rgba(255, 255, 255, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  font: 'Plus Jakarta Sans',
  gradientPrimary: 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)'
};

async function runProductionTest() {
  console.log('🎨 Starting Production Gradient Test...\n');
  console.log(`📸 Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);

  // Create screenshot directory
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const testResults = {
    timestamp: new Date().toISOString(),
    url: PRODUCTION_URL,
    stages: [],
    issues: []
  };

  try {
    // Stage 1: Initial Load
    console.log('📍 Stage 1: Testing initial page load...');
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-initial-load.png'),
      fullPage: true
    });

    const initialCheck = await page.evaluate(() => {
      const animatedBg = document.getElementById('animated-bg');
      const body = document.body;
      const computedBg = window.getComputedStyle(animatedBg || body);
      
      // Check for gradient elements
      const gradientMesh = document.querySelector('.gradient-mesh');
      const orbs = document.querySelectorAll('.orb');
      const glassCards = document.querySelectorAll('.glass-card');
      
      // Check font
      const bodyFont = window.getComputedStyle(document.body).fontFamily;
      
      return {
        animatedBgExists: !!animatedBg,
        animatedBgDisplay: animatedBg ? window.getComputedStyle(animatedBg).display : null,
        animatedBgVisibility: animatedBg ? window.getComputedStyle(animatedBg).visibility : null,
        backgroundImage: computedBg.backgroundImage,
        gradientMeshExists: !!gradientMesh,
        orbCount: orbs.length,
        glassCardCount: glassCards.length,
        fontFamily: bodyFont,
        hasPlusJakarta: bodyFont.includes('Jakarta')
      };
    });

    testResults.stages.push({
      name: 'Initial Load',
      screenshot: '01-initial-load.png',
      checks: initialCheck
    });

    console.log('Initial load checks:', initialCheck);

    // Stage 2: Loading State (simulate)
    console.log('\n📍 Stage 2: Testing loading state...');
    
    // Trigger loading by filling form with mock data
    await page.evaluate(() => {
      // If there's a test mode form, fill it
      const addressInput = document.querySelector('input[name="address"], #address');
      const priceInput = document.querySelector('input[name="price"], #price');
      
      if (addressInput) addressInput.value = '123 Test Street, Toronto, ON';
      if (priceInput) priceInput.value = '899000';
      
      // Try to trigger analysis
      const analyzeBtn = document.querySelector('button[id*="analyze"], button[class*="analyze"]');
      if (analyzeBtn) analyzeBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-loading-state.png'),
      fullPage: true
    });

    const loadingCheck = await page.evaluate(() => {
      const animatedBg = document.getElementById('animated-bg');
      const loadingContainer = document.querySelector('[id*="loading"], .loading-state');
      
      return {
        animatedBgStillVisible: animatedBg ? window.getComputedStyle(animatedBg).display !== 'none' : false,
        loadingContainerExists: !!loadingContainer,
        loadingBackground: loadingContainer ? window.getComputedStyle(loadingContainer).background : null
      };
    });

    testResults.stages.push({
      name: 'Loading State',
      screenshot: '02-loading-state.png',
      checks: loadingCheck
    });

    console.log('Loading state checks:', loadingCheck);

    // Stage 3: Check CSS files
    console.log('\n📍 Stage 3: Checking CSS files...');
    
    const cssCheck = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const gradientTheme = styleSheets.find(sheet => 
        sheet.href && sheet.href.includes('gradient-theme.css')
      );
      
      const designSystem = styleSheets.find(sheet => 
        sheet.href && sheet.href.includes('design-system.css')
      );
      
      // Check for gradient CSS rules
      let gradientRules = 0;
      let glassRules = 0;
      
      styleSheets.forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule.cssText && rule.cssText.includes('gradient')) gradientRules++;
            if (rule.cssText && rule.cssText.includes('glass')) glassRules++;
          });
        } catch (e) {
          // Cross-origin stylesheets can't be read
        }
      });
      
      return {
        gradientThemeLoaded: !!gradientTheme,
        designSystemLoaded: !!designSystem,
        gradientRuleCount: gradientRules,
        glassRuleCount: glassRules
      };
    });

    testResults.stages.push({
      name: 'CSS Check',
      checks: cssCheck
    });

    console.log('CSS checks:', cssCheck);

    // Stage 4: Check for blocking elements
    console.log('\n📍 Stage 4: Checking for gradient blockers...');
    
    const blockingCheck = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const blockers = [];
      
      elements.forEach(el => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // Check if element is full screen with opaque background
        if (rect.width >= window.innerWidth * 0.9 && 
            rect.height >= window.innerHeight * 0.9 &&
            computed.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
            computed.backgroundColor !== 'transparent') {
          blockers.push({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            backgroundColor: computed.backgroundColor,
            size: `${rect.width}x${rect.height}`
          });
        }
      });
      
      return blockers;
    });

    if (blockingCheck.length > 0) {
      testResults.issues.push({
        type: 'blocking-elements',
        message: 'Found elements blocking gradient background',
        elements: blockingCheck
      });
    }

    console.log('Blocking elements:', blockingCheck);

    // Generate report
    const report = {
      ...testResults,
      summary: {
        gradientVisible: initialCheck.animatedBgExists && initialCheck.animatedBgDisplay !== 'none',
        glassEffectsPresent: initialCheck.glassCardCount > 0,
        fontCorrect: initialCheck.hasPlusJakarta,
        cssFilesLoaded: cssCheck.gradientThemeLoaded && cssCheck.designSystemLoaded,
        blockingElements: blockingCheck.length
      }
    };

    await fs.writeFile(
      path.join(SCREENSHOT_DIR, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Gradient Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .issue { background: #fee; padding: 10px; margin: 10px 0; border-radius: 5px; }
    .success { background: #efe; padding: 10px; margin: 10px 0; border-radius: 5px; }
    img { max-width: 100%; border: 1px solid #ddd; margin: 10px 0; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Gradient Production Test Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  <h2>Summary</h2>
  <div class="${report.summary.gradientVisible ? 'success' : 'issue'}">
    Gradient Background: ${report.summary.gradientVisible ? '✓ Visible' : '✗ Not Visible'}
  </div>
  <div class="${report.summary.glassEffectsPresent ? 'success' : 'issue'}">
    Glass Effects: ${report.summary.glassEffectsPresent ? '✓ Present' : '✗ Missing'}
  </div>
  <div class="${report.summary.fontCorrect ? 'success' : 'issue'}">
    Plus Jakarta Sans Font: ${report.summary.fontCorrect ? '✓ Loaded' : '✗ Not Loaded'}
  </div>
  
  <h2>Screenshots</h2>
  <h3>Initial Load</h3>
  <img src="01-initial-load.png" alt="Initial Load">
  
  <h3>Loading State</h3>
  <img src="02-loading-state.png" alt="Loading State">
  
  <h2>Technical Details</h2>
  <pre>${JSON.stringify(report, null, 2)}</pre>
</body>
</html>
    `;

    await fs.writeFile(
      path.join(SCREENSHOT_DIR, 'report.html'),
      htmlReport
    );

    console.log('\n✅ Test complete!');
    console.log(`📊 Report saved to: ${path.join(SCREENSHOT_DIR, 'report.html')}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    testResults.issues.push({
      type: 'error',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
  }
}

// Run the test
runProductionTest().catch(console.error);