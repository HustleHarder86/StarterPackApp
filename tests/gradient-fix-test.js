const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function runGradientFixTest() {
  console.log('🎨 Starting Gradient Fix Test...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'gradient-fix-screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });
    
    console.log('📸 Capturing current state...');
    
    // 1. Navigate to the app
    await page.goto('https://starter-pack-app.vercel.app/roi-finder.html', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-initial-load.png'),
      fullPage: true 
    });
    
    // Check current gradient status
    const gradientStatus = await page.evaluate(() => {
      const animatedBg = document.getElementById('animated-bg');
      const gradientCSS = document.querySelector('link[href*="gradient-theme.css"]');
      const glassCards = document.querySelectorAll('.glass-card');
      const bgWhiteElements = document.querySelectorAll('.bg-white');
      const bgGrayElements = document.querySelectorAll('.bg-gray-50, .bg-gray-100');
      
      return {
        animatedBgExists: !!animatedBg,
        animatedBgVisible: animatedBg ? window.getComputedStyle(animatedBg).display !== 'none' : false,
        animatedBgZIndex: animatedBg ? window.getComputedStyle(animatedBg).zIndex : null,
        gradientCSSLoaded: !!gradientCSS,
        glassCardsCount: glassCards.length,
        bgWhiteCount: bgWhiteElements.length,
        bgGrayCount: bgGrayElements.length,
        bodyBackground: window.getComputedStyle(document.body).backgroundColor
      };
    });
    
    console.log('\n📊 Current Gradient Status:');
    console.log('- Animated BG exists:', gradientStatus.animatedBgExists);
    console.log('- Animated BG visible:', gradientStatus.animatedBgVisible);
    console.log('- Animated BG z-index:', gradientStatus.animatedBgZIndex);
    console.log('- Gradient CSS loaded:', gradientStatus.gradientCSSLoaded);
    console.log('- Glass cards found:', gradientStatus.glassCardsCount);
    console.log('- Elements with bg-white:', gradientStatus.bgWhiteCount);
    console.log('- Elements with bg-gray:', gradientStatus.bgGrayCount);
    console.log('- Body background:', gradientStatus.bodyBackground);
    
    // 2. Login to see analysis
    console.log('\n🔐 Logging in...');
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'password123');
    await page.click('#login-btn');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-after-login.png'),
      fullPage: true 
    });
    
    // 3. Fill property form with mock data
    console.log('\n🏠 Filling property form...');
    await page.waitForSelector('#property-address', { visible: true });
    
    // Fill form
    await page.type('#property-address', '123 Test Street, Toronto, ON');
    await page.type('#purchase-price', '850000');
    await page.type('#down-payment', '170000');
    await page.type('#interest-rate', '5.5');
    await page.type('#property-tax', '8500');
    await page.type('#insurance', '1200');
    await page.type('#hoa-fees', '300');
    await page.type('#management-fees', '200');
    await page.type('#maintenance', '250');
    await page.type('#vacancy-rate', '5');
    await page.type('#bedrooms', '3');
    await page.type('#bathrooms', '2');
    await page.type('#sqft', '1800');
    await page.type('#expected-rent', '3200');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-form-filled.png'),
      fullPage: true 
    });
    
    // 4. Submit and wait for analysis
    console.log('\n📊 Analyzing property...');
    await page.click('#analyze-btn');
    
    // Wait for analysis to load
    await page.waitForSelector('#analysis-results', { 
      visible: true,
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Take screenshot of analysis results
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-analysis-loaded.png'),
      fullPage: true 
    });
    
    // Check gradient visibility after analysis loads
    const analysisGradientStatus = await page.evaluate(() => {
      const animatedBg = document.getElementById('animated-bg');
      const analysisContainer = document.querySelector('#analysis-results > div');
      
      return {
        animatedBgDisplay: animatedBg ? window.getComputedStyle(animatedBg).display : null,
        animatedBgOpacity: animatedBg ? window.getComputedStyle(animatedBg).opacity : null,
        analysisBackground: analysisContainer ? window.getComputedStyle(analysisContainer).backgroundColor : null,
        hasGlassCards: document.querySelectorAll('.glass-card').length > 0
      };
    });
    
    console.log('\n📊 Gradient Status After Analysis:');
    console.log('- Animated BG display:', analysisGradientStatus.animatedBgDisplay);
    console.log('- Animated BG opacity:', analysisGradientStatus.animatedBgOpacity);
    console.log('- Analysis container bg:', analysisGradientStatus.analysisBackground);
    console.log('- Has glass cards:', analysisGradientStatus.hasGlassCards);
    
    // 5. Check different tabs
    console.log('\n📑 Checking tabs...');
    
    // Check LTR tab
    const ltrTab = await page.$('#ltr-tab');
    if (ltrTab) {
      await ltrTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '05-ltr-tab.png'),
        fullPage: true 
      });
    }
    
    // Check STR tab
    const strTab = await page.$('#str-tab');
    if (strTab) {
      await strTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '06-str-tab.png'),
        fullPage: true 
      });
    }
    
    // 6. Identify specific issues
    console.log('\n🔍 Identifying specific issues...');
    
    const issues = await page.evaluate(() => {
      const problems = [];
      
      // Check for blocking backgrounds
      const blockingElements = document.querySelectorAll('.bg-white, .bg-gray-50, .bg-gray-100');
      blockingElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 100) {
          problems.push({
            type: 'blocking-background',
            class: el.className,
            size: `${rect.width}x${rect.height}`,
            tag: el.tagName
          });
        }
      });
      
      // Check main containers
      const mainContainers = ['#main-content', '#analysis-results', '.min-h-screen'];
      mainContainers.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
          const bg = window.getComputedStyle(el).backgroundColor;
          if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            problems.push({
              type: 'opaque-container',
              selector,
              background: bg
            });
          }
        }
      });
      
      return problems;
    });
    
    console.log('\n❌ Issues Found:');
    issues.forEach(issue => {
      console.log(`- ${issue.type}: ${JSON.stringify(issue)}`);
    });
    
    // Generate comparison HTML
    const comparisonHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Gradient Fix Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .screen { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .screen img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .issues { background: #fee; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .status { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .success { color: green; }
    .error { color: red; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gradient Fix Test Results</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="status">
    <h2>Current Status</h2>
    <ul>
      <li>Animated BG exists: <span class="${gradientStatus.animatedBgExists ? 'success' : 'error'}">${gradientStatus.animatedBgExists}</span></li>
      <li>Gradient CSS loaded: <span class="${gradientStatus.gradientCSSLoaded ? 'success' : 'error'}">${gradientStatus.gradientCSSLoaded}</span></li>
      <li>Glass cards found: <span class="${gradientStatus.glassCardsCount > 0 ? 'success' : 'error'}">${gradientStatus.glassCardsCount}</span></li>
      <li>Blocking backgrounds: <span class="error">${gradientStatus.bgWhiteCount + gradientStatus.bgGrayCount} elements</span></li>
    </ul>
  </div>
  
  <div class="issues">
    <h2>Issues to Fix</h2>
    <ol>
      <li>Gradient background not visible (blocked by opaque containers)</li>
      <li>No glass morphism effects applied to cards</li>
      <li>Missing hero gradient section</li>
      <li>${gradientStatus.bgWhiteCount} elements with bg-white class</li>
      <li>${gradientStatus.bgGrayCount} elements with bg-gray classes</li>
    </ol>
  </div>
  
  <h2>Screenshots</h2>
  <div class="comparison">
    <div class="screen">
      <h3>Initial Load</h3>
      <img src="01-initial-load.png" alt="Initial Load">
    </div>
    <div class="screen">
      <h3>Analysis Results</h3>
      <img src="04-analysis-loaded.png" alt="Analysis Results">
    </div>
  </div>
</body>
</html>
    `;
    
    await fs.writeFile(
      path.join(screenshotsDir, 'test-results.html'),
      comparisonHTML
    );
    
    console.log('\n✅ Test complete! Results saved to:', screenshotsDir);
    console.log('📄 Open test-results.html to view the comparison');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ 
      path: path.join(__dirname, 'error-screenshot.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Run the test
runGradientFixTest().catch(console.error);